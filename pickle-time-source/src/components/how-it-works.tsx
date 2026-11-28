"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { PairCard } from "@/components/pair-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HOW_IT_WORKS as COPY } from "@/content/how-it-works";
import { cn } from "@/lib/utils";

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
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
        data-testid="how-it-works"
      >
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="font-display text-3xl font-bold uppercase">{COPY.title}</DialogTitle>
          <DialogDescription className="text-base text-foreground/80">{COPY.intro}</DialogDescription>
          <div className="grid gap-2 pt-2 sm:grid-cols-2" data-testid="how-roles">
            {COPY.roles.map((role) => (
              <p key={role.who} className="rounded-xl bg-card px-3 py-2 text-sm">
                <span className="font-semibold">{role.who}</span> <span className="text-muted-foreground">{role.text}</span>
              </p>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-7 px-5 pt-3 pb-6">
          <Section title={COPY.teams.heading} testId="how-teams">
            <p className="text-muted-foreground">{COPY.teams.body}</p>
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
            <p className="mt-2 text-xs text-muted-foreground">{COPY.teams.caption}</p>
          </Section>

          <Section title={COPY.faq.heading} testId="how-faq">
            <dl className="divide-y divide-border/60 rounded-xl bg-card">
              {COPY.faq.items.map((item) => (
                <div key={item.q} className="px-4 py-3">
                  <dt className="font-semibold">{item.q}</dt>
                  <dd className="mt-1 text-muted-foreground">{item.a}</dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
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
