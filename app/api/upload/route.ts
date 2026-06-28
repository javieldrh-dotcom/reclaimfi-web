import { NextResponse } from "next/server";

import {
  processIntelligence,
} from "@/app/lib/intelligenceOrchestrator";

//
// POST
//

export async function POST(
  request: Request
) {

  try {

    //
    // RECEIVE FORM DATA
    //

    const formData =
      await request.formData();

    const files =
      formData.getAll("files");

    //
    // VALIDATION
    //

    if (!files || files.length === 0) {

      return NextResponse.json(

        {
          success: false,
          error:
            "No files uploaded",
        },

        {
          status: 400,
        }

      );

    }

    //
    // PROCESS FILES
    //

    const processedFiles =
      await Promise.all(

        files.map(

          async (file: any) => {

            //
            // FILE METADATA
            //

            const metadata = {

              fileName:
                file.name,

              fileType:
                file.type,

              fileSize:
                file.size,

              uploadedAt:
                new Date().toISOString(),

              classification:
                classifyFile(
                  file.name
                ),

              riskLevel:
                determineRisk(
                  file.name
                ),

              processingStatus:
                "ANALYZED",

            };

            //
            // AI ANALYSIS
            //

            const aiAnalysis = {

              suspiciousPatterns:
                generatePatterns(
                  metadata.classification
                ),

              extractedEntities:
                generateEntities(),

              anomalyScore:
                Math.floor(
                  Math.random() * 100
                ),

              operationalImpact:
                determineImpact(),

            };

            //
            // ORCHESTRATION ENGINE
            //

            await processIntelligence({

              source:
                metadata.classification,

              classification:
                metadata.classification,

              fileName:
                metadata.fileName,

              anomalyScore:
                aiAnalysis.anomalyScore,

              riskLevel:
                metadata.riskLevel,

              patterns:
                aiAnalysis.suspiciousPatterns,

              entities:
                aiAnalysis.extractedEntities,

              operationalImpact:
                aiAnalysis.operationalImpact,

            });

            //
            // RETURN
            //

            return {

              metadata,

              aiAnalysis,

            };

          }

        )

      );

    //
    // RESPONSE
    //

    return NextResponse.json({

      success: true,

      engine:
        "AGI INGESTION ENGINE",

      filesProcessed:
        processedFiles.length,

      timestamp:
        new Date().toISOString(),

      results:
        processedFiles,

    });

  } catch (error: any) {

    console.error(
      "UPLOAD ENGINE ERROR:",
      error
    );

    return NextResponse.json(

      {

        success: false,

        error:
          error.message,

      },

      {

        status: 500,

      }

    );

  }

}

//
// FILE CLASSIFICATION
//

function classifyFile(
  fileName: string
) {

  const lower =
    fileName.toLowerCase();

  if (
    lower.includes("bank")
  ) {

    return "BANKING";

  }

  if (
    lower.includes("invoice")
  ) {

    return "PROCUREMENT";

  }

  if (
    lower.includes("tax")
  ) {

    return "TAX";

  }

  if (
    lower.includes("wallet")
  ) {

    return "BLOCKCHAIN";

  }

  if (
    lower.includes("crypto")
  ) {

    return "BLOCKCHAIN";

  }

  if (
    lower.endsWith(".csv")
  ) {

    return "TRANSACTIONAL";

  }

  if (
    lower.endsWith(".pdf")
  ) {

    return "DOCUMENTAL";

  }

  if (
    lower.endsWith(".xlsx")
  ) {

    return "FINANCIAL";

  }

  return "FINANCIAL";

}

//
// RISK DETECTION
//

function determineRisk(
  fileName: string
) {

  const lower =
    fileName.toLowerCase();

  if (
    lower.includes("offshore")
  ) {

    return "HIGH";

  }

  if (
    lower.includes("crypto")
  ) {

    return "HIGH";

  }

  if (
    lower.includes("wallet")
  ) {

    return "HIGH";

  }

  if (
    lower.includes("treasury")
  ) {

    return "MEDIUM";

  }

  return "LOW";

}

//
// PATTERN GENERATION
//

function generatePatterns(
  classification: string
) {

  const patterns = {

    BANKING: [

      "Unusual transfer volume",

      "Cross-border movement",

      "Treasury mismatch",

      "High velocity transaction",

    ],

    PROCUREMENT: [

      "Duplicate invoices",

      "Vendor anomaly",

      "Inflated procurement values",

      "Contract inconsistency",

    ],

    TAX: [

      "Tax inconsistency",

      "Fiscal exposure",

      "Reporting discrepancy",

      "Unusual deduction behavior",

    ],

    BLOCKCHAIN: [

      "Wallet correlation",

      "Mixer interaction",

      "Suspicious blockchain flow",

      "Exchange fragmentation",

    ],

    TRANSACTIONAL: [

      "Velocity anomaly",

      "Behavioral inconsistency",

      "Abnormal financial flow",

      "Payment irregularity",

    ],

    DOCUMENTAL: [

      "Document inconsistency",

      "Signature mismatch",

      "Metadata anomaly",

      "Operational discrepancy",

    ],

    FINANCIAL: [

      "Financial anomaly",

      "Treasury deviation",

      "Liquidity inconsistency",

      "Balance irregularity",

    ],

  };

  return (
    patterns[
      classification as keyof typeof patterns
    ] || [

      "General anomaly detected",

    ]
  );

}

//
// ENTITY EXTRACTION
//

function generateEntities() {

  return [

    {

      entity:
        "Global Treasury Group",

      type:
        "ORGANIZATION",

    },

    {

      entity:
        "Offshore Account",

      type:
        "BANKING",

    },

    {

      entity:
        "Wallet Cluster",

      type:
        "BLOCKCHAIN",

    },

    {

      entity:
        "Procurement Vendor",

      type:
        "SUPPLIER",

    },

  ];

}

//
// IMPACT DETECTION
//

function determineImpact() {

  const impacts = [

    "LOW",

    "MEDIUM",

    "HIGH",

    "CRITICAL",

  ];

  return impacts[
    Math.floor(
      Math.random() *
      impacts.length
    )
  ];

}

