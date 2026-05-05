import cors from "cors";
import express from "express";
import { createDatabase } from "./db/database.js";
import { createRepositories } from "./repositories/index.js";
import { createConfigRouter } from "./routes/config.js";
import { createDemoRouter } from "./routes/demo.js";
import { createLeadRouter } from "./routes/leads.js";
import { createRepsRouter } from "./routes/reps.js";

export function createApp({ db, repos = createRepositories(db ?? createDatabase()) } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "covault-lead-qualification" });
  });

  app.use("/api/leads", createLeadRouter(repos));
  app.use("/api/config", createConfigRouter(repos));
  app.use("/api/reps", createRepsRouter(repos));
  app.use("/api/demo", createDemoRouter(repos));

  app.use((error, _request, response, _next) => {
    response.status(400).json({ error: error.message });
  });

  return app;
}
