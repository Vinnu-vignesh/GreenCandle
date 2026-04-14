import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'wss://greencandle.onrender.com/ws/watchlist';

/**
 * Shared hook for live watchlist prices via WebSocket.
 * Returns: { liveData: { SYMBOL: { price, change, sector } } }
 */
export function useWatchlistWS() {
  const [liveData, setLiveData] = useState({});
  const wsRef    = useRef(null);
  const retryRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveData(data);
      } catch (_) {}
    };

    ws.onclose = () => {
      // Auto-reconnect after 3 s
      retryRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { liveData };
}
