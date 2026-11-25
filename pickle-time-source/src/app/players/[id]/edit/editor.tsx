"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LoadingState, PlayerAvatar, WithState } from "@/components/bits";
import { useTourney } from "@/components/tourney-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resizePhoto } from "@/lib/resize-photo";
import type { Player, Stat, Team } from "@/lib/tourney";
import { cn } from "@/lib/utils";

export const tokenKey = (id: number) => `pickle-cup:token:${id}`;

type Auth = { status: "checking" } | { status: "denied"; message: string } | { status: "ok"; role: "admin" | "player"; token: string | null };

export function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const playerId = Number(id);
  const search = useSearchParams();
  const urlToken = search.get("token");
  const [auth, setAuth] = useState<Auth>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    const stored = localStorage.getItem(tokenKey(playerId));
    const token = urlToken ?? stored;
    (async () => {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", token }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res) return setAuth({ status: "denied", message: "Couldn't reach the server. Check your connection and reload." });
      const data = (await res.json().catch(() => ({}))) as { role?: "admin" | "player"; error?: string };
      if (!res.ok || !data.role) {
        if (urlToken && stored === urlToken) localStorage.removeItem(tokenKey(playerId));
        return setAuth({ status: "denied", message: data.error ?? "This edit link is missing or invalid" });
      }
      if (data.role === "player" && token) localStorage.setItem(tokenKey(playerId), token);
      if (urlToken) window.history.replaceState(null, "", `/players/${playerId}/edit`);
      setAuth({ status: "ok", role: data.role, token: data.role === "player" ? token : null });
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId, urlToken]);

  if (auth.status === "checking") return <LoadingState label="Checking your edit link…" />;
  if (auth.status === "denied") {
    return (
      <div className="mx-auto max-w-md py-16 text-center" data-testid="edit-denied">
        <Lock className="mx-auto mb-3 size-8 text-muted-foreground" />
        <h1 className="font-display text-2xl font-bold uppercase">Can&apos;t edit this page</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {auth.message}. Player pages can only be edited from the personal link the tournament admin sends you.
        </p>
        <Link href={`/players/${playerId}`} className={buttonVariants({ variant: "outline", className: "mt-5" })}>
          View player card
        </Link>
      </div>
    );
  }
  return (
    <WithState>
      {(state) => {
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return <p className="py-16 text-center text-muted-foreground">Player not found.</p>;
        const team = state.teams.find((t) => t.id === player.teamId);
        return <PlayerEditForm key={player.id} player={player} team={team} token={auth.token} role={auth.role} />;
      }}
    </WithState>
  );
}

export function PlayerEditForm({
  player,
  team,
  token,
  role,
  embedded = false,
  onSaved,
}: {
  player: Player;
  team?: Team;
  token: string | null;
  role: "admin" | "player";
  /** Render inside an already-open profile sheet. Save stays on that sheet. */
  embedded?: boolean;
  onSaved?: () => void;
}) {
  const { refresh } = useTourney();
  const router = useRouter();
  const [nickname, setNickname] = useState(player.nickname);
  const [bio, setBio] = useState(player.bio);
  const [stats, setStats] = useState<Stat[]>(player.stats.length ? player.stats : [{ label: "", value: "" }]);
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setPhoto(await resizePhoto(file));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't use that photo");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = { token, nickname, bio, stats: stats.filter((s) => s.label.trim() || s.value.trim()) };
      if (photo !== undefined) body.photo = photo;
      const res = await fetch(`/api/players/${player.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `Save failed (${res.status})`);
      toast.success("Saved");
      await refresh();
      if (onSaved) onSaved();
      else router.push(`/teams?player=${player.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const preview = photo === undefined ? null : photo;
  const showPhoto = photo === undefined ? player.hasPhoto : photo !== null;

  return (
    <form onSubmit={save} className={cn("space-y-5", !embedded && "mx-auto max-w-2xl")} data-testid="edit-form">
      {embedded ? null : (
        <Link href={`/teams?player=${player.id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to card
        </Link>
      )}
      <div>
        <h1 className="font-display text-4xl font-black uppercase">Edit {player.name}</h1>
        <p className="text-sm text-muted-foreground">
          {role === "admin" ? "Editing as admin." : "This link only edits your card. Keep it to yourself."}
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="New photo preview" className="size-24 rounded-2xl object-cover" />
          ) : (
            <PlayerAvatar player={{ ...player, hasPhoto: showPhoto }} team={team} size={96} className="rounded-2xl" />
          )}
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} data-testid="photo-input" />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> {showPhoto ? "Replace photo" : "Upload photo"}
            </Button>
            {showPhoto && (
              <Button type="button" variant="ghost" onClick={() => setPhoto(null)}>
                Remove
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={nickname} maxLength={40} onChange={(e) => setNickname(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="bio">About</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{bio.length}/1500</span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              maxLength={1500}
              rows={6}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short note about this player."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
          <CardDescription>Up to 8.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <Input
                aria-label={`Stat ${i + 1} name`}
                value={s.label}
                maxLength={30}
                placeholder="Stat"
                className="w-2/5"
                onChange={(e) => setStats(stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <Input
                aria-label={`Stat ${i + 1} value`}
                value={s.value}
                maxLength={80}
                placeholder="Value"
                onChange={(e) => setStats(stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Remove stat" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
                <Trash2 />
              </Button>
            </div>
          ))}
          {stats.length < 8 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setStats([...stats, { label: "", value: "" }])}>
              <Plus /> Add stat
            </Button>
          )}
        </CardContent>
      </Card>

      <div className={cn("flex justify-end", !embedded && "sticky bottom-20 md:bottom-4")}>
        <Button type="submit" size="lg" disabled={saving} className="shadow-lg shadow-primary/20" data-testid="save-changes">
          {saving && <Loader2 className="animate-spin" />} {embedded ? "Save changes" : "Save my page"}
        </Button>
      </div>
    </form>
  );
}
