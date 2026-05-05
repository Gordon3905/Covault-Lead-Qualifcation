export function createMockAiAdapter() {
  return {
    providerKey: "ai",
    mode: "mock",

    async assessLead({ lead, scoreResult }) {
      const leadName = lead.name ?? lead.companyName ?? "This lead";
      const topMatch = scoreResult.matchedRules?.[0];
      const firstMiss = scoreResult.missedCriteria?.[0]?.label;
      const matchText = topMatch ? ` Strongest fit signal: ${topMatch.label} (+${topMatch.points}).` : "";
      const missText = firstMiss ? ` Main gap to resolve: ${firstMiss}.` : "";

      return {
        providerKey: "ai",
        mode: "mock",
        explanation: `${leadName} is a ${scoreResult.tier} lead with a score of ${scoreResult.finalScore}.${matchText}${missText}`
      };
    }
  };
}
