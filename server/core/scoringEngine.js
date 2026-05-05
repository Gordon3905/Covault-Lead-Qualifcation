export function scoreLead(lead, rules, version) {
  const matchedRules = [];
  const missedCriteria = [];
  let finalScore = 0;

  for (const rule of rules) {
    const value = readLeadValue(lead, rule.field);
    const matched = evaluateRule(value, rule.operator, rule.value);
    const points = Math.round(Number(rule.points) * Number(rule.weight ?? 1));

    if (matched) {
      finalScore += points;
      matchedRules.push({
        id: rule.id,
        label: rule.label,
        points
      });
    } else {
      missedCriteria.push({
        id: rule.id,
        label: rule.label,
        expected: rule.value,
        actual: value ?? null
      });
    }
  }

  return {
    scoringRuleVersionId: version.id,
    finalScore,
    tier: determineTier(finalScore),
    matchedRules,
    missedCriteria,
    breakdown: matchedRules
  };
}

export function evaluateRule(actual, operator, expected) {
  switch (operator) {
    case "equals":
      return normalize(actual) === normalize(expected);
    case "notEquals":
      return normalize(actual) !== normalize(expected);
    case "in":
      return Array.isArray(expected) && expected.map(normalize).includes(normalize(actual));
    case "contains":
      return String(actual ?? "").toLowerCase().includes(String(expected ?? "").toLowerCase());
    case "greaterThan":
      return Number(actual) > Number(expected);
    case "greaterThanOrEqual":
      return Number(actual) >= Number(expected);
    case "lessThan":
      return Number(actual) < Number(expected);
    case "lessThanOrEqual":
      return Number(actual) <= Number(expected);
    case "between":
      return Array.isArray(expected) && Number(actual) >= Number(expected[0]) && Number(actual) <= Number(expected[1]);
    case "exists":
      return actual !== undefined && actual !== null && actual !== "";
    default:
      throw new Error(`Unsupported scoring operator: ${operator}`);
  }
}

export function readLeadValue(lead, fieldPath) {
  return fieldPath.split(".").reduce((value, segment) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    return value[segment];
  }, lead);
}

function determineTier(score) {
  if (score >= 75) {
    return "qualified";
  }

  if (score >= 45) {
    return "review";
  }

  return "nurture";
}

function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}
