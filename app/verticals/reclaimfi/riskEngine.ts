export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface RiskInput {
  fileName: string;
  classification: string;
  amount?: number;
}

interface RiskResult {
  score: number;
  level: RiskLevel;
  reasons: string[];
}

const HIGH_RISK_KEYWORDS = [
  "offshore",
  "crypto",
  "wallet",
  "shell",
  "mixer",
  "tumbler",
  "anonymous",
];

const MEDIUM_RISK_KEYWORDS = [
  "treasury",
  "transfer",
  "cross-border",
  "international",
  "subsidiary",
];

const CLASSIFICATION_WEIGHTS: Record<string, number> = {
  BLOCKCHAIN: 20,
  BANKING: 15,
  TAX: 10,
  PROCUREMENT: 10,
  TRANSACTIONAL: 10,
  DOCUMENTAL: 5,
  FINANCIAL: 5,
};

function scoreAmount(amount?: number): { points: number; reason?: string } {
  if (!amount || amount <= 0) return { points: 0 };

  if (amount >= 1_000_000) {
    return {
      points: 40,
      reason: `Monto declarado igual o mayor a $1,000,000 (${amount.toLocaleString()})`,
    };
  }
  if (amount >= 100_000) {
    return {
      points: 20,
      reason: `Monto declarado igual o mayor a $100,000 (${amount.toLocaleString()})`,
    };
  }
  if (amount >= 10_000) {
    return {
      points: 10,
      reason: `Monto declarado igual o mayor a $10,000 (${amount.toLocaleString()})`,
    };
  }
  return { points: 0 };
}

export function calculateRisk({
  fileName,
  classification,
  amount,
}: RiskInput): RiskResult {
  const reasons: string[] = [];
  let score = 0;

  const lowerName = fileName.toLowerCase();

  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lowerName.includes(kw)) {
      score += 30;
      reasons.push(`Palabra clave de alto riesgo en el nombre del archivo: "${kw}"`);
    }
  }

  for (const kw of MEDIUM_RISK_KEYWORDS) {
    if (lowerName.includes(kw)) {
      score += 15;
      reasons.push(`Palabra clave de riesgo medio en el nombre del archivo: "${kw}"`);
    }
  }

  const classWeight = CLASSIFICATION_WEIGHTS[classification] ?? 5;
  score += classWeight;
  reasons.push(`Clasificación "${classification}" suma ${classWeight} puntos base`);

  const amountResult = scoreAmount(amount);
  if (amountResult.points > 0) {
    score += amountResult.points;
    if (amountResult.reason) reasons.push(amountResult.reason);
  }

  score = Math.min(score, 100);

  let level: RiskLevel = "LOW";
  if (score >= 60) level = "HIGH";
  else if (score >= 30) level = "MEDIUM";

  return { score, level, reasons };
}