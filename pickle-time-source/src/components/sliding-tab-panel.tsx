"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const SLIDE_MS = 260;

type Dir = "left" | "right";

/** Slides tab panels horizontally. Moving to a later tab enters from the right. */
export function SlidingTabPanel<T extends string | number>({
  value,
  order,
  className,
  children,
}: {
  value: T;
  order: readonly T[];
  className?: string;
  children: (value: T) => ReactNode;
}) {
  const [shown, setShown] = useState(value);
  const [outgoing, setOutgoing] = useState<T | null>(null);
  const [dir, setDir] = useState<Dir>("right");
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    if (Object.is(value, from)) return;
    shownRef.current = value;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fromIdx = order.indexOf(from);
    const toIdx = order.indexOf(value);
    setShown(value);
    if (reduce || fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      setOutgoing(null);
      return;
    }
    setDir(toIdx > fromIdx ? "right" : "left");
    setOutgoing(from);
  }, [value, order]);

  useEffect(() => {
    if (outgoing == null) return;
    const id = window.setTimeout(() => setOutgoing(null), SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [outgoing]);

  const enter = outgoing != null && (dir === "right" ? "tab-slide-in-right" : "tab-slide-in-left");
  const exit = dir === "right" ? "tab-slide-out-left" : "tab-slide-out-right";

  return (
    <div className={cn("tab-slide", className)}>
      {outgoing != null && (
        <div key={`out-${String(outgoing)}`} className={cn("tab-slide-pane", exit)} aria-hidden inert>
          {children(outgoing)}
        </div>
      )}
      <div key={`in-${String(shown)}`} className={cn("tab-slide-pane", enter)} data-testid="tab-slide-current">
        {children(shown)}
      </div>
    </div>
  );
}
