-- One color per team so the matchup pills are easy to tell apart.

update teams set color = case id
  when 1 then '#f43f5e'
  when 2 then '#38bdf8'
  when 3 then '#f59e0b'
  when 4 then '#a3e635'
  when 5 then '#c084fc'
  when 6 then '#fb7185'
  when 7 then '#2dd4bf'
  when 8 then '#facc15'
  when 9 then '#818cf8'
  when 10 then '#fb923c'
  when 11 then '#4ade80'
  when 12 then '#e879f9'
  when 13 then '#22d3ee'
  when 14 then '#f87171'
  when 15 then '#a78bfa'
  else color
end;

update settings set version = version + 1, updated_at = now() where id = 1;
