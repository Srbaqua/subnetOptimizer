// src/utils/storage.ts
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

export async function readProjects(): Promise<any[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(PROJECTS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return []; // no file yet
  }
}

export async function writeProjects(projects: any[]) {
  await ensureDataDir();
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf8");
}
