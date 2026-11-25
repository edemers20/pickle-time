-- 013 put the admin back as Emma Rivera. Drop the sample surname. She stays the
-- is_admin player and still signs in with the admin password. The other default
-- players stay Player 1 through Player 29, with nicknames and stat cards untouched.
update players
set name = 'Emma',
    updated_at = now()
where is_admin
  and id = (select min(id) from players where is_admin);

update players as p
set name = 'Player ' || numbered.n::text,
    updated_at = now()
from (
  select id, row_number() over (order by id) as n
  from players
  where id between 1 and 30
    and not (is_admin and id = (select min(id) from players where is_admin))
) as numbered
where p.id = numbered.id
  and p.name is distinct from ('Player ' || numbered.n::text);

update settings set version = version + 1, updated_at = now() where id = 1;
