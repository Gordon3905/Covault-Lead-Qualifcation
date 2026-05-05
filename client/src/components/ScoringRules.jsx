export function ScoringRules({ scoring }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-header">
        <div>
          <h2>Scoring Rules</h2>
          <p>{scoring?.activeVersion?.name ?? "No active version"}</p>
        </div>
      </div>
      <div className="version-box">
        <span>Active version</span>
        <strong>{scoring?.activeVersion?.id ?? "-"}</strong>
      </div>
    </section>
  );
}
