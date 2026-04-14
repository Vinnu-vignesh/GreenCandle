import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import {
  BarChart2, TrendingUp, Activity,
  Minus, ArrowRight, ArrowLeftRight,
  AlignCenter, AlignJustify,
  Square, Circle, GitBranch,
  TrendingDown, Type, Trash2,
  MousePointer, Undo2
} from 'lucide-react';
import DrawingToolsCanvas from './DrawingToolsCanvas';

const TIMEFRAMES = [
  { label: '1m',  value: '1m'  },
  { label: '5m',  value: '5m'  },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1D',  value: '1d'  },
  { label: '1W',  value: '1wk' },
  { label: '1M',  value: '1mo' },
];

const CHART_TYPES = [
  { label: 'Candle', icon: BarChart2  },
  { label: 'Line',   icon: TrendingUp },
  { label: 'Area',   icon: Activity   },
];

// ── Drawing Tool definitions ──────────────────────────────────────────────────
const TOOL_GROUPS = [
  {
    label: 'Select',
    tools: [
      { id: 'cursor',   label: 'Cursor / Select',       icon: MousePointer },
    ],
  },
  {
    label: 'Lines',
    tools: [
      { id: 'line',     label: 'Trend Line',             icon: Minus             },
      { id: 'ray',      label: 'Ray',                    icon: ArrowRight        },
      { id: 'extline',  label: 'Extended Line',          icon: ArrowLeftRight    },
      { id: 'hline',    label: 'Horizontal Line',        icon: AlignCenter       },
      { id: 'vline',    label: 'Vertical Line',          icon: AlignJustify      },
    ],
  },
  {
    label: 'Shapes',
    tools: [
      { id: 'rect',     label: 'Rectangle',              icon: Square            },
      { id: 'circle',   label: 'Circle / Ellipse',       icon: Circle            },
    ],
  },
  {
    label: 'Fibonacci',
    tools: [
      { id: 'fib',      label: 'Fibonacci Retracement',  icon: TrendingDown      },
      { id: 'fibfan',   label: 'Fibonacci Fan',          icon: GitBranch         },
    ],
  },
  {
    label: 'Advanced',
    tools: [
      { id: 'pitchfork',label: 'Andrews Pitchfork',      icon: GitBranch         },
    ],
  },
  {
    label: 'Annotation',
    tools: [
      { id: 'text',     label: 'Text Annotation',        icon: Type              },
    ],
  },
];

const FIB_SVG = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5">
    <line x1="1" y1="13" x2="13" y2="1"/>
    <line x1="1" y1="10" x2="13" y2="10" strokeDasharray="2,2"/>
    <line x1="1" y1="7"  x2="13" y2="7"  strokeDasharray="2,2"/>
    <line x1="1" y1="4"  x2="13" y2="4"  strokeDasharray="2,2"/>
  </svg>
);

const PITCHFORK_SVG = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" fill="none" strokeWidth="1.5">
    <line x1="2" y1="7" x2="12" y2="7"/>
    <line x1="7" y1="7" x2="12" y2="2"/>
    <line x1="7" y1="7" x2="12" y2="12"/>
    <circle cx="2" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

export default function TradingChart({ symbol = 'RELIANCE', liveData = {} }) {
  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const seriesRef     = useRef(null);
  const volumeRef     = useRef(null);
  const wsRef         = useRef(null);

  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState(null);
  const [timeframe,  setTimeframe]  = useState('1d');
  const [chartType,  setChartType]  = useState('Candle');
  const [ohlc,       setOhlc]       = useState(null);

  // Drawing tools state — persisted per symbol in localStorage
  const [activeTool, setActiveTool] = useState(null);
  const [drawings,   setDrawings]   = useState(() => {
    try {
      const saved = localStorage.getItem(`gs_drawings_${symbol}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Re-load drawings when symbol changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gs_drawings_${symbol}`);
      setDrawings(saved ? JSON.parse(saved) : []);
    } catch { setDrawings([]); }
  }, [symbol]);

  // Save drawings to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(`gs_drawings_${symbol}`, JSON.stringify(drawings));
    } catch {}
  }, [drawings, symbol]);

  // ── Build / rebuild chart ──
  useEffect(() => {
    let chart = null;
    let ws    = null;
    let ro    = null;
    let rafId = null;
    let destroyed = false;

    if (!containerRef.current) return;

    if (chartRef.current) { try { chartRef.current.remove(); } catch(_){} }
    if (wsRef.current)    { try { wsRef.current.close();   } catch(_){} }
    chartRef.current  = null;
    seriesRef.current = null;
    volumeRef.current = null;
    wsRef.current     = null;

    setIsLoading(true);
    setError(null);

    rafId = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el || destroyed) return;

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
        crosshair: {
          mode: 1,
          vertLine: { color: '#3b3b55', width: 1, style: 1 },
          horzLine: { color: '#3b3b55', width: 1, style: 1, labelBackgroundColor: '#1a1a2e' },
        },
        rightPriceScale: { borderColor: '#0d0d14' },
        timeScale: { borderColor: '#0d0d14', timeVisible: true, secondsVisible: false },
        width:  el.clientWidth  || 600,
        height: el.clientHeight || 400,
        // Disable panning when a drawing tool is active (handled via pointer-events on canvas)
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale:  { mouseWheel: true, pinch: true },
      });

      chartRef.current = chart;

      let mainSeries;
      if (chartType === 'Candle') {
        mainSeries = chart.addCandlestickSeries({
          upColor: '#22c55e', downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#22c55e', wickDownColor: '#ef4444',
        });
      } else if (chartType === 'Line') {
        mainSeries = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
      } else {
        mainSeries = chart.addAreaSeries({
          topColor:    'rgba(59,130,246,0.35)',
          bottomColor: 'rgba(59,130,246,0.02)',
          lineColor:   '#3b82f6', lineWidth: 2,
        });
      }
      seriesRef.current = mainSeries;

      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volumeRef.current = volSeries;

      fetch(`http://localhost:8000/api/historical/${encodeURIComponent(symbol)}?interval=${timeframe}`)
        .then(r => r.json())
        .then(rawData => {
          if (destroyed) return;
          if (!Array.isArray(rawData) || rawData.length === 0) {
            setError('No data — start backend or check ticker');
            setIsLoading(false);
            return;
          }
          // Sort ascending by time so X-axis reads 9:15 AM → 3:30 PM (left → right)
          const data = [...rawData].sort((a, b) => {
            const ta = typeof a.time === 'number' ? a.time : new Date(a.time).getTime();
            const tb = typeof b.time === 'number' ? b.time : new Date(b.time).getTime();
            return ta - tb;
          });
          const chartData = chartType === 'Candle'
            ? data
            : data.map(d => ({ time: d.time, value: d.close }));
          mainSeries.setData(chartData);
          volSeries.setData(data.map(d => ({
            time: d.time, value: d.volume ?? 0,
            color: d.close >= d.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
          })));
          chart.timeScale().fitContent();
          setOhlc(data[data.length - 1]);
          setIsLoading(false);
        })
        .catch(() => {
          if (!destroyed) {
            setError('Backend offline — start the FastAPI server');
            setIsLoading(false);
          }
        });

      try {
        ws = new WebSocket(`ws://localhost:8000/ws/live/${encodeURIComponent(symbol)}?interval=${timeframe}`);
        wsRef.current = ws;
        ws.onmessage = (event) => {
          if (destroyed) return;
          try {
            const tick = JSON.parse(event.data);
            if (chartType === 'Candle') { mainSeries.update(tick); }
            else { mainSeries.update({ time: tick.time, value: tick.close }); }
            setOhlc(tick);
          } catch (_) {}
        };
      } catch (_) {}

      chart.subscribeCrosshairMove((param) => {
        if (destroyed || !param.seriesData?.size) return;
        const d = param.seriesData.get(mainSeries);
        if (d) setOhlc(d);
      });

      ro = new ResizeObserver(entries => {
        if (destroyed || !chart) return;
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
      });
      ro.observe(el);
    });

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      try { ro?.disconnect(); } catch(_) {}
      try { ws?.close();      } catch(_) {}
      try { chart?.remove();  } catch(_) {}
      chartRef.current  = null;
      seriesRef.current = null;
      volumeRef.current = null;
      wsRef.current     = null;
    };
  }, [symbol, timeframe, chartType]);

  const livePrice = liveData[symbol]?.price;
  const liveChg   = liveData[symbol]?.change ?? 0;
  const priceUp   = liveChg >= 0;

  const handleUndo = () => setDrawings(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
  const handleClearAll = () => { setDrawings([]); setActiveTool(null); };

  const toolBtn = (tool) => {
    const active = activeTool === tool.id;
    const IconComponent = tool.id === 'fib' ? null
      : tool.id === 'pitchfork' ? null
      : tool.icon;

    return (
      <button
        key={tool.id}
        title={tool.label}
        onClick={() => setActiveTool(active ? null : tool.id)}
        className={`relative group flex items-center justify-center w-7 h-7 rounded transition-all ${
          active
            ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]'
            : 'text-[#55556a] hover:text-white hover:bg-[#1a1a28]'
        }`}
      >
        {tool.id === 'fib'       ? <FIB_SVG /> 
         : tool.id === 'pitchfork' ? <PITCHFORK_SVG />
         : <IconComponent size={13} />}

        {/* Tooltip */}
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
          {tool.label}
        </span>
      </button>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#040406]">

      {/* ── Info bar ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#0d0d14] shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white">{symbol}</span>
          {livePrice && (
            <span className={`text-lg font-mono font-bold ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          )}
          {livePrice && (
            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${priceUp ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {priceUp ? '▲' : '▼'} {Math.abs(liveChg).toFixed(2)}%
            </span>
          )}
        </div>
        {ohlc && (
          <div className="flex items-center gap-3 text-[11px] text-[#55556a]">
            <span>O <span className="text-[#aaaabc]">{ohlc.open?.toFixed(2)}</span></span>
            <span>H <span className="text-emerald-500">{ohlc.high?.toFixed(2)}</span></span>
            <span>L <span className="text-red-500">{ohlc.low?.toFixed(2)}</span></span>
            <span>C <span className="text-[#aaaabc]">{(ohlc.close ?? ohlc.value)?.toFixed(2)}</span></span>
          </div>
        )}
      </div>

      {/* ── Toolbar Row: Timeframes + Chart Type + Drawing Tools ── */}
      <div className="flex items-center px-3 py-1.5 border-b border-[#0d0d14] shrink-0 gap-2 overflow-x-auto scrollbar-none">

        {/* Timeframe buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all ${
                timeframe === tf.value
                  ? 'bg-blue-600 text-white'
                  : 'text-[#55556a] hover:text-white hover:bg-[#111118]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#1a1a28] shrink-0" />

        {/* Chart type */}
        <div className="flex items-center gap-0.5 shrink-0">
          {CHART_TYPES.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setChartType(label)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded transition-all ${
                chartType === label
                  ? 'bg-[#1a1a25] text-blue-400 border border-blue-500/30'
                  : 'text-[#44445a] hover:text-white'
              }`}
              title={label}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#1a1a28] shrink-0" />

        {/* ── Drawing Tools — all shrink-0 so they never wrap ── */}
        <div className="flex items-center gap-0.5 shrink-0">
          {TOOL_GROUPS.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5 shrink-0">
              {group.tools.map(tool => toolBtn(tool))}
              {gi < TOOL_GROUPS.length - 1 && (
                <div className="w-px h-4 bg-[#22223a] mx-1 shrink-0" />
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="w-px h-5 bg-[#1a1a28] mx-1 shrink-0" />

          {/* Undo */}
          <button
            title="Undo last drawing (Ctrl+Z)"
            onClick={handleUndo}
            className="relative group flex items-center justify-center w-7 h-7 rounded text-[#55556a] hover:text-white hover:bg-[#1a1a28] transition-all shrink-0"
          >
            <Undo2 size={13} />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              Undo (Ctrl+Z)
            </span>
          </button>

          {/* Delete mode */}
          <button
            title="Delete drawing"
            onClick={() => setActiveTool(activeTool === 'delete' ? null : 'delete')}
            className={`relative group flex items-center justify-center w-7 h-7 rounded transition-all shrink-0 ${
              activeTool === 'delete'
                ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'text-[#55556a] hover:text-red-400 hover:bg-[#1a1a28]'
            }`}
          >
            <Trash2 size={13} />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 whitespace-nowrap bg-[#0d0d18] border border-[#2a2a38] text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              Delete Mode
            </span>
          </button>

          {/* Clear All */}
          {drawings.length > 0 && (
            <button
              title="Clear all drawings"
              onClick={handleClearAll}
              className="ml-1 px-2 py-1 text-[10px] rounded bg-[#1a1a28] border border-[#2a2a38] text-[#aa4444] hover:text-red-400 hover:border-red-500/40 transition-all"
            >
              Clear All
            </button>
          )}

          {/* Active tool indicator */}
          {activeTool && activeTool !== 'cursor' && activeTool !== 'delete' && (
            <div className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 text-[10px] text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {TOOL_GROUPS.flatMap(g => g.tools).find(t => t.id === activeTool)?.label}
              <button onClick={() => setActiveTool(null)} className="ml-1 hover:text-white">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart Canvas ── */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#040406]/80 text-[#44445a] text-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading {symbol}...
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center text-red-400 text-sm">
            {error}
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />

        {/* Drawing canvas overlay — only mount when chart+series are ready */}
        {!isLoading && !error && (
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
  );
}