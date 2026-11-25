"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, WithState } from "@/components/bits";
import { SlidingTabPanel } from "@/components/sliding-tab-panel";
import { cn } from "@/lib/utils";
import { CODES, COURTS, teamDisplayName, winnerOf, type TourneyState } from "@/lib/tourney";

export default function HomePage() {
  return <WithState>{(state) => <Home state={state} />}</WithState>;
}

function Home({ state }: { state: TourneyState }) {
  const [court, setCourt] = useState(COURTS[0]);
  const final = state.matches.find((m) => m.code === CODES.final);
  const champion = final ? state.teams.find((t) => t.id === winnerOf(final)) : undefined;

  return (
    <div className="space-y-8">
      {champion && (
        <Card className="flex-row items-center gap-4 bg-gradient-to-r from-amber-400/25 to-transparent px-5">
          <Trophy className="size-10 text-amber-300" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Champions</p>
            <p className="font-display text-3xl font-bold uppercase">{teamDisplayName(champion, state.players)}</p>
          </div>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold uppercase">On court</h2>
          <Link href="/schedule" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Full schedule <ArrowRight className="size-4" />
          </Link>
        </div>
        <div data-testid="court-tabs">
          <div className="mb-4 grid grid-cols-3 gap-2" role="tablist" aria-label="Courts">
            {COURTS.map((c) => {
              const on = c === court;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  data-testid={`court-tab-${c}`}
                  onClick={() => setCourt(c)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  Court {c}
                </button>
              );
            })}
          </div>
          <SlidingTabPanel value={court} order={COURTS}>
            {() => <EmptyState className="flex h-28 items-center justify-center overflow-hidden p-4" title="Games will start soon" />}
          </SlidingTabPanel>
        </div>
      </section>
    </div>
  );
}
