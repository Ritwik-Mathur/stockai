import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../App'
import {
  LayoutDashboard, TrendingUp, MessageSquare, History,
  Star, Settings, Zap, Bell, LogOut, ChevronDown, User, Shield
} from 'lucide-react'

const NAV = [
  { path: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { path: '/predict',   label: 'Predict',    icon: TrendingUp },
  { path: '/sentiment', label: 'Sentiment',  icon: MessageSquare },
  { path: '/history',   label: 'History',    icon: History },
  { path: '/watchlist', label: 'Watchlist',  icon: Star },
  { path: '/settings',  label: 'Settings',   icon: Settings },
]

const PAGE_META = {
  '/dashboard': { title: 'Dashboard',            sub: 'AI-powered stock predictions' },
  '/predict':   { title: 'AI Stock Prediction',  sub: 'Configure and run your prediction' },
  '/sentiment': { title: 'Sentiment Analysis',   sub: 'NLP-powered news & social scoring' },
  '/history':   { title: 'Prediction History',   sub: 'View and manage past predictions' },
  '/watchlist': { title: 'Watchlist',            sub: 'Track stocks and predict quickly' },
  '/settings':  { title: 'Settings',             sub: 'Customize your StockAI experience' },
}

// User avatar dropdown
function UserDropdown({ user, openAuth, signOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" onClick={() => openAuth('signin')} style={{ fontSize: '0.82rem', padding: '7px 14px', fontWeight: 600 }}>
          Sign In
        </button>
        <button className="btn-accent" onClick={() => openAuth('signup')} style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
          Sign Up
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)', borderRadius: 10, padding: '6px 10px 6px 8px',
        cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text-primary)',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--border)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>
            {user.avatar || user.name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{user.name}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{user.email}</div>
        </div>
        <ChevronDown size={14} color="var(--text-muted)" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 12, minWidth: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.5)', zIndex: 50, overflow: 'hidden', animation: 'fadeIn 0.15s ease-out' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
          </div>
          {[
            { icon: User, label: 'Profile', action: () => { setOpen(false) } },
            { icon: Shield, label: 'Security', action: () => { setOpen(false) } },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.12s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
              <Icon size={14} />{label}
            </button>
          ))}
          <div style={{ height: 1, background: 'var(--border)' }} />
          <button onClick={() => { setOpen(false); signOut() }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, openAuth, signOut, predictions } = useApp()
  const meta = PAGE_META[location.pathname] || PAGE_META['/dashboard']

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 220, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)', flexShrink: 0 }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>StockAI</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prediction Engine</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '10px 8px', flex: 1 }}>
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <div key={path} className={`nav-item ${active ? 'active' : ''}`} onClick={() => navigate(path)}
                style={{ marginBottom: 2 }}>
                <Icon size={15} />
                <span>{label}</span>
                {active && <div className="glow-dot" style={{ marginLeft: 'auto' }} />}
              </div>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-light)' }}>{user.avatar || user.name?.[0]?.toUpperCase()}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 5, display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>ML · DL · NLP · Transformer</div>
              <button className="btn-accent" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '7px 0' }} onClick={() => openAuth('signin')}>
                <User size={13} /> Sign In
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ height: 58, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0, gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {meta.title}
              {user && location.pathname === '/dashboard' && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>, {user.name.split(' ')[0]}</span>
              )}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 1, fontWeight: 400 }}>{meta.sub}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button className="btn-ghost" style={{ padding: '7px 10px', position: 'relative' }}>
              <Bell size={15} />
              {predictions.length > 0 && (
                <div style={{ position: 'absolute', top: 5, right: 7, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', border: '1.5px solid var(--bg-secondary)' }} />
              )}
            </button>
            <UserDropdown user={user} openAuth={openAuth} signOut={signOut} />
            <button className="btn-accent" onClick={() => navigate('/predict')} style={{ fontSize: '0.82rem', padding: '7px 14px', fontWeight: 700 }}>
              <TrendingUp size={13} /> New Prediction
            </button>
          </div>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '22px 24px', background: 'var(--bg-primary)' }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}
