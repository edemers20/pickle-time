import "server-only";
import { HttpError } from "./http";
import type { Stat } from "./tourney";

export const LIMITS = {
  name: 60,
  nickname: 40,
  bio: 1500,
  statLabel: 30,
  statValue: 80,
  stats: 8,
  photoChars: 400_000,
  teamName: 50,
  label: 60,
  settings: 120,
};

function clean(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}

export function str(value: unknown, field: string, max: number, opts: { required?: boolean; multiline?: boolean } = {}): string {
  if (typeof value !== "string") throw new HttpError(400, `${field} must be text`);
  let v = clean(value);
  if (!opts.multiline) v = v.replace(/[\r\n\t]+/g, " ");
  v = v.trim();
  if (opts.required && v === "") throw new HttpError(400, `${field} is required`);
  if (v.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return v;
}

export function int(value: unknown, field: string, min: number, max: number): number {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw new HttpError(400, `${field} must be a whole number from ${min} to ${max}`);
  }
  return n;
}

export function optionalInt(value: unknown, field: string, min: number, max: number): number | null {
  if (value === null || value === "" || value === undefined) return null;
  return int(value, field, min, max);
}

export function stats(value: unknown): Stat[] {
  if (!Array.isArray(value)) throw new HttpError(400, "stats must be a list");
  if (value.length > LIMITS.stats) throw new HttpError(400, `At most ${LIMITS.stats} stats`);
  return value
    .map((s, i) => {
      if (!s || typeof s !== "object") throw new HttpError(400, `Stat ${i + 1} is invalid`);
      const o = s as Record<string, unknown>;
      return {
        label: str(o.label ?? "", `Stat ${i + 1} label`, LIMITS.statLabel),
        value: str(o.value ?? "", `Stat ${i + 1} value`, LIMITS.statValue),
      };
    })
    .filter((s) => s.label !== "" || s.value !== "");
}

const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/** `undefined` = leave unchanged, `null` = remove, string = validated data URL. */
export function photo(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new HttpError(400, "photo must be an image");
  if (value.length > LIMITS.photoChars) throw new HttpError(413, "Photo is too large (max ~300 KB)");
  if (!PHOTO_RE.test(value)) throw new HttpError(400, "Photo must be a JPEG, PNG or WebP image");
  return value;
}

export function color(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new HttpError(400, "color must be #rrggbb");
  return value.toLowerCase();
}

export function time(value: unknown): string {
  const v = str(value, "Start time", 5, { required: true });
  if (!/^([01]?\d|2[0-3]):[0-5]\d$/.test(v)) throw new HttpError(400, "Start time must be HH:MM");
  return v;
}
