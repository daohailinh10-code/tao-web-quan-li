import { acquireDataLock } from "../server/lock.js";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { openDb } from "../server/db.js";
import { exportData } from "../server/backup.js";
console.log(
  "Lưu ý: với PostgreSQL nhúng, hãy dừng npm run dev / npm start trước khi sao lưu.",
);
const release = await acquireDataLock(
  resolve(process.env.DATA_DIR || "./data"),
);
const db = await openDb({
  dir: resolve(process.env.DATA_DIR || "./data", "db"),
});
try {
  const backup = await exportData(db);
  await mkdir("backups", { recursive: true });
  const name =
    "backups/backup-" +
    new Date().toISOString().replace(/[:.]/g, "-") +
    ".json";
  await writeFile(name, JSON.stringify(backup, null, 2), { mode: 0o600 });
  console.log("Đã lưu: " + name);
} finally {
  await db.close();
  await release();
}