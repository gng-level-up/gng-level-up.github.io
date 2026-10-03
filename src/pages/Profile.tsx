import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { patchStats } from '../lib'
export default function Profile({ uid }: { uid: string }) {
  const [f, setF] = useState<any>(null), [err, setErr] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => { supabase.from('profiles').select('*').eq('id', uid).single().then(({ data, error }) => (error ? setErr(error.message) : setF({ ...data, height: data.height ?? '', starting_weight: data.starting_weight ?? '', current_weight: data.current_weight ?? '' }))) }, [])
  if (!f) return err ? <div className="err">{err}</div> : <div className="text-zinc-400 text-center p-10">Loading…</div>
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const num = (v: any, lo: number, hi: number, label: string) => { if (v === '') return null; const n = Number(v); if (isNaN(n) || n < lo || n > hi) throw new Error(`${label} must be between ${lo} and ${hi}.`); return n }
  async function save() {
    setErr(''); setOk('')
    try {
      if (!f.name.trim()) throw new Error('Name is required.')
      const row = { name: f.name.trim(), goal: f.goal.trim() || 'Build muscle, increase strength and improve body composition.', height: num(f.height, 100, 250, 'Height'), starting_weight: num(f.starting_weight, 30, 250, 'Starting weight'), current_weight: num(f.current_weight, 30, 250, 'Current weight') }
      setBusy(true)
      const { error } = await supabase.from('profiles').update(row).eq('id', uid); if (error) throw error
      if (row.current_weight) await patchStats({ weight: row.current_weight })
      setOk('Saved ✅')
    } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  const L = ({ l, k, ...p }: any) => <label className="block text-sm text-zinc-400">{l}<input className="input mt-1 text-white" value={f[k]} onChange={set(k)} {...p} /></label>
  return (
    <div className="space-y-4"><h1 className="text-3xl font-black">Profile</h1>
      <div className="card space-y-3"><L l="Name" k="name" /><L l="Height (cm)" k="height" inputMode="decimal" /><L l="Starting weight (kg)" k="starting_weight" inputMode="decimal" /><L l="Current weight (kg)" k="current_weight" inputMode="decimal" /><L l="Goal" k="goal" />
        <div className="text-sm text-zinc-400">Training equipment<div className="text-white mt-1">Dumbbells (adjustable by what you have) and bodyweight</div></div>
        {err && <div className="err">{err}</div>}{ok && <div className="text-accent text-sm">{ok}</div>}
        <button className="btn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      <button className="btn2 w-full" onClick={() => supabase.auth.signOut()}>Log out</button></div>)
}
