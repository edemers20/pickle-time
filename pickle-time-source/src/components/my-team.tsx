"use client";

import { usePlayerSession } from "@/components/player-session";
import { useTourney } from "@/components/tourney-provider";
import { POOLS, teamDisplayName, type TourneyState } from "@/lib/tourney";
import { cn } from "@/lib/utils";

/** The logged-in player's team. Spectators are not picking a team. */
export function useViewingTeam(): number | null {
  const { playerId } = usePlayerSession();
  const { state } = useTourney();
  if (!playerId || !state) return null;
  return state.players.find((p) => p.id === playerId)?.teamId ?? null;
}

export function TeamSelect({
  state,
  value,
  onChange,
  placeholder = "Team",
  className,
  id,
  names = "players",
}: {
  state: TourneyState;
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  names?: "players" | "teams";
}) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={cn(
        "h-9 rounded-lg bg-input/30 px-2.5 text-sm text-foreground outline-none",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {POOLS.flatMap((p) =>
        state.teams
          .filter((t) => t.pool === p)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {names === "teams" ? t.name : teamDisplayName(t, state.players)}
            </option>
          )),
      )}
    </select>
  );
}
