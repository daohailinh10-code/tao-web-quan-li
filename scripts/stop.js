import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";

const dataDir = resolve(process.env.DATA_DIR || "./data");
const lockPath = resolve(dataDir, ".app.lock");

let content;
try {
  content = await readFile(lockPath, "utf8");
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("PinkBook hiện không có phiên chạy nào đang giữ khóa dữ liệu.");
    process.exit(0);
  }
  throw error;
}

const taskPid = Number(content.trim());
if (!Number.isSafeInteger(taskPid) || taskPid <= 0) {
  throw new Error(`File khóa không hợp lệ: ${lockPath}`);
}
if (taskPid === process.pid) {
  throw new Error("Không thể dừng chính tiến trình stop.");
}

try {
  process.kill(taskPid, 0);
} catch (error) {
  if (error.code === "ESRCH") {
    await unlink(lockPath);
    console.log(`Đã xóa khóa cũ của PID ${taskPid}.`);
    process.exit(0);
  }
  throw error;
}

process.kill(taskPid);
console.log(`Đã gửi yêu cầu dừng phiên PinkBook PID ${taskPid}.`);
