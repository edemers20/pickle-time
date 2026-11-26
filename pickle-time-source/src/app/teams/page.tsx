"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EmptyState, PageHeader, PlayerAvatar, WithState } from "@/components/bits";
import { useViewingTeam } from "@/components/my-team";
import { useOpenPlayer } from "@/components/open-player";
import { PairCard } from "@/components/pair-card";
import { Input } from "@/components/ui/input";
import { compareNames, teamLabel, teamRoster, type Player, type TourneyState } from "@/lib/tourney";

export default function TeamsPage() {
  return <WithState>{(state) => <Players state={state} />}</WithState>;
}

function matches(p: Player, needle: string) {
  return !needle || [p.name, p.nickname].some((s) => s.toLowerCase().includes(needle));
}

function Players({ state }: { state: TourneyState }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const revealed = state.settings.teamsRevealed;

  return (
    <div>
      <PageHeader title={revealed ? "Teams" : "Free Agent Pool"}>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players" className="pl-8" />
        </div>
      </PageHeader>
      {revealed ? <Pairs state={state} needle={needle} query={q} /> : <Pool state={state} needle={needle} query={q} />}
    </div>
  );
}

function Pool({ state, needle, query }: { state: TourneyState; needle: string; query: string }) {
  const openPlayer = useOpenPlayer();
  const players = state.players.filter((p) => p.name.trim() && matches(p, needle)).sort((a, b) => compareNames(a.name, b.name) || a.id - b.id);
  if (!players.length) return <EmptyState title={query.trim() ? `No one matches "${query}"` : "Players will be posted soon"} />;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="player-pool">
      {players.map((p) => (
        <button
          key={p.id}
          type="button"
          data-testid="open-player"
          onClick={() => openPlayer(p.id)}
          className="flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-xl bg-card px-3 py-4 text-center text-sm text-card-foreground"
        >
          <PlayerAvatar player={p} size={64} />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold uppercase">{p.name}</span>
            {p.nickname && <span className="block truncate text-xs text-muted-foreground">{p.nickname}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

function Pairs({ state, needle, query }: { state: TourneyState; needle: string; query: string }) {
  const openPlayer = useOpenPlayer();
  const myTeam = useViewingTeam();
  const teams = state.teams
    .map((team) => ({ team, label: teamLabel(team, state), roster: teamRoster(team.id, state.players) }))
    .filter((t) => t.roster.some((p) => matches(p, needle)))
    .sort((a, b) => compareNames(a.label, b.label) || a.team.id - b.team.id);
  if (!teams.length) return <EmptyState title={query.trim() ? `No one matches "${query}"` : "Teams will be posted soon"} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="team-pairs">
      {teams.map(({ team, label, roster }) => (
        <PairCard
          key={team.id}
          label={label}
          color={team.color}
          roster={roster}
          highlight={myTeam === team.id}
          onOpenPlayer={openPlayer}
          testId={`team-pair-${team.id}`}
        />
      ))}
    </div>
  );
}
