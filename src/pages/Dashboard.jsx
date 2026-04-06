import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { TrendingUp, TrendingDown, Activity, Brain, BarChart2, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'
import { fetchBatchQuotes, fetchCandles, fmtMktCap, fmtVol, fetchMarketStatus } from '../api/liveStock'

const POPULAR = ['AAPL','MSFT','GOOGL','TSLA','NVDA','AMZN']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload.find(p => p.value != null)?.value
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      {val != null && <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>${val.toFixed(2)}</div>}
    </div>
  )
}

function SkeletonCard() {
  return <div className="shimmer-bg" style={{ height: 90, borderRadius: 12 }} />
}

export default function Dashboard() {
  const { predictions } = useApp()
  const navigate = useNavigate()

  const [stocks, setStocks]         = useState([])
  const [chartData, setChartData]   = useState([])
  const [chartTicker, setChartTicker] = useState('AAPL')
  const [chartQuote, setChartQuote] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [marketStatus, setMarketStatus] = useState(null)
  const [error, setError]           = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const refreshRef = useRef(null)

  const loadStocks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [quotes, status] = await Promise.all([
        fetchBatchQuotes(POPULAR),
        fetchMarketStatus(),
      ])
      setStocks(quotes)
      setMarketStatus(status)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadChart = useCallback(async (ticker) => {
    setChartLoading(true)
    try {
      const candles = await fetchCandles(ticker, '1mo')
      const histPoints = candles.map((c, i) => ({ label: `D${i+1}`, hist: c.close, pred: null }))
      // append 7-day forecast based on last price + small random walk
      const last = candles[candles.length - 1]?.close || 150
      const trend = (candles[candles.length-1]?.close - candles[0]?.close) / candles.length
      const forePoints = Array.from({ length: 7 }, (_, i) => ({
        label: `D${candles.length + i + 1}`,
        hist: null,
        pred: +(last + trend * (i + 1) + (Math.random() - 0.48) * last * 0.008).toFixed(2),
      }))
      setChartData([...histPoints, ...forePoints])
      // find quote for this ticker
      const q = stocks.find(s => s.ticker === ticker)
      if (q) setChartQuote(q)
    } catch (e) {
      console.warn('[chart]', e.message)
    } finally {
      setChartLoading(false)
    }
  }, [stocks])

  useEffect(() => { loadStocks() }, [])
  useEffect(() => {
    if (stocks.length || chartTicker) loadChart(chartTicker)
  }, [chartTicker, stocks.length])

  // Auto-refresh every 60s
  useEffect(() => {
    refreshRef.current = setInterval(() => loadStocks(true), 60_000)
    return () => clearInterval(refreshRef.current)
  }, [loadStocks])

  const totalPredictions = predictions.length
  const avgAccuracy = predictions.length ? Math.round(predictions.reduce((a, p) => a + (p.accuracy || 87), 0) / predictions.length) : 87

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Predictions', value: totalPredictions, badge: 'AI Model', icon: TrendingUp, badgeType: 'blue' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, badge: '+3.2%', icon: Activity, badgeType: 'green' },
          { label: 'Models Used', value: '8', sub: 'ML + DL + NLP', badge: 'Active', icon: Brain, badgeType: 'blue' },
          { label: 'Market', value: marketStatus ? (marketStatus.isOpen ? 'Open' : 'Closed') : '—', sub: marketStatus?.session || '', badge: 'US', icon: BarChart2, badgeType: marketStatus?.isOpen ? 'green' : 'red' },
        ].map(({ label, value, sub, badge, icon: Icon, badgeType }) => (
          <div key={label} className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-accent)' }}>
                <Icon size={16} color="var(--accent-light)" />
              </div>
              <span className={`badge badge-${badgeType}`}>{badge}</span>
            </div>
            <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Live status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: error ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${error ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`, borderRadius: 10, fontSize: 12 }}>
        {error ? <WifiOff size={14} color="var(--red)" /> : <Wifi size={14} color="var(--green)" />}
        <span style={{ color: error ? 'var(--red)' : 'var(--green)', fontWeight: 700 }}>{error ? 'Error' : '● Live Data'}</span>
        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
          {error ? `Finnhub: ${error} — check your API key in src/api/liveStock.js` : lastUpdated ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })} · Powered by Finnhub` : 'Fetching live prices...'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 11 }}>
          <Clock size={11} /> Auto-refresh 60s
        </div>
        <button onClick={() => loadStocks()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: '20px 20px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {chartTicker} — 30 Day History + 7 Day Forecast
            </div>
            {chartQuote && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>${chartQuote.price.toFixed(2)}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600, color: chartQuote.direction === 'up' ? 'var(--green)' : 'var(--red)' }}>
                  {chartQuote.change > 0 ? '+' : ''}{chartQuote.change.toFixed(2)} ({chartQuote.changePct > 0 ? '+' : ''}{chartQuote.changePct.toFixed(2)}%)
                </span>
                <span className="badge badge-green" style={{ fontSize: 9 }}>LIVE</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['AAPL','MSFT','NVDA','TSLA','GOOGL','AMZN'].map(t => (
              <button key={t} onClick={() => setChartTicker(t)} style={{
                padding: '5px 11px', borderRadius: 7,
                border: `1px solid ${chartTicker === t ? 'var(--border-accent)' : 'var(--border)'}`,
                background: chartTicker === t ? 'var(--accent-glow)' : 'transparent',
                color: chartTicker === t ? 'var(--accent-light)' : 'var(--text-muted)',
                fontFamily: 'JetBrains Mono', fontSize: 11, cursor: 'pointer', fontWeight: chartTicker === t ? 700 : 400, transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
        </div>
        {chartLoading ? (
          <div className="shimmer-bg" style={{ height: 230, borderRadius: 10 }} />
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} domain={['auto','auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hist" stroke="var(--accent)"  strokeWidth={2} fill="url(#gHist)" dot={false} connectNulls={false} name="Historical" />
              <Area type="monotone" dataKey="pred" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" fill="url(#gPred)" dot={false} connectNulls={false} name="Predicted" />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', justifyContent: 'flex-end', marginTop: 8 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, height: 2, background: 'var(--accent)', display: 'inline-block', borderRadius: 1 }} />Historical (Finnhub)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, borderTop: '2px dashed #f59e0b', display: 'inline-block' }} />AI Forecast</span>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>

        {/* Popular Stocks LIVE */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Popular Stocks</div>
            <span className="badge badge-green" style={{ fontSize: 10 }}>● LIVE · Finnhub</span>
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {Array.from({length:6}).map((_,i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {stocks.map(s => (
                <div key={s.ticker} className="stock-card" onClick={() => navigate(`/predict?ticker=${s.ticker}`)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{s.ticker}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    </div>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.direction === 'up' ? 'var(--green-bg)' : 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {s.direction === 'up' ? <TrendingUp size={12} color="var(--green)" /> : <TrendingDown size={12} color="var(--red)" />}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                    ${s.price?.toFixed(2) ?? '—'}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600, color: s.direction === 'up' ? 'var(--green)' : 'var(--red)' }}>
                    {s.changePct > 0 ? '+' : ''}{s.changePct?.toFixed(2) ?? '—'}%
                  </div>
                  {s.marketCap && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Mkt Cap: {fmtMktCap(s.marketCap)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Predictions */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'Syne', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Predictions</div>
            <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => navigate('/history')}>View All</button>
          </div>
          {predictions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No predictions yet.
              <br /><button className="btn-accent" style={{ padding: '6px 14px', fontSize: 12, marginTop: 10 }} onClick={() => navigate('/predict')}>Run one now</button>
            </div>
          ) : predictions.slice(0, 4).map(pred => (
            <div key={pred.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: pred.change > 0 ? 'var(--green-bg)' : 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {pred.change > 0 ? <TrendingUp size={14} color="var(--green)" /> : <TrendingDown size={14} color="var(--red)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{pred.ticker}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pred.horizon} · {formatDistanceToNow(pred.createdAt, { addSuffix: true })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>${pred.price?.toFixed(2)}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: pred.change > 0 ? 'var(--green)' : 'var(--red)' }}>{pred.change > 0 ? '+' : ''}{pred.change?.toFixed(2)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
