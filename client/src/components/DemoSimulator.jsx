const demoLeadTemplates = {
  "real-estate": {
    name: "Live Demo Realty",
    industry: "real_estate",
    budget: 23500,
    urgency: "high",
    region: "Florida",
    sourceQuality: "partner_referral",
    companySize: "51-200"
  },
  plumbing: {
    name: "Live Demo Pipe Rescue",
    industry: "plumbing",
    budget: 17500,
    urgency: "high",
    region: "Ohio",
    sourceQuality: "emergency_form",
    companySize: "11-50"
  },
  "law-firm": {
    name: "Live Demo Legal Group",
    industry: "law_firm",
    budget: 26000,
    urgency: "high",
    region: "Texas",
    sourceQuality: "partner_referral",
    companySize: "51-200"
  },
  "medical-practice": {
    name: "Live Demo Clinic",
    industry: "medical_practice",
    budget: 24000,
    urgency: "high",
    region: "New York",
    sourceQuality: "partner_referral",
    companySize: "51-200"
  }
};

export function DemoSimulator({ clientSlug, isRunning, onRunDemo }) {
  const payload = demoLeadTemplates[clientSlug] ?? demoLeadTemplates["real-estate"];

  return (
    <section className="panel simulator-panel">
      <div>
        <h2>Demo Simulator</h2>
        <p>Inject a fresh high-intent lead through the live pipeline.</p>
      </div>
      <dl>
        <div>
          <dt>Lead</dt>
          <dd>{payload.name}</dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>${payload.budget.toLocaleString()}</dd>
        </div>
      </dl>
      <button type="button" onClick={() => onRunDemo(payload)} disabled={isRunning}>
        {isRunning ? "Processing..." : "Run Live Demo Lead"}
      </button>
    </section>
  );
}
