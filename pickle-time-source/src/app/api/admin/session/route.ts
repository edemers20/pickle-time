import { cookies } from "next/headers";
import { connection } from "next/server";
import { ADMIN_COOKIE, isAdmin } from "@/lib/auth";
import { assertSameOrigin, handleError, HttpError, json } from "@/lib/http";

export async function GET() {
  await connection();
  return json({ admin: await isAdmin() });
}

/** Passcode login is retired. Admin is a logged-in player with is_admin. */
export async function POST(req: Request) {
  await connection();
  try {
    assertSameOrigin(req);
    throw new HttpError(401, "Log in as an admin player");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  await connection();
  try {
    assertSameOrigin(req);
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
    return json({ admin: false });
  } catch (error) {
    return handleError(error);
  }
}
