package com.careerready;

import com.careerready.dto.admin.PendingApprovalDto;
import com.careerready.entity.Admin;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.User;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.repository.*;
import com.careerready.service.EmailService;
import com.careerready.service.StudentService;
import com.careerready.service.impl.AdminServiceImpl;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminApprovalServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private PlacementStaffRepository staffRepository;

    @Mock
    private PlacementHodRepository hodRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanySkillRepository companySkillRepository;

    @Mock
    private SkillRepository skillRepository;

    @Mock
    private StudentService studentService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private ReadinessPredictionRepository readinessPredictionRepository;

    @Mock
    private StudentSkillRepository studentSkillRepository;

    @Mock
    private StudentAcademicRecordRepository studentAcademicRecordRepository;

    @Mock
    private MentorshipAssignmentRepository mentorshipAssignmentRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private AdminServiceImpl adminService;

    private User pendingStaffUser;
    private User pendingAdminUser;
    private PlacementStaff placementStaff;

    @BeforeEach
    void setUp() {
        pendingStaffUser = User.builder()
                .id(101L)
                .name("Prof. Sundaram")
                .email("sundaram@institution.edu")
                .role(Role.PLACEMENT_STAFF)
                .status(UserStatus.PENDING_APPROVAL)
                .approvalEmailSent(false)
                .build();

        Department dept = Department.builder().id(1L).name("Computer Science and Engineering").code("CSE").build();

        placementStaff = PlacementStaff.builder()
                .id(501L)
                .user(pendingStaffUser)
                .employeeId("EMP-STF-101")
                .department(dept)
                .phone("+919876543210")
                .build();

        pendingAdminUser = User.builder()
                .id(202L)
                .name("New Admin Applicant")
                .email("admin.applicant@institution.edu")
                .role(Role.ADMIN)
                .status(UserStatus.PENDING_APPROVAL)
                .approvalEmailSent(false)
                .build();
    }

    @Test
    @DisplayName("Should include pending Staff and Admin requests in getPendingApprovals")
    void testGetPendingApprovals() {
        when(userRepository.findAll()).thenReturn(List.of(pendingStaffUser, pendingAdminUser));
        when(staffRepository.findByUserId(101L)).thenReturn(Optional.of(placementStaff));

        List<PendingApprovalDto> approvals = adminService.getPendingApprovals();

        assertEquals(2, approvals.size());

        PendingApprovalDto staffDto = approvals.stream().filter(a -> a.getUserId().equals(101L)).findFirst().orElseThrow();
        assertEquals("EMP-STF-101", staffDto.getIdentifier());
        assertEquals("Computer Science and Engineering", staffDto.getDepartmentName());

        PendingApprovalDto adminDto = approvals.stream().filter(a -> a.getUserId().equals(202L)).findFirst().orElseThrow();
        assertEquals("ADMIN-REQ-202", adminDto.getIdentifier());
        assertEquals("System Administration", adminDto.getDepartmentName());
        assertEquals(Role.ADMIN, adminDto.getRole());
    }

    @Test
    @DisplayName("Should approve pending staff account, set APPROVED status, and send notification")
    void testApproveStaffUser() {
        when(userRepository.findById(101L)).thenReturn(Optional.of(pendingStaffUser));
        when(staffRepository.findByUserId(101L)).thenReturn(Optional.of(placementStaff));
        when(emailService.sendApprovalEmail(eq("sundaram@institution.edu"), eq("Prof. Sundaram"), eq("Placement Staff")))
                .thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = adminService.approveUser(101L);

        assertTrue(result.contains("Account approved successfully"));
        assertEquals(UserStatus.APPROVED, pendingStaffUser.getStatus());
        assertTrue(pendingStaffUser.getApprovalEmailSent());
        verify(staffRepository).save(placementStaff);
        verify(emailService).sendApprovalEmail("sundaram@institution.edu", "Prof. Sundaram", "Placement Staff");
    }

    @Test
    @DisplayName("Should approve pending admin account, create Admin entity, set APPROVED status, and send email")
    void testApproveAdminUser() {
        when(userRepository.findById(202L)).thenReturn(Optional.of(pendingAdminUser));
        when(adminRepository.existsByUserId(202L)).thenReturn(false);
        when(emailService.sendApprovalEmail(eq("admin.applicant@institution.edu"), eq("New Admin Applicant"), eq("Administrator")))
                .thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = adminService.approveUser(202L);

        assertTrue(result.contains("Account approved successfully"));
        assertEquals(UserStatus.APPROVED, pendingAdminUser.getStatus());
        verify(adminRepository).save(any(Admin.class));
        verify(emailService).sendApprovalEmail("admin.applicant@institution.edu", "New Admin Applicant", "Administrator");
    }

    @Test
    @DisplayName("Should prevent duplicate approval on already approved account")
    void testPreventDuplicateApproval() {
        pendingAdminUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(202L)).thenReturn(Optional.of(pendingAdminUser));

        String result = adminService.approveUser(202L);

        assertTrue(result.contains("already active/approved"));
        verify(emailService, never()).sendApprovalEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should reject pending account, set REJECTED status, and send rejection email")
    void testRejectUser() {
        when(userRepository.findById(202L)).thenReturn(Optional.of(pendingAdminUser));
        when(emailService.sendRejectionEmail(eq("admin.applicant@institution.edu"), eq("New Admin Applicant"), eq("Administrator")))
                .thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = adminService.rejectUser(202L);

        assertTrue(result.contains("Account registration rejected"));
        assertEquals(UserStatus.REJECTED, pendingAdminUser.getStatus());
        verify(emailService).sendRejectionEmail("admin.applicant@institution.edu", "New Admin Applicant", "Administrator");
    }

    @Test
    @DisplayName("Should prevent duplicate rejection")
    void testPreventDuplicateRejection() {
        pendingAdminUser.setStatus(UserStatus.REJECTED);
        when(userRepository.findById(202L)).thenReturn(Optional.of(pendingAdminUser));

        String result = adminService.rejectUser(202L);

        assertTrue(result.contains("already rejected"));
        verify(emailService, never()).sendRejectionEmail(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("Should not allow rejecting an already approved account via approval endpoint")
    void testCannotRejectActiveAccount() {
        pendingAdminUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(202L)).thenReturn(Optional.of(pendingAdminUser));

        assertThrows(BadRequestException.class, () -> adminService.rejectUser(202L));
    }
}
