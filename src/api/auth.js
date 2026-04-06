/**
 * StockAI Auth — localStorage-based authentication
 * Stores hashed passwords, user profiles, sessions
 * No backend needed — runs entirely client-side
 */

const USERS_KEY   = 'stockai_users'
const SESSION_KEY = 'stockai_session'

// Simple hash using Web Crypto (async)
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'stockai_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Load all registered users
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') } catch { return [] }
}

// Save users list
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// Load current session
export function loadSession() {
  try {
    const s = localStorage.getItem(SESSION_KEY)
    if (!s) return null
    const session = JSON.parse(s)
    // Session expires after 30 days
    if (Date.now() - session.loginAt > 30 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session.user
  } catch { return null }
}

// Save session
function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, loginAt: Date.now() }))
}

// Clear session
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

// Validate email format
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// Validate password strength
export function validatePassword(password) {
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

// Register new user
export async function registerUser({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanName  = name.trim()

  if (!cleanName)                    return { error: 'Full name is required' }
  if (!validateEmail(cleanEmail))    return { error: 'Enter a valid email address' }
  if (password.length < 6)           return { error: 'Password must be at least 6 characters' }

  const users = loadUsers()
  if (users.find(u => u.email === cleanEmail)) {
    return { error: 'An account with this email already exists' }
  }

  const hash = await hashPassword(password)
  const user = {
    id:        crypto.randomUUID(),
    name:      cleanName,
    email:     cleanEmail,
    hash,
    createdAt: Date.now(),
    avatar:    cleanName[0].toUpperCase(),
  }

  saveUsers([...users, user])
  const safeUser = { id: user.id, name: user.name, email: user.email, avatar: user.avatar, createdAt: user.createdAt }
  saveSession(safeUser)
  return { user: safeUser }
}

// Sign in existing user
export async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase()

  if (!validateEmail(cleanEmail))    return { error: 'Enter a valid email address' }
  if (!password)                     return { error: 'Password is required' }

  const users = loadUsers()
  const found = users.find(u => u.email === cleanEmail)
  if (!found) return { error: 'No account found with this email' }

  const hash = await hashPassword(password)
  if (hash !== found.hash) return { error: 'Incorrect password' }

  const safeUser = { id: found.id, name: found.name, email: found.email, avatar: found.avatar, createdAt: found.createdAt }
  saveSession(safeUser)
  return { user: safeUser }
}

// Update profile
export function updateProfile(userId, updates) {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx === -1) return { error: 'User not found' }

  const updated = { ...users[idx], ...updates, id: users[idx].id, email: users[idx].email, hash: users[idx].hash }
  users[idx] = updated
  saveUsers(users)

  const safeUser = { id: updated.id, name: updated.name, email: updated.email, avatar: updated.name[0].toUpperCase() }
  saveSession(safeUser)
  return { user: safeUser }
}

// Change password
export async function changePassword(userId, currentPassword, newPassword) {
  const users = loadUsers()
  const idx = users.findIndex(u => u.id === userId)
  if (idx === -1) return { error: 'User not found' }

  const currentHash = await hashPassword(currentPassword)
  if (currentHash !== users[idx].hash) return { error: 'Current password is incorrect' }
  if (newPassword.length < 6) return { error: 'New password must be at least 6 characters' }

  const newHash = await hashPassword(newPassword)
  users[idx].hash = newHash
  saveUsers(users)
  return { success: true }
}

// Get user count (for display)
export function getUserCount() {
  return loadUsers().length
}
