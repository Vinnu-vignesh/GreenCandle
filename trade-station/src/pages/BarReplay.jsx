import { useState, useEffect, useRef, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import {
  Play, Pause, SkipForward, SkipBack, RefreshCw,
  ChevronDown, TrendingUp, TrendingDown, CheckCircle, AlertCircle,
  BarChart2, Activity,
  Minus, ArrowRight, ArrowLeftRight,
  AlignCenter, AlignJustify,
  Square, Circle, GitBranch,
  Type, Trash2, MousePointer, Undo2
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import DrawingToolsCanvas from '../components/Chart/DrawingToolsCanvas';

const STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN',
  'BAJFINANCE', 'WIPRO', 'TATAMOTORS', 'AXISBANK', 'NIFTY 50',
];
const INTERVALS = ['1d', '1wk', '5m', '15m'];
const SPEEDS    = [0.5, 1, 2, 5, 10];

// ── Drawing Tool Definitions ──
const TOOL_GROUPS = [
  {
    tools: [{ id: 'cursor', label: 'Cursor / Select', icon: MousePointer }],
  },
  {
    tools: [
      { id: 'line',    label: 'Trend Line',            icon: Minus          },
      { id: 'ray',     label: 'Ray',                   icon: ArrowRight     },
      { id: 'extline', label: 'Extended Line',         icon: ArrowLeftRight },
      { id: 'hline',   label: 'Horizontal Line',       icon: AlignCenter    },
      { id: 'vline',   label: 'Vertical Line',         icon: AlignJustify   },
    ],
  },
  {
    tools: [
      { id: 'rect',    label: 'Rectangle',             icon: Square         },
      { id: 'circle',  label: 'Circle / Ellipse',      icon: Circle         },
    ],
  },
  {
    tools: [
      { id: 'fib',     label: 'Fibonacci Retracement', icon: TrendingDown   },
      { id: 'fibfan',  label: 'Fibonacci Fan',         icon: GitBranch      },
    ],
  },
  {
    tools: [
      { id: 'pitchfork', label: 'Andrews Pitchfork',  icon: GitBranch      },
    ],
  },
  {
    tools: [
      { id: 'text',    label: 'Text Annotation',       icon: Type           },
    ],
  },
];

const FIB_SVG = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5">
    <line x1="1" y1="13" x2="13" y2="1"/>
    <line x1="1" y1="10" x2="13" y2="10" strokeDasharray="2,2"/>
    <line x1="1" y1="7"  x2="13" y2="7"  strokeDasharray="2,2"/>
    <line x1="1" y1="4"  x2="13" y2="4"  strokeDasharray="2,2"/>
  </svg>
);

const PITCHFORK_SVG = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5">
    <line x1="2" y1="7" x2="12" y2="7"/>
    <line x1="7" y1="7" x2="12" y2="2"/>
    <line x1="7" y1="7" x2="12" y2="12"/>
    <circle cx="2" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

/* Detect mobile */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function BarReplay() {
  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const seriesRef     = useRef(null);
  const volumeRef     = useRef(null);
  const timerRef      = useRef(null);
  const allDataRef    = useRef([]);
  const cursorRef     = useRef(0);

  const [symbol,    setSymbol]    = useState('RELIANCE');
  const [tf,        setTf]        = useState('1d');
  const [speed,     setSpeed]     = useState(1);
  const [playing,   setPlaying]   = useState(false);
  const [cursor,    setCursor]    = useState(0);
  const [total,     setTotal]     = useState(0);
  const [loaded,    setLoaded]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [replayPrice, setReplayPrice] = useState(null);

  // Paper trade state
  const [replayBalance,  setReplayBalance]  = useState(100000);
  const [replayOrders,   setReplayOrders]   = useState([]);
  const [replayHoldings, setReplayHoldings] = useState({});
  const [side,    setSide]    = useState('BUY');
  const [qty,     setQty]     = useState(1);
  const [toast,   setToast]   = useState(null);

  // Mobile specifics
  const isMobile = useIsMobile();
  const [tradePanelOpen, setTradePanelOpen] = useState(false);

  // Drawing tools state — persisted per symbol+interval in localStorage
  const [activeTool, setActiveTool] = useState(null);
  const drawingKey = `gs_replay_drawings_${symbol}_${tf}`;

  const [drawings, setDrawings] = useState(() => {
    try {
      const key   = `gs_replay_drawings_RELIANCE_1d`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Re-load drawings when symbol or tf changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(drawingKey);
      setDrawings(saved ? JSON.parse(saved) : []);
    } catch { setDrawings([]); }
  }, [drawingKey]);

  // Save drawings on every change
  useEffect(() => {
    try {
      localStorage.setItem(drawingKey, JSON.stringify(drawings));
    } catch {}
  }, [drawings, drawingKey]);

  // ── Build chart once on mount ──
  useEffect(() => {
    let chart = null;
    let ro    = null;
    const rafId = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;

      chart = createChart(el, {
        layout: {
          background: { type: 'solid', color: '#040406' },
          textColor: '#64648a',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
        },
        grid: {
          vertLines: { color: '#0d0d14', style: 1 },
          horzLines: { color: '#0d0d14', style: 1 },
        },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#0d0d14' },
        timeScale: { borderColor: '#0d0d14', timeVisible: true, secondsVisible: false },
        width:  el.clientWidth  || 800,
        height: el.clientHeight || 500,
      });
      chartRef.current = chart;

      const cs = chart.addCandlestickSeries({
        upColor: '#22c55e', downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      });
      seriesRef.current = cs;

      const vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'volume' });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeRef.current = vol;

      ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        if (chart) chart.applyOptions({ width, height });
      });
      ro.observe(el);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(timerRef.current);
      try { ro?.disconnect();    } catch(_) {}
      try { chart?.remove();     } catch(_) {}
      chartRef.current  = null;
      seriesRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // ── Load data ──
  const loadData = useCallback(async () => {
    let waited = 0;
    while (!chartRef.current && waited < 500) {
      await new Promise(r => setTimeout(r, 50));
      waited += 50;
    }
    if (!chartRef.current || !seriesRef.current) {
      console.warn('Chart not ready yet');
      return;
    }
    setLoading(true);
    setLoaded(false);
    setPlaying(false);
    clearInterval(timerRef.current);
    seriesRef.current?.setData([]);
    volumeRef.current?.setData([]);
    cursorRef.current = 0;
    setCursor(0);

    try {
      const res  = await fetch(`https://greencandle.onrender.com/api/bar-replay/${encodeURIComponent(symbol)}?interval=${tf}`)
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) { setLoading(false); return; }

      allDataRef.current = data;
      setTotal(data.length);
      const first = data[0];
      seriesRef.current.setData([first]);
      volumeRef.current.setData([{ time: first.time, value: first.volume ?? 0, color: 'rgba(59,130,246,0.4)' }]);
      chartRef.current.timeScale().fitContent();
      setReplayPrice(first.close);
      setCursor(1);
      cursorRef.current = 1;
      setLoaded(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [symbol, tf]);

  // ── Step forward ──
  const stepForward = useCallback(() => {
    const data = allDataRef.current;
    const idx  = cursorRef.current;
    if (idx >= data.length) { setPlaying(false); return; }
    const candle = data[idx];
    seriesRef.current.update(candle);
    volumeRef.current.update({
      time: candle.time, value: candle.volume ?? 0,
      color: candle.close >= candle.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    });
    setReplayPrice(candle.close);
    cursorRef.current = idx + 1;
    setCursor(idx + 1);
  }, []);

  // ── Step backward ──
  const stepBack = useCallback(() => {
    const idx = Math.max(1, cursorRef.current - 2);
    const data = allDataRef.current.slice(0, idx + 1);
    seriesRef.current.setData(data);
    volumeRef.current.setData(data.map(d => ({
      time: d.time, value: d.volume ?? 0,
      color: d.close >= d.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    })));
    setReplayPrice(data[data.length - 1]?.close ?? null);
    cursorRef.current = idx + 1;
    setCursor(idx + 1);
  }, []);

  // ── Play / Pause ──
  useEffect(() => {
    clearInterval(timerRef.current);
    if (!playing) return;
    const ms = Math.max(50, 800 / speed);
    timerRef.current = window.setInterval(() => {
      if (cursorRef.current >= allDataRef.current.length) {
        setPlaying(false);
        clearInterval(timerRef.current);
        return;
      }
      stepForward();
    }, ms);
    return () => window.clearInterval(timerRef.current);
  }, [playing, speed, stepForward]);

  // ── Paper trade ──
  const placeOrder = (e) => {
    e.preventDefault();
    if (!replayPrice) { setToast({ ok: false, msg: 'No replay price yet' }); setTimeout(() => setToast(null), 3000); return; }
    const price = replayPrice;
    const total = qty * price;

    if (side === 'BUY') {
      if (replayBalance < total) { setToast({ ok: false, msg: 'Insufficient replay funds' }); setTimeout(() => setToast(null), 3000); return; }
      setReplayBalance(b => b - total);
      setReplayHoldings(h => ({
        ...h,
        [symbol]: {
          qty:      (h[symbol]?.qty ?? 0) + qty,
          avgPrice: h[symbol]
            ? ((h[symbol].avgPrice * h[symbol].qty + price * qty) / (h[symbol].qty + qty))
            : price,
        }
      }));
    } else {
      const held = replayHoldings[symbol]?.qty ?? 0;
      if (held < qty) { setToast({ ok: false, msg: `Only ${held} shares held` }); setTimeout(() => setToast(null), 3000); return; }
      setReplayBalance(b => b + total);
      setReplayHoldings(h => {
        const newQty = h[symbol].qty - qty;
        if (newQty === 0) { const n = { ...h }; delete n[symbol]; return n; }
        return { ...h, [symbol]: { ...h[symbol], qty: newQty } };
      });
    }

    const order = {
      id: Date.now(), side, symbol, qty, price: price.toFixed(2),
      total: total.toFixed(2),
      candle: cursor,
    };
    setReplayOrders(prev => [order, ...prev]);
    setToast({ ok: true, msg: `${side} ${qty}×${symbol} @ ₹${price.toFixed(2)}` });
    setTimeout(() => setToast(null), 3000);
  };

  const resetReplay = () => {
    setReplayBalance(100000);
    setReplayOrders([]);
    setReplayHoldings({});
    loadData();
  };

  const progress = total > 0 ? ((cursor / total) * 100).toFixed(1) : 0;
  const currentCandle = allDataRef.current[cursor - 1];
  const replayHolding = replayHoldings[symbol];
  const replayPnL = replayHolding ? ((replayPrice - replayHolding.avgPrice) * replayHolding.qty) : null;

  // ── Drawing toolbar helpers ──
  const handleUndo = () => setDrawings(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
  const handleClearAll = () => { setDrawings([]); setActiveTool(null); };

  const toolBtn = (tool) => {
    const active = activeTool === tool.id;
    return (
      <button
        key={tool.id}
        title={tool.label}
        onClick={() => setActiveTool(active ? null : tool.id)}
        className={`relative group flex items-center justify-center w-6 h-6 rounded transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
            : 'text-[#55556a] hover:text-white hover:bg-[#1a1a28]'
        }`}
      >
        {tool.id === 'fib'        ? <FIB_SVG />
         : tool.id === 'pitchfork' ? <PITCHFORK_SVG />
         : <tool.icon size={12} />}
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
          {tool.label}
        </span>
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#030303] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2 border-b border-[#111118] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-white">Bar Replay</h1>
          <p className="text-[10px] text-[#44445a] hidden sm:block">Replay historical candles and practice paper trading</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: toggle trade panel */}
          {isMobile && (
            <button
              onClick={() => setTradePanelOpen(v => !v)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                tradePanelOpen
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#0c0c12] border-[#1a1a22] text-[#44445a] hover:text-white'
              }`}
            >
              {tradePanelOpen ? '📈 Chart' : '💰 Trade'}
            </button>
          )}
          <button onClick={resetReplay} className="flex items-center gap-1.5 text-xs text-[#44445a] hover:text-white bg-[#0c0c12] border border-[#1a1a22] px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      <div className={`relative flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>

        {/* ── LEFT: Chart + Controls ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Config bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#111118] shrink-0 flex-wrap overflow-x-auto">
            <select
              value={symbol}
              onChange={e => { setSymbol(e.target.value); setLoaded(false); }}
              className="bg-[#0c0c12] border border-[#1a1a22] text-white text-xs px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 cursor-pointer shrink-0"
            >
              {STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select
              value={tf}
              onChange={e => { setTf(e.target.value); setLoaded(false); }}
              className="bg-[#0c0c12] border border-[#1a1a22] text-white text-xs px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 cursor-pointer shrink-0"
            >
              {INTERVALS.map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
            </select>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Loading...' : 'Load Chart'}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-[#1a1a28] shrink-0" />

            {/* ── Drawing Tools ── */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {TOOL_GROUPS.map((group, gi) => (
                <div key={gi} className="flex items-center gap-0.5">
                  {group.tools.map(tool => toolBtn(tool))}
                  {gi < TOOL_GROUPS.length - 1 && (
                    <div className="w-px h-4 bg-[#22223a] mx-1 shrink-0" />
                  )}
                </div>
              ))}

              <div className="w-px h-4 bg-[#22223a] mx-1 shrink-0" />

              {/* Undo */}
              <button title="Undo (Ctrl+Z)" onClick={handleUndo}
                className="relative group flex items-center justify-center w-6 h-6 rounded text-[#55556a] hover:text-white hover:bg-[#1a1a28] transition-all">
                <Undo2 size={12} />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">Undo</span>
              </button>

              {/* Delete mode */}
              <button title="Delete drawing" onClick={() => setActiveTool(activeTool === 'delete' ? null : 'delete')}
                className={`relative group flex items-center justify-center w-6 h-6 rounded transition-all ${
                  activeTool === 'delete' ? 'bg-red-600 text-white' : 'text-[#55556a] hover:text-red-400 hover:bg-[#1a1a28]'
                }`}>
                <Trash2 size={12} />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">Delete Mode</span>
              </button>

              {drawings.length > 0 && (
                <button onClick={handleClearAll}
                  className="ml-1 px-2 py-0.5 text-[10px] rounded bg-[#1a1a28] border border-[#2a2a38] text-[#aa4444] hover:text-red-400 hover:border-red-500/40 transition-all">
                  Clear All
                </button>
              )}

              {activeTool && activeTool !== 'cursor' && activeTool !== 'delete' && (
                <div className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-[10px] text-blue-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {TOOL_GROUPS.flatMap(g => g.tools).find(t => t.id === activeTool)?.label}
                  <button onClick={() => setActiveTool(null)} className="ml-1 hover:text-white">✕</button>
                </div>
              )}
            </div>

            {loaded && (
              <>
                {/* Divider */}
                <div className="w-px h-5 bg-[#1a1a28] shrink-0" />

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={stepBack} disabled={cursor <= 1} className="p-1.5 text-[#44445a] hover:text-white bg-[#0c0c12] border border-[#1a1a22] rounded-lg transition-colors disabled:opacity-30">
                    <SkipBack size={14} />
                  </button>
                  <button
                    onClick={() => setPlaying(p => !p)}
                    className={`p-1.5 text-white rounded-lg border transition-colors ${playing ? 'bg-amber-600 border-amber-500' : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500'}`}
                  >
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={stepForward} disabled={cursor >= total} className="p-1.5 text-[#44445a] hover:text-white bg-[#0c0c12] border border-[#1a1a22] rounded-lg transition-colors disabled:opacity-30">
                    <SkipForward size={14} />
                  </button>
                </div>

                {/* Speed */}
                <div className="flex items-center gap-1 shrink-0">
                  {SPEEDS.map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-1 text-[11px] rounded transition-colors ${speed === s ? 'bg-blue-600 text-white' : 'text-[#44445a] hover:text-white bg-[#0c0c12] border border-[#1a1a22]'}`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          {loaded && (
            <div className="px-4 py-1.5 border-b border-[#0d0d14] shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-[#111118] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-[#44445a] font-mono whitespace-nowrap">
                  {cursor} / {total}
                </span>
                {replayPrice && (
                  <span className="text-[10px] font-mono text-white">
                    ₹{replayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 relative overflow-hidden">
            {!loaded && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-[#33334a] text-sm">
                Select a stock &amp; interval, then click <strong className="text-blue-500 mx-1">Load Chart</strong>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-[#44445a] text-sm">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                Loading historical data...
              </div>
            )}
            <div ref={containerRef} className="w-full h-full" />

            {/* Drawing overlay */}
            {loaded && (
              <DrawingToolsCanvas
                chartRef={chartRef}
                seriesRef={seriesRef}
                containerRef={containerRef}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                drawings={drawings}
                setDrawings={setDrawings}
              />
            )}
          </div>
        </div>

        {/* ── RIGHT: Paper Trade Panel ── */}
        {/* Desktop: always visible side panel */}
        {/* Mobile: slide-up overlay when tradePanelOpen */}
        <div className={`
          bg-[#07070a] border-[#111118] flex flex-col overflow-hidden
          transition-all duration-300
          ${ isMobile
            ? tradePanelOpen
              ? 'absolute inset-x-0 bottom-0 z-20 h-[65%] rounded-t-2xl border-t shadow-2xl'
              : 'hidden'
            : 'w-72 shrink-0 border-l'
          }
        `}>

          {/* Replay Balance */}
          <div className="px-4 py-3 border-b border-[#111118]">
            <div className="text-[10px] text-[#44445a]">Replay Balance</div>
            <div className="font-mono font-bold text-white text-lg">
              ₹{replayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {replayHolding && (
              <div className="text-[11px] text-[#66667a] mt-1">
                Holding: <span className="text-blue-400">{replayHolding.qty} × {symbol}</span>
                {replayPnL !== null && (
                  <span className={`ml-2 font-semibold ${replayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {replayPnL >= 0 ? '+' : ''}₹{replayPnL.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Order form */}
          <form onSubmit={placeOrder} className="px-4 py-4 border-b border-[#111118] flex flex-col gap-3">
            <div className="flex rounded-lg overflow-hidden border border-[#1a1a22]">
              {['BUY', 'SELL'].map(s => (
                <button key={s} type="button" onClick={() => setSide(s)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors ${
                    side === s
                      ? s === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      : 'bg-[#0c0c10] text-[#44445a] hover:text-white'
                  }`}
                >{s}</button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] text-[#44445a] mb-1">Qty</label>
              <input type="number" min="1" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0c0c10] border border-[#1a1a22] rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-[#44445a]">Price:</span>
              <span className="font-mono text-white">₹{(replayPrice ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#44445a]">Total:</span>
              <span className="font-mono text-white">₹{((replayPrice ?? 0) * qty).toFixed(2)}</span>
            </div>

            <button type="submit" disabled={!loaded || !replayPrice}
              className={`w-full py-2 rounded-lg font-bold text-xs text-white transition-all active:scale-95 disabled:opacity-40 ${
                side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {side === 'BUY' ? '▲ Buy' : '▼ Sell'}
            </button>

            {toast && (
              <div className={`fade-in flex items-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg ${
                toast.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {toast.ok ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                {toast.msg}
              </div>
            )}
          </form>

          {/* Order log */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <h3 className="text-[10px] font-semibold text-[#44445a] uppercase tracking-wider mb-2">Order Log</h3>
            {replayOrders.length === 0 ? (
              <p className="text-[11px] text-[#2a2a35]">No orders yet</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {replayOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-[#0c0c12] rounded-lg px-2.5 py-2 border border-[#141418]">
                    <div>
                      <span className={`text-[10px] font-bold ${o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{o.side}</span>
                      <span className="text-[10px] text-[#8888a0] ml-1">{o.qty}×{o.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-white">₹{o.price}</div>
                      <div className="text-[9px] text-[#44445a]">c#{o.candle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
