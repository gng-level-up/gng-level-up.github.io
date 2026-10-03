-- Run in Supabase SQL editor.
create table profiles(id uuid primary key references auth.users on delete cascade, name text not null default 'Athlete',
  height numeric, starting_weight numeric, current_weight numeric,
  goal text not null default 'Build muscle, increase strength and improve body composition.', created_at timestamptz default now());
create table workouts(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null, workout_type text not null, exercise text not null, set_number int not null, weight numeric, reps int,
  completed boolean not null default false, notes text, created_at timestamptz default now(), unique(user_id,date,exercise,set_number));
create table cardio(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null, activity text not null, duration numeric, distance numeric, notes text, created_at timestamptz default now());
create table meals(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null, meal text not null, food text not null, completed boolean not null default false, notes text,
  created_at timestamptz default now(), unique(user_id,date,meal,food));
create table daily_stats(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade default auth.uid(),
  date date not null, weight numeric, water_ml int, sleep_minutes int, created_at timestamptz default now(), unique(user_id,date));
create table personal_records(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade default auth.uid(),
  exercise text not null, value numeric not null, unit text not null, date date not null default current_date, unique(user_id,exercise));
create index on workouts(user_id,date); create index on workouts(user_id,exercise,date);
create index on cardio(user_id,date); create index on meals(user_id,date); create index on daily_stats(user_id,date);

alter table profiles enable row level security; alter table workouts enable row level security; alter table cardio enable row level security;
alter table meals enable row level security; alter table daily_stats enable row level security; alter table personal_records enable row level security;
create policy own_profile on profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy own on workouts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy own on cardio for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy own on meals for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy own on daily_stats for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy own on personal_records for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- Exactly two users; profile is created on signup (name comes from signup metadata).
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (select count(*) from profiles) >= 2 then raise exception 'This app is limited to two users'; end if;
  insert into profiles(id,name) values (new.id, coalesce(new.raw_user_meta_data->>'name','Athlete'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Friend sharing: only these fields leave the private tables (no meals, sleep, water, notes or weight history).
create function friend_summary() returns json language sql security definer set search_path=public stable as $$
select json_build_object('name',p.name,'current_weight',p.current_weight,
 'done_dates',(select coalesce(json_agg(d),'[]'::json) from (select date d from workouts where user_id=p.id and completed union select date from cardio where user_id=p.id) x),
 'runs_30d',(select count(*) from cardio where user_id=p.id and date>=current_date-30),
 'recent',(select coalesce(json_agg(r),'[]'::json) from (select distinct date, workout_type from workouts where user_id=p.id and completed order by date desc limit 5) r),
 'prs',(select coalesce(json_agg(q),'[]'::json) from (select exercise,value,unit from personal_records where user_id=p.id) q))
from profiles p where p.id<>auth.uid() limit 1; $$;
revoke all on function friend_summary() from public, anon; grant execute on function friend_summary() to authenticated;
