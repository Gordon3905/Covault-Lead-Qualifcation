import express from "express";
import { onboardCustomer } from "../core/onboardingService.js";

export function createOnboardingRouter({ db, repos }) {
  const router = express.Router();

  router.post("/signup", (request, response) => {
    const result = onboardCustomer({
      db,
      repos,
      verticalSlug: request.body.vertical,
      email: request.body.email,
      companyName: request.body.companyName
    });

    response.status(201).json(result);
  });

  return router;
}
