"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PlayerEditForm } from "@/app/players/[id]/edit/editor";
import { EmptyState, PlayerAvatar, WithState } from "@/components/bits";
import { OpenPlayerContext, useOpenPlayer } from "@/components/open-player";
import { PlayerTeamPanel } from "@/components/player-team";
import { PopupSheet } from "@/components/popup-sheet";
import { usePlayerSession } from "@/components/player-session";
import { Button } from "@/components/ui/button";
import { type Player, type TourneyState } from "@/lib/tourney";

export function PlayerSheetProvider({ children }: { children: React.ReactNode }) {
  const [playerId, setPlayerId] = useState<number | null>(null);
  return (
    <OpenPlayerContext.Provider value={setPlayerId}>
      <Suspense fallback={null}>
        <OpenPlayerFromQuery onOpen={setPlayerId} />
      </Suspense>
      {children}
      <PlayerSheet id={playerId} onClose={() => setPlayerId(null)} />
    </OpenPlayerContext.Provider>
  );
}

/** `/teams?player=` reopens the profile sheet after the editor saves. */
function OpenPlayerFromQuery({ onOpen }: { onOpen: (id: number) => void }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const requested = pathname === "/teams" ? search.get("player") : null;

  useEffect(() => {
    if (!requested) return;
    const id = Number(requested);
    if (Number.isInteger(id) && id > 0) onOpen(id);
    router.replace("/teams", { scroll: false });
  }, [requested, onOpen, router]);

  return null;
}

export function PlayerSheet({ id, onClose, onOpenPlayer }: { id: number | null; onClose?: () => void; onOpenPlayer?: (id: number) => void }) {
  const router = useRouter();
  const openFromProvider = useOpenPlayer();
  const close = useCallback(() => {
    if (onClose) onClose();
    else if (window.history.length > 1) router.back();
    else router.push("/teams");
  }, [onClose, router]);

  const [viewId, setViewId] = useState(id);
  const [trackedId, setTrackedId] = useState(id);
  if (id !== trackedId) {
    setTrackedId(id);
    if (id !== null) setViewId(id);
  }

  if (viewId === null) return null;

  return (
    <WithState>
      {(state) => {
        const player = state.players.find((p) => p.id === viewId);
        if (!player) {
          return (
            <PopupSheet open={id !== null} onClose={close} label="Player" testId="player-sheet" backTestId="player-sheet-back">
              <EmptyState title="Player not found">
                <button type="button" onClick={close} className="text-primary underline">
                  Back
                </button>
              </EmptyState>
            </PopupSheet>
          );
        }
        return <Sheet state={state} player={player} open={id !== null} onClose={close} onOpenPlayer={onOpenPlayer ?? openFromProvider} />;
      }}
    </WithState>
  );
}

function Sheet({
  state,
  player,
  open,
  onClose,
  onOpenPlayer,
}: {
  state: TourneyState;
  player: Player;
  open: boolean;
  onClose: () => void;
  onOpenPlayer: (id: number) => void;
}) {
  const { isAdmin } = usePlayerSession();
  const team = state.teams.find((t) => t.id === player.teamId);
  const [editing, setEditing] = useState(false);
  const scope = `${player.id}:${open}`;
  const [seen, setSeen] = useState(scope);
  if (seen !== scope) {
    setSeen(scope);
    setEditing(false);
  }
  const back = useCallback(() => {
    if (editing) setEditing(false);
    else onClose();
  }, [editing, onClose]);

  return (
    <PopupSheet
      open={open}
      onClose={back}
      label={player.name}
      testId="player-sheet"
      backTestId="player-sheet-back"
    >
      {editing ? (
        <PlayerEditForm
          key={player.id}
          player={player}
          team={team}
          token={null}
          role="admin"
          embedded
          onSaved={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PlayerAvatar player={player} team={team} size={120} className="rounded-2xl" />
            <div className="min-w-0">
              <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight" data-testid="player-name">
                {player.name}
              </h1>
              {player.nickname && (
                <p className="mt-1 text-lg text-muted-foreground" data-testid="player-nickname">
                  {player.nickname}
                </p>
              )}
              {isAdmin ? (
                <Button type="button" variant="outline" size="sm" className="mt-3" data-testid="edit-player" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              ) : null}
            </div>
          </div>

          <section className="mt-6 rounded-2xl bg-card p-4">
            <h2 className="font-display text-xl font-bold uppercase">About</h2>
            {player.bio ? (
              <p className="mt-2 whitespace-pre-line leading-relaxed" data-testid="player-bio">
                {player.bio}
              </p>
            ) : (
              <p className="mt-2 text-muted-foreground">No writeup yet.</p>
            )}
          </section>

          <section className="mt-4 rounded-2xl bg-card p-4">
            <h2 className="font-display text-xl font-bold uppercase">Stats</h2>
            {player.stats.length ? (
              <dl className="mt-3 grid grid-cols-2 gap-3" data-testid="player-stats">
                {player.stats.map((s, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 p-3">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="mt-0.5 font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-muted-foreground">No stats yet.</p>
            )}
          </section>

          <div className="mt-4 space-y-4 empty:hidden">
            <PlayerTeamPanel state={state} player={player} onOpenPlayer={onOpenPlayer} />
          </div>
        </>
      )}
    </PopupSheet>
  );
}
