"use client";

import { useState } from "react";
import { PlayerAvatar } from "@/components/bits";
import { useOpenPlayer } from "@/components/open-player";
import { OpenTeamContext } from "@/components/open-team";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTourney } from "@/components/tourney-provider";
import { teamDisplayName, teamRecord } from "@/lib/tourney";

export function TeamSheetProvider({ children }: { children: React.ReactNode }) {
  const [teamId, setTeamId] = useState<number | null>(null);
  return (
    <OpenTeamContext.Provider value={setTeamId}>
      {children}
      <TeamSummary teamId={teamId} onClose={() => setTeamId(null)} />
    </OpenTeamContext.Provider>
  );
}

function TeamSummary({ teamId, onClose }: { teamId: number | null; onClose: () => void }) {
  const { state } = useTourney();
  const openPlayer = useOpenPlayer();
  const team = teamId !== null ? state?.teams.find((t) => t.id === teamId) : undefined;
  const players = team && state ? state.players.filter((p) => p.teamId === team.id).sort((a, b) => a.slot - b.slot || a.id - b.id) : [];
  const record = team && state ? teamRecord(team.id, state.matches) : null;
  const title = team && state ? teamDisplayName(team, state.players) : "Team";

  return (
    <Dialog open={teamId !== null && !!team} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg" data-testid="team-summary">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold uppercase" data-testid="team-summary-title">
            {title}
          </DialogTitle>
          <DialogDescription>
            {record && record.played > 0 ? `Record ${record.wins}-${record.losses}` : "No games played yet."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <div key={p.id} className="min-w-0 rounded-xl bg-muted/40 p-2" data-testid="team-player">
              <button
                type="button"
                data-testid="open-player"
                onClick={() => {
                  onClose();
                  openPlayer(p.id);
                }}
                className="flex min-w-0 cursor-pointer items-center gap-2 text-left"
              >
                <PlayerAvatar player={p} size={40} />
                <span className="min-w-0">
                  <span className="block truncate font-display text-base font-bold uppercase">{p.name}</span>
                  {p.nickname ? <span className="block truncate text-xs text-muted-foreground">{p.nickname}</span> : null}
                </span>
              </button>
              {p.stats.length ? (
                <dl className="mt-2 space-y-1.5">
                  {p.stats.map((s) => (
                    <div key={`${s.label}:${s.value}`} className="min-w-0">
                      <dt className="text-xs break-words text-muted-foreground">{s.label}</dt>
                      <dd className="font-medium break-words">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No stats yet.</p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
