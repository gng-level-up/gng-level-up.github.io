import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { PLAN, REQUIRED_MEALS } from '../plan'
import { today, dow, doneDates, streaks, consistency, hm } from '../lib'
export default function Dashboard({ uid, go }: { uid: string; go: (t: string) => void }) {
  const date = today(), day = PLAN[dow(date)]
  const [d, setD] = useState<any>(null), [err, setErr] = useState('')
  useEffect(() => { (async () => {
    try {
      const [p, w, c, m, s, dd, f] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(), supabase.from('workouts').select('exercise,completed,set_number').eq('date', date),
        supabase.from('cardio').select('id').eq('date', date), supabase.from('meals').select('meal').eq('date', date).eq('completed', true),
        supabase.from('daily_stats').select('*').eq('date', date).maybeSingle(), doneDates(), supabase.rpc('friend_summary')])
      const e = [p, w, c, m, s].find(r => r.error)?.error; if (e) throw e
      const total = day.ex?.reduce((a, x) => a + x.sets, 0) ?? 0, ok = w.data!.filter((r: any) => r.completed).length
      setD({ p: p.data, pct: day.kind === 'strength' ? Math.round((100 * ok) / total) : day.kind === 'cardio' ? (c.data!.length ? 100 : 0) : 100,
        done: new Set(w.data!.filter((r: any) => r.completed).map((r: any) => r.exercise + r.set_number)), meals: new Set(m.data!.map((r: any) => r.meal)).size,
        s: s.data, dd, f: f.data })
    } catch (e: any) { setErr(e.message) } })() }, [])
  if (err) return <div className="err">{err}</div>
  if (!d) return <div className="text-zinc-400 text-center p-10">Loading…</div>
  const st = streaks(d.dd), me = consistency(d.dd), fr = d.f ? new Set<string>(d.f.done_dates) : null
  const Row = ({ l, v, p }: { l: string; v: string; p: number }) => <div><div className="flex justify-between text-sm"><span>{l}</span><span className="font-bold">{v}</span></div><div className="bar mt-1"><div style={{ width: Math.min(100, p) + '%' }} /></div></div>
  const water = d.s?.water_ml ?? 0, meals = Math.min(d.meals, REQUIRED_MEALS.length)
  return (
    <div className="space-y-4">
      <div><h1 className="text-4xl font-black leading-none">MONSTER <span className="text-accent">RECOMP</span></h1>
        <p className="text-zinc-400 mt-2">Welcome back, {d.p.name} · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p></div>
      <div className="card space-y-3"><h2 className="font-bold">Today's progress</h2>
        <Row l="Workout" v={d.pct + '%'} p={d.pct} /><Row l="Diet" v={`${meals}/${REQUIRED_MEALS.length} meals`} p={(100 * meals) / REQUIRED_MEALS.length} />
        <Row l="Water" v={`${(water / 250).toFixed(1)}/8 glasses`} p={water / 20} /><Row l="Sleep" v={d.s?.sleep_minutes ? hm(d.s.sleep_minutes) : 'Not logged'} p={((d.s?.sleep_minutes ?? 0) / 480) * 100} /></div>
      <div className="card"><div className="text-zinc-400 text-sm">Today's workout</div><h2 className="text-2xl font-black mb-2">{day.title}</h2>
        {day.ex?.map(e => <div key={e.name} className="flex justify-between py-1 text-sm"><span>{d.done.has(e.name + 1) ? '☑' : '☐'} {e.name}</span><span className="text-zinc-400">{e.sets} × {e.reps}</span></div>)}
        {day.kind === 'rest' && <p className="text-zinc-400 text-sm">Rest day. Eat, hydrate, sleep.</p>}
        {day.kind === 'cardio' && <p className="text-zinc-400 text-sm">{d.pct ? 'Logged. Nice.' : 'Easy pace. Log it in the Workout tab.'}</p>}
        {day.kind !== 'rest' && <button className="btn mt-3" onClick={() => go('work')}>{day.kind === 'strength' ? 'OPEN WORKOUT' : 'LOG SESSION'}</button>}</div>
      <div className="grid grid-cols-2 gap-3"><div className="card"><div className="text-zinc-400 text-sm">🔥 Streak</div><div className="text-4xl font-black">{st.cur}</div><div className="text-xs text-zinc-400">Longest {st.best}</div></div>
        <div className="card"><div className="text-zinc-400 text-sm">Weight</div><div className="text-4xl font-black">{d.p.current_weight ?? '–'}<span className="text-base"> kg</span></div></div></div>
      <div className="card space-y-3"><h2 className="font-bold">Training together</h2>
        {!d.f ? <p className="text-zinc-400 text-sm">Your friend hasn't joined yet. Once they sign up, you'll see each other's consistency here.</p> : <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-accent font-bold">YOU</div><div>{d.p.current_weight ?? '–'} kg</div><div>Streak: {st.cur}</div><div>Consistency: {me.hit}/{me.planned}</div></div>
            <div><div className="text-accent font-bold">{String(d.f.name).toUpperCase()}</div><div>{d.f.current_weight ?? '–'} kg</div><div>Streak: {streaks(fr!).cur}</div><div>Consistency: {consistency(fr!).hit}/{consistency(fr!).planned}</div></div></div>
          <div className="text-sm"><div className="text-zinc-400">{d.f.name}'s runs (30 days): {d.f.runs_30d}</div>
            {d.f.recent.length > 0 && <div className="mt-1">Recent: {d.f.recent.map((r: any) => `${r.workout_type} (${r.date.slice(5)})`).join(', ')}</div>}
            {d.f.prs.length > 0 && <div className="mt-1">PRs: {d.f.prs.map((r: any) => `${r.exercise} ${r.value} ${r.unit}`).join(' · ')}</div>}</div>
          <p className="text-xs text-zinc-500">Consistency = planned days completed in the last 4 weeks. Nobody gets ranked on weight or food.</p></>}</div>
    </div>)
}
