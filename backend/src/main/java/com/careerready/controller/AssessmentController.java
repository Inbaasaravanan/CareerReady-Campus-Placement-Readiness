package com.careerready.controller;

import com.careerready.dto.assessment.AssessmentResponse;
import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.assessment.StartAssessmentRequest;
import com.careerready.dto.assessment.StudentAssessmentHistoryResponse;
import com.careerready.dto.assessment.SubmitAssessmentRequest;
import com.careerready.dto.common.ApiResponse;
import com.careerready.entity.Student;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.StudentRepository;
import com.careerready.security.UserPrincipal;
import com.careerready.service.AssessmentService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
@Tag(name = "Assessments", description = "MCQ Assessment workflow: Start, Submit, and Results")
public class AssessmentController {

    private final AssessmentService assessmentService;
    private final StudentRepository studentRepository;

    @PostMapping("/start")
    @Operation(summary = "Start Assessment", description = "Starts a 20-question Aptitude or Technical assessment. Never returns correct answers.")
    public ResponseEntity<ApiResponse<AssessmentResponse>> startAssessment(
            @Valid @RequestBody StartAssessmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long studentId = resolveStudentId(userPrincipal);
        AssessmentResponse response = assessmentService.startAssessment(request.getType(), studentId);
        return ResponseEntity.ok(ApiResponse.success("Assessment started successfully", response));
    }

    @PostMapping("/{assessmentId}/submit")
    @Operation(summary = "Submit Assessment", description = "Submits assessment answers, computes score/percentage, and triggers automated placement readiness flow")
    public ResponseEntity<ApiResponse<AssessmentResultResponse>> submitAssessment(
            @PathVariable Long assessmentId,
            @Valid @RequestBody SubmitAssessmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long studentId = resolveStudentId(userPrincipal);
        AssessmentResultResponse response = assessmentService.submitAssessment(assessmentId, studentId, request);
        return ResponseEntity.ok(ApiResponse.success("Assessment submitted successfully", response));
    }

    @GetMapping("/{assessmentId}/result")
    @Operation(summary = "Get Assessment Result", description = "Retrieves score, percentage, and detailed evaluation for a completed assessment")
    public ResponseEntity<ApiResponse<AssessmentResultResponse>> getAssessmentResult(
            @PathVariable Long assessmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long studentId = userPrincipal != null ? resolveStudentId(userPrincipal) : null;
        AssessmentResultResponse response = assessmentService.getAssessmentResult(assessmentId, studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get Student Assessment History", description = "Retrieves assessment history, aptitude result, and technical result for a student")
    public ResponseEntity<ApiResponse<StudentAssessmentHistoryResponse>> getStudentAssessmentHistory(
            @PathVariable Long studentId) {

        StudentAssessmentHistoryResponse response = assessmentService.getStudentAssessmentHistory(studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/status")
    @Operation(summary = "Get Current Assessment Status", description = "Retrieves status of aptitude and technical assessments for the logged-in student")
    public ResponseEntity<ApiResponse<Map<String, AssessmentResultResponse>>> getStudentAssessmentStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long studentId = resolveStudentId(userPrincipal);
        Map<String, AssessmentResultResponse> status = assessmentService.getStudentAssessmentStatus(studentId);
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    private Long resolveStudentId(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        Student student = studentRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userPrincipal.getUsername()));
        return student.getId();
    }
}
