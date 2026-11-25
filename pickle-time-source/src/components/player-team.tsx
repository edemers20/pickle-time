"use client";

import { MatchCard, PlayerAvatar, TeamDot } from "@/components/bits";
import { clockTime, roundLabel, teamLabel, teamRoster, upcomingForTeam, type Player, type TourneyState } from "@/lib/tourney";

/** Teammate and upcoming games on a profile. Hidden until the desk finalizes teams. */
export function PlayerTeamPanel({
  state,
  player,
  onOpenPlayer,
}: {
  state: TourneyState;
  player: Player;
  onOpenPlayer?: (id: number) => void;
}) {
  if (!state.settings.teamsRevealed) return null;
  const team = state.teams.find((t) => t.id === player.teamId);
  if (!team) return null;
  const teammates = teamRoster(team.id, state.players).filter((p) => p.id !== player.id);
  const games = upcomingForTeam(team.id, state.matches);

  return (
    <>
      <section className="rounded-2xl bg-card p-4" data-testid="player-teammate">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold uppercase">
          <TeamDot color={team.color} /> {teammates.length > 1 ? "Teammates" : "Teammate"}
        </h2>
        {teammates.length ? (
          <div className="mt-3 space-y-2">
            {teammates.map((p) => {
              const body = (
                <>
                  <PlayerAvatar player={p} size={48} />
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-bold uppercase">{p.name}</span>
                    {p.nickname ? <span className="block truncate text-sm text-muted-foreground">{p.nickname}</span> : null}
                  </span>
                </>
              );
              return onOpenPlayer ? (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPlayer(p.id)}
                  className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl bg-muted/40 p-2 text-left"
                >
                  {body}
                </button>
              ) : (
                <div key={p.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/40 p-2">
                  {body}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-muted-foreground">No teammate yet.</p>
        )}
      </section>

      <section className="rounded-2xl bg-card p-4" data-testid="player-upcoming">
        <h2 className="font-display text-xl font-bold uppercase">Upcoming games</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{teamLabel(team, state)}</p>
        {games.length ? (
          <ul className="mt-3 space-y-3">
            {games.map((m) => (
              <li key={m.id}>
                <p className="mb-1 text-xs text-muted-foreground">
                  {roundLabel(m.round)}, {clockTime(state.settings.startTime, m.startMin)}, Court {m.court}
                </p>
                <MatchCard match={m} state={state} myTeam={team.id} compact />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-muted-foreground">No games left on the schedule.</p>
        )}
      </section>
    </>
  );
}
