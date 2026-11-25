-- Publish without the sample roster. Teams stay as numbered placeholders.
-- Emma keeps her name so the desk login still works. Everyone else is an open spot.
update teams
set name = 'Team ' || id::text, seed = null;

update players
set
  name = case when is_admin then name else '' end,
  nickname = '',
  bio = '',
  stats = '[]'::jsonb,
  photo = null,
  photo_version = 0,
  updated_at = now();

update matches
set score_a = null, score_b = null, status = 'scheduled', updated_at = now()
where status <> 'bye';

update settings set sample_data = false, version = version + 1, updated_at = now() where id = 1;
