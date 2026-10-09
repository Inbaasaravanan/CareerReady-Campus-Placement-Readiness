package com.careerready.service;

import com.careerready.dto.assessment.AssessmentResponse;
import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.assessment.StudentAssessmentHistoryResponse;
import com.careerready.dto.assessment.SubmitAssessmentRequest;
import com.careerready.enums.AssessmentType;

import java.util.Map;

public interface AssessmentService {

    AssessmentResponse startAssessment(AssessmentType type, Long studentId);

    AssessmentResultResponse submitAssessment(Long assessmentId, Long studentId, SubmitAssessmentRequest request);

    AssessmentResultResponse getAssessmentResult(Long assessmentId, Long studentId);

    StudentAssessmentHistoryResponse getStudentAssessmentHistory(Long studentId);

    Map<String, AssessmentResultResponse> getStudentAssessmentStatus(Long studentId);
}
