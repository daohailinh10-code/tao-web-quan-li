import { open, readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

export async function acquireDataLock(directory) {
  const lockPath = resolve(directory, ".pinkbook.lock");

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await open(lockPath, "wx", 0o600);
      await handle.writeFile(String(process.pid), "utf8");
      let released = false;

      return async () => {
        if (released) return;
        released = true;
        await handle.close();
        await unlink(lockPath).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      let ownerPid;
      try {
        ownerPid = Number((await readFile(lockPath, "utf8")).trim());
      } catch (readError) {
        if (readError.code === "ENOENT") continue;
        throw readError;
      }

      let stale = !Number.isSafeInteger(ownerPid) || ownerPid <= 0;
      if (!stale) {
        try {
          process.kill(ownerPid, 0);
        } catch (processError) {
          stale = processError.code === "ESRCH";
          if (processError.code !== "ESRCH" && processError.code !== "EPERM") {
            throw processError;
          }
        }
      }

      if (stale) {
        await unlink(lockPath).catch((unlinkError) => {
          if (unlinkError.code !== "ENOENT") throw unlinkError;
        });
        continue;
      }

      throw new Error(
        `Thư mục dữ liệu đang được tiến trình khác sử dụng (PID ${ownerPid}). Chỉ chạy một bản PinkBook trên cùng DATA_DIR.`,
      );
    }
  }

  throw new Error("Không thể tạo khóa dữ liệu PinkBook. Hãy thử khởi động lại.");
}
