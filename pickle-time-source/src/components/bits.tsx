"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTourney } from "@/components/tourney-provider";
import { useOpenTeam } from "@/components/open-team";
import {
  describeSource,
  initials,
  teamLabel,
  type Match,
  type Player,
  type Team,
  type TourneyState,
} from "@/lib/tourney";

export function TeamDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ backgroundColor: color }} />;
}

export function TeamName({
  team,
  link = true,
  dot = true,
  className,
}: {
  team: Team;
  link?: boolean;
  dot?: boolean;
  className?: string;
}) {
  const { state } = useTourney();
  const openTeam = useOpenTeam();
  const label = state ? teamLabel(team, state) : team.name;
  const inner = (
    <span className={cn(dot ? "inline-flex min-w-0 items-center gap-2" : "inline", className)}>
      {dot ? <TeamDot color={team.color} /> : null}
      <span className={dot ? "truncate" : undefined}>{label}</span>
    </span>
  );
  if (!link) return inner;
  return (
    <button type="button" onClick={() => openTeam(team.id)} className="inline cursor-pointer text-left hover:underline">
      {inner}
    </button>
  );
}

const AVATAR_PAIRS: [string, string][] = [
  ["#fde68a", "#fdba74"],
  ["#bbf7d0", "#86efac"],
  ["#bae6fd", "#7dd3fc"],
  ["#ddd6fe", "#c4b5fd"],
  ["#fecdd3", "#fda4af"],
  ["#fef9c3", "#fde047"],
  ["#cffafe", "#67e8f9"],
  ["#f3e8ff", "#d8b4fe"],
  ["#ffedd5", "#fdba74"],
  ["#ecfccb", "#bef264"],
  ["#e0e7ff", "#a5b4fc"],
  ["#fce7f3", "#f9a8d4"],
];

function avatarGradient(id: number) {
  const n = Math.abs(id);
  const pair = AVATAR_PAIRS[n % AVATAR_PAIRS.length];
  const [a, b] = n % (AVATAR_PAIRS.length * 2) >= AVATAR_PAIRS.length ? [pair[1], pair[0]] : pair;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export function PlayerAvatar({
  player,
  size = 40,
  className,
}: {
  player: Pick<Player, "id" | "name" | "hasPhoto" | "photoVersion">;
  team?: Team;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  if (player.hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/players/${player.id}/photo?v=${player.photoVersion}`}
        alt={player.name}
        width={size}
        height={size}
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-label={player.name}
      style={{ ...style, background: avatarGradient(player.id), fontSize: size * 0.38 }}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-slate-950", className)}
    >
      {initials(player.name)}
    </span>
  );
}

export function StatusBadge({ status }: { status: Match["status"] }) {
  if (status === "live")
    return (
      <Badge className="gap-1 bg-red-500/90 text-white">
        <span className="size-1.5 animate-pulse rounded-full bg-white" /> Now
      </Badge>
    );
  if (status === "final") return <Badge variant="secondary">Final</Badge>;
  if (status === "bye") return <Badge variant="outline">Bye</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Scheduled</Badge>;
}

function pillInk(hex: string) {
  const raw = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return "#0f172a";
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.64 ? "#0f172a" : "#f8fafc";
}

function MatchSide({
  state,
  teamId,
  src,
  score,
  lost,
  highlight,
  compact,
}: {
  state: TourneyState;
  teamId: number | null;
  src: string | null;
  score: number | null;
  lost: boolean;
  highlight: boolean;
  compact?: boolean;
}) {
  const openTeam = useOpenTeam();
  const team = teamId !== null ? state.teams.find((t) => t.id === teamId) : undefined;
  if (!team) {
    return (
      <span
        data-testid="seed-pill"
        className={cn(
          "inline-flex min-w-0 items-center justify-center rounded-full bg-muted font-semibold text-foreground",
          compact ? "px-2 py-1 text-xs leading-tight" : "max-w-full px-4 py-2 text-base",
        )}
      >
        <span className="min-w-0 truncate">{describeSource(src, state.matches)}</span>
      </span>
    );
  }
  const name = teamLabel(team, state);
  const label = score === null ? name : `${name} (${score})`;
  const background = lost ? "#64748b" : team.color;
  return (
    <button
      type="button"
      data-testid="team-pill"
      data-result={lost ? "loss" : score === null ? "open" : "win"}
      aria-current={highlight ? "true" : undefined}
      onClick={() => openTeam(team.id)}
      style={{ backgroundColor: background, color: pillInk(background) }}
      className={cn(
        "inline-flex min-w-0 shrink cursor-pointer items-center justify-center rounded-full font-semibold transition-colors duration-300",
        compact
          ? "overflow-hidden px-2 py-1 text-xs leading-tight"
          : "max-w-full px-4 py-2 text-base",
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

export function gameScored(match: Match) {
  return match.status === "final" && match.scoreA !== null && match.scoreB !== null;
}

export function Matchup({
  match,
  state,
  myTeam,
  compact,
  stacked,
}: {
  match: Match;
  state: TourneyState;
  myTeam?: number | null;
  /** One centered row sized for a narrow column: pills shrink instead of stacking. */
  compact?: boolean;
  /** Bracket column: team, then "vs", then the other team, centered. */
  stacked?: boolean;
}) {
  const scored = gameScored(match);
  const aLost = scored && match.scoreA! < match.scoreB!;
  const bLost = scored && match.scoreB! < match.scoreA!;
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center text-center",
        stacked ? "flex-col gap-1" : compact ? "flex-nowrap gap-1" : "flex-wrap gap-2",
      )}
      data-testid="matchup"
      data-layout={stacked ? "stack" : "row"}
    >
      <MatchSide state={state} teamId={match.teamA} src={match.srcA} score={scored ? match.scoreA : null} lost={aLost} highlight={myTeam != null && myTeam === match.teamA} compact={compact} />
      <span className="shrink-0 text-sm text-muted-foreground" data-testid="match-vs">
        vs
      </span>
      <MatchSide state={state} teamId={match.teamB} src={match.srcB} score={scored ? match.scoreB : null} lost={bLost} highlight={myTeam != null && myTeam === match.teamB} compact={compact} />
    </div>
  );
}

export function MatchCard({
  match,
  state,
  myTeam,
  className,
  header,
  compact,
  stacked,
}: {
  match: Match;
  state: TourneyState;
  myTeam?: number | null;
  className?: string;
  header?: "next" | "court";
  compact?: boolean;
  stacked?: boolean;
}) {
  return (
    <Card
      size="sm"
      className={cn(
        "items-center justify-center gap-2 text-center transition-opacity duration-300",
        compact ? "px-2 py-2" : "px-4 py-3",
        gameScored(match) && "opacity-40",
        className,
      )}
      data-testid={`match-${match.id}`}
    >
      {header === "court" && (
        <p className="text-sm font-semibold" data-testid="match-card-header">
          Court {match.court}
        </p>
      )}
      <Matchup match={match} state={state} myTeam={myTeam} compact={compact} stacked={stacked} />
    </Card>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading the tournament…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-24 text-center">
      <AlertTriangle className="size-6 text-amber-400" />
      <p className="font-medium">Can&apos;t reach the scoreboard</p>
      <p className="text-sm text-muted-foreground">{message}. We&apos;ll keep retrying every few seconds.</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-primary underline underline-offset-4">
          Retry now
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-card p-8 text-center", className)}>
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

/** Renders children only once the shared state has loaded; handles loading and error UI. */
export function WithState({ children }: { children: (state: TourneyState) => React.ReactNode }) {
  const { state, error, refresh } = useTourney();
  if (!state) return error ? <ErrorState message={error} onRetry={() => void refresh()} /> : <LoadingState />;
  return <>{children(state)}</>;
}
