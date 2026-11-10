package com.careerready.service;

import com.careerready.dto.auth.AuthResponse;
import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StudentRegisterRequest;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse registerStudent(StudentRegisterRequest request);

    void registerStaff(com.careerready.dto.auth.StaffRegisterRequest request);

    void registerHod(com.careerready.dto.auth.HodRegisterRequest request);

    void registerAdmin(com.careerready.dto.auth.AdminRegisterRequest request);

    java.util.List<com.careerready.dto.admin.DepartmentDto> getPublicDepartments();
    void processForgotPassword(com.careerready.dto.auth.ForgotPasswordRequest request);
    void verifyResetToken(String token);
    void resetPassword(com.careerready.dto.auth.ResetPasswordRequest request);
}
