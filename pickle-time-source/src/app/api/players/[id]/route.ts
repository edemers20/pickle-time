import { connection } from "next/server";
import { currentPlayerId, isAdmin, safeEqual } from "@/lib/auth";
import { bumpVersion } from "@/lib/data";
import { sql, tx } from "@/lib/db";
import { assertSameOrigin, handleError, HttpError, json, readJson } from "@/lib/http";
import { LIMITS, photo, stats, str } from "@/lib/validate";

async function authorize(id: number, token: unknown): Promise<"admin" | "player"> {
  if (await isAdmin()) return "admin";
  const sessionId = await currentPlayerId();
  if (sessionId === id) return "player";
  if (typeof token !== "string" || token.length < 16 || token.length > 128) {
    throw new HttpError(401, sessionId ? "You can only edit your own page" : "Log in to edit your page");
  }
  const rows = await sql<{ edit_token: string }>("select edit_token from players where id = $1", [id]);
  if (!rows[0] || !safeEqual(token, rows[0].edit_token)) {
    throw new HttpError(401, "This edit link is missing or invalid");
  }
  return "player";
}

/** Player self-service: `{ token, action: "check" }` or `{ token, nickname?, bio?, stats?, photo? }`. */
export async function POST(req: Request, ctx: RouteContext<"/api/players/[id]">) {
  await connection();
  try {
    assertSameOrigin(req);
    const id = Number((await ctx.params).id);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, "Player not found");
    const body = await readJson(req, LIMITS.photoChars + 20_000);
    const role = await authorize(id, body.token);
    if (body.action === "check") return json({ ok: true, role });

    const sets: string[] = [];
    const params: unknown[] = [];
    const add = (col: string, value: unknown) => {
      params.push(value);
      sets.push(col === "stats" ? `stats = $${params.length}::text::jsonb` : `${col} = $${params.length}`);
    };
    if (body.name !== undefined) add("name", str(body.name, "Name", LIMITS.name, { required: true }));
    if (body.nickname !== undefined) add("nickname", str(body.nickname, "Nickname", LIMITS.nickname));
    if (body.bio !== undefined) add("bio", str(body.bio, "Bio", LIMITS.bio, { multiline: true }));
    if (body.stats !== undefined) add("stats", JSON.stringify(stats(body.stats)));
    const p = photo(body.photo);
    if (p !== undefined) {
      add("photo", p);
      sets.push("photo_version = photo_version + 1");
    }
    if (sets.length === 0) throw new HttpError(400, "Nothing to update");
    params.push(id);
    await tx(async (q) => {
      const rows = await q(`update players set ${sets.join(", ")}, updated_at = now() where id = $${params.length} returning id`, params);
      if (rows.length === 0) throw new HttpError(404, "Player not found");
      await bumpVersion(q);
    });
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
