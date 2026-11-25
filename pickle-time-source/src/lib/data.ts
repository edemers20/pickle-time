import "server-only";
import { sql, type Query } from "./db";
import { computeSeeds, winnerOf, type Match, type Player, type Settings, type Stat, type Team, type TourneyState } from "./tourney";

type SettingsRow = {
  event_name: string;
  tagline: string;
  event_date: string;
  start_time: string;
  location: string;
  sample_data: boolean;
  teams_revealed: boolean;
  version: string | number;
  updated_at: Date | string;
};

type TeamRow = { id: number; name: string; pool: Team["pool"]; pool_pos: number; color: string; seed: number | null };

type PlayerRow = {
  id: number;
  team_id: number;
  slot: number;
  name: string;
  nickname: string;
  bio: string;
  stats: Stat[] | string;
  photo_version: number;
  has_photo: boolean;
  is_admin: boolean;
};

type MatchRow = {
  id: number;
  code: string | null;
  phase: Match["phase"];
  bracket: Match["bracket"];
  pool: Match["pool"];
  label: string;
  round: number;
  court: number;
  start_min: number;
  src_a: string | null;
  src_b: string | null;
  team_a: number | null;
  team_b: number | null;
  score_a: number | null;
  score_b: number | null;
  status: Match["status"];
};

export const MATCH_COLUMNS =
  "id, code, phase, bracket, pool, label, round, court, start_min, src_a, src_b, team_a, team_b, score_a, score_b, status";

export function toMatch(r: MatchRow): Match {
  return {
    id: r.id,
    code: r.code,
    phase: r.phase,
    bracket: r.bracket,
    pool: r.pool,
    label: r.label,
    round: r.round,
    court: r.court,
    startMin: r.start_min,
    srcA: r.src_a,
    srcB: r.src_b,
    teamA: r.team_a,
    teamB: r.team_b,
    scoreA: r.score_a,
    scoreB: r.score_b,
    status: r.status,
  };
}

export function toTeam(r: TeamRow): Team {
  return { id: r.id, name: r.name, pool: r.pool, poolPos: r.pool_pos, color: r.color, seed: r.seed };
}

export async function getVersion(): Promise<number> {
  const rows = await sql<{ version: string | number }>("select version from settings where id = 1");
  return Number(rows[0]?.version ?? 0);
}

export async function getState(): Promise<TourneyState> {
  const [settingsRows, teamRows, playerRows, matchRows] = await Promise.all([
    sql<SettingsRow>(
      "select event_name, tagline, event_date, start_time, location, sample_data, teams_revealed, version, updated_at from settings where id = 1",
    ),
    sql<TeamRow>("select id, name, pool, pool_pos, color, seed from teams order by pool, pool_pos"),
    sql<PlayerRow>(
      "select id, team_id, slot, name, nickname, bio, stats, photo_version, (photo is not null) as has_photo, is_admin from players order by team_id, slot, id",
    ),
    sql<MatchRow>(`select ${MATCH_COLUMNS} from matches order by start_min, court, id`),
  ]);
  const s = settingsRows[0];
  const settings: Settings = {
    eventName: s.event_name,
    tagline: s.tagline,
    eventDate: s.event_date,
    startTime: s.start_time,
    location: s.location,
    sampleData: s.sample_data,
    teamsRevealed: s.teams_revealed === true,
  };
  const players: Player[] = playerRows.map((r) => ({
    id: r.id,
    teamId: r.team_id,
    slot: r.slot,
    name: r.name,
    nickname: r.nickname,
    bio: r.bio,
    stats: typeof r.stats === "string" ? (JSON.parse(r.stats) as Stat[]) : r.stats,
    photoVersion: r.photo_version,
    hasPhoto: r.has_photo,
    isAdmin: r.is_admin === true,
  }));
  return {
    version: Number(s.version),
    updatedAt: new Date(s.updated_at).toISOString(),
    settings,
    teams: teamRows.map(toTeam),
    players,
    matches: matchRows.map(toMatch),
  };
}

export async function bumpVersion(q: Query) {
  await q("update settings set version = version + 1, updated_at = now() where id = 1");
}

/** Pushes the winner of every finished playoff match into the slots that reference it. */
export async function propagateWinners(q: Query) {
  const matches = (await q<MatchRow>(`select ${MATCH_COLUMNS} from matches where phase = 'playoff'`)).map(toMatch);
  for (const m of matches) {
    if (!m.code) continue;
    const w = winnerOf(m);
    if (w === null) continue;
    const ref = `winner:${m.code}`;
    await q("update matches set team_a = $1, updated_at = now() where src_a = $2 and team_a is distinct from $1 and status <> 'final'", [w, ref]);
    await q("update matches set team_b = $1, updated_at = now() where src_b = $2 and team_b is distinct from $1 and status <> 'final'", [w, ref]);
  }
}

/**
 * Puts teams into the seeded playoff slots (seeds 3 to 6 in the quarterfinals, seeds 1 and 2
 * in the semis). Winner-of slots stay empty until those games finish. With `reset`,
 * every playoff game goes back to scheduled and winner slots are emptied; otherwise
 * games already underway are left alone.
 */
export async function fillFromSeeds(q: Query, { reset }: { reset: boolean }) {
  const teams = (await q<TeamRow>("select id, name, pool, pool_pos, color, seed from teams")).map(toTeam);
  const bySeed = new Map(teams.filter((t) => t.seed !== null).map((t) => [t.seed!, t.id]));
  const matches = (await q<MatchRow>(`select ${MATCH_COLUMNS} from matches where phase = 'playoff'`)).map(toMatch);
  const slot = (src: string | null, current: number | null) => {
    if (src?.startsWith("seed:")) return bySeed.get(Number(src.slice(5))) ?? null;
    return reset ? null : current;
  };
  for (const m of matches) {
    if (!reset && m.status !== "scheduled") continue;
    await q(
      `update matches set team_a = $1, team_b = $2${reset ? ", score_a = null, score_b = null, status = 'scheduled'" : ""}, updated_at = now() where id = $3`,
      [slot(m.srcA, m.teamA), slot(m.srcB, m.teamB), m.id],
    );
  }
  await propagateWinners(q);
}

/** Seeds every team from the overall table and fills the playoff slots. Resets playoff results. */
export async function generateSeeding(q: Query) {
  const teams = (await q<TeamRow>("select id, name, pool, pool_pos, color, seed from teams")).map(toTeam);
  const matches = (await q<MatchRow>(`select ${MATCH_COLUMNS} from matches`)).map(toMatch);
  const seeds = computeSeeds(teams, matches);
  await q("update teams set seed = null");
  for (const { teamId, seed } of seeds) {
    await q("update teams set seed = $1 where id = $2", [seed, teamId]);
  }
  await fillFromSeeds(q, { reset: true });
  return seeds.length;
}

/** Gives `teamId` the seed `seed`; whoever held it takes the team's old seed. */
export async function assignSeed(q: Query, teamId: number, seed: number | null) {
  const rows = await q<{ seed: number | null }>("select seed from teams where id = $1", [teamId]);
  if (!rows[0]) return false;
  const old = rows[0].seed;
  if (seed !== null) await q("update teams set seed = $1 where seed = $2 and id <> $3", [old, seed, teamId]);
  await q("update teams set seed = $1 where id = $2", [seed, teamId]);
  return true;
}

export async function swapSeeds(q: Query, a: number, b: number) {
  await q("update teams set seed = case when seed = $1 then $2 when seed = $2 then $1 else seed end where seed in ($1, $2)", [a, b]);
}
