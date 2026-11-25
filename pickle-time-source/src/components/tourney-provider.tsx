"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { TourneyState } from "@/lib/tourney";

const POLL_MS = 5000;
const HIDDEN_POLL_MS = 30000;

type Ctx = {
  state: TourneyState | null;
  error: string | null;
  lastSync: number | null;
  refresh: () => Promise<void>;
};

const TourneyContext = createContext<Ctx | null>(null);

export function TourneyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TourneyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const versionRef = useRef<number>(-1);
  const inFlight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(() => {
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      try {
        const res = await fetch(`/api/state?v=${versionRef.current}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data = (await res.json()) as TourneyState | { version: number; unchanged: true };
        if (!("unchanged" in data)) {
          versionRef.current = data.version;
          setState(data);
        }
        setError(null);
        setLastSync(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Connection problem");
      } finally {
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      timer = setTimeout(loop, document.hidden ? HIDDEN_POLL_MS : POLL_MS);
    };
    loop();
    const wake = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      loop();
    };
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [refresh]);

  const value = useMemo(() => ({ state, error, lastSync, refresh }), [state, error, lastSync, refresh]);
  return <TourneyContext.Provider value={value}>{children}</TourneyContext.Provider>;
}

export function useTourney() {
  const ctx = useContext(TourneyContext);
  if (!ctx) throw new Error("useTourney must be used inside TourneyProvider");
  return ctx;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
