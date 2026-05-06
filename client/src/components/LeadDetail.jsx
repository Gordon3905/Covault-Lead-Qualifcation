export function LeadDetail({ lead }) {
  if (!lead) {
    return (
      <section className="panel lead-detail empty-state">
        <h2>What happened?</h2>
        <p>Select a lead to see the decision, the assigned follow-up, and the reason.</p>
      </section>
    );
  }

  const assessment = lead.aiAssessments?.[0];
  const action = lead.scoring?.tier === "qualified" ? "Send to sales now" : lead.scoring?.tier === "review" ? "Have a manager review" : "Start nurture";

  return (
    <section className="panel lead-detail">
      <div className="panel-header">
        <div>
          <h2>{lead.payload.name ?? "Unnamed lead"}</h2>
          <p>{lead.payload.region ?? "No region"} · {money(lead.payload.budget)} budget · {lead.payload.urgency ?? "unknown"} intent</p>
        </div>
        <span className={`tier-badge tier-${lead.scoring?.tier}`}>{tierLabel(lead.scoring?.tier)}</span>
      </div>

      <div className="outcome-card">
        <span>Kavor decision</span>
        <strong>{action}</strong>
        <p>{lead.route?.reason ?? "This lead is not sales-ready yet, so Kavor puts it into nurture automatically."}</p>
      </div>

      <div className="simple-steps">
        <article>
          <span>1</span>
          <strong>Lead captured</strong>
          <p>{lead.source} · {formatTime(lead.createdAt)}</p>
        </article>
        <article>
          <span>2</span>
          <strong>Fit checked</strong>
          <p>{lead.scoring?.finalScore ?? "-"} score · {topRule(lead)}</p>
        </article>
        <article>
          <span>3</span>
          <strong>{lead.route ? "Routed to sales" : "Sent to nurture"}</strong>
          <p>{lead.route ? "Territory and round-robin assignment complete." : "Automatic follow-up sequence started."}</p>
        </article>
      </div>

      <article className="explanation">
        <h3>Why this decision?</h3>
        <p>{assessment?.explanation ?? "No assessment yet."}</p>
      </article>

      <details className="technical-details">
        <summary>Manager proof log</summary>
        <ol className="timeline">
          {(lead.auditEvents ?? []).map((event) => (
            <li key={event.id}>
              <span>{formatTime(event.createdAt)}</span>
              <strong>{event.eventType}</strong>
              <em>{event.providerKey ? `${event.providerKey} / ${event.providerMode}` : event.actor}</em>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

function tierLabel(tier) {
  if (tier === "qualified") return "Ready for sales";
  if (tier === "review") return "Needs review";
  if (tier === "nurture") return "Nurture";
  return "New";
}

function topRule(lead) {
  return lead.scoring?.matchedRules?.[0]?.label ?? "No strong fit yet";
}

function money(value) {
  if (!Number.isFinite(Number(value))) {
    return "Unknown";
  }

  return `$${Number(value).toLocaleString()}`;
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}
