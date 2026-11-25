"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2, Minus, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, TeamDot } from "@/components/bits";
import { TeamSelect } from "@/components/my-team";
import { useTourney } from "@/components/tourney-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clockTime,
  computeSeeds,
  currentRound,
  describeSource,
  displayStatus,
  groupName,
  poolPlayComplete,
  teamDisplayName,
  priorsScored,
  qfRematches,
  ROUND_QF,
  roundLabel,
  shortRoundLabel,
  type Match,
  type MatchStatus,
  type Player,
  type TourneyState,
} from "@/lib/tourney";
import { cn } from "@/lib/utils";
import { adminAction } from "./admin-api";

function useRun() {
  const { refresh } = useTourney();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(body: Record<string, unknown>, success?: string): Promise<T | null> => {
      setBusy(true);
      try {
        const data = await adminAction<T>(body);
        if (success) toast.success(success);
        await refresh();
        return data;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );
  return { run, busy };
}

const selectClass =
  "h-8 rounded-lg bg-input/30 px-2 text-sm text-foreground outline-none";

/* ---------------------------------- Scores --------------------------------- */

export function ScoresTab({ state }: { state: TourneyState }) {
  const rounds = [...new Set(state.matches.map((m) => m.round))].sort((a, b) => a - b);
  const [round, setRound] = useState<number>(() => currentRound(state.matches) ?? 1);
  const matches = state.matches.filter((m) => m.round === round).sort((a, b) => a.court - b.court || a.startMin - b.startMin);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {rounds.map((r) => {
          const rm = state.matches.filter((m) => m.round === r);
          const done = rm.every((m) => m.status === "final" || m.status === "bye");
          return (
            <Button
              key={r}
              size="sm"
              variant={r === round ? "default" : "outline"}
              onClick={() => setRound(r)}
              className={cn("shrink-0", done && r !== round && "opacity-60")}
            >
              {shortRoundLabel(r)}
            </Button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {roundLabel(round)}, {matches[0] ? clockTime(state.settings.startTime, matches[0].startMin) : ""}
      </p>
      <div key={round} className="fade-in grid gap-3 lg:grid-cols-3">
        {matches.map((m) => (
          <ScoreRow key={`${m.id}:${m.scoreA}:${m.scoreB}:${m.status}:${m.teamA}:${m.teamB}`} match={m} state={state} />
        ))}
      </div>
    </div>
  );
}

const EMPTY_SCORE = "-";

/** Desk heading is the court only. Group and round stay off the card. */
function scoreRowLabel(match: Match): string {
  return `Court ${match.court}`;
}

/** Unsaved scores display as a dash. A stored number, including 0, stays a number. */
function scoreInputValue(score: number | null): string {
  return score === null ? EMPTY_SCORE : String(score);
}

/** Dash and blank are "no score yet" and must be saved as null, never 0. */
function enteredScore(value: string): number | null {
  if (value.trim() === "" || value.trim() === EMPTY_SCORE) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function bumpScore(value: string, delta: number): string {
  const current = enteredScore(value);
  const base = current === null ? 0 : current;
  return String(Math.min(99, Math.max(0, base + delta)));
}

function Stepper({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" size="icon-sm" variant="outline" aria-label={`${label} minus one`} onClick={() => onChange(bumpScore(value, -1))}>
        <Minus />
      </Button>
      <Input
        aria-label={label}
        inputMode="numeric"
        value={value === "" ? EMPTY_SCORE : value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
          onChange(digits === "" ? EMPTY_SCORE : digits);
        }}
        className="h-8 w-12 text-center font-display text-lg tabular-nums"
      />
      <Button type="button" size="icon-sm" variant="outline" aria-label={`${label} plus one`} onClick={() => onChange(bumpScore(value, 1))}>
        <Plus />
      </Button>
    </div>
  );
}

function ScoreRow({ match, state }: { match: Match; state: TourneyState }) {
  const { run, busy } = useRun();
  const [a, setA] = useState(() => scoreInputValue(match.scoreA));
  const [b, setB] = useState(() => scoreInputValue(match.scoreB));
  const teamA = state.teams.find((t) => t.id === match.teamA);
  const teamB = state.teams.find((t) => t.id === match.teamB);
  const ready = teamA && teamB;
  const canLive = Boolean(ready && priorsScored(match, state.matches));

  const save = (status: MatchStatus) =>
    run(
      { action: "updateMatch", id: match.id, scoreA: enteredScore(a), scoreB: enteredScore(b), status },
      status === "final" ? "Final score posted" : "Saved",
    );

  return (
    <Card size="sm" className="gap-3" data-testid={`admin-match-${match.id}`}>
      <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{scoreRowLabel(match)}</span>
        </span>
        <StatusBadge status={displayStatus(match, state.matches)} />
      </div>
      <div className="space-y-2 px-3">
        {[
          { team: teamA, src: match.srcA, value: a, set: setA, side: "A" },
          { team: teamB, src: match.srcB, value: b, set: setB, side: "B" },
        ].map((row) => (
          <div key={row.side} className="flex items-center justify-between gap-2">
            <span className={cn("flex min-w-0 items-center gap-2 text-sm", !row.team && "italic text-muted-foreground")}>
              {row.team && <TeamDot color={row.team.color} />}
              <span className="truncate">{row.team ? teamDisplayName(row.team, state.players) : describeSource(row.src, state.matches)}</span>
            </span>
            <Stepper value={row.value} onChange={row.set} label={`Score ${row.team?.name ?? row.side}`} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || !canLive}
          title={ready && !canLive ? "Enter scores for earlier games first" : undefined}
          onClick={() => save("live")}
        >
          {displayStatus(match, state.matches) === "live" ? "Update score" : "Mark live"}
        </Button>
        <Button size="sm" data-testid={`save-score-${match.id}`} disabled={busy || !ready} onClick={() => save("final")}>
          {busy && <Loader2 className="animate-spin" />} Save
        </Button>
        {match.status !== "scheduled" && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run({ action: "updateMatch", id: match.id, status: "scheduled", scoreA: null, scoreB: null }, "Reset")}>
            Reset
          </Button>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------- Playoffs -------------------------------- */

export function PlayoffsTab({ state }: { state: TourneyState }) {
  const { run, busy } = useRun();
  const complete = poolPlayComplete(state.matches);
  const preview = computeSeeds(state.teams, state.matches);
  const playoffs = state.matches.filter((m) => m.phase === "playoff");
  const rounds = [...new Set(playoffs.map((m) => m.round))].sort((a, b) => a - b);
  const clashes = qfRematches(state.teams, state.matches);
  const canSwap = state.teams.some((t) => t.seed === 5) && state.teams.some((t) => t.seed === 6);

  async function generate() {
    const msg = complete
      ? "Seed all 15 teams from the standings? This fills the quarterfinals (seeds 3 to 6), places seeds 1 and 2 in the semis, and clears playoff results."
      : "Group play isn't finished yet. Seed from the current standings anyway? This fills the quarterfinals and semis and clears playoff results.";
    if (!window.confirm(msg)) return;
    await run({ action: "generateSeeding" }, "Playoffs seeded from standings");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" /> Seed the playoffs
          </CardTitle>
          <CardDescription>
            One table for all 15 teams: wins, point differential capped at ±7, fewest points allowed, then head-to-head. Seeds 3 to 6 fill the quarterfinals. Seeds 1 and 2
            go straight to the semis, and their opponents stay open until those quarterfinals are final. You can still put any team in any slot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5 text-xs" data-testid="seed-pills">
            {preview.map((s) => {
              const t = state.teams.find((x) => x.id === s.teamId)!;
              return (
                <span key={s.seed} className="inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <span className="font-semibold tabular-nums">{s.seed}</span>
                  <TeamDot color={t.color} />
                  {teamDisplayName(t, state.players)}
                </span>
              );
            })}
          </div>
          <Button onClick={generate} disabled={busy} data-testid="generate-seeding">
            {busy && <Loader2 className="animate-spin" />} Generate seeding from standings
          </Button>
          {!complete && <p className="text-xs text-amber-300">Group play still has unfinished games. This is a projection.</p>}
          {clashes.length > 0 && (
            <div className="rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-200" data-testid="qf-rematch-warning">
              <p>
                Same-group quarterfinal: {clashes.map((c) => `${c.label} (${c.teams[0]} vs ${c.teams[1]}, ${groupName(c.pool)})`).join("; ")}. Swap seeds 5 and 6
                to move one team into the other quarterfinal.
              </p>
              {canSwap && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  disabled={busy}
                  data-testid="swap-5-6"
                  onClick={() => run({ action: "swapSeeds", a: 5, b: 6 }, "Swapped seeds 5 and 6")}
                >
                  Swap seeds 5 and 6
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {rounds.map((r) => (
        <section key={r}>
          <h3 className="mb-2 font-display text-lg font-bold uppercase">
            {roundLabel(r)}, {clockTime(state.settings.startTime, playoffs.find((m) => m.round === r)!.startMin)}
          </h3>
          <div className="grid gap-3 lg:grid-cols-3">
            {playoffs
              .filter((m) => m.round === r)
              .sort((a, b) => a.court - b.court)
              .map((m) => (
                <SlotEditor key={`${m.id}:${m.teamA}:${m.teamB}:${m.status}`} match={m} state={state} />
              ))}
          </div>
        </section>
      ))}

      <AdhocCreator state={state} />
    </div>
  );
}

function SlotEditor({ match, state }: { match: Match; state: TourneyState }) {
  const { run, busy } = useRun();
  const [teamA, setTeamA] = useState<number | null>(match.teamA);
  const [teamB, setTeamB] = useState<number | null>(match.teamB);
  const ta = state.teams.find((t) => t.id === teamA);
  const tb = state.teams.find((t) => t.id === teamB);
  const samePool = ta && tb && ta.pool === tb.pool;
  const dirty = teamA !== match.teamA || teamB !== match.teamB;

  return (
    <Card size="sm" className="gap-2" data-testid={`slot-${match.code}`}>
      <div className="flex items-center justify-between px-3 text-xs">
        <span className="font-semibold">{match.label}</span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          Court {match.court} <StatusBadge status={displayStatus(match, state.matches)} />
        </span>
      </div>
      <div className="space-y-1.5 px-3">
        {[
          { v: teamA, set: setTeamA, src: match.srcA, side: "A" },
          { v: teamB, set: setTeamB, src: match.srcB, side: "B" },
        ].map((row) => (
          <div key={row.side} className="space-y-0.5">
            <p className="text-[11px] text-muted-foreground">Slot {row.side}: {describeSource(row.src, state.matches)}</p>
            <TeamSelect state={state} value={row.v} onChange={row.set} placeholder="Empty or TBD" className="h-8 w-full" />
          </div>
        ))}
        {samePool && (
          <Badge variant="outline" className="text-amber-300">
            {match.round === ROUND_QF ? "Same-group rematch. Swap seeds 5 and 6." : "Same-group rematch"}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3">
        <Button size="sm" disabled={busy || !dirty} onClick={() => run({ action: "updateMatch", id: match.id, teamA, teamB }, "Slots updated")}>
          Save slots
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || (teamA === null && teamB === null)}
          title="Advance one team without playing"
          onClick={() => {
            const adv = teamA ?? teamB;
            run({ action: "updateMatch", id: match.id, teamA: adv, teamB: null, scoreA: null, scoreB: null, status: "bye" }, "Bye recorded. Team advanced.");
          }}
        >
          Give bye to {(ta ?? tb) ? teamDisplayName(ta ?? tb!, state.players).slice(0, 22) : "team"}
        </Button>
        {match.status === "bye" && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => run({ action: "updateMatch", id: match.id, status: "scheduled" }, "Bye removed")}>
            Undo bye
          </Button>
        )}
      </div>
    </Card>
  );
}

const SLOT_TIMES = [
  ...Array.from({ length: 10 }, (_, i) => 10 + i * 10),
  115,
  128,
  141,
  155,
  170,
  180,
];

function AdhocCreator({ state }: { state: TourneyState }) {
  const { run, busy } = useRun();
  const [teamA, setTeamA] = useState<number | null>(null);
  const [teamB, setTeamB] = useState<number | null>(null);
  const [court, setCourt] = useState(1);
  const [startMin, setStartMin] = useState(170);
  const [label, setLabel] = useState("Exhibition");
  const adhoc = state.matches.filter((m) => m.phase === "adhoc");
  const pairLabel = (id: number | null) => {
    const team = state.teams.find((t) => t.id === id);
    return team ? teamDisplayName(team, state.players) : "TBD";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Ad-hoc match
        </CardTitle>
        <CardDescription>Pair any two teams for a challenge match, a makeup game, or a rematch. Score it from the Scores tab.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <TeamSelect state={state} value={teamA} onChange={setTeamA} placeholder="Team A" className="w-full" />
          <TeamSelect state={state} value={teamB} onChange={setTeamB} placeholder="Team B" className="w-full" />
          <select className={selectClass} value={court} onChange={(e) => setCourt(Number(e.target.value))} aria-label="Court">
            {[1, 2, 3].map((c) => (
              <option key={c} value={c}>
                Court {c}
              </option>
            ))}
          </select>
          <select className={selectClass} value={startMin} onChange={(e) => setStartMin(Number(e.target.value))} aria-label="Start time">
            {SLOT_TIMES.map((t) => (
              <option key={t} value={t}>
                {clockTime(state.settings.startTime, t)}
              </option>
            ))}
          </select>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="Label" className="sm:col-span-2" aria-label="Match label" />
        </div>
        <Button
          disabled={busy || teamA === null || teamB === null}
          onClick={() => run({ action: "createMatch", teamA, teamB, court, startMin, label }, "Match created")}
        >
          Create match
        </Button>
        {adhoc.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-card">
            {adhoc.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {m.label}: {pairLabel(m.teamA)} vs {pairLabel(m.teamB)}, court {m.court}, {clockTime(state.settings.startTime, m.startMin)}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete match"
                  onClick={() => window.confirm("Delete this match?") && run({ action: "deleteMatch", id: m.id }, "Match deleted")}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Pairing ---------------------------------- */

export function PairingTab({ state }: { state: TourneyState }) {
  const { run, busy } = useRun();
  const teams = [...state.teams].sort((a, b) => a.pool.localeCompare(b.pool) || a.poolPos - b.poolPos);
  const players = [...state.players].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-3" data-testid="pairing">
      <p className="text-sm text-muted-foreground">Pick who plays together. Swapping a name trades their spot with the person you choose.</p>
      <div className="grid grid-cols-3 gap-2">
      {teams.map((team) => {
        const seats = state.players.filter((p) => p.teamId === team.id).sort((a, b) => a.slot - b.slot || a.id - b.id);
        return (
          <Card key={team.id} size="sm" className="gap-2 py-3" data-testid={`pair-team-${team.id}`}>
            <CardContent className="space-y-2 px-2">
              <p className="text-center font-display text-sm font-bold uppercase leading-tight">{teamDisplayName(team, state.players)}</p>
              {seats.map((seat) => (
                <label key={seat.id} className="block">
                  <span className="sr-only">Player {seat.slot}</span>
                  <select
                    aria-label={`${teamDisplayName(team, state.players)} player ${seat.slot}`}
                    disabled={busy}
                    value={seat.id}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (next !== seat.id) void run({ action: "swapPlayers", a: seat.id, b: next }, "Pairing saved");
                    }}
                    className="h-9 w-full rounded-lg bg-muted px-1.5 text-xs"
                  >
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name.trim() || "Open spot"}
          </option>
        ))}
                  </select>
                </label>
              ))}
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}

/* ------------------------------ Teams & players ----------------------------- */

type PlayerDraft = { name: string; isAdmin: boolean };
type TeamDraft = { name: string; color: string; players: Record<number, PlayerDraft> };

function storedText(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

function teamPlayers(state: TourneyState, teamId: number): Player[] {
  return state.players.filter((p) => p.teamId === teamId).sort((a, b) => a.slot - b.slot || a.id - b.id);
}

function draftFromState(state: TourneyState): Record<number, TeamDraft> {
  const drafts: Record<number, TeamDraft> = {};
  for (const team of state.teams) {
    const players: Record<number, PlayerDraft> = {};
    for (const player of teamPlayers(state, team.id)) {
      players[player.id] = { name: player.name, isAdmin: player.isAdmin };
    }
    drafts[team.id] = { name: team.name, color: team.color, players };
  }
  return drafts;
}

function playerDraft(draft: TeamDraft | undefined, player: Player): PlayerDraft {
  return draft?.players[player.id] ?? { name: player.name, isAdmin: player.isAdmin };
}

function teamsDirty(state: TourneyState, drafts: Record<number, TeamDraft>): boolean {
  for (const team of state.teams) {
    const draft = drafts[team.id];
    if (!draft) continue;
    if (storedText(draft.name) !== storedText(team.name) || draft.color.toLowerCase() !== team.color.toLowerCase()) return true;
    for (const player of teamPlayers(state, team.id)) {
      const next = playerDraft(draft, player);
      if (storedText(next.name) !== storedText(player.name) || next.isAdmin !== player.isAdmin) return true;
    }
  }
  return false;
}

export function TeamsTab({ state }: { state: TourneyState }) {
  const { refresh } = useTourney();
  const [drafts, setDrafts] = useState(() => draftFromState(state));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => teamsDirty(state, drafts), [state, drafts]);

  function patchTeam(teamId: number, patch: Partial<Pick<TeamDraft, "name" | "color">>) {
    setDrafts((prev) => {
      const team = state.teams.find((t) => t.id === teamId);
      const current = prev[teamId] ?? { name: team?.name ?? "", color: team?.color ?? "#888888", players: {} };
      return { ...prev, [teamId]: { ...current, ...patch } };
    });
  }

  function patchPlayer(teamId: number, player: Player, patch: Partial<PlayerDraft>) {
    setDrafts((prev) => {
      const team = state.teams.find((t) => t.id === teamId);
      const current = prev[teamId] ?? { name: team?.name ?? "", color: team?.color ?? "#888888", players: {} };
      const row = playerDraft(current, player);
      return {
        ...prev,
        [teamId]: { ...current, players: { ...current.players, [player.id]: { ...row, ...patch } } },
      };
    });
  }

  async function save() {
    if (!dirty || saving) return;
    const bodies: Record<string, unknown>[] = [];
    const adminBodies: Record<string, unknown>[] = [];
    for (const team of state.teams) {
      const draft = drafts[team.id];
      if (!draft) continue;
      if (storedText(draft.name) !== storedText(team.name) || draft.color.toLowerCase() !== team.color.toLowerCase()) {
        bodies.push({ action: "updateTeam", id: team.id, name: draft.name, color: draft.color });
      }
      for (const player of teamPlayers(state, team.id)) {
        const next = playerDraft(draft, player);
        if (storedText(next.name) !== storedText(player.name)) {
          bodies.push({ action: "updatePlayer", id: player.id, name: next.name });
        }
        if (next.isAdmin !== player.isAdmin) {
          adminBodies.push({ action: "setAdmin", id: player.id, isAdmin: next.isAdmin });
        }
      }
    }
    adminBodies.sort((a, b) => Number(b.isAdmin === true) - Number(a.isAdmin === true));
    setSaving(true);
    try {
      for (const body of [...bodies, ...adminBodies]) await adminAction(body);
      toast.success("Teams saved");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" data-testid="save-teams" disabled={!dirty || saving} onClick={() => void save()}>
          {saving && <Loader2 className="animate-spin" />} Save
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2" data-testid="team-editors">
        {state.teams.map((team) => (
          <TeamEditor
            key={team.id}
            team={team}
            players={teamPlayers(state, team.id)}
            draft={drafts[team.id]}
            disabled={saving}
            onTeam={(patch) => patchTeam(team.id, patch)}
            onPlayer={(player, patch) => patchPlayer(team.id, player, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function TeamEditor({
  team,
  players,
  draft,
  disabled,
  onTeam,
  onPlayer,
}: {
  team: TourneyState["teams"][number];
  players: Player[];
  draft: TeamDraft | undefined;
  disabled: boolean;
  onTeam: (patch: Partial<Pick<TeamDraft, "name" | "color">>) => void;
  onPlayer: (player: Player, patch: Partial<PlayerDraft>) => void;
}) {
  const name = draft?.name ?? team.name;
  const color = draft?.color ?? team.color;

  return (
    <Card size="sm" className="min-w-0 gap-2 py-2" data-testid={`team-editor-${team.id}`}>
      <CardContent className="space-y-1.5 px-2">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={color}
            disabled={disabled}
            onChange={(e) => onTeam({ color: e.target.value })}
            aria-label={`${team.name} color`}
            className="size-6 shrink-0 cursor-pointer rounded-md bg-transparent"
          />
          <Input
            value={name}
            disabled={disabled}
            onChange={(e) => onTeam({ name: e.target.value })}
            maxLength={50}
            aria-label={`${team.name} name`}
            className="h-7 min-w-0 px-1.5 text-xs font-semibold"
          />
        </div>
        {players.map((player) => {
          const row = playerDraft(draft, player);
          return (
            <div key={player.id} className="flex items-center gap-1">
              <Input
                value={row.name}
                disabled={disabled}
                onChange={(e) => onPlayer(player, { name: e.target.value })}
                maxLength={60}
                aria-label={`${team.name} player ${player.slot} name`}
                className="h-7 min-w-0 flex-1 px-1.5 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant={row.isAdmin ? "default" : "outline"}
                aria-pressed={row.isAdmin}
                data-testid={`admin-toggle-${player.id}`}
                disabled={disabled}
                className="h-7 shrink-0 px-1.5 text-[10px]"
                onClick={() => onPlayer(player, { isAdmin: !row.isAdmin })}
              >
                {row.isAdmin ? "Admin" : "Make admin"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Settings -------------------------------- */

export function SettingsTab({ state }: { state: TourneyState }) {
  const { run, busy } = useRun();
  const s = state.settings;
  const [form, setForm] = useState(s);
  const field = (key: "eventName" | "tagline" | "eventDate" | "startTime" | "location", label: string, placeholder?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        type={key === "startTime" ? "time" : "text"}
        maxLength={120}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );
  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-3">
        {field("eventName", "Event name")}
        {field("tagline", "Tagline", "Optional one-line note under the title")}
        {field("eventDate", "Date", "Saturday, May 16")}
        {field("startTime", "First serve")}
        {field("location", "Location", "Riverside Park Courts")}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.sampleData} onChange={(e) => setForm({ ...form, sampleData: e.target.checked })} />
          Show &ldquo;sample roster&rdquo; badge (untick once real names are in)
        </label>
        <Button disabled={busy} onClick={() => run({ action: "updateSettings", ...form }, "Settings saved")}>
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}
