import React, { useState } from 'react'
import { X, Eye, EyeOff, Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { registerUser, loginUser, validateEmail } from '../api/auth'

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 6)          score++
  if (password.length >= 10)         score++
  if (/[A-Z]/.test(password))        score++
  if (/[0-9]/.test(password))        score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#16a34a']
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[Math.min(score - 1, 4)] : 'var(--bg-hover)', transition: 'all 0.2s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.72rem', color: colors[Math.min(score - 1, 4)] || 'var(--text-muted)', fontWeight: 600 }}>
        {score > 0 ? labels[Math.min(score - 1, 4)] : ''}
      </span>
    </div>
  )
}

function InputField({ label, type = 'text', value, onChange, placeholder, error, autoFocus, children }) {
  const [showPw, setShowPw] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="field-label" style={{ color: error ? 'var(--red)' : undefined }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          autoFocus={autoFocus}
          type={isPass ? (showPw ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="input-field"
          style={{
            paddingRight: isPass ? 44 : 14,
            borderColor: error ? 'var(--red)' : undefined,
            boxShadow:   error ? '0 0 0 3px rgba(239,68,68,0.15)' : undefined,
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}>
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: '0.78rem', color: 'var(--red)', fontWeight: 500 }}>
          <AlertCircle size={12} />{error}
        </div>
      )}
      {children}
    </div>
  )
}

export default function AuthModal({ tab = 'signin', onClose, onSuccess }) {
  const [mode, setMode]     = useState(tab)
  const [loading, setLoading] = useState(false)
  const [globalErr, setGlobalErr] = useState('')
  const [success, setSuccess]   = useState('')

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errors, setErrors]     = useState({})

  const switchMode = (m) => {
    setMode(m); setErrors({}); setGlobalErr(''); setSuccess('')
    setName(''); setEmail(''); setPassword(''); setConfirm('')
  }

  const validate = () => {
    const e = {}
    if (mode === 'signup' && !name.trim())  e.name    = 'Full name is required'
    if (!email.trim())                       e.email   = 'Email is required'
    else if (!validateEmail(email))          e.email   = 'Enter a valid email address'
    if (!password)                           e.password = 'Password is required'
    else if (password.length < 6)            e.password = 'Minimum 6 characters required'
    if (mode === 'signup') {
      if (!confirm)                          e.confirm = 'Please confirm your password'
      else if (confirm !== password)         e.confirm = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (loading || !validate()) return
    setLoading(true); setGlobalErr('')
    try {
      const result = mode === 'signup'
        ? await registerUser({ name: name.trim(), email: email.trim(), password })
        : await loginUser({ email: email.trim(), password })
      if (result.error) {
        setGlobalErr(result.error)
      } else {
        setSuccess(mode === 'signup' ? '🎉 Account created! Welcome to StockAI.' : '✓ Welcome back!')
        setTimeout(() => onSuccess(result.user), 1000)
      }
    } catch {
      setGlobalErr('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && !loading && onClose()}>
      <div className="modal-box" style={{ width: 480 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px var(--accent-glow)' }}>
              <Zap size={17} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>StockAI</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Prediction Engine</div>
            </div>
          </div>
          <button onClick={onClose} disabled={loading}
            style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 7, display: 'flex', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: 5 }}>
            {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 400, lineHeight: 1.5 }}>
            {mode === 'signin'
              ? 'Access your predictions, watchlist and full portfolio history'
              : 'Start predicting stocks with AI — free, no credit card needed'}
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 10, padding: 3, marginBottom: 22, gap: 2 }}>
          {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([m, lbl]) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: mode === m ? 700 : 500,
              color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: mode === m ? 'var(--bg-card)' : 'transparent',
              transition: 'all 0.2s', fontFamily: 'inherit',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
            }}>{lbl}</button>
          ))}
        </div>

        {/* Success */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 10, marginBottom: 18 }}>
            <CheckCircle size={18} color="var(--green)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--green)' }}>{success}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>Redirecting you now...</div>
            </div>
          </div>
        )}

        {/* Global error */}
        {globalErr && !success && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, marginBottom: 18 }}>
            <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.875rem', color: 'var(--red)', fontWeight: 600 }}>{globalErr}</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}>

            {mode === 'signup' && (
              <InputField label="Full Name" value={name} autoFocus
                onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: ''})) }}
                placeholder="John Smith" error={errors.name} />
            )}

            <InputField label="Email Address" type="email" value={email}
              autoFocus={mode === 'signin'}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})) }}
              placeholder="you@example.com" error={errors.email} />

            <InputField label="Password" type="password" value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})) }}
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
              error={errors.password}>
              {mode === 'signup' && <PasswordStrength password={password} />}
            </InputField>

            {mode === 'signup' && (
              <InputField label="Confirm Password" type="password" value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(p => ({...p, confirm: ''})) }}
                placeholder="Repeat your password" error={errors.confirm} />
            )}

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-light)', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} className="btn-accent"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 0', fontSize: '0.95rem', fontWeight: 700, borderRadius: 10, marginTop: 4, letterSpacing: '-0.01em' }}>
              {loading
                ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> {mode === 'signin' ? 'Signing in...' : 'Creating account...'}</>
                : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {mode === 'signin' ? "Don't have an account?" : 'Already registered?'}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontWeight: 700 }}>
              {mode === 'signin' ? 'Create a free account' : 'Sign in instead'}
            </button>

          </div>
        )}

        {mode === 'signup' && !success && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Your account data is stored securely on this device. No server required.
          </div>
        )}
      </div>
    </div>
  )
}
