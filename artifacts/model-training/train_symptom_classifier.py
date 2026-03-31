from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score


ROOT_DIR = Path(__file__).resolve().parent
RAW_DIR = ROOT_DIR / "data" / "raw"
OUTPUT_PATH = ROOT_DIR / "data" / "symptom-disease-model.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a symptom-only multiclass disease classifier from Kaggle-style CSVs."
    )
    parser.add_argument("--train", type=Path, default=RAW_DIR / "Training.csv")
    parser.add_argument("--test", type=Path, default=RAW_DIR / "Testing.csv")
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return parser.parse_args()


def prepare_frame(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    frame = pd.read_csv(path)
    unnamed_columns = [column for column in frame.columns if str(column).lower().startswith("unnamed:")]
    if unnamed_columns:
        frame = frame.drop(columns=unnamed_columns)

    if "prognosis" not in frame.columns:
        raise ValueError(f"'prognosis' column missing in {path}")

    return frame.fillna(0)


def main() -> None:
    args = parse_args()

    train_frame = prepare_frame(args.train)
    test_frame = prepare_frame(args.test)

    feature_columns = [column for column in train_frame.columns if column != "prognosis"]
    if not feature_columns:
        raise SystemExit("No symptom feature columns found in the training set.")

    x_train = train_frame[feature_columns].astype(float)
    y_train = train_frame["prognosis"].astype(str)

    x_test = test_frame.reindex(columns=feature_columns, fill_value=0).astype(float)
    y_test = test_frame["prognosis"].astype(str)

    model = LogisticRegression(
        max_iter=4000,
        class_weight="balanced",
    )
    model.fit(x_train, y_train)

    train_accuracy = float(accuracy_score(y_train, model.predict(x_train)))
    test_accuracy = float(accuracy_score(y_test, model.predict(x_test)))

    classifier: dict[str, Any] = {
        "classes": [str(label) for label in model.classes_],
        "features": feature_columns,
        "intercepts": [float(value) for value in model.intercept_.tolist()],
        "coefficients": [
            [float(weight) for weight in row]
            for row in model.coef_.tolist()
        ],
        "metrics": {
            "trainAccuracy": train_accuracy,
            "testAccuracy": test_accuracy,
            "trainSamples": int(len(x_train)),
            "testSamples": int(len(x_test)),
        },
        "sources": {
            "train": str(args.train),
            "test": str(args.test),
        },
    }

    output = {
        "analysisVersion": f"symptom-disease-ovr-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}",
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "symptomClassifier": classifier,
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(f"Saved symptom classifier to {args.output}")


if __name__ == "__main__":
    main()
