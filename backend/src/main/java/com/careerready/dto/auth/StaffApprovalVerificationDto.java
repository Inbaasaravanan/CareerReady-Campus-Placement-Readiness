package com.careerready.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffApprovalVerificationDto {
    private boolean valid;
    private String action; // APPROVE or REJECT
    private String status; // VALID, EXPIRED, ALREADY_USED, ALREADY_PROCESSED, INVALID
    private String message;
    private Long userId;
    private String applicantName;
    private String applicantEmail;
    private String role;
    private String employeeId;
    private String departmentName;
    private String phone;
    private LocalDateTime registeredAt;
    private String currentAccountStatus;
}
