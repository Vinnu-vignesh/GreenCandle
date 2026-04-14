import { useEffect, useState, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp } from 'lucide-react';

const SOURCE_COLORS = {
  'Economic Times':    'text-orange-400  bg-orange-500/10  border-orange-500/20',
  'Moneycontrol':      'text-blue-400    bg-blue-500/10    border-blue-500/20',
  'LiveMint':          'text-purple-400  bg-purple-500/10  border-purple-500/20',
  'Business Standard': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

function timeAgo(iso) {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60)   return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
}

function stripHtml(str) {
  return str?.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim() ?? '';
}

export default function NewsPanel() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('http://localhost:8000/api/news');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setArticles(data);
        setLastFetch(new Date());
      } else {
        setError('No articles returned.');
      }
    } catch {
      setError('Cannot reach backend. Start the FastAPI server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    // Refresh every 5 minutes
    const id = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchNews]);

  return (
    <div className="flex flex-col h-full w-full min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#111118] shrink-0">
        <div className="flex items-center gap-2">
          <Newspaper size={13} className="text-blue-400" />
          <span className="text-[11px] font-semibold text-[#9999b0] uppercase tracking-wider">Market News</span>
          {lastFetch && (
            <span className="text-[9px] text-[#33334a] ml-1 flex items-center gap-0.5">
              <Clock size={8} />
              {timeAgo(lastFetch.toISOString())}
            </span>
          )}
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-1 text-[#44445a] hover:text-blue-400 transition-colors disabled:opacity-40"
          title="Refresh news"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Loading skeleton */}
        {loading && articles.length === 0 && (
          <div className="flex flex-col gap-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-1.5">
                <div className="h-2.5 bg-[#131318] rounded w-3/4" />
                <div className="h-2 bg-[#0f0f14] rounded w-full" />
                <div className="h-2 bg-[#0f0f14] rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 text-center">
            <p className="text-red-400 text-[11px]">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Article list */}
        {articles.map((article, i) => {
          const sourceClass = SOURCE_COLORS[article.source] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/20';
          const clean = stripHtml(article.summary);

          return (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="group block px-3 py-2.5 border-b border-[#0d0d12] hover:bg-[#0c0c12] transition-colors"
            >
              {/* Source + time row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${sourceClass}`}>
                  {article.source}
                </span>
                <span className="text-[9px] text-[#33334a] shrink-0">
                  {timeAgo(article.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <p className="text-[11px] font-semibold text-[#ccccdd] group-hover:text-white leading-snug transition-colors line-clamp-2">
                {article.title}
              </p>

              {/* Summary */}
              {clean && (
                <p className="text-[10px] text-[#55556a] mt-1 leading-relaxed line-clamp-2">
                  {clean}
                </p>
              )}

              {/* Read more */}
              <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={9} className="text-blue-500" />
                <span className="text-[9px] text-blue-500">Read full article</span>
              </div>
            </a>
          );
        })}

        {/* Empty footer padding */}
        {articles.length > 0 && (
          <div className="py-3 text-center text-[9px] text-[#22222e]">
            {articles.length} articles • refreshes every 5 min
          </div>
        )}
      </div>
    </div>
  );
}
