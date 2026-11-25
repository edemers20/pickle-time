import { cookies } from "next/headers";
import { connection } from "next/server";
import { PLAYER_COOKIE, createPlayerSession, currentPlayerId, safeEqual } from "@/lib/auth";
import { sql } from "@/lib/db";
import { assertSameOrigin, handleError, HttpError, json, readJson } from "@/lib/http";
import { firstName } from "@/lib/tourney";

const failures = new Map<string, { count: number; until: number }>();

function clientKey(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}

/** The admin player signs in with `admin`. Everyone else uses their display name. */
function passwordMatches(name: string, isAdmin: boolean, typed: string): boolean {
  const display = name.trim();
  if (!display || !typed) return false;
  if (isAdmin) return safeEqual(typed, "admin");
  const folded = typed.toLowerCase();
  if (safeEqual(folded, display.toLowerCase())) return true;
  const given = firstName(display);
  return given.length > 0 && given.toLowerCase() !== display.toLowerCase() && safeEqual(folded, given.toLowerCase());
}

function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

export async function GET() {
  await connection();
  const playerId = await currentPlayerId();
  if (!playerId) return json({ playerId: null, isAdmin: false });
  const rows = await sql<{ is_admin: boolean }>("select is_admin from players where id = $1", [playerId]);
  return json({ playerId, isAdmin: rows[0]?.is_admin === true });
}

export async function POST(req: Request) {
  await connection();
  try {
    assertSameOrigin(req);
    const key = clientKey(req);
    const f = failures.get(key);
    if (f && f.count >= 8 && f.until > Date.now()) throw new HttpError(429, "Too many attempts. Wait a minute and try again.");
    const body = await readJson(req, 2_000);
    const playerId = typeof body.playerId === "number" ? body.playerId : Number(body.playerId);
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const rows =
      Number.isInteger(playerId) && playerId > 0
        ? await sql<{ name: string; is_admin: boolean }>("select name, is_admin from players where id = $1", [playerId])
        : [];
    const ok = rows[0] ? passwordMatches(rows[0].name, rows[0].is_admin === true, password) : false;
    if (!ok) {
      const next = f && f.until > Date.now() ? f.count + 1 : 1;
      failures.set(key, { count: next, until: Date.now() + 60_000 });
      throw new HttpError(401, "Wrong password");
    }
    failures.delete(key);
    const session = createPlayerSession(playerId);
    if (!session) throw new HttpError(503, "Login is unavailable");
    const jar = await cookies();
    jar.set(PLAYER_COOKIE, session.value, cookieOptions(session.maxAge));
    return json({ playerId, isAdmin: rows[0]?.is_admin === true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  await connection();
  try {
    assertSameOrigin(req);
    const jar = await cookies();
    jar.set(PLAYER_COOKIE, "", cookieOptions(0));
    return json({ playerId: null });
  } catch (error) {
    return handleError(error);
  }
}
