-- Bye-to-semis playoffs. Pool slots are 10 minutes from 0:10 (round 10 ends at 1:50).
-- Seeding is pool-agnostic. Quarterfinals at 1:55 (#3 vs #6, #4 vs #5), semis at 2:08
-- (#1 vs winner of #4/#5, #2 vs winner of #3/#6), Final of the semi winners at 2:21.
-- Replaces the original Gold/Silver/Bronze slots. Does not drop shipped columns.
-- This file was rewritten before it was ever published.

update matches set start_min = 10 + (round - 1) * 10, updated_at = now() where phase = 'pool';

delete from matches
where phase = 'playoff'
  and code in (
    'GQFA', 'GQFB', 'SQFA', 'GSF1', 'GSF2', 'SQFB', 'SSF1', 'SSF2', 'BR1', 'GF', 'SF', 'BF',
    'SEMI-A', 'SEMI-B', 'THIRD', 'FINAL'
  );

insert into matches (code, phase, label, round, court, start_min, src_a, src_b) values
  ('QFA', 'playoff', 'QF-A', 11, 1, 115, 'seed:3', 'seed:6'),
  ('QFB', 'playoff', 'QF-B', 11, 2, 115, 'seed:4', 'seed:5'),
  ('SF1', 'playoff', 'SF-1', 12, 1, 128, 'seed:1', 'winner:QFB'),
  ('SF2', 'playoff', 'SF-2', 12, 2, 128, 'seed:2', 'winner:QFA'),
  ('FINAL', 'playoff', 'Final', 13, 1, 141, 'winner:SF1', 'winner:SF2')
on conflict (code) do nothing;

update teams set seed = null;

update settings
set tagline = '15 teams. 3 courts. 3 hours. One Final everyone watches.'
where id = 1 and tagline = '15 teams. 3 courts. 3 hours. One champion.';

-- Sample results (only while those games are still scheduled). A handful of finals so the
-- overall table looks real: one margin above the ±7 cap (A-R3), one 8-minute cap under 11 (B-R6),
-- and a projected QF-A that is a same-pool rematch cleared by swapping seeds #5 and #6.
-- One live game on each court.
with sample(code, a, b, st) as (
  values
    ('A-R3', 11, 2, 'final'), ('A-R8', 11, 8, 'final'), ('A-R4', 11, 4, 'final'), ('A-R2', 11, 9, 'final'),
    ('B-R3', 11, 7, 'final'), ('B-R6', 9, 7, 'final'), ('B-R4', 11, 6, 'final'),
    ('C-R1', 11, 8, 'final'),
    ('A-R1', 6, 5, 'live'), ('B-R1', 4, 3, 'live'), ('C-R4', 8, 6, 'live')
)
update matches m
set score_a = s.a, score_b = s.b, status = s.st, updated_at = now()
from sample s
where m.code = s.code
  and m.status = 'scheduled'
  and (select sample_data from settings where id = 1);

update settings set version = version + 1, updated_at = now() where id = 1;
