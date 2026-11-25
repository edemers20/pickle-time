-- Rename the event, set the 3:00 PM start, and use placeholder teams.
-- Groups stay A/B/C in the database. The site shows them as Red, Green, and Blue.

update settings
set event_name = 'Pickle Time',
    tagline = '',
    start_time = '15:00',
    updated_at = now()
where id = 1;

update teams
set name = 'Team ' || id,
    color = case pool
      when 'A' then '#ef4444'
      when 'B' then '#22c55e'
      else '#3b82f6'
    end;

update matches
set label = replace(replace(replace(label, 'Pool A', 'Red group'), 'Pool B', 'Green group'), 'Pool C', 'Blue group'),
    updated_at = now()
where label like '%Pool %';

update settings set version = version + 1, updated_at = now() where id = 1;
