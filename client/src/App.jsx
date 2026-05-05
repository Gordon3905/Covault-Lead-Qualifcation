import { useEffect, useMemo, useState } from "react";
import {
  createDemoLead,
  getLeadDetail,
  getLeads,
  getProviders,
  getReps,
  getScoring,
  getTerritories,
  updateProviderMode
} from "./api.js";
import { DemoSimulator } from "./components/DemoSimulator.jsx";
import { LeadDetail } from "./components/LeadDetail.jsx";
import { LeadInbox } from "./components/LeadInbox.jsx";
import { ProviderSettings } from "./components/ProviderSettings.jsx";
import { ScoringRules } from "./components/ScoringRules.jsx";
import { TerritoryRules } from "./components/TerritoryRules.jsx";

const clients = [
  { slug: "real-estate", label: "Real Estate" },
  { slug: "plumbing", label: "Plumbing" },
  { slug: "law-firm", label: "Law Firm" },
  { slug: "medical-practice", label: "Medical Practice" }
];

export default function App() {
  const [clientSlug, setClientSlug] = useState("real-estate");
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [providers, setProviders] = useState([]);
  const [scoring, setScoring] = useState(null);
  const [territories, setTerritories] = useState(null);
  const [reps, setReps] = useState({ teams: [], reps: [] });
  const [tierFilter, setTierFilter] = useState("all");
  const [isRunningDemo, setIsRunningDemo] = useState(false);
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
