import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { MEALS } from '../plan'
import { today, patchStats, hm } from '../lib'
const CK = 'customFoods'
export default function Diet() {
  const date = today()
  const [done, setDone] = useState<Set<string>>(new Set()), [loading, setLoading] = useState(true), [err, setErr] = useState('')
  const [water, setWater] = useState(0), [bed, setBed] = useState(''), [wake, setWake] = useState(''), [sleep, setSleep] = useState<number | null>(null), [custom, setCustom] = useState('')
  const [extra, setExtra] = useState<Record<string, string[]>>(() => { try { return JSON.parse(localStorage.getItem(CK) || '{}') } catch { return {} } })
  useEffect(() => { (async () => {
    const [m, s] = await Promise.all([supabase.from('meals').select('meal,food,completed').eq('date', date), supabase.from('daily_stats').select('water_ml,sleep_minutes').eq('date', date).maybeSingle()])
    if (m.error || s.error) setErr((m.error || s.error)!.message)
    else { setDone(new Set(m.data!.filter((r: any) => r.completed).map((r: any) => r.meal + '|' + r.food))); setWater(s.data?.water_ml ?? 0); setSleep(s.data?.sleep_minutes ?? null) }
    setLoading(false) })() }, [])
  async function toggle(meal: string, food: string) {
    const k = meal + '|' + food, on = !done.has(k); setErr('')
    const n = new Set(done); on ? n.add(k) : n.delete(k); setDone(n)
    const { error } = await supabase.from('meals').upsert({ date, meal, food, completed: on }, { onConflict: 'user_id,date,meal,food' })
    if (error) { setErr(error.message); setDone(done) }
  }
  function addFood(meal: string) {
    const f = custom.trim(); if (!f) return
    const n = { ...extra, [meal]: [...(extra[meal] ?? []), f] }; setExtra(n); localStorage.setItem(CK, JSON.stringify(n)); setCustom('')
  }
  async function addWater(ml: number) {
    if (!(ml > 0 && ml <= 3000)) return setErr('Water amount must be 1–3000 ml.')
    const n = water + ml; setWater(n); setErr('')
    try { await patchStats({ water_ml: n }) } catch (e: any) { setWater(water); setErr(e.message) }
  }
  async function saveSleep() {
    if (!bed || !wake) return setErr('Enter both sleep and wake time.')
    const [bh, bm] = bed.split(':').map(Number), [wh, wm] = wake.split(':').map(Number)
    let mins = wh * 60 + wm - (bh * 60 + bm); if (mins <= 0) mins += 1440
    if (mins > 16 * 60) return setErr('That is over 16 hours. Check the times.')
    setErr(''); try { await patchStats({ sleep_minutes: mins }); setSleep(mins) } catch (e: any) { setErr(e.message) }
  }
  const [cw, setCw] = useState('')
  if (loading) return <div className="text-zinc-400 text-center p-10">Loading…</div>
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Diet</h1>
      <p className="text-zinc-400 text-sm">Eat enough to train, grow and recover. Tick what you ate.</p>
      {err && <div className="err">{err}</div>}
      {Object.entries(MEALS).map(([meal, foods]) => (
        <div key={meal} className="card space-y-1">
          <h3 className="font-bold mb-1">{meal}</h3>
          {[...foods, ...(extra[meal] ?? [])].map(f => <button key={f} onClick={() => toggle(meal, f)} className="w-full flex items-center gap-3 py-2 text-left"><span className={`w-7 h-7 rounded-lg grid place-items-center ${done.has(meal + '|' + f) ? 'bg-accent text-black' : 'bg-zinc-800'}`}>{done.has(meal + '|' + f) ? '✓' : ''}</span>{f}</button>)}
          <div className="flex gap-2 pt-1"><input className="input" placeholder="Add food" onChange={e => setCustom(e.target.value)} onFocus={() => setCustom('')} /><button className="btn2" onClick={() => addFood(meal)}>Add</button></div>
        </div>))}
      <div className="card space-y-3"><h3 className="font-bold">💧 Water: {(water / 250).toFixed(water % 250 ? 1 : 0)} / 8 glasses</h3>
        <div className="bar"><div style={{ width: Math.min(100, water / 20) + '%' }} /></div>
        <div className="grid grid-cols-2 gap-2"><button className="btn2" onClick={() => addWater(250)}>+250 ml</button><button className="btn2" onClick={() => addWater(500)}>+500 ml</button></div>
        <div className="flex gap-2"><input className="input" inputMode="numeric" placeholder="Custom ml" value={cw} onChange={e => setCw(e.target.value)} /><button className="btn2" onClick={() => { addWater(Number(cw)); setCw('') }}>Add</button></div></div>
      <div className="card space-y-3"><h3 className="font-bold">😴 Sleep{sleep != null ? `: ${hm(sleep)}` : ''}</h3>
        <div className="flex gap-2"><label className="flex-1 text-xs text-zinc-400">Sleep time<input type="time" className="input mt-1" value={bed} onChange={e => setBed(e.target.value)} /></label><label className="flex-1 text-xs text-zinc-400">Wake time<input type="time" className="input mt-1" value={wake} onChange={e => setWake(e.target.value)} /></label></div>
        <button className="btn2 w-full" onClick={saveSleep}>Save sleep</button></div>
    </div>)
}
