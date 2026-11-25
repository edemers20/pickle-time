"use client";

import { PageHeader, WithState } from "@/components/bits";
import { useViewingTeam } from "@/components/my-team";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MARGIN_CAP, overallStandings, POOLS, teamLabel, type OverallRow, type TourneyState } from "@/lib/tourney";
import { cn } from "@/lib/utils";

export default function StandingsPage() {
  return <WithState>{(state) => <Standings state={state} />}</WithState>;
}

function signed(n: number) {
  return n > 0 ? `+${n}` : String(n);
}

function Standings({ state }: { state: TourneyState }) {
  const myTeam = useViewingTeam();
  const rows = overallStandings(state.teams, state.matches);
  const official = state.teams.some((t) => t.seed !== null);
  const ordered: (OverallRow & { place: number })[] = official
    ? [...rows]
        .map((r) => ({ ...r, place: r.team.seed ?? 99 }))
        .sort((a, b) => a.place - b.place || a.rank - b.rank)
    : rows.map((r) => ({ ...r, place: r.rank }));
  return (
    <div className="space-y-8">
      <PageHeader title="Standings" />

      <Card className="gap-0 py-0" data-testid="overall-standings">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">W-L</TableHead>
                <TableHead className="text-right" title={`Point differential, each game capped at ±${MARGIN_CAP}`}>
                  +/- (cap)
                </TableHead>
                <TableHead className="hidden text-right sm:table-cell">Raw +/-</TableHead>
                <TableHead className="pr-4 text-right">PA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordered.map((r) => {
                return (
                  <TableRow
                    key={r.team.id}
                    className={cn(myTeam === r.team.id && "bg-primary/10")}
                    data-testid={`overall-row-${r.place}`}
                  >
                    <TableCell className="pl-4 font-display text-lg font-bold tabular-nums">{r.place}</TableCell>
                    <TableCell className="max-w-[12rem] font-medium whitespace-normal leading-tight">{teamLabel(r.team, state)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {r.wins}-{r.losses}
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", r.cappedDiff > 0 && "text-primary", r.cappedDiff < 0 && "text-red-400")}>
                      {signed(r.cappedDiff)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{signed(r.diff)}</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums text-muted-foreground">{r.pa}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold uppercase">By court</h2>
        <div className="grid gap-5 lg:grid-cols-3">
          {POOLS.map((pool, idx) => {
            const poolRows = rows.filter((r) => r.team.pool === pool);
            return (
              <Card key={pool} size="sm" className="gap-2" data-testid={`pool-${pool}`}>
                <CardHeader>
                  <CardTitle className="font-display text-lg font-bold uppercase">Court {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableBody>
                      {poolRows.map((r) => (
                        <TableRow key={r.team.id} className={cn(myTeam === r.team.id && "bg-primary/10")}>
                          <TableCell className="max-w-[11rem] pl-3 font-medium whitespace-normal leading-tight">{teamLabel(r.team, state)}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {r.wins}-{r.losses}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{signed(r.cappedDiff)}</TableCell>
                          <TableCell className="pr-3 text-right text-xs tabular-nums text-muted-foreground">#{r.rank} overall</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
