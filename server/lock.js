
import {
  mkdir,
  open,
  unlink,
  readFile,
} from "node:fs/promises";

import { resolve } from "node:path";

function isProcessAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;

    // EPERM nghĩa là tiến trình tồn tại nhưng
    // không có quyền kiểm tra đầy đủ.
    return true;
  }
}

export async function acquireDataLock(dir) {
  await mkdir(dir, { recursive: true });

  const lockPath = resolve(dir, ".app.lock");

  while (true) {
    let handle;

    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if (error.code !== "EEXIST") throw error;

      let content;

      try {
        content = await readFile(lockPath, "utf8");
      } catch (readError) {
        if (readError.code === "ENOENT") continue;
        throw readError;
      }

      const pid = Number(content.trim());

      // File rỗng hoặc PID không hợp lệ:
      // không tự ý xóa vì chưa thể xác định chủ sở hữu.
      if (!Number.isSafeInteger(pid) || pid <= 0) {
        throw new Error(
          "File khóa không hợp lệ. Hãy kiểm tra các phiên chạy " +
          "trước khi xử lý data/.app.lock."
        );
      }

      if (isProcessAlive(pid)) {
        throw new Error(
          `Dữ liệu đang được sử dụng bởi tiến trình PID ${pid}. ` +
          "Hãy đóng phiên chạy đó trước."
        );
      }

      // Chỉ xóa khóa cũ khi PID vẫn không thay đổi.
      try {
        const current = await readFile(lockPath, "utf8");

        if (current.trim() !== content.trim()) {
          continue;
        }

        await unlink(lockPath);
      } catch (cleanupError) {
        if (cleanupError.code === "ENOENT") continue;
        throw cleanupError;
      }

      continue;
    }

    try {
      await handle.writeFile(String(process.pid));
    } catch (error) {
      await handle.close();

      try {
        await unlink(lockPath);
      } catch {}

      throw error;
    }

    let released = false;

    return async function release() {
      if (released) return;
      released = true;

      await handle.close();

      try {
        const content = await readFile(lockPath, "utf8");

        if (content.trim() === String(process.pid)) {
          await unlink(lockPath);
        }
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    };
  }
}
