import { NextResponse } from "next/server";
import { processIntelligence } from "@/app/lib/intelligenceOrchestrator";
import { calculateRisk } from "@/app/verticals/reclaimfi/riskEngine";
import { extractEntitiesFromText } from "@/app/core/agents/entityExtractionAgent";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files");
    const amountRaw = formData.get("amount");
    const amount = amountRaw ? parseFloat(amountRaw as string) : undefined;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files uploaded" },
        { status: 400 }
      );
    }

    const processedFiles = await Promise.all(
      files.map(async (file: any) => {
        const classification = classifyFile(file.name);

        const risk = calculateRisk({
          fileName: file.name,
          classification,
          amount,
        });

        let fileText = "";
        try {
          fileText = await file.text();
        } catch {
          fileText = "";
        }

        const extraction = await extractEntitiesFromText(file.name, fileText);

        const metadata = {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          classification,
          riskLevel: risk.level,
          processingStatus: "ANALYZED",
        };

        const aiAnalysis = {
          suspiciousPatterns: risk.reasons,
          extractedEntities: extraction.entities,
          entitySummary: extraction.summary,
          anomalyScore: risk.score,
          operationalImpact: mapImpact(risk.level),
        };

        await processIntelligence({
          source: metadata.classification,
          classification: metadata.classification,
          fileName: metadata.fileName,
          anomalyScore: aiAnalysis.anomalyScore,
          riskLevel: metadata.riskLevel,
          patterns: aiAnalysis.suspiciousPatterns,
          entities: aiAnalysis.extractedEntities,
          operationalImpact: aiAnalysis.operationalImpact,
        });

        return { metadata, aiAnalysis };
      })
    );

    return NextResponse.json({
      success: true,
      engine: "AGI RISK ENGINE v2 (rule-based risk + AI entity extraction)",
      filesProcessed: processedFiles.length,
      timestamp: new Date().toISOString(),
      results: processedFiles,
    });
  } catch (error: any) {
    console.error("UPLOAD ENGINE ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function classifyFile(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes("bank")) return "BANKING";
  if (lower.includes("invoice")) return "PROCUREMENT";
  if (lower.includes("tax")) return "TAX";
  if (lower.includes("wallet")) return "BLOCKCHAIN";
  if (lower.includes("crypto")) return "BLOCKCHAIN";
  if (lower.endsWith(".csv")) return "TRANSACTIONAL";
  if (lower.endsWith(".pdf")) return "DOCUMENTAL";
  if (lower.endsWith(".xlsx")) return "FINANCIAL";
  return "FINANCIAL";
}

function mapImpact(level: "LOW" | "MEDIUM" | "HIGH") {
  if (level === "HIGH") return "CRITICAL";
  if (level === "MEDIUM") return "MEDIUM";
  return "LOW";
}
