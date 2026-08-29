create type public.user_role as enum ('patient','caregiver','cma','audiologist','admin','supplier');
create type public.visit_status as enum ('draft','booked','assigned','on_the_way','arrived','setup','testing','review','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id),
  cma_id uuid references public.profiles(id),
  audiologist_id uuid references public.profiles(id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.visit_status not null default 'draft',
  address jsonb not null default '{}'::jsonb,
  intake jsonb not null default '{}'::jsonb,
  results jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.visits enable row level security;
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "patients read own visits" on public.visits for select using (auth.uid() = patient_id);
