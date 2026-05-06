import { createHash, randomBytes } from "node:crypto";
import { demoVerticals } from "../db/seedData.js";
import { createClientFromVertical } from "../db/seed.js";

export function onboardCustomer({ db, repos, verticalSlug, email, companyName }) {
  const vertical = demoVerticals.find((candidate) => candidate.slug === verticalSlug);
  if (!vertical) {
    throw new Error(`Unsupported onboarding vertical: ${verticalSlug}`);
  }

  const normalizedEmail = normalizeEmail(email);
  const cleanCompanyName = String(companyName ?? "").trim();
  if (!normalizedEmail || !cleanCompanyName) {
    throw new Error("Company name and email are required");
  }

  const slug = uniqueClientSlug(repos, cleanCompanyName);
  const { client } = createClientFromVertical({ db, repos, vertical, companyName: cleanCompanyName, slug });
  const password = generatePassword();
  const dashboardUrl = dashboardUrlFor(client.slug);
  const user = repos.onboarding.createUser({
    clientId: client.id,
    email: normalizedEmail,
    passwordHash: hashPassword(password)
  });

  repos.onboarding.createEmailDelivery({
    clientId: client.id,
    recipientEmail: normalizedEmail,
    subject: "Your CoVault dashboard is ready",
    body: [
      `Welcome to CoVault, ${cleanCompanyName}.`,
      `Dashboard: ${dashboardUrl}`,
      `Email: ${normalizedEmail}`,
      `Password: ${password}`
    ].join("\n")
  });

  repos.audit.record({
    clientId: client.id,
    eventType: "onboarding.completed",
    actor: "system",
    details: {
      vertical: vertical.slug,
      email: normalizedEmail,
      dashboardUrl,
      userId: user.id
    }
  });

  return {
    client,
    dashboardUrl,
    credentials: {
      email: normalizedEmail,
      password
    }
  };
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function uniqueClientSlug(repos, companyName) {
  const base = slugify(companyName) || "customer";
  let slug = base;
  let suffix = 2;

  while (repos.clients.findBySlug(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function generatePassword() {
  return `CoVault-${randomBytes(4).toString("hex")}`;
}

function hashPassword(password) {
  return createHash("sha256").update(password).digest("hex");
}

function dashboardUrlFor(clientSlug) {
  const baseUrl = (process.env.DASHBOARD_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
  return `${baseUrl}/?clientSlug=${encodeURIComponent(clientSlug)}`;
}
