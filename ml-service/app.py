"""
CareerReady AI — Placement Readiness Flask ML Microservice
Exposes REST API endpoints:
- GET  /health   : Health check and model metadata
- POST /predict  : Real-time Random Forest placement readiness prediction
"""

import os
import sys
import logging
from flask import Flask, request, jsonify

# Ensure local modules are accessible
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model.prediction import predict_readiness, load_model

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("placement-readiness-ml")

app = Flask(__name__)

# Preload model on startup to ensure instant responses
try:
    model_artifact = load_model()
    logger.info("Successfully loaded Random Forest model artifact (%s)", model_artifact.get('version'))
except Exception as e:
    logger.error("Failed to load model on startup: %s", str(e), exc_info=True)


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint for Spring Boot backend monitoring."""
    try:
        artifact = load_model()
        return jsonify({
            "status": "UP",
            "service": "placement-readiness-ml",
            "model": "RandomForestClassifier",
            "version": artifact.get("version", "RandomForest-v2.5-ScikitLearn"),
            "accuracy": artifact.get("test_accuracy", None)
        }), 200
    except Exception as e:
        logger.error("Health check failure: %s", str(e))
        return jsonify({
            "status": "DOWN",
            "service": "placement-readiness-ml",
            "error": "Model artifact unavailable"
        }), 503


@app.route('/predict', methods=['POST'])
def predict():
    """
    Inference endpoint.
    Accepts student metrics JSON, runs Random Forest inference,
    and returns predicted category, continuous score, confidence, and class probabilities.
    """
    if not request.is_json:
        return jsonify({
            "error": "Request must be JSON with Content-Type: application/json"
        }), 400

    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({
            "error": "Malformed or empty JSON request body"
        }), 400

    logger.info("Received prediction request for studentId: %s", payload.get('studentId'))

    try:
        result = predict_readiness(payload)
        logger.info("Prediction computed: %s (Score: %s, Confidence: %s)",
                    result.get('readinessCategory'),
                    result.get('readinessScore'),
                    result.get('confidence'))
        return jsonify(result), 200

    except Exception as e:
        logger.error("Prediction failed: %s", str(e), exc_info=True)
        return jsonify({
            "error": "Prediction computation failed",
            "message": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\n============================================================")
    print(f" CareerReady AI — Python ML Microservice")
    print(f" Running on http://127.0.0.1:{port} (http://localhost:{port})")
    print(f" Endpoints: GET /health | POST /predict")
    print(f"============================================================\n")
    app.run(host='0.0.0.0', port=port, debug=False)
