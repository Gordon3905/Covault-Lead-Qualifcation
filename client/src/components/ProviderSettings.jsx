export function ProviderSettings({ providers, onToggleMode }) {
  return (
    <section className="panel compact-panel">
      <div className="panel-header">
        <div>
          <h2>Providers</h2>
          <p>Per-adapter mode</p>
        </div>
      </div>
      <div className="provider-list">
        {providers.map((provider) => (
          <div className="provider-row" key={provider.providerKey}>
            <div>
              <strong>{provider.providerKey}</strong>
              <span>{provider.category}</span>
            </div>
            <button type="button" onClick={() => onToggleMode(provider)} className={`mode-button mode-${provider.mode}`}>
              {provider.mode}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
