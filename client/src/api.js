async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getLeads(clientSlug) {
  return request(`/api/leads?clientSlug=${encodeURIComponent(clientSlug)}`);
}

export function getLeadDetail(leadId) {
  return request(`/api/leads/${leadId}`);
}

export function getProviders(clientSlug) {
  return request(`/api/config/providers?clientSlug=${encodeURIComponent(clientSlug)}`);
}

export function updateProviderMode(clientSlug, providerKey, mode) {
  return request(`/api/config/providers/${providerKey}`, {
    method: "PATCH",
    body: JSON.stringify({ clientSlug, mode })
  });
}

export function getScoring(clientSlug) {
  return request(`/api/config/scoring?clientSlug=${encodeURIComponent(clientSlug)}`);
}

export function getTerritories(clientSlug) {
  return request(`/api/config/territories?clientSlug=${encodeURIComponent(clientSlug)}`);
}

export function getReps(clientSlug) {
  return request(`/api/reps?clientSlug=${encodeURIComponent(clientSlug)}`);
}

export function createDemoLead(clientSlug, payload) {
  return request("/api/demo/leads", {
    method: "POST",
    body: JSON.stringify({ clientSlug, payload })
  });
}
