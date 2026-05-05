export function LeadDetail({ lead }) {
  if (!lead) {
    return (
      <section className="panel lead-detail empty-state">
        <h2>Lead Detail</h2>
        <p>Select a lead to inspect score breakdown, routing, delivery, and audit history.</p>
      </section>
    );
  }

  const assessment = lead.aiAssessments?.[0];

  return (
    <section className="panel lead-detail">
      <div className="panel-header">
        <div>
          <h2>{lead.payload.name ?? "Unnamed lead"}</h2>
          <p>{lead.payload.industry ?? "unknown"} / {lead.payload.region ?? "no region"}</p>
        </div>
        <span className={`tier-badge tier-${lead.scoring?.tier}`}>{lead.scoring?.tier ?? "new"}</span>
      </div>

      <div className="score-strip">
        <div>
          <span>Score</span>
          <strong>{lead.scoring?.finalScore ?? "-"}</strong>
        </div>
        <div>
          <span>Route</span>
          <strong>{lead.route ? lead.route.strategy : "nurture"}</strong>
        </div>
      </div>

      <div className="detail-grid">
        <article>
          <h3>Score Breakdown</h3>
          <ul className="clean-list">
            {(lead.scoring?.matchedRules ?? []).map((rule) => (
              <li key={rule.id}>
                <span>{rule.label}</span>
                <strong>+{rule.points}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article>
          <h3>Missed Criteria</h3>
          <ul className="clean-list">
            {(lead.scoring?.missedCriteria ?? []).slice(0, 4).map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <strong>{String(item.actual ?? "none")}</strong>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="explanation">
        <h3>AI Assessment</h3>
        <p>{assessment?.explanation ?? "No assessment yet."}</p>
      </article>

      <article>
        <h3>Route Decision</h3>
        <p className="route-copy">{lead.route?.reason ?? "Cold lead entered nurture automatically."}</p>
      </article>

      <article>
        <h3>Audit Timeline</h3>
        <ol className="timeline">
          {(lead.auditEvents ?? []).map((event) => (
            <li key={event.id}>
              <span>{formatTime(event.createdAt)}</span>
              <strong>{event.eventType}</strong>
              <em>{event.providerKey ? `${event.providerKey} / ${event.providerMode}` : event.actor}</em>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}

function formatTime(value) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date(value));
}
