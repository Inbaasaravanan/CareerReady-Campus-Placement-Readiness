package com.careerready;

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
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.StaffApprovalTokenRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AdminService;
import com.careerready.service.impl.StaffApprovalServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffApprovalServiceTest {

    @Mock
    private StaffApprovalTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PlacementStaffRepository staffRepository;

    @Mock
    private AdminService adminService;

    @InjectMocks
    private StaffApprovalServiceImpl staffApprovalService;

    private User testUser;
    private PlacementStaff testStaff;
    private Department testDept;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(staffApprovalService, "tokenExpirationHours", 48);

        testDept = Department.builder().id(1L).name("Computer Science and Engineering").code("CSE").build();

        testUser = User.builder()
                .id(101L)
                .name("Prof. Sundaram")
                .email("sundaram@institution.edu")
                .role(Role.PLACEMENT_STAFF)
                .status(UserStatus.PENDING_APPROVAL)
                .createdAt(LocalDateTime.now())
                .build();

        testStaff = PlacementStaff.builder()
                .id(50L)
                .user(testUser)
                .employeeId("EMP-STF-101")
                .department(testDept)
                .phone("+91 9876543210")
                .build();
    }

    @Test
    @DisplayName("Should generate secure token pair and persist both hashed entities")
    void testGenerateTokensForStaff() {
        when(tokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(new ArrayList<>());

        var tokenPair = staffApprovalService.generateTokensForStaff(testUser);

        assertNotNull(tokenPair);
        assertNotNull(tokenPair.approveToken());
        assertNotNull(tokenPair.rejectToken());
        assertNotEquals(tokenPair.approveToken(), tokenPair.rejectToken());
        assertEquals(64, tokenPair.approveToken().length());
        assertEquals(64, tokenPair.rejectToken().length());

        verify(tokenRepository, times(2)).save(any(StaffApprovalToken.class));
    }

    @Test
    @DisplayName("Should verify valid token and return applicant details")
    void testVerifyToken_Valid() {
        StaffApprovalToken token = StaffApprovalToken.builder()
                .id(1L)
                .tokenHash("somehash")
                .user(testUser)
                .action(ApprovalAction.APPROVE)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(staffRepository.findByUserId(101L)).thenReturn(Optional.of(testStaff));

        StaffApprovalVerificationDto result = staffApprovalService.verifyToken("raw-token-sample");

        assertTrue(result.isValid());
        assertEquals("VALID", result.getStatus());
        assertEquals("APPROVE", result.getAction());
        assertEquals("Prof. Sundaram", result.getApplicantName());
        assertEquals("sundaram@institution.edu", result.getApplicantEmail());
        assertEquals("EMP-STF-101", result.getEmployeeId());
        assertEquals("Computer Science and Engineering", result.getDepartmentName());
    }

    @Test
    @DisplayName("Should reject verification when token is already used")
    void testVerifyToken_AlreadyUsed() {
        StaffApprovalToken token = StaffApprovalToken.builder()
                .id(1L)
                .tokenHash("somehash")
                .user(testUser)
                .action(ApprovalAction.APPROVE)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(true)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(staffRepository.findByUserId(101L)).thenReturn(Optional.of(testStaff));

        StaffApprovalVerificationDto result = staffApprovalService.verifyToken("raw-token-sample");

        assertFalse(result.isValid());
        assertEquals("ALREADY_USED", result.getStatus());
    }

    @Test
    @DisplayName("Should reject verification when token is expired")
    void testVerifyToken_Expired() {
        StaffApprovalToken token = StaffApprovalToken.builder()
                .id(1L)
                .tokenHash("somehash")
                .user(testUser)
                .action(ApprovalAction.APPROVE)
                .expiryDate(LocalDateTime.now().minusHours(1))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(staffRepository.findByUserId(101L)).thenReturn(Optional.of(testStaff));

        StaffApprovalVerificationDto result = staffApprovalService.verifyToken("raw-token-sample");

        assertFalse(result.isValid());
        assertEquals("EXPIRED", result.getStatus());
    }

    @Test
    @DisplayName("Should successfully confirm APPROVE action and invalidate sibling tokens")
    void testConfirmApproval_Approve() {
        StaffApprovalToken approveToken = StaffApprovalToken.builder()
                .id(1L)
                .tokenHash("approvehash")
                .user(testUser)
                .action(ApprovalAction.APPROVE)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        StaffApprovalToken siblingRejectToken = StaffApprovalToken.builder()
                .id(2L)
                .tokenHash("rejecthash")
                .user(testUser)
                .action(ApprovalAction.REJECT)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(approveToken));
        when(adminService.approveUser(101L)).thenReturn("Account approved successfully.");
        when(tokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(List.of(siblingRejectToken));

        StaffApprovalResultDto result = staffApprovalService.confirmApproval("raw-approve-token");

        assertTrue(result.isSuccess());
        assertEquals("APPROVE", result.getAction());
        assertEquals("APPROVED", result.getNewStatus());
        assertTrue(approveToken.isUsed());
        assertNotNull(approveToken.getUsedAt());
        assertTrue(siblingRejectToken.isUsed());

        verify(adminService).approveUser(101L);
        verify(tokenRepository).save(approveToken);
        verify(tokenRepository).saveAll(any());
    }

    @Test
    @DisplayName("Should successfully confirm REJECT action and block login")
    void testConfirmApproval_Reject() {
        StaffApprovalToken rejectToken = StaffApprovalToken.builder()
                .id(2L)
                .tokenHash("rejecthash")
                .user(testUser)
                .action(ApprovalAction.REJECT)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(rejectToken));
        when(adminService.rejectUser(101L)).thenReturn("Account registration rejected.");
        when(tokenRepository.findByUserAndUsedFalse(testUser)).thenReturn(List.of());

        StaffApprovalResultDto result = staffApprovalService.confirmApproval("raw-reject-token");

        assertTrue(result.isSuccess());
        assertEquals("REJECT", result.getAction());
        assertEquals("REJECTED", result.getNewStatus());
        assertTrue(rejectToken.isUsed());

        verify(adminService).rejectUser(101L);
    }

    @Test
    @DisplayName("Should disallow state change if user is already approved")
    void testConfirmApproval_AlreadyApproved() {
        testUser.setStatus(UserStatus.APPROVED);

        StaffApprovalToken approveToken = StaffApprovalToken.builder()
                .id(1L)
                .tokenHash("approvehash")
                .user(testUser)
                .action(ApprovalAction.APPROVE)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(approveToken));

        assertThrows(BadRequestException.class, () -> staffApprovalService.confirmApproval("raw-token"));
    }
}
