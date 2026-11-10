package com.careerready;

import com.careerready.dto.auth.AuthResponse;
import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StudentRegisterRequest;
import com.careerready.entity.Department;
import com.careerready.entity.Student;
import com.careerready.entity.User;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.DuplicateResourceException;
import com.careerready.exception.UnauthorizedException;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.UserRepository;
import com.careerready.security.JwtTokenProvider;
import com.careerready.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private com.careerready.repository.SkillRepository skillRepository;

    @Mock
    private com.careerready.repository.StudentSkillRepository studentSkillRepository;

    @Mock
    private com.careerready.repository.StudentAcademicRecordRepository studentAcademicRecordRepository;

    @Mock
    private com.careerready.repository.PlacementStaffRepository staffRepository;

    @Mock
    private com.careerready.repository.PlacementHodRepository hodRepository;

    @Mock
    private com.careerready.repository.PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private com.careerready.service.EmailService emailService;

    @Mock
    private com.careerready.service.StaffApprovalService staffApprovalService;

    @Mock
    private com.careerready.service.impl.StaffRegistrationNotificationDispatcher staffNotificationDispatcher;

    @Mock
    private PasswordEncoder passwordEncoder;

    private JwtTokenProvider tokenProvider;
    private AuthServiceImpl authService;

    private User testUser;
    private Student testStudent;
    private Department testDept;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970", 3600000L);
        authService = new AuthServiceImpl(userRepository, studentRepository, departmentRepository, skillRepository, studentSkillRepository, studentAcademicRecordRepository, passwordEncoder, tokenProvider, staffRepository, hodRepository, passwordResetTokenRepository, emailService, staffApprovalService, staffNotificationDispatcher);

        testUser = User.builder()
                .id(1L)
                .email("student@careerready.ai")
                .password("encoded_pass")
                .name("Arun Kumar")
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .build();

        testDept = Department.builder().id(1L).name("Computer Science and Engineering").code("CSE").build();
        testStudent = Student.builder().id(10L).user(testUser).registerNumber("23CSE001").department(testDept).build();
    }

    @Test
    @DisplayName("Should successfully authenticate valid student credentials and issue JWT")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("student@careerready.ai", "password123", "STUDENT");

        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(testStudent));

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("student@careerready.ai", response.getEmail());
        assertEquals(Role.STUDENT, response.getRole());
        assertEquals(10L, response.getStudentId());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when selected role does not match actual role")
    void testLoginRoleMismatch() {
        LoginRequest request = new LoginRequest("student@careerready.ai", "password123", "STAFF");

        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertEquals("Invalid credentials for the selected role.", ex.getMessage());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException when role is missing")
    void testLoginMissingRole() {
        LoginRequest request = new LoginRequest("student@careerready.ai", "password123", null);

        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encoded_pass")).thenReturn(true);

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(request));
        assertEquals("Invalid credentials for the selected role.", ex.getMessage());
    }

    @Test
    @DisplayName("Should throw UnauthorizedException for bad password")
    void testLoginBadPassword() {
        LoginRequest request = new LoginRequest("student@careerready.ai", "wrongpassword", "STUDENT");

        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", "encoded_pass")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Should reject student registration with duplicate email")
    void testRegisterDuplicateEmail() {
        StudentRegisterRequest req = StudentRegisterRequest.builder()
                .email("student@careerready.ai")
                .registerNumber("23CSE001")
                .build();

        when(userRepository.existsByEmail("student@careerready.ai")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.registerStudent(req));
    }

    @Test
    @DisplayName("Should reject student registration with duplicate register number")
    void testRegisterDuplicateRegisterNumber() {
        StudentRegisterRequest req = StudentRegisterRequest.builder()
                .name("Arun Kumar")
                .email("new@careerready.ai")
                .registerNumber("23CSE001")
                .build();

        when(userRepository.existsByEmail("new@careerready.ai")).thenReturn(false);
        when(studentRepository.existsByRegisterNumber("23CSE001")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.registerStudent(req));
    }

    @Test
    @DisplayName("Should register Staff with PENDING_APPROVAL and send notification to designated admin")
    void testRegisterStaff_PendingApprovalAndNotificationSent() {
        com.careerready.dto.auth.StaffRegisterRequest req = com.careerready.dto.auth.StaffRegisterRequest.builder()
                .name("Dr. Ramesh")
                .email("ramesh@institution.edu")
                .password("Password123!")
                .employeeId("EMP-STF-99")
                .departmentId(1L)
                .phone("+919876543210")
                .build();

        when(userRepository.existsByEmail("ramesh@institution.edu")).thenReturn(false);
        when(staffRepository.existsByEmployeeId("EMP-STF-99")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(testDept));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(99L);
            return u;
        });
        when(staffApprovalService.generateTokensForStaff(any(User.class)))
                .thenReturn(new com.careerready.service.StaffApprovalService.TokenPair("mock-app-tok", "mock-rej-tok"));

        authService.registerStaff(req);

        verify(staffApprovalService).generateTokensForStaff(any(User.class));
        verify(staffNotificationDispatcher).dispatchNotificationAsync(
                eq("Dr. Ramesh"),
                eq("ramesh@institution.edu"),
                eq("EMP-STF-99"),
                eq("Computer Science and Engineering"),
                eq("+919876543210"),
                any(),
                contains("mock-app-tok"),
                contains("mock-rej-tok")
        );
    }

    @Test
    @DisplayName("Should register Admin with PENDING_APPROVAL and send notification to designated admin")
    void testRegisterAdmin_PendingApprovalAndNotificationSent() {
        com.careerready.dto.auth.AdminRegisterRequest req = com.careerready.dto.auth.AdminRegisterRequest.builder()
                .name("Inbaa Admin")
                .email("inbaa.admin@careerready.ai")
                .password("AdminSecret123!")
                .phone("+919123456789")
                .build();

        when(userRepository.existsByEmail("inbaa.admin@careerready.ai")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_admin_pass");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(88L);
            return u;
        });

        authService.registerAdmin(req);

        verify(emailService).sendAdminRegistrationNotification(
                eq("Inbaa Admin"),
                eq("inbaa.admin@careerready.ai"),
                eq("Administrator"),
                eq("ADMIN-REQ-88"),
                eq("System Administration"),
                eq("+919123456789")
        );
    }

    @Test
    @DisplayName("Should prevent login if account status is PENDING_APPROVAL")
    void testLogin_PendingApproval_ThrowsUnauthorized() {
        testUser.setStatus(UserStatus.PENDING_APPROVAL);
        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("pass123", "encoded_pass")).thenReturn(true);

        LoginRequest req = new LoginRequest("student@careerready.ai", "pass123", "STUDENT");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("awaiting administrator approval"));
    }

    @Test
    @DisplayName("Should prevent login if account status is REJECTED")
    void testLogin_Rejected_ThrowsUnauthorized() {
        testUser.setStatus(UserStatus.REJECTED);
        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("pass123", "encoded_pass")).thenReturn(true);

        LoginRequest req = new LoginRequest("student@careerready.ai", "pass123", "STUDENT");

        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> authService.login(req));
        assertTrue(ex.getMessage().contains("rejected"));
    }

    @Test
    @DisplayName("Should allow login if account status is APPROVED")
    void testLogin_Approved_Success() {
        testUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findByEmail("student@careerready.ai")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("pass123", "encoded_pass")).thenReturn(true);
        when(studentRepository.findByUserId(1L)).thenReturn(Optional.of(testStudent));

        LoginRequest req = new LoginRequest("student@careerready.ai", "pass123", "STUDENT");

        AuthResponse res = authService.login(req);
        assertNotNull(res.getToken());
        assertEquals(UserStatus.APPROVED.name(), res.getStatus());
    }
}
