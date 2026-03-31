import type { PredictionResult } from "@workspace/api-client-react";

export type PatientAssessmentContext = {
  age: number;
  bmi: number;
  bloodPressure: string;
  bloodSugar: number;
  cholesterol: number;
  diastolic: number;
  familyHistory: string[];
  gender: string;
  smokingStatus: string;
  symptoms: string[];
  systolic: number;
};

export type ReferenceTone = "normal" | "watch" | "high" | "critical";

export type ReferenceItem = {
  label: string;
  note: string;
  tone: ReferenceTone;
  value: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function normalizeSymptom(symptom: string): string {
  return symptom.trim().toLowerCase();
}

export function parseBloodPressure(rawValue: string): {
  diastolic: number | null;
  systolic: number | null;
} {
  const match = rawValue.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);

  if (!match) {
    return { systolic: null, diastolic: null };
  }

  return {
    systolic: Number(match[1]),
    diastolic: Number(match[2]),
  };
}

export function buildPatientAssessmentContext(params: {
  age: string;
  bmi: string;
  bloodPressure: string;
  bloodSugar: string;
  cholesterol: string;
  familyHistory: string[];
  gender: string;
  smokingStatus: string;
  symptoms: string[];
}): PatientAssessmentContext | null {
  const age = Number(params.age);
  const bmi = Number(params.bmi);
  const bloodSugar = Number(params.bloodSugar);
  const cholesterol = Number(params.cholesterol);
  const { systolic, diastolic } = parseBloodPressure(params.bloodPressure);

  if (
    !Number.isFinite(age) ||
    !Number.isFinite(bmi) ||
    !Number.isFinite(bloodSugar) ||
    !Number.isFinite(cholesterol) ||
    systolic === null ||
    diastolic === null
  ) {
    return null;
  }

  return {
    age,
    bmi,
    bloodPressure: params.bloodPressure,
    bloodSugar,
    cholesterol,
    diastolic,
    familyHistory: params.familyHistory,
    gender: params.gender,
    smokingStatus: params.smokingStatus,
    symptoms: params.symptoms,
    systolic,
  };
}

export function validatePatientAssessmentContext(
  context: PatientAssessmentContext | null,
): string[] {
  if (!context) {
    return ["Enter blood pressure in `systolic/diastolic` format, for example `120/80`."];
  }

  const errors: string[] = [];

  if (context.age < 1 || context.age > 110) {
    errors.push("Age should be between 1 and 110 years.");
  }

  if (context.bmi < 10 || context.bmi > 60) {
    errors.push("BMI should stay within a human range of 10 to 60.");
  }

  if (context.bloodSugar < 50 || context.bloodSugar > 500) {
    errors.push("Blood sugar should be between 50 and 500 mg/dL.");
  }

  if (context.cholesterol < 80 || context.cholesterol > 400) {
    errors.push("Cholesterol should be between 80 and 400 mg/dL.");
  }

  if (context.systolic < 80 || context.systolic > 240) {
    errors.push("Systolic blood pressure should be between 80 and 240 mmHg.");
  }

  if (context.diastolic < 40 || context.diastolic > 140) {
    errors.push("Diastolic blood pressure should be between 40 and 140 mmHg.");
  }

  if (context.systolic <= context.diastolic) {
    errors.push("Blood pressure format looks incorrect. Systolic should be higher than diastolic.");
  }

  return errors;
}

function bloodPressureReference(context: PatientAssessmentContext): ReferenceItem {
  if (context.systolic >= 180 || context.diastolic >= 120) {
    return {
      label: "Blood Pressure",
      value: `${context.systolic}/${context.diastolic} mmHg`,
      tone: "critical",
      note: "Hypertensive crisis range. This needs urgent medical attention.",
    };
  }

  if (context.systolic >= 140 || context.diastolic >= 90) {
    return {
      label: "Blood Pressure",
      value: `${context.systolic}/${context.diastolic} mmHg`,
      tone: "high",
      note: "High adult blood pressure range. Repeat reading and arrange review.",
    };
  }

  if (context.systolic >= 130 || context.diastolic >= 80) {
    return {
      label: "Blood Pressure",
      value: `${context.systolic}/${context.diastolic} mmHg`,
      tone: "watch",
      note: "Above ideal adult range. Home monitoring is reasonable.",
    };
  }

  if (context.systolic >= 120 && context.diastolic < 80) {
    return {
      label: "Blood Pressure",
      value: `${context.systolic}/${context.diastolic} mmHg`,
      tone: "watch",
      note: "Elevated systolic pressure. Lifestyle control can help.",
    };
  }

  return {
    label: "Blood Pressure",
    value: `${context.systolic}/${context.diastolic} mmHg`,
    tone: "normal",
    note: "Within normal adult range, usually below 120/80.",
  };
}

function bloodSugarReference(context: PatientAssessmentContext): ReferenceItem {
  if (context.bloodSugar >= 250) {
    return {
      label: "Blood Sugar",
      value: `${context.bloodSugar} mg/dL`,
      tone: "critical",
      note: "Very high glucose. If unwell, seek urgent same-day medical review.",
    };
  }

  if (context.bloodSugar >= 126) {
    return {
      label: "Blood Sugar",
      value: `${context.bloodSugar} mg/dL`,
      tone: "high",
      note: "If this was fasting, it is in the diabetes range and needs confirmation.",
    };
  }

  if (context.bloodSugar >= 100) {
    return {
      label: "Blood Sugar",
      value: `${context.bloodSugar} mg/dL`,
      tone: "watch",
      note: "Higher than ideal fasting range. Consider repeat testing or HbA1c.",
    };
  }

  return {
    label: "Blood Sugar",
    value: `${context.bloodSugar} mg/dL`,
    tone: "normal",
    note: "In the usual fasting reference range of about 70 to 99.",
  };
}

function bmiReference(context: PatientAssessmentContext): ReferenceItem {
  if (context.bmi >= 35) {
    return {
      label: "BMI",
      value: round(context.bmi, 1).toFixed(1),
      tone: "high",
      note: "Severe obesity range. Structured clinician-guided weight support is advisable.",
    };
  }

  if (context.bmi >= 30) {
    return {
      label: "BMI",
      value: round(context.bmi, 1).toFixed(1),
      tone: "high",
      note: "Obesity range. Weight reduction lowers diabetes and blood pressure risk.",
    };
  }

  if (context.bmi >= 25) {
    return {
      label: "BMI",
      value: round(context.bmi, 1).toFixed(1),
      tone: "watch",
      note: "Overweight range. Regular activity and calorie balance are helpful.",
    };
  }

  if (context.bmi < 18.5) {
    return {
      label: "BMI",
      value: round(context.bmi, 1).toFixed(1),
      tone: "watch",
      note: "Below the usual adult range. Consider nutrition review if unintentional.",
    };
  }

  return {
    label: "BMI",
    value: round(context.bmi, 1).toFixed(1),
    tone: "normal",
    note: "Within the usual adult range of 18.5 to 24.9.",
  };
}

function cholesterolReference(context: PatientAssessmentContext): ReferenceItem {
  if (context.cholesterol >= 240) {
    return {
      label: "Cholesterol",
      value: `${context.cholesterol} mg/dL`,
      tone: "high",
      note: "High total cholesterol range. Lipid review is recommended.",
    };
  }

  if (context.cholesterol >= 200) {
    return {
      label: "Cholesterol",
      value: `${context.cholesterol} mg/dL`,
      tone: "watch",
      note: "Borderline high total cholesterol. Diet and repeat testing help.",
    };
  }

  return {
    label: "Cholesterol",
    value: `${context.cholesterol} mg/dL`,
    tone: "normal",
    note: "Desirable total cholesterol is usually below 200 mg/dL.",
  };
}

export function buildReferenceItems(context: PatientAssessmentContext): ReferenceItem[] {
  return [
    bloodPressureReference(context),
    bloodSugarReference(context),
    bmiReference(context),
    cholesterolReference(context),
  ];
}

export function getReferenceToneClasses(tone: ReferenceTone): string {
  if (tone === "critical") return "border-red-200 bg-red-50 text-red-800";
  if (tone === "high") return "border-orange-200 bg-orange-50 text-orange-800";
  if (tone === "watch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export function getProfessionalModelLabel(result: PredictionResult): string {
  return result.analysisVersion === "legacy-response"
    ? "Reference-guided report"
    : "Clinical engine report";
}

export function buildProfessionalSummary(
  result: PredictionResult,
  context: PatientAssessmentContext,
): string {
  const references = buildReferenceItems(context);
  const outOfRange = references
    .filter((item) => item.tone !== "normal")
    .map((item) => `${item.label.toLowerCase()} is ${item.value}`);

  if (result.redFlags.length > 0) {
    return `${result.primaryDiagnosis} is the leading concern. ${result.redFlags[0]}`;
  }

  if (outOfRange.length > 0) {
    return `${result.primaryDiagnosis} is the top matching pattern. Key adult health markers suggest that ${outOfRange.slice(0, 2).join(" and ")}.`;
  }

  return `${result.primaryDiagnosis} is the top matching pattern. Your entered blood pressure, blood sugar, BMI, and cholesterol stay close to common adult reference ranges, so symptom pattern matters more than the vitals alone.`;
}

export function buildPracticalAdvice(
  result: PredictionResult,
  context: PatientAssessmentContext,
): string[] {
  const symptoms = new Set(context.symptoms.map(normalizeSymptom));
  const relevantRecommendations = result.recommendations.filter((item) => {
    const normalized = item.toLowerCase();

    return (
      !normalized.includes("decision support only") &&
      !normalized.includes("licensed clinician")
    );
  });

  const advice = [
    ...relevantRecommendations,
    context.systolic >= 180 || context.diastolic >= 120
      ? "Repeat blood pressure after 5 minutes seated. If it stays this high or you feel unwell, go for urgent care or emergency review."
      : "",
    context.systolic >= 140 || context.diastolic >= 90
      ? "Check home blood pressure twice daily for 3 to 7 days and discuss the average with a clinician."
      : "",
    context.bloodSugar >= 126
      ? "Arrange HbA1c or fasting glucose confirmation because this blood sugar is above the usual fasting target."
      : "",
    context.bloodSugar >= 100 && context.bloodSugar < 126
      ? "If this was a fasting reading, it is above ideal and worth repeating with HbA1c screening."
      : "",
    context.cholesterol >= 200
      ? "Review diet quality, fiber intake, and exercise habits; a lipid panel with HDL and LDL is more useful than total cholesterol alone."
      : "",
    context.bmi >= 25
      ? "A modest weight reduction of even 5 to 10 percent can improve blood pressure, glucose, and cholesterol."
      : "",
    context.smokingStatus === "current"
      ? "Stopping smoking is one of the fastest ways to lower heart and vascular risk."
      : "",
    symptoms.has("chest pain") || symptoms.has("shortness of breath")
      ? "Do not ignore chest pain, faintness, or worsening breathlessness, especially if symptoms are new or intense."
      : "",
    symptoms.has("frequent urination") && symptoms.has("excessive thirst")
      ? "Frequent urination with excessive thirst fits a classic high-glucose pattern and should be checked with lab testing."
      : "",
    symptoms.has("cough") && symptoms.has("fever")
      ? "Monitor temperature, hydration, and breathing. Seek care early if cough is worsening or breathing becomes difficult."
      : "",
  ];

  return [...new Set(advice.filter(Boolean))].slice(0, 7);
}

export function buildWhenToSeekHelp(
  result: PredictionResult,
  context: PatientAssessmentContext,
): string[] {
  const symptoms = new Set(context.symptoms.map(normalizeSymptom));

  const items = [
    ...result.redFlags,
    symptoms.has("chest pain") &&
    (symptoms.has("shortness of breath") || symptoms.has("palpitations"))
      ? "Chest pain with breathlessness or palpitations should be assessed urgently."
      : "",
    symptoms.has("numbness") &&
    (symptoms.has("blurred vision") || symptoms.has("headache") || symptoms.has("dizziness"))
      ? "Numbness with visual change, headache, or dizziness can indicate a neurologic emergency."
      : "",
    context.bloodSugar >= 250
      ? "Very high blood sugar plus vomiting, heavy thirst, or weakness needs same-day care."
      : "",
    context.systolic >= 180 || context.diastolic >= 120
      ? "Blood pressure in this range needs urgent review, especially with headache, chest pain, or vision symptoms."
      : "",
  ];

  return [...new Set(items.filter(Boolean))].slice(0, 5);
}

export function getInputReferenceNote(field: "age" | "bmi" | "bloodPressure" | "bloodSugar" | "cholesterol"): string {
  if (field === "age") return "Use a realistic age between 1 and 110 years.";
  if (field === "bmi") return "Adult BMI reference: 18.5 to 24.9 is usually considered normal.";
  if (field === "bloodPressure") return "Enter as systolic/diastolic, for example 120/80.";
  if (field === "bloodSugar") return "Fasting glucose is often interpreted as normal around 70 to 99 mg/dL.";
  return "Total cholesterol below 200 mg/dL is usually considered desirable.";
}

export function normalizeSubmittedContext(context: PatientAssessmentContext): PatientAssessmentContext {
  return {
    ...context,
    age: clamp(context.age, 1, 110),
    bmi: clamp(context.bmi, 10, 60),
    bloodSugar: clamp(context.bloodSugar, 50, 500),
    cholesterol: clamp(context.cholesterol, 80, 400),
    systolic: clamp(context.systolic, 80, 240),
    diastolic: clamp(context.diastolic, 40, 140),
  };
}
