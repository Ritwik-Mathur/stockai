import React, { createContext, useContext, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PredictionWizard from './pages/PredictionWizard'
import SentimentAnalysis from './pages/SentimentAnalysis'
import PredictionHistory from './pages/PredictionHistory'
import Watchlist from './pages/Watchlist'
import Settings from './pages/Settings'
import AuthModal from './components/AuthModal'
import { loadSession, clearSession } from './api/auth'

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('stockai-theme') || 'midnight')
  const [user, setUser]   = useState(() => loadSession())
  const [showAuth, setShowAuth] = useState(false)
  const [authTab, setAuthTab]   = useState('signin')

  const [predictions, setPredictions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockai-predictions') || '[]').map(p => ({ ...p, createdAt: new Date(p.createdAt) })) } catch { return [] }
  })
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockai-watchlist') || '[]') } catch { return [] }
  })
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('stockai-settings') || 'null') || { autoSentiment: true, autoFundamentals: true, notifications: true, defaultHorizon: '5d', defaultTier: 't5' } } catch { return { autoSentiment: true, autoFundamentals: true, notifications: true, defaultHorizon: '5d', defaultTier: 't5' } }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'midnight' ? '' : theme)
    localStorage.setItem('stockai-theme', theme)
  }, [theme])

  useEffect(() => { localStorage.setItem('stockai-predictions', JSON.stringify(predictions)) }, [predictions])
  useEffect(() => { localStorage.setItem('stockai-watchlist', JSON.stringify(watchlist)) }, [watchlist])
  useEffect(() => { localStorage.setItem('stockai-settings', JSON.stringify(settings)) }, [settings])

  const openAuth       = (tab = 'signin') => { setAuthTab(tab); setShowAuth(true) }
  const onAuthSuccess  = (u) => { setUser(u); setShowAuth(false) }
  const signOut        = () => { clearSession(); setUser(null) }
  const updateUser     = (u) => setUser(u)

  const addPrediction       = (p) => setPredictions(prev => [p, ...prev].slice(0, 50))
  const removePrediction    = (id) => setPredictions(prev => prev.filter(p => p.id !== id))
  const addToWatchlist      = (s) => { if (!watchlist.find(w => w.ticker === s.ticker)) setWatchlist(prev => [...prev, s]) }
  const removeFromWatchlist = (ticker) => setWatchlist(prev => prev.filter(s => s.ticker !== ticker))

  return (
    <AppContext.Provider value={{ theme, setTheme, user, openAuth, onAuthSuccess, signOut, updateUser, predictions, addPrediction, removePrediction, watchlist, addToWatchlist, removeFromWatchlist, settings, setSettings }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/predict"   element={<PredictionWizard />} />
            <Route path="/sentiment" element={<SentimentAnalysis />} />
            <Route path="/history"   element={<PredictionHistory />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/settings"  element={<Settings />} />
          </Routes>
        </Layout>
        {showAuth && <AuthModal tab={authTab} onClose={() => setShowAuth(false)} onSuccess={onAuthSuccess} />}
      </BrowserRouter>
    </AppContext.Provider>
  )
}
