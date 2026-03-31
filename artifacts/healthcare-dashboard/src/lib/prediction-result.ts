import type { PredictionResult } from "@workspace/api-client-react";

const VALID_RISK_LEVELS = new Set<PredictionResult["riskLevel"]>([
  "low",
  "medium",
  "high",
  "critical",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function toRiskLevel(value: unknown): PredictionResult["riskLevel"] {
  return typeof value === "string" && VALID_RISK_LEVELS.has(value as PredictionResult["riskLevel"])
    ? (value as PredictionResult["riskLevel"])
    : "low";
}

function toPercent(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  const normalized = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function fallbackUrgency(riskLevel: PredictionResult["riskLevel"]): string {
  if (riskLevel === "critical") return "Immediate evaluation";
  if (riskLevel === "high") return "Same-day review";
  if (riskLevel === "medium") return "48-hour follow-up";
  return "Routine follow-up";
}

export function normalizePredictionResult(value: unknown): PredictionResult {
  const record = isObject(value) ? value : {};
  const riskLevel = toRiskLevel(record.riskLevel);
  const primaryDiagnosis =
    typeof record.primaryDiagnosis === "string" && record.primaryDiagnosis.trim().length > 0
      ? record.primaryDiagnosis
      : "Clinical risk estimate";
  const riskScore = toPercent(record.riskScore, 0);
  const probability = toPercent(record.probability, riskScore);
  const conditions = Array.isArray(record.conditions)
    ? record.conditions
        .map((condition) => {
          if (!isObject(condition)) return null;

          const name =
            typeof condition.name === "string" && condition.name.trim().length > 0
              ? condition.name
              : "Unspecified condition";

          return {
            name,
            probability: toPercent(condition.probability, 0),
            riskLevel: toRiskLevel(condition.riskLevel),
          };
        })
        .filter((condition): condition is NonNullable<typeof condition> => condition !== null)
    : [];

  const keyFindings = toTextArray(record.keyFindings);
  const redFlags = toTextArray(record.redFlags);
  const recommendations = toTextArray(record.recommendations);
  const summary =
    typeof record.summary === "string" && record.summary.trim().length > 0
      ? record.summary
      : `${primaryDiagnosis} is the leading detected pattern based on the submitted symptoms and vitals.`;
  const urgency =
    typeof record.urgency === "string" && record.urgency.trim().length > 0
      ? record.urgency
      : fallbackUrgency(riskLevel);
  const analysisVersion =
    typeof record.analysisVersion === "string" && record.analysisVersion.trim().length > 0
      ? record.analysisVersion
      : "legacy-response";

  return {
    primaryDiagnosis,
    probability,
    riskLevel,
    riskScore,
    summary,
    keyFindings,
    redFlags,
    conditions,
    recommendations,
    urgency,
    analysisVersion,
  };
}
