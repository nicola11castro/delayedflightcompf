import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Point it at any PostgreSQL database (local, Neon, Railway, Render, Supabase...).",
  );
}

// Hosted Postgres providers require TLS; a local database does not.
const isLocal = /@(localhost|127\.0\.0\.1|db|postgres)(:|\/)/.test(connectionString);
const sslDisabled = process.env.DATABASE_SSL === "false";
const ssl = isLocal || sslDisabled ? false : { rejectUnauthorized: false };

export const pool = new pg.Pool({ connectionString, ssl, max: 10 });
export const db = drizzle(pool, { schema });
