-- 012 numbered the admin as Player 1. She is Emma Rivera again, and the other
-- 29 default players are Player 1 through Player 29. Nicknames and stat cards stay.
update players
set name = 'Emma Rivera',
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
where p.id = numbered.id;

update settings set version = version + 1, updated_at = now() where id = 1;
