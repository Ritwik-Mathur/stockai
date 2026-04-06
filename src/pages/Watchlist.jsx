import React, { useState, useEffect } from 'react'
import { useApp } from '../App'
import { useNavigate } from 'react-router-dom'
import { Star, Plus, X, TrendingUp, TrendingDown, Zap, RefreshCw, Loader } from 'lucide-react'
import { fetchBatchQuotes, searchTicker, fmtMktCap } from '../api/liveStock'

function AddModal({ onClose, onAdd, watchlist }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    let cancelled = false
    setBusy(true)
    const t = setTimeout(async () => {
      try {
        const r = await searchTicker(q)
        if (!cancelled) setResults(r.filter(s => !watchlist.find(w => w.ticker === s.ticker)))
      } catch { setResults([]) }
      finally { if (!cancelled) setBusy(false) }
    }, 380)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q])

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily:'Syne', fontSize:18, fontWeight:800, color:'var(--text-primary)', marginBottom:16 }}>Add to Watchlist</div>
        <div style={{ position:'relative', marginBottom:14 }}>
          {busy && <Loader size={13} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', animation:'spin 1s linear infinite' }} />}
          <input className="input-field" placeholder="Search ticker or company name..." value={q} onChange={e => setQ(e.target.value.toUpperCase())} autoFocus style={{ fontFamily:'JetBrains Mono' }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto' }}>
          {results.slice(0,8).map(r => (
            <div key={r.ticker} onClick={() => { onAdd({ ticker:r.ticker, name:r.name, exchange:r.exchange }); onClose() }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, cursor:'pointer', background:'var(--bg-tertiary)', border:'1px solid var(--border)', transition:'all 0.15s' }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.background='var(--bg-hover)' }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-tertiary)' }}>
              <div style={{ flex:1 }}>
                <span style={{ fontFamily:'JetBrains Mono', fontWeight:700, color:'var(--text-primary)', marginRight:8 }}>{r.ticker}</span>
                <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{r.name}</span>
              </div>
              <span style={{ fontSize:10, color:'var(--text-muted)' }}>{r.exchange}</span>
              <Plus size={16} color="var(--accent-light)" />
            </div>
          ))}
          {!busy && results.length === 0 && q.length > 0 && (
            <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-muted)', fontSize:13 }}>No results found</div>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useApp()
  const navigate = useNavigate()
  const [showAdd, setShowAdd]   = useState(false)
  const [liveData, setLiveData] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const refresh = async () => {
    if (!watchlist.length) return
    setRefreshing(true)
    try {
      const quotes = await fetchBatchQuotes(watchlist.map(s => s.ticker))
      const map = {}
      for (const q of quotes) map[q.ticker] = q
      setLiveData(map)
      setLastUpdated(new Date())
    } catch(e) { console.warn(e) }
    finally { setRefreshing(false) }
  }

  useEffect(() => { if (watchlist.length) refresh() }, [watchlist.length])

  // Auto-refresh every 60s
  useEffect(() => {
    const id = setInterval(() => { if (watchlist.length) refresh() }, 60_000)
    return () => clearInterval(id)
  }, [watchlist.length])

  const merged = watchlist.map(s => ({ ...s, ...(liveData[s.ticker] || {}) }))

  return (
    <div style={{ maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:'var(--text-primary)' }}>Watchlist</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginTop:3 }}>
            {watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked
            {lastUpdated && <span style={{ marginLeft:8, color:'var(--text-muted)' }}>· Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {watchlist.length > 0 && (
            <button className="btn-ghost" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={13} style={{ animation:refreshing?'spin 1s linear infinite':'none' }}/> {refreshing?'Refreshing...':'Refresh'}
            </button>
          )}
          <button className="btn-accent" onClick={() => setShowAdd(true)}><Plus size={14}/> Add Stock</button>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="card" style={{ padding:70, textAlign:'center' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--bg-tertiary)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Star size={28} color="var(--text-muted)"/>
          </div>
          <div style={{ fontFamily:'Syne', fontSize:20, fontWeight:800, color:'var(--text-primary)', marginBottom:8 }}>Your watchlist is empty</div>
          <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:24 }}>Add stocks to track live prices and quickly run AI predictions</div>
          <button className="btn-accent" onClick={() => setShowAdd(true)}><Plus size={14}/> Add Your First Stock</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {merged.map(stock => (
            <div key={stock.ticker} className="card" style={{ padding:18, position:'relative' }}>
              <button onClick={() => removeFromWatchlist(stock.ticker)} style={{ position:'absolute', top:10, right:10, width:26, height:26, borderRadius:6, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', transition:'all 0.15s', zIndex:1 }}
                onMouseEnter={e=>{ e.currentTarget.style.background='var(--red-bg)'; e.currentTarget.style.color='var(--red)' }}
                onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)' }}>
                <X size={12}/>
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                {stock.logo ? (
                  <img src={stock.logo} alt="" style={{ width:34, height:34, borderRadius:8, objectFit:'contain', background:'white', padding:2, flexShrink:0 }} onError={e=>e.target.style.display='none'}/>
                ) : (
                  <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent-glow)', border:'1px solid var(--border-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:11, fontWeight:700, color:'var(--accent-light)' }}>{stock.ticker.slice(0,2)}</span>
                  </div>
                )}
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{stock.ticker}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{stock.exchange || ''}</div>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{stock.name}</div>

              {refreshing && !stock.price ? (
                <div className="shimmer-bg" style={{ height:40, borderRadius:8 }} />
              ) : (
                <>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4 }}>
                    {stock.price != null ? `$${stock.price.toFixed(2)}` : '—'}
                  </div>
                  {stock.changePct != null && (
                    <div style={{ fontFamily:'JetBrains Mono', fontSize:12, fontWeight:600, color: stock.direction==='up'?'var(--green)':'var(--red)', marginBottom:6, display:'flex', alignItems:'center', gap:4 }}>
                      {stock.direction==='up' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                      {stock.changePct > 0 ? '+' : ''}{stock.changePct.toFixed(2)}% ({stock.change > 0 ? '+' : ''}{stock.change?.toFixed(2)})
                    </div>
                  )}
                  {stock.price && <span className="badge badge-green" style={{ fontSize:9, display:'inline-block', marginBottom:10 }}>● LIVE</span>}
                  {stock.marketCap && <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:10 }}>Mkt Cap: {fmtMktCap(stock.marketCap)}</div>}
                </>
              )}
              <button className="btn-accent" style={{ width:'100%', justifyContent:'center', fontSize:12, padding:'7px 0' }} onClick={() => navigate(`/predict?ticker=${stock.ticker}`)}>
                <Zap size={13}/> Predict
              </button>
            </div>
          ))}
          <div style={{ background:'var(--bg-secondary)', border:'2px dashed var(--border)', borderRadius:16, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:180, transition:'all 0.2s' }}
            onClick={() => setShowAdd(true)}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--border-accent)'; e.currentTarget.style.background='var(--accent-glow)' }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-secondary)' }}>
            <Plus size={24} color="var(--text-muted)" style={{ marginBottom:8 }}/>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)' }}>Add Stock</div>
          </div>
        </div>
      )}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addToWatchlist} watchlist={watchlist}/>}
    </div>
  )
}
