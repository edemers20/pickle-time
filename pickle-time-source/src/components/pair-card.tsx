"use client";

import { PlayerAvatar, TeamDot } from "@/components/bits";
import type { Player } from "@/lib/tourney";
import { cn } from "@/lib/utils";

type PairPlayer = Pick<Player, "id" | "name" | "nickname" | "hasPhoto" | "photoVersion">;

/** One team on the Players tab: the pair's name, then both players. Without `onOpenPlayer` the players aren't tappable. */
export function PairCard({
  label,
  color,
  roster,
  highlight,
  onOpenPlayer,
  testId,
}: {
  label: string;
  color: string;
  roster: PairPlayer[];
  highlight?: boolean;
  onOpenPlayer?: (id: number) => void;
  testId?: string;
}) {
  const tile = "flex min-w-0 flex-col items-center gap-2 rounded-lg bg-muted/40 px-2 py-3 text-center text-sm";
  return (
    <section className={cn("rounded-xl bg-card p-3 text-card-foreground", highlight && "ring-2 ring-primary")} data-testid={testId}>
      <h2 className="mb-3 flex min-w-0 items-center gap-2 font-display text-base font-bold uppercase leading-tight">
        <TeamDot color={color} />
        <span className="min-w-0 break-words">{label}</span>
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {roster.map((p) => {
          const body = (
            <>
              <PlayerAvatar player={p} size={56} />
              <span className="w-full min-w-0">
                <span className="block truncate font-display text-base font-bold uppercase">{p.name}</span>
                {p.nickname && <span className="block truncate text-xs text-muted-foreground">{p.nickname}</span>}
              </span>
            </>
          );
          return onOpenPlayer ? (
            <button key={p.id} type="button" data-testid="open-player" onClick={() => onOpenPlayer(p.id)} className={cn(tile, "cursor-pointer")}>
              {body}
            </button>
          ) : (
            <div key={p.id} className={tile}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
