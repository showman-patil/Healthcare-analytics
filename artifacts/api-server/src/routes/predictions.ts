import { Router, type IRouter } from "express";
import { PredictDiseaseBody, PredictDiseaseResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/predictions", async (req, res) => {
  const body = PredictDiseaseBody.parse(req.body);

  const { symptoms, age, bmi, bloodSugar, cholesterol, smokingStatus, familyHistory } = body;

  let riskScore = 0;

  if (age && age > 50) riskScore += 20;
  else if (age && age > 35) riskScore += 10;

  if (bmi && bmi > 30) riskScore += 15;
  else if (bmi && bmi > 25) riskScore += 8;

  if (bloodSugar && bloodSugar > 140) riskScore += 20;
  else if (bloodSugar && bloodSugar > 100) riskScore += 10;

  if (cholesterol && cholesterol > 240) riskScore += 15;
  else if (cholesterol && cholesterol > 200) riskScore += 8;

  if (smokingStatus === "current") riskScore += 20;
  else if (smokingStatus === "former") riskScore += 10;

  if (familyHistory && familyHistory.length > 0) riskScore += familyHistory.length * 5;

  const symptomRiskMap: Record<string, number> = {
    "chest pain": 25,
    "shortness of breath": 20,
    "palpitations": 15,
    "fatigue": 10,
    "dizziness": 12,
    "high blood pressure": 18,
    "frequent urination": 15,
    "blurred vision": 12,
    "headache": 8,
    "fever": 10,
    "cough": 8,
    "weight loss": 15,
    "numbness": 12,
  };

  for (const symptom of symptoms) {
    const key = symptom.toLowerCase();
    riskScore += symptomRiskMap[key] ?? 5;
  }

  riskScore = Math.min(riskScore, 100);

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  let primaryDiagnosis = "General Wellness";
  let probability = 0.2;

  if (riskScore >= 75) {
    riskLevel = "critical";
    probability = 0.85 + Math.random() * 0.14;
    primaryDiagnosis = symptoms.includes("chest pain") ? "Coronary Artery Disease" :
      bloodSugar && bloodSugar > 140 ? "Type 2 Diabetes" : "Hypertensive Crisis";
  } else if (riskScore >= 50) {
    riskLevel = "high";
    probability = 0.65 + Math.random() * 0.2;
    primaryDiagnosis = symptoms.includes("frequent urination") ? "Pre-diabetes / Diabetes" :
      symptoms.includes("chest pain") ? "Angina / Cardiac Risk" : "Metabolic Syndrome";
  } else if (riskScore >= 25) {
    riskLevel = "medium";
    probability = 0.35 + Math.random() * 0.3;
    primaryDiagnosis = "Hypertension Risk";
  } else {
    riskLevel = "low";
    probability = 0.1 + Math.random() * 0.25;
    primaryDiagnosis = "Low Risk Profile";
  }

  const conditions = [
    { name: "Hypertension", probability: Math.min(0.9, (riskScore / 100) * 0.9 + Math.random() * 0.1), riskLevel: riskLevel },
    { name: "Type 2 Diabetes", probability: bloodSugar && bloodSugar > 120 ? 0.7 : 0.3 + Math.random() * 0.2, riskLevel: bloodSugar && bloodSugar > 140 ? "high" : "medium" },
    { name: "Cardiovascular Disease", probability: symptoms.includes("chest pain") ? 0.8 : 0.2 + Math.random() * 0.3, riskLevel: symptoms.includes("chest pain") ? "critical" : "low" },
    { name: "Obesity", probability: bmi && bmi > 30 ? 0.85 : 0.2, riskLevel: bmi && bmi > 30 ? "high" : "low" },
    { name: "Respiratory Issues", probability: symptoms.includes("cough") || symptoms.includes("shortness of breath") ? 0.6 : 0.15, riskLevel: symptoms.includes("shortness of breath") ? "high" : "low" },
  ];

  const recommendations = [];
  if (riskLevel === "critical" || riskLevel === "high") {
    recommendations.push("Immediate medical consultation recommended");
    recommendations.push("Schedule cardiologist appointment within 48 hours");
  }
  if (bloodSugar && bloodSugar > 100) {
    recommendations.push("Monitor blood sugar levels daily");
    recommendations.push("Consult endocrinologist for diabetes management");
  }
  if (bmi && bmi > 25) {
    recommendations.push("Adopt a calorie-controlled diet plan");
    recommendations.push("Aim for 150 minutes of moderate exercise per week");
  }
  if (smokingStatus === "current") {
    recommendations.push("Smoking cessation program strongly recommended");
  }
  recommendations.push("Regular health check-ups every 3-6 months");
  recommendations.push("Monitor blood pressure daily");

  const result = PredictDiseaseResponse.parse({
    primaryDiagnosis,
    probability: Math.round(probability * 100) / 100,
    riskLevel,
    riskScore,
    conditions,
    recommendations,
    urgency: riskLevel === "critical" ? "immediate" : riskLevel === "high" ? "urgent" : "routine",
  });

  res.json(result);
});

export default router;
