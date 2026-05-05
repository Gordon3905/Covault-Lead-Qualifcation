export function LeadInbox({ leads, selectedLeadId, onSelectLead, tierFilter, onTierFilterChange }) {
  const filteredLeads = tierFilter === "all" ? leads : leads.filter((lead) => lead.scoring?.tier === tierFilter);

  return (
    <section className="panel lead-inbox">
      <div className="panel-header">
        <div>
          <h2>Lead Inbox</h2>
          <p>{filteredLeads.length} visible leads</p>
        </div>
        <select value={tierFilter} onChange={(event) => onTierFilterChange(event.target.value)} aria-label="Filter by tier">
          <option value="all">All tiers</option>
          <option value="qualified">Qualified</option>
          <option value="review">Review</option>
          <option value="nurture">Nurture</option>
        </select>
      </div>

      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead) => (
              <tr
                key={lead.id}
                className={lead.id === selectedLeadId ? "selected-row" : ""}
                onClick={() => onSelectLead(lead.id)}
              >
                <td>
                  <strong>{lead.payload.name ?? lead.payload.companyName ?? "Unnamed lead"}</strong>
                  <span>{lead.payload.industry ?? "unknown industry"}</span>
                </td>
                <td>{lead.source}</td>
                <td>
                  <span className="status-badge">{lead.scoring?.tier ?? lead.status}</span>
                </td>
                <td>{formatDate(lead.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  );
}
