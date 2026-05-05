import { createAuditRepository } from "./auditRepository.js";
import { createClientRepository } from "./clientRepository.js";
import { createLeadRepository } from "./leadRepository.js";
import { createProviderRepository } from "./providerRepository.js";
import { createRoutingRepository } from "./routingRepository.js";
import { createRuleRepository } from "./ruleRepository.js";
import { createTeamRepository } from "./teamRepository.js";

export function createRepositories(db) {
  return {
    audit: createAuditRepository(db),
    clients: createClientRepository(db),
    leads: createLeadRepository(db),
    providers: createProviderRepository(db),
    routing: createRoutingRepository(db),
    rules: createRuleRepository(db),
    teams: createTeamRepository(db)
  };
}
