package com.careerready.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffApprovalResultDto {
    private boolean success;
    private String action; // APPROVE or REJECT
    private String message;
    private Long userId;
    private String applicantName;
    private String applicantEmail;
    private String newStatus; // APPROVED or REJECTED
}
