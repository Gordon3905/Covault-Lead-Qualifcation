const dashboardUrl = window.__COVAULT_DASHBOARD_URL__ || "https://lead-routing-demo-rho.vercel.app";

for (const element of document.querySelectorAll("#dashboard-link, #primary-dashboard-link")) {
  element.href = dashboardUrl;
}
