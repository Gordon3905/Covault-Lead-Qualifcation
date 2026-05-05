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
  const matched = scoreResult.matchedRules?.[0];
  const missed = scoreResult.missedCriteria?.[0];
  const matchText = matched ? ` Strongest fit signal: ${matched.label} (+${matched.points}).` : "";
  const missText = missed ? ` Main gap to resolve: ${formatMissedCriterion(missed)}.` : "";

  return {
    explanation: `${leadName} is a ${scoreResult.tier} lead with a score of ${scoreResult.finalScore}.${matchText}${missText}`,
    fallbackUsed: true,
    enabled
  };
}

function formatMissedCriterion(missed) {
  const expected = formatValue(missed.expected);
  const actual = missed.actual === null || missed.actual === undefined ? "no value" : formatValue(missed.actual);
  return `${missed.label} expected ${expected} but received ${actual}`;
}

function formatValue(value) {
  return Array.isArray(value) ? value.join(" or ") : String(value);
}
