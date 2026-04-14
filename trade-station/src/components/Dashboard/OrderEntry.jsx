import { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { CheckCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function OrderEntry({ symbol = 'RELIANCE', liveData = {} }) {
  const { balance, holdings, executeTrade } = usePortfolio();
  const [side,     setSide]     = useState('BUY');
  const [type,     setType]     = useState('MARKET');
  const [qty,      setQty]      = useState(1);
  const [limitPx,  setLimitPx]  = useState('');
  const [toast,    setToast]    = useState(null); // { ok, msg }

  const livePrice = liveData[symbol]?.price ?? null;
  const liveChg   = liveData[symbol]?.change ?? 0;
  const priceUp   = liveChg >= 0;

  // Auto-fill limit price when symbol changes
  useEffect(() => {
    if (livePrice) setLimitPx(livePrice.toFixed(2));
  }, [symbol, livePrice]);

  const execPrice = type === 'MARKET'
    ? (livePrice ?? 0)
    : parseFloat(limitPx) || 0;

  const estTotal = qty * execPrice;
  const holding  = holdings.find(h => h.symbol === symbol);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (execPrice === 0) {
      setToast({ ok: false, msg: 'Price not available yet' });
      clearToast();
      return;
    }
    const result = executeTrade(side, symbol, qty, execPrice);
    setToast({ ok: result.success, msg: result.message });
    clearToast();
  };

  const clearToast = () => setTimeout(() => setToast(null), 3500);

  return (
    <div className="flex flex-col h-full text-sm">

      {/* Symbol header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#131318]">
        <div>
          <div className="text-xs text-[#55556a] font-medium">Order Entry</div>
          <div className="font-bold text-white text-base">{symbol}</div>
        </div>
        {livePrice && (
          <div className={`text-right ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
            <div className="font-mono font-bold text-base">
              ₹{livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] flex items-center justify-end gap-0.5">
              {priceUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(liveChg).toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* BUY / SELL toggle */}
      <div className="flex rounded-lg overflow-hidden border border-[#1a1a22] mb-3">
        {['BUY', 'SELL'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={`flex-1 py-2 text-xs font-bold transition-colors ${
              side === s
                ? s === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                : 'bg-[#0c0c10] text-[#44445a] hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Market / Limit */}
      <div className="flex gap-4 mb-3 text-xs">
        {['MARKET', 'LIMIT'].map(t => (
          <label key={t} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              checked={type === t}
              onChange={() => setType(t)}
              className="accent-blue-500 w-3 h-3"
            />
            <span className={type === t ? 'text-white' : 'text-[#44445a]'}>{t}</span>
          </label>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        {/* Qty */}
        <div>
          <label className="block text-[11px] text-[#55556a] mb-1">Quantity</label>
          <input
            type="number" min="1" value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-[#0c0c10] border border-[#1a1a22] rounded-lg px-3 py-2
                       text-white text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Limit Price */}
        {type === 'LIMIT' && (
          <div className="fade-in">
            <label className="block text-[11px] text-[#55556a] mb-1">Limit Price (₹)</label>
            <input
              type="number" step="0.05" value={limitPx}
              onChange={e => setLimitPx(e.target.value)}
              className="w-full bg-[#0c0c10] border border-[#1a1a22] rounded-lg px-3 py-2
                         text-white text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* Available / Holdings info */}
        <div className="flex justify-between text-[11px] text-[#44445a]">
          <span>Available: <span className="text-[#aaaabc] font-mono">₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span></span>
          {holding && (
            <span>Holding: <span className="text-blue-400 font-mono">{holding.qty} @ ₹{holding.avgPrice}</span></span>
          )}
        </div>

        {/* Estimated Total */}
        <div className="border-t border-[#131318] pt-3 flex justify-between items-center">
          <span className="text-[11px] text-[#55556a]">Est. Total</span>
          <span className="font-mono font-semibold text-white">
            ₹{estTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-95 ${
            side === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
              : 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
          }`}
        >
          {side === 'BUY' ? '▲ Place Buy Order' : '▼ Place Sell Order'}
        </button>
      </form>

      {/* Toast notification */}
      {toast && (
        <div className={`fade-in mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          toast.ok
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {toast.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}