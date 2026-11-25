import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { sql } from "./db";

export const ADMIN_COOKIE = "pc_admin";
const SESSION_HOURS = 12;

export function adminPasscode(): string | null {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "pickle-admin";
  return null;
}

function sessionKey(): Buffer | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret) return createHash("sha256").update(`pickle-cup-session:${secret}`).digest();
  const passcode = adminPasscode();
  if (!passcode) return null;
  return createHash("sha256").update(`pickle-cup-session-from-passcode:${passcode}`).digest();
}

function sign(payload: string, key: Buffer): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

export function checkPasscode(input: string): boolean {
  const passcode = adminPasscode();
  if (!passcode) return false;
  return safeEqual(input, passcode);
}

export function createAdminSession(): { value: string; maxAge: number } | null {
  const key = sessionKey();
  if (!key) return null;
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `admin.${exp}.${randomBytes(8).toString("base64url")}`;
  return { value: `${payload}.${sign(payload, key)}`, maxAge: SESSION_HOURS * 3600 };
}

export function verifyAdminSession(value: string | undefined): boolean {
  if (!value) return false;
  const key = sessionKey();
  if (!key) return false;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return false;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  if (!safeEqual(sig, sign(payload, key))) return false;
  const [role, exp] = payload.split(".");
  return role === "admin" && Number(exp) > Date.now();
}

/** Logged-in player with is_admin. The old passcode cookie does not grant admin. */
export async function isAdmin(): Promise<boolean> {
  const id = await currentPlayerId();
  if (!id) return false;
  const rows = await sql<{ is_admin: boolean }>("select is_admin from players where id = $1", [id]);
  return rows[0]?.is_admin === true;
}

export const PLAYER_COOKIE = "pc_player";
const PLAYER_DAYS = 30;

export function createPlayerSession(playerId: number): { value: string; maxAge: number } | null {
  const key = sessionKey();
  if (!key || !Number.isInteger(playerId) || playerId <= 0) return null;
  const maxAge = PLAYER_DAYS * 24 * 3600;
  const exp = Date.now() + maxAge * 1000;
  const payload = `player.${playerId}.${exp}.${randomBytes(8).toString("base64url")}`;
  return { value: `${payload}.${sign(payload, key)}`, maxAge };
}

/** Player id from a signed session cookie, or null. The cookie never carries a password or edit token. */
export function verifyPlayerSession(value: string | undefined): number | null {
  if (!value) return null;
  const key = sessionKey();
  if (!key) return null;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  if (!safeEqual(sig, sign(payload, key))) return null;
  const [role, idRaw, expRaw] = payload.split(".");
  const id = Number(idRaw);
  if (role !== "player" || !Number.isInteger(id) || id <= 0) return null;
  if (!(Number(expRaw) > Date.now())) return null;
  return id;
}

export async function currentPlayerId(): Promise<number | null> {
  const jar = await cookies();
  return verifyPlayerSession(jar.get(PLAYER_COOKIE)?.value);
}

export function newEditToken(): string {
  return randomBytes(24).toString("base64url");
}
