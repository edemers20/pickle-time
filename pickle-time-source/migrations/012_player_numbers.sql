-- Number the default roster. Existing databases already applied 011, which put the
-- sample names back, so this has to run as its own migration. Nicknames and stat cards stay.
update players
set name = 'Player ' || id::text,
    updated_at = now()
where id between 1 and 30;

update settings set version = version + 1, updated_at = now() where id = 1;
