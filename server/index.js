
import { acquireDataLock } from "./lock.js";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { openDb } from "./db.js";
import { initialize } from "./seed.js";
import { createApp } from "./app.js";

const root = resolve(process.env.DATA_DIR || "./data");
const port = Number(process.env.PORT || 3001);

await mkdir(root, { recursive: true });

const release = await acquireDataLock(root);

let db;
let server;
let stopping = false;

async function cleanup() {
  try {
    if (db) {
      await db.close();
      db = undefined;
    }
  } finally {
    await release();
  }
}

async function stop() {
  if (stopping) return;
  stopping = true;

  if (!server) {
    try {
      await cleanup();
      process.exit(0);
    } catch (error) {
      console.error("Lỗi khi đóng ứng dụng:", error);
      process.exit(1);
    }
    return;
  }

  server.close(async (error) => {
    try {
      await cleanup();

      if (error) {
        console.error(error);
        process.exit(1);
      }

      console.log("Đã đóng server và giải phóng khóa dữ liệu.");
      process.exit(0);
    } catch (cleanupError) {
      console.error("Lỗi khi đóng ứng dụng:", cleanupError);
      process.exit(1);
    }
  });
}

try {
  db = await openDb({
    dir: resolve(root, "db"),
  });

  await initialize(db, {
    credentialDir: root,
  });

  server = createApp(db).listen(
    port,
    process.env.HOST || "127.0.0.1",
    () => {
      console.log(
        `Backend & production web: http://localhost:${port}`
      );
    }
  );

  server.on("error", async (error) => {
    console.error("Lỗi server:", error.message);

    if (!stopping) {
      stopping = true;

      try {
        await cleanup();
      } catch (cleanupError) {
        console.error(cleanupError);
      }

      process.exit(1);
    }
  });

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  process.on("message", (message) => {
    if (message === "shutdown") {
      stop();
    }
  });

} catch (error) {
  console.error("Không thể khởi động ứng dụng:", error);

  try {
    await cleanup();
  } catch (cleanupError) {
    console.error("Lỗi giải phóng dữ liệu:", cleanupError);
  }

  process.exit(1);
}
