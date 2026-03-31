from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
import re
from typing import Callable

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


MODEL_NAMES = (
    "cardiac",
    "diabetesMetabolic",
    "diabetesSymptom",
    "stroke",
)

ROOT_DIR = Path(__file__).resolve().parent
RAW_DIR = ROOT_DIR / "data" / "raw"
OUTPUT_PATH = ROOT_DIR / "data" / "model-bundle.json"


def normalize_column_name(value: str) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", value.strip().lower())).strip("_")


def normalize_frame(frame: pd.DataFrame) -> pd.DataFrame:
    normalized = frame.copy()
    normalized.columns = [normalize_column_name(str(column)) for column in frame.columns]
    return normalized


def find_column(frame: pd.DataFrame, candidates: list[str]) -> str | None:
    for candidate in candidates:
      normalized = normalize_column_name(candidate)
      if normalized in frame.columns:
          return normalized
    return None


def numeric_series(frame: pd.DataFrame, candidates: list[str]) -> pd.Series | None:
    column = find_column(frame, candidates)
    if not column:
        return None
    return pd.to_numeric(frame[column], errors="coerce").astype(float)


def parse_yes_no_series(frame: pd.DataFrame, candidates: list[str]) -> pd.Series | None:
    column = find_column(frame, candidates)
    if not column:
        return None

    series = frame[column]
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce").astype(float).gt(0).astype(float)

    normalized = series.astype(str).str.strip().str.lower()
    positive_tokens = {
        "1",
        "true",
        "yes",
        "y",
        "positive",
        "present",
        "male",
        "current",
    }
    negative_tokens = {
        "0",
        "false",
        "no",
        "n",
        "negative",
        "absent",
        "female",
        "never",
    }

    result = pd.Series(np.nan, index=frame.index, dtype=float)
    result.loc[normalized.isin(positive_tokens)] = 1.0
    result.loc[normalized.isin(negative_tokens)] = 0.0
    return result


def gender_series(frame: pd.DataFrame, candidates: list[str]) -> pd.Series | None:
    column = find_column(frame, candidates)
    if not column:
        return None

    series = frame[column]
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce").astype(float)

    normalized = series.astype(str).str.strip().str.lower()
    result = pd.Series(np.nan, index=frame.index, dtype=float)
    result.loc[normalized.eq("male")] = 1.0
    result.loc[normalized.eq("female")] = 0.0
    result.loc[~normalized.isin({"male", "female"})] = 0.0
    return result


def smoking_series(frame: pd.DataFrame, candidates: list[str], target: str) -> pd.Series | None:
    column = find_column(frame, candidates)
    if not column:
        return None

    normalized = frame[column].astype(str).str.strip().str.lower()

    if target == "current":
        positives = {"current", "currently smokes", "smokes", "yes"}
    else:
        positives = {"former", "ever", "formerly smoked", "used to smoke"}

    result = pd.Series(0.0, index=frame.index, dtype=float)
    result.loc[normalized.isin(positives)] = 1.0
    return result


def target_series(frame: pd.DataFrame, candidates: list[str]) -> pd.Series:
    column = find_column(frame, candidates)
    if not column:
        raise ValueError(f"Target column not found. Tried: {', '.join(candidates)}")

    series = frame[column]

    if pd.api.types.is_numeric_dtype(series):
        return pd.to_numeric(series, errors="coerce").astype(float).gt(0).astype(int)

    normalized = series.astype(str).str.strip().str.lower()
    positives = {
        "1",
        "true",
        "yes",
        "positive",
        "stroke",
        "diabetes",
        "present",
        "heart disease",
    }
    return normalized.isin(positives).astype(int)


def build_feature_frame(
    frame: pd.DataFrame,
    feature_extractors: dict[str, Callable[[pd.DataFrame], pd.Series | None]],
) -> pd.DataFrame:
    columns: dict[str, pd.Series] = {}

    for feature_name, extractor in feature_extractors.items():
        series = extractor(frame)
        if series is None:
            continue
        columns[feature_name] = series.astype(float)

    return pd.DataFrame(columns)


def fit_logistic_bundle_entry(
    name: str,
    features: pd.DataFrame,
    target: pd.Series,
) -> dict[str, object]:
    usable_mask = target.notna()
    for column in features.columns:
        usable_mask &= features[column].notna()

    x = features.loc[usable_mask].copy()
    y = target.loc[usable_mask].astype(int).copy()

    if x.empty or len(x.columns) < 2:
        raise ValueError(f"{name}: not enough aligned features after cleaning.")

    if y.nunique() < 2:
        raise ValueError(f"{name}: target has only one class after cleaning.")

    pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler()),
            ("model", LogisticRegression(max_iter=4000, class_weight="balanced")),
        ]
    )

    cv_auc = None
    if len(x) >= 30:
        splits = min(5, int(y.value_counts().min()))
        if splits >= 2:
            cv = StratifiedKFold(n_splits=splits, shuffle=True, random_state=42)
            cv_auc = float(cross_val_score(pipeline, x, y, cv=cv, scoring="roc_auc").mean())

    pipeline.fit(x, y)

    scaler: StandardScaler = pipeline.named_steps["scaler"]
    model: LogisticRegression = pipeline.named_steps["model"]

    coefficients = {
        column: float(model.coef_[0][index])
        for index, column in enumerate(x.columns)
    }
    means = {
        column: float(scaler.mean_[index])
        for index, column in enumerate(x.columns)
    }
    scales = {
        column: float(scaler.scale_[index] if scaler.scale_[index] != 0 else 1.0)
        for index, column in enumerate(x.columns)
    }

    return {
        "intercept": float(model.intercept_[0]),
        "coefficients": coefficients,
        "means": means,
        "scales": scales,
        "metadata": {
            "modelName": name,
            "samples": int(len(x)),
            "positiveRate": float(y.mean()),
            "features": list(x.columns),
            "crossValidatedRocAuc": cv_auc,
        },
    }


def train_cardiac(frame: pd.DataFrame) -> dict[str, object]:
    features = build_feature_frame(
        frame,
        {
            "age": lambda df: numeric_series(df, ["age"]),
            "sex": lambda df: gender_series(df, ["sex", "gender"]),
            "trestbps": lambda df: numeric_series(
                df, ["trestbps", "restingbp", "resting_blood_pressure", "ap_hi"]
            ),
            "chol": lambda df: numeric_series(df, ["chol", "cholesterol"]),
            "fbs": lambda df: (
                parse_yes_no_series(df, ["fbs", "fastingbs", "fasting_blood_sugar"])
                if find_column(df, ["fbs", "fastingbs", "fasting_blood_sugar"])
                else numeric_series(df, ["glucose", "blood_glucose_level"]).ge(120).astype(float)
                if find_column(df, ["glucose", "blood_glucose_level"])
                else None
            ),
        },
    )
    target = target_series(frame, ["target", "num", "condition", "cardio", "heart_disease"])
    return fit_logistic_bundle_entry("cardiac", features, target)


def train_diabetes_metabolic(frame: pd.DataFrame) -> dict[str, object]:
    bp_series = numeric_series(frame, ["bloodpressure", "blood_pressure", "diastolic_pressure"])
    hypertension = parse_yes_no_series(frame, ["hypertension", "highbp", "high_bp"])
    if hypertension is None and bp_series is not None:
        hypertension = bp_series.ge(90).astype(float)

    features = build_feature_frame(
        frame,
        {
            "age": lambda df: numeric_series(df, ["age"]),
            "bmi": lambda df: numeric_series(df, ["bmi"]),
            "glucose": lambda df: numeric_series(df, ["glucose", "blood_glucose_level", "avg_glucose_level"]),
            "bloodPressure": lambda df: bp_series,
            "hypertension": lambda df: hypertension,
        },
    )
    target = target_series(frame, ["outcome", "diabetes", "class", "label"])
    return fit_logistic_bundle_entry("diabetesMetabolic", features, target)


def train_diabetes_symptom(frame: pd.DataFrame) -> dict[str, object]:
    features = build_feature_frame(
        frame,
        {
            "age": lambda df: numeric_series(df, ["age"]),
            "gender": lambda df: gender_series(df, ["gender", "sex"]),
            "polyuria": lambda df: parse_yes_no_series(df, ["polyuria"]),
            "polydipsia": lambda df: parse_yes_no_series(df, ["polydipsia"]),
            "sudden_weight_loss": lambda df: parse_yes_no_series(df, ["sudden_weight_loss"]),
            "weakness": lambda df: parse_yes_no_series(df, ["weakness"]),
            "visual_blurring": lambda df: parse_yes_no_series(df, ["visual_blurring", "vision_blurring"]),
            "partial_paresis": lambda df: parse_yes_no_series(df, ["partial_paresis"]),
            "obesity": lambda df: parse_yes_no_series(df, ["obesity"]),
        },
    )
    target = target_series(frame, ["class", "diabetes", "outcome", "label"])
    return fit_logistic_bundle_entry("diabetesSymptom", features, target)


def train_stroke(frame: pd.DataFrame) -> dict[str, object]:
    hypertension = parse_yes_no_series(frame, ["hypertension", "highbp", "high_bp"])
    if hypertension is None:
        systolic = numeric_series(frame, ["ap_hi", "systolic", "systolic_pressure"])
        diastolic = numeric_series(frame, ["ap_lo", "diastolic", "diastolic_pressure"])
        if systolic is not None and diastolic is not None:
            hypertension = ((systolic >= 140) | (diastolic >= 90)).astype(float)

    features = build_feature_frame(
        frame,
        {
            "age": lambda df: numeric_series(df, ["age"]),
            "bmi": lambda df: numeric_series(df, ["bmi"]),
            "glucose": lambda df: numeric_series(df, ["avg_glucose_level", "blood_glucose_level", "glucose"]),
            "hypertension": lambda df: hypertension,
            "smoking_current": lambda df: smoking_series(df, ["smoking_status", "smoking_history", "smoking"], "current"),
            "smoking_former": lambda df: smoking_series(df, ["smoking_status", "smoking_history", "smoking"], "former"),
            "gender": lambda df: gender_series(df, ["gender", "sex"]),
        },
    )
    target = target_series(frame, ["stroke", "label", "outcome"])
    return fit_logistic_bundle_entry("stroke", features, target)


def load_dataset(path: Path | None) -> pd.DataFrame | None:
    if path is None or not path.exists():
        return None
    return normalize_frame(pd.read_csv(path))


def default_dataset_paths(raw_dir: Path) -> dict[str, Path]:
    return {
        "cardiac": raw_dir / "cardiac.csv",
        "diabetesMetabolic": raw_dir / "diabetes_metabolic.csv",
        "diabetesSymptom": raw_dir / "diabetes_symptom.csv",
        "stroke": raw_dir / "stroke.csv",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Kaggle-backed logistic models for the healthcare dashboard.")
    parser.add_argument("--raw-dir", type=Path, default=RAW_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--cardiac", type=Path)
    parser.add_argument("--diabetes-metabolic", dest="diabetes_metabolic", type=Path)
    parser.add_argument("--diabetes-symptom", dest="diabetes_symptom", type=Path)
    parser.add_argument("--stroke", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    defaults = default_dataset_paths(args.raw_dir)

    sources = {
        "cardiac": args.cardiac or defaults["cardiac"],
        "diabetesMetabolic": args.diabetes_metabolic or defaults["diabetesMetabolic"],
        "diabetesSymptom": args.diabetes_symptom or defaults["diabetesSymptom"],
        "stroke": args.stroke or defaults["stroke"],
    }

    trainers: dict[str, Callable[[pd.DataFrame], dict[str, object]]] = {
        "cardiac": train_cardiac,
        "diabetesMetabolic": train_diabetes_metabolic,
        "diabetesSymptom": train_diabetes_symptom,
        "stroke": train_stroke,
    }

    trained_models: dict[str, dict[str, object]] = {}
    dataset_report: dict[str, object] = {}

    for model_name in MODEL_NAMES:
        source_path = sources[model_name]
        frame = load_dataset(source_path)

        if frame is None:
            dataset_report[model_name] = {
                "status": "skipped",
                "reason": f"dataset not found at {source_path}",
            }
            continue

        try:
            trained_models[model_name] = trainers[model_name](frame)
            dataset_report[model_name] = {
                "status": "trained",
                "rows": int(len(frame)),
                "source": str(source_path),
            }
        except Exception as exc:  # noqa: BLE001
            dataset_report[model_name] = {
                "status": "failed",
                "reason": str(exc),
                "source": str(source_path),
            }

    if not trained_models:
        raise SystemExit("No models were trained. Add at least one supported CSV and try again.")

    bundle = {
        "analysisVersion": f"dataset-trained-bundle-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "datasets": dataset_report,
        "models": trained_models,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(bundle, indent=2), encoding="utf-8")
    print(f"Saved model bundle to {args.output}")


if __name__ == "__main__":
    main()
