import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

type DrillMode = "backup" | "restore-test" | "drill";

const mode = (process.argv[2] || "drill") as DrillMode;
const backupDir = process.env.BACKUP_DIR || path.resolve(process.cwd(), "backups");
const backupFile = process.env.BACKUP_FILE || path.join(backupDir, `playground-life-${new Date().toISOString().replace(/[:.]/g, "-")}.dump`);

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function databaseName(connectionString: string) {
  const url = new URL(connectionString);
  return url.pathname.replace(/^\//, "");
}

function assertRestoreTargetIsSafe(connectionString: string) {
  const name = databaseName(connectionString).toLowerCase();
  if (!/(test|restore|drill|staging)/.test(name)) {
    throw new Error("RESTORE_TEST_DATABASE_URL must point to a database with test, restore, drill, or staging in its name");
  }
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function verifyRestoredDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  try {
    const requiredTables = ["clinics", "users", "children", "assignments", "game_results", "audit_log"];
    const result = await pool.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = ANY($1)
       ORDER BY table_name`,
      [requiredTables]
    );
    const restored = new Set(result.rows.map((row) => row.table_name));
    const missing = requiredTables.filter((table) => !restored.has(table));
    if (missing.length > 0) throw new Error(`Restore verification failed. Missing tables: ${missing.join(", ")}`);
  } finally {
    await pool.end();
  }
}

async function createBackup() {
  const databaseUrl = requireEnv("DATABASE_URL");
  await mkdir(path.dirname(backupFile), { recursive: true });
  await run("pg_dump", ["--format=custom", "--no-owner", "--no-acl", "--file", backupFile, databaseUrl]);
  console.log(`Backup created: ${backupFile}`);
}

async function restoreAndVerify() {
  const restoreUrl = requireEnv("RESTORE_TEST_DATABASE_URL");
  assertRestoreTargetIsSafe(restoreUrl);
  await run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--dbname", restoreUrl, backupFile]);
  await verifyRestoredDatabase(restoreUrl);
  console.log(`Restore test verified against ${databaseName(restoreUrl)}`);
}

if (!["backup", "restore-test", "drill"].includes(mode)) {
  throw new Error("Usage: tsx server/backupRestoreDrill.ts [backup|restore-test|drill]");
}

if (mode === "backup") {
  await createBackup();
} else if (mode === "restore-test") {
  await restoreAndVerify();
} else {
  await createBackup();
  await restoreAndVerify();
}
