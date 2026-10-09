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

      // El insert de "cases" exige company_id bajo RLS (un usuario solo
      // puede crear casos dentro de su propia empresa). Antes este insert
      // no lo establecia, asi que la base lo rechazaba en silencio (el
      // error quedaba atrapado mas abajo y nunca se creaba el caso ni se
      // reportaba al usuario) para cualquier empresa con RLS exigiendo
      // company_id en el insert.
      const { data: userData } = await supabase.auth.getUser();
      let companyId: string | null = null;
      if (userData?.user) {
        const { data: userCompany } = await supabase
          .from("user_companies")
          .select("company_id")
          .eq("user_id", userData.user.id)
          .order("last_active_at", { ascending: false })
          .limit(1)
          .single();
        companyId = userCompany?.company_id ?? null;
      }

      if (!companyId) {
        console.error("[ORCHESTRATOR] No se pudo resolver la empresa activa del usuario; no se creo el caso.");
      } else {
        const { data: createdCase, error: caseError } = await supabase
          .from("cases")
          .insert([
            {
              company_id: companyId,
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