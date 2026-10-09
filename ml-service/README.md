# CareerReady AI — Placement Readiness ML Microservice

A dedicated Python Flask microservice providing real-time **Placement Readiness Machine Learning Inference** for the CareerReady AI platform.

Powered by **scikit-learn's `RandomForestClassifier`**, this service replaces simulated pseudo-ML with a trained, validated machine learning model.

---

## 🛠️ Technology Stack
- **Python**: 3.10+ (tested with Python 3.13 / 3.14)
- **Web Framework**: Flask 3.x
- **Machine Learning**: scikit-learn 1.7.x (`RandomForestClassifier`)
- **Data Manipulation**: pandas, numpy
- **Model Serialization**: joblib

---

## 📁 Directory Structure
```
ml-service/
├── app.py                  # Flask REST API server (/health, /predict)
├── requirements.txt        # Python package dependencies
├── README.md               # ML Service documentation (this file)
├── data/
│   └── training_data.csv   # Historical/calibrated student placement training dataset
└── model/
    ├── train_model.py      # scikit-learn model training & evaluation script
    ├── prediction.py       # Inference engine & score calculation logic
    └── model.pkl           # Serialized RandomForestClassifier model artifact
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python model/train_model.py
```
This trains a 100-tree `RandomForestClassifier` on `data/training_data.csv`, evaluates test accuracy (typically ~94.7%), and saves `model/model.pkl`.

### 3. Start the Flask ML Service
```bash
python app.py
```
The service will start on: **`http://localhost:5000`**

---

## 📡 API Endpoints

### 1. Health Check
`GET http://localhost:5000/health`

**Response (`200 OK`):**
```json
{
  "status": "UP",
  "service": "placement-readiness-ml",
  "model": "RandomForestClassifier",
  "version": "RandomForest-v2.5-ScikitLearn",
  "accuracy": 0.9469
}
```

### 2. Predict Placement Readiness
`POST http://localhost:5000/predict`  
**Headers**: `Content-Type: application/json`

**Request Body:**
```json
{
  "studentId": 1,
  "cgpa": 8.8,
  "academicScore": 88,
  "aptitudeScore": 85,
  "technicalScore": 90,
  "programmingScore": 88,
  "technicalSkillsScore": 85,
  "communicationScore": 80,
  "problemSolvingScore": 85,
  "teamworkScore": 80,
  "backlogs": 0
}
```

**Response (`200 OK`):**
```json
{
  "model": "RandomForestClassifier",
  "version": "RandomForest-v2.5-ScikitLearn",
  "readinessCategory": "HIGHLY_READY",
  "readinessScore": 88.4,
  "confidence": 0.7468,
  "probabilities": {
    "AT_RISK": 0.0014,
    "NEEDS_IMPROVEMENT": 0.0195,
    "READY": 0.2324,
    "HIGHLY_READY": 0.7468
  }
}
```
