"use client";

import { useState } from "react";
import { Coffee, Medal, Timer } from "lucide-react";
import { EmptyState, MatchCard, PageHeader, WithState } from "@/components/bits";
import { useViewingTeam } from "@/components/my-team";
import { SlidingTabPanel } from "@/components/sliding-tab-panel";
import {
  clockRange,
  clockTime,
  isDone,
  POOL_ROUNDS,
  ROUND_FINAL,
  ROUND_QF,
  ROUND_SEMIS,
  roundLabel,
  TIMES,
  type TourneyState,
} from "@/lib/tourney";
import { cn } from "@/lib/utils";

type View = "upcoming" | "past" | "all";

const VIEWS: readonly View[] = ["upcoming", "past", "all"];

export default function SchedulePage() {
  return <WithState>{(state) => <Schedule state={state} />}</WithState>;
}

function Schedule({ state }: { state: TourneyState }) {
  const [view, setView] = useState<View>("upcoming");
  const start = state.settings.startTime;
  const checkIn = clockRange(start, TIMES.checkIn, TIMES.poolStart);
  const intermission = clockRange(start, TIMES.seeding, TIMES.quarters);
  const awards = clockRange(start, TIMES.awards, TIMES.end);

  return (
    <div>
      <PageHeader title="Schedule" />
      <div className="mb-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Schedule" data-testid="schedule-tabs">
        {(
          [
            ["upcoming", "Now & Later"],
            ["past", "Past"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            data-testid={`schedule-tab-${id}`}
            onClick={() => setView(id)}
            className={cn(
              "rounded-lg px-2 py-2 text-sm font-semibold transition-colors",
              view === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <SlidingTabPanel value={view} order={VIEWS}>
        {(active) =>
          state.settings.teamsRevealed ? (
            <Matchups state={state} view={active} notes={{ checkIn, intermission, awards }} />
          ) : active === "past" ? (
            <EmptyState title="Nothing has happened yet" />
          ) : (
            <div className="space-y-6">
              <TimeNote icon={<Timer className="size-4" />} range={checkIn} label="check-in and warm-up" testId="checkin-note" timeTestId="checkin-time" />
              <StageHeading title="Group Stage" />
              <TimeNote icon={<Coffee className="size-4" />} range={intermission} label="break" testId="break-note" timeTestId="break-time" />
              <StageHeading title="Quarterfinals" />
              <StageHeading title="Semifinals" />
              <StageHeading title="Championship Final" />
              <TimeNote icon={<Medal className="size-4" />} range={awards} label="awards and open courts" testId="awards-note" timeTestId="awards-time" />
            </div>
          )
        }
      </SlidingTabPanel>
    </div>
  );
}

const STAGES: { title: string; has: (round: number) => boolean }[] = [
  { title: "Group Stage", has: (r) => r <= POOL_ROUNDS },
  { title: "Quarterfinals", has: (r) => r === ROUND_QF },
  { title: "Semifinals", has: (r) => r === ROUND_SEMIS },
  { title: "Championship Final", has: (r) => r === ROUND_FINAL },
  { title: "Bonus matches", has: (r) => r > ROUND_FINAL },
];

function Matchups({
  state,
  view,
  notes,
}: {
  state: TourneyState;
  view: View;
  notes: { checkIn: string; intermission: string; awards: string };
}) {
  const myTeam = useViewingTeam();
  const shown = state.matches.filter((m) => (view === "past" ? isDone(m) : view === "upcoming" ? !isDone(m) : true));
  if (view === "past" && !shown.length) return <EmptyState title="Nothing has happened yet" />;
  const rounds = [...new Set(shown.map((m) => m.round))].sort((a, b) => a - b);
  const withNotes = view !== "past";

  const stage = (title: string, has: (round: number) => boolean) => {
    const stageRounds = rounds.filter(has);
    if (!stageRounds.length) return null;
    return (
      <section key={title} className="space-y-4">
        <StageHeading title={title} />
        {stageRounds.map((round) => {
          const games = shown.filter((m) => m.round === round).sort((a, b) => a.startMin - b.startMin || a.court - b.court || a.id - b.id);
          return (
            <div key={round} data-testid={`schedule-round-${round}`}>
              <p className="mb-2 text-sm font-semibold">
                {roundLabel(round)} <span className="font-normal text-muted-foreground">{clockTime(state.settings.startTime, games[0].startMin)}</span>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {games.map((m) => (
                  <MatchCard key={m.id} match={m} state={state} myTeam={myTeam} header="court" />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div className="space-y-6">
      {withNotes && <TimeNote icon={<Timer className="size-4" />} range={notes.checkIn} label="check-in and warm-up" testId="checkin-note" timeTestId="checkin-time" />}
      {stage(STAGES[0].title, STAGES[0].has)}
      {withNotes && <TimeNote icon={<Coffee className="size-4" />} range={notes.intermission} label="break" testId="break-note" timeTestId="break-time" />}
      {STAGES.slice(1, 4).map((s) => stage(s.title, s.has))}
      {withNotes && <TimeNote icon={<Medal className="size-4" />} range={notes.awards} label="awards and open courts" testId="awards-note" timeTestId="awards-time" />}
      {stage(STAGES[4].title, STAGES[4].has)}
    </div>
  );
}

function StageHeading({ title }: { title: string }) {
  return (
    <h2 className="text-center font-display text-xl font-bold uppercase" data-testid="stage-heading">
      {title}
    </h2>
  );
}

function TimeNote({
  icon,
  range,
  label,
  testId,
  timeTestId,
}: {
  icon: React.ReactNode;
  range: string;
  label: string;
  testId: string;
  timeTestId: string;
}) {
  return (
    <Note icon={icon} testId={testId}>
      <span className="font-semibold text-foreground" data-testid={timeTestId}>
        {range}
      </span>
      : {label}
    </Note>
  );
}

function Note({
  icon,
  children,
  className,
  testId,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div data-testid={testId} className={cn("flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-sm text-muted-foreground", className)}>
      {icon}
      <span>{children}</span>
    </div>
  );
}
