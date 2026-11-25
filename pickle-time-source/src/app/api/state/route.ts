import { connection } from "next/server";
import { getState, getVersion } from "@/lib/data";
import { handleError, json } from "@/lib/http";

export async function GET(req: Request) {
  await connection();
  try {
    const known = Number(new URL(req.url).searchParams.get("v") ?? "-1");
    if (Number.isFinite(known) && known >= 0) {
      const version = await getVersion();
      if (version === known) return json({ version, unchanged: true });
    }
    return json(await getState());
  } catch (error) {
    return handleError(error);
  }
}
