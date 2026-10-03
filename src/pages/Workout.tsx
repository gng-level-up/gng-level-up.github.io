import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { PLAN, PR_EXERCISES, TIPS } from '../plan'
import { today, dow, pace, updatePR } from '../lib'
type S = { weight: string; reps: string; done: boolean }
export default function Workout() {
  const date = today(), day = PLAN[dow(date)]
  if (day.kind === 'rest') return <div className="card text-center py-10"><div className="text-5xl">😴</div><h2 className="text-2xl font-bold mt-3">Rest day</h2><p className="text-zinc-400 mt-1">No structured workout. Recovery is part of the plan.</p></div>
  return day.kind === 'cardio' ? <Cardio title={day.title} options={day.options!} /> : <Strength />
}
function Strength() {
  const date = today(), day = PLAN[dow(date)], ex = day.ex!
  const [sets, setSets] = useState<Record<string, S[]>>({}), [notes, setNotes] = useState<Record<string, string>>({})
  const [prev, setPrev] = useState<Record<string, string>>({}), [loading, setLoading] = useState(true), [err, setErr] = useState(''), [msg, setMsg] = useState('')
  useEffect(() => { (async () => {
    const names = ex.map(e => e.name)
    const [t, p] = await Promise.all([
      supabase.from('workouts').select('*').eq('date', date),
      supabase.from('workouts').select('exercise,date,set_number,weight,reps').in('exercise', names).eq('completed', true).lt('date', date).order('date', { ascending: false }).limit(400)])
    if (t.error || p.error) { setErr((t.error || p.error)!.message); setLoading(false); return }
    const s: Record<string, S[]> = {}, n: Record<string, string> = {}
    ex.forEach(e => { s[e.name] = Array.from({ length: e.sets }, () => ({ weight: '', reps: '', done: false })) })
    t.data!.forEach((r: any) => { if (s[r.exercise]?.[r.set_number - 1]) s[r.exercise][r.set_number - 1] = { weight: r.weight ?? '' ? String(r.weight) : '', reps: r.reps != null ? String(r.reps) : '', done: r.completed }; if (r.notes) n[r.exercise] = r.notes })
    const pv: Record<string, string> = {}, last: Record<string, string> = {}
    p.data!.forEach((r: any) => { if (!last[r.exercise]) last[r.exercise] = r.date; if (last[r.exercise] === r.date) pv[r.exercise] = (pv[r.exercise] ? pv[r.exercise] + ', ' : '') + `${r.reps}${r.weight ? '×' + r.weight + 'kg' : ''}` })
    setSets(s); setNotes(n); setPrev(pv); setLoading(false)
  })() }, [])
  const upd = (name: string, i: number, patch: Partial<S>) => setSets(s => ({ ...s, [name]: s[name].map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  async function save(names: string[], markDone: boolean) {
    setErr(''); setMsg('')
    const rows: any[] = []
    for (const name of names) for (let i = 0; i < sets[name].length; i++) {
      const s = sets[name][i], reps = s.reps === '' ? null : Number(s.reps), w = s.weight === '' ? null : Number(s.weight)
      if (reps !== null && (!Number.isInteger(reps) || reps < 0 || reps > 200)) return setErr(`${name}, set ${i + 1}: reps must be 0–200.`)
      if (w !== null && (isNaN(w) || w < 0 || w > 100)) return setErr(`${name}, set ${i + 1}: weight must be 0–100 kg.`)
      const done = markDone ? reps !== null && reps > 0 : s.done
      if (done && !reps) return setErr(`${name}, set ${i + 1}: add reps before ticking it.`)
      rows.push({ date, workout_type: day.title, exercise: name, set_number: i + 1, weight: w, reps, completed: done, notes: notes[name] || null })
    }
    const { error } = await supabase.from('workouts').upsert(rows, { onConflict: 'user_id,date,exercise,set_number' })
    if (error) return setErr(error.message)
    try { for (const name of names.filter(n => PR_EXERCISES.includes(n))) { const best = Math.max(0, ...rows.filter(r => r.exercise === name && r.completed).map(r => r.reps)); await updatePR(name, best, 'reps') } } catch (e: any) { return setErr(e.message) }
    if (markDone) setSets(s => { const c = { ...s }; names.forEach(n => (c[n] = c[n].map(x => ({ ...x, done: x.reps !== '' && Number(x.reps) > 0 })))); return c })
    setMsg(names.length > 1 ? 'Workout saved. Nice work 🔥' : 'Exercise saved ✅')
  }
  if (loading) return <div className="text-zinc-400 text-center p-10">Loading workout…</div>
  return (
    <div className="space-y-4">
      <div><div className="text-zinc-400 text-sm">Today</div><h1 className="text-3xl font-black">{day.title}</h1></div>
      {err && <div className="err">{err}</div>}{msg && <div className="card text-accent text-sm">{msg}</div>}
      {ex.map((e, k) => (
        <div key={e.name + k} className="card space-y-2">
          <div className="flex justify-between gap-2"><h3 className="font-bold">{e.name}</h3><span className="text-zinc-400 text-sm whitespace-nowrap">{e.sets} × {e.reps}</span></div>
          <p className="text-xs text-zinc-400">{prev[e.name] ? `Last time: ${prev[e.name]}. ` : 'No previous log yet. '}{TIPS[k % TIPS.length]}</p>
          {sets[e.name].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-12 text-sm text-zinc-400">Set {i + 1}</span>
              <input className="input" inputMode="decimal" placeholder="kg" value={s.weight} onChange={x => upd(e.name, i, { weight: x.target.value })} />
              <input className="input" inputMode="numeric" placeholder="reps" value={s.reps} onChange={x => upd(e.name, i, { reps: x.target.value })} />
              <button aria-label="Set done" onClick={() => upd(e.name, i, { done: !s.done })} className={`w-12 h-12 shrink-0 rounded-xl text-xl ${s.done ? 'bg-accent text-black' : 'bg-zinc-800'}`}>{s.done ? '✓' : ''}</button>
            </div>))}
          <input className="input" placeholder="Notes (form, pauses, tempo…)" value={notes[e.name] ?? ''} onChange={x => setNotes(n => ({ ...n, [e.name]: x.target.value }))} />
          <button className="btn2 w-full" onClick={() => save([e.name], true)}>Complete exercise</button>
        </div>))}
      <button className="btn" onClick={() => save(ex.map(e => e.name), true)}>COMPLETE WORKOUT</button>
    </div>)
}
function Cardio({ title, options }: { title: string; options: string[] }) {
  const [act, setAct] = useState(options[0]), [dist, setDist] = useState(''), [dur, setDur] = useState(''), [note, setNote] = useState('')
  const [hist, setHist] = useState<any[]>([]), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true)
  const load = async () => { const { data, error } = await supabase.from('cardio').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(15); if (error) setErr(error.message); else setHist(data!); setLoading(false) }
  useEffect(() => { load() }, [])
  async function add() {
    setErr(''); const d = Number(dur), k = dist === '' ? 0 : Number(dist)
    if (!(d > 0 && d <= 600)) return setErr('Enter a duration in minutes (1–600).')
    if (isNaN(k) || k < 0 || k > 100) return setErr('Distance must be 0–100 km.')
    setBusy(true)
    const { error } = await supabase.from('cardio').insert({ date: today(), activity: act, duration: d, distance: k || null, notes: note || null })
    if (!error && act === 'Easy run' && k >= 1) { try { await updatePR('Longest Run', k, 'km'); await updatePR('Fastest Run', d / k, 'min/km', true) } catch (e: any) { setErr(e.message) } }
    setBusy(false); if (error) return setErr(error.message)
    setDist(''); setDur(''); setNote(''); load()
  }
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">{title}</h1>
      <div className="card space-y-3">
        {options.length > 1 && <div className="grid grid-cols-2 gap-2">{options.map(o => <button key={o} onClick={() => setAct(o)} className={`rounded-xl py-3 ${act === o ? 'bg-accent text-black font-bold' : 'bg-zinc-800'}`}>{o}</button>)}</div>}
        <div className="flex gap-2"><input className="input" inputMode="decimal" placeholder="Distance (km)" value={dist} onChange={e => setDist(e.target.value)} /><input className="input" inputMode="decimal" placeholder="Minutes" value={dur} onChange={e => setDur(e.target.value)} /></div>
        <input className="input" placeholder="Notes" value={note} onChange={e => setNote(e.target.value)} />
        {err && <div className="err">{err}</div>}
        <button className="btn" disabled={busy} onClick={add}>{busy ? 'Saving…' : 'LOG SESSION'}</button>
        <p className="text-xs text-zinc-400">Keep it easy. You should be able to hold a conversation.</p>
      </div>
      <h2 className="font-bold">History</h2>
      {loading ? <p className="text-zinc-400">Loading…</p> : hist.length === 0 ? <p className="text-zinc-400">No sessions yet. Log your first one above.</p> :
        hist.map(h => <div key={h.id} className="card flex justify-between text-sm"><div><div className="font-semibold">{h.activity}</div><div className="text-zinc-400">{h.date}</div></div><div className="text-right">{h.distance ? `${h.distance} km · ` : ''}{h.duration} min{h.distance ? <div className="text-zinc-400">{pace(h.duration, h.distance)}</div> : null}</div></div>)}
    </div>)
}
