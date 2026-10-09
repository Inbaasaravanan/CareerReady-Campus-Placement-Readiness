package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.readiness.ReadinessPredictRequest;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.entity.Student;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.StudentRepository;
import com.careerready.security.UserPrincipal;
import com.careerready.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/readiness")
@RequiredArgsConstructor
@Tag(name = "Readiness Prediction", description = "Random Forest Placement Readiness Prediction APIs")
public class ReadinessController {

    private final PredictionService predictionService;
    private final StudentRepository studentRepository;

    @PostMapping("/predict")
    @Operation(summary = "Predict Placement Readiness", description = "Invokes Random Forest Ensemble inference engine to predict readiness score and classification")
    public ResponseEntity<ApiResponse<ReadinessResponse>> predict(
            @Valid @RequestBody ReadinessPredictRequest request) {

        ReadinessResponse response = predictionService.predict(request);
        return ResponseEntity.ok(ApiResponse.success("Prediction computed successfully", response));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get Student Readiness Prediction", description = "Retrieves latest placement readiness prediction and factor diagnostics for a student")
    public ResponseEntity<ApiResponse<ReadinessResponse>> getStudentPrediction(
            @PathVariable Long studentId) {

        ReadinessResponse response = predictionService.getLatestPredictionForStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Get My Readiness Prediction", description = "Retrieves current student's placement readiness prediction and diagnostics")
    public ResponseEntity<ApiResponse<ReadinessResponse>> getMyPrediction(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Student student = studentRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userPrincipal.getUsername()));

        ReadinessResponse response = predictionService.getLatestPredictionForStudent(student.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history/student/{studentId}")
    @Operation(summary = "Get Student Readiness History", description = "Retrieves chronological readiness predictions for trajectory analysis")
    public ResponseEntity<ApiResponse<java.util.List<ReadinessResponse>>> getStudentPredictionHistory(
            @PathVariable Long studentId) {

        java.util.List<ReadinessResponse> history = predictionService.getReadinessHistory(studentId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/history/me")
    @Operation(summary = "Get My Readiness History", description = "Retrieves chronological readiness predictions for current student")
    public ResponseEntity<ApiResponse<java.util.List<ReadinessResponse>>> getMyPredictionHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Student student = studentRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userPrincipal.getUsername()));

        java.util.List<ReadinessResponse> history = predictionService.getReadinessHistory(student.getId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
