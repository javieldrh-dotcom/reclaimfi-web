import { eventBus } from "./eventBus";

interface IntelligenceInput {
  source: string;
  classification: string;
  fileName: string;
  anomalyScore: number;
  riskLevel: string;
  patterns: string[];
  entities: any[];
  operationalImpact: string;
}

export async function processIntelligence(input: IntelligenceInput) {
  try {
    await eventBus.emit("rf.alert.created", {
      source: input.source,
      classification: input.classification,
      fileName: input.fileName,
      riskLevel: input.riskLevel,
    });

    await eventBus.emit("rf.risk.calculated", {
      anomalyScore: input.anomalyScore,
      operationalImpact: input.operationalImpact,
    });

    if (
      input.riskLevel === "HIGH" ||
      input.operationalImpact === "CRITICAL" ||
      input.anomalyScore > 75
    ) {
      await eventBus.emit("rf.case.created", {
        case_code: "AUTO-" + Date.now(),
        classification: input.classification,
        riskLevel: input.riskLevel,
      });
    }

    await eventBus.emit("rf.entity.batch", {
      entities: input.entities,
    });

    return {
      success: true,
      engine: "EVENT_DRIVEN_CORE_V3",
    };
  } catch (error) {
    console.error("ORCHESTRATOR ERROR:", error);

    return {
      success: false,
      error,
    };
  }
}

