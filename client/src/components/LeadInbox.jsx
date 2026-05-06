export function LeadInbox({ leads, selectedLeadId, onSelectLead, tierFilter, onTierFilterChange }) {
  const filteredLeads = tierFilter === "all" ? leads : leads.filter((lead) => lead.scoring?.tier === tierFilter);

  return (
    <section className="panel lead-inbox">
      <div className="panel-header">
        <div>
          <h2>Incoming leads</h2>
          <p>Click one to see what CoVault did with it.</p>
        </div>
        <select value={tierFilter} onChange={(event) => onTierFilterChange(event.target.value)} aria-label="Filter by tier">
          <option value="all">All leads</option>
          <option value="qualified">Ready for sales</option>
          <option value="review">Needs review</option>
          <option value="nurture">Nurture</option>
        </select>
      </div>

      <div className="lead-list">
        {filteredLeads.map((lead) => (
          <button
            type="button"
            key={lead.id}
            className={`lead-card ${lead.id === selectedLeadId ? "selected-row" : ""}`}
            onClick={() => onSelectLead(lead.id)}
          >
            <span className={`tier-badge tier-${lead.scoring?.tier}`}>{tierLabel(lead.scoring?.tier)}</span>
            <strong>{lead.payload.name ?? lead.payload.companyName ?? "Unnamed lead"}</strong>
            <span>
              {money(lead.payload.budget)} budget · {lead.payload.urgency ?? "unknown"} intent · {lead.payload.region ?? "no region"}
            </span>
            <em>{formatDate(lead.createdAt)}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function tierLabel(tier) {
  if (tier === "qualified") return "Ready for sales";
  if (tier === "review") return "Needs review";
  if (tier === "nurture") return "Nurture";
  return "New";
}

function money(value) {
  if (!Number.isFinite(Number(value))) {
    return "Unknown";
  }

  return `$${Number(value).toLocaleString()}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  );
}
