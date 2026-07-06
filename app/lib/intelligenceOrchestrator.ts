import { eventBus } from "./eventBus";
import { createClient } from "./supabase/server";

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
    let caseId: string | null = null;

    if (
      input.riskLevel === "HIGH" ||
      input.operationalImpact === "CRITICAL" ||
      input.anomalyScore > 75
    ) {
      const caseCode = "AUTO-" + Date.now();
      const supabase = await createClient();

      const { data: createdCase, error: caseError } = await supabase
        .from("cases")
        .insert([
          {
            case_code: caseCode,
            title: input.fileName,
            case_type: input.classification,
            risk_level: input.riskLevel,
            status: "OPEN",
          },
        ])
        .select("id, case_code")
        .single();

      if (caseError) {
        console.error("[ORCHESTRATOR] Error creando caso:", caseError);
      } else {
        caseId = createdCase.id;
      }

      await eventBus.emit("rf.case.created", {
        id: caseId,
        case_id: caseId,
        case_code: caseCode,
        classification: input.classification,
        riskLevel: input.riskLevel,
      });
    }

    await eventBus.emit("rf.alert.created", {
      source: input.source,
      classification: input.classification,
      fileName: input.fileName,
      riskLevel: input.riskLevel,
      case_id: caseId,
    });

    await eventBus.emit("rf.risk.calculated", {
      anomalyScore: input.anomalyScore,
      operationalImpact: input.operationalImpact,
      case_id: caseId,
    });

    await eventBus.emit("rf.entity.batch", {
      entities: input.entities,
      case_id: caseId,
    });

    return {
      success: true,
      engine: "EVENT_DRIVEN_CORE_V3",
      caseId,
    };
  } catch (error) {
    console.error("ORCHESTRATOR ERROR:", error);
    return {
      success: false,
      error,
    };
  }
}