export function createMockNotificationAdapter() {
  return {
    providerKey: "sales-notification",
    mode: "mock",

    async notify({ lead, rep }) {
      return {
        providerKey: "sales-notification",
        mode: "mock",
        status: "delivered",
        message: `Mock notification sent for ${lead.name ?? lead.companyName ?? "lead"} to ${rep.name}.`
      };
    }
  };
}
