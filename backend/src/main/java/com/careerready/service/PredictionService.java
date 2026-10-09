package com.careerready.service;

import com.careerready.dto.readiness.ReadinessPredictRequest;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.entity.ReadinessPrediction;
import com.careerready.entity.Student;

public interface PredictionService {

    /**
     * Check if student has completed both Aptitude and Technical assessments
     */
    boolean hasCompletedBothAssessments(Long studentId);

    /**
     * Generate placement readiness prediction from request features
     */
    ReadinessResponse predict(ReadinessPredictRequest request);

    /**
     * Synthesize and persist readiness prediction for a student based on academic, assessment, and skill profiles
     */
    ReadinessPrediction predictAndSaveForStudent(Student student);

    /**
     * Get the latest saved prediction for a student
     */
    ReadinessResponse getLatestPredictionForStudent(Long studentId);

    /**
     * Get historical readiness predictions for trajectory tracking
     */
    java.util.List<ReadinessResponse> getReadinessHistory(Long studentId);
}
