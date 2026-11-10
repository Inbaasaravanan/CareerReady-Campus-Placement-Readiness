package com.careerready.service;

import com.careerready.dto.auth.StaffApprovalResultDto;
import com.careerready.dto.auth.StaffApprovalVerificationDto;
import com.careerready.entity.User;

public interface StaffApprovalService {

    record TokenPair(String approveToken, String rejectToken) {}

    TokenPair generateTokensForStaff(User user);

    StaffApprovalVerificationDto verifyToken(String rawToken);

    StaffApprovalResultDto confirmApproval(String rawToken);
}
