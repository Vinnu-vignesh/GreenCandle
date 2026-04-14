from fastapi import FastAPI, WebSocket
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import requests
import feedparser
import os
import asyncio
import sqlite3
from datetime import datetime
from threading import Thread
from pydantic import BaseModel
from typing import Optional
try:
    import upstox_client
    UPSTOX_AVAILABLE = True
except ImportError:
    UPSTOX_AVAILABLE = False
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ── SQLite trade record database ──
DB_PATH = os.path.join(os.path.dirname(__file__), 'trades.db')

def init_db():
    con = sqlite3.connect(DB_PATH)
    con.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol      TEXT    NOT NULL,
            side        TEXT    NOT NULL,
            qty         REAL    NOT NULL,
            entry_price REAL    NOT NULL,
            exit_price  REAL    NOT NULL,
            pl          REAL    NOT NULL,
            pl_pct      REAL    NOT NULL,
            total_value REAL    NOT NULL,
            time        TEXT    NOT NULL
        )
    ''')
    con.commit()
    con.close()

init_db()

class TradeRecord(BaseModel):
    symbol:      str
    side:        str
    qty:         float
    entry_price: float
    exit_price:  float
    pl:          float
    pl_pct:      float
    total_value: float
    time:        str

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://green-candle-git-main-vinnus-projects-da853887.vercel.app/"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend running"}

UPSTOX_ACCESS_TOKEN = None

LIVE_PRICES = {
    "NIFTY 50":     {"price": 24500.00, "change": 0.0, "key": "NSE_INDEX|Nifty 50",        "sector": "Index"},
    "SENSEX":       {"price": 80000.00, "change": 0.0, "key": "BSE_INDEX|SENSEX",           "sector": "Index"},
    "BANKNIFTY":    {"price": 52000.00, "change": 0.0, "key": "NSE_INDEX|Nifty Bank",       "sector": "Index"},
    "RELIANCE":     {"price": 2950.45,  "change": 1.25, "key": "NSE_EQ|INE002A01018",       "sector": "Energy"},
    "TCS":          {"price": 3980.00,  "change": -0.45,"key": "NSE_EQ|INE467B01029",       "sector": "IT"},
    "HDFCBANK":     {"price": 1640.20,  "change": 0.80, "key": "NSE_EQ|INE040A01034",       "sector": "Banking"},
    "INFY":         {"price": 1450.10,  "change": -1.10,"key": "NSE_EQ|INE009A01021",       "sector": "IT"},
    "ITC":          {"price": 430.50,   "change": 0.35, "key": "NSE_EQ|INE154A01025",       "sector": "FMCG"},
    "SBIN":         {"price": 760.00,   "change": 2.10, "key": "NSE_EQ|INE062A01020",       "sector": "Banking"},
    "BAJFINANCE":   {"price": 7200.00,  "change": 0.90, "key": "NSE_EQ|INE296A01024",       "sector": "Finance"},
    "AXISBANK":     {"price": 1120.50,  "change": -0.30,"key": "NSE_EQ|INE238A01034",       "sector": "Banking"},
    "WIPRO":        {"price": 560.00,   "change": 0.55, "key": "NSE_EQ|INE075A01022",       "sector": "IT"},
    "TATAMOTORS":   {"price": 980.00,   "change": 1.80, "key": "NSE_EQ|INE155A01022",       "sector": "Auto"},
    "MARUTI":       {"price": 12800.00, "change": -0.20,"key": "NSE_EQ|INE585B01010",       "sector": "Auto"},
    "LT":           {"price": 3700.00,  "change": 0.65, "key": "NSE_EQ|INE018A01030",       "sector": "Infra"},
    "KOTAKBANK":    {"price": 1820.00,  "change": -0.75,"key": "NSE_EQ|INE237A01028",       "sector": "Banking"},
    "HINDUNILVR":   {"price": 2450.00,  "change": 0.40, "key": "NSE_EQ|INE030A01027",       "sector": "FMCG"},
    "ADANIPORTS":   {"price": 1380.00,  "change": 2.30, "key": "NSE_EQ|INE742F01042",       "sector": "Infra"},
}

KEY_TO_SYMBOL = {v["key"]: k for k, v in LIVE_PRICES.items()}


# --- YFINANCE TICKER MAP ---
YF_TICKER_MAP = {}
for sym in LIVE_PRICES:
    if sym == "NIFTY 50":    YF_TICKER_MAP[sym] = "^NSEI"
    elif sym == "SENSEX":    YF_TICKER_MAP[sym] = "^BSESN"
    elif sym == "BANKNIFTY": YF_TICKER_MAP[sym] = "^NSEBANK"
    else:                    YF_TICKER_MAP[sym] = f"{sym}.NS"


def seed_prices_from_yfinance():
    """Fetch latest intraday price + today's change% using 1m data for accuracy."""
    print("[GreenStock] Refreshing prices from yfinance (intraday)...")
    for symbol, yf_ticker in YF_TICKER_MAP.items():
        try:
            ticker = yf.Ticker(yf_ticker)

            # Intraday 1m data for accurate current price and today's change
            intra = ticker.history(period="1d", interval="1m")
            if not intra.empty:
                current_price = round(float(intra["Close"].iloc[-1]), 2)
                open_price    = round(float(intra["Open"].iloc[0]),  2)
                if current_price > 0 and open_price > 0:
                    change_pct = round(((current_price - open_price) / open_price) * 100, 2)
                    LIVE_PRICES[symbol]["price"]  = current_price
                    LIVE_PRICES[symbol]["change"] = change_pct
                    continue   # got intraday data, skip daily fallback

            # Fallback: daily data (after market close or for indices)
            daily = ticker.history(period="5d", interval="1d")
            if not daily.empty and len(daily) >= 2:
                last_close = round(float(daily["Close"].iloc[-1]), 2)
                prev_close = round(float(daily["Close"].iloc[-2]), 2)
                if last_close > 0:
                    change_pct = round(((last_close - prev_close) / prev_close) * 100, 2) if prev_close else 0
                    LIVE_PRICES[symbol]["price"]  = last_close
                    LIVE_PRICES[symbol]["change"] = change_pct
        except Exception:
            pass   # keep previous value on error
    print("[GreenStock] Price refresh complete.")


# --- STARTUP: seed prices + schedule periodic refresh every 5 min ---
@app.on_event("startup")
async def on_startup():
    # Run first seed immediately in background thread
    Thread(target=seed_prices_from_yfinance, daemon=True).start()

    # Schedule periodic refresh every 5 minutes
    async def periodic_refresh():
        while True:
            await asyncio.sleep(300)   # 5 minutes
            Thread(target=seed_prices_from_yfinance, daemon=True).start()

    asyncio.create_task(periodic_refresh())


# --- THE REAL UPSTOX MARKET STREAMER ---
def start_upstox_stream():
    if not UPSTOX_AVAILABLE:
        print("upstox_client not installed — skipping live stream")
        return
    configuration = upstox_client.Configuration()
    configuration.access_token = UPSTOX_ACCESS_TOKEN

    instrument_keys = list(KEY_TO_SYMBOL.keys())

    streamer = upstox_client.MarketDataStreamerV3(
        upstox_client.ApiClient(configuration),
        instrument_keys,
        "ltpc"
    )

    def on_message(message):
        try:
            feeds = message.get("feeds", {})
            for upstox_key, data in feeds.items():
                if "ltpc" in data:
                    ltp = data["ltpc"].get("ltp", 0)
                    cp  = data["ltpc"].get("cp", 0)
                    symbol = KEY_TO_SYMBOL.get(upstox_key)
                    if symbol:
                        change_pct = ((ltp - cp) / cp) * 100 if cp > 0 else 0
                        LIVE_PRICES[symbol]["price"]  = round(float(ltp), 2)
                        LIVE_PRICES[symbol]["change"] = round(float(change_pct), 2)
        except Exception:
            pass

    streamer.on("message", on_message)
    print("Connecting to real Upstox NSE Feed...")
    Thread(target=streamer.connect, daemon=True).start()


# --- AUTHENTICATION ---
@app.get("/auth/login")
def upstox_login():
    client_id    = os.getenv("UPSTOX_CLIENT_ID")
    redirect_uri = os.getenv("UPSTOX_REDIRECT_URI")
    auth_url = (
        f"https://api.upstox.com/v2/login/authorization/dialog"
        f"?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}"
    )
    return RedirectResponse(url=auth_url)


@app.get("/callback")
def upstox_callback(code: str):
    global UPSTOX_ACCESS_TOKEN

    client_id     = os.getenv("UPSTOX_CLIENT_ID")
    client_secret = os.getenv("UPSTOX_CLIENT_SECRET")
    redirect_uri  = os.getenv("UPSTOX_REDIRECT_URI")
    token_url     = "https://api.upstox.com/v2/login/authorization/token"
    headers       = {"accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"}
    data          = {
        "code": code, "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": redirect_uri, "grant_type": "authorization_code"
    }

    response = requests.post(token_url, headers=headers, data=data)
    if response.status_code == 200:
        token_data = response.json()
        UPSTOX_ACCESS_TOKEN = token_data.get("access_token")
        start_upstox_stream()
        return {"message": "Login successful!", "status": "Real Upstox Stream Started"}
    else:
        return {"error": "Failed to get token"}


# --- TRADE RECORD BOOK (SQLite) ---
@app.post("/api/trades")
def save_trade(trade: TradeRecord):
    """Persist a completed trade to the database."""
    con = sqlite3.connect(DB_PATH)
    con.execute(
        'INSERT INTO trades (symbol,side,qty,entry_price,exit_price,pl,pl_pct,total_value,time) VALUES (?,?,?,?,?,?,?,?,?)',
        (trade.symbol, trade.side, trade.qty, trade.entry_price, trade.exit_price,
         trade.pl, trade.pl_pct, trade.total_value, trade.time)
    )
    con.commit()
    con.close()
    return {"status": "saved"}


@app.get("/api/trades")
def get_trades(limit: int = 200):
    """Fetch all completed trades, newest first."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        'SELECT * FROM trades ORDER BY id DESC LIMIT ?', (limit,)
    ).fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.delete("/api/trades")
def clear_trades():
    """Clear all trade records (admin use)."""
    con = sqlite3.connect(DB_PATH)
    con.execute('DELETE FROM trades')
    con.commit()
    con.close()
    return {"status": "cleared"}


# --- REST WATCHLIST (fallback for WebSocket) ---
@app.get("/api/watchlist")
def get_watchlist():
    return {
        sym: {"price": d["price"], "change": d["change"], "sector": d.get("sector", "")}
        for sym, d in LIVE_PRICES.items()
    }


# --- HISTORICAL DATA ---
@app.get("/api/historical/{ticker}")
def get_historical_data(ticker: str, interval: str = "1d"):
    try:
        # Use the same YF_TICKER_MAP for consistency
        yf_ticker = YF_TICKER_MAP.get(ticker, f"{ticker}.NS")

        if interval in ["1m", "5m", "15m", "30m"]:
            period = "5d"
        elif interval in ["1wk"]:
            period = "2y"
        elif interval == "1mo":
            period = "5y"
        else:
            period = "1y"   # daily gets full year

        stock = yf.Ticker(yf_ticker)
        hist  = stock.history(period=period, interval=interval)

        chart_data = []
        for index, row in hist.iterrows():
            if row.isna().any():
                continue
            if interval in ["1d", "1wk", "1mo"]:
                time_val = index.strftime('%Y-%m-%d')
            else:
                time_val = int(index.timestamp())

            chart_data.append({
                "time":   time_val,
                "open":   round(row['Open'], 2),
                "high":   round(row['High'], 2),
                "low":    round(row['Low'], 2),
                "close":  round(row['Close'], 2),
                "volume": int(row['Volume']) if 'Volume' in row else 0,
            })

        # Seed live price from latest close
        if len(chart_data) > 0 and ticker in LIVE_PRICES:
            LIVE_PRICES[ticker]["price"] = chart_data[-1]["close"]

        return chart_data
    except Exception as e:
        return {"error": str(e)}


# --- BAR REPLAY DATA ---
@app.get("/api/bar-replay/{ticker}")
def get_bar_replay_data(ticker: str, interval: str = "1d"):
    """Returns full historical OHLCV list for bar replay - same as historical but always max period."""
    try:
        yf_ticker = f"{ticker}.NS"
        if ticker == "NIFTY 50":   yf_ticker = "^NSEI"
        elif ticker == "SENSEX":   yf_ticker = "^BSESN"
        elif ticker == "BANKNIFTY": yf_ticker = "^NSEBANK"

        if interval in ["1m", "5m", "15m", "30m"]:
            period = "5d"
        elif interval in ["1wk", "1mo"]:
            period = "5y"
        else:
            period = "1y"   # More data for replay

        stock = yf.Ticker(yf_ticker)
        hist  = stock.history(period=period, interval=interval)

        chart_data = []
        for index, row in hist.iterrows():
            if row.isna().any():
                continue
            if interval in ["1d", "1wk", "1mo"]:
                time_val = index.strftime('%Y-%m-%d')
            else:
                # Add 19800 (5.5 hrs) for IST offset
                time_val = int(index.timestamp()) + 19800

            chart_data.append({
                "time":   time_val,
                "open":   round(row['Open'], 2),
                "high":   round(row['High'], 2),
                "low":    round(row['Low'], 2),
                "close":  round(row['Close'], 2),
                "volume": int(row['Volume']) if 'Volume' in row else 0,
            })

        return chart_data
    except Exception as e:
        return {"error": str(e)}


# --- REACT WEBSOCKET BRIDGES ---
@app.websocket("/ws/watchlist")
async def watchlist_feed(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await asyncio.sleep(1)
            payload = {
                sym: {"price": d["price"], "change": d["change"], "sector": d.get("sector", "")}
                for sym, d in LIVE_PRICES.items()
            }
            await websocket.send_json(payload)
    except Exception:
        pass


@app.websocket("/ws/live/{ticker}")
async def live_market_feed(websocket: WebSocket, ticker: str, interval: str = "1d"):
    await websocket.accept()
    try:
        current_price = LIVE_PRICES.get(ticker, {}).get("price", 1000)
        day_high = current_price
        day_low  = current_price

        while True:
            await asyncio.sleep(0.5)
            real_price = LIVE_PRICES.get(ticker, {}).get("price", current_price)
            day_high   = max(day_high, real_price)
            day_low    = min(day_low, real_price)

            now = datetime.now()

            if interval in ["1d", "1wk", "1mo"]:
                time_val = now.strftime('%Y-%m-%d')
            else:
                if interval == "1m":
                    block = now.replace(second=0, microsecond=0)
                elif interval == "5m":
                    block = now.replace(minute=now.minute - (now.minute % 5), second=0, microsecond=0)
                elif interval == "15m":
                    block = now.replace(minute=now.minute - (now.minute % 15), second=0, microsecond=0)
                elif interval == "30m":
                    block = now.replace(minute=now.minute - (now.minute % 30), second=0, microsecond=0)
                else:
                    block = now.replace(second=0, microsecond=0)
                # Add 19800 (5.5 hrs) for IST offset
                time_val = int(block.timestamp()) + 19800

            live_tick = {
                "time":  time_val,
                "open":  current_price,
                "high":  day_high,
                "low":   day_low,
                "close": real_price,
            }
            await websocket.send_json(live_tick)
    except Exception:
        pass


# ── NEWS FEED (RSS aggregator — no API key needed) ──────────────────────────
import time as _time

NEWS_CACHE: dict = {"articles": [], "fetched_at": 0}
NEWS_TTL = 300   # 5 minutes

NEWS_FEEDS = [
    # Economic Times — Markets
    ("Economic Times",    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"),
    # Moneycontrol — Markets News
    ("Moneycontrol",      "https://www.moneycontrol.com/rss/marketsnews.xml"),
    # LiveMint — Markets
    ("LiveMint",          "https://www.livemint.com/rss/markets"),
    # Business Standard — Markets
    ("Business Standard", "https://www.business-standard.com/rss/markets-106.rss"),
]

def fetch_news() -> list:
    articles = []
    for source, url in NEWS_FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:8]:   # up to 8 per source
                pub = entry.get("published", entry.get("updated", ""))
                # Parse pub date to ISO if possible
                try:
                    from email.utils import parsedate_to_datetime
                    pub_iso = parsedate_to_datetime(pub).isoformat()
                except Exception:
                    pub_iso = pub
                articles.append({
                    "title":       entry.get("title", "").strip(),
                    "url":         entry.get("link", ""),
                    "source":      source,
                    "publishedAt": pub_iso,
                    "summary":     entry.get("summary", entry.get("description", ""))[:220].strip(),
                })
        except Exception:
            pass   # skip dead feeds silently
    # Sort newest first (best-effort — feed order is usually chronological)
    return articles[:40]   # cap at 40 total


@app.get("/api/news")
def get_news():
    """Return cached market news articles from Indian financial RSS feeds."""
    now = _time.time()
    if now - NEWS_CACHE["fetched_at"] > NEWS_TTL or not NEWS_CACHE["articles"]:
        NEWS_CACHE["articles"]   = fetch_news()
        NEWS_CACHE["fetched_at"] = now
    return NEWS_CACHE["articles"]
