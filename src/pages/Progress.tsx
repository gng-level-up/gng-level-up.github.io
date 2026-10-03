import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabase'
import { ALL_EXERCISES } from '../plan'
import { today, addDays, dow, streaks, doneDates } from '../lib'
const A = '#3DD9FF'
const Chart = ({ title, empty, children }: { title: string; empty: boolean; children: any }) => <div className="card"><h3 className="font-bold mb-2">{title}</h3>{empty ? <p className="text-zinc-400 text-sm">No data yet.</p> : <div className="h-44"><ResponsiveContainer>{children}</ResponsiveContainer></div>}</div>
const ax = { stroke: '#71717a', fontSize: 11 }
export default function Progress() {
  const [days, setDays] = useState(30), [ex, setEx] = useState(ALL_EXERCISES[0]), [d, setD] = useState<any>(null), [err, setErr] = useState('')
  useEffect(() => { (async () => {
    const since = addDays(today(), -days)
    const [st, w, c, m, pr, dd] = await Promise.all([
      supabase.from('daily_stats').select('*').gte('date', since).order('date'), supabase.from('workouts').select('date,exercise,reps,weight').eq('completed', true).gte('date', addDays(today(), -days)).order('date'),
      supabase.from('cardio').select('*').gte('date', since).order('date'), supabase.from('meals').select('date').eq('completed', true).gte('date', since),
      supabase.from('personal_records').select('*'), doneDates()])
    const e = [st, w, c, m, pr].find(r => r.error)?.error; if (e) return setErr(e.message)
    setD({ st: st.data, w: w.data, c: c.data, m: m.data, pr: pr.data, dd }) })() }, [days])
  if (err) return <div className="err">{err}</div>
  if (!d) return <div className="text-zinc-400 text-center p-10">Loading…</div>
  const strength = Object.values((d.w as any[]).filter(r => r.exercise === ex).reduce((a: any, r) => { const x = a[r.date]; if (!x || r.reps > x.reps) a[r.date] = { date: r.date.slice(5), reps: r.reps }; return a }, {})) as any[]
  const weeks: Record<string, number> = {}; const wd = new Set<string>(d.w.map((r: any) => r.date)); wd.forEach(x => { const k = addDays(x, -((dow(x) + 6) % 7)); weeks[k] = (weeks[k] || 0) + 1 })
  const wk = Object.entries(weeks).sort().map(([k, v]) => ({ week: k.slice(5), workouts: v }))
  const st = streaks(d.dd), water = d.st.filter((r: any) => r.water_ml), sleep = d.st.filter((r: any) => r.sleep_minutes)
  const avg = (a: any[], k: string) => (a.length ? Math.round(a.reduce((s, r) => s + r[k], 0) / a.length) : 0)
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black">Progress</h1>
      <div className="grid grid-cols-2 gap-2">{[[7, 'Weekly'], [30, 'Monthly']].map(([n, l]) => <button key={n} onClick={() => setDays(n as number)} className={`rounded-xl py-3 ${days === n ? 'bg-accent text-black font-bold' : 'bg-zinc-800'}`}>{l}</button>)}</div>
      <div className="grid grid-cols-2 gap-3"><div className="card"><div className="text-zinc-400 text-sm">🔥 Current</div><div className="text-3xl font-black">{st.cur}</div></div><div className="card"><div className="text-zinc-400 text-sm">Longest</div><div className="text-3xl font-black">{st.best}</div></div></div>
      <Chart title="Weight (kg)" empty={!d.st.some((r: any) => r.weight)}><LineChart data={d.st.filter((r: any) => r.weight).map((r: any) => ({ date: r.date.slice(5), kg: Number(r.weight) }))}><CartesianGrid stroke="#27272a" /><XAxis dataKey="date" {...ax} /><YAxis domain={['auto', 'auto']} {...ax} width={34} /><Tooltip contentStyle={{ background: '#18181b', border: 0 }} /><Line dataKey="kg" stroke={A} strokeWidth={3} dot /></LineChart></Chart>
      <div className="card space-y-2"><select className="input" value={ex} onChange={e => setEx(e.target.value)}>{ALL_EXERCISES.map(x => <option key={x}>{x}</option>)}</select>
        {strength.length === 0 ? <p className="text-zinc-400 text-sm">No completed sets for this exercise yet.</p> : <div className="h-44"><ResponsiveContainer><LineChart data={strength}><CartesianGrid stroke="#27272a" /><XAxis dataKey="date" {...ax} /><YAxis {...ax} width={30} /><Tooltip contentStyle={{ background: '#18181b', border: 0 }} /><Line dataKey="reps" name="Best set (reps)" stroke={A} strokeWidth={3} dot /></LineChart></ResponsiveContainer></div>}</div>
      <Chart title="Running distance (km)" empty={!d.c.some((r: any) => r.distance)}><BarChart data={d.c.filter((r: any) => r.distance).map((r: any) => ({ date: r.date.slice(5), km: Number(r.distance) }))}><CartesianGrid stroke="#27272a" /><XAxis dataKey="date" {...ax} /><YAxis {...ax} width={30} /><Tooltip contentStyle={{ background: '#18181b', border: 0 }} /><Bar dataKey="km" fill={A} radius={[6, 6, 0, 0]} /></BarChart></Chart>
      <Chart title="Workouts per week" empty={wk.length === 0}><BarChart data={wk}><CartesianGrid stroke="#27272a" /><XAxis dataKey="week" {...ax} /><YAxis allowDecimals={false} {...ax} width={24} /><Tooltip contentStyle={{ background: '#18181b', border: 0 }} /><Bar dataKey="workouts" fill={A} radius={[6, 6, 0, 0]} /></BarChart></Chart>
      <div className="card"><h3 className="font-bold mb-2">Habits · last {days} days</h3><div className="grid grid-cols-2 gap-y-2 text-sm">
        <span>🏋️ Workout days</span><b>{wd.size}</b><span>🏃 Runs</span><b>{d.c.length}</b><span>🍳 Meals ticked</span><b>{d.m.length}</b>
        <span>💧 Avg water</span><b>{water.length ? avg(water, 'water_ml') + ' ml' : '–'}</b><span>😴 Avg sleep</span><b>{sleep.length ? Math.floor(avg(sleep, 'sleep_minutes') / 60) + 'h ' + (avg(sleep, 'sleep_minutes') % 60) + 'm' : '–'}</b></div></div>
      <div className="card"><h3 className="font-bold mb-2">🏆 Personal records</h3>{d.pr.length === 0 ? <p className="text-zinc-400 text-sm">Complete sets and runs to set your first PRs.</p> :
        d.pr.map((r: any) => <div key={r.id} className="flex justify-between py-1 text-sm"><span>{r.exercise}</span><b>{r.unit === 'min/km' ? `${Math.floor(r.value)}:${String(Math.round((r.value % 1) * 60)).padStart(2, '0')} /km` : `${r.value} ${r.unit}`}</b></div>)}
        <p className="text-xs text-zinc-500 mt-2">PRs come from normal training sets. No max-testing needed.</p></div>
    </div>)
}
