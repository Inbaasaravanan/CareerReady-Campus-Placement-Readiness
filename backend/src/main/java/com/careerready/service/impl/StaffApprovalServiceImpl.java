package com.careerready.service.impl;

import com.careerready.dto.auth.StaffApprovalResultDto;
import com.careerready.dto.auth.StaffApprovalVerificationDto;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.StaffApprovalToken;
import com.careerready.entity.User;
import com.careerready.enums.ApprovalAction;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.StaffApprovalTokenRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AdminService;
import com.careerready.service.StaffApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffApprovalServiceImpl implements StaffApprovalService {

    private final StaffApprovalTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PlacementStaffRepository staffRepository;
    private final AdminService adminService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.staff-approval.token-expiration-hours:48}")
    private int tokenExpirationHours;

    @Override
    @Transactional
    public TokenPair generateTokensForStaff(User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User must not be null and must be persisted before token generation.");
        }

        // Invalidate any existing unused tokens for this user
        List<StaffApprovalToken> existingTokens = tokenRepository.findByUserAndUsedFalse(user);
        if (!existingTokens.isEmpty()) {
            for (StaffApprovalToken token : existingTokens) {
                token.setUsed(true);
            }
            tokenRepository.saveAll(existingTokens);
        }

        int expiryHours = tokenExpirationHours > 0 ? tokenExpirationHours : 48;
        LocalDateTime expiryDate = LocalDateTime.now().plusHours(expiryHours);

        // Generate cryptographically secure tokens
        String rawApproveToken = generateSecureToken();
        String rawRejectToken = generateSecureToken();

        String approveTokenHash = sha256Hex(rawApproveToken);
        String rejectTokenHash = sha256Hex(rawRejectToken);

        StaffApprovalToken approveEntity = StaffApprovalToken.builder()
                .tokenHash(approveTokenHash)
                .user(user)
                .action(ApprovalAction.APPROVE)
                .expiryDate(expiryDate)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        StaffApprovalToken rejectEntity = StaffApprovalToken.builder()
                .tokenHash(rejectTokenHash)
                .user(user)
                .action(ApprovalAction.REJECT)
                .expiryDate(expiryDate)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        tokenRepository.save(approveEntity);
        tokenRepository.save(rejectEntity);

        log.info("Generated Staff approval & rejection token pair for user id {} (email: {}). Expires in {} hours.",
                user.getId(), user.getEmail(), expiryHours);

        return new TokenPair(rawApproveToken, rawRejectToken);
    }

    @Override
    @Transactional(readOnly = true)
    public StaffApprovalVerificationDto verifyToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("INVALID")
                    .message("No token was provided in the request.")
                    .build();
        }

        String tokenHash = sha256Hex(rawToken.trim());
        StaffApprovalToken token = tokenRepository.findByTokenHash(tokenHash).orElse(null);

        if (token == null) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("INVALID")
                    .message("This approval link is invalid or unrecognized.")
                    .build();
        }

        User user = token.getUser();
        PlacementStaff staff = user != null ? staffRepository.findByUserId(user.getId()).orElse(null) : null;

        String applicantName = user != null ? user.getName() : "Unknown";
        String applicantEmail = user != null ? user.getEmail() : "Unknown";
        String employeeId = staff != null ? staff.getEmployeeId() : "N/A";
        String departmentName = (staff != null && staff.getDepartment() != null) ? staff.getDepartment().getName() : "N/A";
        String phone = staff != null ? staff.getPhone() : null;
        LocalDateTime registeredAt = user != null ? user.getCreatedAt() : null;
        String currentAccountStatus = user != null ? user.getStatus().name() : "UNKNOWN";
        String actionStr = token.getAction() != null ? token.getAction().name() : "APPROVE";

        if (token.isUsed()) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("ALREADY_USED")
                    .action(actionStr)
                    .message("This confirmation link has already been used.")
                    .userId(user != null ? user.getId() : null)
                    .applicantName(applicantName)
                    .applicantEmail(applicantEmail)
                    .role("Placement Staff")
                    .employeeId(employeeId)
                    .departmentName(departmentName)
                    .phone(phone)
                    .registeredAt(registeredAt)
                    .currentAccountStatus(currentAccountStatus)
                    .build();
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("EXPIRED")
                    .action(actionStr)
                    .message("This confirmation link has expired. Approval links are valid for " + tokenExpirationHours + " hours.")
                    .userId(user != null ? user.getId() : null)
                    .applicantName(applicantName)
                    .applicantEmail(applicantEmail)
                    .role("Placement Staff")
                    .employeeId(employeeId)
                    .departmentName(departmentName)
                    .phone(phone)
                    .registeredAt(registeredAt)
                    .currentAccountStatus(currentAccountStatus)
                    .build();
        }

        if (user == null) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("INVALID")
                    .message("Associated applicant account was not found.")
                    .build();
        }

        if (user.getStatus() == UserStatus.APPROVED || user.getStatus() == UserStatus.ACTIVE) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("ALREADY_PROCESSED")
                    .action(actionStr)
                    .message("This staff account has already been approved and is active.")
                    .userId(user.getId())
                    .applicantName(applicantName)
                    .applicantEmail(applicantEmail)
                    .role("Placement Staff")
                    .employeeId(employeeId)
                    .departmentName(departmentName)
                    .phone(phone)
                    .registeredAt(registeredAt)
                    .currentAccountStatus(currentAccountStatus)
                    .build();
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("ALREADY_PROCESSED")
                    .action(actionStr)
                    .message("This staff registration request has already been rejected.")
                    .userId(user.getId())
                    .applicantName(applicantName)
                    .applicantEmail(applicantEmail)
                    .role("Placement Staff")
                    .employeeId(employeeId)
                    .departmentName(departmentName)
                    .phone(phone)
                    .registeredAt(registeredAt)
                    .currentAccountStatus(currentAccountStatus)
                    .build();
        }

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            return StaffApprovalVerificationDto.builder()
                    .valid(false)
                    .status("ALREADY_PROCESSED")
                    .action(actionStr)
                    .message("This account is currently in " + user.getStatus() + " status.")
                    .userId(user.getId())
                    .applicantName(applicantName)
                    .applicantEmail(applicantEmail)
                    .role("Placement Staff")
                    .employeeId(employeeId)
                    .departmentName(departmentName)
                    .phone(phone)
                    .registeredAt(registeredAt)
                    .currentAccountStatus(currentAccountStatus)
                    .build();
        }

        return StaffApprovalVerificationDto.builder()
                .valid(true)
                .status("VALID")
                .action(actionStr)
                .message("Token is valid. Ready for confirmation.")
                .userId(user.getId())
                .applicantName(applicantName)
                .applicantEmail(applicantEmail)
                .role("Placement Staff")
                .employeeId(employeeId)
                .departmentName(departmentName)
                .phone(phone)
                .registeredAt(registeredAt)
                .currentAccountStatus(currentAccountStatus)
                .build();
    }

    @Override
    @Transactional
    public StaffApprovalResultDto confirmApproval(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException("Approval token is required.");
        }

        String tokenHash = sha256Hex(rawToken.trim());
        StaffApprovalToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("This approval link is invalid or unrecognized."));

        if (token.isUsed()) {
            throw new BadRequestException("This confirmation link has already been used.");
        }

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("This confirmation link has expired.");
        }

        User user = token.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("Associated applicant user account not found.");
        }

        // Prevent race conditions and duplicate actions
        if (user.getStatus() == UserStatus.APPROVED || user.getStatus() == UserStatus.ACTIVE) {
            throw new BadRequestException("This staff account has already been approved.");
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new BadRequestException("This staff registration request has already been rejected.");
        }
        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only accounts in PENDING status can be confirmed via this action.");
        }

        ApprovalAction action = token.getAction();
        String resultMessage;
        String newStatus;

        if (action == ApprovalAction.APPROVE) {
            resultMessage = adminService.approveUser(user.getId());
            newStatus = UserStatus.APPROVED.name();
            log.info("Secure email APPROVE action executed successfully for user {} (id: {})", user.getEmail(), user.getId());
        } else if (action == ApprovalAction.REJECT) {
            resultMessage = adminService.rejectUser(user.getId());
            newStatus = UserStatus.REJECTED.name();
            log.info("Secure email REJECT action executed successfully for user {} (id: {})", user.getEmail(), user.getId());
        } else {
            throw new BadRequestException("Unsupported approval action: " + action);
        }

        // Mark this token as used
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);

        // Invalidate any other active tokens for this user registration
        List<StaffApprovalToken> remainingTokens = tokenRepository.findByUserAndUsedFalse(user);
        for (StaffApprovalToken t : remainingTokens) {
            t.setUsed(true);
            t.setUsedAt(LocalDateTime.now());
        }
        if (!remainingTokens.isEmpty()) {
            tokenRepository.saveAll(remainingTokens);
        }

        return StaffApprovalResultDto.builder()
                .success(true)
                .action(action.name())
                .message(resultMessage)
                .userId(user.getId())
                .applicantName(user.getName())
                .applicantEmail(user.getEmail())
                .newStatus(newStatus)
                .build();
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 message digest algorithm unavailable", e);
        }
    }
}
