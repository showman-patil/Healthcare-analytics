import React, { startTransition, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChevronRight,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  type PredictionInput,
  type PredictionResult,
  usePredictDisease,
} from "@workspace/api-client-react";

import { AnalysisLoadingCard, ANALYSIS_STEPS } from "@/components/prediction/AnalysisLoadingCard";
import { toast } from "@/hooks/use-toast";
import { normalizePredictionResult } from "@/lib/prediction-result";
import {
  PREDICTION_SYMPTOM_CATEGORIES,
  FEATURED_PREDICTION_SYMPTOMS,
  PREDICTION_SYMPTOM_OPTIONS,
  PREDICTION_SYMPTOM_QUICK_SETS,
} from "@/lib/prediction-symptoms";

const FAMILY_HISTORY_OPTIONS = [
  "Diabetes",
  "Heart disease",
  "Hypertension",
  "Stroke",
] as const;

const MIN_ANALYSIS_MS = 1700;

function riskBadge(level: PredictionResult["riskLevel"]): string {
  if (level === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (level === "high") return "bg-orange-100 text-orange-700 border-orange-200";
  if (level === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function toNumber(value: number | string): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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
    return "Immediate doctor review or emergency escalation is recommended on the basis of the current assessment.";
  }

  if (result.riskLevel === "high") {
    return "Prompt consultation with a doctor is recommended to confirm the diagnosis and determine appropriate management.";
  }

  return "Clinical consultation with a doctor is recommended to interpret this result alongside the patient’s history and examination findings.";
}

export default function DoctorPrediction() {
  const container = useRef<HTMLDivElement>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [formData, setFormData] = useState({
    age: 45,
    gender: "male",
    systolicPressure: "120",
    diastolicPressure: "80",
    bloodSugar: 95,
    cholesterol: 180,
    bmi: 24.5,
    smokingStatus: "never",
  });

  const { mutate } = usePredictDisease();

  useGSAP(() => {
    gsap.from(".doctor-animate-in", {
      y: 18,
      opacity: 0,
      stagger: 0.08,
      duration: 0.45,
      ease: "power2.out",
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
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const toggleHistory = (item: string) => {
    setFamilyHistory((current) =>
      current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item],
    );
  };

  const finishAnalysis = (startedAt: number, callback: () => void) => {
    const remaining = Math.max(0, MIN_ANALYSIS_MS - (Date.now() - startedAt));

    window.setTimeout(callback, remaining);
  };

  const handleAnalyze = () => {
    if (symptoms.length === 0) {
      toast({
        title: "Symptoms required",
        description: "Select at least one symptom before running the analysis.",
      });
      return;
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
      toast({
        title: "Check blood pressure",
        description: "Enter a valid blood pressure reading, for example 120 over 80 mmHg.",
        variant: "destructive",
      });
      return;
    }

    const startedAt = Date.now();
    const payload: PredictionInput = {
      symptoms,
      age: formData.age,
      gender: formData.gender,
      bloodPressure: `${systolic}/${diastolic}`,
      bloodSugar: toNumber(formData.bloodSugar),
      cholesterol: toNumber(formData.cholesterol),
      bmi: toNumber(formData.bmi),
      smokingStatus: formData.smokingStatus,
      familyHistory,
    };

    setIsAnalyzing(true);

    mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          finishAnalysis(startedAt, () => {
            startTransition(() => {
              setResult(normalizePredictionResult(data));
              setIsAnalyzing(false);
            });

            window.setTimeout(() => {
              gsap.from(".doctor-result-item", {
                y: 18,
                opacity: 0,
                stagger: 0.08,
                duration: 0.42,
                ease: "power2.out",
              });
            }, 40);
          });
        },
        onError: () => {
          finishAnalysis(startedAt, () => {
            setIsAnalyzing(false);
            toast({
              title: "Analysis failed",
              description: "The clinical engine could not return a result. Please retry once the API is available.",
              variant: "destructive",
            });
          });
        },
      },
    );
  };

  const safeResult = result ? normalizePredictionResult(result) : null;
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
  const datasetAlignedCount = symptoms.filter((symptom) =>
    PREDICTION_SYMPTOM_OPTIONS.some((option) => option.label === symptom && option.datasetAligned),
  ).length;
  const topConditionSignals = safeResult?.conditions.slice(0, 5) ?? [];
  const consultationNote = getConsultationNote(safeResult);

  return (
    <div ref={container} className="space-y-6">
      <div className="doctor-animate-in">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
          <Brain className="text-primary" size={32} />
          AI Diagnostic Assistant
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Enter patient vitals and symptom clusters to run a data-backed risk assessment,
          triage summary, and explainable differential analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="premium-card p-6 doctor-animate-in">
            <h3 className="mb-4 border-b border-border pb-2 text-lg font-bold text-foreground">
              1. Patient Vitals
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Age
                </label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.age}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      age: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Gender
                </label>
                <select
                  className="premium-input"
                  value={formData.gender}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      gender: event.target.value,
                    }))
                  }
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Blood Pressure (mmHg)
                </label>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <input
                    type="number"
                    min={80}
                    max={240}
                    placeholder="120"
                    className="premium-input"
                    value={formData.systolicPressure}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        systolicPressure: event.target.value,
                      }))
                    }
                  />
                  <span className="text-sm font-semibold text-muted-foreground">/</span>
                  <input
                    type="number"
                    min={40}
                    max={140}
                    placeholder="80"
                    className="premium-input"
                    value={formData.diastolicPressure}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        diastolicPressure: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>Systolic</span>
                  <span>Diastolic</span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Enter the seated reading as systolic over diastolic, such as 120 / 80.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  BMI
                </label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.bmi}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      bmi: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.bloodSugar}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      bloodSugar: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Cholesterol (mg/dL)
                </label>
                <input
                  type="number"
                  className="premium-input"
                  value={formData.cholesterol}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      cholesterol: Number(event.target.value),
                    }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-muted-foreground">
                  Smoking Status
                </label>
                <select
                  className="premium-input"
                  value={formData.smokingStatus}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      smokingStatus: event.target.value,
                    }))
                  }
                >
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 doctor-animate-in">
            <div className="mb-4 flex flex-col gap-2 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-foreground">2. Reported Symptoms</h3>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {symptoms.length} Selected
              </span>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Grouped options below mirror the trained symptom dataset so the model can use more specific clinical patterns.
            </p>

            <div className="mb-5 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">Quick Case Bundles</p>
                    <p className="text-xs text-muted-foreground">
                      Add a common symptom cluster in one action, then adjust manually.
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {datasetAlignedCount}/{symptoms.length || 0} selected symptoms align directly
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PREDICTION_SYMPTOM_QUICK_SETS.map((group) => (
                    <button
                      key={group.label}
                      type="button"
                      onClick={() =>
                        setSymptoms((current) => Array.from(new Set([...current, ...group.symptoms])))
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
                    placeholder="Search symptoms like nausea, fever..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </label>
              </div>
            </div>

            {symptoms.length > 0 ? (
              <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">Selected Symptoms</p>
                  <span className="text-xs text-muted-foreground">{symptoms.length} active</span>
                </div>
                <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
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
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                        symptoms.includes(symptom.label)
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                          : "border-border bg-white text-foreground hover:border-primary/50"
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
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                            symptoms.includes(symptom.label)
                              ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                              : "border-border bg-white text-foreground hover:border-primary/50"
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

          <div className="premium-card p-6 doctor-animate-in">
            <h3 className="mb-4 text-lg font-bold text-foreground">3. Background Risk</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add relevant family history to improve the triage signal.
            </p>

            <div className="flex flex-wrap gap-2">
              {FAMILY_HISTORY_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleHistory(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    familyHistory.includes(item)
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="doctor-animate-in rounded-2xl border border-primary/10 bg-background p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <p className="text-sm font-semibold text-foreground">Analyze Case</p>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {symptoms.length} selected
              </span>
            </div>
            <p className="mb-3 px-1 text-xs text-muted-foreground">
              {datasetAlignedCount > 0
                ? `${datasetAlignedCount} selected symptom${datasetAlignedCount === 1 ? "" : "s"} match the trained dataset directly.`
                : "Select dataset-aligned symptoms to improve disease-pattern matching."}
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="premium-button flex w-full items-center justify-center gap-2 text-lg disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isAnalyzing ? "Analyzing Clinical Data..." : "Analyze Case"}
              {!isAnalyzing ? <ChevronRight size={20} /> : null}
            </button>
          </div>
        </div>

        <div className="relative">
          {isAnalyzing ? (
            <AnalysisLoadingCard
              currentStep={analysisStep}
              title="Doctor-side AI analysis"
              description="The engine is combining trained risk models, symptom red flags, and clinician-style triage rules."
            />
          ) : !safeResult ? (
            <div className="premium-card doctor-animate-in flex min-h-[540px] flex-col items-center justify-center bg-gradient-to-b from-white to-blue-50/50 p-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                <Activity size={40} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">Awaiting Patient Data</h3>
              <p className="max-w-md text-muted-foreground">
                Enter vitals, select symptoms, and run the analysis to view a ranked
                differential diagnosis with triage guidance.
              </p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
              <div className="h-2 w-full bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500" />

              <div className="space-y-6 p-6">
                <div className="doctor-result-item flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                      Primary Diagnosis
                    </p>
                    <h2 className="text-3xl font-bold leading-tight text-foreground">
                      {safeResult.primaryDiagnosis}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                      {safeResult.summary}
                    </p>
                  </div>

                  <div className={`rounded-xl border px-3 py-2 text-sm font-bold ${riskBadge(safeResult.riskLevel)}`}>
                    {safeResult.urgency}
                  </div>
                </div>

                {consultationNote ? (
                  <div className="doctor-result-item rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    {consultationNote}
                  </div>
                ) : null}

                <div className="doctor-result-item grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Overall Risk</p>
                    <p className="mt-2 text-4xl font-bold text-foreground">{safeResult.riskScore}</p>
                    <p className="text-sm text-muted-foreground">Risk score out of 100</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Lead Probability</p>
                    <p className="mt-2 text-4xl font-bold text-foreground">{safeResult.probability}%</p>
                    <p className="text-sm text-muted-foreground">Estimated strength of the top signal</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase text-muted-foreground">Risk Tier</p>
                    <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${riskBadge(safeResult.riskLevel)}`}>
                      {safeResult.riskLevel === "high" || safeResult.riskLevel === "critical" ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                      {safeResult.riskLevel.toUpperCase()}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Model build: {safeResult.analysisVersion}
                    </p>
                  </div>
                </div>

                {topConditionSignals.length > 0 ? (
                  <div className="doctor-result-item rounded-2xl border border-border bg-slate-50/70 p-5">
                    <h3 className="mb-4 text-base font-bold text-foreground">Top Condition Signals</h3>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {topConditionSignals.map((condition) => (
                        <div key={condition.name} className="rounded-2xl bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-foreground">{condition.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Confidence {condition.probability}%
                              </p>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${riskBadge(condition.riskLevel as PredictionResult["riskLevel"])}`}>
                              {condition.riskLevel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {safeResult.redFlags.length > 0 ? (
                  <div className="doctor-result-item rounded-2xl border border-red-200 bg-red-50/80 p-5">
                    <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-red-800">
                      <AlertTriangle size={18} />
                      Immediate Red Flags
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

                <div className="doctor-result-item rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-blue-900">
                    <Stethoscope size={18} />
                    Recommended Actions
                  </h3>

                  <div className="space-y-3">
                    {safeResult.recommendations.map((recommendation) => (
                      <div
                        key={recommendation}
                        className="flex items-start gap-3 rounded-xl bg-white/80 p-3"
                      >
                        <ChevronRight size={16} className="mt-0.5 shrink-0 text-blue-600" />
                        <p className="text-sm text-blue-900">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
