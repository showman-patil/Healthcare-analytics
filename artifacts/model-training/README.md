# Model Training Setup

This folder lets you train a model bundle from Kaggle CSVs and plug it into the current API without changing the frontend.

## What the app already expects

The prediction flow in this repo already uses:

- `age`
- `gender`
- `bloodPressure`
- `bloodSugar`
- `bmi`
- `cholesterol`
- `smokingStatus`
- optional `symptoms`

The training script below exports logistic-model coefficients into:

- [model-bundle.json](/d:/Health-Insight-Hub/Health-Insight-Hub/artifacts/model-training/data/model-bundle.json)

If that file exists, the API loads it automatically. If it does not exist, the API falls back to the current built-in demo models.

## Recommended Kaggle datasets

Rename the downloaded CSVs to these filenames and place them in:

- [raw](/d:/Health-Insight-Hub/Health-Insight-Hub/artifacts/model-training/data/raw)

Use:

1. `cardiac.csv`
   Source: Cleveland / heart disease dataset from Kaggle
2. `diabetes_metabolic.csv`
   Source: Pima diabetes or diabetes prediction dataset
3. `diabetes_symptom.csv`
   Source: Early-stage diabetes risk / symptom dataset
4. `stroke.csv`
   Source: Stroke prediction dataset

## Train

On Windows PowerShell:

```powershell
cd d:\Health-Insight-Hub\Health-Insight-Hub
python -m venv artifacts\model-training\.venv
artifacts\model-training\.venv\Scripts\Activate.ps1
pip install -r artifacts\model-training\requirements.txt
python artifacts\model-training\train_models.py
```

Optional explicit file paths:

```powershell
python artifacts\model-training\train_models.py `
  --cardiac "D:\data\heart.csv" `
  --diabetes-metabolic "D:\data\diabetes.csv" `
  --diabetes-symptom "D:\data\diabetes_data_upload.csv" `
  --stroke "D:\data\stroke-data.csv"
```

## Output

The script writes:

- [model-bundle.json](/d:/Health-Insight-Hub/Health-Insight-Hub/artifacts/model-training/data/model-bundle.json)

Then restart the API server and the prediction route will use the trained coefficients automatically.

## Model mapping

The training script exports canonical feature names that match the app:

- `cardiac`: `age`, `sex`, `trestbps`, `chol`, `fbs`
- `diabetesMetabolic`: `age`, `bmi`, `glucose`, `bloodPressure`, `hypertension`
- `diabetesSymptom`: `age`, `gender`, `polyuria`, `polydipsia`, `sudden_weight_loss`, `weakness`, `visual_blurring`, `partial_paresis`, `obesity`
- `stroke`: `age`, `bmi`, `glucose`, `hypertension`, `smoking_current`, `smoking_former`, `gender`

## Notes

- You do not need every dataset to start. Missing models fall back to the current built-in defaults.
- Kaggle data is fine for prototyping and demos, but not enough for production clinical diagnosis by itself.
- The safest product framing is still decision support / triage assistance, not autonomous diagnosis.
