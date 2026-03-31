import React, { startTransition, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  CircleAlert,
  HeartPulse,
  Search,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  type PredictionInput,
  type PredictionResult,
  usePredictDisease,
} from "@workspace/api-client-react";

import { AnalysisLoadingCard, ANALYSIS_STEPS } from "@/components/prediction/AnalysisLoadingCard";
import { toast } from "@/hooks/use-toast";
import {
  buildPatientAssessmentContext,
  buildPracticalAdvice,
  buildProfessionalSummary,
  buildReferenceItems,
  buildWhenToSeekHelp,
  getInputReferenceNote,
  getReferenceToneClasses,
  normalizeSubmittedContext,
  type PatientAssessmentContext,
  validatePatientAssessmentContext,
} from "@/lib/patient-report";
import { usePortalData } from "@/lib/portal-data-context";
import { normalizePredictionResult } from "@/lib/prediction-result";
import {
  PREDICTION_SYMPTOM_CATEGORIES,
  FEATURED_PREDICTION_SYMPTOMS,
  PREDICTION_SYMPTOM_OPTIONS,
  PREDICTION_SYMPTOM_QUICK_SETS,
} from "@/lib/prediction-symptoms";

const MIN_ANALYSIS_MS = 1700;
const EMPTY_FORM_DATA = {
  age: "",
  gender: "Male",
  bmi: "",
  systolicPressure: "",
  diastolicPressure: "",
  bloodSugar: "",
  cholesterol: "",
  smokingStatus: "never",
};

const RISK_COLORS: Record<PredictionResult["riskLevel"], string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

function riskColor(level: PredictionResult["riskLevel"]): string {
  return {
    low: "text-green-600",
    medium: "text-amber-600",
    high: "text-orange-600",
    critical: "text-red-600",
  }[level];
}

function riskBg(level: PredictionResult["riskLevel"]): string {
  return {
    low: "bg-green-50 border-green-200",
    medium: "bg-amber-50 border-amber-200",
    high: "bg-orange-50 border-orange-200",
    critical: "bg-red-50 border-red-200",
  }[level];
}

function buildInputSignature(
  formData: typeof EMPTY_FORM_DATA,
  symptoms: string[],
): string {
  return JSON.stringify({
    ...formData,
    symptoms: [...symptoms].sort(),
  });
}

function getConsultationNote(result: PredictionResult | null): string | null {
  if (!result) return null;

  const recommendationText = result.recommendations.join(" ").toLowerCase();
  const needsConsultation =
    result.riskLevel === "medium" ||
    result.riskLevel === "high" ||
    result.riskLevel === "critical" ||
    result.redFlags.length > 0 ||
    recommendationText.includes("clinician") ||
    recommendationText.includes("medical care") ||
    recommendationText.includes("urgent care") ||
    recommendationText.includes("evaluation");

  if (!needsConsultation) {
    return null;
  }

  if (result.riskLevel === "critical") {
    return "Immediate consultation with a qualified doctor or emergency service is strongly advised based on the current assessment.";
  }

  if (result.riskLevel === "high") {
    return "Consultation with a qualified doctor is recommended as soon as possible to review these findings and confirm the next steps.";
  }

  return "A professional consultation with a doctor is recommended to interpret these findings in the context of your full clinical history.";
}

function hasValue(value: string): boolean {
  return value.trim().length > 0;
}

function buildOptionalPredictionPayload(
  formData: typeof EMPTY_FORM_DATA,
  symptoms: string[],
): PredictionInput | null {
  const payload: PredictionInput = {
    symptoms,
    age: 45,
    gender: formData.gender,
    familyHistory: [],
  };

  let hasMeaningfulInput = symptoms.length > 0;

  if (hasValue(formData.age)) {
    const age = Number(formData.age);
    if (!Number.isFinite(age) || age < 1 || age > 110) {
      return null;
    }
    payload.age = age;
    hasMeaningfulInput = true;
  }

  if (hasValue(formData.bmi)) {
    const bmi = Number(formData.bmi);
    if (!Number.isFinite(bmi) || bmi < 10 || bmi > 60) {
      return null;
    }
    payload.bmi = bmi;
    hasMeaningfulInput = true;
  }

  if (hasValue(formData.bloodSugar)) {
    const bloodSugar = Number(formData.bloodSugar);
    if (!Number.isFinite(bloodSugar) || bloodSugar < 50 || bloodSugar > 500) {
      return null;
    }
    payload.bloodSugar = bloodSugar;
    hasMeaningfulInput = true;
  }

  if (hasValue(formData.cholesterol)) {
    const cholesterol = Number(formData.cholesterol);
    if (!Number.isFinite(cholesterol) || cholesterol < 80 || cholesterol > 400) {
      return null;
    }
    payload.cholesterol = cholesterol;
    hasMeaningfulInput = true;
  }

  const hasSystolic = hasValue(formData.systolicPressure);
  const hasDiastolic = hasValue(formData.diastolicPressure);
  if (hasSystolic || hasDiastolic) {
    if (!(hasSystolic && hasDiastolic)) {
      return null;
    }

    const systolic = Number(formData.systolicPressure);
    const diastolic = Number(formData.diastolicPressure);
    if (
      !Number.isFinite(systolic) ||
      !Number.isFinite(diastolic) ||
      systolic < 80 ||
      systolic > 240 ||
      diastolic < 40 ||
      diastolic > 140 ||
      systolic <= diastolic
    ) {
      return null;
    }

    payload.bloodPressure = `${systolic}/${diastolic}`;
    hasMeaningfulInput = true;
  }

  if (formData.smokingStatus !== "never") {
    payload.smokingStatus = formData.smokingStatus;
    hasMeaningfulInput = true;
  }

  return hasMeaningfulInput ? payload : null;
}

function getPartialInputValidationMessage(formData: typeof EMPTY_FORM_DATA): string | null {
  if (hasValue(formData.age)) {
    const age = Number(formData.age);
    if (!Number.isFinite(age) || age < 1 || age > 110) {
      return "Age should be between 1 and 110 years.";
    }
  }

  if (hasValue(formData.bmi)) {
    const bmi = Number(formData.bmi);
    if (!Number.isFinite(bmi) || bmi < 10 || bmi > 60) {
      return "BMI should stay within a human range of 10 to 60.";
    }
  }

  if (hasValue(formData.bloodSugar)) {
    const bloodSugar = Number(formData.bloodSugar);
    if (!Number.isFinite(bloodSugar) || bloodSugar < 50 || bloodSugar > 500) {
      return "Blood sugar should be between 50 and 500 mg/dL.";
    }
  }

  if (hasValue(formData.cholesterol)) {
    const cholesterol = Number(formData.cholesterol);
    if (!Number.isFinite(cholesterol) || cholesterol < 80 || cholesterol > 400) {
      return "Cholesterol should be between 80 and 400 mg/dL.";
    }
  }

  const hasSystolic = hasValue(formData.systolicPressure);
  const hasDiastolic = hasValue(formData.diastolicPressure);
  if (hasSystolic || hasDiastolic) {
    if (!(hasSystolic && hasDiastolic)) {
      return "Enter both blood pressure values in systolic/diastolic form, for example 120/80.";
    }

    const systolic = Number(formData.systolicPressure);
    const diastolic = Number(formData.diastolicPressure);
    if (!Number.isFinite(systolic) || systolic < 80 || systolic > 240) {
      return "Systolic blood pressure should be between 80 and 240 mmHg.";
    }
    if (!Number.isFinite(diastolic) || diastolic < 40 || diastolic > 140) {
      return "Diastolic blood pressure should be between 40 and 140 mmHg.";
    }
    if (systolic <= diastolic) {
      return "Blood pressure format looks incorrect. Systolic should be higher than diastolic.";
    }
  }

  return null;
}

export default function PatientPrediction() {
  const container = useRef<HTMLDivElement>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastAnalyzedSignature, setLastAnalyzedSignature] = useState<string | null>(null);
  const [lastAnalyzedContext, setLastAnalyzedContext] = useState<PatientAssessmentContext | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const { mutate } = usePredictDisease();
  const { addAssessment } = usePortalData();

  useGSAP(() => {
    gsap.from(".patient-animate-in", {
      y: 22,
      opacity: 0,
      stagger: 0.08,
      duration: 0.48,
      ease: "power3.out",
    });
  }, { scope: container });

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisStep(0);
      return;
    }

    const timer = window.setInterval(() => {
      setAnalysisStep((current) => Math.min(current + 1, ANALYSIS_STEPS.length - 1));
    }, 420);

    return () => window.clearInterval(timer);
  }, [isAnalyzing]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((entry) => entry !== symptom)
        : [...current, symptom],
    );
  };

  const finishAnalysis = (startedAt: number, callback: () => void) => {
    const remaining = Math.max(0, MIN_ANALYSIS_MS - (Date.now() - startedAt));
    window.setTimeout(callback, remaining);
  };

  const resetAssessment = () => {
    setFormData(EMPTY_FORM_DATA);
    setSelectedSymptoms([]);
    setHasSubmitted(false);
    setLastAnalyzedContext(null);
    setLastAnalyzedSignature(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const handleSubmit = () => {
    setHasSubmitted(true);

    const partialValidationMessage = getPartialInputValidationMessage(formData);
    const payload = buildOptionalPredictionPayload(formData, selectedSymptoms);
    const context = buildPatientAssessmentContext({
      age: formData.age,
      bmi: formData.bmi,
      bloodPressure: `${formData.systolicPressure}/${formData.diastolicPressure}`,
      bloodSugar: formData.bloodSugar,
      cholesterol: formData.cholesterol,
      familyHistory: [],
      gender: formData.gender,
      smokingStatus: formData.smokingStatus,
      symptoms: selectedSymptoms,
    });
    const currentSignature = buildInputSignature(formData, selectedSymptoms);

    if (partialValidationMessage) {
      toast({
        title: "Check health values",
        description: partialValidationMessage,
        variant: "destructive",
      });
      return;
    }

    if (!payload) {
      toast({
        title: "Add some input first",
        description: "Enter at least one symptom or one health value before running the analysis.",
        variant: "destructive",
      });
      return;
    }

    const startedAt = Date.now();
    const normalizedContext =
      context && validatePatientAssessmentContext(context).length === 0
        ? normalizeSubmittedContext(context)
        : null;

    setIsAnalyzing(true);
    setLastAnalyzedContext(normalizedContext);
    setLastAnalyzedSignature(currentSignature);

    mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          finishAnalysis(startedAt, () => {
            const normalizedResult = normalizePredictionResult(data);
            const generatedSummary = normalizedContext
              ? buildProfessionalSummary(normalizedResult, normalizedContext)
              : normalizedResult.summary;
            const generatedAdvice = normalizedContext
              ? buildPracticalAdvice(normalizedResult, normalizedContext)
              : normalizedResult.recommendations;

            if (normalizedContext) {
              addAssessment({
                context: normalizedContext,
                recommendations: generatedAdvice,
                result: normalizedResult,
                summary: generatedSummary,
              });
            }

            startTransition(() => {
              setResult(normalizedResult);
              setIsAnalyzing(false);
            });

            window.setTimeout(() => {
              gsap.from(".patient-result-item", {
                y: 20,
                opacity: 0,
                stagger: 0.08,
                duration: 0.45,
                ease: "power3.out",
              });
            }, 40);
          });
        },
        onError: () => {
          finishAnalysis(startedAt, () => {
            setIsAnalyzing(false);
            toast({
              title: "Analysis unavailable",
              description: "The symptom checker could not reach the backend. Please retry in a moment.",
              variant: "destructive",
            });
          });
        },
      },
    );
  };

  const safeResult = result ? normalizePredictionResult(result) : null;
  const currentInputSignature = buildInputSignature(formData, selectedSymptoms);
  const previewContext = buildPatientAssessmentContext({
    age: formData.age,
    bmi: formData.bmi,
    bloodPressure: `${formData.systolicPressure}/${formData.diastolicPressure}`,
    bloodSugar: formData.bloodSugar,
    cholesterol: formData.cholesterol,
    familyHistory: [],
    gender: formData.gender,
    smokingStatus: formData.smokingStatus,
    symptoms: selectedSymptoms,
  });
  const currentInputNotes = {
    age: getInputReferenceNote("age"),
    bmi: getInputReferenceNote("bmi"),
    bloodPressure: getInputReferenceNote("bloodPressure"),
    bloodSugar: getInputReferenceNote("bloodSugar"),
    cholesterol: getInputReferenceNote("cholesterol"),
  };
  const referenceItems = lastAnalyzedContext ? buildReferenceItems(lastAnalyzedContext) : [];
  const relevantReferenceItems = referenceItems.filter((item) => item.tone !== "normal");
  const displaySummary =
    safeResult && lastAnalyzedContext
      ? buildProfessionalSummary(safeResult, lastAnalyzedContext)
      : safeResult?.summary ?? "";
  const professionalAdvice =
    safeResult && lastAnalyzedContext
      ? buildPracticalAdvice(safeResult, lastAnalyzedContext)
      : (safeResult?.recommendations ?? []);
  const urgentHelpItems =
    safeResult && lastAnalyzedContext
      ? buildWhenToSeekHelp(safeResult, lastAnalyzedContext)
      : (safeResult?.redFlags ?? []);
  const partialInputValidationMessage = getPartialInputValidationMessage(formData);
  const inputValidationErrors = partialInputValidationMessage ? [partialInputValidationMessage] : [];
  const completedRequiredFields = [
    formData.age,
    formData.bmi,
    formData.systolicPressure,
    formData.diastolicPressure,
    formData.bloodSugar,
    formData.cholesterol,
  ].filter((value) => value.trim().length > 0).length;
  const hasAnyProvidedInput =
    selectedSymptoms.length > 0 ||
    [
      formData.age,
      formData.bmi,
      formData.systolicPressure,
      formData.diastolicPressure,
      formData.bloodSugar,
      formData.cholesterol,
    ].some((value) => value.trim().length > 0) ||
    formData.smokingStatus !== "never";
  const canAnalyze = hasAnyProvidedInput && inputValidationErrors.length === 0 && !isAnalyzing;
  const isResultStale = Boolean(
    safeResult &&
    lastAnalyzedSignature &&
    lastAnalyzedSignature !== currentInputSignature,
  );
  const liveReferenceItems =
    previewContext && validatePatientAssessmentContext(previewContext).length === 0
      ? buildReferenceItems(normalizeSubmittedContext(previewContext))
      : [];
  const normalizedSymptomSearch = symptomSearch.trim().toLowerCase();
  const symptomGroups = Object.entries(PREDICTION_SYMPTOM_CATEGORIES)
    .map(([category, meta]) => ({
      category,
      ...meta,
      symptoms: PREDICTION_SYMPTOM_OPTIONS.filter(
        (option) =>
          option.category === category &&
          option.category !== "featured" &&
          (normalizedSymptomSearch.length === 0 ||
            option.label.toLowerCase().includes(normalizedSymptomSearch)),
      ),
    }))
    .filter((group) => group.symptoms.length > 0);
  const datasetAlignedCount = selectedSymptoms.filter((symptom) =>
    PREDICTION_SYMPTOM_OPTIONS.some((option) => option.label === symptom && option.datasetAligned),
  ).length;
  const topConditionSignals = safeResult?.conditions.slice(0, 4) ?? [];
  const consultationNote = getConsultationNote(safeResult);

  return (
    <div ref={container} className="mx-auto max-w-[1180px] space-y-6">
      <div className="patient-animate-in">
        <h1 className="text-3xl font-bold text-foreground">Symptom Checker</h1>
        <p className="mt-1 text-muted-foreground">
          Run a reference-guided assessment using vitals, optional symptoms, and practical next-step advice.
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-6 ${result || isAnalyzing ? "lg:grid-cols-2" : ""}`}>
        <div className="space-y-5">
          <div className="premium-card p-6 patient-animate-in">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Health Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter realistic values first. These inputs drive the main health assessment.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {completedRequiredFields}/6 completed
                </span>
                <button
                  type="button"
                  onClick={resetAssessment}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: "Age", key: "age", type: "number" },
                { label: "BMI", key: "bmi", type: "number" },
                { label: "Blood Sugar (mg/dL)", key: "bloodSugar", type: "number" },
                { label: "Cholesterol (mg/dL)", key: "cholesterol", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key as keyof typeof formData]}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={
                      field.key === "age"
                        ? "45"
                        : field.key === "bmi"
                          ? "24.5"
                          : field.key === "bloodSugar"
                              ? "95"
                              : "180"
                    }
                    min={field.key === "age" ? 1 : field.key === "bmi" ? 10 : field.key === "bloodSugar" ? 50 : field.key === "cholesterol" ? 80 : undefined}
                    max={field.key === "age" ? 110 : field.key === "bmi" ? 60 : field.key === "bloodSugar" ? 500 : field.key === "cholesterol" ? 400 : undefined}
                    step={field.key === "bmi" ? "0.1" : "1"}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {field.key !== "cholesterol" && formData[field.key as keyof typeof formData].trim().length > 0 ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {currentInputNotes[field.key as keyof typeof currentInputNotes]}
                    </p>
                  ) : null}
                </div>
              ))}

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Blood Pressure (mmHg)
                </label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={80}
                    max={240}
                    placeholder="120"
                    value={formData.systolicPressure}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        systolicPressure: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">/</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={40}
                    max={140}
                    placeholder="80"
                    value={formData.diastolicPressure}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        diastolicPressure: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {formData.systolicPressure.trim().length > 0 || formData.diastolicPressure.trim().length > 0 ? (
                  <>
                    <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{formData.systolicPressure.trim().length > 0 ? "Systolic" : ""}</span>
                      <span>{formData.diastolicPressure.trim().length > 0 ? "Diastolic" : ""}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {currentInputNotes.bloodPressure}
                    </p>
                  </>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      gender: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Smoking Status
                </label>
                <select
                  value={formData.smokingStatus}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      smokingStatus: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>

            {hasSubmitted && inputValidationErrors.length > 0 ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {inputValidationErrors[0]}
              </div>
            ) : null}

            {liveReferenceItems.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">Live Health Snapshot</p>
                  <span className="text-xs text-muted-foreground">Updates as you type</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {liveReferenceItems.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-3 ${getReferenceToneClasses(item.tone)}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold">{item.label}</p>
                        <span className="text-sm font-semibold">{item.value}</span>
                      </div>
                      <p className="mt-1.5 text-sm">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

          <div className="premium-card p-6 patient-animate-in">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">Symptoms</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  Dataset-aware
                </span>
              </div>
              {selectedSymptoms.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedSymptoms([])}
                  className="self-start rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  Clear symptoms
                </button>
              ) : null}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Add what you are actually feeling. The grouped options below are aligned with the trained symptom dataset wherever possible.
            </p>

            <div className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Quick Symptom Sets</p>
                    <p className="text-xs text-muted-foreground">
                      Use these as starting points when a case matches a common trained pattern.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {datasetAlignedCount}/{selectedSymptoms.length || 0} selected symptoms align directly
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PREDICTION_SYMPTOM_QUICK_SETS.map((group) => (
                    <button
                      key={group.label}
                      type="button"
                      onClick={() =>
                        setSelectedSymptoms((current) =>
                          Array.from(new Set([...current, ...group.symptoms])),
                        )
                      }
                      className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      {group.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Find Symptoms</p>
                  <p className="text-xs text-muted-foreground">
                    Search across all 132 symptoms from the trained dataset.
                  </p>
                </div>
                <label className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                  <Search size={15} className="text-muted-foreground" />
                  <input
                    value={symptomSearch}
                    onChange={(event) => setSymptomSearch(event.target.value)}
                    placeholder="Search symptoms like cough, headache..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
              </div>
            </div>

            {selectedSymptoms.length > 0 ? (
              <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">Selected Symptoms</p>
                  <span className="text-xs text-muted-foreground">{selectedSymptoms.length} active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className="rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm"
                  >
                    {symptom} x
                  </button>
                ))}
                </div>
              </div>
            ) : null}

            {normalizedSymptomSearch.length === 0 ? (
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/20 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Suggested Matches</p>
                    <p className="text-xs text-muted-foreground">
                      Start with common triage symptoms, or search to browse the full dataset.
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {FEATURED_PREDICTION_SYMPTOMS.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FEATURED_PREDICTION_SYMPTOMS.map((symptom) => (
                    <button
                      key={symptom.label}
                      type="button"
                      onClick={() => toggleSymptom(symptom.label)}
                      className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                        selectedSymptoms.includes(symptom.label)
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {symptom.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : symptomGroups.length > 0 ? (
              <div className="space-y-4">
                {symptomGroups.map((group) => (
                  <div key={group.category} className="rounded-2xl border border-border/70 bg-gradient-to-br from-background to-muted/20 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">{group.label}</p>
                        <p className="text-xs text-muted-foreground">{group.description}</p>
                      </div>
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {group.symptoms.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.symptoms.map((symptom) => (
                        <button
                          key={symptom.label}
                          type="button"
                          onClick={() => toggleSymptom(symptom.label)}
                          className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                            selectedSymptoms.includes(symptom.label)
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {symptom.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">No matching symptoms found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a broader term like `pain`, `fever`, `urine`, or `vision`.
                </p>
              </div>
            )}
          </div>

          <div className="patient-animate-in rounded-2xl border border-primary/10 bg-background p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold text-foreground">Analyze Symptoms</p>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {selectedSymptoms.length > 0 ? `${selectedSymptoms.length} selected` : "Symptoms optional"}
              </span>
            </div>
            <p className="mb-3 px-1 text-xs text-muted-foreground">
              {!hasAnyProvidedInput
                ? "Add at least one symptom or any health value to start the assessment."
                : inputValidationErrors.length > 0
                  ? "Review the entered health values before running the assessment."
                  : isResultStale
                    ? "Inputs changed after your last analysis. Run it again to refresh the report."
                    : `The engine can analyze partial input and will use whatever data you provided. ${datasetAlignedCount > 0 ? `${datasetAlignedCount} selected symptom${datasetAlignedCount === 1 ? "" : "s"} line up with the trained dataset.` : "Dataset-aligned symptoms improve pattern matching."}`}
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canAnalyze}
              className="premium-button flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Brain size={18} />
              {isAnalyzing
                ? "Analyzing Symptoms..."
                : safeResult && isResultStale
                  ? "Re-analyze Symptoms"
                  : "Analyze Symptoms"}
            </button>
          </div>
        </div>

        {isAnalyzing ? (
          <AnalysisLoadingCard
            currentStep={analysisStep}
            title="Symptom checker analysis"
            description="We are checking the entered health values, any selected symptoms, and the safest next-step advice."
          />
        ) : safeResult ? (
          <div className="space-y-5">
            {isResultStale ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                The values or symptoms have changed since this report was generated. Re-run the analysis to refresh the advice.
              </div>
            ) : null}

            <div className={`premium-card border-2 p-6 patient-result-item ${riskBg(safeResult.riskLevel)}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                  <Brain size={20} className={riskColor(safeResult.riskLevel)} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Health Assessment</h2>
                  <p className="text-sm text-muted-foreground">{safeResult.primaryDiagnosis}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                      data={[{ value: safeResult.riskScore, fill: RISK_COLORS[safeResult.riskLevel] }]}
                    >
                      <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#e5e7eb" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className={`text-4xl font-bold ${riskColor(safeResult.riskLevel)}`}>{safeResult.riskScore}</p>
                  <p className="text-sm text-muted-foreground">Risk Score / 100</p>
                  <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold ${riskBg(safeResult.riskLevel)} ${riskColor(safeResult.riskLevel)}`}>
                    {safeResult.riskLevel === "critical" || safeResult.riskLevel === "high" ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {safeResult.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card p-6 patient-result-item">
              <h3 className="mb-3 text-base font-bold text-foreground">Summary</h3>
              <p className="text-sm leading-6 text-muted-foreground">{displaySummary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskBg(safeResult.riskLevel)} ${riskColor(safeResult.riskLevel)}`}>
                  {safeResult.urgency}
                </span>
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Model build: {safeResult.analysisVersion}
                </span>
              </div>

              {consultationNote ? (
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                  {consultationNote}
                </div>
              ) : null}
            </div>

            {topConditionSignals.length > 0 ? (
              <div className="premium-card p-6 patient-result-item">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                  <Brain size={18} className="text-primary" />
                  Top Model Signals
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {topConditionSignals.map((condition) => (
                    <div key={condition.name} className="rounded-2xl border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{condition.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Confidence {condition.probability}%
                          </p>
                        </div>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskBg(condition.riskLevel as PredictionResult["riskLevel"])} ${riskColor(condition.riskLevel as PredictionResult["riskLevel"])}`}>
                          {condition.riskLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {relevantReferenceItems.length > 0 ? (
              <div className="premium-card p-6 patient-result-item">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                  <HeartPulse size={18} className="text-primary" />
                  Relevant Health Checks
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {relevantReferenceItems.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-2xl border p-4 ${getReferenceToneClasses(item.tone)}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold">{item.label}</p>
                        <span className="text-sm font-semibold">{item.value}</span>
                      </div>
                      <p className="mt-2 text-sm">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {safeResult.redFlags.length > 0 ? (
              <div className="premium-card border border-red-200 bg-red-50/70 p-6 patient-result-item">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-red-800">
                  <ShieldAlert size={18} />
                  Red Flags
                </h3>
                <div className="space-y-3">
                  {safeResult.redFlags.map((flag) => (
                    <div key={flag} className="rounded-xl bg-white/80 p-3 text-sm text-red-700">
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="premium-card p-6 patient-result-item">
              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                <Scale size={18} className="text-primary" />
                Practical Advice
              </h3>
              <div className="space-y-2">
                {professionalAdvice.map((recommendation) => (
                  <div
                    key={recommendation}
                    className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3"
                  >
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-blue-600" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {urgentHelpItems.length > 0 ? (
              <div className="premium-card p-6 patient-result-item">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                  <CircleAlert size={18} className="text-red-500" />
                  When To Seek Help Quickly
                </h3>
                <div className="space-y-3">
                  {urgentHelpItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-red-100 bg-red-50/70 p-3 text-sm text-red-800"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isAnalyzing && !result ? (
          <div className="premium-card patient-animate-in flex min-h-[420px] items-center justify-center bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/50 p-8 text-center">
            <div>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Activity size={28} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Ready to Analyze</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Enter health values first, then add symptoms only if you want more situation-specific advice.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
