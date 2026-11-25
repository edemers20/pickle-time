export type PoolId = "A" | "B" | "C";
export type MatchStatus = "scheduled" | "live" | "final" | "bye";
export type Bracket = "gold" | "silver" | "bronze";

export type Settings = {
  eventName: string;
  tagline: string;
  eventDate: string;
  startTime: string;
  location: string;
  sampleData: boolean;
  /** Set from the desk once pairs are final. Until then spectators see "Team N" and no matchups. */
  teamsRevealed: boolean;
};

export type Team = {
  id: number;
  name: string;
  pool: PoolId;
  poolPos: number;
  color: string;
  seed: number | null;
};

export type Stat = { label: string; value: string };

export type Player = {
  id: number;
  teamId: number;
  slot: number;
  name: string;
  nickname: string;
  bio: string;
  stats: Stat[];
  photoVersion: number;
  hasPhoto: boolean;
  isAdmin: boolean;
};

export type Match = {
  id: number;
  code: string | null;
  phase: "pool" | "playoff" | "adhoc";
  bracket: Bracket | null;
  pool: PoolId | null;
  label: string;
  round: number;
  court: number;
  startMin: number;
  srcA: string | null;
  srcB: string | null;
  teamA: number | null;
  teamB: number | null;
  scoreA: number | null;
  scoreB: number | null;
  status: MatchStatus;
};

export type TourneyState = {
  version: number;
  updatedAt: string;
  settings: Settings;
  teams: Team[];
  players: Player[];
  matches: Match[];
};

export const POOLS: PoolId[] = ["A", "B", "C"];

/** Display names. A/B/C stay in the database so they don't read as a ranking. */
export const GROUP_NAME: Record<PoolId, string> = { A: "Red", B: "Green", C: "Blue" };

export function groupName(pool: PoolId): string {
  return `${GROUP_NAME[pool]} group`;
}
export const COURTS = [1, 2, 3];
export const POOL_ROUNDS = 10;

/** Minute offsets from the official start. */
export const TIMES = {
  checkIn: 0,
  poolStart: 10,
  poolSlot: 10,
  poolEnd: 110,
  seeding: 110,
  quarters: 115,
  semis: 128,
  final: 141,
  awards: 170,
  end: 180,
} as const;

export const ROUND_QF = 11;
export const ROUND_SEMIS = 12;
export const ROUND_FINAL = 13;

export const CODES = { qfA: "QFA", qfB: "QFB", sf1: "SF1", sf2: "SF2", final: "FINAL" } as const;

export function poolRoundStart(round: number): number {
  return TIMES.poolStart + (round - 1) * TIMES.poolSlot;
}

export function roundLabel(round: number): string {
  if (round <= POOL_ROUNDS) return `Round ${round}`;
  if (round === ROUND_QF) return "Quarterfinals";
  if (round === ROUND_SEMIS) return "Semifinals";
  if (round === ROUND_FINAL) return "Championship Final";
  return `Extra ${round - ROUND_FINAL}`;
}

export function shortRoundLabel(round: number): string {
  if (round <= POOL_ROUNDS) return `R${round}`;
  if (round === ROUND_QF) return "QF";
  if (round === ROUND_SEMIS) return "SF";
  if (round === ROUND_FINAL) return "Final";
  return `X${round - ROUND_FINAL}`;
}

/** Scoring rules shown next to each round. */
export function gameFormat(round: number): string {
  if (round <= POOL_ROUNDS) return "To 11, win by 1, 8-min cap";
  if (round === ROUND_QF || round === ROUND_SEMIS) return "To 11, win by 2, 11-min cap";
  if (round === ROUND_FINAL) return "To 11, win by 2, no cap";
  return "";
}

/** What a court is used for when it has no scheduled match in a playoff round. */
export function courtNote(round: number, court: number): string | null {
  if (round === ROUND_QF && court === 3) return "Open for seeds 1 and 2 to warm up";
  if (round === ROUND_SEMIS && court === 3) return "Open play";
  if (round === ROUND_FINAL && court !== 1) return "Final is on Court 1";
  return null;
}

/** Round an ad-hoc match belongs to, from its start offset. */
export function roundForStart(startMin: number): number {
  if (startMin < TIMES.poolEnd) return Math.min(POOL_ROUNDS, Math.max(1, Math.floor((startMin - TIMES.poolStart) / TIMES.poolSlot) + 1));
  if (startMin < TIMES.semis) return ROUND_QF;
  if (startMin < TIMES.final) return ROUND_SEMIS;
  if (startMin < TIMES.awards) return ROUND_FINAL;
  return ROUND_FINAL + 1;
}

export type Tier = "bye" | "qf" | "done";

export function tierForSeed(seed: number): Tier {
  if (seed <= 2) return "bye";
  if (seed <= 6) return "qf";
  return "done";
}

export const TIER_LABEL: { [K in Tier]: string } = {
  bye: "Bye to semis",
  qf: "Quarterfinal",
  done: "Done",
};

/** Formats a minute offset from the event start (e.g. "09:00") as a wall-clock time. */
export function clockTime(startTime: string, offsetMin: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(startTime.trim());
  if (!m) return `+${Math.floor(offsetMin / 60)}:${String(offsetMin % 60).padStart(2, "0")}`;
  const total = Number(m[1]) * 60 + Number(m[2]) + offsetMin;
  const h24 = Math.floor(total / 60) % 24;
  const mm = String(total % 60).padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? "AM" : "PM"}`;
}

/** "6:50 PM" and "7:00 PM" become "6:50-7:00PM". */
export function clockRange(startTime: string, fromMin: number, toMin: number): string {
  const a = clockTime(startTime, fromMin);
  const b = clockTime(startTime, toMin);
  const parse = (value: string) => {
    const m = /^(.+?) (AM|PM)$/.exec(value);
    return m ? { clock: m[1], meridiem: m[2] } : null;
  };
  const left = parse(a);
  const right = parse(b);
  if (left && right && left.meridiem === right.meridiem) return `${left.clock}-${right.clock}${left.meridiem}`;
  return `${a.replace(" ", "")}-${b.replace(" ", "")}`;
}

export function isDone(m: Match): boolean {
  return m.status === "final" || m.status === "bye";
}

/** Earlier games all have a score. A later game stays off "live" until this is true, so a delay in entering scores doesn't jump the board ahead. */
export function priorsScored(match: Match, matches: Match[]): boolean {
  return matches.every((m) => {
    if (m.id === match.id || m.startMin >= match.startMin || m.status === "bye") return true;
    return m.status === "final" && m.scoreA !== null && m.scoreB !== null;
  });
}

export function displayStatus(match: Match, matches: Match[]): Match["status"] {
  if (match.status === "live" && !priorsScored(match, matches)) return "scheduled";
  return match.status;
}

export function winnerOf(m: Match): number | null {
  if (m.status === "bye") return m.teamA ?? m.teamB ?? null;
  if (m.status !== "final" || m.scoreA === null || m.scoreB === null) return null;
  if (m.scoreA === m.scoreB) return null;
  return m.scoreA > m.scoreB ? m.teamA : m.teamB;
}

export function loserOf(m: Match): number | null {
  const w = winnerOf(m);
  if (w === null || m.status === "bye") return null;
  return w === m.teamA ? m.teamB : m.teamA;
}

export type TeamRecord = { wins: number; losses: number; pf: number; pa: number; played: number };

export function emptyRecord(): TeamRecord {
  return { wins: 0, losses: 0, pf: 0, pa: 0, played: 0 };
}

export function teamRecord(teamId: number, matches: Match[], filter?: (m: Match) => boolean): TeamRecord {
  const r = emptyRecord();
  for (const m of matches) {
    if (m.status !== "final" || m.scoreA === null || m.scoreB === null) continue;
    if (filter && !filter(m)) continue;
    let us: number, them: number;
    if (m.teamA === teamId) [us, them] = [m.scoreA, m.scoreB];
    else if (m.teamB === teamId) [us, them] = [m.scoreB, m.scoreA];
    else continue;
    r.played++;
    r.pf += us;
    r.pa += them;
    if (us > them) r.wins++;
    else if (us < them) r.losses++;
  }
  return r;
}

export function poolPlayComplete(matches: Match[]): boolean {
  const pool = matches.filter((m) => m.phase === "pool");
  return pool.length > 0 && pool.every(isDone);
}

export const MARGIN_CAP = 7;

export type OverallRow = TeamRecord & {
  team: Team;
  rank: number;
  diff: number;
  cappedDiff: number;
  note: "" | "H2H";
};

/**
 * One pool-agnostic table of all teams, from pool games only. Order: wins, point
 * differential with each game's margin capped at ±7, fewest points allowed,
 * head-to-head among the still-tied teams, then stable order (pool, position).
 */
export function overallStandings(teams: Team[], matches: Match[]): OverallRow[] {
  const poolGames = matches.filter((m) => m.phase === "pool" && m.status === "final" && m.scoreA !== null && m.scoreB !== null);
  const rows: OverallRow[] = teams.map((team) => {
    const r = teamRecord(team.id, poolGames);
    let capped = 0;
    for (const m of poolGames) {
      if (m.teamA !== team.id && m.teamB !== team.id) continue;
      const margin = m.teamA === team.id ? m.scoreA! - m.scoreB! : m.scoreB! - m.scoreA!;
      capped += Math.max(-MARGIN_CAP, Math.min(MARGIN_CAP, margin));
    }
    return { ...r, team, rank: 0, diff: r.pf - r.pa, cappedDiff: capped, note: "" };
  });
  const stable = (a: OverallRow, b: OverallRow) => a.team.pool.localeCompare(b.team.pool) || a.team.poolPos - b.team.poolPos;
  rows.sort((a, b) => b.wins - a.wins || b.cappedDiff - a.cappedDiff || a.pa - b.pa || stable(a, b));

  const ordered: OverallRow[] = [];
  for (let i = 0; i < rows.length; ) {
    let j = i + 1;
    while (j < rows.length && rows[j].wins === rows[i].wins && rows[j].cappedDiff === rows[i].cappedDiff && rows[j].pa === rows[i].pa) j++;
    const group = rows.slice(i, j);
    if (group.length > 1 && group.some((g) => g.played > 0)) {
      const ids = new Set(group.map((g) => g.team.id));
      const h2hWins = new Map<number, number>();
      let anyH2H = false;
      for (const m of poolGames) {
        if (m.teamA === null || m.teamB === null || !ids.has(m.teamA) || !ids.has(m.teamB)) continue;
        anyH2H = true;
        const w = winnerOf(m);
        if (w !== null) h2hWins.set(w, (h2hWins.get(w) ?? 0) + 1);
      }
      if (anyH2H) {
        group.sort((a, b) => (h2hWins.get(b.team.id) ?? 0) - (h2hWins.get(a.team.id) ?? 0) || stable(a, b));
        for (const g of group) g.note = "H2H";
      }
    }
    ordered.push(...group);
    i = j;
  }
  ordered.forEach((row, idx) => (row.rank = idx + 1));
  return ordered;
}

/** Seeds 1-15 straight from the overall table. */
export function computeSeeds(teams: Team[], matches: Match[]): { teamId: number; seed: number }[] {
  return overallStandings(teams, matches).map((r) => ({ teamId: r.team.id, seed: r.rank }));
}

/**
 * Quarterfinals that would be a same-pool rematch. Uses the teams already in the
 * slots, or the projected seeds when a slot is still empty.
 */
export function qfRematches(teams: Team[], matches: Match[]): { code: string; label: string; pool: PoolId; teams: [string, string] }[] {
  const bySeed = new Map(computeSeeds(teams, matches).map((s) => [s.seed, teams.find((t) => t.id === s.teamId)]));
  const side = (id: number | null, src: string | null) => {
    if (id !== null) return teams.find((t) => t.id === id);
    if (src?.startsWith("seed:")) return bySeed.get(Number(src.slice(5)));
    return undefined;
  };
  const out: { code: string; label: string; pool: PoolId; teams: [string, string] }[] = [];
  for (const code of [CODES.qfA, CODES.qfB]) {
    const m = matches.find((x) => x.code === code);
    if (!m) continue;
    const a = side(m.teamA, m.srcA);
    const b = side(m.teamB, m.srcB);
    if (a && b && a.pool === b.pool) out.push({ code, label: m.label, pool: a.pool, teams: [a.name, b.name] });
  }
  return out;
}

export function describeSource(src: string | null, matches: Match[]): string {
  if (!src) return "TBD";
  const [kind, value] = src.split(":");
  if (kind === "seed") return `Seed ${Number(value)}`;
  if (kind === "winner") {
    const m = matches.find((x) => x.code === value);
    return `Winner ${m?.label ?? value}`;
  }
  return "TBD";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function nextMatchFor(teamId: number, matches: Match[]): Match | null {
  return (
    [...matches]
      .filter((m) => (m.teamA === teamId || m.teamB === teamId) && !isDone(m))
      .sort((a, b) => a.startMin - b.startMin || a.court - b.court)[0] ?? null
  );
}

export type MyGameKind = "current" | "next" | "past";

/** Current game, then the next game (and any later ones still to play), then past games. */
export function gamesForTeam(teamId: number, matches: Match[]): { match: Match; kind: MyGameKind }[] {
  const mine = matches.filter((m) => m.teamA === teamId || m.teamB === teamId);
  const round = currentRound(matches);
  const undone = mine
    .filter((m) => !isDone(m))
    .sort((a, b) => a.startMin - b.startMin || a.court - b.court || a.id - b.id);
  const current =
    undone.find((m) => displayStatus(m, matches) === "live") ??
    undone.find((m) => round !== null && m.round === round) ??
    null;
  const later = undone.filter((m) => m.id !== current?.id);
  const past = mine
    .filter((m) => isDone(m))
    .sort((a, b) => b.startMin - a.startMin || b.court - a.court || b.id - a.id);
  const out: { match: Match; kind: MyGameKind }[] = [];
  if (current) out.push({ match: current, kind: "current" });
  for (const match of later) out.push({ match, kind: "next" });
  for (const match of past) out.push({ match, kind: "past" });
  return out;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** Pair label: both players' names, once the pair is filled in. Until then, the team name. */
export function teamDisplayName(team: Pick<Team, "id" | "name">, players: Pick<Player, "id" | "teamId" | "slot" | "name">[]): string {
  const side = teamRoster(team.id, players);
  const names = side.map((p) => p.name.trim()).filter(Boolean);
  if (side.length >= 2 && names.length === side.length) return `${names[0]} & ${names[1]}`;
  return team.name;
}

/** Public label: the pair's names once the desk has finalized teams, "Team N" before that. */
export function teamLabel(team: Pick<Team, "id" | "name">, state: Pick<TourneyState, "players" | "settings">): string {
  return state.settings.teamsRevealed ? teamDisplayName(team, state.players) : team.name;
}

export function teamRoster<P extends Pick<Player, "id" | "teamId" | "slot">>(teamId: number, players: P[]): P[] {
  return players.filter((p) => p.teamId === teamId).sort((a, b) => a.slot - b.slot || a.id - b.id);
}

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/** Default roster names ("Player 7"), or a pair made only of them ("Player 2 & Player 3"). */
export function isPlaceholderName(name: string): boolean {
  const parts = name.split("&").map((s) => s.trim());
  return parts.every((s) => s === "" || /^player\s*\d*$/i.test(s));
}

/** Alphabetical, with numbers in natural order ("Player 2" before "Player 10"). Placeholder names sort after real ones. */
export function compareNames(a: string, b: string): number {
  return Number(isPlaceholderName(a)) - Number(isPlaceholderName(b)) || nameCollator.compare(a.trim(), b.trim());
}

/** The pair's next games that haven't been played yet, soonest first. */
export function upcomingForTeam(teamId: number, matches: Match[]): Match[] {
  return matches
    .filter((m) => (m.teamA === teamId || m.teamB === teamId) && !isDone(m))
    .sort((a, b) => a.startMin - b.startMin || a.court - b.court || a.id - b.id);
}

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/** Local calendar day for a free-text event date. Null when the date is empty or not a date. */
export function parseEventDate(eventDate: string, now: Date): Date | null {
  const raw = eventDate.trim();
  if (!raw) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})\b/.exec(raw);
  if (iso) {
    const y = Number(iso[1]);
    const mo = Number(iso[2]);
    const d = Number(iso[3]);
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d) return dt;
    return null;
  }
  const monthName = raw
    .toLowerCase()
    .match(/\b(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/);
  if (!monthName) return null;
  const month = MONTH_INDEX[monthName[1]];
  if (month === undefined) return null;
  const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : now.getFullYear();
  const withoutYear = yearMatch ? raw.replace(yearMatch[0], " ") : raw;
  const dayMatch = withoutYear.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!dayMatch) return null;
  const day = Number(dayMatch[1]);
  const dt = new Date(year, month, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month || dt.getDate() !== day) return null;
  return dt;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function clockOnDay(day: Date, minutesOfDay: number): Date {
  const h = Math.floor(minutesOfDay / 60);
  const m = minutesOfDay % 60;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
}

/**
 * One line under a team's next game.
 * Live, or a start time already reached today: "Court N, on now".
 * Event today, or within a day: "Court N starting in X min" (today's clock when the date is not today).
 * Empty, unreadable, or far dates: "Court N at 3:10 PM".
 */
export function courtLine(
  settings: Pick<Settings, "eventDate" | "startTime">,
  match: Pick<Match, "court" | "startMin">,
  status: Match["status"],
  now: Date,
): string {
  const court = match.court;
  if (status === "live") return `Court ${court}, on now`;
  const at = `Court ${court} at ${clockTime(settings.startTime, match.startMin)}`;
  const base = /^(\d{1,2}):(\d{2})$/.exec(settings.startTime.trim());
  if (!base) return at;
  const minutesOfDay = Number(base[1]) * 60 + Number(base[2]) + match.startMin;
  const eventDay = parseEventDate(settings.eventDate, now);
  if (!eventDay) return at;
  const dayDiff = Math.round((startOfLocalDay(eventDay).getTime() - startOfLocalDay(now).getTime()) / 86_400_000);
  if (Math.abs(dayDiff) > 1) return at;
  const mins = Math.round((clockOnDay(startOfLocalDay(now), minutesOfDay).getTime() - now.getTime()) / 60_000);
  if (dayDiff !== 0 && mins <= 0) return at;
  if (mins <= 0) return `Court ${court}, on now`;
  return `Court ${court} starting in ${mins} min`;
}

/** The round on court now: the earliest round that still needs a score. Live flags on later games are ignored until those scores are in. */
export function currentRound(matches: Match[]): number | null {
  const open = matches.filter((m) => !isDone(m));
  if (!open.length) return null;
  return Math.min(...open.map((m) => m.round));
}

/** Whole minutes from the first-serve clock to `now`. A readable event date anchors the day; otherwise this is today's clock. */
export function minutesSinceStart(settings: Pick<Settings, "startTime" | "eventDate">, now: Date): number | null {
  const base = /^(\d{1,2}):(\d{2})$/.exec(settings.startTime.trim());
  if (!base) return null;
  const startMinutes = Number(base[1]) * 60 + Number(base[2]);
  const eventDay = settings.eventDate.trim() ? parseEventDate(settings.eventDate, now) : null;
  const start = clockOnDay(eventDay ?? startOfLocalDay(now), startMinutes);
  return Math.floor((now.getTime() - start.getTime()) / 60_000);
}

/**
 * Check-in belongs in the past once a round is underway.
 * That is the first-round clock (start + 10 minutes), or a later round already being the open one.
 * While the clock is still inside the warm-up window and round 1 is the open round, it stays with Now & Later.
 * `now` null matches the server render, before the client clock is known.
 */
export function warmupIsPast(
  settings: Pick<Settings, "startTime" | "eventDate">,
  now: Date | null,
  current: number | null,
): boolean {
  if (current !== null && current > 1) return true;
  if (!now) return false;
  const elapsed = minutesSinceStart(settings, now);
  if (elapsed === null) return false;
  return elapsed >= TIMES.poolStart;
}

/** Current round first, then later rounds, then earlier rounds. */
export function scheduleRoundOrder(rounds: number[], current: number | null): number[] {
  const sorted = [...new Set(rounds)].sort((a, b) => a - b);
  if (current === null || !sorted.includes(current)) return sorted;
  return [current, ...sorted.filter((r) => r > current), ...sorted.filter((r) => r < current)];
}
