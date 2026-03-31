import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ConditionPrediction,
  PredictionInput,
  PredictionResult,
} from "@workspace/api-zod";

type RiskLevel = PredictionResult["riskLevel"];
type SmokingStatus = "never" | "former" | "current";

type LogisticModel = {
  intercept: number;
  coefficients: Record<string, number>;
  means: Partial<Record<string, number>>;
  scales: Partial<Record<string, number>>;
};

type ModelBundle = {
  analysisVersion?: string;
  models?: Partial<{
    cardiac: LogisticModel;
    diabetesMetabolic: LogisticModel;
    diabetesSymptom: LogisticModel;
    stroke: LogisticModel;
  }>;
};

type LoadedPredictionModels = {
  analysisVersion: string;
  cardiacModel: LogisticModel;
  diabetesMetabolicModel: LogisticModel;
  diabetesSymptomModel: LogisticModel;
  strokeModel: LogisticModel | null;
};

type SymptomClassifierModel = {
  classes: string[];
  features: string[];
  intercepts: number[];
  coefficients: number[][];
  metrics?: {
    trainAccuracy?: number;
    testAccuracy?: number;
    trainSamples?: number;
    testSamples?: number;
  };
};

type SymptomClassifierBundle = {
  analysisVersion?: string;
  symptomClassifier?: Partial<SymptomClassifierModel>;
};

type LoadedSymptomClassifier = {
  analysisVersion: string;
  model: SymptomClassifierModel;
};

type RankedCondition = ConditionPrediction & {
  probabilityRaw: number;
};

const ANALYSIS_VERSION = "hybrid-clinical-ensemble-v1";

// Trained offline with scikit-learn logistic regression:
// - Cleveland heart disease dataset (5-fold ROC-AUC ~0.72)
// - Early-stage diabetes risk dataset (5-fold ROC-AUC ~0.96)
// - Pima diabetes dataset (5-fold ROC-AUC ~0.82)
const CARDIAC_MODEL: LogisticModel = {
  intercept: -1.2336838683825093,
  coefficients: {
    age: 0.4883726527710842,
    sex: 0.24909713609312786,
    trestbps: 0.21663191843076204,
    chol: 1.5369281764207334,
    fbs: -0.17715604853720143,
  },
  means: {
    age: 54.43894389438944,
    trestbps: 131.68976897689768,
    chol: 246.69306930693068,
  },
  scales: {
    age: 9.02373483119838,
    trestbps: 17.570681239512478,
    chol: 51.6914064726489,
  },
};

const DIABETES_METABOLIC_MODEL: LogisticModel = {
  intercept: -0.8490376203886901,
  coefficients: {
    glucose: 1.0440872002010404,
    bloodPressure: -0.23425560797282136,
    bmi: 0.688145010716534,
    age: 0.4025399932301368,
  },
  means: {
    glucose: 120.89453125,
    bloodPressure: 69.10546875,
    bmi: 31.992578124999998,
    age: 33.240885416666664,
  },
  scales: {
    glucose: 31.95179590820272,
    bloodPressure: 19.343201628981696,
    bmi: 7.87902573154013,
    age: 11.752572645994181,
  },
};

const DIABETES_SYMPTOM_MODEL: LogisticModel = {
  intercept: -0.10000031032465989,
  coefficients: {
    age: -0.32425795353781744,
    gender: -2.4552535110680607,
    polyuria: 2.7994374072460455,
    polydipsia: 2.959346682076143,
    sudden_weight_loss: 0.7289541540522452,
    weakness: 0.2462940179317781,
    visual_blurring: -0.2931361515596301,
    partial_paresis: 1.0029320119651575,
    obesity: -0.1536225194079225,
  },
  means: {
    age: 48.02884615384615,
  },
  scales: {
    age: 12.13977627056645,
  },
};

function resolveArtifactDataPath(fileName: string): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(moduleDir, "../../../model-training/data", fileName),
    resolve(moduleDir, "../../model-training/data", fileName),
    resolve(process.cwd(), "artifacts", "model-training", "data", fileName),
    resolve(process.cwd(), "model-training", "data", fileName),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0]!;
}

const MODEL_BUNDLE_PATH = resolveArtifactDataPath("model-bundle.json");
const SYMPTOM_CLASSIFIER_PATH = resolveArtifactDataPath("symptom-disease-model.json");

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecordOfNumbers(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => isFiniteNumber(entry))
  );
}

function isLogisticModel(value: unknown): value is LogisticModel {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<LogisticModel>;

  return Boolean(
    isFiniteNumber(candidate.intercept) &&
      isRecordOfNumbers(candidate.coefficients) &&
      typeof candidate.means === "object" &&
      candidate.means !== null &&
      typeof candidate.scales === "object" &&
      candidate.scales !== null,
  );
}

function isMatrixOfNumbers(value: unknown): value is number[][] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) => Array.isArray(row) && row.every((entry) => typeof entry === "number" && Number.isFinite(entry)),
    )
  );
}

function isSymptomClassifierModel(value: unknown): value is SymptomClassifierModel {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SymptomClassifierModel>;

  return Boolean(
    Array.isArray(candidate.classes) &&
      candidate.classes.every((entry) => typeof entry === "string" && entry.trim().length > 0) &&
      Array.isArray(candidate.features) &&
      candidate.features.every((entry) => typeof entry === "string" && entry.trim().length > 0) &&
      Array.isArray(candidate.intercepts) &&
      candidate.intercepts.every((entry) => typeof entry === "number" && Number.isFinite(entry)) &&
      isMatrixOfNumbers(candidate.coefficients) &&
      candidate.coefficients.length === candidate.classes.length,
  );
}

function loadPredictionModels(): LoadedPredictionModels {
  const fallback: LoadedPredictionModels = {
    analysisVersion: ANALYSIS_VERSION,
    cardiacModel: CARDIAC_MODEL,
    diabetesMetabolicModel: DIABETES_METABOLIC_MODEL,
    diabetesSymptomModel: DIABETES_SYMPTOM_MODEL,
    strokeModel: null,
  };

  if (!existsSync(MODEL_BUNDLE_PATH)) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(readFileSync(MODEL_BUNDLE_PATH, "utf8")) as ModelBundle;

    return {
      analysisVersion:
        typeof parsed.analysisVersion === "string" && parsed.analysisVersion.trim().length > 0
          ? parsed.analysisVersion
          : fallback.analysisVersion,
      cardiacModel: isLogisticModel(parsed.models?.cardiac)
        ? parsed.models.cardiac
        : fallback.cardiacModel,
      diabetesMetabolicModel: isLogisticModel(parsed.models?.diabetesMetabolic)
        ? parsed.models.diabetesMetabolic
        : fallback.diabetesMetabolicModel,
      diabetesSymptomModel: isLogisticModel(parsed.models?.diabetesSymptom)
        ? parsed.models.diabetesSymptom
        : fallback.diabetesSymptomModel,
      strokeModel: isLogisticModel(parsed.models?.stroke) ? parsed.models.stroke : null,
    };
  } catch {
    return fallback;
  }
}

const PREDICTION_MODELS = loadPredictionModels();

function loadSymptomClassifier(): LoadedSymptomClassifier | null {
  if (!existsSync(SYMPTOM_CLASSIFIER_PATH)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(SYMPTOM_CLASSIFIER_PATH, "utf8")) as SymptomClassifierBundle;
    if (!isSymptomClassifierModel(parsed.symptomClassifier)) {
      return null;
    }

    return {
      analysisVersion:
        typeof parsed.analysisVersion === "string" && parsed.analysisVersion.trim().length > 0
          ? parsed.analysisVersion
          : "symptom-classifier",
      model: parsed.symptomClassifier,
    };
  } catch {
    return null;
  }
}

const SYMPTOM_CLASSIFIER = loadSymptomClassifier();

const SYMPTOM_ALIASES: Record<string, string> = {
  "abdominal pain": "stomach pain",
  anxiety: "anxiety",
  chills: "chills",
  congestion: "congestion",
  constipation: "constipation",
  dehydration: "dehydration",
  diarrhea: "diarrhoea",
  diarrhoea: "diarrhoea",
  "high fever": "fever",
  indigestion: "indigestion",
  "joint pain": "joint pain",
  malaise: "fatigue",
  "neck pain": "neck pain",
  "runny nose": "runny nose",
  "skin rash": "skin rash",
  "stomach pain": "stomach pain",
  sweating: "sweating",
  "vision blurring": "blurred vision",
  "visual blurring": "blurred vision",
  "shortness of breath": "shortness of breath",
  "chest pain": "chest pain",
  "high blood pressure": "high blood pressure",
  "frequent urination": "frequent urination",
  "excessive thirst": "excessive thirst",
  fatigue: "fatigue",
  dizziness: "dizziness",
  palpitations: "palpitations",
  headache: "headache",
  fever: "fever",
  cough: "cough",
  "weight loss": "weight loss",
  numbness: "numbness",
  nausea: "nausea",
  vomiting: "vomiting",
  "loss of balance": "loss of balance",
};

const SYMPTOM_CLASSIFIER_FEATURE_MAP: Record<string, string[]> = {
  anxiety: ["anxiety"],
  "blurred vision": ["blurred_and_distorted_vision", "visual_disturbances"],
  "chest pain": ["chest_pain"],
  chills: ["chills", "shivering"],
  cough: ["cough"],
  congestion: ["congestion"],
  constipation: ["constipation"],
  dehydration: ["dehydration"],
  diarrhoea: ["diarrhoea"],
  dizziness: ["dizziness"],
  fatigue: ["fatigue"],
  fever: ["high_fever", "mild_fever"],
  headache: ["headache"],
  indigestion: ["indigestion"],
  "joint pain": ["joint_pain"],
  "loss of balance": ["loss_of_balance", "unsteadiness"],
  "neck pain": ["neck_pain"],
  nausea: ["nausea"],
  numbness: ["weakness_of_one_body_side", "weakness_in_limbs"],
  palpitations: ["palpitations", "fast_heart_rate"],
  "runny nose": ["runny_nose"],
  "skin rash": ["skin_rash"],
  "shortness of breath": ["breathlessness"],
  "stomach pain": ["stomach_pain", "abdominal_pain"],
  sweating: ["sweating"],
  vomiting: ["vomiting"],
  "weight loss": ["weight_loss"],
  "frequent urination": ["polyuria"],
  "excessive thirst": ["dehydration"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeNumber(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return clamp(value, min, max);
}

function logistic(score: number): number {
  return 1 / (1 + Math.exp(-score));
}

function roundProbability(probability: number): number {
  return Math.round(clamp(probability, 0.01, 0.99) * 100);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeFeatureKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.1$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeSymptoms(symptoms: string[]): Set<string> {
  return new Set(
    symptoms
      .map(normalizeText)
      .map((symptom) => SYMPTOM_ALIASES[symptom] ?? symptom)
      .filter(Boolean),
  );
}

function hasSymptom(symptoms: Set<string>, symptom: string): boolean {
  return symptoms.has(symptom);
}

function normalizeSmokingStatus(value: string | undefined): SmokingStatus {
  const normalized = normalizeText(value ?? "never");

  if (normalized === "current") return "current";
  if (normalized === "former") return "former";
  return "never";
}

function normalizeGender(value: string | undefined): "male" | "female" | "other" {
  const normalized = normalizeText(value ?? "other");

  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  return "other";
}

function parseBloodPressure(rawValue: string | undefined): {
  systolic: number;
  diastolic: number;
} {
  const match = rawValue?.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);

  if (!match) {
    return { systolic: 120, diastolic: 80 };
  }

  return {
    systolic: sanitizeNumber(Number(match[1]), 120, 80, 240),
    diastolic: sanitizeNumber(Number(match[2]), 80, 40, 140),
  };
}

function hasFamilyHistory(familyHistory: string[], keywords: string[]): boolean {
  return familyHistory.some((entry) => keywords.some((keyword) => entry.includes(keyword)));
}

function predictProbability(
  model: LogisticModel,
  values: Record<string, number>,
): number {
  let score = model.intercept;

  for (const [feature, coefficient] of Object.entries(model.coefficients)) {
    let value = values[feature] ?? 0;

    if (feature in model.means && feature in model.scales) {
      const mean = model.means[feature] ?? 0;
      const scale = model.scales[feature] ?? 1;
      value = scale === 0 ? value - mean : (value - mean) / scale;
    }

    score += value * coefficient;
  }

  return logistic(score);
}

function titleCaseDiseaseLabel(value: string): string {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function getSymptomClassifierPredictions(symptoms: Set<string>): RankedCondition[] {
  if (!SYMPTOM_CLASSIFIER || symptoms.size === 0) {
    return [];
  }

  const featureValues = new Map<string, number>();
  const featureLookup = new Map<string, string>();
  for (const feature of SYMPTOM_CLASSIFIER.model.features) {
    featureValues.set(feature, 0);
    featureLookup.set(normalizeFeatureKey(feature), feature);
  }

  let matchedSymptomCount = 0;

  for (const symptom of symptoms) {
    const mappedFeatures = new Set<string>(SYMPTOM_CLASSIFIER_FEATURE_MAP[symptom] ?? []);
    const directFeature = featureLookup.get(normalizeFeatureKey(symptom));
    if (directFeature) {
      mappedFeatures.add(directFeature);
    }

    if (mappedFeatures.size > 0) {
      matchedSymptomCount += 1;
    }

    for (const feature of mappedFeatures) {
      if (featureValues.has(feature)) {
        featureValues.set(feature, 1);
      }
    }
  }

  if (matchedSymptomCount === 0) {
    return [];
  }

  const rawScores = SYMPTOM_CLASSIFIER.model.classes.map((_, classIndex) => {
    let score = SYMPTOM_CLASSIFIER.model.intercepts[classIndex] ?? 0;

    for (const [featureIndex, feature] of SYMPTOM_CLASSIFIER.model.features.entries()) {
      score += (SYMPTOM_CLASSIFIER.model.coefficients[classIndex]?.[featureIndex] ?? 0) * (featureValues.get(feature) ?? 0);
    }

    return logistic(score);
  });

  const total = rawScores.reduce((sum, score) => sum + score, 0) || 1;

  return SYMPTOM_CLASSIFIER.model.classes
    .map((conditionName, index) => {
      const probabilityRaw = clamp(rawScores[index]! / total, 0.01, 0.99);
      return {
        name: titleCaseDiseaseLabel(conditionName),
        probability: roundProbability(probabilityRaw),
        probabilityRaw,
        riskLevel: probabilityToRiskLevel(probabilityRaw),
      };
    })
    .sort((left, right) => right.probabilityRaw - left.probabilityRaw)
    .slice(0, 4);
}

function probabilityToRiskLevel(probability: number): RiskLevel {
  const percent = roundProbability(probability);

  if (percent >= 78) return "critical";
  if (percent >= 58) return "high";
  if (percent >= 35) return "medium";
  return "low";
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function classifierSummary(primaryDiagnosis: string, symptoms: Set<string>): string {
  const symptomList = [...symptoms].slice(0, 4);
  if (symptomList.length === 0) {
    return `${primaryDiagnosis} is the top match from the trained symptom model.`;
  }

  return `${primaryDiagnosis} is the top match from the trained symptom model based on ${formatList(symptomList)}.`;
}

export function analyzePrediction(input: PredictionInput): PredictionResult {
  const symptoms = normalizeSymptoms(input.symptoms);
  const familyHistory = (input.familyHistory ?? []).map(normalizeText);
  const { systolic, diastolic } = parseBloodPressure(input.bloodPressure);

  const age = sanitizeNumber(input.age, 45, 1, 110);
  const bmi = sanitizeNumber(input.bmi, 24.5, 10, 60);
  const bloodSugar = sanitizeNumber(input.bloodSugar, 95, 50, 500);
  const cholesterol = sanitizeNumber(input.cholesterol, 180, 80, 400);
  const smokingStatus = normalizeSmokingStatus(input.smokingStatus);
  const gender = normalizeGender(input.gender);

  let cardiacProbability = predictProbability(PREDICTION_MODELS.cardiacModel, {
    age,
    sex: gender === "male" ? 1 : 0,
    trestbps: systolic,
    chol: cholesterol,
    fbs: bloodSugar >= 120 ? 1 : 0,
  });

  if (hasSymptom(symptoms, "chest pain")) cardiacProbability += 0.18;
  if (hasSymptom(symptoms, "shortness of breath")) cardiacProbability += 0.09;
  if (hasSymptom(symptoms, "palpitations")) cardiacProbability += 0.07;
  if (hasSymptom(symptoms, "dizziness")) cardiacProbability += 0.04;
  if (hasSymptom(symptoms, "high blood pressure")) cardiacProbability += 0.04;
  if (smokingStatus === "current") cardiacProbability += 0.05;
  if (smokingStatus === "former") cardiacProbability += 0.02;
  if (cholesterol >= 240) cardiacProbability += 0.05;
  if (systolic >= 140 || diastolic >= 90) cardiacProbability += 0.04;
  if (bmi >= 30) cardiacProbability += 0.02;
  if (
    hasFamilyHistory(familyHistory, [
      "heart",
      "cardiac",
      "coronary",
      "angina",
      "stroke",
    ])
  ) {
    cardiacProbability += 0.05;
  }
  if (
    hasSymptom(symptoms, "chest pain") &&
    hasSymptom(symptoms, "shortness of breath")
  ) {
    cardiacProbability += 0.08;
  }
  cardiacProbability = clamp(cardiacProbability, 0.03, 0.99);

  const hasHypertension = systolic >= 140 || diastolic >= 90 ? 1 : 0;

  const diabetesMetabolicProbability = predictProbability(
    PREDICTION_MODELS.diabetesMetabolicModel,
    {
    glucose: bloodSugar,
    bloodPressure: diastolic,
    bmi,
    age,
      hypertension: hasHypertension,
    },
  );

  const diabetesSymptomProbability = predictProbability(
    PREDICTION_MODELS.diabetesSymptomModel,
    {
    age,
    gender: gender === "male" ? 1 : 0,
    polyuria: hasSymptom(symptoms, "frequent urination") ? 1 : 0,
    polydipsia: hasSymptom(symptoms, "excessive thirst") ? 1 : 0,
    sudden_weight_loss: hasSymptom(symptoms, "weight loss") ? 1 : 0,
    weakness: hasSymptom(symptoms, "fatigue") ? 1 : 0,
    visual_blurring: hasSymptom(symptoms, "blurred vision") ? 1 : 0,
    partial_paresis: hasSymptom(symptoms, "numbness") ? 1 : 0,
    obesity: bmi >= 30 ? 1 : 0,
    },
  );

  let diabetesProbability =
    diabetesMetabolicProbability * 0.6 + diabetesSymptomProbability * 0.4;

  if (bloodSugar >= 126) diabetesProbability += 0.08;
  if (bloodSugar >= 160) diabetesProbability += 0.08;
  if (bloodSugar >= 200) diabetesProbability += 0.1;
  if (
    hasSymptom(symptoms, "frequent urination") &&
    hasSymptom(symptoms, "excessive thirst")
  ) {
    diabetesProbability += 0.08;
  }
  if (
    hasSymptom(symptoms, "blurred vision") &&
    hasSymptom(symptoms, "fatigue")
  ) {
    diabetesProbability += 0.04;
  }
  if (bmi >= 30) diabetesProbability += 0.03;
  if (
    hasFamilyHistory(familyHistory, ["diabetes", "sugar", "glucose", "insulin"])
  ) {
    diabetesProbability += 0.05;
  }
  diabetesProbability = clamp(diabetesProbability, 0.03, 0.99);

  let hypertensionProbability = logistic(
    -2.6 +
      0.035 * (systolic - 120) +
      0.05 * (diastolic - 80) +
      0.025 * (age - 45) +
      0.045 * (bmi - 25) +
      (smokingStatus === "current" ? 0.55 : smokingStatus === "former" ? 0.2 : 0) +
      (hasSymptom(symptoms, "high blood pressure") ? 0.45 : 0) +
      (hasSymptom(symptoms, "headache") ? 0.3 : 0) +
      (hasSymptom(symptoms, "dizziness") ? 0.22 : 0) +
      (hasSymptom(symptoms, "blurred vision") ? 0.24 : 0) +
      (hasFamilyHistory(familyHistory, ["hypertension", "blood pressure", "stroke"])
        ? 0.3
        : 0),
  );

  if (systolic >= 160 || diastolic >= 100) hypertensionProbability += 0.08;
  if (systolic >= 180 || diastolic >= 120) hypertensionProbability += 0.12;
  hypertensionProbability = clamp(hypertensionProbability, 0.03, 0.99);

  let respiratoryProbability = logistic(
    -2.35 +
      (hasSymptom(symptoms, "cough") ? 1.05 : 0) +
      (hasSymptom(symptoms, "fever") ? 0.95 : 0) +
      (hasSymptom(symptoms, "shortness of breath") ? 0.9 : 0) +
      (hasSymptom(symptoms, "fatigue") ? 0.35 : 0) +
      (hasSymptom(symptoms, "nausea") ? 0.25 : 0) +
      (smokingStatus === "current" ? 0.4 : smokingStatus === "former" ? 0.15 : 0) +
      (age >= 60 ? 0.15 : 0),
  );

  if (hasSymptom(symptoms, "cough") && hasSymptom(symptoms, "fever")) {
    respiratoryProbability += 0.05;
  }
  if (
    hasSymptom(symptoms, "shortness of breath") &&
    hasSymptom(symptoms, "cough")
  ) {
    respiratoryProbability += 0.06;
  }
  respiratoryProbability = clamp(respiratoryProbability, 0.03, 0.99);

  let neurologicProbability = PREDICTION_MODELS.strokeModel
    ? predictProbability(PREDICTION_MODELS.strokeModel, {
        age,
        bmi,
        glucose: bloodSugar,
        hypertension: hasHypertension,
        smoking_current: smokingStatus === "current" ? 1 : 0,
        smoking_former: smokingStatus === "former" ? 1 : 0,
        gender: gender === "male" ? 1 : 0,
      })
    : logistic(
        -3.2 +
          (hasSymptom(symptoms, "numbness") ? 1.05 : 0) +
          (hasSymptom(symptoms, "blurred vision") ? 0.7 : 0) +
          (hasSymptom(symptoms, "headache") ? 0.45 : 0) +
          (hasSymptom(symptoms, "dizziness") ? 0.45 : 0) +
          (systolic >= 160 || diastolic >= 100 ? 0.4 : 0) +
          (age >= 60 ? 0.15 : 0),
      );

  if (hasSymptom(symptoms, "numbness") && hasSymptom(symptoms, "blurred vision")) {
    neurologicProbability += 0.15;
  }
  if (hasSymptom(symptoms, "numbness") && hasSymptom(symptoms, "headache")) {
    neurologicProbability += 0.1;
  }
  neurologicProbability = clamp(neurologicProbability, 0.03, 0.99);

  const riskConditions: RankedCondition[] = [
    {
      name: "Cardiovascular event risk",
      probability: roundProbability(cardiacProbability),
      probabilityRaw: cardiacProbability,
      riskLevel: probabilityToRiskLevel(cardiacProbability),
    },
    {
      name: "Diabetes / hyperglycemia",
      probability: roundProbability(diabetesProbability),
      probabilityRaw: diabetesProbability,
      riskLevel: probabilityToRiskLevel(diabetesProbability),
    },
    {
      name: "Hypertension / vascular strain",
      probability: roundProbability(hypertensionProbability),
      probabilityRaw: hypertensionProbability,
      riskLevel: probabilityToRiskLevel(hypertensionProbability),
    },
    {
      name: "Respiratory / infectious illness",
      probability: roundProbability(respiratoryProbability),
      probabilityRaw: respiratoryProbability,
      riskLevel: probabilityToRiskLevel(respiratoryProbability),
    },
    {
      name: "Neurologic / stroke-like pattern",
      probability: roundProbability(neurologicProbability),
      probabilityRaw: neurologicProbability,
      riskLevel: probabilityToRiskLevel(neurologicProbability),
    },
  ].sort((left, right) => right.probabilityRaw - left.probabilityRaw);

  const symptomDiseasePredictions = getSymptomClassifierPredictions(symptoms);
  const conditions: RankedCondition[] =
    symptomDiseasePredictions.length > 0
      ? symptomDiseasePredictions
      : riskConditions;

  const redFlags: string[] = [];

  if (
    hasSymptom(symptoms, "chest pain") &&
    (hasSymptom(symptoms, "shortness of breath") ||
      hasSymptom(symptoms, "palpitations"))
  ) {
    redFlags.push(
      "Chest pain with breathing or rhythm symptoms can indicate an acute cardiac problem.",
    );
  }

  if (systolic >= 180 || diastolic >= 120) {
    redFlags.push(
      `Blood pressure is in a severe range at ${systolic}/${diastolic} mmHg.`,
    );
  }

  if (
    hasSymptom(symptoms, "numbness") &&
    (hasSymptom(symptoms, "blurred vision") ||
      hasSymptom(symptoms, "headache") ||
      hasSymptom(symptoms, "dizziness"))
  ) {
    redFlags.push(
      "Numbness with visual or neurologic symptoms raises concern for stroke or TIA.",
    );
  }

  if (
    bloodSugar >= 250 &&
    (hasSymptom(symptoms, "frequent urination") ||
      hasSymptom(symptoms, "excessive thirst") ||
      hasSymptom(symptoms, "nausea"))
  ) {
    redFlags.push(
      "Very high blood sugar with dehydration symptoms may require urgent treatment.",
    );
  }

  if (
    hasSymptom(symptoms, "shortness of breath") &&
    hasSymptom(symptoms, "dizziness")
  ) {
    redFlags.push(
      "Shortness of breath with dizziness warrants prompt in-person assessment.",
    );
  }

  const keyFindings = unique([
    symptomDiseasePredictions[0]
      ? `Symptom classifier most strongly matched ${symptomDiseasePredictions[0].name}.`
      : "",
    hasSymptom(symptoms, "chest pain")
      ? "Chest pain was reported and heavily increases cardiac risk."
      : "",
    hasSymptom(symptoms, "shortness of breath")
      ? "Shortness of breath adds urgency to cardiac and respiratory triage."
      : "",
    hasSymptom(symptoms, "frequent urination") &&
    hasSymptom(symptoms, "excessive thirst")
      ? "Frequent urination with excessive thirst matches a classic diabetes symptom cluster."
      : "",
    hasSymptom(symptoms, "numbness")
      ? "Numbness is a neurologic warning symptom that should not be ignored."
      : "",
    bloodSugar >= 126
      ? `Blood sugar is elevated at ${bloodSugar} mg/dL.`
      : "",
    cholesterol >= 200
      ? `Cholesterol is elevated at ${cholesterol} mg/dL.`
      : "",
    systolic >= 140 || diastolic >= 90
      ? `Blood pressure is elevated at ${systolic}/${diastolic} mmHg.`
      : "",
    bmi >= 30 ? `BMI is in the obese range at ${bmi.toFixed(1)}.` : "",
    smokingStatus === "current"
      ? "Current smoking status raises both cardiovascular and respiratory risk."
      : "",
    familyHistory.length > 0
      ? `Relevant family history was provided: ${formatList(familyHistory)}.`
      : "",
    age >= 60 ? `Older age (${age}) increases baseline risk.` : "",
  ]).slice(0, 6);

  const topRiskCondition = riskConditions[0]!;
  const useSymptomPrimary = symptomDiseasePredictions.length > 0;
  const topCondition = useSymptomPrimary ? symptomDiseasePredictions[0]! : topRiskCondition;

  let riskScore =
    topRiskCondition.probability * 0.55 +
    ((riskConditions[1]?.probability ?? 0) + (riskConditions[2]?.probability ?? 0)) * 0.15 +
    clamp(symptoms.size * 2, 0, 14) +
    (bloodSugar >= 126 ? 8 : 0) +
    (bloodSugar >= 200 ? 8 : 0) +
    (cholesterol >= 240 ? 6 : cholesterol >= 200 ? 3 : 0) +
    (systolic >= 140 || diastolic >= 90 ? 10 : 0) +
    (systolic >= 180 || diastolic >= 120 ? 10 : 0) +
    (bmi >= 30 ? 5 : bmi >= 27 ? 2 : 0) +
    (smokingStatus === "current" ? 5 : smokingStatus === "former" ? 2 : 0) +
    redFlags.length * 8;

  let primaryDiagnosis = topCondition.name;

  if (!useSymptomPrimary) {
    if (
      redFlags.some((flag) => flag.toLowerCase().includes("cardiac"))
    ) {
      primaryDiagnosis = "Acute cardiac risk pattern";
    } else if (
      redFlags.some((flag) => flag.toLowerCase().includes("stroke"))
    ) {
      primaryDiagnosis = "Possible neurologic emergency pattern";
    }
  }

  if (
    hasSymptom(symptoms, "chest pain") &&
    hasSymptom(symptoms, "shortness of breath")
  ) {
    riskScore = Math.max(riskScore, 84);
  }

  if (
    hasSymptom(symptoms, "numbness") &&
    (hasSymptom(symptoms, "blurred vision") ||
      hasSymptom(symptoms, "headache") ||
      hasSymptom(symptoms, "dizziness"))
  ) {
    riskScore = Math.max(riskScore, 86);
  }

  if (systolic >= 180 || diastolic >= 120) {
    riskScore = Math.max(riskScore, 88);
  }

  if (
    bloodSugar >= 250 &&
    (hasSymptom(symptoms, "frequent urination") ||
      hasSymptom(symptoms, "excessive thirst") ||
      hasSymptom(symptoms, "nausea"))
  ) {
    riskScore = Math.max(riskScore, 82);
  }

  riskScore = Math.round(clamp(riskScore, 8, 99));

  let riskLevel: RiskLevel = "low";
  let urgency = "Routine follow-up";

  if (riskScore >= 80) {
    riskLevel = "critical";
    urgency = "Immediate evaluation";
  } else if (riskScore >= 60) {
    riskLevel = "high";
    urgency = "Same-day review";
  } else if (riskScore >= 35) {
    riskLevel = "medium";
    urgency = "48-hour follow-up";
  }

  const summary = useSymptomPrimary
    ? redFlags.length > 0
      ? `${classifierSummary(primaryDiagnosis, symptoms)} ${redFlags[0]}`
      : classifierSummary(primaryDiagnosis, symptoms)
    : redFlags.length > 0
      ? `${primaryDiagnosis} is the leading concern. ${redFlags[0]}`
      : `${primaryDiagnosis} is the leading concern, driven mainly by ${formatList(
          keyFindings.slice(0, 3).map((finding) => finding.replace(/\.$/, "").toLowerCase()),
        )}.`;

  const recommendations = unique([
    riskLevel === "critical"
      ? "Seek emergency medical care now, especially if symptoms are new, severe, or worsening."
      : "",
    riskLevel === "high"
      ? "Arrange a same-day clinician review or urgent care assessment."
      : "",
    topRiskCondition.name === "Cardiovascular event risk" ||
    primaryDiagnosis === "Acute cardiac risk pattern"
      ? "Obtain an ECG, physical examination, and clinician review for chest pain or palpitations."
      : "",
    topRiskCondition.name === "Diabetes / hyperglycemia"
      ? "Repeat glucose testing and arrange HbA1c or fasting blood sugar confirmation."
      : "",
    topRiskCondition.name === "Hypertension / vascular strain"
      ? "Repeat blood pressure after 5 minutes of rest and track home readings twice daily."
      : "",
    topRiskCondition.name === "Respiratory / infectious illness"
      ? "Monitor temperature, hydration, and oxygen saturation if available."
      : "",
    topRiskCondition.name === "Neurologic / stroke-like pattern" ||
    primaryDiagnosis === "Possible neurologic emergency pattern"
      ? "New numbness, vision changes, or speech changes should be treated as emergency symptoms."
      : "",
    useSymptomPrimary
      ? `The trained symptom model ranked ${primaryDiagnosis} as the strongest disease match.`
      : "",
    bmi >= 27 ? "Lifestyle risk reduction is recommended: regular activity, sleep, and weight management." : "",
    smokingStatus === "current" ? "Smoking cessation support would materially lower future risk." : "",
    "This result is decision support only and does not replace a licensed clinician.",
  ]).slice(0, 6);

  return {
    primaryDiagnosis,
    probability: topCondition.probability,
    riskLevel,
    riskScore,
    summary,
    keyFindings,
    redFlags,
    conditions: conditions.map(({ probabilityRaw, ...condition }) => condition),
    recommendations,
    urgency,
    analysisVersion:
      symptomDiseasePredictions.length > 0
        ? SYMPTOM_CLASSIFIER?.analysisVersion ?? "symptom-classifier"
        : PREDICTION_MODELS.analysisVersion,
  };
}
