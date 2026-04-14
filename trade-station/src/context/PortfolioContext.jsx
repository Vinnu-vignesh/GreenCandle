import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

const INITIAL_BALANCE = 100000;

function round2(n) { return Math.round(n * 100) / 100; }

// ── Save a completed trade to the backend DB ──
async function saveTradeRecord(record) {
  try {
    await fetch('http://localhost:8000/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch (_) {}
}

export function PortfolioProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [balance,  setBalance]  = useState(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState([]);
  const [orders,   setOrders]   = useState([]);

  // Flag: prevents writing to Firestore before the initial load finishes
  const loadedRef = useRef(false);

  // ── Load portfolio from Firestore when user changes ──────────────────────
  useEffect(() => {
    if (!uid) {
      loadedRef.current = false;
      setBalance(INITIAL_BALANCE);
      setHoldings([]);
      setOrders([]);
      return;
    }

    // Mark as not loaded synchronously — prevents premature writes
    loadedRef.current = false;
    const ref = doc(db, 'users', uid, 'data', 'portfolio');

    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setBalance(d.balance   ?? INITIAL_BALANCE);
          setHoldings(d.holdings ?? []);
          setOrders(d.orders     ?? []);
        }
        // Mark loaded AFTER state setters are queued
        setTimeout(() => { loadedRef.current = true; }, 0);
      })
      .catch(() => {
        setTimeout(() => { loadedRef.current = true; }, 0);
      });
  }, [uid]);

  // ── Persist to Firestore whenever state changes (only after initial load) ─
  useEffect(() => {
    if (!uid || !loadedRef.current) return;
    const ref = doc(db, 'users', uid, 'data', 'portfolio');
    setDoc(ref, { balance, holdings, orders }).catch(() => {});
  }, [balance, holdings, orders, uid]);

  // ── Auto-reset if balance goes negative ──────────────────────────────────
  useEffect(() => {
    if (balance < 0) {
      setBalance(INITIAL_BALANCE);
      setHoldings([]);
      setOrders([]);
    }
  }, [balance]);

  // ── Trade execution ───────────────────────────────────────────────────────
  const executeTrade = useCallback((side, symbol, quantity, price) => {
    const totalValue = quantity * price;

    if (side === 'BUY') {
      if (balance < totalValue) {
        return { success: false, message: 'Insufficient virtual funds!' };
      }
      setBalance(prev => prev - totalValue);

      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === symbol);
        if (existing) {
          const newQty = existing.qty + quantity;
          const newAvg = ((existing.avgPrice * existing.qty) + (price * quantity)) / newQty;
          return prev.map(h =>
            h.symbol === symbol ? { ...h, qty: newQty, avgPrice: round2(newAvg) } : h
          );
        }
        return [...prev, { symbol, qty: quantity, avgPrice: round2(price), entryTime: new Date().toISOString() }];
      });

      setOrders(prev => [{
        id: Date.now(), time: new Date().toISOString(),
        side, symbol, qty: quantity, price: round2(price), total: round2(totalValue), status: 'EXECUTED'
      }, ...prev]);

      return { success: true, message: `Bought ${quantity} × ${symbol} @ ₹${price.toFixed(2)}` };
    }

    if (side === 'SELL') {
      const holding = holdings.find(h => h.symbol === symbol);
      if (!holding || holding.qty < quantity) {
        return { success: false, message: `You only hold ${holding?.qty ?? 0} shares of ${symbol}` };
      }

      setBalance(prev => prev + totalValue);

      const entryPrice = holding.avgPrice;
      const pl         = round2((price - entryPrice) * quantity);
      const plPct      = round2(((price - entryPrice) / entryPrice) * 100);

      saveTradeRecord({
        symbol, side: 'SELL', qty: quantity,
        entry_price: entryPrice, exit_price: round2(price),
        pl, pl_pct: plPct, total_value: round2(totalValue),
        time: new Date().toISOString(),
      });

      setHoldings(prev => {
        const existing = prev.find(h => h.symbol === symbol);
        if (!existing) return prev;
        const newQty = existing.qty - quantity;
        if (newQty === 0) return prev.filter(h => h.symbol !== symbol);
        return prev.map(h => h.symbol === symbol ? { ...h, qty: newQty } : h);
      });

      setOrders(prev => [{
        id: Date.now(), time: new Date().toISOString(),
        side, symbol, qty: quantity, price: round2(price), total: round2(totalValue),
        status: 'EXECUTED', pl, plPct,
      }, ...prev]);

      return { success: true, message: `Sold ${quantity} × ${symbol} @ ₹${price.toFixed(2)} | P&L: ₹${pl}` };
    }
  }, [balance, holdings]);

  // ── Manual reset ──────────────────────────────────────────────────────────
  const resetPortfolio = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    setHoldings([]);
    setOrders([]);
  }, []);

  return (
    <PortfolioContext.Provider value={{ balance, holdings, orders, executeTrade, resetPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);