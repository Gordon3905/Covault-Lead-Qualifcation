export async function generateLeadExplanation({ lead, scoreResult, aiEnabled, aiAdapter }) {
  if (aiEnabled && aiAdapter) {
    try {
      const assessment = await aiAdapter.assessLead({ lead, scoreResult });
      return {
        explanation: assessment.explanation,
        fallbackUsed: false,
        enabled: true
      };
    } catch {
      return deterministicExplanation({ lead, scoreResult, enabled: true });
    }
  }

  return deterministicExplanation({ lead, scoreResult, enabled: false });
}

function deterministicExplanation({ lead, scoreResult, enabled }) {
  const leadName = lead.name ?? lead.companyName ?? "This lead";
  const matched = scoreResult.matchedRules?.[0]?.label;
  const missed = scoreResult.missedCriteria?.[0]?.label;
  const matchText = matched ? ` It matched ${matched}.` : "";
  const missText = missed ? ` The first gap is ${missed}.` : "";

  return {
    explanation: `${leadName} is ${scoreResult.tier} with a score of ${scoreResult.finalScore}.${matchText}${missText}`,
    fallbackUsed: true,
    enabled
  };
}
