"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { PlayerAvatar } from "@/components/bits";
import { PopupSheet } from "@/components/popup-sheet";
import { ProfileForm } from "@/components/profile-form";
import { PlayerTeamPanel } from "@/components/player-team";
import { useOpenPlayer } from "@/components/open-player";
import { usePlayerSession } from "@/components/player-session";
import { useTourney } from "@/components/tourney-provider";
import { Button } from "@/components/ui/button";
import { type TourneyState } from "@/lib/tourney";

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { playerId, isAdmin } = usePlayerSession();
  const { state } = useTourney();
  const openPlayer = useOpenPlayer();
  const [editing, setEditing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setEditing(false);
  }
  const back = useCallback(() => {
    if (editing) setEditing(false);
    else onClose();
  }, [editing, onClose]);
  if (!playerId || !state) return null;
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;
  return (
    <PopupSheet
      open={open}
      onClose={back}
      label={player.name}
      testId="profile-sheet"
      backTestId="profile-sheet-back"
    >
      <ProfileBody state={state} playerId={playerId} isAdmin={isAdmin} editing={editing} onEditing={setEditing} onOpenPlayer={(id) => {
        onClose();
        openPlayer(id);
      }} />
    </PopupSheet>
  );
}

function ProfileBody({
  state,
  playerId,
  isAdmin,
  editing,
  onEditing,
  onOpenPlayer,
}: {
  state: TourneyState;
  playerId: number;
  isAdmin: boolean;
  editing: boolean;
  onEditing: (editing: boolean) => void;
  onOpenPlayer: (id: number) => void;
}) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;
  const team = state.teams.find((t) => t.id === player.teamId);

  return (
    <section className="space-y-6" data-testid="welcome-panel">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold uppercase" data-testid="profile-name">
          {player.name}
        </h1>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <Link href="/admin" className="rounded-md px-3 py-1.5 text-sm font-semibold text-muted-foreground" data-testid="profile-admin">
              Admin
            </Link>
          ) : null}
          {editing ? (
            <Button type="button" variant="outline" onClick={() => onEditing(false)} data-testid="cancel-edit">
              Cancel
            </Button>
          ) : (
            <Button type="button" onClick={() => onEditing(true)} data-testid="edit-profile">
              Edit
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div key="edit" className="fade-in">
          <ProfileForm
            key={`${player.id}:${player.name}:${player.nickname}:${player.bio}:${player.photoVersion}:${JSON.stringify(player.stats)}`}
            player={player}
            team={team}
            onSaved={() => onEditing(false)}
          />
        </div>
      ) : (
        <div key="view" className="fade-in space-y-6" data-testid="profile-view">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PlayerAvatar player={player} team={team} size={96} className="rounded-2xl" />
            <div className="min-w-0">
              {player.nickname ? (
                <p className="text-primary" data-testid="profile-nickname">
                  {player.nickname}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">About</h2>
            {player.bio ? (
              <p className="mt-2 whitespace-pre-line leading-relaxed" data-testid="profile-bio">
                {player.bio}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="profile-bio">
                No writeup yet.
              </p>
            )}
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold uppercase">Stats</h2>
            {player.stats.length ? (
              <dl className="mt-3 grid grid-cols-2 gap-3" data-testid="profile-stats">
                {player.stats.map((s) => (
                  <div key={`${s.label}:${s.value}`} className="rounded-xl bg-muted/50 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No stats yet.</p>
            )}
          </div>

          <PlayerTeamPanel state={state} player={player} onOpenPlayer={onOpenPlayer} />
        </div>
      )}
    </section>
  );
}
