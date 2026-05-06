const dashboardUrl = window.__COVAULT_DASHBOARD_URL__ || "https://replace-with-dashboard-url.example";

for (const element of document.querySelectorAll("#dashboard-link, #primary-dashboard-link")) {
  element.href = dashboardUrl;
}
