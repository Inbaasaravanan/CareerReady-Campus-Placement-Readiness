"""
CareerReady AI — Placement Readiness ML Model Training Script
Trains a real scikit-learn RandomForestClassifier on student academic, assessment, and placement features.
Saves the serialized model artifact using joblib.
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATA_FILE = os.path.join(DATA_DIR, 'training_data.csv')
MODEL_FILE = os.path.join(MODEL_DIR, 'model.pkl')

FEATURE_COLUMNS = [
    'cgpa',
    'academic_score',
    'aptitude_score',
    'technical_score',
    'programming_score',
    'technical_skills_score',
    'communication_score',
    'problem_solving_score',
    'teamwork_score',
    'backlogs'
]

TARGET_COLUMN = 'readiness_classification'
VALID_CLASSES = ['HIGHLY_READY', 'READY', 'NEEDS_IMPROVEMENT', 'AT_RISK']
MODEL_VERSION = "RandomForest-v2.5-ScikitLearn"


def generate_synthetic_dataset(num_samples=1600, random_seed=42):
    """
    Generates a realistic student training dataset modeled on collegiate recruitment criteria.
    Features follow domain distributions:
    - Highly Ready: High CGPA, strong aptitude & technical MCQs, no backlogs
    - Ready: Consistent CGPA (7.0 - 8.5), good technical scores, 0-1 backlogs
    - Needs Improvement: Borderline CGPA (6.0 - 7.0), average test performance
    - At Risk: Low CGPA (< 6.0), poor assessment scores, or standing backlogs
    """
    np.random.seed(random_seed)
    
    # Distributions
    cgpa = np.clip(np.random.normal(7.6, 1.2, num_samples), 5.0, 10.0)
    academic_score = np.clip(cgpa * 10.0 + np.random.normal(0, 3.0, num_samples), 45.0, 100.0)
    aptitude_score = np.clip(np.random.normal(72.0, 14.0, num_samples), 25.0, 100.0)
    technical_score = np.clip(np.random.normal(71.0, 15.0, num_samples), 20.0, 100.0)
    programming_score = np.clip(technical_score * 0.8 + np.random.normal(15.0, 8.0, num_samples), 30.0, 100.0)
    technical_skills_score = np.clip(technical_score * 0.85 + np.random.normal(10.0, 7.0, num_samples), 30.0, 100.0)
    communication_score = np.clip(np.random.normal(74.0, 12.0, num_samples), 35.0, 100.0)
    problem_solving_score = np.clip(aptitude_score * 0.7 + technical_score * 0.3 + np.random.normal(0, 5.0, num_samples), 30.0, 100.0)
    teamwork_score = np.clip(np.random.normal(76.0, 10.0, num_samples), 40.0, 100.0)
    
    # Backlogs (majority 0, some 1, fewer 2+)
    backlog_probs = [0.70, 0.16, 0.08, 0.04, 0.02]
    backlogs = np.random.choice([0, 1, 2, 3, 4], size=num_samples, p=backlog_probs)

    # Derived latent continuous readiness metric for target labeling
    latent_metric = (
        (academic_score * 0.25) +
        (aptitude_score * 0.20) +
        (technical_score * 0.20) +
        (programming_score * 0.15) +
        (technical_skills_score * 0.10) +
        (communication_score * 0.10) -
        (backlogs * 6.5)
    )

    classifications = []
    for score, bl, gpa in zip(latent_metric, backlogs, cgpa):
        if bl >= 2 or gpa < 6.0 or score < 55.0:
            classifications.append('AT_RISK')
        elif score < 70.0 or bl == 1 or gpa < 6.8:
            classifications.append('NEEDS_IMPROVEMENT')
        elif score >= 82.0 and bl == 0 and gpa >= 8.2:
            classifications.append('HIGHLY_READY')
        else:
            classifications.append('READY')

    df = pd.DataFrame({
        'cgpa': np.round(cgpa, 2),
        'academic_score': np.round(academic_score, 1),
        'aptitude_score': np.round(aptitude_score, 1),
        'technical_score': np.round(technical_score, 1),
        'programming_score': np.round(programming_score, 1),
        'technical_skills_score': np.round(technical_skills_score, 1),
        'communication_score': np.round(communication_score, 1),
        'problem_solving_score': np.round(problem_solving_score, 1),
        'teamwork_score': np.round(teamwork_score, 1),
        'backlogs': backlogs,
        'readiness_classification': classifications
    })

    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(DATA_FILE, index=False)
    print(f"Generated synthetic training dataset with {len(df)} samples at {DATA_FILE}")
    return df


def load_or_create_dataset():
    """Loads dataset from CSV or creates it if missing."""
    if os.path.exists(DATA_FILE):
        print(f"Loading existing training dataset from {DATA_FILE}...")
        df = pd.read_csv(DATA_FILE)
    else:
        print("Dataset not found. Generating new training dataset...")
        df = generate_synthetic_dataset()
    return df


def train_model():
    """Main training workflow using scikit-learn RandomForestClassifier."""
    print("=" * 60)
    print("CareerReady AI — Starting ML Model Training Pipeline")
    print("=" * 60)

    # 1. Load Data
    df = load_or_create_dataset()

    # 2. Validate Columns
    for col in FEATURE_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing required feature column in training data: {col}")
    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"Missing required target column: {TARGET_COLUMN}")

    # 3. Handle missing values
    df[FEATURE_COLUMNS] = df[FEATURE_COLUMNS].fillna(df[FEATURE_COLUMNS].median())
    df = df.dropna(subset=[TARGET_COLUMN])

    # 4. Prepare X and y
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]

    print(f"\nDataset summary:")
    print(f"Total instances: {len(X)}")
    print("Target class distribution:")
    print(y.value_counts())

    # 5. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"\nTraining set size: {len(X_train)} | Test set size: {len(X_test)}")

    # 6. Fit scikit-learn RandomForestClassifier
    print("\nTraining scikit-learn RandomForestClassifier (100 estimators, max_depth=12)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # 7. Evaluate Model
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Evaluation on Test Split:")
    print(f"Test Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, digits=4))

    # Feature Importances
    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print("Feature Importances:")
    for idx in sorted_idx:
        print(f"  - {FEATURE_COLUMNS[idx]:<25}: {importances[idx] * 100:.2f}%")

    # 8. Save Model Artifact using joblib
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_artifact = {
        'model': clf,
        'feature_names': FEATURE_COLUMNS,
        'target_classes': list(clf.classes_),
        'version': MODEL_VERSION,
        'trained_at': datetime.now().isoformat(),
        'test_accuracy': float(acc)
    }

    joblib.dump(model_artifact, MODEL_FILE)
    print(f"\nTrained model artifact successfully saved to: {MODEL_FILE}")
    print("=" * 60)
    return model_artifact


if __name__ == '__main__':
    train_model()
