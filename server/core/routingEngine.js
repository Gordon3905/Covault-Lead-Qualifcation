import { evaluateRule, readLeadValue } from "./scoringEngine.js";

export function routeLead({ lead, territoryVersion, territories, reps, cursorStore }) {
  const activeReps = reps.filter((rep) => rep.active !== false);
  if (!activeReps.length) {
    throw new Error("Cannot route lead without active reps");
  }

  const matchedTerritory = chooseTerritoryMatch(lead, territories);
  if (!matchedTerritory) {
    return routeByFullTeamRoundRobin({ territoryVersion, activeReps, cursorStore });
  }

  const directRep = matchedTerritory.repId ? activeReps.find((rep) => rep.id === matchedTerritory.repId) : null;
  if (directRep) {
    return {
      territoryRuleVersionId: territoryVersion.id,
      territoryId: matchedTerritory.id,
      teamId: directRep.teamId ?? matchedTerritory.teamId ?? null,
      repId: directRep.id,
      strategy: "territory-direct",
      reason: `Matched territory ${matchedTerritory.name} and assigned directly to ${directRep.name}.`
    };
  }

  if (matchedTerritory.teamId) {
    const teamReps = activeReps.filter((rep) => rep.teamId === matchedTerritory.teamId);
    if (teamReps.length) {
      const cursor = cursorStore.getAndAdvance({
        scopeKey: `territory:${matchedTerritory.id}:team:${matchedTerritory.teamId}`,
        repIds: teamReps.map((rep) => rep.id)
      });
      const selectedRep = teamReps.find((rep) => rep.id === cursor.selectedRepId);

      return {
        territoryRuleVersionId: territoryVersion.id,
        territoryId: matchedTerritory.id,
        teamId: matchedTerritory.teamId,
        repId: selectedRep.id,
        strategy: "territory-team-round-robin",
        reason: `Matched territory ${matchedTerritory.name} and round-robined within the assigned team.`
      };
    }
  }

  return routeByFullTeamRoundRobin({
    territoryVersion,
    activeReps,
    cursorStore,
    territoryId: matchedTerritory.id,
    reasonPrefix: `Matched territory ${matchedTerritory.name}, but no active assigned rep was available.`
  });
}

export function chooseTerritoryMatch(lead, territories) {
  const matches = territories
    .map((territory) => ({
      ...territory,
      matchedConditionCount: countMatchedConditions(lead, territory.conditions ?? [])
    }))
    .filter((territory) => territory.matchedConditionCount === (territory.conditions ?? []).length);

  if (!matches.length) {
    return null;
  }

  return matches.sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    if (right.matchedConditionCount !== left.matchedConditionCount) {
      return right.matchedConditionCount - left.matchedConditionCount;
    }

    return left.name.localeCompare(right.name);
  })[0];
}

function routeByFullTeamRoundRobin({ territoryVersion, activeReps, cursorStore, territoryId = null, reasonPrefix = null }) {
  const cursor = cursorStore.getAndAdvance({
    scopeKey: "full-team",
    repIds: activeReps.map((rep) => rep.id)
  });
  const selectedRep = activeReps.find((rep) => rep.id === cursor.selectedRepId);

  return {
    territoryRuleVersionId: territoryVersion.id,
    territoryId,
    teamId: selectedRep.teamId ?? null,
    repId: selectedRep.id,
    strategy: "full-team-round-robin",
    reason: reasonPrefix
      ? `${reasonPrefix} Fell back to full sales team round-robin.`
      : "No territory matched; assigned by full sales team round-robin."
  };
}

function countMatchedConditions(lead, conditions) {
  return conditions.filter((condition) => evaluateRule(readLeadValue(lead, condition.field), condition.operator, condition.value)).length;
}
