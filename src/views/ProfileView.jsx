import { supabase } from '../lib/supabase'

export default function ProfileView() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full min-h-full px-6 safe-top pb-8">
      <h1 className="text-2xl font-bold text-white py-4 text-center">Profile</h1>
      <p className="text-brand-silver text-sm text-center">Coming soon</p>

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="w-full py-3 text-brand-red font-semibold text-base active:opacity-60 transition-opacity"
      >
        Log Out
      </button>
    </div>
  )
}
