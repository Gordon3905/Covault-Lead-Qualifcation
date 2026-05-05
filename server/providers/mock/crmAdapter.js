export function createMockCrmAdapter() {
  return {
    providerKey: "crm",
    mode: "mock",

    async syncLead({ lead }) {
      return {
        providerKey: "crm",
        mode: "mock",
        status: "synced",
        externalId: `mock-crm-${lead.id ?? lead.name ?? "lead"}`
      };
    }
  };
}
