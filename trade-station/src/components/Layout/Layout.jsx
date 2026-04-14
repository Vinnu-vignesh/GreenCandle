import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LineChart, Wallet, History, GraduationCap,
  PlayCircle, Settings, Zap, RefreshCw, X, Menu,
  ChevronRight, ChevronLeft, RotateCcw, LogOut
} from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import gcLogo from '../../assets/pics/greencdl.png';
import { useWatchlistWS } from '../../hooks/useWatchlistWS';
import Watchlist from '../Dashboard/Watchlist';
import { useAuth } from '../../context/AuthContext';

/* Indices shown in the top scrolling ticker */
const TICKER_SYMBOLS = [
  'NIFTY 50', 'SENSEX', 'BANKNIFTY',
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ITC',
  'SBIN', 'BAJFINANCE', 'AXISBANK', 'WIPRO',
  'TATAMOTORS', 'MARUTI', 'KOTAKBANK',
];

const NAV_ITEMS = [
  { path: '/',          icon: LineChart,     label: 'Trade Station' },
  { path: '/replay',    icon: PlayCircle,    label: 'Bar Replay'    },
  { path: '/portfolio', icon: Wallet,        label: 'Portfolio'     },
  { path: '/education', icon: GraduationCap, label: 'Education'     },
];

/* ─── Custom hook: detect if viewport is mobile ─── */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Layout() {
  const { balance, resetPortfolio } = usePortfolio();
  const { liveData } = useWatchlistWS();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  /* Desktop: sidebar collapsed/expanded */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /* Mobile: drawer open/closed */
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [activeSymbol, setActiveSymbol] = useState('RELIANCE');

  // Close drawer on route change (mobile)
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  // Close drawer on resize to desktop
  useEffect(() => { if (!isMobile) setDrawerOpen(false); }, [isMobile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const avatarUrl   = user?.photoURL;
  const initials    = (user?.displayName || user?.email || 'U')[0].toUpperCase();
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Trader';

  const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const nifty  = liveData['NIFTY 50'] ?? {};
  const sensex = liveData['SENSEX']   ?? {};

  const IndexPill = ({ label, data }) => {
    const price  = data.price  ?? null;
    const change = data.change ?? 0;
    const up     = change >= 0;
    return (
      <div className="flex items-center gap-2 px-4">
        <span className="text-[11px] font-semibold" style={{color:'#888899'}}>{label}</span>
        {price !== null && (
          <>
            <span className={`text-[12px] font-mono font-bold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
              {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
              {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </span>
          </>
        )}
      </div>
    );
  };

  /* ───────────────────────────────────────────────
     Sidebar inner content (shared by desktop & drawer)
  ─────────────────────────────────────────────── */
  const SidebarContent = ({ expanded }) => (
    <div className="flex flex-col h-full">
      {/* Collapse toggle — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="self-end m-2 p-1 text-[#44445a] hover:text-white hover:bg-[#16161e] rounded transition-colors"
        >
          {expanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
        </button>
      )}

      {/* Mobile drawer header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#141418]">
          <div className="flex items-center gap-2">
            <img src={gcLogo} alt="GreenCandle" className="w-6 h-6 rounded-lg object-contain" />
            <span className="font-bold text-sm text-white">GreenCandle</span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-[#44445a] hover:text-white">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Navigation links */}
      <nav className="flex flex-col gap-0.5 px-1.5 mt-1">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => isMobile && setDrawerOpen(false)}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-[#88889a] hover:text-white hover:bg-[#131318]'
              }`}
              title={!expanded ? label : undefined}
            >
              <Icon size={17} className="shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      {expanded && <div className="mx-3 my-3 border-t border-[#141418]" />}

      {/* Watchlist */}
      {expanded && (
        <div className="flex-1 overflow-hidden px-1.5">
          <Watchlist
            liveData={liveData}
            activeSymbol={activeSymbol}
            onSelectSymbol={(sym) => { setActiveSymbol(sym); if (isMobile) setDrawerOpen(false); }}
            uid={user?.uid}
          />
        </div>
      )}

      {/* Mobile: User section at bottom of drawer */}
      {isMobile && expanded && (
        <div className="border-t border-[#141418] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-[11px] font-bold text-white">{initials}</span>
              }
            </div>
            <span className="text-[12px] text-[#aaaabc] font-medium max-w-[120px] truncate">{displayName}</span>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="p-1.5 text-[#66667a] hover:text-red-400 hover:bg-[#1a1a22] rounded-md transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="bg-[#030303] text-white flex flex-col overflow-hidden"
      style={{ height: '100dvh' }}
    >

      {/* ══════════════ TOP HEADER BAR ══════════════ */}
      <header className="h-12 shrink-0 bg-[#0a0a0b] border-b border-[#1a1a1f] flex items-center justify-between px-3 z-30">

        {/* Left: Hamburger (mobile) or Logo (desktop) */}
        <div className="flex items-center gap-2.5">
          {isMobile ? (
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 text-[#66667a] hover:text-white hover:bg-[#1a1a22] rounded-md transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          ) : null}
          <img src={gcLogo} alt="GreenCandle" className="w-7 h-7 rounded-lg object-contain" />
          <span className="font-bold text-sm tracking-wide text-white">GreenCandle</span>
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" title="Live Feed Active" />
        </div>

        {/* Center: Scrolling Ticker Strip — hidden on mobile */}
        <div className="flex-1 overflow-hidden mx-4 h-full items-center hidden md:flex">
          <div className="overflow-hidden w-full">
            <div className="ticker-track">
              {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => {
                const d = liveData[sym];
                const price  = d?.price  ?? '—';
                const change = d?.change ?? 0;
                const up     = change >= 0;
                return (
                  <div key={i} className="flex items-center gap-1.5 px-4 border-r border-[#1e1e24] text-xs shrink-0">
                    <span className="text-[#8888a0] font-medium">{sym}</span>
                    <span className={`font-mono font-semibold ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {typeof price === 'number' ? fmt(price) : price}
                    </span>
                    <span className={`text-[10px] ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                      {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">

          {/* Connect Upstox */}
          <a
            href="https://greencandle.onrender.com/auth/login"
            target="_blank"
            rel="noreferrer"
            title="Connect Upstox for real-time NSE feed"
            className="flex items-center gap-1.5 text-xs bg-blue-600/80 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors border border-blue-500/30"
          >
            <Zap size={11} />
            <span className="hidden lg:inline">Upstox</span>
          </a>

          {/* Balance — hidden on mobile (shown in bottom bar) */}
          <div className="items-center gap-1.5 hidden sm:flex">
            <div className="text-xs hidden sm:flex flex-col items-end">
              <span className="text-[#555566] leading-none">Virtual Balance</span>
              <span className="font-bold font-mono text-white text-sm leading-tight">
                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={resetPortfolio}
              title="Reset virtual balance to ₹1,00,000"
              className="p-1.5 text-[#66667a] hover:text-amber-400 hover:bg-[#1a1a22] rounded-md transition-colors"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* User avatar — hidden on mobile */}
          <div className="items-center gap-2 pl-3 border-l border-[#1e1e28] hidden sm:flex">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                : <span className="text-[11px] font-bold text-white">{initials}</span>
              }
            </div>
            <span className="text-[12px] text-[#aaaabc] font-medium hidden md:block max-w-[100px] truncate">{displayName}</span>
          </div>

          {/* Sign out — hidden on mobile (in drawer) */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 text-[#66667a] hover:text-red-400 hover:bg-[#1a1a22] rounded-md transition-colors hidden sm:block"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ══════════════ NIFTY & SENSEX FIXED BAR — hidden on mobile ══════════════ */}
      <div className="shrink-0 h-8 bg-[#06060a] border-b border-[#141418] items-center z-20 hidden md:flex">
        <div className="flex items-center divide-x divide-[#1e1e28]">
          <IndexPill label="NIFTY 50" data={nifty} />
          <IndexPill label="SENSEX"   data={sensex} />
        </div>
        <div className="ml-auto mr-4 flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse opacity-60" />
          <span className="text-[9px] text-[#44445a] font-medium uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* ══════════════ BODY: sidebar + main ══════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MOBILE DRAWER OVERLAY ── */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <aside
              className={`fixed top-0 left-0 h-full z-50 w-[260px] bg-[#07070a] border-r border-[#141418] flex flex-col transition-transform duration-250 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
              <SidebarContent expanded={true} />
            </aside>
          </>
        )}

        {/* ── DESKTOP SIDEBAR ── */}
        {!isMobile && (
          <aside
            className={`flex flex-col shrink-0 bg-[#07070a] border-r border-[#141418] transition-all duration-200 z-20 ${
              sidebarOpen ? 'w-[220px]' : 'w-[48px]'
            }`}
          >
            <SidebarContent expanded={sidebarOpen} />
          </aside>
        )}

        {/* ── MAIN CONTENT ── */}
        <main
          className="flex-1 overflow-hidden"
          style={isMobile ? { paddingBottom: 'calc(var(--bottom-nav-h) + var(--safe-bottom))' } : {}}
        >
          <Outlet context={{ activeSymbol, setActiveSymbol, liveData }} />
        </main>
      </div>

      {/* ══════════════ MOBILE BOTTOM NAV BAR ══════════════ */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-md border-t border-[#1a1a1f] flex"
          style={{ height: 'calc(var(--bottom-nav-h) + var(--safe-bottom))', paddingBottom: 'var(--safe-bottom)' }}
        >
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-blue-400' : 'text-[#55556a] hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium leading-none">{label.split(' ')[0]}</span>
              </Link>
            );
          })}
          {/* Balance pill in bottom bar */}
          <div className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[#555566]">
            <span className="text-[10px] leading-none">Balance</span>
            <span className="font-bold font-mono text-white text-[11px] leading-tight">
              ₹{(balance / 1000).toFixed(1)}K
            </span>
          </div>
        </nav>
      )}
    </div>
  );
}
