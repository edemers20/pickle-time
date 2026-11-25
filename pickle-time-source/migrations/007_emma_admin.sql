-- Sample data already filled every team. Emma takes the lowest player id
-- and stays on that team. No extra player is added.
update players set is_admin = false;

update players
set
  name = 'Emma Rivera',
  bio = replace(replace(bio, 'Sam plays', 'Emma plays'), 'Admin or Sam', 'Admin or Emma'),
  is_admin = true
where id = (select min(id) from players);
