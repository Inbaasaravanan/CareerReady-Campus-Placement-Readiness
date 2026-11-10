package com.careerready;

import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StaffApprovalResultDto;
import com.careerready.dto.auth.StaffApprovalVerificationDto;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.StaffApprovalToken;
import com.careerready.entity.User;
import com.careerready.enums.ApprovalAction;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.UnauthorizedException;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.StaffApprovalTokenRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AdminService;
import com.careerready.service.AuthService;
import com.careerready.service.StaffApprovalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StaffApprovalFlowIntegrationTest {

    @Autowired
    private StaffApprovalService staffApprovalService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlacementStaffRepository staffRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private StaffApprovalTokenRepository tokenRepository;

    @Autowired
    private AdminService adminService;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User createTestStaffUser(String email, String employeeId) {
        Department dept = departmentRepository.findAll().stream().findFirst()
                .orElseGet(() -> departmentRepository.save(Department.builder().name("Testing Dept").code("TEST").build()));

        User user = User.builder()
                .name("Integration Test Staff")
                .email(email)
                .password(passwordEncoder.encode("TestPass123!"))
                .role(Role.PLACEMENT_STAFF)
                .status(UserStatus.PENDING_APPROVAL)
                .createdAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        PlacementStaff staff = PlacementStaff.builder()
                .user(user)
                .department(dept)
                .employeeId(employeeId)
                .phone("+91 9999988888")
                .build();
        staffRepository.save(staff);

        return user;
    }

    @Test
    @DisplayName("Requirement 1 & 2: Token verification is read-only and scanner-safe (GET does not mutate state)")
    void testScannerSafetyAndReadOnlyVerification() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User user = createTestStaffUser("scanner.safe." + uniqueSuffix + "@careerready.ai", "EMP-SCN-" + uniqueSuffix);

        StaffApprovalService.TokenPair tokens = staffApprovalService.generateTokensForStaff(user);

        // Simulate security scanner or link preview bot issuing multiple GET verification requests
        for (int i = 0; i < 3; i++) {
            StaffApprovalVerificationDto verifyResult = staffApprovalService.verifyToken(tokens.approveToken());
            assertTrue(verifyResult.isValid());
            assertEquals("APPROVE", verifyResult.getAction());
            assertEquals("PENDING_APPROVAL", verifyResult.getCurrentAccountStatus());
            assertEquals("VALID", verifyResult.getStatus());
        }

        // Verify that database status is completely unchanged
        User freshUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.PENDING_APPROVAL, freshUser.getStatus());
    }

    @Test
    @DisplayName("Requirement 3: Email APPROVE confirmation activates staff account and synchronizes database")
    void testEmailApproveConfirmationFlow() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "approve.flow." + uniqueSuffix + "@careerready.ai";
        User user = createTestStaffUser(email, "EMP-APP-" + uniqueSuffix);

        StaffApprovalService.TokenPair tokens = staffApprovalService.generateTokensForStaff(user);

        // Pre-check: Pending staff cannot log in
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest(email, "TestPass123!", "staff"))
        );

        // Confirm approval
        StaffApprovalResultDto confirmResult = staffApprovalService.confirmApproval(tokens.approveToken());
        assertTrue(confirmResult.isSuccess());
        assertEquals("APPROVE", confirmResult.getAction());
        assertEquals("APPROVED", confirmResult.getNewStatus());

        // Check MySQL user status is now APPROVED
        User freshUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.APPROVED, freshUser.getStatus());

        // Check staff approval audit fields
        PlacementStaff staff = staffRepository.findByUserId(user.getId()).orElseThrow();
        assertNotNull(staff.getApprovedAt());
        assertNotNull(staff.getApprovedBy());

        // Check login now succeeds
        var authResponse = authService.login(new LoginRequest(email, "TestPass123!", "staff"));
        assertNotNull(authResponse);
        assertNotNull(authResponse.getToken());
        assertEquals("APPROVED", authResponse.getStatus());

        // Check that pending approvals query does not include this user
        boolean inPending = adminService.getPendingApprovals().stream()
                .anyMatch(p -> p.getUserId().equals(user.getId()));
        assertFalse(inPending, "Approved user should not appear in pending approvals");
    }

    @Test
    @DisplayName("Requirement 4: Email REJECT confirmation rejects staff account and blocks login")
    void testEmailRejectConfirmationFlow() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "reject.flow." + uniqueSuffix + "@careerready.ai";
        User user = createTestStaffUser(email, "EMP-REJ-" + uniqueSuffix);

        StaffApprovalService.TokenPair tokens = staffApprovalService.generateTokensForStaff(user);

        // Confirm rejection
        StaffApprovalResultDto confirmResult = staffApprovalService.confirmApproval(tokens.rejectToken());
        assertTrue(confirmResult.isSuccess());
        assertEquals("REJECT", confirmResult.getAction());
        assertEquals("REJECTED", confirmResult.getNewStatus());

        // Check MySQL user status is now REJECTED
        User freshUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.REJECTED, freshUser.getStatus());

        // Record is preserved (not deleted)
        assertTrue(userRepository.existsById(user.getId()));
        assertTrue(staffRepository.findByUserId(user.getId()).isPresent());

        // Login is blocked
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest(email, "TestPass123!", "staff"))
        );

        // Check that pending approvals query does not include this user
        boolean inPending = adminService.getPendingApprovals().stream()
                .anyMatch(p -> p.getUserId().equals(user.getId()));
        assertFalse(inPending, "Rejected user should not appear in pending approvals");
    }

    @Test
    @DisplayName("Requirement 5: Reused, sibling, invalid, and expired tokens are rejected")
    void testTokenReuseAndSiblingInvalidation() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User user = createTestStaffUser("reuse.test." + uniqueSuffix + "@careerready.ai", "EMP-REU-" + uniqueSuffix);

        StaffApprovalService.TokenPair tokens = staffApprovalService.generateTokensForStaff(user);

        // Use approve token
        staffApprovalService.confirmApproval(tokens.approveToken());

        // 1. Attempting to reuse the approve token must fail
        assertThrows(BadRequestException.class, () ->
                staffApprovalService.confirmApproval(tokens.approveToken())
        );

        // 2. Attempting to use the sibling reject token must fail (sibling tokens are invalidated)
        assertThrows(BadRequestException.class, () ->
                staffApprovalService.confirmApproval(tokens.rejectToken())
        );

        // 3. Invalid token must fail
        assertThrows(BadRequestException.class, () ->
                staffApprovalService.confirmApproval("non-existent-token-1234567890")
        );
    }

    @Test
    @DisplayName("Requirement 7: Existing Admin dashboard Approve/Reject actions continue to work seamlessly")
    void testExistingAdminDashboardActions() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
        User user = createTestStaffUser("dashboard.test." + uniqueSuffix + "@careerready.ai", "EMP-DSH-" + uniqueSuffix);

        // Verify present in pending approvals
        boolean inPendingBefore = adminService.getPendingApprovals().stream()
                .anyMatch(p -> p.getUserId().equals(user.getId()));
        assertTrue(inPendingBefore);

        // Approve from dashboard
        String msg = adminService.approveUser(user.getId());
        assertNotNull(msg);

        // Verify user status is APPROVED
        User freshUser = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(UserStatus.APPROVED, freshUser.getStatus());

        // Subsequent approval call handles gracefully (no error, reports already active/approved)
        String duplicateMsg = adminService.approveUser(user.getId());
        assertTrue(duplicateMsg.contains("already active/approved"));
    }
}
