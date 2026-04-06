# StockAI — Live Stock Prediction Engine

**No proxy server needed. Works directly in the browser.**

Real-time data powered by **Finnhub** (primary) + **Alpha Vantage** (fallback).

---

## Quick Start

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — live prices load immediately.

---

## Getting Free API Keys (takes 30 seconds each)

The app includes a shared demo key that works but may be rate-limited.
For best results, get your own free keys:

### Finnhub (Primary — 60 req/min free)
1. Go to https://finnhub.io/register
2. Sign up with email
3. Copy your API key from the dashboard

### Alpha Vantage (Fallback — 25 req/day free)
1. Go to https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Your key is shown immediately

### Add keys to the project
Create a `.env` file in the project root:
```
VITE_FINNHUB_KEY=your_finnhub_key_here
VITE_ALPHAV_KEY=your_alpha_vantage_key_here
```

Restart the dev server after adding keys.

---

## What's Live

| Feature | Data Source | Notes |
|---------|-------------|-------|
| Dashboard stock prices | Finnhub `/quote` | Real-time |
| Dashboard chart | Finnhub `/stock/candle` | Real 30-day history |
| Market open/close status | Finnhub `/stock/market-status` | Real-time |
| Ticker search autocomplete | Finnhub `/search` | Real-time |
| Live quote on Predict page | Finnhub `/quote` + `/stock/profile2` | With logo, industry |
| Prediction base price | Finnhub (actual current price) | Prediction drift from real price |
| Forecast chart history | Finnhub real candles | Real historical points |
| Sentiment — analyst ratings | Finnhub `/stock/recommendation` | Real buy/hold/sell counts |
| Sentiment — news headlines | Finnhub `/company-news` | Real news with links |
| Watchlist live prices | Finnhub batch quotes | Auto-refresh 60s |
| Predictions persist | localStorage | Survives page refresh |
| Watchlist persists | localStorage | Survives page refresh |

## Architecture

```
Browser
  └── src/api/liveStock.js     ← All API calls, caching, fallback
       ├── Finnhub REST API    ← Primary (CORS-enabled, free)
       └── Alpha Vantage REST  ← Fallback (CORS-enabled, free)
```

**No backend server, no proxy, no CORS errors.**

Finnhub explicitly supports browser (CORS) requests.
Alpha Vantage also allows direct browser calls.

## Project Structure

```
src/
  api/liveStock.js        ← Finnhub + Alpha Vantage client
  App.jsx                 ← Root context + router + localStorage
  pages/
    Dashboard.jsx         ← Live prices, chart, market status
    PredictionWizard.jsx  ← Real current price + AI forecast
    SentimentAnalysis.jsx ← Analyst ratings + live news
    Watchlist.jsx         ← Live prices, auto-refresh
    PredictionHistory.jsx ← Stored predictions
    Settings.jsx          ← Themes, preferences
  components/
    Layout.jsx            ← Sidebar + topbar
    AuthModal.jsx         ← Sign in / Sign up
```

## Themes

Switch between 4 themes in Settings:
- **Midnight** — Deep dark + electric indigo (default)
- **Ocean Blue** — Deep sea + cyan
- **Emerald** — Forest dark + green
- **Warm Ember** — Dark amber glow
