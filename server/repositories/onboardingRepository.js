import { createId, nowIso } from "./utils.js";

export function createOnboardingRepository(db) {
  return {
    createUser(input) {
      const user = {
        id: input.id ?? createId("user"),
        clientId: input.clientId,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role ?? "owner",
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO customer_users (id, client_id, email, password_hash, role, created_at)
        VALUES (@id, @clientId, @email, @passwordHash, @role, @createdAt)
      `).run(user);

      return user;
    },

    createEmailDelivery(input) {
      const delivery = {
        id: input.id ?? createId("email"),
        clientId: input.clientId,
        recipientEmail: input.recipientEmail,
        subject: input.subject,
        body: input.body,
        providerKey: input.providerKey ?? "onboarding-email",
        providerMode: input.providerMode ?? "mock",
        status: input.status ?? "sent",
        createdAt: nowIso()
      };

      db.prepare(`
        INSERT INTO email_deliveries (
          id, client_id, recipient_email, subject, body, provider_key, provider_mode, status, created_at
        )
        VALUES (
          @id, @clientId, @recipientEmail, @subject, @body, @providerKey, @providerMode, @status, @createdAt
        )
      `).run(delivery);

      return delivery;
    }
  };
}
