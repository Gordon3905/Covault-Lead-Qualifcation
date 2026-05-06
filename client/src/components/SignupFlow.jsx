import { useState } from "react";

const verticals = [
  { slug: "plumbing", label: "Plumbing" },
  { slug: "real-estate", label: "Real Estate" },
  { slug: "law-firm", label: "Law Firm" },
  { slug: "medical-practice", label: "Medical Practice" }
];

export function SignupFlow({ isSubmitting, result, onSignup }) {
  const [form, setForm] = useState({
    vertical: "plumbing",
    email: "",
    companyName: ""
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSignup(form);
  }

  return (
    <section className="panel signup-panel">
      <div className="panel-header">
        <div>
          <h2>Want to show onboarding?</h2>
          <p>Create a ready-to-use test customer in one step.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="signup-form">
        <label>
          <span>Vertical</span>
          <select value={form.vertical} onChange={(event) => updateField("vertical", event.target.value)}>
            {verticals.map((vertical) => (
              <option key={vertical.slug} value={vertical.slug}>
                {vertical.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Company</span>
          <input
            required
            value={form.companyName}
            onChange={(event) => updateField("companyName", event.target.value)}
            placeholder="Blue Pipe Pros"
          />
        </label>

        <label>
          <span>Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="owner@example.com"
          />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create test customer"}
        </button>
      </form>

      {result ? (
        <div className="credential-box">
          <span>Test login created</span>
          <strong>{result.credentials.email}</strong>
          <code>{result.credentials.password}</code>
          <a href={result.dashboardUrl}>Open dashboard</a>
        </div>
      ) : null}
    </section>
  );
}
