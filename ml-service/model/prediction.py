"""
CareerReady AI — Python ML Prediction Engine
Loads the serialized RandomForestClassifier model and performs real-time placement readiness inference.
"""

import os
import joblib
import numpy as np
import pandas as pd

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(MODEL_DIR, 'model.pkl')

_model_artifact = None


def load_model():
    """Loads the serialized model artifact from disk, caching it in memory."""
    global _model_artifact
    if _model_artifact is None:
        if not os.path.exists(MODEL_FILE):
            # If not yet trained, trigger training script
            print(f"Model file not found at {MODEL_FILE}. Triggering train_model.py...")
            from model.train_model import train_model
            _model_artifact = train_model()
        else:
            _model_artifact = joblib.load(MODEL_FILE)
    return _model_artifact


def extract_features(data: dict) -> dict:
    """
    Extracts and normalizes student features from incoming request.
    Supports both camelCase and snake_case key conventions.
    """
    def get_val(camel_key, snake_key, default_val):
        val = data.get(camel_key)
        if val is None:
            val = data.get(snake_key)
        if val is None:
            return default_val
        try:
            return float(val)
        except (ValueError, TypeError):
            return default_val

    cgpa = get_val('cgpa', 'cgpa', 7.0)
    cgpa = max(0.0, min(10.0, cgpa))

    academic_score = get_val('academicScore', 'academic_score', cgpa * 10.0)
    academic_score = max(0.0, min(100.0, academic_score))

    aptitude_score = get_val('aptitudeScore', 'aptitude_score', 70.0)
    aptitude_score = max(0.0, min(100.0, aptitude_score))

    technical_score = get_val('technicalScore', 'technical_score', 70.0)
    technical_score = max(0.0, min(100.0, technical_score))

    programming_score = get_val('programmingScore', 'programming_score', technical_score)
    programming_score = max(0.0, min(100.0, programming_score))

    technical_skills_score = get_val('technicalSkillsScore', 'technical_skills_score',
                                     get_val('technicalSkillScore', 'technical_skill_score', technical_score))
    technical_skills_score = max(0.0, min(100.0, technical_skills_score))

    communication_score = get_val('communicationScore', 'communication_score', 70.0)
    communication_score = max(0.0, min(100.0, communication_score))

    problem_solving_score = get_val('problemSolvingScore', 'problem_solving_score', aptitude_score)
    problem_solving_score = max(0.0, min(100.0, problem_solving_score))

    teamwork_score = get_val('teamworkScore', 'teamwork_score', 75.0)
    teamwork_score = max(0.0, min(100.0, teamwork_score))

    backlogs = int(get_val('backlogs', 'backlogs', 0))
    backlogs = max(0, backlogs)

    return {
        'cgpa': cgpa,
        'academic_score': academic_score,
        'aptitude_score': aptitude_score,
        'technical_score': technical_score,
        'programming_score': programming_score,
        'technical_skills_score': technical_skills_score,
        'communication_score': communication_score,
        'problem_solving_score': problem_solving_score,
        'teamwork_score': teamwork_score,
        'backlogs': backlogs
    }


def compute_continuous_readiness_score(predicted_class: str, probabilities: dict, features: dict) -> float:
    """
    Derives the continuous numerical readiness percentage (0 - 100)
    from the real model predicted probabilities, anchored to calibrated class distributions.
    Guarantees mathematical consistency: 0 <= score <= 100 and matches predicted category bounds.
    """
    # Class probability weights (centroid anchors)
    anchors = {
        'HIGHLY_READY': 92.5,
        'READY': 77.5,
        'NEEDS_IMPROVEMENT': 62.5,
        'AT_RISK': 35.0
    }

    # Expected value from full probability distribution
    expected_score = sum(probabilities.get(cls, 0.0) * anchors[cls] for cls in anchors)

    # Fine-grained intra-class adjustment based on specific performance
    # Enforce strict bounds per classification category
    if predicted_class == 'HIGHLY_READY':
        final_score = max(85.0, min(99.0, expected_score))
    elif predicted_class == 'READY':
        final_score = max(70.0, min(84.9, expected_score))
    elif predicted_class == 'NEEDS_IMPROVEMENT':
        final_score = max(55.0, min(69.9, expected_score))
    else:  # AT_RISK
        final_score = max(5.0, min(54.9, expected_score))

    return round(float(final_score), 1)


def predict_readiness(student_data: dict) -> dict:
    """
    Primary prediction entry point.
    Returns predicted category, readiness score, confidence, and class probabilities.
    """
    artifact = load_model()
    model = artifact['model']
    feature_names = artifact['feature_names']
    classes = list(model.classes_)
    version = artifact.get('version', 'RandomForestClassifier-v1.0')

    features = extract_features(student_data)
    
    # Construct DataFrame with exact feature columns in order
    X_df = pd.DataFrame([features])[feature_names]

    # Predict class & probabilities using scikit-learn
    predicted_class = str(model.predict(X_df)[0])
    probabilities_raw = model.predict_proba(X_df)[0]

    prob_dict = {
        cls: round(float(prob), 4)
        for cls, prob in zip(classes, probabilities_raw)
    }

    confidence = round(float(np.max(probabilities_raw)), 4)
    readiness_score = compute_continuous_readiness_score(predicted_class, prob_dict, features)

    return {
        "model": "RandomForestClassifier",
        "version": version,
        "readinessCategory": predicted_class,
        "readinessScore": readiness_score,
        "confidence": confidence,
        "probabilities": prob_dict,
        "features": features
    }
