import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  connectStrava, handleStravaCallback, isStravaConnected,
  disconnectStrava, fetchStravaActivities, getStoredAthlete,
  formatDistance, formatDuration, formatElevation, formatDate, activityEmoji,
} from '../lib/strava'

function getDisplayName(user) {
  if (!user) return ''
  const name = user.email?.split('@')[0] ?? ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function ActivityCard({ activity }) {
  return (
    <div className="bg-zinc-900 rounded-2xl px-4 py-3 mb-2">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{activityEmoji(activity.sport_type ?? activity.type)}</span>
          <span className="text-white font-semibold text-sm truncate">{activity.name}</span>
        </div>
        <span className="text-zinc-500 text-xs shrink-0 ml-2 mt-0.5">{formatDate(activity.start_date_local)}</span>
      </div>

      <div className="flex gap-4 mt-2.5">
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">Distance</p>
          <p className="text-white font-semibold text-sm">{formatDistance(activity.distance)}</p>
        </div>
        <div>
          <p className="text-zinc-500 text-xs mb-0.5">Time</p>
          <p className="text-white font-semibold text-sm">{formatDuration(activity.moving_time)}</p>
        </div>
        {activity.total_elevation_gain > 0 && (
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Elevation</p>
            <p className="text-white font-semibold text-sm">{formatElevation(activity.total_elevation_gain)}</p>
          </div>
        )}
        {activity.average_heartrate && (
          <div>
            <p className="text-zinc-500 text-xs mb-0.5">Avg HR</p>
            <p className="text-white font-semibold text-sm">{Math.round(activity.average_heartrate)} bpm</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HomeView() {
  const [user, setUser] = useState(null)
  const [connected, setConnected] = useState(isStravaConnected())
  const [activities, setActivities] = useState(null)
  const [activitiesError, setActivitiesError] = useState(null)
  const [athlete, setAthlete] = useState(getStoredAthlete())
  const [callbackError, setCallbackError] = useState(null)
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Handle Supabase user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
  }, [])

  // Handle Strava OAuth callback (?code=... in URL)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    if (error) {
      setCallbackError('Strava authorization was denied.')
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (!code) return

    // Clean URL immediately
    window.history.replaceState({}, '', window.location.pathname)

    handleStravaCallback(code).then((ok) => {
      if (ok) {
        setConnected(true)
        setAthlete(getStoredAthlete())
      } else {
        setCallbackError('Failed to connect Strava. Please try again.')
      }
    })
  }, [])

  // Fetch activities when connected
  useEffect(() => {
    if (!connected) { setActivities(null); return }
    loadActivities()
  }, [connected])

  function loadActivities() {
    setLoadingActivities(true)
    setActivitiesError(null)
    fetchStravaActivities(12).then((data) => {
      if (Array.isArray(data)) {
        setActivities(data)
      } else {
        setActivitiesError(data?.error ?? 'unknown')
        setActivities(null)
      }
      setLoadingActivities(false)
    })
  }

  function handleDisconnect() {
    disconnectStrava()
    setConnected(false)
    setActivities(null)
    setAthlete(null)
  }

  const name = getDisplayName(user)

  return (
    <div className="flex flex-col h-full min-h-full">
      {/* Sticky logo header */}
      <div className="sticky top-0 bg-brand-black flex justify-center items-center px-4 py-4 safe-top z-10">
        <img src="/images/snotra-logo.png" alt="Snotra" className="h-20 w-auto" />
      </div>

      <div className="flex flex-col px-4 pb-8">
        {/* Welcome */}
        <div className="text-center mb-6">
          <p className="text-zinc-500 text-sm mb-1">Welcome back</p>
          <h1 className="text-3xl font-bold text-white">{name}</h1>
        </div>

        {/* Strava section */}
        {callbackError && (
          <p className="text-brand-red text-sm text-center mb-4">{callbackError}</p>
        )}

        {!connected ? (
          <div className="flex flex-col items-center bg-zinc-900 rounded-2xl px-6 py-8">
            <div className="w-12 h-12 bg-[#FC4C02] rounded-2xl flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <p className="text-white font-semibold text-base mb-1">Connect Strava</p>
            <p className="text-zinc-500 text-sm text-center mb-5">See your recent activities here alongside your workouts</p>
            <button
              onClick={connectStrava}
              className="w-full py-3.5 rounded-2xl bg-[#FC4C02] text-white font-semibold text-base active:opacity-80 transition-opacity"
            >
              Connect with Strava
            </button>
          </div>
        ) : (
          <>
            {/* Strava header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#FC4C02] rounded-md flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">
                  {athlete ? `${athlete.firstname} ${athlete.lastname}` : 'Strava'}
                </span>
              </div>
              <button onClick={handleDisconnect} className="text-zinc-600 text-xs active:text-zinc-400 transition-colors">
                Disconnect
              </button>
            </div>

            {/* Activities */}
            {loadingActivities ? (
              <div className="flex justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-[#FC4C02] border-t-transparent animate-spin" />
              </div>
            ) : activitiesError ? (
              <div className="bg-zinc-900 rounded-2xl px-4 py-6 text-center">
                <p className="text-zinc-400 text-sm mb-1">Couldn't load activities</p>
                <p className="text-zinc-600 text-xs mb-4">Error: {activitiesError}</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={loadActivities} className="px-4 py-2 rounded-xl bg-zinc-800 text-white text-sm font-medium active:bg-zinc-700">
                    Retry
                  </button>
                  <button onClick={handleDisconnect} className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 text-sm active:bg-zinc-700">
                    Reconnect
                  </button>
                </div>
              </div>
            ) : activities?.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">No recent activities found</p>
            ) : (
              activities?.map((a) => <ActivityCard key={a.id} activity={a} />)
            )}
          </>
        )}
      </div>
    </div>
  )
}
