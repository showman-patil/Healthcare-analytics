export type PredictionSymptomCategory =
  | "featured"
  | "respiratory"
  | "cardiac"
  | "metabolic"
  | "neurologic"
  | "digestive"
  | "dermatology"
  | "urinary"
  | "other";

export type PredictionSymptomOption = {
  label: string;
  featureKey: string;
  category: PredictionSymptomCategory;
  datasetAligned: boolean;
};

const FEATURED_SYMPTOMS = new Set([
  "chest_pain",
  "palpitations",
  "breathlessness",
  "cough",
  "high_fever",
  "headache",
  "dizziness",
  "nausea",
  "vomiting",
  "fatigue",
  "polyuria",
  "blurred_and_distorted_vision",
  "loss_of_balance",
  "skin_rash",
  "dehydration",
]);

function toLabel(featureKey: string): string {
  return featureKey
    .replace(/\.1$/, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function detectCategory(featureKey: string): PredictionSymptomCategory {
  const key = featureKey.toLowerCase();

  if (FEATURED_SYMPTOMS.has(key)) return "featured";
  if (/(cough|fever|breath|phlegm|sputum|throat|nose|sinus|congestion|smell)/.test(key)) return "respiratory";
  if (/(chest|heart|palpit|blood_pressure|pressure|veins|walking|calf)/.test(key)) return "cardiac";
  if (/(polyuria|sugar|hunger|weight|thyroid|obesity|appetite)/.test(key)) return "metabolic";
  if (/(headache|dizziness|balance|speech|sensorium|coma|concentration|vision|neck|weakness|paresis|numb)/.test(key)) return "neurologic";
  if (/(stomach|abdominal|belly|bowel|stool|anus|constipation|diarrhoea|vomiting|nausea|indigestion|acidity|gas)/.test(key)) return "digestive";
  if (/(itch|rash|skin|blister|pimples|blackheads|nails|red_sore|crust|dischromic)/.test(key)) return "dermatology";
  if (/(urine|bladder|micturition)/.test(key)) return "urinary";
  return "other";
}

const DATASET_FEATURE_KEYS = [
  "itching",
  "skin_rash",
  "nodal_skin_eruptions",
  "continuous_sneezing",
  "shivering",
  "chills",
  "joint_pain",
  "stomach_pain",
  "acidity",
  "ulcers_on_tongue",
  "muscle_wasting",
  "vomiting",
  "burning_micturition",
  "spotting_ urination",
  "fatigue",
  "weight_gain",
  "anxiety",
  "cold_hands_and_feets",
  "mood_swings",
  "weight_loss",
  "restlessness",
  "lethargy",
  "patches_in_throat",
  "irregular_sugar_level",
  "cough",
  "high_fever",
  "sunken_eyes",
  "breathlessness",
  "sweating",
  "dehydration",
  "indigestion",
  "headache",
  "yellowish_skin",
  "dark_urine",
  "nausea",
  "loss_of_appetite",
  "pain_behind_the_eyes",
  "back_pain",
  "constipation",
  "abdominal_pain",
  "diarrhoea",
  "mild_fever",
  "yellow_urine",
  "yellowing_of_eyes",
  "acute_liver_failure",
  "fluid_overload",
  "swelling_of_stomach",
  "swelled_lymph_nodes",
  "malaise",
  "blurred_and_distorted_vision",
  "phlegm",
  "throat_irritation",
  "redness_of_eyes",
  "sinus_pressure",
  "runny_nose",
  "congestion",
  "chest_pain",
  "weakness_in_limbs",
  "fast_heart_rate",
  "pain_during_bowel_movements",
  "pain_in_anal_region",
  "bloody_stool",
  "irritation_in_anus",
  "neck_pain",
  "dizziness",
  "cramps",
  "bruising",
  "obesity",
  "swollen_legs",
  "swollen_blood_vessels",
  "puffy_face_and_eyes",
  "enlarged_thyroid",
  "brittle_nails",
  "swollen_extremeties",
  "excessive_hunger",
  "extra_marital_contacts",
  "drying_and_tingling_lips",
  "slurred_speech",
  "knee_pain",
  "hip_joint_pain",
  "muscle_weakness",
  "stiff_neck",
  "swelling_joints",
  "movement_stiffness",
  "spinning_movements",
  "loss_of_balance",
  "unsteadiness",
  "weakness_of_one_body_side",
  "loss_of_smell",
  "bladder_discomfort",
  "foul_smell_of urine",
  "continuous_feel_of_urine",
  "passage_of_gases",
  "internal_itching",
  "toxic_look_(typhos)",
  "depression",
  "irritability",
  "muscle_pain",
  "altered_sensorium",
  "red_spots_over_body",
  "belly_pain",
  "abnormal_menstruation",
  "dischromic _patches",
  "watering_from_eyes",
  "increased_appetite",
  "polyuria",
  "family_history",
  "mucoid_sputum",
  "rusty_sputum",
  "lack_of_concentration",
  "visual_disturbances",
  "receiving_blood_transfusion",
  "receiving_unsterile_injections",
  "coma",
  "stomach_bleeding",
  "distention_of_abdomen",
  "history_of_alcohol_consumption",
  "fluid_overload.1",
  "blood_in_sputum",
  "prominent_veins_on_calf",
  "palpitations",
  "painful_walking",
  "pus_filled_pimples",
  "blackheads",
  "scurring",
  "skin_peeling",
  "silver_like_dusting",
  "small_dents_in_nails",
  "inflammatory_nails",
  "blister",
  "red_sore_around_nose",
  "yellow_crust_ooze",
] as const;

export const PREDICTION_SYMPTOM_OPTIONS: PredictionSymptomOption[] = DATASET_FEATURE_KEYS.map((featureKey) => ({
  label: toLabel(featureKey),
  featureKey,
  category: detectCategory(featureKey),
  datasetAligned: true,
}));

export const FEATURED_PREDICTION_SYMPTOMS = PREDICTION_SYMPTOM_OPTIONS.filter(
  (option) => option.category === "featured",
);

export const PREDICTION_SYMPTOM_CATEGORIES: Record<
  PredictionSymptomCategory,
  { label: string; description: string }
> = {
  featured: {
    label: "Suggested Matches",
    description: "High-signal symptoms commonly used during quick triage.",
  },
  respiratory: {
    label: "Respiratory",
    description: "Breathing, cough, throat, sputum, and infection-related symptoms.",
  },
  cardiac: {
    label: "Cardiac and Vascular",
    description: "Chest, heart rhythm, circulation, and limb-perfusion related findings.",
  },
  metabolic: {
    label: "Metabolic and Endocrine",
    description: "Weight, sugar, thyroid, appetite, and endocrine-linked signals.",
  },
  neurologic: {
    label: "Neurologic",
    description: "Head, balance, sensorium, weakness, and speech-related findings.",
  },
  digestive: {
    label: "Digestive",
    description: "Gastric, abdominal, bowel, and appetite related complaints.",
  },
  dermatology: {
    label: "Skin and Surface",
    description: "Rashes, itching, lesions, nails, and visible skin findings.",
  },
  urinary: {
    label: "Urinary",
    description: "Urination, bladder discomfort, and urine-change related symptoms.",
  },
  other: {
    label: "Other Dataset Symptoms",
    description: "Remaining dataset symptoms that do not fit the primary groups.",
  },
};

export const PREDICTION_SYMPTOM_QUICK_SETS = [
  {
    label: "Diabetes Cluster",
    symptoms: ["Polyuria", "Weight Loss", "Blurred And Distorted Vision", "Excessive Hunger"],
  },
  {
    label: "Cardiac Alert",
    symptoms: ["Chest Pain", "Breathlessness", "Palpitations", "Sweating"],
  },
  {
    label: "Respiratory Infection",
    symptoms: ["High Fever", "Cough", "Congestion", "Runny Nose"],
  },
  {
    label: "Neurologic Warning",
    symptoms: ["Headache", "Dizziness", "Loss Of Balance", "Slurred Speech"],
  },
];
