export function createMockNurtureAdapter() {
  return {
    providerKey: "nurture",
    mode: "mock",

    async enrollInNurture({ lead, sequence }) {
      return {
        providerKey: "nurture",
        mode: "mock",
        status: "enrolled",
        message: `Mock nurture enrollment created for ${lead.name ?? lead.companyName ?? "lead"} in ${sequence.name}.`
      };
    }
  };
}
