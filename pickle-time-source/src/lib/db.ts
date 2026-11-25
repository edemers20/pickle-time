import "server-only";
import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
let pool: pg.Pool | undefined;
let local: Promise<PGlite> | undefined;

export type Query = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    return (await pool.query(text, params)).rows as T[];
  }
  return (await (await getLocal()).query<T>(text, params)).rows;
}

/** Runs `fn` inside one transaction; every write path uses this so version bumps stay atomic. */
export async function tx<R>(fn: (q: Query) => Promise<R>): Promise<R> {
  if (databaseUrl !== "") {
    pool ??= new pg.Pool({ connectionString: databaseUrl, max: 5 });
    const client = await pool.connect();
    try {
      await client.query("begin");
      const q: Query = async <T,>(text: string, params: unknown[] = []) =>
        (await client.query(text, params)).rows as T[];
      const result = await fn(q);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  const db = await getLocal();
  return db.transaction(async (t) => {
    const q: Query = async <T,>(text: string, params: unknown[] = []) =>
      (await t.query<T>(text, params)).rows;
    return fn(q);
  });
}

const globalForDb = globalThis as { __pickleLocalDb?: Promise<PGlite> };

function getLocal(): Promise<PGlite> {
  local ??= globalForDb.__pickleLocalDb;
  local ??= startLocal().catch((error: unknown) => {
    local = undefined;
    globalForDb.__pickleLocalDb = undefined;
    throw error;
  });
  globalForDb.__pickleLocalDb = local;
  return local;
}

async function startLocal(): Promise<PGlite> {
  const db = new PGlite();
  const files = (await readdir("migrations").catch(() => [])).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(await readFile(`migrations/${file}`, "utf8"));
  }
  return db;
}
