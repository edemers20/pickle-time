"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { PlayerAvatar, WithState } from "@/components/bits";
import { usePlayerSession } from "@/components/player-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compareNames, type TourneyState } from "@/lib/tourney";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return <WithState>{(state) => <LoginForm state={state} />}</WithState>;
}

function LoginForm({ state }: { state: TourneyState }) {
  const { playerId, login } = usePlayerSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const needle = q.trim().toLowerCase();
  const players = useMemo(
    () =>
      state.players
        .filter((p) => p.name.trim() && (!needle || p.name.toLowerCase().includes(needle) || p.nickname.toLowerCase().includes(needle)))
        .sort((a, b) => compareNames(a.name, b.name)),
    [state.players, needle],
  );
  const selectedPlayer = state.players.find((p) => p.id === selected);

  if (playerId) {
    return (
      <div className="mx-auto max-w-md space-y-3 py-10 text-center">
        <h1 className="font-display text-4xl font-bold uppercase">You are logged in</h1>
        <Link href="/" className="text-sm font-semibold text-primary underline">
          Go to Now
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) {
      setError("Pick your name first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(selectedPlayer.id, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wrong password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4" data-testid="login-form">
      <div>
        <h1 className="font-display text-4xl font-bold uppercase">Login</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick your name, then enter your password.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="player-search">Player</Label>
        <Input id="player-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search players" autoComplete="off" />
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl bg-card p-1" data-testid="player-list">
        {players.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">No players match.</li>
        ) : (
          players.map((p) => {
            const on = p.id === selected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                    on ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                  )}
                >
                  <PlayerAvatar player={p} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    {p.nickname && <span className={cn("block truncate text-xs", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{p.nickname}</span>}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      {selectedPlayer && (
        <p className="text-sm">
          Signing in as <span className="font-semibold">{selectedPlayer.name}</span>
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" value={password} autoComplete="current-password" onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error && (
        <p className="text-sm text-red-400" data-testid="login-error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !selectedPlayer || password.trim() === ""} className="w-full">
        {busy && <Loader2 className="animate-spin" />} Log in
      </Button>
    </form>
  );
}
