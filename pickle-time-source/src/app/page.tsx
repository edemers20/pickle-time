"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState, MatchCard, StatusBadge, WithState } from "@/components/bits";
import { useViewingTeam } from "@/components/my-team";
import { SlidingTabPanel } from "@/components/sliding-tab-panel";
import { cn } from "@/lib/utils";
import { clockTime, CODES, COURTS, displayStatus, isDone, roundLabel, teamLabel, winnerOf, type Match, type TourneyState } from "@/lib/tourney";

export default function HomePage() {
  return <WithState>{(state) => <Home state={state} />}</WithState>;
}

function Home({ state }: { state: TourneyState }) {
  const [court, setCourt] = useState(COURTS[0]);
  const final = state.matches.find((m) => m.code === CODES.final);
  const champion = final ? state.teams.find((t) => t.id === winnerOf(final)) : undefined;

  return (
    <div className="space-y-8">
      {champion && state.settings.teamsRevealed && (
        <Card className="flex-row items-center gap-4 bg-gradient-to-r from-amber-400/25 to-transparent px-5">
          <Trophy className="size-10 text-amber-300" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Champions</p>
            <p className="font-display text-3xl font-bold uppercase">{teamLabel(champion, state)}</p>
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
            {(c) =>
              state.settings.teamsRevealed ? (
                <CourtGames state={state} court={c} />
              ) : (
                <EmptyState className="flex h-28 items-center justify-center overflow-hidden p-4" title="Games will start soon" />
              )
            }
          </SlidingTabPanel>
        </div>
      </section>
    </div>
  );
}

function CourtGames({ state, court }: { state: TourneyState; court: number }) {
  const myTeam = useViewingTeam();
  const games = state.matches
    .filter((m) => m.court === court && !isDone(m))
    .sort((a, b) => a.startMin - b.startMin || a.id - b.id)
    .slice(0, 2);
  if (!games.length) {
    return <EmptyState className="flex h-28 items-center justify-center overflow-hidden p-4" title="No more games on this court" />;
  }
  return (
    <div className="space-y-4" data-testid={`court-games-${court}`}>
      {games.map((m, i) => (
        <CourtGame key={m.id} state={state} match={m} heading={i === 0 ? "now" : "next"} myTeam={myTeam} />
      ))}
    </div>
  );
}

function CourtGame({ state, match, heading, myTeam }: { state: TourneyState; match: Match; heading: "now" | "next"; myTeam: number | null }) {
  const status = displayStatus(match, state.matches);
  const time = clockTime(state.settings.startTime, match.startMin);
  const title = heading === "now" ? (status === "live" ? "Now playing" : "Up next") : "After that";
  return (
    <div data-testid={`court-game-${heading}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {roundLabel(match.round)}, {time}
          {status === "live" && <StatusBadge status={status} />}
        </span>
      </div>
      <MatchCard match={match} state={state} myTeam={myTeam} className={cn(heading === "next" && "opacity-80")} />
    </div>
  );
}
