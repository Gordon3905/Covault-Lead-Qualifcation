export function createMockAiAdapter() {
  return {
    providerKey: "ai",
    mode: "mock",

    async assessLead({ lead, scoreResult }) {
      const leadName = lead.name ?? lead.companyName ?? "This lead";
      const topMatch = scoreResult.matchedRules?.[0]?.label ?? "the configured fit criteria";
      const firstMiss = scoreResult.missedCriteria?.[0]?.label;
      const missText = firstMiss ? ` The main gap is ${firstMiss.toLowerCase()}.` : "";

      return {
        providerKey: "ai",
        mode: "mock",
        explanation: `${leadName} is ${scoreResult.tier} with a score of ${scoreResult.finalScore} because ${topMatch.toLowerCase()} matched.${missText}`
      };
    }
  };
}
