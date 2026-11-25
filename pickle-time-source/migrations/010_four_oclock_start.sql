-- Public start is 4:00 PM. Check-in (0–10) reads 4:00–4:10; awards (170–180) reads 6:50–7:00.

update settings
set start_time = '16:00',
    version = version + 1,
    updated_at = now()
where id = 1;
