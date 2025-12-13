// src/routes/projects.ts
import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { readProjects, writeProjects } from "../utils/storage";

const router = Router();

const ProjectSchema = z.object({
  name: z.string().min(1),
  rootPool: z.string().optional(), // e.g., "10.0.0.0/8"
  topology: z
    .object({
      nodes: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          hosts: z.number().int().nonnegative(),
          vlan: z.union([z.string(), z.number()]).optional(),
        })
      ),
      links: z.array(
        z.object({
          from: z.string(),
          to: z.string(),
        })
      ).optional(),
    })
    .optional(),
});

router.post("/", async (req, res) => {
  try {
    const parsed = ProjectSchema.parse(req.body);

    const projects = await readProjects();

    const id = uuidv4();
    const newProject = {
      id,
      name: parsed.name,
      rootPool: parsed.rootPool || "10.0.0.0/8",
      topology: parsed.topology || { nodes: [], links: [] },
      createdAt: new Date().toISOString(),
    };

    projects.push(newProject);
    await writeProjects(projects);

    return res.status(201).json({ project: newProject });
  } catch (err: any) {
    if (err?.issues) {
      // zod validation error
      return res.status(400).json({ error: "validation", details: err.issues });
    }
    console.error("POST /api/projects error:", err);
    return res.status(500).json({ error: "internal_server_error" });
  }
});

router.get("/", async (_req, res) => {
  const projects = await readProjects();
  return res.json({ projects });
});

router.get("/:id", async (req, res) => {
  const projects = await readProjects();
  const p = projects.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: "not_found" });
  return res.json({ project: p });
});

export default router;
