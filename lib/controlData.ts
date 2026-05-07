import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function readJson<T>(blobPath: string, fallback: T): Promise<T> {
  // Local file fallback for dev
  const filePath = path.join(DATA_DIR, blobPath);
  try {
    ensureDir(path.dirname(filePath));
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch {
    // fall through
  }
  return fallback;
}

export async function writeJson<T>(blobPath: string, data: T): Promise<void> {
  const filePath = path.join(DATA_DIR, blobPath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readFile(blobPath: string): Promise<Buffer | null> {
  const filePath = path.join(DATA_DIR, blobPath);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch {
    // fall through
  }
  return null;
}

export async function writeFile(
  blobPath: string,
  data: Buffer | Uint8Array
): Promise<void> {
  const filePath = path.join(DATA_DIR, blobPath);
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

export async function deleteFile(blobPath: string): Promise<void> {
  const filePath = path.join(DATA_DIR, blobPath);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // ignore
  }
}

export async function listFiles(dirPath: string): Promise<string[]> {
  const fullPath = path.join(DATA_DIR, dirPath);
  try {
    ensureDir(fullPath);
    return fs.readdirSync(fullPath);
  } catch {
    return [];
  }
}
