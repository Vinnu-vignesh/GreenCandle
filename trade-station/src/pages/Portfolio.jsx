import { useOutletContext } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { TrendingUp, TrendingDown, Clock, RotateCcw, BookOpen, Trash2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const INITIAL_BALANCE = 100000;

export default function Portfolio() {
  const { liveData } = useOutletContext();
  const { balance, holdings, orders, resetPortfolio } = usePortfolio();

  // ── Trade Record Book state ──
  const [trades,       setTrades]       = useState([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [activeTab,    setActiveTab]    = useState('holdings'); // 'holdings' | 'orders' | 'record'

  const fetchTrades = useCallback(async () => {
    setTradesLoading(true);
    try {
      const res  = await fetch('https://greencandle.onrender.com/api/trades?limit=500');
      const data = await res.json();
      setTrades(Array.isArray(data) ? data : []);
    } catch {
      setTrades([]);
    }
    setTradesLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Re-fetch when user switches to record tab
  useEffect(() => { if (activeTab === 'record') fetchTrades(); }, [activeTab, fetchTrades]);

  const clearAllTrades = async () => {
    if (!window.confirm('Clear all trade records? This cannot be undone.')) return;
    await fetch('https://greencandle.onrender.com/api/trades', { method: 'DELETE' });
    setTrades([]);
  };

  // ── Holdings calculations ──
  const holdingsWithPnL = holdings.map(h => {
    const currentPrice = liveData[h.symbol]?.price ?? h.avgPrice;
    const invested     = h.avgPrice * h.qty;
    const current      = currentPrice * h.qty;
    const pnl          = current - invested;
    const pnlPct       = ((pnl / invested) * 100);
    return { ...h, currentPrice, invested, current, pnl, pnlPct };
  });

  const totalInvested  = holdingsWithPnL.reduce((s, h) => s + h.invested, 0);
  const totalCurrent   = holdingsWithPnL.reduce((s, h) => s + h.current, 0);
  const portfolioValue = balance + totalCurrent;
  const overallPnL     = portfolioValue - INITIAL_BALANCE;

  // ── Record book summary stats ──
  const totalTrades    = trades.length;
  const winTrades      = trades.filter(t => t.pl > 0).length;
  const totalRealPnL   = trades.reduce((s, t) => s + t.pl, 0);
  const winRate        = totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : '—';

  const fmt  = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtT = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  const TAB_CLASSES = (t) =>
    `px-4 py-2 text-xs font-semibold rounded-t-lg transition-all ${
      activeTab === t
        ? 'bg-[#07070a] border border-b-0 border-[#111118] text-white'
        : 'text-[#44445a] hover:text-white'
    }`;

  return (
    <div className="h-full flex flex-col bg-[#030303] overflow-hidden">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#111118] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold text-white">Portfolio</h1>
          <p className="text-[10px] text-[#44445a] hidden sm:block">Virtual trading — ₹1,00,000 starting balance</p>
        </div>
        <button
          onClick={() => { if (window.confirm('Reset portfolio? All holdings and orders will be cleared.')) resetPortfolio(); }}
          className="flex items-center gap-1.5 text-xs text-[#55556a] hover:text-red-400 bg-[#0c0c12] border border-[#1a1a22] px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <RotateCcw size={12} /> <span className="hidden sm:inline">Reset Portfolio</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5 space-y-4">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Portfolio Value',  value: `₹${fmt(portfolioValue)}`,     sub: 'Cash + Holdings',            color: 'text-white' },
            { label: 'Cash Available',   value: `₹${fmt(balance)}`,            sub: 'Uninvested',                 color: 'text-blue-400' },
            { label: 'Invested Value',   value: `₹${fmt(totalInvested)}`,      sub: `${holdings.length} positions`, color: 'text-amber-400' },
            {
              label: 'Unrealised P&L',
              value: `${overallPnL >= 0 ? '+' : ''}₹${fmt(Math.abs(overallPnL))}`,
              sub: `${overallPnL >= 0 ? '+' : ''}${((overallPnL / INITIAL_BALANCE) * 100).toFixed(2)}%`,
              color: overallPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            },
          ].map((card, i) => (
            <div key={i} className="bg-[#07070a] border border-[#111118] rounded-xl p-4">
              <div className="text-[10px] text-[#44445a] mb-1 font-medium">{card.label}</div>
              <div className={`font-mono font-bold text-base ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-[#33334a] mt-0.5">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Record Book summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Closed Trades',   value: totalTrades,                                            color: 'text-white' },
            { label: 'Win Rate',        value: `${winRate}%`,                                          color: 'text-blue-400' },
            { label: 'Winners',         value: `${winTrades} / ${totalTrades - winTrades} L`,          color: 'text-emerald-400' },
            {
              label: 'Realised P&L',
              value: totalTrades > 0 ? `${totalRealPnL >= 0 ? '+' : ''}₹${fmt(Math.abs(totalRealPnL))}` : '—',
              color: totalRealPnL >= 0 ? 'text-emerald-400' : 'text-red-400',
            },
          ].map((card, i) => (
            <div key={i} className="bg-[#070710] border border-[#111120] rounded-xl p-4">
              <div className="text-[10px] text-[#44445a] mb-1 font-medium">{card.label}</div>
              <div className={`font-mono font-bold text-base ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex items-end gap-0.5 sm:gap-1 border-b border-[#111118] overflow-x-auto scrollbar-none">
            <button className={TAB_CLASSES('holdings')} onClick={() => setActiveTab('holdings')}>
              <span className="whitespace-nowrap">Holdings ({holdings.length})</span>
            </button>
            <button className={TAB_CLASSES('orders')} onClick={() => setActiveTab('orders')}>
              <span className="whitespace-nowrap">Orders ({orders.length})</span>
            </button>
            <button className={TAB_CLASSES('record')} onClick={() => setActiveTab('record')}>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <BookOpen size={11} /> Record ({totalTrades})
              </span>
            </button>
          </div>

          {/* ── Holdings Tab ── */}
          {activeTab === 'holdings' && (
            <div className="bg-[#07070a] border border-t-0 border-[#111118] rounded-b-xl overflow-hidden">
              {holdingsWithPnL.length === 0 ? (
                <div className="px-5 py-10 text-center text-[#33334a] text-sm">
                  No open positions — place a buy order on the Trade Station
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#111118]">
                        {['Symbol', 'Qty', 'Avg Price', 'CMP', 'Invested', 'Current', 'P&L', 'P&L %'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] text-[#44445a] font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsWithPnL.map(h => (
                        <tr key={h.symbol} className="border-b border-[#0d0d10] hover:bg-[#0c0c12] transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{h.symbol}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">{h.qty}</td>
                          <td className="px-4 py-3 font-mono text-[#8888a0]">₹{fmt(h.avgPrice)}</td>
                          <td className={`px-4 py-3 font-mono font-semibold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ₹{fmt(h.currentPrice)}
                          </td>
                          <td className="px-4 py-3 font-mono text-[#8888a0]">₹{fmt(h.invested)}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">₹{fmt(h.current)}</td>
                          <td className={`px-4 py-3 font-mono font-semibold ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {h.pnl >= 0 ? '+' : ''}₹{fmt(Math.abs(h.pnl))}
                          </td>
                          <td className={`px-4 py-3 font-mono ${h.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className="flex items-center gap-1">
                              {h.pnl >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                              {Math.abs(h.pnlPct).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Order History Tab ── */}
          {activeTab === 'orders' && (
            <div className="bg-[#07070a] border border-t-0 border-[#111118] rounded-b-xl overflow-hidden">
              {orders.length === 0 ? (
                <div className="px-5 py-10 text-center text-[#33334a] text-sm">No orders placed yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#111118]">
                        {['Time', 'Symbol', 'Side', 'Qty', 'Price', 'Total', 'P&L', 'Status'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] text-[#44445a] font-semibold uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} className="border-b border-[#0d0d10] hover:bg-[#0c0c12] transition-colors">
                          <td className="px-4 py-3 text-[#44445a] font-mono">{fmtT(o.time)}</td>
                          <td className="px-4 py-3 font-bold text-white">{o.symbol}</td>
                          <td className={`px-4 py-3 font-bold ${o.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>{o.side}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">{o.qty}</td>
                          <td className="px-4 py-3 font-mono text-[#8888a0]">₹{o.price}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">₹{o.total}</td>
                          <td className={`px-4 py-3 font-mono font-semibold ${
                            o.pl != null ? (o.pl >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-[#44445a]'
                          }`}>
                            {o.pl != null ? `${o.pl >= 0 ? '+' : ''}₹${fmt(Math.abs(o.pl))}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Trade Record Book Tab ── */}
          {activeTab === 'record' && (
            <div className="bg-[#07070a] border border-t-0 border-[#111118] rounded-b-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#111118] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen size={13} className="text-blue-400" />
                  <span className="text-white text-xs font-semibold">Permanent Trade Record Book</span>
                  <span className="text-[10px] text-[#44445a]">Stored in database · survives resets</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={fetchTrades} className="p-1.5 text-[#44445a] hover:text-white hover:bg-[#1a1a22] rounded transition-colors" title="Refresh">
                    <RefreshCw size={12} />
                  </button>
                  {trades.length > 0 && (
                    <button onClick={clearAllTrades} className="flex items-center gap-1 text-[10px] text-[#aa4444] hover:text-red-400 hover:bg-[#1a1a22] px-2 py-1 rounded transition-colors">
                      <Trash2 size={10} /> Clear All
                    </button>
                  )}
                </div>
              </div>

              {tradesLoading ? (
                <div className="px-5 py-10 flex items-center justify-center gap-2 text-[#44445a] text-sm">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Loading records...
                </div>
              ) : trades.length === 0 ? (
                <div className="px-5 py-10 text-center text-[#33334a] text-sm">
                  No closed trades yet.<br />
                  <span className="text-[11px] text-[#22223a]">Trade records appear here automatically when you sell a position.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#111118]">
                        {['#', 'Date/Time', 'Symbol', 'Qty', 'Entry Price', 'Exit Price', 'P&L', 'P&L %', 'Total Value'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[10px] text-[#44445a] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t, idx) => (
                        <tr key={t.id} className="border-b border-[#0d0d10] hover:bg-[#0c0c15] transition-colors">
                          <td className="px-4 py-3 font-mono text-[#33334a]">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono text-[#44445a] whitespace-nowrap">{fmtT(t.time)}</td>
                          <td className="px-4 py-3 font-bold text-white">{t.symbol}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">{t.qty}</td>
                          <td className="px-4 py-3 font-mono text-[#8888a0]">₹{fmt(t.entry_price)}</td>
                          <td className="px-4 py-3 font-mono text-[#ccccdd]">₹{fmt(t.exit_price)}</td>
                          <td className={`px-4 py-3 font-mono font-bold ${t.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {t.pl >= 0 ? '+' : ''}₹{fmt(Math.abs(t.pl))}
                          </td>
                          <td className={`px-4 py-3 font-mono ${t.pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              t.pl >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'
                            }`}>
                              {t.pl >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                              {t.pl >= 0 ? '+' : ''}{Number(t.pl_pct).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[#8888a0]">₹{fmt(t.total_value)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals footer */}
                    <tfoot>
                      <tr className="border-t border-[#1a1a28] bg-[#040408]">
                        <td colSpan={6} className="px-4 py-3 text-[10px] text-[#44445a] font-semibold uppercase">Total ({trades.length} trades)</td>
                        <td className={`px-4 py-3 font-mono font-bold ${totalRealPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {totalRealPnL >= 0 ? '+' : ''}₹{fmt(Math.abs(totalRealPnL))}
                        </td>
                        <td className={`px-4 py-3 text-[10px] font-semibold ${totalRealPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          Win: {winRate}%
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
