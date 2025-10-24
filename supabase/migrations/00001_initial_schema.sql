-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create business_cards table
create table public.business_cards (
  id uuid primary key default uuid_generate_v4(),
  image_path text not null,
  extracted_info jsonb not null default '{}'::jsonb,
  summary text,
  sentiment_score float,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create calls table
create table public.calls (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references public.business_cards(id),
  recording_path text,
  transcript text,
  summary text,
  duration interval,
  call_date date not null default current_date,
  call_time time not null default current_time,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create calendar_events table
create table public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references public.business_cards(id),
  title text not null,
  description text,
  date date not null,
  time time not null,
  duration interval default '1 hour'::interval,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create news_alerts table
create table public.news_alerts (
  id uuid primary key default uuid_generate_v4(),
  contact_id uuid references public.business_cards(id),
  company_name text not null,
  article_url text not null,
  title text not null,
  summary text,
  sentiment_score float,
  published_at timestamptz not null,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Policies
alter table public.business_cards enable row level security;
alter table public.calls enable row level security;
alter table public.calendar_events enable row level security;
alter table public.news_alerts enable row level security;

-- RLS Policies for authenticated users
create policy "Allow all operations for authenticated users" on public.business_cards
  for all using (auth.role() = 'authenticated');

create policy "Allow all operations for authenticated users" on public.calls
  for all using (auth.role() = 'authenticated');

create policy "Allow all operations for authenticated users" on public.calendar_events
  for all using (auth.role() = 'authenticated');

create policy "Allow all operations for authenticated users" on public.news_alerts
  for all using (auth.role() = 'authenticated');

-- Update timestamps trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updating timestamps
create trigger set_updated_at
  before update on public.business_cards
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.calls
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.calendar_events
  for each row execute procedure public.handle_updated_at();

create trigger set_updated_at
  before update on public.news_alerts
  for each row execute procedure public.handle_updated_at();