import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Search, Plus, Star } from 'lucide-react';
import { db } from '../../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const DEFAULT_WATCHLIST = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN', 'BAJFINANCE', 'TATAMOTORS',
];

const ALL_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC', 'SBIN',
  'BAJFINANCE', 'AXISBANK', 'WIPRO', 'TATAMOTORS',
  'MARUTI', 'LT', 'KOTAKBANK', 'HINDUNILVR', 'ADANIPORTS',
  'NIFTY 50', 'SENSEX', 'BANKNIFTY',
];

export default function Watchlist({ liveData, activeSymbol, onSelectSymbol, uid }) {
  const [watchList, setWatchList] = useState(DEFAULT_WATCHLIST);
  const [query,    setQuery]    = useState('');
  const [adding,   setAdding]   = useState(false);

  // Track whether we're receiving a remote Firestore update to avoid write loops
  const isRemote = useRef(false);

  // ── Subscribe to Firestore watchlist for this user ──────────────────────
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid, 'data', 'watchlist');

    const unsub = onSnapshot(ref, (snap) => {
      isRemote.current = true;
      if (snap.exists()) {
        setWatchList(snap.data().symbols ?? DEFAULT_WATCHLIST);
      } else {
        // First login: create default watchlist
        setDoc(ref, { symbols: DEFAULT_WATCHLIST });
      }
      // Reset flag after state update batch
      setTimeout(() => { isRemote.current = false; }, 0);
    });

    return unsub;
  }, [uid]);

  // ── Write to Firestore whenever watchlist changes (skip remote updates) ──
  useEffect(() => {
    if (!uid || isRemote.current) return;
    const ref = doc(db, 'users', uid, 'data', 'watchlist');
    setDoc(ref, { symbols: watchList }).catch(() => {});
  }, [watchList, uid]);

  const filtered = useMemo(() =>
    ALL_STOCKS.filter(s =>
      s.toLowerCase().includes(query.toLowerCase()) && !watchList.includes(s)
    ), [query, watchList]);

  const addStock = (sym) => {
    setWatchList(prev => [...prev, sym]);
    setQuery('');
    setAdding(false);
  };

  const removeStock = (sym, e) => {
    e.stopPropagation();
    setWatchList(prev => prev.filter(s => s !== sym));
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Star size={12} className="text-amber-400" />
          <span className="text-[11px] font-semibold text-[#9999b0] uppercase tracking-wider">Watchlist</span>
        </div>
        <button
          onClick={() => setAdding(v => !v)}
          className="p-0.5 text-[#555570] hover:text-blue-400 transition-colors"
          title="Add stock"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search / Add */}
      {adding && (
        <div className="mb-2 relative fade-in">
          <div className="flex items-center gap-1.5 bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-2 py-1.5">
            <Search size={12} className="text-[#555570] shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search symbol..."
              className="bg-transparent text-xs text-white placeholder-[#44445a] outline-none w-full"
            />
          </div>
          {query.length > 0 && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f14] border border-[#2a2a35] rounded-lg overflow-hidden z-50 shadow-xl">
              {filtered.slice(0, 6).map(sym => (
                <button
                  key={sym}
                  onClick={() => addStock(sym)}
                  className="w-full text-left px-3 py-2 text-xs text-[#ccccdd] hover:bg-[#1a1a25] hover:text-white transition-colors"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist items */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
        {watchList.map((symbol) => {
          const d = liveData[symbol] ?? {};
          const price  = d.price  ?? '—';
          const change = d.change ?? 0;
          const up     = change >= 0;
          const active = symbol === activeSymbol;

          // Derive absolute point change: prevClose = price / (1 + change/100)
          const pts = typeof price === 'number' && change !== 0
            ? price - price / (1 + change / 100)
            : 0;

          return (
            <div
              key={symbol}
              onClick={() => onSelectSymbol(symbol)}
              className={`group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-all ${
                active
                  ? 'bg-blue-600/15 border border-blue-500/25'
                  : 'hover:bg-[#111118] border border-transparent'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-semibold truncate ${active ? 'text-blue-300' : 'text-[#dddde8]'}`}>
                  {symbol}
                </span>
                <span className={`text-[10px] flex items-center gap-0.5 mt-0.5 ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                  {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {Math.abs(change).toFixed(2)}%
                  {pts !== 0 && (
                    <span className="ml-0.5 opacity-75">
                      ({up ? '+' : ''}{pts.toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-mono font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                  {typeof price === 'number'
                    ? price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : price}
                </span>
                <button
                  onClick={(e) => removeStock(symbol, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#44445a] hover:text-red-400 transition-all ml-1"
                >
                  <span className="text-[10px] leading-none">✕</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}