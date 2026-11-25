import { connection } from "next/server";
import { sql } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/players/[id]/photo">) {
  await connection();
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });
  const rows = await sql<{ photo: string | null }>("select photo from players where id = $1", [id]);
  const photo = rows[0]?.photo;
  const m = photo ? /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(photo) : null;
  if (!m) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(m[2], "base64"), {
    headers: {
      "Content-Type": m[1],
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
