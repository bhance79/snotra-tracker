const CLIENT_ID = '227043'
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET
const REDIRECT_URI = 'https://snotra-fitness.netlify.app'

const KEYS = {
  accessToken:  'strava_access_token',
  refreshToken: 'strava_refresh_token',
  expiresAt:    'strava_token_expires_at',
  athlete:      'strava_athlete',
}

export function connectStrava() {
  const url =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=read,activity:read_all` +
    `&approval_prompt=auto`
  window.location.href = url
}

export async function handleStravaCallback(code) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!data.access_token) return false
  localStorage.setItem(KEYS.accessToken,  data.access_token)
  localStorage.setItem(KEYS.refreshToken, data.refresh_token)
  localStorage.setItem(KEYS.expiresAt,    String(data.expires_at))
  localStorage.setItem(KEYS.athlete,      JSON.stringify(data.athlete))
  return true
}

async function refreshToken() {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: localStorage.getItem(KEYS.refreshToken),
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) return null
  localStorage.setItem(KEYS.accessToken,  data.access_token)
  localStorage.setItem(KEYS.refreshToken, data.refresh_token)
  localStorage.setItem(KEYS.expiresAt,    String(data.expires_at))
  return data.access_token
}

async function getAccessToken() {
  const expiresAt = Number(localStorage.getItem(KEYS.expiresAt) ?? 0)
  if (Math.floor(Date.now() / 1000) < expiresAt - 60) {
    return localStorage.getItem(KEYS.accessToken)
  }
  return refreshToken()
}

export function isStravaConnected() {
  return !!localStorage.getItem(KEYS.refreshToken)
}

export function disconnectStrava() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
}

export function getStoredAthlete() {
  try { return JSON.parse(localStorage.getItem(KEYS.athlete)) }
  catch { return null }
}

export async function fetchStravaActivities(perPage = 12) {
  const token = await getAccessToken()
  if (!token) return { error: 'no_token' }
  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 401) return { error: 'unauthorized' }
  if (!res.ok) return { error: `http_${res.status}` }
  return res.json()
}

// ── Formatters ────────────────────────────────────────────────────────────────
export function formatDistance(meters) {
  if (!meters) return '—'
  const km = meters / 1000
  return km >= 10 ? `${km.toFixed(1)} km` : `${km.toFixed(2)} km`
}

export function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatElevation(meters) {
  if (!meters) return '—'
  return `${Math.round(meters)} m`
}

export function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function activityEmoji(type) {
  const map = {
    Run: '🏃', Ride: '🚴', Swim: '🏊', Walk: '🚶', Hike: '🥾',
    WeightTraining: '🏋️', Workout: '💪', Yoga: '🧘', Rowing: '🚣',
    Crossfit: '🏋️', Soccer: '⚽', Tennis: '🎾', Golf: '⛳',
  }
  return map[type] ?? '🏅'
}
