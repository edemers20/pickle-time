"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PlayerAvatar } from "@/components/bits";
import { useTourney } from "@/components/tourney-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resizePhoto } from "@/lib/resize-photo";
import type { Player, Stat, Team } from "@/lib/tourney";

export function ProfileForm({ player, team, onSaved }: { player: Player; team?: Team; onSaved?: () => void }) {
  const { refresh } = useTourney();
  const [name, setName] = useState(player.name);
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
      const body: Record<string, unknown> = {
        name,
        nickname,
        bio,
        stats: stats.filter((s) => s.label.trim() || s.value.trim()),
      };
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
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const preview = photo === undefined ? null : photo;
  const showPhoto = photo === undefined ? player.hasPhoto : photo !== null;

  return (
    <form onSubmit={save} className="space-y-5" data-testid="profile-form">
      <Card>
        <CardContent className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="New photo preview" className="size-24 rounded-2xl object-cover" />
          ) : (
            <PlayerAvatar player={{ ...player, hasPhoto: showPhoto }} team={team} size={96} className="rounded-2xl" />
          )}
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
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
            <Label htmlFor="player-name">Name</Label>
            <Input id="player-name" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={nickname} maxLength={40} onChange={(e) => setNickname(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label htmlFor="bio">About</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{bio.length}/1500</span>
            </div>
            <Textarea id="bio" value={bio} maxLength={1500} rows={5} onChange={(e) => setBio(e.target.value)} placeholder="A short note about you." />
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

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving} data-testid="save-profile">
          {saving && <Loader2 className="animate-spin" />} Save changes
        </Button>
      </div>
    </form>
  );
}
