// src/routes/plans.ts
import { Router } from "express";
import { readProjects, writeProjects } from "../utils/storage";
import { v4 as uuidv4 } from "uuid";
import { allocateGreedy } from "../algorithms/allocator";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { analyzeAllocations } from "../algorithms/analyzer";


const router = Router();

const PLANS_FILE = path.join(__dirname, "..", "..", "data", "plans.json");

async function readPlans() {
  try {
    const raw = await readFile(PLANS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writePlans(plans: any[]) {
  await writeFile(PLANS_FILE, JSON.stringify(plans, null, 2), "utf8");
}

router.post("/:projectId/plan", async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const projects = await readProjects();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return res.status(404).json({ error: "project_not_found" });

    // sites come from project's topology nodes
    const sites = (project.topology?.nodes || []).map((n: any) => ({ id: n.id || uuidv4(), name: n.name, hosts: n.hosts || 0 }));

    // run allocator on project's rootPool
    const rootPool = project.rootPool || "10.0.0.0/8";
    const result = await allocateGreedy(rootPool, sites);

    // store plan
    const plans = await readPlans();
    const analysis = analyzeAllocations(result.allocations);

    const plan = {
    id: uuidv4(),
    projectId,
    createdAt: new Date().toISOString(),
    rootPool,
    allocations: result.allocations,
    available: result.available,
    analysis,
    };
    plans.push(plan);
    await writePlans(plans);

    return res.status(201).json({ plan });
  } catch (err) {
    console.error("POST /api/plans error:", err);
    return res.status(500).json({ error: "internal_server_error" });
  }
});

router.get("/project/:projectId", async (req, res) => {
  const plans = await readPlans();
  const filtered = plans.filter((p) => p.projectId === req.params.projectId);
  return res.json({ plans: filtered });
});

export default router;
