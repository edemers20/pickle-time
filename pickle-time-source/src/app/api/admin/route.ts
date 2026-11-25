import { connection } from "next/server";
import { isAdmin, newEditToken } from "@/lib/auth";
import { assignSeed, bumpVersion, fillFromSeeds, generateSeeding, MATCH_COLUMNS, propagateWinners, swapSeeds, toMatch } from "@/lib/data";
import { sql, tx, type Query } from "@/lib/db";
import { assertSameOrigin, handleError, HttpError, json, readJson } from "@/lib/http";
import { roundForStart, winnerOf, type Match } from "@/lib/tourney";
import { color, int, LIMITS, optionalInt, photo, stats, str, time } from "@/lib/validate";

const STATUSES = ["scheduled", "live", "final", "bye"] as const;

async function requireAdmin() {
  if (!(await isAdmin())) throw new HttpError(401, "Admin login required");
}

export async function GET() {
  await connection();
  try {
    await requireAdmin();
    const rows = await sql<{ id: number; name: string; team_id: number; edit_token: string }>(
      "select id, name, team_id, edit_token from players order by team_id, slot, id",
    );
    return json({ tokens: rows.map((r) => ({ playerId: r.id, name: r.name, teamId: r.team_id, token: r.edit_token })) });
  } catch (error) {
    return handleError(error);
  }
}

async function loadMatch(q: Query, id: number): Promise<Match> {
  const rows = await q<Parameters<typeof toMatch>[0]>(`select ${MATCH_COLUMNS} from matches where id = $1`, [id]);
  if (!rows[0]) throw new HttpError(404, "Match not found");
  return toMatch(rows[0]);
}

async function assertTeam(q: Query, id: number | null) {
  if (id === null) return;
  const rows = await q("select id from teams where id = $1", [id]);
  if (!rows[0]) throw new HttpError(400, `Team ${id} does not exist`);
}

function validateMatch(m: Match) {
  if (m.teamA !== null && m.teamA === m.teamB) throw new HttpError(400, "A team can't play itself");
  if (m.status === "final") {
    if (m.teamA === null || m.teamB === null) throw new HttpError(400, "Both teams are needed to finalize a match");
    if (m.scoreA === null || m.scoreB === null) throw new HttpError(400, "Enter both scores before marking final");
    if (m.scoreA === m.scoreB) throw new HttpError(400, "Pickleball games can't end tied");
  }
  if (m.status === "bye" && (m.teamA === null) === (m.teamB === null)) {
    throw new HttpError(400, "A bye needs exactly one team (the one advancing)");
  }
}

async function updateMatch(q: Query, body: Record<string, unknown>) {
  const id = int(body.id, "Match id", 1, 1_000_000);
  const before = await loadMatch(q, id);
  const next: Match = { ...before };
  if ("scoreA" in body) next.scoreA = optionalInt(body.scoreA, "Score A", 0, 99);
  if ("scoreB" in body) next.scoreB = optionalInt(body.scoreB, "Score B", 0, 99);
  if ("teamA" in body) next.teamA = optionalInt(body.teamA, "Team A", 1, 1_000_000);
  if ("teamB" in body) next.teamB = optionalInt(body.teamB, "Team B", 1, 1_000_000);
  if ("court" in body) next.court = int(body.court, "Court", 1, 9);
  if ("startMin" in body) next.startMin = int(body.startMin, "Start", 0, 600);
  if ("label" in body) next.label = str(body.label, "Label", LIMITS.label, { required: true });
  if ("status" in body) {
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) throw new HttpError(400, "Unknown status");
    next.status = body.status as Match["status"];
  }
  if (before.phase === "pool" && next.status === "bye") throw new HttpError(400, "Group games can't be byes");
  if (next.status === "live") {
    const earlier = await q<{ status: string; score_a: number | null; score_b: number | null }>(
      "select status, score_a, score_b from matches where id <> $1 and start_min < $2",
      [id, next.startMin],
    );
    const waiting = earlier.some((row) => row.status !== "bye" && (row.status !== "final" || row.score_a === null || row.score_b === null));
    if (waiting) throw new HttpError(400, "Enter scores for earlier games before marking this one live");
  }
  await assertTeam(q, next.teamA);
  await assertTeam(q, next.teamB);
  validateMatch(next);
  if (next.phase === "adhoc" && next.startMin !== before.startMin) next.round = roundForStart(next.startMin);

  await q(
    `update matches set score_a = $1, score_b = $2, team_a = $3, team_b = $4, court = $5, start_min = $6, label = $7,
       status = $8, round = $9, updated_at = now() where id = $10`,
    [next.scoreA, next.scoreB, next.teamA, next.teamB, next.court, next.startMin, next.label, next.status, next.round, id],
  );

  if (before.phase === "playoff" && before.code) {
    const oldWinner = winnerOf(before);
    if (oldWinner !== null && oldWinner !== winnerOf(next)) {
      const ref = `winner:${before.code}`;
      await q("update matches set team_a = null where src_a = $1 and team_a = $2 and status = 'scheduled'", [ref, oldWinner]);
      await q("update matches set team_b = null where src_b = $1 and team_b = $2 and status = 'scheduled'", [ref, oldWinner]);
    }
    await propagateWinners(q);
  }
}

async function createMatch(q: Query, body: Record<string, unknown>) {
  const teamA = optionalInt(body.teamA, "Team A", 1, 1_000_000);
  const teamB = optionalInt(body.teamB, "Team B", 1, 1_000_000);
  const court = int(body.court, "Court", 1, 9);
  const startMin = int(body.startMin, "Start", 0, 600);
  const label = str(body.label ?? "Exhibition", "Label", LIMITS.label) || "Exhibition";
  await assertTeam(q, teamA);
  await assertTeam(q, teamB);
  if (teamA !== null && teamA === teamB) throw new HttpError(400, "A team can't play itself");
  await q(
    "insert into matches (phase, label, round, court, start_min, team_a, team_b) values ('adhoc', $1, $2, $3, $4, $5, $6)",
    [label, roundForStart(startMin), court, startMin, teamA, teamB],
  );
}

async function swapPlayers(q: Query, body: Record<string, unknown>) {
  const a = int(body.a, "Player", 1, 1_000_000);
  const b = int(body.b, "Player", 1, 1_000_000);
  if (a === b) return;
  const rows = await q<{ id: number; team_id: number; slot: number }>("select id, team_id, slot from players where id in ($1, $2)", [a, b]);
  const left = rows.find((r) => r.id === a);
  const right = rows.find((r) => r.id === b);
  if (!left || !right) throw new HttpError(404, "Player not found");
  await q("update players set team_id = $1, slot = $2, updated_at = now() where id = $3", [right.team_id, right.slot, a]);
  await q("update players set team_id = $1, slot = $2, updated_at = now() where id = $3", [left.team_id, left.slot, b]);
}

/**
 * Moves pair `a` into team `b`'s court slot and vice versa. Pool games are bound to the slot (team id),
 * so players, name, color and seed trade places while pool, position and pool games stay put.
 * Playoff and ad-hoc games follow the pair.
 */
async function swapTeams(q: Query, body: Record<string, unknown>) {
  const a = int(body.a, "Team", 1, 1_000_000);
  const b = int(body.b, "Team", 1, 1_000_000);
  if (a === b) throw new HttpError(400, "Pick two different teams");
  const rows = await q<{ id: number }>("select id from teams where id in ($1, $2)", [a, b]);
  if (rows.length !== 2) throw new HttpError(404, "Team not found");
  const started = await q<{ id: number }>(
    "select id from matches where (team_a in ($1, $2) or team_b in ($1, $2)) and status <> 'scheduled' limit 1",
    [a, b],
  );
  if (started[0]) throw new HttpError(400, "One of these teams has already started a game. Reset its scores first.");
  await q("update players set team_id = case when team_id = $1 then $2 else $1 end, updated_at = now() where team_id in ($1, $2)", [a, b]);
  await q(
    `update teams t set name = o.name, color = o.color, seed = o.seed
       from teams o where t.id in ($1, $2) and o.id = case when t.id = $1 then $2 else $1 end`,
    [a, b],
  );
  for (const col of ["team_a", "team_b"]) {
    await q(`update matches set ${col} = case when ${col} = $1 then $2 else $1 end where phase <> 'pool' and ${col} in ($1, $2)`, [a, b]);
  }
}

async function updatePlayer(q: Query, body: Record<string, unknown>) {
  const id = int(body.id, "Player id", 1, 1_000_000);
  const sets: string[] = [];
  const params: unknown[] = [];
  const add = (expr: string, value: unknown) => {
    params.push(value);
    sets.push(expr.replace("?", `$${params.length}`));
  };
  if (body.name !== undefined) add("name = ?", str(body.name, "Name", LIMITS.name, { required: true }));
  if (body.nickname !== undefined) add("nickname = ?", str(body.nickname, "Nickname", LIMITS.nickname));
  if (body.bio !== undefined) add("bio = ?", str(body.bio, "Bio", LIMITS.bio, { multiline: true }));
  if (body.stats !== undefined) add("stats = ?::text::jsonb", JSON.stringify(stats(body.stats)));
  if (body.teamId !== undefined) {
    const teamId = int(body.teamId, "Team", 1, 1_000_000);
    await assertTeam(q, teamId);
    add("team_id = ?", teamId);
  }
  const p = photo(body.photo);
  if (p !== undefined) {
    add("photo = ?", p);
    sets.push("photo_version = photo_version + 1");
  }
  if (!sets.length) throw new HttpError(400, "Nothing to update");
  params.push(id);
  const rows = await q(`update players set ${sets.join(", ")}, updated_at = now() where id = $${params.length} returning id`, params);
  if (!rows[0]) throw new HttpError(404, "Player not found");
}

export async function POST(req: Request) {
  await connection();
  try {
    assertSameOrigin(req);
    await requireAdmin();
    const body = await readJson(req, LIMITS.photoChars + 20_000);
    const action = body.action;
    const result = await tx(async (q) => {
      let extra: Record<string, unknown> = {};
      switch (action) {
        case "updateMatch":
          await updateMatch(q, body);
          break;
        case "createMatch":
          await createMatch(q, body);
          break;
        case "deleteMatch": {
          const id = int(body.id, "Match id", 1, 1_000_000);
          const rows = await q("delete from matches where id = $1 and phase = 'adhoc' returning id", [id]);
          if (!rows[0]) throw new HttpError(400, "Only ad-hoc matches can be deleted");
          break;
        }
        case "generateSeeding":
          extra = { seeded: await generateSeeding(q) };
          break;
        case "updateTeam": {
          const id = int(body.id, "Team id", 1, 1_000_000);
          const name = str(body.name, "Team name", LIMITS.teamName, { required: true });
          const c = body.color === undefined ? null : color(body.color);
          const rows = await q("update teams set name = $1, color = coalesce($2, color) where id = $3 returning id", [name, c, id]);
          if (!rows[0]) throw new HttpError(404, "Team not found");
          break;
        }
        case "setSeed": {
          const id = int(body.id, "Team id", 1, 1_000_000);
          const seed = optionalInt(body.seed, "Seed", 1, 15);
          if (!(await assignSeed(q, id, seed))) throw new HttpError(404, "Team not found");
          break;
        }
        case "swapSeeds": {
          const a = int(body.a, "Seed", 1, 15);
          const b = int(body.b, "Seed", 1, 15);
          await swapSeeds(q, a, b);
          await fillFromSeeds(q, { reset: false });
          break;
        }
        case "applySeeds":
          await fillFromSeeds(q, { reset: false });
          break;
        case "updatePlayer":
          await updatePlayer(q, body);
          break;
        case "swapPlayers":
          await swapPlayers(q, body);
          break;
        case "swapTeams":
          await swapTeams(q, body);
          break;
        case "setAdmin": {
          const id = int(body.id, "Player", 1, 1_000_000);
          const flag = body.isAdmin === true;
          if (!flag) {
            const others = await q<{ n: number }>("select count(*)::int as n from players where is_admin and id <> $1", [id]);
            if (Number(others[0]?.n ?? 0) === 0) throw new HttpError(400, "Keep at least one admin");
          }
          const rows = await q("update players set is_admin = $1 where id = $2 returning id", [flag, id]);
          if (!rows[0]) throw new HttpError(404, "Player not found");
          break;
        }
        case "regenerateToken": {
          const id = int(body.playerId, "Player id", 1, 1_000_000);
          const token = newEditToken();
          const rows = await q("update players set edit_token = $1 where id = $2 returning id", [token, id]);
          if (!rows[0]) throw new HttpError(404, "Player not found");
          extra = { token };
          break;
        }
        case "setTeamsRevealed": {
          const revealed = body.revealed === true;
          if (revealed) {
            const short = await q<{ name: string }>(
              `select t.name from teams t left join players p on p.team_id = t.id and btrim(p.name) <> ''
               group by t.id, t.name having count(p.id) < 2 order by t.pool, t.pool_pos`,
            );
            if (short.length) throw new HttpError(400, `Every team needs two named players first. Missing: ${short.map((r) => r.name).join(", ")}`);
          }
          await q("update settings set teams_revealed = $1 where id = 1", [revealed]);
          break;
        }
        case "updateSettings":
          await q(
            `update settings set event_name = $1, tagline = $2, event_date = $3, start_time = $4, location = $5, sample_data = $6 where id = 1`,
            [
              str(body.eventName, "Event name", LIMITS.settings, { required: true }),
              str(body.tagline ?? "", "Tagline", LIMITS.settings),
              str(body.eventDate ?? "", "Date", LIMITS.settings),
              time(body.startTime),
              str(body.location ?? "", "Location", LIMITS.settings),
              body.sampleData === true,
            ],
          );
          break;
        default:
          throw new HttpError(400, "Unknown action");
      }
      await bumpVersion(q);
      return extra;
    });
    return json({ ok: true, ...result });
  } catch (error) {
    return handleError(error);
  }
}
