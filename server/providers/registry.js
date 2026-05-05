import { createMockAiAdapter } from "./mock/aiAdapter.js";
import { createMockCrmAdapter } from "./mock/crmAdapter.js";
import { createMockNotificationAdapter } from "./mock/notificationAdapter.js";
import { createMockNurtureAdapter } from "./mock/nurtureAdapter.js";

const mockFactories = {
  ai: createMockAiAdapter,
  crm: createMockCrmAdapter,
  "sales-notification": createMockNotificationAdapter,
  nurture: createMockNurtureAdapter
};

export class LiveAdapterNotConfiguredError extends Error {
  constructor(providerKey) {
    super(`Live adapter for ${providerKey} is not configured`);
    this.name = "LiveAdapterNotConfiguredError";
    this.providerKey = providerKey;
  }
}

export function getProviderAdapter(providerKey, mode = "mock") {
  if (mode === "live") {
    throw new LiveAdapterNotConfiguredError(providerKey);
  }

  const factory = mockFactories[providerKey];
  if (!factory) {
    throw new Error(`Unknown provider adapter: ${providerKey}`);
  }

  return factory();
}
