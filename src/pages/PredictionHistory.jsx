import React, { useState } from 'react'
import { useApp } from '../App'
import { useNavigate } from 'react-router-dom'
import { Eye, Trash2, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function PredictionHistory() {
  const { predictions, removePrediction } = useApp()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = predictions.filter(p => {
    const matchSearch = p.ticker.toLowerCase().includes(search.toLowerCase()) || p.name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'up' && p.change > 0) || (filter === 'down' && p.change <= 0)
    return matchSearch && matchFilter
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>Prediction History</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{predictions.length} prediction{predictions.length !== 1 ? 's' : ''} total</div>
        </div>
        <button className="btn-accent" onClick={() => navigate('/predict')}><TrendingUp size={14} /> New Prediction</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input-field" placeholder="Search ticker or name..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'All'], ['up', 'Bullish'], ['down', 'Bearish']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '6px 12px', borderRadius: 8, border: `1px solid ${filter === val ? 'var(--border-accent)' : 'var(--border)'}`,
              background: filter === val ? 'var(--accent-glow)' : 'transparent',
              color: filter === val ? 'var(--accent-light)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 12, fontWeight: filter === val ? 600 : 400, fontFamily: 'DM Sans',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>📊</div>
          <div style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No Predictions Yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Run your first AI prediction to see results here</div>
          <button className="btn-accent" onClick={() => navigate('/predict')}><TrendingUp size={14} /> Make a Prediction</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(pred => (
            <div key={pred.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-accent)'; e.currentTarget.style.transform = 'translateX(2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateX(0)' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: pred.change > 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1px solid ${pred.change > 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {pred.change > 0 ? <TrendingUp size={18} color="var(--green)" /> : <TrendingDown size={18} color="var(--red)" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{pred.ticker}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pred.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 20 }}>{pred.horizon}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 20 }}>{pred.tier}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginRight: 8 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>${pred.price.toFixed(2)}</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: pred.change > 0 ? 'var(--green)' : 'var(--red)', marginTop: 2, fontWeight: 600 }}>
                  {pred.change > 0 ? '+' : ''}{pred.change.toFixed(2)}%
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 80, textAlign: 'right' }}>
                {formatDistanceToNow(pred.createdAt, { addSuffix: true })}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                  <Eye size={14} />
                </button>
                <button onClick={() => removePrediction(pred.id)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--red-bg)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
