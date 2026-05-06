import { createId, nowIso } from "./utils.js";

export function createOnboardingRepository(db) {
  return {
    findUserByEmail(email) {
      const row = db.prepare("SELECT * FROM customer_users WHERE email = ?").get(email);
      return row ? mapUser(row) : null;
    },

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

    updateUserPassword(input) {
      db.prepare("UPDATE customer_users SET password_hash = ? WHERE id = ?").run(input.passwordHash, input.userId);
      const row = db.prepare("SELECT * FROM customer_users WHERE id = ?").get(input.userId);
      return row ? mapUser(row) : null;
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

function mapUser(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at
  };
}
