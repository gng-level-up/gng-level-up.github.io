import { supabase } from './supabase'
export const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const today = () => fmt(new Date())
export const addDays = (s: string, n: number) => { const d = new Date(s + 'T00:00'); d.setDate(d.getDate() + n); return fmt(d) }
export const dow = (s: string) => new Date(s + 'T00:00').getDay()
export const mmss = (min: number) => { const t = Math.round(min * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` }
export const pace = (dur: number, dist: number) => (dist > 0 ? mmss(dur / dist) + '/km' : '–')
export const hm = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
/** Sundays never break a streak; today doesn't break it until the day is over. */
export function streaks(done: Set<string>) {
  const t = today(); let cur = 0
  for (let d = t, i = 0; i < 800; d = addDays(d, -1), i++) {
    if (dow(d) === 0) continue
    if (done.has(d)) cur++; else if (d === t) continue; else break
  }
  const dates = [...done].sort(); let best = 0, run = 0
  if (dates.length) for (let d = dates[0]; d <= t; d = addDays(d, 1)) {
    if (dow(d) === 0) continue
    if (done.has(d)) { run++; best = Math.max(best, run) } else if (d !== t) run = 0
  }
  return { cur, best }
}
export function consistency(done: Set<string>, days = 28) {
  const t = today(); let planned = 0, hit = 0
  for (let i = 0; i < days; i++) { const d = addDays(t, -i); if (dow(d) === 0) continue; planned++; if (done.has(d)) hit++ }
  return { hit, planned }
}
export async function patchStats(patch: Record<string, number | null>, date = today()) {
  const { data: u } = await supabase.auth.getUser(); if (!u.user) throw new Error('Not signed in')
  const { error } = await supabase.from('daily_stats').upsert({ user_id: u.user.id, date, ...patch }, { onConflict: 'user_id,date' })
  if (error) throw error
}
/** Only records real improvements. lower=true for things like pace. */
export async function updatePR(exercise: string, value: number, unit: string, lower = false) {
  if (!(value > 0)) return
  const { data, error } = await supabase.from('personal_records').select('value').eq('exercise', exercise).maybeSingle()
  if (error) throw error
  if (data && (lower ? value >= Number(data.value) : value <= Number(data.value))) return
  const { error: e2 } = await supabase.from('personal_records').upsert({ exercise, value, unit, date: today() }, { onConflict: 'user_id,exercise' })
  if (e2) throw e2
}
export async function doneDates(): Promise<Set<string>> {
  const [w, c] = await Promise.all([supabase.from('workouts').select('date').eq('completed', true), supabase.from('cardio').select('date')])
  if (w.error) throw w.error; if (c.error) throw c.error
  return new Set([...(w.data ?? []), ...(c.data ?? [])].map((r: any) => r.date as string))
}
