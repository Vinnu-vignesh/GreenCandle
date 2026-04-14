import { useState, useEffect } from 'react';

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
import {
  BookOpen, TrendingUp, BarChart2, Shield, Award,
  ChevronRight, CheckCircle, XCircle, RefreshCw,
  ExternalLink, Layers, Activity, DollarSign, Brain,
} from 'lucide-react';

// ── Zerodha Varsity modules with real chapter links ──────────────────────────
const VARSITY_MODULES = [
  {
    id: 'intro',
    title: 'Stock Markets',
    subtitle: 'Introduction to Stock Markets',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
    badge: 'Beginner',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/introduction-to-stock-markets/',
    chapters: [
      { n: 1,  title: 'The Need to Invest',                           url: 'https://zerodha.com/varsity/chapter/the-need-to-invest/' },
      { n: 2,  title: 'Regulators, the Guardians of Capital Markets', url: 'https://zerodha.com/varsity/chapter/regulators/' },
      { n: 3,  title: 'Market Intermediaries Explained',              url: 'https://zerodha.com/varsity/chapter/financial-intermediaries/' },
      { n: 4,  title: 'The IPO Markets (Part 1)',                     url: 'https://zerodha.com/varsity/chapter/the-ipo-markets-part-1/' },
      { n: 5,  title: 'The IPO Markets (Part 2)',                     url: 'https://zerodha.com/varsity/chapter/the-ipo-markets-part-2/' },
      { n: 6,  title: 'The Stock Markets',                            url: 'https://zerodha.com/varsity/chapter/the-stock-markets/' },
      { n: 7,  title: 'Stock Market Index: Sensex, Nifty & How They Work', url: 'https://zerodha.com/varsity/chapter/the-stock-markets-index/' },
      { n: 8,  title: 'Commonly Used Jargons',                        url: 'https://zerodha.com/varsity/chapter/commonly-used-jargons/' },
      { n: 9,  title: 'The Trading Terminal',                         url: 'https://zerodha.com/varsity/chapter/the-trading-terminal/' },
      { n: 10, title: 'Clearing and Settlement Process',              url: 'https://zerodha.com/varsity/chapter/clearing-and-settlement-process/' },
      { n: 11, title: 'Corporate Actions & Impact on Stock Prices',   url: 'https://zerodha.com/varsity/chapter/five-corporate-actions-and-its-impact-on-stock-prices/' },
      { n: 12, title: 'Key Events and Their Impact on Markets',       url: 'https://zerodha.com/varsity/chapter/key-events-and-their-impact-on-markets/' },
      { n: 13, title: 'Getting Started',                              url: 'https://zerodha.com/varsity/chapter/getting-started/' },
      { n: 14, title: 'Supplementary: Rights, OFS, FPO',             url: 'https://zerodha.com/varsity/chapter/supplementary-note-ipo-ofs-fpo/' },
      { n: 15, title: 'Supplementary: The 20 Market Depth',          url: 'https://zerodha.com/varsity/chapter/supplementary-note-the-20-market-depth/' },
    ],
  },
  {
    id: 'ta',
    title: 'Technical Analysis',
    subtitle: 'Charts, Patterns & Indicators',
    icon: BarChart2,
    color: 'from-purple-500 to-violet-600',
    badge: 'Intermediate',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/technical-analysis/',
    chapters: [
      { n: 1,  title: 'Background',                          url: 'https://zerodha.com/varsity/chapter/background/' },
      { n: 2,  title: 'Introducing Technical Analysis',      url: 'https://zerodha.com/varsity/chapter/introducing-technical-analysis/' },
      { n: 3,  title: 'The Chart Types',                     url: 'https://zerodha.com/varsity/chapter/chart-types/' },
      { n: 4,  title: 'Getting Started with Candlesticks',   url: 'https://zerodha.com/varsity/chapter/getting-started-candlesticks/' },
      { n: 5,  title: 'Single Candlestick Patterns (Part 1)',url: 'https://zerodha.com/varsity/chapter/single-candlestick-patterns-part-1/' },
      { n: 6,  title: 'Single Candlestick Patterns (Part 2)',url: 'https://zerodha.com/varsity/chapter/single-candlestick-patterns-part-2/' },
      { n: 7,  title: 'Single Candlestick Patterns (Part 3)',url: 'https://zerodha.com/varsity/chapter/single-candlestick-patterns-part-3/' },
      { n: 8,  title: 'Multiple Candlestick Patterns (Part 1)', url: 'https://zerodha.com/varsity/chapter/multiple-candlestick-patterns-part-1/' },
      { n: 9,  title: 'Multiple Candlestick Patterns (Part 2)', url: 'https://zerodha.com/varsity/chapter/multiple-candlestick-patterns-part-2/' },
      { n: 10, title: 'Multiple Candlestick Patterns (Part 3)', url: 'https://zerodha.com/varsity/chapter/multiple-candlestick-patterns-part-3/' },
      { n: 11, title: 'Support and Resistance',              url: 'https://zerodha.com/varsity/chapter/support-resistance/' },
      { n: 12, title: 'Volumes',                             url: 'https://zerodha.com/varsity/chapter/volumes/' },
      { n: 13, title: 'Moving Averages',                     url: 'https://zerodha.com/varsity/chapter/moving-averages/' },
      { n: 14, title: 'Indicators Part 1 — RSI',             url: 'https://zerodha.com/varsity/chapter/indicators-part-1/' },
      { n: 15, title: 'Indicators Part 2 — MACD & Bollinger',url: 'https://zerodha.com/varsity/chapter/indicators-part-2/' },
      { n: 16, title: 'The Fibonacci Retracements',          url: 'https://zerodha.com/varsity/chapter/fibonacci-retracements/' },
      { n: 17, title: 'The Dow Theory (Part 1)',             url: 'https://zerodha.com/varsity/chapter/dow-theory-part-1/' },
      { n: 18, title: 'The Dow Theory (Part 2)',             url: 'https://zerodha.com/varsity/chapter/dow-theory-part-2/' },
      { n: 19, title: 'The Finale – Getting Started',        url: 'https://zerodha.com/varsity/chapter/finale-helping-get-started/' },
      { n: 20, title: 'Other Indicators (ADX etc.)',         url: 'https://zerodha.com/varsity/chapter/supplementary-notes-1/' },
      { n: 21, title: 'Interesting Features on TradingView', url: 'https://zerodha.com/varsity/chapter/interesting-features-on-tradingview/' },
      { n: 22, title: 'The Central Pivot Range',             url: 'https://zerodha.com/varsity/chapter/the-central-pivot-range/' },
    ],
  },
  {
    id: 'fa',
    title: 'Fundamental Analysis',
    subtitle: 'Company Financials & Valuation',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-600',
    badge: 'Intermediate',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/fundamental-analysis/',
    chapters: [
      { n: 1,  title: 'Introduction to Fundamental Analysis',  url: 'https://zerodha.com/varsity/chapter/introduction-fundamental-analysis/' },
      { n: 2,  title: 'Mindset of an Investor',                url: 'https://zerodha.com/varsity/chapter/mindset-of-an-investor/' },
      { n: 3,  title: 'How to Read the Annual Report',         url: 'https://zerodha.com/varsity/chapter/how-to-read-the-annual-report-of-a-company/' },
      { n: 4,  title: 'Understanding the P&L Statement',       url: 'https://zerodha.com/varsity/chapter/the-profit-and-loss-statement/' },
      { n: 5,  title: 'The Balance Sheet',                     url: 'https://zerodha.com/varsity/chapter/the-balance-sheet/' },
      { n: 6,  title: 'The Cash Flow Statement',               url: 'https://zerodha.com/varsity/chapter/the-cash-flow-statement/' },
      { n: 7,  title: 'Financial Ratios (Part 1)',              url: 'https://zerodha.com/varsity/chapter/financial-ratios/' },
      { n: 8,  title: 'Financial Ratios (Part 2)',              url: 'https://zerodha.com/varsity/chapter/financial-ratios-part-2/' },
      { n: 9,  title: 'The Investment Due Diligence',           url: 'https://zerodha.com/varsity/chapter/the-investment-due-diligence/' },
      { n: 10, title: 'Equity Research (Part 1)',               url: 'https://zerodha.com/varsity/chapter/equity-research-part-1/' },
      { n: 11, title: 'Equity Research (Part 2)',               url: 'https://zerodha.com/varsity/chapter/equity-research-part-2/' },
      { n: 12, title: 'DCF Primer',                             url: 'https://zerodha.com/varsity/chapter/dcf-primer/' },
      { n: 13, title: 'DCF Analysis',                           url: 'https://zerodha.com/varsity/chapter/equity-research-dcf/' },
      { n: 14, title: 'Price Multiples — Relative Valuation',   url: 'https://zerodha.com/varsity/chapter/price-multiples/' },
      { n: 15, title: 'The Finale',                             url: 'https://zerodha.com/varsity/chapter/the-finale/' },
    ],
  },
  {
    id: 'futures',
    title: 'Futures Trading',
    subtitle: 'Leverage, Margins & Hedging',
    icon: Activity,
    color: 'from-orange-500 to-red-500',
    badge: 'Advanced',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/futures-trading/',
    chapters: [
      { n: 1,  title: 'Background – Forwards Market',     url: 'https://zerodha.com/varsity/chapter/background-forwards-market/' },
      { n: 2,  title: 'Introducing Futures Contract',     url: 'https://zerodha.com/varsity/chapter/introducing-futures-contract/' },
      { n: 3,  title: 'The Futures Trade',                url: 'https://zerodha.com/varsity/chapter/futures-trade/' },
      { n: 4,  title: 'Leverage & Payoff',                url: 'https://zerodha.com/varsity/chapter/leverage-payoff/' },
      { n: 5,  title: 'Margin & M2M',                     url: 'https://zerodha.com/varsity/chapter/margin-m2m/' },
      { n: 6,  title: 'Margin Calculator (Part 1)',        url: 'https://zerodha.com/varsity/chapter/margin-calculator-part-1/' },
      { n: 7,  title: 'Margin Calculator (Part 2)',        url: 'https://zerodha.com/varsity/chapter/margin-calculator-part-2/' },
      { n: 8,  title: 'All About Shorting',               url: 'https://zerodha.com/varsity/chapter/shorting/' },
      { n: 9,  title: 'The Nifty Futures',                url: 'https://zerodha.com/varsity/chapter/nifty-futures/' },
      { n: 10, title: 'The Futures Pricing',              url: 'https://zerodha.com/varsity/chapter/futures-pricing/' },
      { n: 11, title: 'Hedging with Futures',             url: 'https://zerodha.com/varsity/chapter/hedging-futures/' },
      { n: 12, title: 'Open Interest',                    url: 'https://zerodha.com/varsity/chapter/open-interest/' },
      { n: 13, title: 'Quick Note on Physical Settlement',url: 'https://zerodha.com/varsity/chapter/quick-note-on-physical-settlement/' },
    ],
  },
  {
    id: 'options',
    title: 'Options Theory',
    subtitle: 'Calls, Puts & The Greeks',
    icon: Layers,
    color: 'from-pink-500 to-rose-600',
    badge: 'Advanced',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/option-theory/',
    chapters: [
      { n: 1,  title: 'Call Option Basics',                url: 'https://zerodha.com/varsity/chapter/call-option-basics/' },
      { n: 2,  title: 'Basic Option Jargons',              url: 'https://zerodha.com/varsity/chapter/basic-option-jargons/' },
      { n: 3,  title: 'Buying a Call Option',              url: 'https://zerodha.com/varsity/chapter/buying-a-call-option/' },
      { n: 4,  title: 'Selling/Writing a Call Option',     url: 'https://zerodha.com/varsity/chapter/sellingwriting-a-call-option/' },
      { n: 5,  title: 'The Put Option Buying',             url: 'https://zerodha.com/varsity/chapter/the-put-option-buying/' },
      { n: 6,  title: 'The Put Option Selling',            url: 'https://zerodha.com/varsity/chapter/the-put-option-selling/' },
      { n: 7,  title: 'Summarizing Call & Put Options',    url: 'https://zerodha.com/varsity/chapter/summarizing-call-put-options/' },
      { n: 8,  title: 'Moneyness of an Option Contract',   url: 'https://zerodha.com/varsity/chapter/moneyness-of-an-option-contract/' },
      { n: 9,  title: 'The Option Greeks — Delta (Part 1)',url: 'https://zerodha.com/varsity/chapter/the-option-greeks-delta-part-1/' },
      { n: 10, title: 'Delta (Part 2)',                    url: 'https://zerodha.com/varsity/chapter/delta-part-2/' },
      { n: 11, title: 'Delta (Part 3)',                    url: 'https://zerodha.com/varsity/chapter/delta-part-3/' },
      { n: 12, title: 'Gamma (Part 1)',                    url: 'https://zerodha.com/varsity/chapter/gamma-part-1/' },
      { n: 13, title: 'Gamma (Part 2)',                    url: 'https://zerodha.com/varsity/chapter/gamma-part-2/' },
      { n: 14, title: 'Theta — Time Decay',                url: 'https://zerodha.com/varsity/chapter/theta/' },
      { n: 15, title: 'Volatility Basics',                 url: 'https://zerodha.com/varsity/chapter/understanding-volatility-part-1/' },
      { n: 16, title: 'Volatility Calculation (Historical)',url: 'https://zerodha.com/varsity/chapter/volatility-calculation-historical/' },
      { n: 17, title: 'Volatility & Normal Distribution',  url: 'https://zerodha.com/varsity/chapter/volatility-normal-distribution/' },
      { n: 18, title: 'Volatility Applications',           url: 'https://zerodha.com/varsity/chapter/volatility-applications/' },
      { n: 19, title: 'Vega',                              url: 'https://zerodha.com/varsity/chapter/vega/' },
      { n: 20, title: 'Greek Interactions',                url: 'https://zerodha.com/varsity/chapter/greek-interactions/' },
      { n: 21, title: 'Greek Calculator',                  url: 'https://zerodha.com/varsity/chapter/greek-calculator/' },
      { n: 22, title: 'Re-introducing Call & Put Options', url: 'https://zerodha.com/varsity/chapter/re-introducing-call-put-options/' },
      { n: 23, title: 'Case Studies – Wrapping it All Up', url: 'https://zerodha.com/varsity/chapter/case-studies-wrapping-it-all-up/' },
      { n: 24, title: 'Quick Note on Physical Settlement', url: 'https://zerodha.com/varsity/chapter/quick-note-on-physical-settlement-2/' },
      { n: 25, title: 'Options M2M and P&L Calculation',  url: 'https://zerodha.com/varsity/chapter/options-m2m-and-pl/' },
    ],
  },
  {
    id: 'option-strategies',
    title: 'Option Strategies',
    subtitle: 'Spreads, Straddles & More',
    icon: DollarSign,
    color: 'from-cyan-500 to-blue-600',
    badge: 'Advanced',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/option-strategies/',
    chapters: [
      { n: 1,  title: 'Orientation',                url: 'https://zerodha.com/varsity/chapter/orientation/' },
      { n: 2,  title: 'Bull Call Spread',           url: 'https://zerodha.com/varsity/chapter/bull-call-spread/' },
      { n: 3,  title: 'Bull Put Spread',            url: 'https://zerodha.com/varsity/chapter/bull-put-spread/' },
      { n: 4,  title: 'Call Ratio Back Spread',     url: 'https://zerodha.com/varsity/chapter/call-ratio-back-spread/' },
      { n: 5,  title: 'Bear Call Ladder',           url: 'https://zerodha.com/varsity/chapter/bear-call-ladder/' },
      { n: 6,  title: 'Synthetic Long & Arbitrage', url: 'https://zerodha.com/varsity/chapter/synthetic-long-arbitrage/' },
      { n: 7,  title: 'Bear Put Spread',            url: 'https://zerodha.com/varsity/chapter/bear-put-spread/' },
      { n: 8,  title: 'Bear Call Spread',           url: 'https://zerodha.com/varsity/chapter/bear-call-spread/' },
      { n: 9,  title: 'Put Ratio Back Spread',      url: 'https://zerodha.com/varsity/chapter/put-ratio-back-spread/' },
      { n: 10, title: 'Bear Put Ladder',            url: 'https://zerodha.com/varsity/chapter/bear-put-ladder/' },
      { n: 11, title: 'Synthetic Short & Arbitrage',url: 'https://zerodha.com/varsity/chapter/synthetic-short-arbitrage/' },
      { n: 12, title: 'Long & Short Straddle',      url: 'https://zerodha.com/varsity/chapter/long-short-straddle/' },
      { n: 13, title: 'Long & Short Strangle',      url: 'https://zerodha.com/varsity/chapter/long-short-strangle/' },
      { n: 14, title: 'Max Pain & PCR ratio',       url: 'https://zerodha.com/varsity/chapter/max-pain-pcr-ratio/' },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Management',
    subtitle: 'Trading Systems & Psychology',
    icon: Shield,
    color: 'from-rose-500 to-red-600',
    badge: 'Intermediate',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/risk-management/',
    chapters: [
      { n: 1,  title: 'Overview and Orientation',                url: 'https://zerodha.com/varsity/chapter/overview-and-orientation/' },
      { n: 2,  title: 'Variance and Standard Deviation (Part 1)',url: 'https://zerodha.com/varsity/chapter/variance-standard-deviation/' },
      { n: 3,  title: 'Variance and Standard Deviation (Part 2)',url: 'https://zerodha.com/varsity/chapter/variance-and-standard-deviation-part-ii/' },
      { n: 4,  title: 'Normal Distribution',                     url: 'https://zerodha.com/varsity/chapter/normal-distribution/' },
      { n: 5,  title: 'Confidence Interval',                     url: 'https://zerodha.com/varsity/chapter/confidence-interval/' },
      { n: 6,  title: 'Risk (Part 1)',                           url: 'https://zerodha.com/varsity/chapter/risk/' },
      { n: 7,  title: 'Risk (Part 2)',                           url: 'https://zerodha.com/varsity/chapter/risk-part-ii/' },
      { n: 8,  title: 'Position Sizing',                         url: 'https://zerodha.com/varsity/chapter/position-sizing/' },
      { n: 9,  title: 'Trading Biases',                          url: 'https://zerodha.com/varsity/chapter/trading-biases/' },
      { n: 10, title: 'Trading Rules',                           url: 'https://zerodha.com/varsity/chapter/trading-rules/' },
      { n: 11, title: 'Kelly\'s Criterion',                      url: 'https://zerodha.com/varsity/chapter/kellys-criterion/' },
    ],
  },
  {
    id: 'psychology',
    title: 'Markets & Taxation',
    subtitle: 'Personal Finance & Tax',
    icon: Brain,
    color: 'from-violet-500 to-purple-700',
    badge: 'Beginner',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    moduleUrl: 'https://zerodha.com/varsity/module/markets-and-taxation/',
    chapters: [
      { n: 1,  title: 'Overview of Taxation',                 url: 'https://zerodha.com/varsity/chapter/overview-of-taxation/' },
      { n: 2,  title: 'Basics of Taxation',                   url: 'https://zerodha.com/varsity/chapter/major-types-of-tax/' },
      { n: 3,  title: 'Classifying Your Market Activity',     url: 'https://zerodha.com/varsity/chapter/classifying-your-market-activity/' },
      { n: 4,  title: 'Taxation for Investors',               url: 'https://zerodha.com/varsity/chapter/taxation-for-investors/' },
      { n: 5,  title: 'Taxation for Traders (Part 1)',        url: 'https://zerodha.com/varsity/chapter/taxation-for-traders-part-1/' },
      { n: 6,  title: 'Taxation for Traders (Part 2)',        url: 'https://zerodha.com/varsity/chapter/taxation-for-traders-part-2/' },
      { n: 7,  title: 'Turnover, Balance Sheet & P&L',        url: 'https://zerodha.com/varsity/chapter/turnover-balance-sheet/' },
      { n: 8,  title: 'ITR Forms & Filing',                   url: 'https://zerodha.com/varsity/chapter/itr-forms-the-filing-process/' },
      { n: 9,  title: 'Advance Tax',                          url: 'https://zerodha.com/varsity/chapter/advance-tax/' },
    ],
  },
];

// ── Existing quiz data kept intact ───────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: 'What does "NIFTY 50" represent?', options: ['50 best stocks world-wide', 'Top 50 stocks on NSE by market cap', '50 most traded stocks on BSE', 'None of the above'], answer: 1 },
  { q: 'An RSI value above 70 typically indicates:', options: ['Oversold conditions', 'Strong uptrend', 'Overbought conditions', 'Low volatility'], answer: 2 },
  { q: 'What is a "Stop-Loss" order used for?', options: ['To maximize profits', 'To limit losses by auto-selling at a set price', 'To buy at a lower price', 'To hedge using options'], answer: 1 },
  { q: 'Which ratio compares a stock\'s price to its earnings?', options: ['Debt-to-Equity', 'Current Ratio', 'P/E Ratio', 'ROE'], answer: 2 },
  { q: 'What does the "1% rule" in risk management mean?', options: ['Always invest 1% of salary', "Don't let any position grow beyond 1%", "Never risk more than 1% of capital on a single trade", '1% daily gain target'], answer: 2 },
  { q: 'What is a "Golden Cross" in technical analysis?', options: ['Price hits an all-time high', '50 SMA crosses above 200 SMA', 'RSI crosses above 50', 'Volume spikes 2x average'], answer: 1 },
  { q: 'Which Greek measures an option\'s sensitivity to time decay?', options: ['Delta', 'Gamma', 'Theta', 'Vega'], answer: 2 },
  { q: 'What is "Open Interest" in futures/options?', options: ['Total traded volume today', 'Total outstanding contracts not yet settled', 'The bid-ask spread', 'Overnight positions held by FIIs'], answer: 1 },
];

export default function Education() {
  const isMobile = useIsMobile();
  const [mobileModuleOpen, setMobileModuleOpen] = useState(false);
  const [activeModule, setActiveModule] = useState('intro');
  const [quizStarted,  setQuizStarted]  = useState(false);
  const [quizIdx,      setQuizIdx]      = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizDone,     setQuizDone]     = useState(false);
  const [view,         setView]         = useState('modules'); // 'modules' | 'quiz'

  const mod = VARSITY_MODULES.find(m => m.id === activeModule);

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === QUIZ_QUESTIONS[quizIdx].answer) setCorrectCount(c => c + 1);
  };
  const nextQ = () => {
    if (quizIdx + 1 >= QUIZ_QUESTIONS.length) setQuizDone(true);
    else { setQuizIdx(i => i + 1); setSelected(null); }
  };
  const resetQuiz = () => { setQuizIdx(0); setSelected(null); setCorrectCount(0); setQuizDone(false); setQuizStarted(false); };

  return (
    <div className="h-full flex flex-col bg-[#030303] overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-3 border-b border-[#111118] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="text-amber-400" size={18} />
            Finance Education
          </h1>
          <p className="text-[11px] text-[#44445a]">
            Powered by&nbsp;
            <a href="https://zerodha.com/varsity/modules/" target="_blank" rel="noreferrer"
               className="text-blue-400 hover:text-blue-300 transition-colors">
              Zerodha Varsity ↗
            </a>
            &nbsp;— click any chapter to read the full lesson
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('modules')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${view === 'modules' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0c0c12] border-[#1a1a22] text-[#77779a] hover:text-white'}`}>
            📚 Modules
          </button>
          <button onClick={() => setView('quiz')}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${view === 'quiz' ? 'bg-amber-600/80 border-amber-500 text-white' : 'bg-[#0c0c12] border-[#1a1a22] text-[#77779a] hover:text-white'}`}>
            🧠 Quiz
          </button>
        </div>
      </div>

      {view === 'quiz' ? (

        /* ── QUIZ VIEW ── */
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-bold text-white text-base mb-1">Knowledge Quiz</h2>
            <p className="text-[12px] text-[#44445a] mb-6">Test your understanding — {QUIZ_QUESTIONS.length} questions</p>

            {!quizStarted ? (
              <button onClick={() => setQuizStarted(true)}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors">
                Start Quiz ({QUIZ_QUESTIONS.length} Questions)
              </button>
            ) : quizDone ? (
              <div className="text-center fade-in">
                <div className="text-6xl mb-4">{correctCount >= 7 ? '🏆' : correctCount >= 5 ? '👍' : '📚'}</div>
                <div className="text-2xl font-bold text-white mb-1">{correctCount} / {QUIZ_QUESTIONS.length} Correct</div>
                <div className="text-[#55556a] mb-6">{correctCount === QUIZ_QUESTIONS.length ? 'Perfect! You\'re a trading pro!' : correctCount >= 5 ? 'Great job! Keep learning.' : 'Keep studying — you\'ll get there!'}</div>
                <button onClick={resetQuiz} className="flex items-center gap-2 mx-auto px-4 py-2 bg-[#0c0c12] border border-[#1a1a22] text-white rounded-lg text-sm hover:bg-[#111118] transition-colors">
                  <RefreshCw size={14} /> Retake Quiz
                </button>
              </div>
            ) : (
              <div className="fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-1.5 bg-[#111118] rounded-full">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(quizIdx / QUIZ_QUESTIONS.length) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-[#44445a]">{quizIdx + 1} / {QUIZ_QUESTIONS.length}</span>
                </div>
                <div className="edu-card p-6 mb-4">
                  <p className="font-semibold text-white text-sm mb-5">{QUIZ_QUESTIONS[quizIdx].q}</p>
                  <div className="flex flex-col gap-2.5">
                    {QUIZ_QUESTIONS[quizIdx].options.map((opt, i) => {
                      const isCorrect = i === QUIZ_QUESTIONS[quizIdx].answer;
                      const isSelected = i === selected;
                      return (
                        <button key={i} onClick={() => handleAnswer(i)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                            selected === null ? 'bg-[#0c0c12] border-[#1e1e2a] text-[#ccccdd] hover:border-blue-500 hover:text-white'
                            : isCorrect ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : isSelected ? 'bg-red-500/10 border-red-500/40 text-red-300'
                            : 'bg-[#0c0c12] border-[#1e1e2a] text-[#44445a]'}`}>
                          <span className="flex items-center gap-2">
                            {selected !== null && isCorrect && <CheckCircle size={14} className="text-emerald-400 shrink-0" />}
                            {selected !== null && isSelected && !isCorrect && <XCircle size={14} className="text-red-400 shrink-0" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selected !== null && (
                  <button onClick={nextQ} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-colors fade-in">
                    {quizIdx + 1 >= QUIZ_QUESTIONS.length ? 'See Results' : 'Next Question →'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      ) : (

        /* ── MODULES VIEW ── */
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">

          {/* ── MOBILE: Horizontal scrollable module chip row ── */}
          {isMobile && !mobileModuleOpen && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="overflow-x-auto scrollbar-none px-3 py-2 border-b border-[#111118] flex gap-2 shrink-0">
                {VARSITY_MODULES.map(m => {
                  const Icon = m.icon;
                  const active = m.id === activeModule;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setActiveModule(m.id); setMobileModuleOpen(true); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shrink-0 transition-all ${
                        active
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                          : 'bg-[#0c0c12] border-[#1e1e28] text-[#77779a] hover:text-white'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center bg-gradient-to-br ${m.color}`}>
                        <Icon size={8} className="text-white" />
                      </div>
                      {m.title}
                    </button>
                  );
                })}
                <button
                  onClick={() => setView('quiz')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border shrink-0 bg-[#0c0c12] border-[#1e1e28] text-amber-400 hover:text-amber-300"
                >
                  🧠 Quiz
                </button>
              </div>
              {/* Prompt to pick a module */}
              <div className="flex-1 flex items-center justify-center text-[#33334a] text-sm">
                ← Tap a module to view chapters
              </div>
            </div>
          )}

          {/* ── MOBILE: Chapter detail view (back bar + chapter list together) ── */}
          {isMobile && mobileModuleOpen && mod && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Back bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#111118] shrink-0">
                <button
                  onClick={() => setMobileModuleOpen(false)}
                  className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold"
                >
                  ← Modules
                </button>
                <a href={mod.moduleUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded-lg transition-colors">
                  <ExternalLink size={10} /> Open on Varsity
                </a>
              </div>
              {/* Module header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#111118] shrink-0">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shrink-0`}>
                  <mod.icon size={16} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-white text-sm">{mod.title}</h2>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${mod.badgeColor}`}>{mod.badge}</span>
                  </div>
                  <p className="text-[10px] text-[#55556a]">{mod.subtitle} · {mod.chapters.length} chapters</p>
                </div>
              </div>
              {/* Chapter list */}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="flex flex-col gap-0.5">
                  {mod.chapters.map(ch => (
                    <a
                      key={ch.n}
                      href={ch.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-[#0c0c12] hover:border-[#1a1a22] transition-all"
                    >
                      <span className="w-6 h-6 rounded-md bg-[#0f0f16] border border-[#1a1a25] flex items-center justify-center text-[10px] font-bold text-[#44445a] group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors shrink-0">
                        {ch.n}
                      </span>
                      <span className="flex-1 text-[12px] text-[#aaaabc] group-hover:text-white transition-colors">
                        {ch.title}
                      </span>
                      <ExternalLink size={11} className="text-[#22222e] group-hover:text-blue-400 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DESKTOP: Left sidebar — module list ── */}
          {!isMobile && (
          <div className="w-48 shrink-0 border-r border-[#111118] py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
            {VARSITY_MODULES.map(m => {
              const Icon = m.icon;
              const active = m.id === activeModule;
              return (
                <button key={m.id} onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                    active ? 'bg-[#0f0f16] text-white border border-[#1e1e2a]' : 'text-[#55556a] hover:text-white hover:bg-[#0d0d12]'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 bg-gradient-to-br ${m.color}`}>
                    <Icon size={10} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold truncate">{m.title}</div>
                    <div className="text-[9px] text-[#33334a] truncate">{m.chapters.length} chapters</div>
                  </div>
                </button>
              );
            })}
            <div className="my-2 border-t border-[#111118]" />
            <button onClick={() => setView('quiz')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-[11px] font-medium text-[#55556a] hover:text-amber-400 hover:bg-[#0d0d12] transition-all">
              <span>🧠</span> Take a Quiz
            </button>
          </div>
          )}

          {/* Desktop: Right panel — chapter list */}
          {!isMobile && mod && (
            <div className="flex-1 overflow-y-auto px-5 py-5">

              {/* Module header */}
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shrink-0`}>
                    <mod.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="font-bold text-white text-base">{mod.title}</h2>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${mod.badgeColor}`}>{mod.badge}</span>
                    </div>
                    <p className="text-[11px] text-[#55556a]">{mod.subtitle} · {mod.chapters.length} chapters</p>
                  </div>
                </div>
                <a href={mod.moduleUrl} target="_blank" rel="noreferrer"
                  className="shrink-0 flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 rounded-lg transition-colors">
                  <ExternalLink size={11} />
                  Open on Varsity
                </a>
              </div>

              {/* Chapter list */}
              <div className="flex flex-col gap-1">
                {mod.chapters.map(ch => (
                  <a
                    key={ch.n}
                    href={ch.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-[#0c0c12] hover:border-[#1a1a22] transition-all"
                  >
                    {/* Chapter number */}
                    <span className="w-6 h-6 rounded-md bg-[#0f0f16] border border-[#1a1a25] flex items-center justify-center text-[10px] font-bold text-[#44445a] group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors shrink-0">
                      {ch.n}
                    </span>
                    {/* Title */}
                    <span className="flex-1 text-[12px] text-[#aaaabc] group-hover:text-white transition-colors">
                      {ch.title}
                    </span>
                    {/* Arrow */}
                    <ExternalLink size={11} className="text-[#22222e] group-hover:text-blue-400 transition-colors shrink-0" />
                  </a>
                ))}
              </div>

              {/* Footer note */}
              <div className="mt-6 px-3 py-3 rounded-xl bg-[#06060a] border border-[#111118]">
                <p className="text-[10px] text-[#33334a] text-center">
                  Content sourced from&nbsp;
                  <a href="https://zerodha.com/varsity/" target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400">
                    Zerodha Varsity
                  </a>
                  &nbsp;— India's largest free financial education platform.<br />
                  All chapters open directly on Varsity in a new tab.
                </p>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
