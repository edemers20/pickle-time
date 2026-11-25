-- Clear the stacked tagline and the generated sample bios. Real bios are written by hand.
update settings
set tagline = '', version = version + 1, updated_at = now()
where tagline in (
  '15 teams. 3 courts. 3 hours. One champion.',
  '15 teams. 3 courts. 3 hours. One Final everyone watches.'
);

update players
set bio = '', updated_at = now()
where bio like 'Sample bio:%';

update matches
set label = replace(label, ' · ', ', '), updated_at = now()
where position('·' in label) > 0;

update settings set version = version + 1, updated_at = now() where id = 1;
