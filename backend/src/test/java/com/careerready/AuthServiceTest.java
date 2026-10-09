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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
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
    private PasswordEncoder passwordEncoder;

    private JwtTokenProvider tokenProvider;
    private AuthServiceImpl authService;

    private User testUser;
    private Student testStudent;
    private Department testDept;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970", 3600000L);
        authService = new AuthServiceImpl(userRepository, studentRepository, departmentRepository, skillRepository, studentSkillRepository, studentAcademicRecordRepository, passwordEncoder, tokenProvider, staffRepository, hodRepository, passwordResetTokenRepository, emailService);

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
}
