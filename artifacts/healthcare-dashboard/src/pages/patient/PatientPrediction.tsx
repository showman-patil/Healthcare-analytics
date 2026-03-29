import React, { useRef, useState } from "react";
import { Brain, AlertTriangle, CheckCircle, Activity, ChevronRight } from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { usePredictDisease } from "@workspace/api-client-react";

const SYMPTOMS = [
  "Chest Pain", "Shortness of Breath", "Palpitations", "Fatigue", "Dizziness",
  "High Blood Pressure", "Frequent Urination", "Blurred Vision", "Headache",
  "Fever", "Cough", "Weight Loss", "Numbness", "Excessive Thirst", "Nausea"
];

export default function PatientPrediction() {
  const container = useRef<HTMLDivElement>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [age, setAge] = useState("45");
  const [gender, setGender] = useState("Male");
  const [bmi, setBmi] = useState("26");
  const [bloodSugar, setBloodSugar] = useState("110");
  const [cholesterol, setCholesterol] = useState("210");
  const [smoking, setSmoking] = useState("never");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: predict } = usePredictDisease();

  useGSAP(() => {
    gsap.from(".gsap-in", { y: 25, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power3.out" });
  }, { scope: container });

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = () => {
    setIsLoading(true);
    predict({
      symptoms: selectedSymptoms,
      age: parseInt(age),
      gender,
      bmi: parseFloat(bmi),
      bloodSugar: parseFloat(bloodSugar),
      cholesterol: parseFloat(cholesterol),
      smokingStatus: smoking,
      familyHistory: [],
    }, {
      onSuccess: (data) => {
        setResult(data);
        setIsLoading(false);
        setTimeout(() => {
          gsap.from(".result-animate", { y: 20, opacity: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" });
        }, 50);
      },
      onError: () => setIsLoading(false),
    });
  };

  const riskColor = (level: string) => ({
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    critical: "text-red-600",
  }[level] ?? "text-gray-600");

  const riskBg = (level: string) => ({
    low: "bg-green-50 border-green-200",
    medium: "bg-yellow-50 border-yellow-200",
    high: "bg-orange-50 border-orange-200",
    critical: "bg-red-50 border-red-200",
  }[level] ?? "bg-gray-50");

  const RISK_COLORS: Record<string, string> = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#f97316",
    critical: "#ef4444",
  };

  return (
    <div ref={container} className="space-y-6">
      <div className="gsap-in">
        <h1 className="text-3xl font-display font-bold text-foreground">Symptom Checker</h1>
        <p className="text-muted-foreground mt-1">Enter your symptoms to get an AI-powered health assessment</p>
      </div>

      <div className={`grid grid-cols-1 ${result ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Input Form */}
        <div className="space-y-5">
          {/* Symptoms */}
          <div className="premium-card p-6 gsap-in">
            <h2 className="text-lg font-bold text-foreground mb-1">Select Symptoms</h2>
            <p className="text-sm text-muted-foreground mb-4">Check all that apply</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSymptom(s)}
                  className={`text-sm px-3.5 py-2 rounded-xl border font-medium transition-all duration-150 ${
                    selectedSymptoms.includes(s)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Vitals */}
          <div className="premium-card p-6 gsap-in">
            <h2 className="text-lg font-bold text-foreground mb-4">Health Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Age", value: age, onChange: setAge, type: "number" },
                { label: "BMI", value: bmi, onChange: setBmi, type: "number" },
                { label: "Blood Sugar (mg/dL)", value: bloodSugar, onChange: setBloodSugar, type: "number" },
                { label: "Cholesterol (mg/dL)", value: cholesterol, onChange: setCholesterol, type: "number" },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Smoking Status</label>
                <select
                  value={smoking}
                  onChange={e => setSmoking(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={selectedSymptoms.length === 0 || isLoading}
            className="w-full premium-button py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed gsap-in"
          >
            <Brain size={18} />
            {isLoading ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-5">
            {/* Risk Score Gauge */}
            <div className={`premium-card p-6 border-2 ${riskBg(result.riskLevel)} result-animate`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Brain size={20} className={riskColor(result.riskLevel)} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">AI Assessment Result</h2>
                  <p className="text-sm text-muted-foreground">{result.primaryDiagnosis}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="h-36 w-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                      data={[{ value: result.riskScore, fill: RISK_COLORS[result.riskLevel] }]}
                    >
                      <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#f1f5f9" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className={`text-4xl font-display font-bold ${riskColor(result.riskLevel)}`}>{result.riskScore}</p>
                  <p className="text-sm text-muted-foreground">Risk Score / 100</p>
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${riskBg(result.riskLevel)} ${riskColor(result.riskLevel)}`}>
                    {result.riskLevel === "critical" || result.riskLevel === "high" ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    {result.riskLevel.toUpperCase()} RISK
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {Math.round(result.probability * 100)}% prediction confidence
                  </p>
                </div>
              </div>
            </div>

            {/* Condition Predictions */}
            <div className="premium-card p-6 result-animate">
              <h3 className="text-base font-bold text-foreground mb-4">Condition Analysis</h3>
              <div className="space-y-3">
                {result.conditions.map((cond: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-foreground">{cond.name}</span>
                      <span className={`font-bold ${riskColor(cond.riskLevel)}`}>{Math.round(cond.probability * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cond.probability * 100}%`, backgroundColor: RISK_COLORS[cond.riskLevel] ?? "#3b82f6" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="premium-card p-6 result-animate">
              <h3 className="text-base font-bold text-foreground mb-4">Recommendations</h3>
              <div className="space-y-2">
                {result.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <ChevronRight size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-800">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
