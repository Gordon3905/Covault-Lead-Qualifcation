export function TerritoryRules({ territories, reps }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-header">
        <div>
          <h2>Territories</h2>
          <p>{territories?.activeVersion?.name ?? "No active version"}</p>
        </div>
      </div>
      <div className="mini-stats">
        <div>
          <span>Teams</span>
          <strong>{reps?.teams?.length ?? 0}</strong>
        </div>
        <div>
          <span>Reps</span>
          <strong>{reps?.reps?.length ?? 0}</strong>
        </div>
      </div>
    </section>
  );
}
