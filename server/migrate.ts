import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePool, query } from "./db.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(dirname, "sql", "001_init.sql");

try {
  const sql = await readFile(migrationPath, "utf8");
  await query(sql);
  console.log("Database migration completed");
} finally {
  await closePool();
}
