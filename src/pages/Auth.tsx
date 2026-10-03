import { useState } from 'react'
import { supabase } from '../supabase'
export default function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in'), [name, setName] = useState(''), [email, setEmail] = useState(''), [pw, setPw] = useState('')
  const [err, setErr] = useState(''), [info, setInfo] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setInfo('')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email.')
    if (pw.length < 6) return setErr('Password needs at least 6 characters.')
    if (mode === 'up' && !name.trim()) return setErr('Enter your name.')
    setBusy(true)
    const r = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password: pw }) : await supabase.auth.signUp({ email, password: pw, options: { data: { name: name.trim() } } })
    setBusy(false)
    if (r.error) return setErr(r.error.message)
    if (mode === 'up' && !r.data.session) setInfo('Check your email to confirm your account, then log in.')
  }
  return (
    <div className="mx-auto max-w-md min-h-full p-6 flex flex-col justify-center">
      <h1 className="text-5xl font-black leading-none">MONSTER<br /><span className="text-accent">RECOMP</span></h1>
      <p className="text-zinc-400 mt-3 mb-8">Strength, consistency, recovery.</p>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'up' && <input className="input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
        <input className="input" type="email" placeholder="Email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={e => setPw(e.target.value)} />
        {err && <div className="err">{err}</div>}{info && <div className="card text-sm">{info}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'in' ? 'Log in' : 'Create account'}</button>
      </form>
      <button className="mt-4 text-zinc-400 text-sm" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr('') }}>{mode === 'in' ? 'New here? Create an account' : 'Have an account? Log in'}</button>
    </div>
  )
}
