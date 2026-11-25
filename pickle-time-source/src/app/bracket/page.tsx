"use client";

import { Trophy } from "lucide-react";
import { MatchCard, PageHeader, WithState } from "@/components/bits";
import { useViewingTeam } from "@/components/my-team";
import { CODES, teamDisplayName, winnerOf, type TourneyState } from "@/lib/tourney";
import { cn } from "@/lib/utils";

type Col = { title: string; codes: string[] };

const COLS: Col[] = [
  { title: "Quarterfinals", codes: [CODES.qfB, CODES.qfA] },
  { title: "Semifinals", codes: [CODES.sf1, CODES.sf2] },
  { title: "Final", codes: [CODES.final] },
];

export default function BracketPage() {
  return <WithState>{(state) => <Bracket state={state} />}</WithState>;
}

function Bracket({ state }: { state: TourneyState }) {
  return (
    <div>
      <PageHeader title="Playoff bracket" />
      <BracketTree state={state} />
      <Extras state={state} />
    </div>
  );
}

function BracketTree({ state }: { state: TourneyState }) {
  const myTeam = useViewingTeam();
  const final = state.matches.find((m) => m.code === CODES.final);
  const champ = final ? state.teams.find((t) => t.id === winnerOf(final)) : undefined;
  const rows = Math.max(...COLS.map((c) => c.codes.length));

  return (
    <section className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-2xl" data-testid="bracket">
      <div className="overflow-x-auto">
        <div className="w-max min-w-full bg-card/40 px-4 py-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase text-amber-300">
              <Trophy className="size-5" /> Championship
            </h2>
          </div>
          <div className="flex min-w-max gap-8 pr-4 pb-2">
            {COLS.map((col, ci) => {
              const next = COLS[ci + 1];
              const merges = next && next.codes.length < col.codes.length;
              const groups = merges ? [col.codes] : col.codes.map((c) => [c]);
              return (
                <div key={col.title} className="flex w-64 flex-col">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col.title}</p>
                  <div className="flex flex-1 flex-col" style={{ minHeight: rows * 150 }}>
                    {groups.map((codes) => (
                      <div key={codes.join()} className="relative flex flex-1 flex-col">
                        {merges && <span className="absolute top-1/4 -right-4 bottom-1/4 w-px bg-border" />}
                        {codes.map((code) => {
                          const m = state.matches.find((x) => x.code === code);
                          return (
                            <div key={code} className="relative flex flex-1 flex-col justify-center py-2">
                              {ci > 0 && <span className="absolute top-1/2 -left-4 h-px w-4 bg-border" />}
                              {next && <span className="absolute top-1/2 -right-4 h-px w-4 bg-border" />}
                              <p className="mb-1 text-[11px] text-muted-foreground">{m?.label ?? code}</p>
                              {m ? <MatchCard match={{ ...m, teamA: null, teamB: null }} state={state} myTeam={myTeam} stacked /> : null}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="flex w-48 flex-col">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Champion</p>
              <div className="flex flex-1 items-center">
                <div
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-3 py-4",
                    champ ? "bg-amber-400/10" : "bg-card text-muted-foreground",
                  )}
                >
                  <Trophy className={cn("size-5 shrink-0", champ ? "text-amber-300" : "")} />
                  <span className="truncate font-display text-lg font-bold uppercase">{champ ? teamDisplayName(champ, state.players) : "TBD"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Extras({ state }: { state: TourneyState }) {
  const myTeam = useViewingTeam();
  const adhoc = state.matches.filter((m) => m.phase === "adhoc");
  if (!adhoc.length) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-2xl font-bold uppercase">Bonus matches</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {adhoc.map((m) => (
          <MatchCard key={m.id} match={m} state={state} myTeam={myTeam} />
        ))}
      </div>
    </section>
  );
}
