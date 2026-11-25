create table if not exists settings (
  id integer primary key default 1 check (id = 1),
  event_name text not null default 'Pickle Cup',
  tagline text not null default '',
  event_date text not null default '',
  start_time text not null default '09:00',
  location text not null default '',
  sample_data boolean not null default true,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id serial primary key,
  name text not null,
  pool text not null check (pool in ('A', 'B', 'C')),
  pool_pos integer not null check (pool_pos between 1 and 5),
  color text not null default '#a3e635',
  seed integer,
  unique (pool, pool_pos)
);

create table if not exists players (
  id serial primary key,
  team_id integer not null references teams(id),
  slot integer not null default 1,
  name text not null,
  nickname text not null default '',
  bio text not null default '',
  stats jsonb not null default '[]'::jsonb,
  photo text,
  photo_version integer not null default 0,
  edit_token text not null,
  updated_at timestamptz not null default now()
);

create index if not exists players_team_idx on players (team_id);

create table if not exists matches (
  id serial primary key,
  code text unique,
  phase text not null check (phase in ('pool', 'playoff', 'adhoc')),
  bracket text check (bracket in ('gold', 'silver', 'bronze')),
  pool text,
  label text not null default '',
  round integer not null,
  court integer not null,
  start_min integer not null,
  src_a text,
  src_b text,
  team_a integer references teams(id),
  team_b integer references teams(id),
  score_a integer,
  score_b integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'final', 'bye')),
  updated_at timestamptz not null default now()
);

create index if not exists matches_round_idx on matches (round, court);
