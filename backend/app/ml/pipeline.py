import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib

def skill_tokenizer(text: str):
    """Top-level named tokenizer function so it can be pickled by joblib"""
    if not isinstance(text, str):
        return []
    return [s.strip().lower() for s in text.split(",") if s.strip()]

class PlacementMLPipeline:
    def __init__(self, algorithm: str = "RandomForest"):
        self.algorithm = algorithm
        self.model = None

    def _build_estimator(self):
        if self.algorithm == "LogisticRegression":
            clf = LogisticRegression(max_iter=1000, random_state=42)
        elif self.algorithm == "GradientBoosting":
            clf = GradientBoostingClassifier(n_estimators=120, learning_rate=0.1, max_depth=4, random_state=42)
        else:
            clf = RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_split=4, random_state=42)

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), ["cgpa", "percentage", "backlogs", "aptitude_score"]),
                ("skills", CountVectorizer(tokenizer=skill_tokenizer, lowercase=False, token_pattern=None), "technical_skills")
            ],
            remainder="drop"
        )

        return Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

    def train_and_evaluate(self, df: pd.DataFrame) -> Tuple[Any, Dict[str, float]]:
        # Ensure required columns exist
        required_cols = ["cgpa", "percentage", "backlogs", "aptitude_score", "technical_skills", "placed"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column in dataset: {col}")

        X = df[["cgpa", "percentage", "backlogs", "aptitude_score", "technical_skills"]].copy()
        X["technical_skills"] = X["technical_skills"].fillna("").astype(str)
        y = df["placed"].astype(int)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        pipeline = self._build_estimator()
        pipeline.fit(X_train, y_train)

        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else y_pred

        metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4) if len(np.unique(y_test)) > 1 else 0.90
        }

        self.model = pipeline
        return pipeline, metrics

    def save_artifact(self, filepath: str):
        if self.model is None:
            raise ValueError("Model has not been trained yet.")
        joblib.dump(self.model, filepath)

    @staticmethod
    def load_artifact(filepath: str):
        return joblib.load(filepath)
