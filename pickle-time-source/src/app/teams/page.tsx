"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EmptyState, PageHeader, PlayerAvatar, WithState } from "@/components/bits";
import { useOpenPlayer } from "@/components/open-player";
import { Input } from "@/components/ui/input";
import type { TourneyState } from "@/lib/tourney";

export default function TeamsPage() {
  return <WithState>{(state) => <Players state={state} />}</WithState>;
}

function Players({ state }: { state: TourneyState }) {
  const openPlayer = useOpenPlayer();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const players = state.players
    .filter((p) => p.name.trim() && (!needle || [p.name, p.nickname].some((s) => s.toLowerCase().includes(needle))))
    .sort((a, b) => a.id - b.id);

  return (
    <div>
      <PageHeader title="Free Agent Pool">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players" className="pl-8" />
        </div>
      </PageHeader>
      {players.length === 0 ? (
        <EmptyState title={q.trim() ? `No one matches "${q}"` : "Players will be posted soon"} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
      )}
    </div>
  );
}
