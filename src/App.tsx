import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured } from './supabase'
import Auth from './pages/Auth'; import Dashboard from './pages/Dashboard'; import Workout from './pages/Workout'
import Diet from './pages/Diet'; import Progress from './pages/Progress'; import Profile from './pages/Profile'
const TABS = [['dash', '🏠', 'Dashboard'], ['work', '🏋️', 'Workout'], ['diet', '🍳', 'Diet'], ['prog', '📊', 'Progress'], ['me', '👤', 'Profile']]
export default function App() {
  const [s, setS] = useState<Session | null>(null), [ready, setReady] = useState(false), [tab, setTab] = useState('dash')
  useEffect(() => {
    if (!configured) { setReady(true); return }
    supabase.auth.getSession().then(({ data }) => { setS(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, ses) => setS(ses))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!configured) return <div className="p-6"><div className="err">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file (see .env.example), then restart.</div></div>
  if (!ready) return <div className="p-10 text-center text-zinc-400">Loading…</div>
  if (!s) return <Auth />
  const uid = s.user.id
  return (
    <div className="mx-auto max-w-md min-h-full pb-24">
      <main className="p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        {tab === 'dash' && <Dashboard uid={uid} go={setTab} />}
        {tab === 'work' && <Workout />}
        {tab === 'diet' && <Diet />}
        {tab === 'prog' && <Progress />}
        {tab === 'me' && <Profile uid={uid} />}
      </main>
      <nav className="fixed bottom-0 inset-x-0 bg-black/95 border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md grid grid-cols-5">
          {TABS.map(([k, i, l]) => <button key={k} onClick={() => setTab(k)} className={`py-3 text-xs flex flex-col items-center gap-1 ${tab === k ? 'text-accent' : 'text-zinc-500'}`}><span className="text-xl">{i}</span>{l}</button>)}
        </div>
      </nav>
    </div>
  )
}
