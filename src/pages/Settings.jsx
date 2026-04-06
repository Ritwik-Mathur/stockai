import React, { useState } from 'react'
import { useApp } from '../App'
import { User, Palette, Sliders, Shield, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { updateProfile, changePassword } from '../api/auth'

const THEMES = [
  { key: 'midnight', name: 'Midnight',  desc: 'Deep dark · electric indigo', sw: ['#0b0d14','#1a1e30','#6366f1','#818cf8'] },
  { key: 'ocean',    name: 'Ocean',     desc: 'Deep sea · cyan highlights',  sw: ['#040d1e','#0f2748','#0ea5e9','#38bdf8'] },
  { key: 'emerald',  name: 'Emerald',   desc: 'Forest dark · green accents', sw: ['#030f07','#0d2715','#16a34a','#22c55e'] },
  { key: 'warm',     name: 'Warm Ember',desc: 'Dark · amber glow',           sw: ['#100b03','#2e220d','#d97706','#f59e0b'] },
]

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="var(--accent-light)" />
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { theme, setTheme, user, updateUser, settings, setSettings, openAuth } = useApp()
  const [profileName, setProfileName]   = useState(user?.name || '')
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileErr, setProfileErr]     = useState('')
  const [currPass, setCurrPass]         = useState('')
  const [newPass, setNewPass]           = useState('')
  const [showCurr, setShowCurr]         = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [passMsg, setPassMsg]           = useState('')
  const [passErr, setPassErr]           = useState('')
  const [passLoading, setPassLoading]   = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const saveProfile = () => {
    if (!profileName.trim()) { setProfileErr('Name cannot be empty'); return }
    if (!user)               { setProfileErr('Sign in to save profile'); return }
    setProfileErr('')
    const r = updateProfile(user.id, { name: profileName.trim() })
    if (r.error) { setProfileErr(r.error); return }
    updateUser(r.user)
    setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500)
  }

  const savePassword = async () => {
    if (!user) { setPassErr('Sign in to change password'); return }
    setPassErr(''); setPassMsg('')
    if (!currPass)            { setPassErr('Enter your current password'); return }
    if (newPass.length < 6)   { setPassErr('New password must be at least 6 characters'); return }
    setPassLoading(true)
    const r = await changePassword(user.id, currPass, newPass)
    setPassLoading(false)
    if (r.error) { setPassErr(r.error); return }
    setPassMsg('Password updated successfully')
    setCurrPass(''); setNewPass('')
    setTimeout(() => setPassMsg(''), 3000)
  }

  const toggle = (k) => setSettings(s => ({ ...s, [k]: !s[k] }))

  const saveSettings = () => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2500) }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: 40 }}>

      {/* Profile */}
      <Section icon={User} title="Profile">
        {!user && (
          <div style={{ padding: '12px 16px', background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', borderRadius: 10, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Sign in to save your profile</span>
            <button className="btn-accent" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={() => openAuth('signup')}>Sign Up Free</button>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div>
            <label className="field-label">Full Name</label>
            <input className="input-field" value={profileName} onChange={e => { setProfileName(e.target.value); setProfileErr('') }} placeholder="Your full name" />
          </div>
          <div>
            <label className="field-label">Email Address</label>
            <input className="input-field" value={user?.email || ''} disabled placeholder="your@email.com" style={{ opacity: 0.55, cursor: 'not-allowed' }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>Email cannot be changed</div>
          </div>
        </div>
        {profileErr && <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--red)', fontSize:'0.82rem', fontWeight:600, marginBottom:10 }}><AlertCircle size={12}/>{profileErr}</div>}
        <button onClick={saveProfile} className={profileSaved ? 'btn-ghost' : 'btn-accent'} style={{ fontWeight:700 }}>
          {profileSaved ? <><Check size={14}/> Saved!</> : 'Save Profile'}
        </button>
      </Section>

      {/* Theme */}
      <Section icon={Palette} title="Theme">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {THEMES.map(t => (
            <div key={t.key} onClick={() => setTheme(t.key)} style={{ background:'var(--bg-tertiary)', border:`2px solid ${theme===t.key?'var(--accent)':'var(--border)'}`, borderRadius:12, padding:'14px 12px', cursor:'pointer', transition:'all 0.18s', position:'relative' }}>
              {theme === t.key && (
                <div style={{ position:'absolute', top:9, right:9, width:18, height:18, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Check size={10} color="white" strokeWidth={3}/>
                </div>
              )}
              <div style={{ display:'flex', gap:4, marginBottom:10 }}>
                {t.sw.map((c,i) => <div key={i} style={{ width:18, height:18, borderRadius:'50%', background:c, border:'1px solid rgba(255,255,255,0.12)' }}/>)}
              </div>
              <div style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-primary)', marginBottom:3 }}>{t.name}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Prediction Defaults */}
      <Section icon={Sliders} title="Prediction Defaults">
        {[
          { key:'autoSentiment',    label:'Auto-include Sentiment',    sub:'Include NLP sentiment in all predictions' },
          { key:'autoFundamentals', label:'Auto-include Fundamentals', sub:'Include P/E, EPS, Market Cap in analysis' },
          { key:'notifications',    label:'Notifications',             sub:'Get notified about prediction results' },
        ].map(({ key, label, sub }) => (
          <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>{sub}</div>
            </div>
            <div className={`toggle-switch ${settings[key]?'':'off'}`} onClick={() => toggle(key)}/>
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:16 }}>
          <div>
            <label className="field-label">Default Horizon</label>
            <select className="input-field" value={settings.defaultHorizon} onChange={e => setSettings(s=>({...s,defaultHorizon:e.target.value}))} style={{ cursor:'pointer' }}>
              {[['1d','1 Day'],['5d','5 Days'],['1mo','1 Month'],['3mo','3 Months'],['1y','1 Year']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Default Model Tier</label>
            <select className="input-field" value={settings.defaultTier} onChange={e => setSettings(s=>({...s,defaultTier:e.target.value}))} style={{ cursor:'pointer' }}>
              {[['t1','Tier 1 — Simple'],['t2','Tier 2 — Medium'],['t3','Tier 3 — Deep'],['t4','Tier 4 — Heavy'],['t5','Tier 5 — Ensemble']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop:16 }}>
          <button onClick={saveSettings} className={settingsSaved?'btn-ghost':'btn-accent'} style={{ fontWeight:700 }}>
            {settingsSaved ? <><Check size={14}/> Saved!</> : 'Save Settings'}
          </button>
        </div>
      </Section>

      {/* Security */}
      <Section icon={Shield} title="Security">
        {!user ? (
          <div style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Sign in to manage your security settings.</div>
        ) : (
          <>
            <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:16, fontWeight:500 }}>Change your password below.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:400 }}>
              <div>
                <label className="field-label">Current Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showCurr?'text':'password'} value={currPass} onChange={e=>{setCurrPass(e.target.value);setPassErr('')}} className="input-field" placeholder="Current password" style={{ paddingRight:42 }}/>
                  <button type="button" onClick={()=>setShowCurr(!showCurr)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex' }}>
                    {showCurr?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>
              <div>
                <label className="field-label">New Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showNew?'text':'password'} value={newPass} onChange={e=>{setNewPass(e.target.value);setPassErr('')}} className="input-field" placeholder="Minimum 6 characters" style={{ paddingRight:42 }}/>
                  <button type="button" onClick={()=>setShowNew(!showNew)} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',display:'flex' }}>
                    {showNew?<EyeOff size={15}/>:<Eye size={15}/>}
                  </button>
                </div>
              </div>
              {passErr && <div style={{ display:'flex',alignItems:'center',gap:6,color:'var(--red)',fontSize:'0.82rem',fontWeight:600 }}><AlertCircle size={12}/>{passErr}</div>}
              {passMsg  && <div style={{ display:'flex',alignItems:'center',gap:6,color:'var(--green)',fontSize:'0.82rem',fontWeight:700 }}><Check size={12}/>{passMsg}</div>}
              <button onClick={savePassword} disabled={passLoading} className="btn-accent" style={{ alignSelf:'flex-start', fontWeight:700 }}>
                {passLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </>
        )}
      </Section>

      <div className="disclaimer-box">
        <strong style={{ color:'var(--gold)', fontWeight:700 }}>Disclaimer: </strong>
        StockAI is for educational and research purposes only. Stock price prediction inherently involves uncertainty. No model can reliably predict future prices. Past performance is not indicative of future results. Always consult a licensed financial advisor.
      </div>
    </div>
  )
}
