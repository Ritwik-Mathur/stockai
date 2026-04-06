import React, { useState } from 'react'
import { Search, TrendingUp, TrendingDown, ExternalLink, Loader } from 'lucide-react'
import { fetchQuote, fetchNews, fetchSentiment, searchTicker } from '../api/liveStock'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const QUICK = ['AAPL','NVDA','TSLA','MSFT','GOOGL','META','AMZN','NFLX']

export default function SentimentAnalysis() {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug] = useState(false)

  const handleInputChange = async (val) => {
    setInput(val.toUpperCase())
    if (val.length > 1) {
      try {
        const res = await searchTicker(val)
        setSuggestions(res.slice(0, 5))
        setShowSug(true)
      } catch { setSuggestions([]) }
    } else {
      setSuggestions([]); setShowSug(false)
    }
  }

  const analyze = async (sym) => {
    const ticker = (sym || input).toUpperCase().trim()
    if (!ticker) return
    setInput(ticker); setShowSug(false); setSuggestions([])
    setLoading(true); setError(null); setResult(null)
    try {
      const [quote, sentiment, news] = await Promise.all([
        fetchQuote(ticker),
        fetchSentiment(ticker),
        fetchNews(ticker),
      ])
      setResult({ ticker, quote, sentiment, news })
    } catch(e) {
      setError(`Could not analyze "${ticker}": ${e.message}`)
    } finally { setLoading(false) }
  }

  const sentColor = (s) => s === 'Positive' || s === 'positive' ? 'var(--green)' : s === 'Negative' || s === 'negative' ? 'var(--red)' : 'var(--gold)'
  const overallColor = result ? (result.sentiment?.overall === 'Bullish' ? 'var(--green)' : result.sentiment?.overall === 'Bearish' ? 'var(--red)' : 'var(--gold)') : 'var(--text-primary)'

  const barData = result ? [
    { name: 'Strong Buy', value: result.sentiment?.strongBuy || 0, color: '#10b981' },
    { name: 'Buy',        value: result.sentiment?.buy || 0, color: '#34d399' },
    { name: 'Hold',       value: result.sentiment?.hold || 0, color: '#f59e0b' },
    { name: 'Sell',       value: result.sentiment?.sell || 0, color: '#f87171' },
    { name: 'Strong Sell',value: result.sentiment?.strongSell || 0, color: '#f43f5e' },
  ] : []

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>

      {/* Search */}
      <div className="card" style={{ padding:20, marginBottom:18 }}>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ position:'relative', flex:1 }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
            <input className="input-field"
              placeholder="Enter stock ticker (e.g., AAPL, NVDA, TSLA)"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => e.key==='Enter' && analyze()}
              onBlur={() => setTimeout(()=>setShowSug(false),180)}
              style={{ fontFamily:'JetBrains Mono', paddingLeft:34 }}
            />
            {showSug && suggestions.length > 0 && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border-accent)', borderRadius:10, zIndex:20, marginTop:4, overflow:'hidden', boxShadow:'0 8px 30px rgba(0,0,0,0.4)' }}>
                {suggestions.map((r,i) => (
                  <div key={r.ticker} onMouseDown={() => analyze(r.ticker)}
                    style={{ padding:'9px 14px', display:'flex', justifyContent:'space-between', borderBottom:i<suggestions.length-1?'1px solid var(--border)':'none', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <span><span style={{ fontFamily:'JetBrains Mono', fontWeight:700, color:'var(--text-primary)', marginRight:8 }}>{r.ticker}</span><span style={{ fontSize:12, color:'var(--text-secondary)' }}>{r.name}</span></span>
                    <span style={{ fontSize:10, color:'var(--text-muted)' }}>{r.exchange}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button className="btn-accent" onClick={() => analyze()} disabled={loading} style={{ minWidth:120, justifyContent:'center' }}>
            {loading ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Analyzing...</> : <><Search size={14}/> Analyze</>}
          </button>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
          {QUICK.map(t => <button key={t} className="tag-chip" onClick={() => analyze(t)}>{t}</button>)}
        </div>
      </div>

      {error && (
        <div style={{ padding:'14px 18px', background:'var(--red-bg)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:12, color:'var(--red)', fontSize:13, marginBottom:16 }}>
          ⚠ {error}
        </div>
      )}

      {!result && !loading && (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>💬</div>
          <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>NLP-Powered Sentiment Analysis</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', maxWidth:420, margin:'0 auto' }}>
            Enter a ticker to analyze analyst recommendations, news sentiment, and market mood — powered live by Finnhub
          </div>
        </div>
      )}

      {loading && (
        <div className="card" style={{ padding:60, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>⚙️</div>
          <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:8 }}>Analyzing live data...</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Fetching analyst ratings · News headlines · Sentiment scoring</div>
        </div>
      )}

      {result && !loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Header with live quote */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              {result.quote?.logo && <img src={result.quote.logo} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:'contain', background:'white', padding:3 }} onError={e=>e.target.style.display='none'} />}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:800, color:'var(--text-primary)' }}>
                  <span style={{ fontFamily:'JetBrains Mono', color:'var(--accent-light)' }}>{result.ticker}</span> — {result.quote?.name || result.ticker}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>
                  {result.quote?.exchange} · {result.quote?.industry} · Powered by Finnhub
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>
                  ${result.quote?.price?.toFixed(2) || '—'}
                </div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:700, color: result.quote?.direction==='up'?'var(--green)':'var(--red)', display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                  {result.quote?.direction==='up' ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                  {result.quote?.change > 0 ? '+' : ''}{result.quote?.change?.toFixed(2)} ({result.quote?.changePct > 0 ? '+' : ''}{result.quote?.changePct?.toFixed(2)}%)
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:overallColor }}>{result.sentiment?.overall}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Overall Sentiment</div>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Analyst Recommendations */}
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontFamily:'Syne', fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>
                Analyst Recommendations
                <span className="badge badge-green" style={{ marginLeft:8, fontSize:9 }}>● Finnhub Live</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={barData} margin={{ top:0, right:0, left:-30, bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fontSize:9, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {barData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginTop:12 }}>
                {barData.map(d => (
                  <div key={d.name} style={{ textAlign:'center', background:'var(--bg-tertiary)', borderRadius:8, padding:'8px 4px' }}>
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:16, fontWeight:800, color:d.color }}>{d.value}</div>
                    <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:2, lineHeight:1.2 }}>{d.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sentiment breakdown */}
            <div className="card" style={{ padding:20 }}>
              <div style={{ fontFamily:'Syne', fontSize:13, fontWeight:700, color:'var(--text-primary)', marginBottom:16 }}>Sentiment Breakdown</div>
              {[['Bullish',result.sentiment?.bullish,'var(--green)'],['Neutral',result.sentiment?.neutral,'var(--gold)'],['Bearish',result.sentiment?.bearish,'var(--red)']].map(([l,v,c]) => (
                <div key={l} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                    <span style={{ color:'var(--text-secondary)', fontWeight:600 }}>{l}</span>
                    <span style={{ color:c, fontFamily:'JetBrains Mono', fontWeight:700 }}>{v?.toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:`${v||0}%`, background:c }} /></div>
                </div>
              ))}
              <div style={{ marginTop:16, background:'var(--bg-tertiary)', borderRadius:10, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:600 }}>Composite Score</span>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:18, fontWeight:800, color:overallColor }}>
                  {result.sentiment?.composite > 0 ? '+' : ''}{result.sentiment?.composite?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* News headlines */}
          {result.news?.length > 0 && (
            <div className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontFamily:'Syne', fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>Recent News Headlines</div>
                <span className="badge badge-blue" style={{ fontSize:9 }}>● Finnhub Live</span>
              </div>
              {result.news.map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'11px 0', borderBottom: i < result.news.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent-light)', flexShrink:0, marginTop:4 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'var(--text-primary)', lineHeight:1.5 }}>{item.headline}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{item.source} · {item.datetime}</div>
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color:'var(--text-muted)', flexShrink:0, marginTop:2 }}>
                      <ExternalLink size={13}/>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
