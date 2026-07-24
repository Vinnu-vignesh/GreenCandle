# GreenCandle 📈

**A full-stack real-time NSE virtual trading platform**

GreenCandle simulates live stock trading on the National Stock Exchange (NSE) with real-time charting, technical drawing tools, and portfolio tracking — built for traders to practice strategies without financial risk.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

- **Real-time market data** streamed from the Upstox API v3 for live NSE price feeds
- **Interactive candlestick charts** powered by TradingView's lightweight-charts library
- **Custom drawing engine** built on HTML5 Canvas with 13 technical analysis tools (trendlines, Fibonacci retracement, rectangles, horizontal/vertical rays, etc.)
- **Virtual trading engine** — place simulated buy/sell orders, track P&L, and manage a virtual portfolio without real money at risk
- **User authentication** via Firebase Auth (email/password + OAuth)
- **Persistent user data** stored in Firestore (portfolios, watchlists, drawings, preferences)
- **Local trade history & order book** managed via SQLite for fast local reads/writes
- **Market news feed** aggregated via `feedparser` from financial RSS sources
- **Responsive UI** built with React 18, Vite, and Tailwind CSS
- **Watchlists & symbol search** across NSE-listed instruments

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI (Python) |
| Frontend Framework | React 18 + Vite |
| Styling | Tailwind CSS |
| Charting | TradingView `lightweight-charts` |
| Drawing Tools | Custom HTML5 Canvas engine |
| Market Data | Upstox API v3 |
| Authentication | Firebase Auth |
| Cloud Database | Firestore |
| Local Database | SQLite |
| News Aggregation | `feedparser` (RSS) |

---

## Project Structure

```
greencandle/
├── backend/
│   ├── app/
│   │   ├── main.py                # FastAPI entry point
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py        # Firebase auth verification endpoints
│   │   │   │   ├── market.py      # Live/historical market data endpoints
│   │   │   │   ├── trades.py      # Buy/sell order execution & history
│   │   │   │   ├── portfolio.py   # Holdings, P&L, virtual balance
│   │   │   │   ├── watchlist.py   # Watchlist CRUD
│   │   │   │   └── news.py        # feedparser-based news aggregation
│   │   │   └── deps.py            # Shared dependencies (auth, DB sessions)
│   │   ├── core/
│   │   │   ├── config.py          # Environment/config management
│   │   │   └── security.py        # Token validation, Firebase admin SDK
│   │   ├── services/
│   │   │   ├── upstox_client.py   # Upstox API v3 integration
│   │   │   ├── firestore_client.py
│   │   │   └── trade_engine.py    # Virtual order matching logic
│   │   ├── models/
│   │   │   ├── trade.py
│   │   │   ├── portfolio.py
│   │   │   └── user.py
│   │   ├── db/
│   │   │   ├── sqlite.py          # SQLite session/engine setup
│   │   │   └── schema.sql
│   │   └── ws/
│   │       └── market_feed.py     # WebSocket handler for live price ticks
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── chart/
│   │   │   │   ├── CandlestickChart.jsx   # lightweight-charts wrapper
│   │   │   │   └── ChartToolbar.jsx
│   │   │   ├── drawing-engine/
│   │   │   │   ├── CanvasLayer.jsx        # HTML5 Canvas overlay
│   │   │   │   ├── tools/                 # 13 drawing tools
│   │   │   │   │   ├── Trendline.js
│   │   │   │   │   ├── Fibonacci.js
│   │   │   │   │   ├── Rectangle.js
│   │   │   │   │   └── ... (10 more)
│   │   │   │   └── DrawingContext.jsx
│   │   │   ├── trading/
│   │   │   │   ├── OrderPanel.jsx
│   │   │   │   ├── PortfolioTable.jsx
│   │   │   │   └── TradeHistory.jsx
│   │   │   ├── watchlist/
│   │   │   │   └── WatchlistPanel.jsx
│   │   │   ├── news/
│   │   │   │   └── NewsFeed.jsx
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       └── AuthGate.jsx
│   │   ├── hooks/
│   │   │   ├── useMarketSocket.js         # WebSocket hook for live ticks
│   │   │   └── useAuth.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   ├── api.js                     # Axios/fetch wrapper for backend
│   │   │   └── firebase.js                # Firebase client config
│   │   └── styles/
│   │       └── index.css                  # Tailwind entry
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── GreenCandle_Research_Paper.pdf     # IEEE-formatted paper
│   └── GreenCandle_Presentation.pptx
│
├── .gitignore
└── README.md
```

> **Note:** Adjust paths above to match your actual repo if it differs — this reflects the standard structure for the stack described.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A Firebase project (Auth + Firestore enabled)
- An Upstox developer account with API v3 access token

### Clone the repository

```bash
git clone https://github.com/<your-username>/greencandle.git
cd greencandle
```

---

## Environment Variables

**`backend/.env`**
```env
UPSTOX_API_KEY=your_upstox_api_key
UPSTOX_API_SECRET=your_upstox_api_secret
UPSTOX_ACCESS_TOKEN=your_upstox_access_token
FIREBASE_CREDENTIALS_PATH=./firebase-service-account.json
DATABASE_URL=sqlite:///./greencandle.db
SECRET_KEY=your_backend_secret_key
CORS_ORIGINS=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Running the Project

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # On Ubuntu/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend will run at `http://localhost:8000`
Interactive API docs: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at `http://localhost:5173`

### 3. (Optional) Run both concurrently

From the project root, use a process manager like `concurrently` or two terminal tabs, or add a root-level script:

```bash
npm install -g concurrently
concurrently "cd backend && uvicorn app.main:app --reload" "cd frontend && npm run dev"
```

---

## API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/verify` | POST | Verify Firebase ID token |
| `/api/market/quote/{symbol}` | GET | Get latest quote for an NSE symbol |
| `/api/market/history/{symbol}` | GET | Historical OHLC candle data |
| `/ws/market-feed` | WebSocket | Live tick-by-tick price stream |
| `/api/trades/order` | POST | Place a virtual buy/sell order |
| `/api/trades/history` | GET | Get user's trade history |
| `/api/portfolio` | GET | Get current holdings & virtual balance |
| `/api/watchlist` | GET/POST/DELETE | Manage user watchlist |
| `/api/news` | GET | Latest aggregated market news |

Full interactive documentation is auto-generated by FastAPI at `/docs` (Swagger UI) and `/redoc`.

---

## Roadmap

- [ ] Add options chain simulation
- [ ] Add backtesting mode against historical data
- [ ] Mobile-responsive drawing engine
- [ ] Multi-timeframe chart sync
- [ ] Leaderboard for virtual trading performance

---

## License

This project is for educational and portfolio purposes. Add your preferred license (MIT, Apache 2.0, etc.) here.

---

## Acknowledgements

- [TradingView Lightweight Charts](https://github.com/tradingview/lightweight-charts)
- [Upstox API Documentation](https://upstox.com/developer/api-documentation)
- [Firebase Documentation](https://firebase.google.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- 
