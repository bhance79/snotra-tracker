export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const { grant_type, code, refresh_token } = req.body ?? {}

  if (grant_type !== 'authorization_code' && grant_type !== 'refresh_token') {
    return res.status(400).json({ error: 'invalid_grant_type' })
  }
  if (grant_type === 'authorization_code' && !code) {
    return res.status(400).json({ error: 'missing_code' })
  }
  if (grant_type === 'refresh_token' && !refresh_token) {
    return res.status(400).json({ error: 'missing_refresh_token' })
  }

  const body = {
    client_id:     process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type,
    ...(grant_type === 'authorization_code' ? { code } : { refresh_token }),
  }

  try {
    const upstream = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await upstream.json()
    return res.status(upstream.status).json(data)
  } catch {
    return res.status(502).json({ error: 'upstream_failed' })
  }
}
