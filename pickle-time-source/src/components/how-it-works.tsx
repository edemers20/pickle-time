"use client";

import { Info, Trophy } from "lucide-react";
import { useState } from "react";
import { pillInk, TeamDot, teamPillClass } from "@/components/bits";
import { PairCard } from "@/components/pair-card";
import { useTourney } from "@/components/tourney-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOW_IT_WORKS as COPY } from "@/content/how-it-works";
import { clockTime, COURTS, GROUP_NAME, POOLS, TIMES, type PoolId } from "@/lib/tourney";
import { cn } from "@/lib/utils";

const TIME_KEYS = {
  checkIn: TIMES.checkIn,
  groupStart: TIMES.poolStart,
  groupEnd: TIMES.poolEnd,
  quarters: TIMES.quarters,
  semis: TIMES.semis,
  final: TIMES.final,
  awards: TIMES.awards,
} as const;

const GROUP_COLOR: Record<PoolId, string> = { A: "#ef4444", B: "#22c55e", C: "#3b82f6" };

export function HowItWorksButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={COPY.buttonLabel}
        title={COPY.buttonLabel}
        data-testid="how-it-works-button"
        className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Info className="size-5" />
      </button>
      <HowItWorks open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function HowItWorks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useTourney();
  const startTime = state?.settings.startTime ?? "";
  const fill = (text: string) =>
    text.replace(/\{(\w+)\}/g, (whole, key: string) =>
      key in TIME_KEYS ? clockTime(startTime, TIME_KEYS[key as keyof typeof TIME_KEYS]) : whole,
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
        data-testid="how-it-works"
      >
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="font-display text-3xl font-bold uppercase">{COPY.title}</DialogTitle>
          <DialogDescription className="text-base text-foreground/80">{fill(COPY.intro)}</DialogDescription>
          <div className="grid gap-2 pt-2 sm:grid-cols-2" data-testid="how-roles">
            {COPY.roles.map((role) => (
              <p key={role.who} className="rounded-xl bg-card px-3 py-2 text-sm">
                <span className="font-semibold">{role.who}</span> <span className="text-muted-foreground">{fill(role.text)}</span>
              </p>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-7 px-5 pt-3 pb-6">
          <Section title={COPY.teams.heading} testId="how-teams">
            <p className="text-muted-foreground">{fill(COPY.teams.body)}</p>
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/60 p-3" aria-label="Sample Teams page">
              <p className="mb-3 font-display text-2xl font-bold uppercase tracking-tight">Teams</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {COPY.teams.samples.map((sample, i) => (
                  <div key={i} className={cn(i > 1 && "hidden sm:block")}>
                    <PairCard
                      label={sample.players.map((p) => p.name).join(" & ")}
                      color={sample.color}
                      roster={sample.players.map((p, j) => ({ ...p, id: 900 + i * 2 + j, hasPhoto: false, photoVersion: 0 }))}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{fill(COPY.teams.caption)}</p>
          </Section>

          <Section title={COPY.games.heading} testId="how-games">
            <div className="grid gap-2 sm:grid-cols-3">
              {COPY.games.rows.map((row) => (
                <div key={row.label} className="flex items-center gap-4 rounded-xl bg-card px-4 py-3 sm:flex-col sm:gap-0 sm:text-center">
                  <p className="w-8 shrink-0 text-center font-display text-4xl font-bold text-primary sm:w-auto">{row.value}</p>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight sm:mt-1">{row.label}</p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">{row.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={COPY.groups.heading} testId="how-groups">
            <p className="text-muted-foreground">{fill(COPY.groups.body)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{fill(COPY.groups.rules)}</p>
            <p className="mt-3 text-sm text-muted-foreground">{fill(COPY.groups.exampleNote)}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3" data-testid="how-example-pills">
              {POOLS.map((pool, i) => {
                const game = COPY.groups.exampleGames[i];
                return (
                  <div key={pool} className="flex min-w-0 flex-col items-center gap-2 rounded-xl bg-card px-3 py-3 text-center">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <TeamDot color={GROUP_COLOR[pool]} />
                      {GROUP_NAME[pool]}
                      <span className="font-normal text-muted-foreground">
                        {COPY.groups.courtLabel} {COURTS[i]}
                      </span>
                    </span>
                    {game && (
                      <div className="flex w-full min-w-0 flex-col items-center gap-1">
                        <SamplePill {...game.a} />
                        <span className="text-xs text-muted-foreground">{COPY.groups.vs}</span>
                        <SamplePill {...game.b} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title={COPY.seeding.heading} testId="how-seeding">
            <p className="text-muted-foreground">{fill(COPY.seeding.body)}</p>
            <ol className="mt-3 space-y-1.5">
              {COPY.seeding.order.map((item, i) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">{i + 1}</span>
                  <span className="pt-0.5">{fill(item)}</span>
                </li>
              ))}
            </ol>
          </Section>

          <Section title={COPY.playoffs.heading} testId="how-playoffs">
            <p className="text-muted-foreground">{fill(COPY.playoffs.body)}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {COPY.playoffs.rounds.map((round, ri) => {
                const last = ri === COPY.playoffs.rounds.length - 1;
                return (
                  <div key={round.title} className="flex flex-col">
                    <p className="mb-2 flex items-baseline justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <span>{round.title}</span>
                      <span className="normal-case tracking-normal">{fill(round.time)}</span>
                    </p>
                    <div className="flex flex-1 flex-col justify-around gap-2">
                      {round.games.map((game) => (
                        <div
                          key={game}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-semibold",
                            last ? "bg-amber-400/10 text-amber-200" : "bg-card",
                          )}
                        >
                          {last && <Trophy className="size-4 shrink-0 text-amber-300" />}
                          {fill(game)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {COPY.playoffs.rules.map((rule) => (
                <li key={rule}>{fill(rule)}</li>
              ))}
            </ul>
          </Section>

          <Section title={COPY.schedule.heading} testId="how-schedule">
            <dl className="divide-y divide-border/60 rounded-xl bg-card">
              {COPY.schedule.rows.map((row) => (
                <div key={row.label} className="flex items-center gap-4 px-3 py-2">
                  <dt className="w-20 shrink-0 font-semibold tabular-nums">{fill(row.time)}</dt>
                  <dd className="text-muted-foreground">{fill(row.label)}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SamplePill({ name, color }: { name: string; color: string }) {
  return (
    <span className={teamPillClass(true)} style={{ backgroundColor: color, color: pillInk(color) }}>
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}

function Section({ title, testId, children }: { title: string; testId: string; children: React.ReactNode }) {
  return (
    <section data-testid={testId}>
      <h3 className="mb-2 font-display text-xl font-bold uppercase">{title}</h3>
      {children}
    </section>
  );
}
