// src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import projectsRouter from "./routes/projects";
// import plansRouter from "./routes/plans";
import plansRouter from "./routes/plans";
// ...


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/projects", projectsRouter);
app.use("/api/plans", plansRouter);



app.get("/api/hello", (_req, res) => {
  res.json({ message: "Backend is working!", time: new Date().toISOString() });
});

// mount projects
app.use("/api/projects", projectsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
