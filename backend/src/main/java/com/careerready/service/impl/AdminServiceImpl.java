package com.careerready.service.impl;

import com.careerready.dto.admin.CreateUserRequest;
import com.careerready.dto.admin.DepartmentDto;
import com.careerready.dto.admin.DepartmentRequest;
import com.careerready.dto.admin.HodDto;
import com.careerready.dto.admin.HodRequest;
import com.careerready.dto.admin.StaffDto;
import com.careerready.dto.admin.StaffRequest;
import com.careerready.dto.admin.UpdateUserRequest;
import com.careerready.dto.admin.UserDto;
import com.careerready.dto.company.CompanyDto;
import com.careerready.dto.company.CompanyRequest;
import com.careerready.dto.company.CompanySkillRequirementDto;
import com.careerready.dto.skill.SkillDto;
import com.careerready.dto.skill.SkillRequest;
import com.careerready.dto.student.StudentProfileResponse;
import com.careerready.entity.Company;
import com.careerready.entity.CompanySkill;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.Question;
import com.careerready.entity.Skill;
import com.careerready.entity.Student;
import com.careerready.entity.User;
import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.DuplicateResourceException;
import com.careerready.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import com.careerready.repository.CompanyRepository;
import com.careerready.repository.CompanySkillRepository;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.PlacementHodRepository;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.SkillRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AdminService;
import com.careerready.service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final PlacementStaffRepository staffRepository;
    private final PlacementHodRepository hodRepository;
    private final DepartmentRepository departmentRepository;
    private final CompanyRepository companyRepository;
    private final CompanySkillRepository companySkillRepository;
    private final SkillRepository skillRepository;
    private final StudentService studentService;
    private final PasswordEncoder passwordEncoder;
    private final com.careerready.repository.QuestionRepository questionRepository;
    private final com.careerready.service.EmailService emailService;

    // --- USERS ---
    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserDto(user);
    }

    @Override
    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email " + email + " already exists");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(request.getStatus() != null ? request.getStatus() : UserStatus.ACTIVE)
                .build();

        return mapToUserDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new DuplicateResourceException("Email already in use");
            }
            user.setEmail(newEmail);
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }

        return mapToUserDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    // --- STUDENTS ---
    @Override
    @Transactional(readOnly = true)
    public List<StudentProfileResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(s -> studentService.getProfileByStudentId(s.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
        studentRepository.delete(student);
    }

    // --- STAFF ---
    @Override
    @Transactional(readOnly = true)
    public List<StaffDto> getAllStaff() {
        return staffRepository.findAll().stream()
                .map(s -> {
                    User u = s.getUser();
                    String statusStr = "ACTIVE";
                    if (u != null && u.getStatus() != null) {
                        statusStr = u.getStatus() == UserStatus.PENDING_APPROVAL ? "PENDING" : u.getStatus().name();
                    }
                    boolean complete = s.getEmployeeId() != null && !s.getEmployeeId().isBlank()
                            && s.getDepartment() != null;
                    return StaffDto.builder()
                            .id(s.getId())
                            .userId(u != null ? u.getId() : null)
                            .name(u != null ? u.getName() : null)
                            .email(u != null ? u.getEmail() : null)
                            .employeeId(s.getEmployeeId())
                            .department(s.getDepartment() != null ? s.getDepartment().getName() : null)
                            .departmentId(s.getDepartment() != null ? s.getDepartment().getId() : null)
                            .phone(s.getPhone())
                            .status(statusStr)
                            .createdAt(s.getCreatedAt())
                            .approvedAt(s.getApprovedAt())
                            .approvedBy(s.getApprovedBy())
                            .isComplete(complete)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StaffDto createStaff(StaffRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email " + email + " already exists");
        }

        String employeeId = request.getEmployeeId() != null ? request.getEmployeeId().trim().toUpperCase() : null;
        if (employeeId == null || employeeId.isBlank()) {
            throw new BadRequestException("Employee ID is mandatory");
        }
        if (staffRepository.existsByEmployeeId(employeeId)) {
            throw new DuplicateResourceException("Employee ID already registered: " + employeeId);
        }

        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }
        if (dept == null && request.getDepartment() != null && !request.getDepartment().isBlank()) {
            dept = departmentRepository.findByCode(request.getDepartment().trim().toUpperCase())
                    .orElseGet(() -> departmentRepository.findByNameIgnoreCase(request.getDepartment().trim()).orElse(null));
        }
        if (dept == null) {
            throw new BadRequestException("Valid department is mandatory");
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword() : "Staff@123";

        UserStatus userStatus = UserStatus.ACTIVE;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                String s = request.getStatus().trim().toUpperCase();
                if ("PENDING".equals(s)) s = "PENDING_APPROVAL";
                userStatus = UserStatus.valueOf(s);
            } catch (Exception ignored) {}
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.PLACEMENT_STAFF)
                .status(userStatus)
                .build();
        user = userRepository.save(user);

        PlacementStaff staff = PlacementStaff.builder()
                .user(user)
                .department(dept)
                .employeeId(employeeId)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .approvedAt(userStatus == UserStatus.ACTIVE ? LocalDateTime.now() : null)
                .approvedBy(userStatus == UserStatus.ACTIVE ? "Administrator" : null)
                .build();
        staff = staffRepository.save(staff);

        return StaffDto.builder()
                .id(staff.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .employeeId(staff.getEmployeeId())
                .department(staff.getDepartment().getName())
                .departmentId(staff.getDepartment().getId())
                .phone(staff.getPhone())
                .status(userStatus == UserStatus.PENDING_APPROVAL ? "PENDING" : userStatus.name())
                .createdAt(staff.getCreatedAt())
                .approvedAt(staff.getApprovedAt())
                .approvedBy(staff.getApprovedBy())
                .isComplete(true)
                .build();
    }

    @Override
    @Transactional
    public StaffDto updateStaff(Long id, StaffRequest request) {
        PlacementStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));
        User user = staff.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("Associated user not found for staff id: " + id);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new DuplicateResourceException("Email already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getEmployeeId() != null && !request.getEmployeeId().isBlank()) {
            String newEmpId = request.getEmployeeId().trim().toUpperCase();
            if (!newEmpId.equalsIgnoreCase(staff.getEmployeeId()) && staffRepository.existsByEmployeeId(newEmpId)) {
                throw new DuplicateResourceException("Employee ID already in use: " + newEmpId);
            }
            staff.setEmployeeId(newEmpId);
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Invalid department id: " + request.getDepartmentId()));
            staff.setDepartment(dept);
        } else if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            Department dept = departmentRepository.findByCode(request.getDepartment().trim().toUpperCase())
                    .orElseGet(() -> departmentRepository.findByNameIgnoreCase(request.getDepartment().trim()).orElse(null));
            if (dept != null) {
                staff.setDepartment(dept);
            }
        }

        if (request.getPhone() != null) {
            staff.setPhone(request.getPhone().trim());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                String s = request.getStatus().trim().toUpperCase();
                if ("PENDING".equals(s)) s = "PENDING_APPROVAL";
                UserStatus newStatus = UserStatus.valueOf(s);
                UserStatus oldStatus = user.getStatus();
                user.setStatus(newStatus);

                if (newStatus == UserStatus.ACTIVE && (staff.getEmployeeId() == null || staff.getEmployeeId().isBlank() || staff.getDepartment() == null)) {
                    throw new BadRequestException("Cannot activate staff account: Employee ID and Department must be completed before activation.");
                }

                if (newStatus == UserStatus.ACTIVE && oldStatus == UserStatus.PENDING_APPROVAL && !Boolean.TRUE.equals(user.getApprovalEmailSent())) {
                    staff.setApprovedAt(LocalDateTime.now());
                    staff.setApprovedBy("Administrator");
                    emailService.sendApprovalEmail(user.getEmail(), user.getName(), "Placement Staff");
                    user.setApprovalEmailSent(true);
                } else if (newStatus == UserStatus.REJECTED && oldStatus != UserStatus.REJECTED) {
                    staff.setApprovedAt(LocalDateTime.now());
                    staff.setApprovedBy("Administrator");
                    emailService.sendRejectionEmail(user.getEmail(), user.getName(), "Placement Staff");
                }
            } catch (IllegalArgumentException ignored) {}
        }

        userRepository.save(user);
        staff = staffRepository.save(staff);

        boolean complete = staff.getEmployeeId() != null && !staff.getEmployeeId().isBlank()
                && staff.getDepartment() != null;

        return StaffDto.builder()
                .id(staff.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .employeeId(staff.getEmployeeId())
                .department(staff.getDepartment() != null ? staff.getDepartment().getName() : null)
                .departmentId(staff.getDepartment() != null ? staff.getDepartment().getId() : null)
                .phone(staff.getPhone())
                .status(user.getStatus() == UserStatus.PENDING_APPROVAL ? "PENDING" : user.getStatus().name())
                .createdAt(staff.getCreatedAt())
                .approvedAt(staff.getApprovedAt())
                .approvedBy(staff.getApprovedBy())
                .isComplete(complete)
                .build();
    }

    @Override
    @Transactional
    public void deleteStaff(Long id) {
        PlacementStaff staff = staffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + id));
        staffRepository.delete(staff);
    }

    // --- HOD ---
    @Override
    @Transactional(readOnly = true)
    public List<HodDto> getAllHod() {
        return hodRepository.findAll().stream()
                .map(h -> {
                    User u = h.getUser();
                    String statusStr = "ACTIVE";
                    if (u != null && u.getStatus() != null) {
                        statusStr = u.getStatus() == UserStatus.PENDING_APPROVAL ? "PENDING" : u.getStatus().name();
                    }
                    boolean complete = h.getInstitutionalId() != null && !h.getInstitutionalId().isBlank()
                            && h.getDepartmentAuthority() != null && !h.getDepartmentAuthority().isBlank();
                    return HodDto.builder()
                            .id(h.getId())
                            .userId(u != null ? u.getId() : null)
                            .name(u != null ? u.getName() : null)
                            .email(u != null ? u.getEmail() : null)
                            .institutionalId(h.getInstitutionalId())
                            .department(h.getDepartment() != null ? h.getDepartment().getName() : null)
                            .departmentId(h.getDepartment() != null ? h.getDepartment().getId() : null)
                            .departmentAuthority(h.getDepartmentAuthority())
                            .phone(h.getPhone())
                            .status(statusStr)
                            .createdAt(h.getCreatedAt())
                            .approvedAt(h.getApprovedAt())
                            .approvedBy(h.getApprovedBy())
                            .isComplete(complete)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public HodDto createHod(HodRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("User with email " + email + " already exists");
        }

        String institutionalId = request.getInstitutionalId() != null ? request.getInstitutionalId().trim().toUpperCase() : null;
        if (institutionalId == null || institutionalId.isBlank()) {
            throw new BadRequestException("Institutional ID is mandatory");
        }
        if (hodRepository.existsByInstitutionalId(institutionalId)) {
            throw new DuplicateResourceException("Institutional ID already registered: " + institutionalId);
        }

        String authority = request.getDepartmentAuthority() != null ? request.getDepartmentAuthority().trim() : null;
        if (authority == null || authority.isBlank()) {
            throw new BadRequestException("Department Authority is mandatory");
        }

        Department dept = null;
        if (request.getDepartmentId() != null) {
            dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
        }
        if (dept == null && request.getDepartment() != null && !request.getDepartment().isBlank()) {
            dept = departmentRepository.findByCode(request.getDepartment().trim().toUpperCase())
                    .orElseGet(() -> departmentRepository.findByNameIgnoreCase(request.getDepartment().trim()).orElse(null));
        }

        String rawPassword = request.getPassword() != null && !request.getPassword().isBlank()
                ? request.getPassword() : "Hod@123";

        UserStatus userStatus = UserStatus.ACTIVE;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                String s = request.getStatus().trim().toUpperCase();
                if ("PENDING".equals(s)) s = "PENDING_APPROVAL";
                userStatus = UserStatus.valueOf(s);
            } catch (Exception ignored) {}
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.PLACEMENT_HOD)
                .status(userStatus)
                .build();
        user = userRepository.save(user);

        PlacementHod hod = PlacementHod.builder()
                .user(user)
                .department(dept)
                .institutionalId(institutionalId)
                .departmentAuthority(authority)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .approvedAt(userStatus == UserStatus.ACTIVE ? LocalDateTime.now() : null)
                .approvedBy(userStatus == UserStatus.ACTIVE ? "Administrator" : null)
                .build();
        hod = hodRepository.save(hod);

        return HodDto.builder()
                .id(hod.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .institutionalId(hod.getInstitutionalId())
                .department(hod.getDepartment() != null ? hod.getDepartment().getName() : null)
                .departmentId(hod.getDepartment() != null ? hod.getDepartment().getId() : null)
                .departmentAuthority(hod.getDepartmentAuthority())
                .phone(hod.getPhone())
                .status(userStatus == UserStatus.PENDING_APPROVAL ? "PENDING" : userStatus.name())
                .createdAt(hod.getCreatedAt())
                .approvedAt(hod.getApprovedAt())
                .approvedBy(hod.getApprovedBy())
                .isComplete(true)
                .build();
    }

    @Override
    @Transactional
    public HodDto updateHod(Long id, HodRequest request) {
        PlacementHod hod = hodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HOD not found with id: " + id));
        User user = hod.getUser();
        if (user == null) {
            throw new ResourceNotFoundException("Associated user not found for HOD id: " + id);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new DuplicateResourceException("Email already in use: " + newEmail);
            }
            user.setEmail(newEmail);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName().trim());
        }

        if (request.getInstitutionalId() != null && !request.getInstitutionalId().isBlank()) {
            String newInstId = request.getInstitutionalId().trim().toUpperCase();
            if (!newInstId.equalsIgnoreCase(hod.getInstitutionalId()) && hodRepository.existsByInstitutionalId(newInstId)) {
                throw new DuplicateResourceException("Institutional ID already in use: " + newInstId);
            }
            hod.setInstitutionalId(newInstId);
        }

        if (request.getDepartmentAuthority() != null && !request.getDepartmentAuthority().isBlank()) {
            hod.setDepartmentAuthority(request.getDepartmentAuthority().trim());
        }

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Invalid department id: " + request.getDepartmentId()));
            hod.setDepartment(dept);
        } else if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
            Department dept = departmentRepository.findByCode(request.getDepartment().trim().toUpperCase())
                    .orElseGet(() -> departmentRepository.findByNameIgnoreCase(request.getDepartment().trim()).orElse(null));
            if (dept != null) {
                hod.setDepartment(dept);
            }
        }

        if (request.getPhone() != null) {
            hod.setPhone(request.getPhone().trim());
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                String s = request.getStatus().trim().toUpperCase();
                if ("PENDING".equals(s)) s = "PENDING_APPROVAL";
                UserStatus newStatus = UserStatus.valueOf(s);
                UserStatus oldStatus = user.getStatus();
                user.setStatus(newStatus);

                if (newStatus == UserStatus.ACTIVE && (hod.getInstitutionalId() == null || hod.getInstitutionalId().isBlank() || hod.getDepartmentAuthority() == null || hod.getDepartmentAuthority().isBlank())) {
                    throw new BadRequestException("Cannot activate HOD account: Institutional ID and Department Authority must be completed before activation.");
                }

                if (newStatus == UserStatus.ACTIVE && oldStatus == UserStatus.PENDING_APPROVAL && !Boolean.TRUE.equals(user.getApprovalEmailSent())) {
                    hod.setApprovedAt(LocalDateTime.now());
                    hod.setApprovedBy("Administrator");
                    emailService.sendApprovalEmail(user.getEmail(), user.getName(), "Placement HOD");
                    user.setApprovalEmailSent(true);
                } else if (newStatus == UserStatus.REJECTED && oldStatus != UserStatus.REJECTED) {
                    hod.setApprovedAt(LocalDateTime.now());
                    hod.setApprovedBy("Administrator");
                    emailService.sendRejectionEmail(user.getEmail(), user.getName(), "Placement HOD");
                }
            } catch (IllegalArgumentException ignored) {}
        }

        userRepository.save(user);
        hod = hodRepository.save(hod);

        boolean complete = hod.getInstitutionalId() != null && !hod.getInstitutionalId().isBlank()
                && hod.getDepartmentAuthority() != null && !hod.getDepartmentAuthority().isBlank();

        return HodDto.builder()
                .id(hod.getId())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .institutionalId(hod.getInstitutionalId())
                .department(hod.getDepartment() != null ? hod.getDepartment().getName() : null)
                .departmentId(hod.getDepartment() != null ? hod.getDepartment().getId() : null)
                .departmentAuthority(hod.getDepartmentAuthority())
                .phone(hod.getPhone())
                .status(user.getStatus() == UserStatus.PENDING_APPROVAL ? "PENDING" : user.getStatus().name())
                .createdAt(hod.getCreatedAt())
                .approvedAt(hod.getApprovedAt())
                .approvedBy(hod.getApprovedBy())
                .isComplete(complete)
                .build();
    }

    @Override
    @Transactional
    public void deleteHod(Long id) {
        PlacementHod hod = hodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("HOD not found with id: " + id));
        hodRepository.delete(hod);
    }

    // --- DEPARTMENTS ---
    @Override
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(d -> DepartmentDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .code(d.getCode())
                        .status(d.getStatus() != null ? d.getStatus().name() : "ACTIVE")
                        .studentCount(studentRepository.countByDepartmentId(d.getId()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentDto getDepartmentById(Long id) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return DepartmentDto.builder()
                .id(d.getId())
                .name(d.getName())
                .code(d.getCode())
                .status(d.getStatus() != null ? d.getStatus().name() : "ACTIVE")
                .studentCount(studentRepository.countByDepartmentId(d.getId()))
                .build();
    }

    @Override
    @Transactional
    public DepartmentDto createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Department with name " + request.getName() + " already exists");
        }

        UserStatus status = UserStatus.ACTIVE;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                status = UserStatus.valueOf(request.getStatus().trim().toUpperCase());
            } catch (Exception ignored) {}
        }

        Department dept = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .status(status)
                .build();
        dept = departmentRepository.save(dept);

        return DepartmentDto.builder()
                .id(dept.getId())
                .name(dept.getName())
                .code(dept.getCode())
                .status(dept.getStatus().name())
                .studentCount(0L)
                .build();
    }

    @Override
    @Transactional
    public DepartmentDto updateDepartment(Long id, DepartmentRequest request) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        dept.setName(request.getName().trim());
        dept.setCode(request.getCode().trim().toUpperCase());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                dept.setStatus(UserStatus.valueOf(request.getStatus().trim().toUpperCase()));
            } catch (Exception ignored) {}
        }

        dept = departmentRepository.save(dept);

        return DepartmentDto.builder()
                .id(dept.getId())
                .name(dept.getName())
                .code(dept.getCode())
                .status(dept.getStatus() != null ? dept.getStatus().name() : "ACTIVE")
                .studentCount(studentRepository.countByDepartmentId(dept.getId()))
                .build();
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Department not found with id: " + id);
        }
        departmentRepository.deleteById(id);
    }

    // --- COMPANIES ---
    @Override
    @Transactional(readOnly = true)
    public List<CompanyDto> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::mapToCompanyDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyDto getCompanyById(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        return mapToCompanyDto(company);
    }

    @Override
    @Transactional
    public CompanyDto createCompany(CompanyRequest request) {
        if (companyRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Company with name " + request.getName() + " already exists");
        }

        Company company = Company.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .requiredCgpa(request.getRequiredCgpa())
                .minimumAptitudeScore(request.getMinimumAptitudeScore() != null ? request.getMinimumAptitudeScore().doubleValue() : 60.0)
                .minimumTechnicalScore(request.getMinimumTechnicalScore() != null ? request.getMinimumTechnicalScore().doubleValue() : 60.0)
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        company = companyRepository.save(company);

        if (request.getSkills() != null && !request.getSkills().isEmpty()) {
            saveCompanySkills(company, request.getSkills());
        }

        return mapToCompanyDto(company);
    }

    @Override
    @Transactional
    public CompanyDto updateCompany(Long id, CompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        company.setName(request.getName().trim());
        company.setDescription(request.getDescription());
        company.setRequiredCgpa(request.getRequiredCgpa());
        if (request.getMinimumAptitudeScore() != null) company.setMinimumAptitudeScore(request.getMinimumAptitudeScore().doubleValue());
        if (request.getMinimumTechnicalScore() != null) company.setMinimumTechnicalScore(request.getMinimumTechnicalScore().doubleValue());
        if (request.getActive() != null) company.setActive(request.getActive());

        company = companyRepository.save(company);

        if (request.getSkills() != null) {
            companySkillRepository.deleteByCompanyId(company.getId());
            saveCompanySkills(company, request.getSkills());
        }

        return mapToCompanyDto(company);
    }

    @Override
    @Transactional
    public void deleteCompany(Long id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
        companySkillRepository.deleteByCompanyId(id);
        companyRepository.delete(company);
    }

    // --- SKILLS ---
    @Override
    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToSkillDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SkillDto getSkillById(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));
        return mapToSkillDto(skill);
    }

    @Override
    @Transactional
    public SkillDto createSkill(SkillRequest request) {
        if (skillRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Skill with name " + request.getName() + " already exists");
        }

        Skill skill = Skill.builder()
                .name(request.getName().trim())
                .category(request.getCategory() != null ? request.getCategory() : "Technical")
                .description(request.getDescription())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        return mapToSkillDto(skillRepository.save(skill));
    }

    @Override
    @Transactional
    public SkillDto updateSkill(Long id, SkillRequest request) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + id));

        skill.setName(request.getName().trim());
        if (request.getCategory() != null) skill.setCategory(request.getCategory());
        if (request.getDescription() != null) skill.setDescription(request.getDescription());
        if (request.getActive() != null) skill.setActive(request.getActive());

        return mapToSkillDto(skillRepository.save(skill));
    }

    @Override
    @Transactional
    public void deleteSkill(Long id) {
        if (!skillRepository.existsById(id)) {
            throw new ResourceNotFoundException("Skill not found with id: " + id);
        }
        skillRepository.deleteById(id);
    }

    private void saveCompanySkills(Company company, List<CompanySkillRequirementDto> reqDtos) {
        List<CompanySkill> list = new ArrayList<>();
        for (CompanySkillRequirementDto dto : reqDtos) {
            Skill skill = null;
            if (dto.getSkillId() != null) {
                skill = skillRepository.findById(dto.getSkillId()).orElse(null);
            }
            if (skill == null && dto.getSkillName() != null) {
                skill = skillRepository.findByNameIgnoreCase(dto.getSkillName()).orElse(null);
            }
            if (skill != null) {
                list.add(CompanySkill.builder()
                        .company(company)
                        .skill(skill)
                        .requiredLevel(dto.getRequiredLevel())
                        .mandatory(dto.getMandatory() != null ? dto.getMandatory() : false)
                        .build());
            }
        }
        if (!list.isEmpty()) {
            companySkillRepository.saveAll(list);
        }
    }

    private UserDto mapToUserDto(User u) {
        String deptName = null;
        String deptCode = null;
        Long deptId = null;

        if (u.getRole() == Role.STUDENT) {
            var studentOpt = studentRepository.findByUserId(u.getId());
            if (studentOpt.isPresent() && studentOpt.get().getDepartment() != null) {
                deptName = studentOpt.get().getDepartment().getName();
                deptCode = studentOpt.get().getDepartment().getCode();
                deptId = studentOpt.get().getDepartment().getId();
            }
        } else if (u.getRole() == Role.PLACEMENT_STAFF) {
            var staffOpt = staffRepository.findByUserId(u.getId());
            if (staffOpt.isPresent() && staffOpt.get().getDepartment() != null) {
                deptName = staffOpt.get().getDepartment().getName();
                deptCode = staffOpt.get().getDepartment().getCode();
                deptId = staffOpt.get().getDepartment().getId();
            }
        } else if (u.getRole() == Role.PLACEMENT_HOD) {
            var hodOpt = hodRepository.findByUserId(u.getId());
            if (hodOpt.isPresent() && hodOpt.get().getDepartment() != null) {
                deptName = hodOpt.get().getDepartment().getName();
                deptCode = hodOpt.get().getDepartment().getCode();
                deptId = hodOpt.get().getDepartment().getId();
            }
        }

        return UserDto.builder()
                .id(u.getId())
                .name(u.getName())
                .userName(u.getName())
                .email(u.getEmail())
                .role(u.getRole())
                .status(u.getStatus())
                .department(deptName)
                .departmentName(deptName)
                .departmentCode(deptCode)
                .departmentId(deptId)
                .lastLogin(u.getLastLoginAt())
                .lastLoginAt(u.getLastLoginAt())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }

    private SkillDto mapToSkillDto(Skill s) {
        return SkillDto.builder()
                .id(s.getId())
                .name(s.getName())
                .category(s.getCategory())
                .description(s.getDescription())
                .active(s.getActive())
                .build();
    }

    private CompanyDto mapToCompanyDto(Company c) {
        List<CompanySkill> skills = companySkillRepository.findByCompanyId(c.getId());
        List<CompanySkillRequirementDto> skillDtos = skills.stream()
                .map(cs -> CompanySkillRequirementDto.builder()
                        .skillId(cs.getSkill() != null ? cs.getSkill().getId() : null)
                        .skillName(cs.getSkill() != null ? cs.getSkill().getName() : null)
                        .requiredLevel(cs.getRequiredLevel())
                        .mandatory(cs.getMandatory())
                        .build())
                .collect(Collectors.toList());

        return CompanyDto.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .requiredCgpa(c.getRequiredCgpa())
                .minimumAptitudeScore(c.getMinimumAptitudeScore() != null ? c.getMinimumAptitudeScore().intValue() : 60)
                .minimumTechnicalScore(c.getMinimumTechnicalScore() != null ? c.getMinimumTechnicalScore().intValue() : 60)
                .active(c.getActive())
                .skills(skillDtos)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    // --- PENDING APPROVALS ---
    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.admin.PendingApprovalDto> getPendingApprovals() {
        List<User> pendingUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.careerready.enums.UserStatus.PENDING_APPROVAL)
                .toList();

        List<com.careerready.dto.admin.PendingApprovalDto> result = new ArrayList<>();
        for (User u : pendingUsers) {
            String deptName = "Not Provided";
            Long deptId = null;
            String identifier = null;
            String departmentAuthority = null;
            String phone = null;

            if (u.getRole() == com.careerready.enums.Role.PLACEMENT_STAFF) {
                var staff = staffRepository.findByUserId(u.getId()).orElse(null);
                if (staff != null) {
                    identifier = staff.getEmployeeId();
                    phone = staff.getPhone();
                    if (staff.getDepartment() != null) {
                        deptName = staff.getDepartment().getName();
                        deptId = staff.getDepartment().getId();
                    }
                }
            } else if (u.getRole() == com.careerready.enums.Role.PLACEMENT_HOD) {
                var hod = hodRepository.findByUserId(u.getId()).orElse(null);
                if (hod != null) {
                    identifier = hod.getInstitutionalId();
                    departmentAuthority = hod.getDepartmentAuthority();
                    phone = hod.getPhone();
                    if (hod.getDepartment() != null) {
                        deptName = hod.getDepartment().getName();
                        deptId = hod.getDepartment().getId();
                    }
                }
            }

            result.add(com.careerready.dto.admin.PendingApprovalDto.builder()
                    .id(u.getId())
                    .userId(u.getId())
                    .name(u.getName())
                    .email(u.getEmail())
                    .role(u.getRole())
                    .identifier(identifier)
                    .department(deptName)
                    .departmentName(deptName)
                    .departmentId(deptId)
                    .departmentAuthority(departmentAuthority)
                    .phone(phone)
                    .status(u.getStatus())
                    .registeredAt(u.getCreatedAt())
                    .createdAt(u.getCreatedAt())
                    .build());
        }
        return result;
    }

    @Override
    @Transactional
    public String approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // 1. If user is already active or approved, prevent duplicate approvals and emails
        if (user.getStatus() == UserStatus.ACTIVE || user.getStatus() == UserStatus.APPROVED) {
            log.info("User {} (id {}) is already active/approved. Skipping redundant approval email.", user.getEmail(), userId);
            return "User account is already active. No duplicate email was sent.";
        }

        if (user.getStatus() != UserStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Only accounts with PENDING status can be approved.");
        }

        if (user.getRole() == Role.PLACEMENT_STAFF) {
            PlacementStaff staff = staffRepository.findByUserId(userId).orElse(null);
            if (staff != null) {
                if (staff.getEmployeeId() == null || staff.getEmployeeId().isBlank() || staff.getDepartment() == null) {
                    throw new BadRequestException("Cannot approve account: Staff Employee ID and Department must be completed before approval.");
                }
                staff.setApprovedAt(LocalDateTime.now());
                staff.setApprovedBy("Administrator");
                staffRepository.save(staff);
            }
        } else if (user.getRole() == Role.PLACEMENT_HOD) {
            PlacementHod hod = hodRepository.findByUserId(userId).orElse(null);
            if (hod != null) {
                if (hod.getInstitutionalId() == null || hod.getInstitutionalId().isBlank() || hod.getDepartmentAuthority() == null || hod.getDepartmentAuthority().isBlank()) {
                    throw new BadRequestException("Cannot approve account: HOD Institutional ID and Department Authority must be completed before approval.");
                }
                hod.setApprovedAt(LocalDateTime.now());
                hod.setApprovedBy("Administrator");
                hodRepository.save(hod);
            }
        }

        user.setStatus(UserStatus.ACTIVE);

        boolean emailSent = false;
        if (!Boolean.TRUE.equals(user.getApprovalEmailSent())) {
            String roleName = user.getRole() == Role.PLACEMENT_STAFF ? "Placement Staff" : "Placement HOD";
            emailSent = emailService.sendApprovalEmail(user.getEmail(), user.getName(), roleName);
            user.setApprovalEmailSent(true);
        }

        userRepository.save(user);
        log.info("Admin approved specific user {} (id {}, role {}) - Email notification sent: {}",
                user.getEmail(), user.getId(), user.getRole(), emailSent);

        if (emailSent) {
            return "Account approved successfully. Email notification sent to " + user.getEmail() + ".";
        } else {
            return "Account approved successfully. (Note: Email notification queued or SMTP service unavailable for " + user.getEmail() + ")";
        }
    }

    @Override
    @Transactional
    public String rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean emailSent = false;
        if (user.getRole() == Role.PLACEMENT_STAFF) {
            PlacementStaff staff = staffRepository.findByUserId(userId).orElse(null);
            if (staff != null) {
                staff.setApprovedAt(LocalDateTime.now());
                staff.setApprovedBy("Administrator");
                staffRepository.save(staff);
            }
            emailSent = emailService.sendRejectionEmail(user.getEmail(), user.getName(), "Placement Staff");
        } else if (user.getRole() == Role.PLACEMENT_HOD) {
            PlacementHod hod = hodRepository.findByUserId(userId).orElse(null);
            if (hod != null) {
                hod.setApprovedAt(LocalDateTime.now());
                hod.setApprovedBy("Administrator");
                hodRepository.save(hod);
            }
            emailSent = emailService.sendRejectionEmail(user.getEmail(), user.getName(), "Placement HOD");
        }

        user.setStatus(com.careerready.enums.UserStatus.REJECTED);
        userRepository.save(user);
        log.info("Admin rejected user {} (role {}) and sent rejection notification email status: {}", user.getEmail(), user.getRole(), emailSent);

        if (emailSent) {
            return "Account registration rejected. Notification email sent to " + user.getEmail() + ".";
        } else {
            return "Account registration rejected. (Note: Email notification queued or SMTP service unavailable for " + user.getEmail() + ")";
        }
    }

    // --- DASHBOARD ---
    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.admin.AdminDashboardDto getDashboard() {
        long totalStudents = studentRepository.count();
        long totalStaff = staffRepository.count();
        long totalHod = hodRepository.count();
        long pendingApprovals = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.careerready.enums.UserStatus.PENDING_APPROVAL)
                .count();
        long totalCompanies = companyRepository.count();
        long totalDepartments = departmentRepository.count();
        long totalSkills = skillRepository.count();
        long totalQuestions = questionRepository != null ? questionRepository.count() : 0;

        return com.careerready.dto.admin.AdminDashboardDto.builder()
                .totalStudents(totalStudents)
                .totalStaff(totalStaff)
                .totalHod(totalHod)
                .pendingApprovals(pendingApprovals)
                .totalCompanies(totalCompanies)
                .totalDepartments(totalDepartments)
                .totalSkills(totalSkills)
                .totalQuestions(totalQuestions)
                .build();
    }

    // --- QUESTIONS ---
    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.assessment.QuestionDto> getAllQuestions() {
        if (questionRepository == null) return List.of();
        return questionRepository.findAll().stream()
                .map(q -> com.careerready.dto.assessment.QuestionDto.builder()
                        .id(q.getId())
                        .assessmentType(q.getAssessmentType())
                        .topic(q.getTopic())
                        .difficultyLevel(q.getDifficultyLevel())
                        .questionText(q.getQuestionText())
                        .optionA(q.getOptionA())
                        .optionB(q.getOptionB())
                        .optionC(q.getOptionC())
                        .optionD(q.getOptionD())
                        .correctAnswer(q.getCorrectAnswer())
                        .marks(q.getMarks())
                        .active(q.getActive())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public com.careerready.dto.assessment.QuestionDto updateQuestion(Long id, com.careerready.dto.assessment.QuestionDto dto) {
        Question q = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + id));

        String qText = dto.getQuestionText() != null && !dto.getQuestionText().isBlank() ? dto.getQuestionText() : dto.getText();
        if (qText != null && !qText.isBlank()) {
            q.setQuestionText(qText.trim());
        }
        if (dto.getOptionA() != null && !dto.getOptionA().isBlank()) {
            q.setOptionA(dto.getOptionA().trim());
        }
        if (dto.getOptionB() != null && !dto.getOptionB().isBlank()) {
            q.setOptionB(dto.getOptionB().trim());
        }
        if (dto.getOptionC() != null && !dto.getOptionC().isBlank()) {
            q.setOptionC(dto.getOptionC().trim());
        }
        if (dto.getOptionD() != null && !dto.getOptionD().isBlank()) {
            q.setOptionD(dto.getOptionD().trim());
        }
        if (dto.getCorrectAnswer() != null && !dto.getCorrectAnswer().isBlank()) {
            q.setCorrectAnswer(dto.getCorrectAnswer().trim().toUpperCase());
        }
        String topicVal = dto.getTopic() != null && !dto.getTopic().isBlank() ? dto.getTopic() : dto.getCategory();
        if (topicVal != null && !topicVal.isBlank()) {
            q.setTopic(topicVal.trim());
        }
        if (dto.getAssessmentType() != null) {
            q.setAssessmentType(dto.getAssessmentType());
        }
        if (dto.getDifficultyLevel() != null) {
            q.setDifficultyLevel(dto.getDifficultyLevel());
        }
        if (dto.getMarks() != null) {
            q.setMarks(dto.getMarks());
        }
        if (dto.getActive() != null) {
            q.setActive(dto.getActive());
        }

        Question saved = questionRepository.save(q);
        log.info("Admin updated question #{} [type={}, topic={}]", saved.getId(), saved.getAssessmentType(), saved.getTopic());

        return com.careerready.dto.assessment.QuestionDto.builder()
                .id(saved.getId())
                .assessmentType(saved.getAssessmentType())
                .topic(saved.getTopic())
                .difficultyLevel(saved.getDifficultyLevel())
                .questionText(saved.getQuestionText())
                .optionA(saved.getOptionA())
                .optionB(saved.getOptionB())
                .optionC(saved.getOptionC())
                .optionD(saved.getOptionD())
                .correctAnswer(saved.getCorrectAnswer())
                .marks(saved.getMarks())
                .active(saved.getActive())
                .build();
    }
}
