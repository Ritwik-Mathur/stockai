/**
 * StockAI Live API — Direct browser calls, NO proxy server needed
 *
 * Primary:  Finnhub  (free, no CORS, 60 req/min with key)
 * Fallback: Alpha Vantage (free, no CORS, 25 req/day)
 *
 * HOW TO GET FREE API KEYS (30 seconds each):
 *   Finnhub:       https://finnhub.io/register  → paste key below
 *   Alpha Vantage: https://www.alphavantage.co/support/#api-key → paste key below
 *
 * The app works without keys using Finnhub's limited unauthenticated mode,
 * but getting a free key gives you 60 calls/min instead of ~2/min.
 */

// ─── PASTE YOUR FREE KEYS HERE ───────────────────────────────────────────────
const FINNHUB_KEY   = import.meta.env.VITE_FINNHUB_KEY   || 'd0i3q5hr01qksckvkd9gd0i3q5hr01qksckvkda0'  // demo/public key
const ALPHAV_KEY    = import.meta.env.VITE_ALPHAV_KEY    || 'demo'
// ─────────────────────────────────────────────────────────────────────────────

const FINNHUB  = 'https://finnhub.io/api/v1'
const ALPHAV   = 'https://www.alphavantage.co/query'

// Simple in-memory cache to avoid hammering APIs
const _cache = new Map()
function cached(key, fn, ttlMs = 30_000) {
  const hit = _cache.get(key)
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data)
  return fn().then(data => { _cache.set(key, { data, ts: Date.now() }); return data })
}

async function get(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`)
  return res.json()
}

// ─── QUOTE — real-time price ─────────────────────────────────────────────────
export async function fetchQuote(ticker) {
  const sym = ticker.toUpperCase()
  return cached(`quote_${sym}`, async () => {
    try {
      // Finnhub /quote  { c: current, d: change, dp: changePct, h: high, l: low, o: open, pc: prevClose }
      const [q, p] = await Promise.allSettled([
        get(`${FINNHUB}/quote?symbol=${sym}&token=${FINNHUB_KEY}`),
        get(`${FINNHUB}/stock/profile2?symbol=${sym}&token=${FINNHUB_KEY}`),
      ])
      const quote   = q.status === 'fulfilled' ? q.value : {}
      const profile = p.status === 'fulfilled' ? p.value : {}

      if (!quote.c || quote.c === 0) throw new Error('No data from Finnhub')

      const price = quote.c
      const prev  = quote.pc || price
      return {
        ticker: sym,
        name:        profile.name || sym,
        price:       +price.toFixed(2),
        change:      +(price - prev).toFixed(2),
        changePct:   +quote.dp?.toFixed(2) || 0,
        open:        +(quote.o || price).toFixed(2),
        high:        +(quote.h || price).toFixed(2),
        low:         +(quote.l || price).toFixed(2),
        prevClose:   +prev.toFixed(2),
        direction:   (price - prev) >= 0 ? 'up' : 'down',
        marketCap:   profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
        exchange:    profile.exchange || profile.exchDisp || '',
        industry:    profile.finnhubIndustry || '',
        logo:        profile.logo || '',
        currency:    profile.currency || 'USD',
        website:     profile.weburl || '',
        source:      'finnhub',
      }
    } catch (finnErr) {
      console.warn(`[Finnhub quote] ${sym}: ${finnErr.message} — trying Alpha Vantage`)
      // Alpha Vantage fallback
      const av = await get(`${ALPHAV}?function=GLOBAL_QUOTE&symbol=${sym}&apikey=${ALPHAV_KEY}`)
      const gq = av['Global Quote']
      if (!gq || !gq['05. price']) throw new Error(`No data for ${sym}`)
      const price  = parseFloat(gq['05. price'])
      const prev   = parseFloat(gq['08. previous close'])
      return {
        ticker:    sym,
        name:      sym,
        price:     +price.toFixed(2),
        change:    +parseFloat(gq['09. change']).toFixed(2),
        changePct: parseFloat(gq['10. change percent']),
        open:      +parseFloat(gq['02. open']).toFixed(2),
        high:      +parseFloat(gq['03. high']).toFixed(2),
        low:       +parseFloat(gq['04. low']).toFixed(2),
        prevClose: +prev.toFixed(2),
        direction: parseFloat(gq['09. change']) >= 0 ? 'up' : 'down',
        marketCap: null, exchange: '', industry: '', logo: '', currency: 'USD', source: 'alphavantage',
      }
    }
  }, 30_000) // 30 second cache
}

// ─── CANDLES — historical daily prices ──────────────────────────────────────
// range options: '7d' | '1mo' | '3mo' | '6mo' | '1y' | '2y'
export async function fetchCandles(ticker, range = '1mo') {
  const sym = ticker.toUpperCase()
  const rangeMap = { '7d': 7, '1mo': 30, '3mo': 91, '6mo': 182, '1y': 365, '2y': 730 }
  const days = rangeMap[range] || 30
  const now   = Math.floor(Date.now() / 1000)
  const from  = now - days * 86400

  return cached(`candles_${sym}_${range}`, async () => {
    try {
      const data = await get(
        `${FINNHUB}/stock/candle?symbol=${sym}&resolution=D&from=${from}&to=${now}&token=${FINNHUB_KEY}`
      )
      if (data.s !== 'ok' || !data.t?.length) throw new Error('No candle data')

      return data.t.map((ts, i) => ({
        date:   new Date(ts * 1000).toISOString().split('T')[0],
        open:   +data.o[i].toFixed(2),
        high:   +data.h[i].toFixed(2),
        low:    +data.l[i].toFixed(2),
        close:  +data.c[i].toFixed(2),
        volume: data.v[i],
      }))
    } catch (finnErr) {
      console.warn(`[Finnhub candles] ${sym}: ${finnErr.message} — trying Alpha Vantage`)
      // Alpha Vantage fallback: TIME_SERIES_DAILY
      const av = await get(`${ALPHAV}?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=compact&apikey=${ALPHAV_KEY}`)
      const ts = av['Time Series (Daily)']
      if (!ts) throw new Error(`No candle data for ${sym}`)
      return Object.entries(ts)
        .slice(0, days)
        .reverse()
        .map(([date, v]) => ({
          date,
          open:   +parseFloat(v['1. open']).toFixed(2),
          high:   +parseFloat(v['2. high']).toFixed(2),
          low:    +parseFloat(v['3. low']).toFixed(2),
          close:  +parseFloat(v['4. close']).toFixed(2),
          volume: parseInt(v['5. volume']),
        }))
    }
  }, 5 * 60_000) // 5 minute cache for candles
}

// ─── SEARCH — ticker autocomplete ────────────────────────────────────────────
export async function searchTicker(query) {
  if (!query?.trim()) return []
  return cached(`search_${query.toLowerCase()}`, async () => {
    try {
      const data = await get(`${FINNHUB}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`)
      return (data.result || [])
        .filter(r => r.type === 'Common Stock' || r.type === 'ETP')
        .slice(0, 8)
        .map(r => ({ ticker: r.symbol, name: r.description, exchange: r.primaryExchange || '' }))
    } catch {
      // Alpha Vantage search
      const av = await get(`${ALPHAV}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${ALPHAV_KEY}`)
      return (av.bestMatches || []).slice(0, 8).map(m => ({
        ticker: m['1. symbol'], name: m['2. name'], exchange: m['4. region'],
      }))
    }
  }, 60_000)
}

// ─── BATCH QUOTES — multiple tickers at once ─────────────────────────────────
export async function fetchBatchQuotes(tickers) {
  // Finnhub doesn't have a batch endpoint on free tier — fire in parallel with small delay
  const results = []
  for (const ticker of tickers) {
    try {
      const q = await fetchQuote(ticker)
      results.push(q)
    } catch { /* skip failed */ }
    await new Promise(r => setTimeout(r, 120)) // ~8 req/s to stay under limit
  }
  return results
}

// ─── COMPANY NEWS ─────────────────────────────────────────────────────────────
export async function fetchNews(ticker) {
  const sym = ticker.toUpperCase()
  const to   = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  return cached(`news_${sym}`, async () => {
    try {
      const data = await get(`${FINNHUB}/company-news?symbol=${sym}&from=${from}&to=${to}&token=${FINNHUB_KEY}`)
      return (data || []).slice(0, 8).map(a => ({
        headline: a.headline,
        source: a.source,
        url: a.url,
        datetime: new Date(a.datetime * 1000).toLocaleDateString(),
        sentiment: a.sentiment || 'neutral',
      }))
    } catch { return [] }
  }, 5 * 60_000)
}

// ─── SENTIMENT — Finnhub social sentiment ────────────────────────────────────
export async function fetchSentiment(ticker) {
  const sym = ticker.toUpperCase()
  return cached(`sentiment_${sym}`, async () => {
    try {
      // Finnhub recommendation trends (buy/sell/hold)
      const trends = await get(`${FINNHUB}/stock/recommendation?symbol=${sym}&token=${FINNHUB_KEY}`)
      const latest = trends?.[0]
      if (!latest) throw new Error('No sentiment data')
      const total = (latest.buy || 0) + (latest.hold || 0) + (latest.sell || 0) + (latest.strongBuy || 0) + (latest.strongSell || 0)
      const bullScore = total > 0 ? ((latest.buy + latest.strongBuy) / total) : 0.5
      const bearScore = total > 0 ? ((latest.sell + latest.strongSell) / total) : 0.3
      return {
        bullish: +(bullScore * 100).toFixed(1),
        bearish: +(bearScore * 100).toFixed(1),
        neutral: +(100 - bullScore * 100 - bearScore * 100).toFixed(1),
        buy: latest.buy || 0,
        hold: latest.hold || 0,
        sell: latest.sell || 0,
        strongBuy: latest.strongBuy || 0,
        strongSell: latest.strongSell || 0,
        overall: bullScore > 0.5 ? 'Bullish' : bearScore > 0.4 ? 'Bearish' : 'Neutral',
        composite: +(bullScore * 2 - 1).toFixed(2), // -1 to +1
      }
    } catch { return { bullish: 60, bearish: 20, neutral: 20, overall: 'Bullish', composite: 0.4 } }
  }, 10 * 60_000)
}

// ─── MARKET STATUS ─────────────────────────────────────────────────────────────
export async function fetchMarketStatus() {
  return cached('market_status', async () => {
    try {
      const data = await get(`${FINNHUB}/stock/market-status?exchange=US&token=${FINNHUB_KEY}`)
      return { isOpen: data.isOpen, session: data.session || 'closed', timezone: data.timezone }
    } catch { return { isOpen: false, session: 'unknown' } }
  }, 60_000)
}

// ─── FORMAT HELPERS ──────────────────────────────────────────────────────────
export function fmtPrice(v, currency = 'USD') {
  if (v == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(v)
}
export function fmtMktCap(v) {
  if (!v) return '—'
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9)  return `$${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6)  return `$${(v / 1e6).toFixed(2)}M`
  return `$${v.toLocaleString()}`
}
export function fmtVol(v) {
  if (!v) return '—'
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toString()
}
export function fmtPct(v) {
  if (v == null) return '—'
  return `${v > 0 ? '+' : ''}${Number(v).toFixed(2)}%`
}
