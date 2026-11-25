"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Ctx = {
  playerId: number | null;
  isAdmin: boolean;
  ready: boolean;
  profileToken: number;
  login: (playerId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const PlayerSessionContext = createContext<Ctx | null>(null);

export function PlayerSessionProvider({ children }: { children: React.ReactNode }) {
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  const [profileToken, setProfileToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/player-session", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ playerId?: number | null; isAdmin?: boolean }>) : { playerId: null, isAdmin: false }))
      .catch(() => ({ playerId: null, isAdmin: false }))
      .then((data) => {
        if (!active) return;
        setPlayerId(typeof data.playerId === "number" ? data.playerId : null);
        setIsAdmin(data.isAdmin === true);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (id: number, password: string) => {
    const res = await fetch("/api/player-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: id, password }),
    });
    const data = (await res.json().catch(() => ({}))) as { playerId?: number; isAdmin?: boolean; error?: string };
    if (!res.ok || typeof data.playerId !== "number") throw new Error(data.error || "Wrong password");
    setPlayerId(data.playerId);
    setIsAdmin(data.isAdmin === true);
    setProfileToken((n) => n + 1);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/player-session", { method: "DELETE" }).catch(() => null);
    setPlayerId(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({ playerId, isAdmin, ready, profileToken, login, logout }),
    [playerId, isAdmin, ready, profileToken, login, logout],
  );
  return <PlayerSessionContext.Provider value={value}>{children}</PlayerSessionContext.Provider>;
}

export function usePlayerSession() {
  const ctx = useContext(PlayerSessionContext);
  if (!ctx) throw new Error("usePlayerSession must be used inside PlayerSessionProvider");
  return ctx;
}
