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
import { SignupFlow } from "./components/SignupFlow.jsx";

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
  const qualifiedCount = leads.filter((lead) => lead.scoring?.tier === "qualified").length;
  const nurtureCount = leads.filter((lead) => lead.scoring?.tier === "nurture").length;

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
          <h1>Kavor Leads</h1>
          <p>See who is ready for sales and where they go next.</p>
        </div>
        <label className="client-switcher">
          <span>Demo type</span>
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

      <section className="demo-hero">
        <div>
          <span className="eyebrow">Live product demo</span>
          <h2>Drop in a lead. Kavor decides what happens next.</h2>
          <p>
            A new prospect comes in, gets scored, gets explained in plain English, and is sent to the right rep or nurture path.
          </p>
        </div>
        <DemoSimulator clientSlug={clientSlug} isRunning={isRunningDemo} onRunDemo={handleRunDemo} />
      </section>

      <section className="workspace-summary">
        <div>
          <span>Total leads</span>
          <strong>{leads.length}</strong>
        </div>
        <div>
          <span>Ready for sales</span>
          <strong>{qualifiedCount}</strong>
        </div>
        <div>
          <span>Sent to nurture</span>
          <strong>{nurtureCount}</strong>
        </div>
        <div>
          <span>Sales team</span>
          <strong>{reps.reps.length} reps</strong>
        </div>
      </section>

      <div className="dashboard-grid">
        <LeadInbox
          leads={leads}
          selectedLeadId={selectedLeadId}
          onSelectLead={setSelectedLeadId}
          tierFilter={tierFilter}
          onTierFilterChange={setTierFilter}
        />

        <LeadDetail lead={selectedLead} />
      </div>

      <SignupFlow isSubmitting={isSigningUp} result={signupResult} onSignup={handleSignup} />
    </main>
  );
}
