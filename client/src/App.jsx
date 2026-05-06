import { useEffect, useMemo, useState } from "react";
import {
  createDemoLead,
  getLeadDetail,
  getLeads,
  getProviders,
  getReps,
  getScoring,
  getTerritories,
  signupCustomer,
  updateProviderMode
} from "./api.js";
import { DemoSimulator } from "./components/DemoSimulator.jsx";
import { LeadDetail } from "./components/LeadDetail.jsx";
import { LeadInbox } from "./components/LeadInbox.jsx";
import { ProviderSettings } from "./components/ProviderSettings.jsx";
import { ScoringRules } from "./components/ScoringRules.jsx";
import { SignupFlow } from "./components/SignupFlow.jsx";
import { TerritoryRules } from "./components/TerritoryRules.jsx";

const demoClients = [
  { slug: "real-estate", label: "Real Estate" },
  { slug: "plumbing", label: "Plumbing" },
  { slug: "law-firm", label: "Law Firm" },
  { slug: "medical-practice", label: "Medical Practice" }
];

export default function App() {
  const initialClientSlug = new URLSearchParams(window.location.search).get("clientSlug") ?? "real-estate";
  const [clients, setClients] = useState(demoClients);
  const [clientSlug, setClientSlug] = useState(initialClientSlug);
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [providers, setProviders] = useState([]);
  const [scoring, setScoring] = useState(null);
  const [territories, setTerritories] = useState(null);
  const [reps, setReps] = useState({ teams: [], reps: [] });
  const [tierFilter, setTierFilter] = useState("all");
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupResult, setSignupResult] = useState(null);
  const [error, setError] = useState("");

  const selectedClient = useMemo(() => clients.find((client) => client.slug === clientSlug), [clientSlug]);

  useEffect(() => {
    refreshWorkspace(clientSlug);
  }, [clientSlug]);

  useEffect(() => {
    if (!selectedLeadId) {
      setSelectedLead(null);
      return;
    }

    getLeadDetail(selectedLeadId)
      .then((response) => setSelectedLead(response.lead))
      .catch((requestError) => setError(requestError.message));
  }, [selectedLeadId]);

  async function refreshWorkspace(slug, preferredLeadId = null) {
    setError("");
    const [leadResponse, providerResponse, scoringResponse, territoryResponse, repResponse] = await Promise.all([
      getLeads(slug),
      getProviders(slug),
      getScoring(slug),
      getTerritories(slug),
      getReps(slug)
    ]);

    setLeads(leadResponse.leads);
    setProviders(providerResponse.providers);
    setScoring(scoringResponse);
    setTerritories(territoryResponse);
    setReps(repResponse);
    setSelectedLeadId(preferredLeadId ?? leadResponse.leads[0]?.id ?? null);
  }

  async function handleRunDemo(payload) {
    setIsRunningDemo(true);
    setError("");
    try {
      const response = await createDemoLead(clientSlug, payload);
      await refreshWorkspace(clientSlug, response.lead.id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsRunningDemo(false);
    }
  }

  async function handleSignup(input) {
    setIsSigningUp(true);
    setError("");
    try {
      const response = await signupCustomer(input);
      setSignupResult(response);
      setClients((current) => {
        if (current.some((client) => client.slug === response.client.slug)) {
          return current;
        }

        return [{ slug: response.client.slug, label: response.client.name }, ...current];
      });
      setClientSlug(response.client.slug);
      await refreshWorkspace(response.client.slug);
      window.history.replaceState(null, "", `?clientSlug=${encodeURIComponent(response.client.slug)}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSigningUp(false);
    }
  }

  async function handleToggleProvider(provider) {
    const nextMode = provider.mode === "mock" ? "live" : "mock";
    try {
      await updateProviderMode(clientSlug, provider.providerKey, nextMode);
      const response = await getProviders(clientSlug);
      setProviders(response.providers);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>CoVault Lead Qualification</h1>
          <p>Live intake, scoring, routing, and audit console</p>
        </div>
        <label className="client-switcher">
          <span>Client</span>
          <select value={clientSlug} onChange={(event) => setClientSlug(event.target.value)}>
            {clients.map((client) => (
              <option key={client.slug} value={client.slug}>
                {client.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="workspace-summary">
        <div>
          <span>Active vertical</span>
          <strong>{selectedClient?.label}</strong>
        </div>
        <div>
          <span>Leads</span>
          <strong>{leads.length}</strong>
        </div>
        <div>
          <span>Sales reps</span>
          <strong>{reps.reps.length}</strong>
        </div>
        <div>
          <span>Provider modes</span>
          <strong>{providers.filter((provider) => provider.mode === "mock").length} mock</strong>
        </div>
      </section>

      <div className="dashboard-grid">
        <aside className="left-rail">
          <SignupFlow isSubmitting={isSigningUp} result={signupResult} onSignup={handleSignup} />
          <DemoSimulator clientSlug={clientSlug} isRunning={isRunningDemo} onRunDemo={handleRunDemo} />
          <ProviderSettings providers={providers} onToggleMode={handleToggleProvider} />
          <ScoringRules scoring={scoring} />
          <TerritoryRules territories={territories} reps={reps} />
        </aside>

        <LeadInbox
          leads={leads}
          selectedLeadId={selectedLeadId}
          onSelectLead={setSelectedLeadId}
          tierFilter={tierFilter}
          onTierFilterChange={setTierFilter}
        />

        <LeadDetail lead={selectedLead} />
      </div>
    </main>
  );
}
