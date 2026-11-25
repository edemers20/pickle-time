alter table players add column if not exists is_admin boolean not null default false;

update players
set is_admin = true
where lower(split_part(btrim(name), ' ', 1)) = 'emma';

-- Emma joins a team only when that team still has an open slot.
-- A full draw of 15 teams of 2 is left as-is.
select setval(
  'players_id_seq',
  greatest((select coalesce(max(id), 1) from players), 1)
);

insert into players (team_id, slot, name, nickname, bio, stats, edit_token, is_admin)
select t.id,
       coalesce((select max(p.slot) from players p where p.team_id = t.id), 0) + 1,
       'Emma',
       '',
       '',
       '[]'::jsonb,
       replace(gen_random_uuid()::text, '-', ''),
       true
from teams t
where (select count(*) from players p where p.team_id = t.id) < 2
  and not exists (
    select 1 from players e where lower(split_part(btrim(e.name), ' ', 1)) = 'emma'
  )
order by t.id
limit 1;
