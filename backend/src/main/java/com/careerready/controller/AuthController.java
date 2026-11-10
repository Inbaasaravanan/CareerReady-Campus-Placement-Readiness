package com.careerready.controller;

import com.careerready.dto.auth.AuthResponse;
import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StudentRegisterRequest;
import com.careerready.dto.common.ApiResponse;
import com.careerready.service.AuthService;
import com.careerready.service.StaffApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and Student Registration APIs")
public class AuthController {

    private final AuthService authService;
    private final StaffApprovalService staffApprovalService;

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user and returns JWT token with role information")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/register/student")
    @Operation(summary = "Student Registration", description = "Registers a new student account with academic credentials")
    public ResponseEntity<ApiResponse<AuthResponse>> registerStudent(@Valid @RequestBody StudentRegisterRequest request) {
        AuthResponse response = authService.registerStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student registered successfully", response));
    }

    @PostMapping("/register/staff")
    @Operation(summary = "Staff Registration", description = "Registers a new placement staff account awaiting administrator approval")
    public ResponseEntity<ApiResponse<Void>> registerStaff(@Valid @RequestBody com.careerready.dto.auth.StaffRegisterRequest request) {
        authService.registerStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration submitted successfully. Your account is awaiting administrator approval.", null));
    }

    @PostMapping("/register/hod")
    @Operation(summary = "HOD Registration", description = "Registers a new placement HOD account awaiting administrator approval")
    public ResponseEntity<ApiResponse<Void>> registerHod(@Valid @RequestBody com.careerready.dto.auth.HodRegisterRequest request) {
        authService.registerHod(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration submitted successfully. Your account is awaiting administrator approval.", null));
    }

    @PostMapping("/register/admin")
    @Operation(summary = "Admin Registration", description = "Admin self-registration is disabled")
    public ResponseEntity<ApiResponse<Void>> registerAdmin(@Valid @RequestBody com.careerready.dto.auth.AdminRegisterRequest request) {
        throw new org.springframework.security.access.AccessDeniedException("Admin self-registration is disabled.");
    }

    @org.springframework.web.bind.annotation.GetMapping("/departments")
    @Operation(summary = "Public Departments List", description = "Lists academic departments for registration forms")
    public ResponseEntity<ApiResponse<java.util.List<com.careerready.dto.admin.DepartmentDto>>> getDepartments() {
        return ResponseEntity.ok(ApiResponse.success(authService.getPublicDepartments()));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Initiates role-aware password reset flow and sends secure reset email")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody com.careerready.dto.auth.ForgotPasswordRequest request) {
        authService.processForgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset instructions have been sent to your registered email.", null));
    }

    @org.springframework.web.bind.annotation.GetMapping("/verify-reset-token")
    @Operation(summary = "Verify Reset Token", description = "Verifies whether a password reset token is valid and unexpired")
    public ResponseEntity<ApiResponse<Void>> verifyResetToken(@org.springframework.web.bind.annotation.RequestParam("token") String token) {
        authService.verifyResetToken(token);
        return ResponseEntity.ok(ApiResponse.success("Reset token is valid", null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Resets user password with valid reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody com.careerready.dto.auth.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password has been reset successfully. You can now log in with your new password.", null));
    }

    @GetMapping("/staff-approval/verify")
    @Operation(summary = "Verify Staff Approval Token", description = "Verifies token validity and returns applicant details for confirmation page without mutating state")
    public ResponseEntity<ApiResponse<com.careerready.dto.auth.StaffApprovalVerificationDto>> verifyStaffApprovalToken(
            @RequestParam("token") String token) {
        com.careerready.dto.auth.StaffApprovalVerificationDto response = staffApprovalService.verifyToken(token);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PostMapping("/staff-approval/confirm")
    @Operation(summary = "Confirm Staff Approval Action", description = "Executes the Approve or Reject action bound to the secure single-use token")
    public ResponseEntity<ApiResponse<com.careerready.dto.auth.StaffApprovalResultDto>> confirmStaffApproval(
            @Valid @RequestBody com.careerready.dto.auth.StaffApprovalConfirmRequest request) {
        com.careerready.dto.auth.StaffApprovalResultDto response = staffApprovalService.confirmApproval(request.getToken());
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }
}
