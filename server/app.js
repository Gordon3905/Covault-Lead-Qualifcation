import cors from "cors";
import express from "express";
import { createDatabase } from "./db/database.js";
import { createRepositories } from "./repositories/index.js";
import { createConfigRouter } from "./routes/config.js";
import { createDemoRouter } from "./routes/demo.js";
import { createLeadRouter } from "./routes/leads.js";
import { createOnboardingRouter } from "./routes/onboarding.js";
import { createRepsRouter } from "./routes/reps.js";

export function createApp({ db, repos } = {}) {
  const database = db ?? createDatabase();
  const appRepos = repos ?? createRepositories(database);
  const app = express();

  app.use(cors(createCorsOptions()));
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "covault-lead-qualification" });
  });

  app.use("/api/leads", createLeadRouter(appRepos));
  app.use("/api/config", createConfigRouter(appRepos));
  app.use("/api/reps", createRepsRouter(appRepos));
  app.use("/api/demo", createDemoRouter(appRepos));
  app.use("/api/onboarding", createOnboardingRouter({ db: database, repos: appRepos }));

  app.use((error, _request, response, _next) => {
    response.status(400).json({ error: error.message });
  });

  return app;
}

function createCorsOptions() {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!allowedOrigins.length) {
    return {};
  }

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
  };
}
