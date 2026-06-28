export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",

  // Submódulos del dashboard (preparación para escalabilidad)
  dashboardRisk: "/dashboard/risk",
  dashboardAudit: "/dashboard/audit",
  dashboardIntel: "/dashboard/intel",
  dashboardReports: "/dashboard/reports",
  dashboardInvestigation: "/dashboard/investigation",
} as const;

export type RouteKeys = keyof typeof ROUTES;