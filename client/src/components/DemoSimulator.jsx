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
    <section className="simulator-panel">
      <div>
        <h3>Test it now</h3>
        <p>Create a fresh high-intent lead and watch Kavor handle it.</p>
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
        {isRunning ? "Processing lead..." : "Send a new lead through"}
      </button>
    </section>
  );
}
