package com.careerready.service.impl;

import com.careerready.dto.auth.AuthResponse;
import com.careerready.dto.auth.LoginRequest;
import com.careerready.dto.auth.StudentRegisterRequest;
import com.careerready.dto.skill.StudentSkillSelectionDto;
import com.careerready.dto.student.SemesterMarkDto;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.Skill;
import com.careerready.entity.Student;
import com.careerready.entity.StudentAcademicRecord;
import com.careerready.entity.StudentSkill;
import com.careerready.entity.User;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.DuplicateResourceException;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.exception.UnauthorizedException;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.SkillRepository;
import com.careerready.repository.StudentAcademicRecordRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.repository.UserRepository;
import com.careerready.security.JwtTokenProvider;
import com.careerready.service.AuthService;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.careerready.dto.auth.ForgotPasswordRequest;
import com.careerready.dto.auth.ResetPasswordRequest;
import com.careerready.entity.PasswordResetToken;
import com.careerready.repository.PasswordResetTokenRepository;
import com.careerready.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import java.util.UUID;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final SkillRepository skillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentAcademicRecordRepository studentAcademicRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final com.careerready.repository.PlacementStaffRepository staffRepository;
    private final com.careerready.repository.PlacementHodRepository hodRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${app.reset-password.token-expiration-minutes:30}")
    private int tokenExpirationMinutes;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (request.getRole() == null || request.getRole().isBlank() || !isRoleMatching(user.getRole(), request.getRole())) {
            throw new UnauthorizedException("Invalid credentials for the selected role.");
        }

        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new UnauthorizedException("Your account is awaiting administrator approval.");
        }
        if (user.getStatus() == UserStatus.REJECTED) {
            throw new UnauthorizedException("Your account registration has been rejected. Please contact administrator.");
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new UnauthorizedException("User account is inactive. Please contact your administrator.");
        }

        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        Long studentId = null;
        if (user.getRole() == Role.STUDENT) {
            studentId = studentRepository.findByUserId(user.getId())
                    .map(Student::getId)
                    .orElse(null);
        }

        String token = tokenProvider.generateTokenFromUser(user.getId(), user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .studentId(studentId)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus().name())
                .build();
    }

    @Override
    @Transactional
    public void registerStaff(com.careerready.dto.auth.StaffRegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        String employeeId = request.getEmployeeId() != null ? request.getEmployeeId().trim().toUpperCase() : null;
        if (employeeId == null || employeeId.isBlank()) {
            throw new BadRequestException("Employee ID is mandatory.");
        }
        if (staffRepository.existsByEmployeeId(employeeId)) {
            throw new DuplicateResourceException("Employee ID is already registered: " + employeeId);
        }

        if (request.getDepartmentId() == null) {
            throw new BadRequestException("Department is mandatory.");
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BadRequestException("Invalid department selected."));

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PLACEMENT_STAFF)
                .status(UserStatus.PENDING_APPROVAL)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        PlacementStaff staff = PlacementStaff.builder()
                .user(user)
                .department(department)
                .employeeId(employeeId)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .build();

        staffRepository.save(staff);
        log.info("Registered Placement Staff account for {} (Employee ID: {}) with status PENDING_APPROVAL", email, employeeId);
    }

    @Override
    @Transactional
    public void registerHod(com.careerready.dto.auth.HodRegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        String institutionalId = request.getInstitutionalId() != null ? request.getInstitutionalId().trim().toUpperCase() : null;
        if (institutionalId == null || institutionalId.isBlank()) {
            throw new BadRequestException("Institutional ID is mandatory.");
        }
        if (hodRepository.existsByInstitutionalId(institutionalId)) {
            throw new DuplicateResourceException("Institutional ID is already registered: " + institutionalId);
        }

        String authority = request.getDepartmentAuthority() != null ? request.getDepartmentAuthority().trim() : null;
        if (authority == null || authority.isBlank()) {
            throw new BadRequestException("Department Authority is mandatory.");
        }

        if (request.getDepartmentId() == null) {
            throw new BadRequestException("Department is mandatory.");
        }
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new BadRequestException("Invalid department selected."));

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PLACEMENT_HOD)
                .status(UserStatus.PENDING_APPROVAL)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        PlacementHod hod = PlacementHod.builder()
                .user(user)
                .department(department)
                .institutionalId(institutionalId)
                .departmentAuthority(authority)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .build();

        hodRepository.save(hod);
        log.info("Registered Placement HOD account for {} (Institutional ID: {}) with status PENDING_APPROVAL", email, institutionalId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.admin.DepartmentDto> getPublicDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> com.careerready.dto.admin.DepartmentDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .code(d.getCode())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AuthResponse registerStudent(StudentRegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered");
        }

        String regNumber = request.getRegisterNumber().trim().toUpperCase();
        if (studentRepository.existsByRegisterNumber(regNumber)) {
            throw new DuplicateResourceException("Student with register number '" + regNumber + "' already exists");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.STUDENT)
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .registerNumber(regNumber)
                .department(department)
                .year(request.getYear())
                .cgpa(request.getCgpa())
                .tenthPercentage(85.0)
                .twelfthPercentage(85.0)
                .backlogs(request.getBacklogs())
                .communicationScore(75)
                .problemSolvingScore(75)
                .teamworkScore(75)
                .programmingScore(75)
                .technicalSkillScore(75)
                .build();

        student = studentRepository.save(student);

        // Save student skills
        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            List<StudentSkill> studentSkills = new ArrayList<>();
            for (StudentSkillSelectionDto dto : request.getSkills()) {
                if (dto.getSkillId() != null) {
                    Skill skill = skillRepository.findById(dto.getSkillId()).orElse(null);
                    if (skill != null && dto.getLevel() != null) {
                        studentSkills.add(StudentSkill.builder()
                                .student(student)
                                .skill(skill)
                                .currentLevel(dto.getLevel())
                                .build());
                    }
                }
            }
            if (!studentSkills.isEmpty()) {
                studentSkillRepository.saveAll(studentSkills);
            }
        }

        // Save semester academic records
        if (request.getSemesterMarks() != null && !request.getSemesterMarks().isEmpty()) {
            List<StudentAcademicRecord> records = new ArrayList<>();
            for (SemesterMarkDto dto : request.getSemesterMarks()) {
                if (dto.getSemester() != null && dto.getMarks() != null) {
                    records.add(StudentAcademicRecord.builder()
                            .student(student)
                            .semester(dto.getSemester())
                            .marks(dto.getMarks())
                            .build());
                }
            }
            if (!records.isEmpty()) {
                studentAcademicRecordRepository.saveAll(records);
            }
        }

        return AuthResponse.builder()
                .token(null)
                .userId(user.getId())
                .studentId(student.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus().name())
                .build();
    }

    private boolean isRoleMatching(Role actualRole, String selectedRole) {
        if (actualRole == null || selectedRole == null) {
            return false;
        }
        String normalized = selectedRole.trim().toUpperCase();
        switch (actualRole) {
            case STUDENT:
                return "STUDENT".equals(normalized);
            case PLACEMENT_STAFF:
                return "STAFF".equals(normalized) || "PLACEMENT_STAFF".equals(normalized);
            case PLACEMENT_HOD:
                return "HOD".equals(normalized) || "PLACEMENT_HOD".equals(normalized);
            case ADMIN:
                return "ADMIN".equals(normalized);
            default:
                return false;
        }
    }

    @Override
    @Transactional
    public void processForgotPassword(ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email address is required.");
        }
        if (request.getRole() == null || request.getRole().isBlank()) {
            throw new BadRequestException("Role selection is required.");
        }

        String normalizedRole = request.getRole().trim().toUpperCase();
        if ("ADMIN".equals(normalizedRole)) {
            throw new BadRequestException("Password reset is not supported for administrator accounts.");
        }
        if (!"STUDENT".equals(normalizedRole) && !"STAFF".equals(normalizedRole) &&
            !"PLACEMENT_STAFF".equals(normalizedRole) && !"HOD".equals(normalizedRole) &&
            !"PLACEMENT_HOD".equals(normalizedRole)) {
            throw new BadRequestException("Invalid role selected for password reset.");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found with this email address for the selected role."));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Password reset is not supported for administrator accounts.");
        }

        if (!isRoleMatching(user.getRole(), request.getRole())) {
            throw new BadRequestException("Selected role does not match the registered account.");
        }

        // Handle multiple reset requests safely: Invalidate previous active tokens for this user
        List<PasswordResetToken> existingTokens = passwordResetTokenRepository.findByUserAndUsedFalse(user);
        if (!existingTokens.isEmpty()) {
            for (PasswordResetToken t : existingTokens) {
                t.setUsed(true);
            }
            passwordResetTokenRepository.saveAll(existingTokens);
        }

        // Generate cryptographically secure single-use token
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        int expiryMinutes = tokenExpirationMinutes > 0 ? tokenExpirationMinutes : 30;
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(expiryMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(expiryDate)
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();

        passwordResetTokenRepository.save(resetToken);

        String baseUrl = (frontendUrl != null && !frontendUrl.isBlank()) ? frontendUrl.replaceAll("/+$", "") : "http://localhost:5173";
        String resetLink = baseUrl + "/reset-password?token=" + token;

        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), user.getRole().name(), resetLink, expiryMinutes);
        log.info("Initiated password reset for user: {} ({}) with token expiring in {} minutes", user.getEmail(), user.getRole(), expiryMinutes);
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyResetToken(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Password reset token is required.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token.trim())
                .orElseThrow(() -> new BadRequestException("Password reset link is invalid or expired."));

        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Password reset link is invalid or expired.");
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BadRequestException("New password is required.");
        }
        if (request.getConfirmPassword() == null || request.getConfirmPassword().isBlank()) {
            throw new BadRequestException("Confirmation password is required.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation password do not match.");
        }
        if (request.getNewPassword().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        if (request.getToken() == null || request.getToken().isBlank()) {
            throw new BadRequestException("Reset token is required.");
        }

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken().trim())
                .orElseThrow(() -> new BadRequestException("Password reset link is invalid or expired."));

        if (resetToken.isUsed() || resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Password reset link is invalid or expired.");
        }

        User user = resetToken.getUser();
        if (user == null) {
            throw new BadRequestException("User associated with this reset link no longer exists.");
        }

        // Update password using the existing PasswordEncoder (BCrypt)
        // CRITICAL: Preserve existing user role, status, approval, etc.
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate token so it cannot be reused
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Password successfully updated via reset token for user: {} ({})", user.getEmail(), user.getRole());
    }
}
