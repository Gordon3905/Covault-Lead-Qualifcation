import express from "express";

export function createApp() {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "covault-lead-qualification" });
  });

  return app;
}
