import { alertsHandler } from "./alerts.handler";
import { casesHandler } from "./cases.handler";
import { riskHandler } from "./risk.handler";
import { graphHandler } from "./graph.handler";
import { auditHandler } from "./audit.handler";

export const eventHandlers = [
  alertsHandler,
  casesHandler,
  riskHandler,
  graphHandler,
  auditHandler,
];

