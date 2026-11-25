# Pickle Time

A mobile-first site for a 15-team doubles pickleball tournament (30 players, 3 courts). The clock runs 3:00 PM to 7:00 PM. Everyone opens the same link:

- **Spectators** follow live scores, group standings, the playoff bracket and player cards.
- **Players** also pick their team once to see "You play next: vs X on Court N at T", and edit their own player card from a personal link.
- **The admin** enters scores, seeds the playoffs, moves teams between slots, hands out byes, creates ad-hoc matches and edits teams and players.

It ships with placeholder teams (Team 1 through Team 15) and a free-agent player list, so it works right away. Rename teams and players from the admin desk, then untick "sample roster" under Settings. Groups are Red, Green, and Blue. The database still stores those as A, B, and C.

## Tournament format

| Phase | Time | Details |
| --- | --- | --- |
| Start buffer | 0:00 to 0:10 | Check-in and warm-up. |
| Group play | 0:10 to 1:50 | 3 groups of 5 (Red on Court 1, Green on Court 2, Blue on Court 3). Full round robin, 10 rounds of 10 minutes (round 1 at 0:10 through round 10 at 1:40). To 11, win by 1, 8-minute cap. Order by group position: 1v2, 3v4, 1v5, 2v3, 4v5, 1v3, 2v5, 1v4, 3v5, 2v4, so no team plays back-to-back. |
| Seeding | 1:50 | All 15 teams on one table, ignoring group: wins, then point differential with each game's margin capped at ±7, then fewest points allowed, then head-to-head if they played, otherwise stable order. Seeds 1 and 2 bye to the semis, 3 to 6 play a quarterfinal, 7 to 15 are done. |
| Quarterfinals | 1:55 to 2:06 | Court 1: seed 3 vs seed 6. Court 2: seed 4 vs seed 5. To 11, win by 2, 11-minute cap. Court 3 is open so seeds 1 and 2 can warm up. |
| Semifinals | 2:08 to 2:19 | Court 1: seed 1 vs the winner of seeds 4 and 5. Court 2: seed 2 vs the winner of seeds 3 and 6. Same cap. The losers share 3rd. |
| Final | 2:21 to about 2:50 | Court 1 only: the two semifinal winners. To 11, win by 2, no cap. |
| Awards | about 2:50 to 4:00 | Awards, then open courts through 7:00 PM. |

There is no Gold, Silver, or Bronze bracket and no separate 3rd-place game.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Now playing: current and next match on each court, your next match, players to watch. No status chip and no latest-results list. |
| `/schedule` | Every round by court, with an "All / My team" filter, results, and the "You play next" banner |
| `/pools` | Overall standings (the seeding table), with per-group tables underneath |
| `/bracket` | One tree: quarterfinals, semis (seeds 1 and 2 bye in), and the Final. Semifinal losers share 3rd |
| `/teams` | Free Agent Pool. Players are listed on their own, not grouped onto teams. The nav label stays Players. |
| `/players/[id]` | Player page: photo (or initials), name, nickname, about, and stats |
| `/players/[id]/edit?token=…` | The player's own editor (photo, nickname, bio, stats) |
| `/admin` | Tournament desk (passcode) |

## Run it locally

```bash
npm install
env -u DATABASE_URL npm run dev     # http://localhost:4317 (bound to 0.0.0.0)
```

Without `DATABASE_URL` the app uses an in-memory [PGlite](https://pglite.dev) database. It applies `migrations/*.sql` on startup, so every restart begins with fresh sample data. Admin passcode in local dev: **`pickle-admin`**.

```bash
npm run lint
npm run build    # next build, then node scripts/migrate.mjs (skips when DATABASE_URL is unset)
```

## How live sync works

All state lives in Postgres: `settings`, `teams`, `players` and `matches`. Every write runs in one transaction that also bumps `settings.version`.

Each browser polls `GET /api/state?v=<version it has>` every 5 seconds, and immediately when the tab regains focus or comes back online. Hidden tabs poll every 30 seconds.

- If nothing changed, the server reads one integer and replies `{ "version": N, "unchanged": true }`.
- If something changed, it returns the full snapshot (teams, players without secrets, matches, settings).

So a score entered on the admin's phone, or a bio edited on a player's phone, shows up on every other phone within about 5 seconds with no refresh. A match shows as live only after every earlier game has a final score, so a delay in score entry does not jump the board ahead. Standings, seeds, and the bracket are computed from the same snapshot (`src/lib/tourney.ts`), so every view agrees.

Photos are not part of the snapshot. They are stored as validated `data:image/…` URLs in Postgres and served as images from `/api/players/[id]/photo?v=<photoVersion>`, so polling stays small.

## Permissions (no accounts)

- **Admin.** `POST /api/admin/session` checks the passcode against `ADMIN_PASSCODE` and sets an `httpOnly`, `SameSite=Strict` cookie (`Secure` in production) holding an HMAC-signed 12-hour session. The signing key comes from `SESSION_SECRET` if set, otherwise from `ADMIN_PASSCODE`, so changing the passcode logs everyone out. Five wrong guesses lock that client out for a minute. In production with no `ADMIN_PASSCODE`, admin is disabled.
- **Players.** Each player logs in with their own name and password, then edits their card from their profile.
- **Spectators** can read everything and change nothing.

Write endpoints (`/api/admin`, `/api/admin/session`, `/api/players/[id]`) reject cross-site requests by checking `Origin` and `Sec-Fetch-Site`. They use parameterized SQL only, cap body sizes, and validate every field (lengths, integer ranges, at most 8 stats). Photos must be JPEG, PNG or WebP data URLs under about 300 KB; the browser resizes them to 400 px before upload. Bios are rendered as plain text.

## Admin desk

- **Scores:** pick a round, tap + and − or type scores, then **Mark live**, **Final** or **Reset**. Live is allowed only once earlier games have final scores. Ties can't be marked final.
- **Playoffs:** **Generate seeding from standings** fills the quarterfinals with seeds 3 to 6 and places seeds 1 and 2 in the semis. Quarterfinal winners fill in when those games are marked final, and reverting a result pulls the winner back out. A same-group quarterfinal is flagged, with a one-click swap of seeds 5 and 6. Any slot can still be overridden, and ad-hoc matches can be created on any court and time.
- **Pairing:** pairs are grouped by the court they start on (Court 1, 2, 3). Swap a name to trade places. To move a whole pair, drag it by its handle onto another pair (or tap one handle, then the other). The two pairs trade court slots and take over each other's group schedule. A pair can't be moved once one of its games is live, final or a bye; reset those scores first. **Finalize & show teams** makes the pairs public. Standings, the bracket and every matchup switch from "Team N" to "Name 1 & Name 2". The Now and Schedule tabs list real games, profiles show the teammate and upcoming games, and the Players tab groups people into their pairs. **Hide teams** undoes it. Until then the Players tab is the alphabetical free agent pool.
- **Players:** every player alphabetically. Edit names and press **Save**. Add, change or remove a photo (saved right away; it shows on their profile and everywhere their avatar appears). Make or remove admins (at least one admin must remain).
- **Settings:** event name, tagline, date, first-serve time (all times are computed from it), location, sample-roster badge.

## Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Set by the hosting platform | Postgres connection. Unset means in-memory PGlite. |
| `ADMIN_PASSCODE` | Secret | Admin passcode. Local dev falls back to `pickle-admin`; in production, unset means admin is disabled. |
| `SESSION_SECRET` | Optional secret | Separate key for signing admin cookies. Defaults to a key derived from `ADMIN_PASSCODE`. |

## Layout

```
migrations/            001 through 005 (005 renames the event, sets 15:00, and placeholder teams)
scripts/migrate.mjs    applies migrations at build time (advisory-locked)
cursor-app.json        { "database": "postgres" }
src/lib/               db.ts (pg / PGlite), tourney.ts (standings, seeding), auth.ts, data.ts, validate.ts
src/app/api/           state, admin, admin/session, players/[id], players/[id]/photo
src/app/…              pages listed above
```
