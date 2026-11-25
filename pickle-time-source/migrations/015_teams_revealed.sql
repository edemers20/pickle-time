-- Until the admin finalizes pairs, spectators see "Team N" and no matchups.
alter table settings add column if not exists teams_revealed boolean not null default false;

update settings set version = version + 1, updated_at = now() where id = 1;
