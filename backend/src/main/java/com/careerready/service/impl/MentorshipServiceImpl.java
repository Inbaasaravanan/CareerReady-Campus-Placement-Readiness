package com.careerready.service.impl;

import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.hod.AssignMentorRequest;
import com.careerready.dto.hod.BulkAssignStaffRequest;
import com.careerready.dto.hod.MentorAssignmentDto;
import com.careerready.dto.hod.StaffAssignmentDto;
import com.careerready.dto.hod.StaffAvailableDto;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.dto.staff.StaffStudentItemDto;
import com.careerready.entity.MentorshipAssignment;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.Student;
import com.careerready.entity.User;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.MentorshipAssignmentRepository;
import com.careerready.repository.PlacementHodRepository;
import com.careerready.repository.PlacementStaffRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.CompanyMatchingService;
import com.careerready.service.MentorshipService;
import com.careerready.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MentorshipServiceImpl implements MentorshipService {

    private final MentorshipAssignmentRepository mentorshipRepository;
    private final StudentRepository studentRepository;
    private final PlacementStaffRepository staffRepository;
    private final PlacementHodRepository hodRepository;
    private final UserRepository userRepository;
    private final PredictionService predictionService;
    private final CompanyMatchingService companyMatchingService;

    // --- HOD STAFF ASSIGNMENT IMPLEMENTATIONS ---

    @Override
    @Transactional(readOnly = true)
    public List<StaffAssignmentDto> getStaffAssignmentsForHod(Long hodUserId) {
        PlacementHod hod = hodUserId != null ? hodRepository.findByUserId(hodUserId).orElse(null) : null;

        List<Student> students;
        if (hod != null && hod.getDepartment() != null) {
            students = studentRepository.findByDepartmentId(hod.getDepartment().getId());
        } else {
            // If HOD has no specific department bound, fetch all students
            students = studentRepository.findAll();
        }

        // Active assignments map
        List<MentorshipAssignment> activeAssignments = mentorshipRepository.findByActiveTrue();
        Map<Long, MentorshipAssignment> assignmentMap = activeAssignments.stream()
                .filter(a -> a.getStudent() != null)
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (first, second) -> first));

        List<StaffAssignmentDto> result = new ArrayList<>();
        for (Student s : students) {
            MentorshipAssignment assignment = assignmentMap.get(s.getId());
            PlacementStaff staff = (s.getAssignedStaff() != null)
                    ? s.getAssignedStaff()
                    : (assignment != null ? assignment.getStaff() : null);

            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "Not Provided";
            String studentName = s.getUser() != null ? s.getUser().getName() : "Student";
            String userStatus = s.getUser() != null && s.getUser().getStatus() != null ? s.getUser().getStatus().name() : "ACTIVE";

            String staffName = null;
            String staffEmail = null;
            Long staffId = null;
            if (staff != null) {
                staffId = staff.getId();
                staffName = staff.getUser() != null ? staff.getUser().getName() : "Staff";
                staffEmail = staff.getUser() != null ? staff.getUser().getEmail() : "";
            }

            String assignedByName = assignment != null && assignment.getAssignedBy() != null
                    ? assignment.getAssignedBy().getName() : null;
            LocalDateTime assignedAt = assignment != null ? assignment.getAssignedAt() : null;

            result.add(StaffAssignmentDto.builder()
                    .studentId(s.getId())
                    .assignmentId(assignment != null ? assignment.getId() : null)
                    .registerNumber(s.getRegisterNumber())
                    .studentName(studentName)
                    .department(deptName)
                    .departmentName(deptName)
                    .cgpa(s.getCgpa())
                    .aptitudeScore(pred != null ? pred.getAptitudeScore() : null)
                    .technicalScore(pred != null ? pred.getTechnicalScore() : null)
                    .readinessScore(pred != null ? pred.getReadinessScore() : null)
                    .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending Assessment")
                    .status(userStatus)
                    .assignedStaffId(staffId)
                    .assignedStaffName(staffName)
                    .assignedStaffEmail(staffEmail)
                    .assignedByName(assignedByName)
                    .assignedAt(assignedAt)
                    .assigned(staff != null)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffAvailableDto> getAvailableStaff(Long hodUserId) {
        List<PlacementStaff> allStaff = staffRepository.findAll();

        return allStaff.stream()
                .filter(st -> st.getUser() != null && (st.getUser().getStatus() == com.careerready.enums.UserStatus.ACTIVE || st.getUser().getStatus() == com.careerready.enums.UserStatus.APPROVED))
                .map(st -> {
                    long count = studentRepository.countByAssignedStaffId(st.getId());
                    if (count == 0) {
                        count = mentorshipRepository.countByStaffIdAndActiveTrue(st.getId());
                    }
                    String dept = st.getDepartment() != null ? st.getDepartment().getName() : "Placement Cell";
                    return StaffAvailableDto.builder()
                            .id(st.getId())
                            .staffId(st.getId())
                            .userId(st.getUser().getId())
                            .name(st.getUser().getName())
                            .email(st.getUser().getEmail())
                            .employeeId(st.getEmployeeId())
                            .department(dept)
                            .assignedCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void bulkAssignStudentsToStaff(BulkAssignStaffRequest request, Long assignedByUserId) {
        if (request.getStudentIds() == null || request.getStudentIds().isEmpty()) {
            throw new BadRequestException("No students selected for assignment.");
        }

        PlacementStaff staff = staffRepository.findById(request.getStaffId())
                .orElseGet(() -> staffRepository.findByUserId(request.getStaffId())
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + request.getStaffId())));

        User assignedBy = assignedByUserId != null ? userRepository.findById(assignedByUserId).orElse(null) : null;

        for (Long studentId : request.getStudentIds()) {
            Student student = studentRepository.findById(studentId).orElse(null);
            if (student == null) continue;

            // Direct assignment in student table
            student.setAssignedStaff(staff);
            studentRepository.save(student);

            // Deactivate any previous active assignment in mentorship table
            mentorshipRepository.findByStudentIdAndActiveTrue(student.getId())
                    .ifPresent(existing -> {
                        existing.setActive(false);
                        mentorshipRepository.save(existing);
                    });

            // Create new persistent active assignment
            MentorshipAssignment assignment = MentorshipAssignment.builder()
                    .student(student)
                    .staff(staff)
                    .assignedBy(assignedBy)
                    .active(true)
                    .build();
            mentorshipRepository.save(assignment);
        }

        log.info("HOD (userId {}) assigned {} students to Staff {} (id {})",
                assignedByUserId, request.getStudentIds().size(), staff.getUser() != null ? staff.getUser().getName() : staff.getId(), staff.getId());
    }

    @Override
    @Transactional
    public StaffAssignmentDto assignSingleStudent(Long studentId, Long staffId, Long assignedByUserId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        PlacementStaff staff = staffRepository.findById(staffId)
                .orElseGet(() -> staffRepository.findByUserId(staffId)
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + staffId)));

        User assignedBy = assignedByUserId != null ? userRepository.findById(assignedByUserId).orElse(null) : null;

        student.setAssignedStaff(staff);
        student = studentRepository.save(student);

        mentorshipRepository.findByStudentIdAndActiveTrue(student.getId())
                .ifPresent(existing -> {
                    existing.setActive(false);
                    mentorshipRepository.save(existing);
                });

        MentorshipAssignment assignment = MentorshipAssignment.builder()
                .student(student)
                .staff(staff)
                .assignedBy(assignedBy)
                .active(true)
                .build();
        assignment = mentorshipRepository.save(assignment);

        ReadinessResponse pred = predictionService.getLatestPredictionForStudent(student.getId());
        String deptName = student.getDepartment() != null ? student.getDepartment().getName() : "Not Provided";

        return StaffAssignmentDto.builder()
                .studentId(student.getId())
                .assignmentId(assignment.getId())
                .registerNumber(student.getRegisterNumber())
                .studentName(student.getUser() != null ? student.getUser().getName() : "Student")
                .department(deptName)
                .departmentName(deptName)
                .cgpa(student.getCgpa())
                .aptitudeScore(pred != null ? pred.getAptitudeScore() : null)
                .technicalScore(pred != null ? pred.getTechnicalScore() : null)
                .readinessScore(pred != null ? pred.getReadinessScore() : null)
                .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending Assessment")
                .status("ACTIVE")
                .assignedStaffId(staff.getId())
                .assignedStaffName(staff.getUser() != null ? staff.getUser().getName() : "Staff")
                .assignedStaffEmail(staff.getUser() != null ? staff.getUser().getEmail() : "")
                .assignedByName(assignedBy != null ? assignedBy.getName() : "Placement HOD")
                .assignedAt(assignment.getAssignedAt())
                .assigned(true)
                .build();
    }

    @Override
    @Transactional
    public void unassignStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        student.setAssignedStaff(null);
        studentRepository.save(student);

        mentorshipRepository.findByStudentIdAndActiveTrue(studentId)
                .ifPresent(existing -> {
                    existing.setActive(false);
                    mentorshipRepository.save(existing);
                });
    }

    // --- STAFF-SIDE MONITORING IMPLEMENTATION (FILTERED TO LOGGED-IN STAFF) ---

    @Override
    @Transactional(readOnly = true)
    public List<StaffStudentItemDto> getAssignedStudentsForStaff(Long staffUserId) {
        PlacementStaff staff = staffRepository.findByUserId(staffUserId).orElse(null);
        if (staff == null) {
            log.warn("PlacementStaff profile not found for user ID: {}", staffUserId);
            return Collections.emptyList();
        }

        // 1. Fetch students assigned to this staff member from students table
        List<Student> assignedStudents = studentRepository.findByAssignedStaffId(staff.getId());

        // 2. If student table hasn't been synchronized yet, also check mentorship_assignments
        if (assignedStudents.isEmpty()) {
            List<MentorshipAssignment> assignments = mentorshipRepository.findByStaffIdAndActiveTrue(staff.getId());
            assignedStudents = assignments.stream()
                    .map(MentorshipAssignment::getStudent)
                    .filter(java.util.Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
        }

        List<StaffStudentItemDto> list = new ArrayList<>();
        String staffName = staff.getUser() != null ? staff.getUser().getName() : "Staff";
        String staffEmail = staff.getUser() != null ? staff.getUser().getEmail() : "";

        for (Student s : assignedStudents) {
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "Not Provided";
            String studentName = s.getUser() != null ? s.getUser().getName() : "Student";
            String email = s.getUser() != null ? s.getUser().getEmail() : "";

            // Deficit Area / Skill Gap extraction
            List<CompanyMatchResponse> matches = companyMatchingService.getCompanyMatchesForStudent(s.getId(), "All");
            List<String> gaps = matches != null ? matches.stream()
                    .filter(m -> m.getSkillGaps() != null)
                    .flatMap(m -> m.getSkillGaps().stream())
                    .distinct()
                    .limit(5)
                    .toList() : List.of();
            String deficit = gaps.isEmpty() ? "None Identified" : String.join(", ", gaps);

            list.add(StaffStudentItemDto.builder()
                    .studentId(s.getId())
                    .id(s.getId())
                    .registerNumber(s.getRegisterNumber())
                    .studentName(studentName)
                    .name(studentName)
                    .email(email)
                    .department(deptName)
                    .departmentName(deptName)
                    .year(s.getYear())
                    .cgpa(s.getCgpa())
                    .aptitudeScore(pred != null ? pred.getAptitudeScore() : null)
                    .technicalScore(pred != null ? pred.getTechnicalScore() : null)
                    .readinessScore(pred != null ? pred.getReadinessScore() : null)
                    .classification(pred != null ? pred.getClassification() : null)
                    .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending Assessment")
                    .assignedStaffId(staff.getId())
                    .assignedStaffName(staffName)
                    .assignedStaffEmail(staffEmail)
                    .skillGaps(gaps)
                    .deficitArea(deficit)
                    .status(s.getUser() != null && s.getUser().getStatus() != null ? s.getUser().getStatus().name() : "ACTIVE")
                    .build());
        }

        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public long countAssignedStudentsForStaff(Long staffUserId) {
        PlacementStaff staff = staffRepository.findByUserId(staffUserId).orElse(null);
        if (staff == null) return 0;
        long count = studentRepository.countByAssignedStaffId(staff.getId());
        if (count == 0) {
            count = mentorshipRepository.countByStaffIdAndActiveTrue(staff.getId());
        }
        return count;
    }

    // --- BACKWARD COMPATIBLE LEGACY METHODS ---

    @Override
    @Transactional(readOnly = true)
    public List<MentorAssignmentDto> getAllAssignments() {
        List<Student> allStudents = studentRepository.findAll();
        List<MentorshipAssignment> activeAssignments = mentorshipRepository.findByActiveTrue();

        Map<Long, MentorshipAssignment> assignmentMap = activeAssignments.stream()
                .filter(a -> a.getStudent() != null)
                .collect(Collectors.toMap(a -> a.getStudent().getId(), a -> a, (first, second) -> first));

        List<MentorAssignmentDto> result = new ArrayList<>();
        for (Student s : allStudents) {
            MentorshipAssignment assignment = assignmentMap.get(s.getId());
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "Not Provided";
            String studentName = s.getUser() != null ? s.getUser().getName() : "Student";
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());

            PlacementStaff staff = s.getAssignedStaff() != null ? s.getAssignedStaff()
                    : (assignment != null ? assignment.getStaff() : null);

            if (staff != null) {
                String staffName = staff.getUser() != null ? staff.getUser().getName() : "Staff";
                String staffEmail = staff.getUser() != null ? staff.getUser().getEmail() : "";
                String staffDept = staff.getDepartment() != null ? staff.getDepartment().getName() : "Placement Cell";
                String assignedBy = assignment != null && assignment.getAssignedBy() != null ? assignment.getAssignedBy().getName() : "Placement HOD";

                result.add(MentorAssignmentDto.builder()
                        .id(assignment != null ? assignment.getId() : null)
                        .studentId(s.getId())
                        .studentName(studentName)
                        .registerNumber(s.getRegisterNumber())
                        .department(deptName)
                        .departmentName(deptName)
                        .readinessScore(pred != null ? pred.getReadinessScore() : null)
                        .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending")
                        .staffId(staff.getId())
                        .staffName(staffName)
                        .staffEmail(staffEmail)
                        .staffDepartment(staffDept)
                        .assignedByName(assignedBy)
                        .assignedAt(assignment != null ? assignment.getAssignedAt() : null)
                        .active(true)
                        .build());
            } else {
                result.add(MentorAssignmentDto.builder()
                        .id(null)
                        .studentId(s.getId())
                        .studentName(studentName)
                        .registerNumber(s.getRegisterNumber())
                        .department(deptName)
                        .departmentName(deptName)
                        .readinessScore(pred != null ? pred.getReadinessScore() : null)
                        .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending")
                        .staffId(null)
                        .staffName(null)
                        .staffEmail(null)
                        .staffDepartment(null)
                        .assignedByName(null)
                        .assignedAt(null)
                        .active(false)
                        .build());
            }
        }

        return result;
    }

    @Override
    @Transactional
    public MentorAssignmentDto assignMentor(AssignMentorRequest request, Long assignedByUserId) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseGet(() -> studentRepository.findByUserId(request.getStudentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId())));

        PlacementStaff staff = staffRepository.findById(request.getStaffId())
                .orElseGet(() -> staffRepository.findByUserId(request.getStaffId())
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + request.getStaffId())));

        User assignedBy = assignedByUserId != null ? userRepository.findById(assignedByUserId).orElse(null) : null;

        student.setAssignedStaff(staff);
        studentRepository.save(student);

        mentorshipRepository.findByStudentIdAndActiveTrue(student.getId())
                .ifPresent(existing -> {
                    existing.setActive(false);
                    mentorshipRepository.save(existing);
                });

        MentorshipAssignment newAssignment = MentorshipAssignment.builder()
                .student(student)
                .staff(staff)
                .assignedBy(assignedBy)
                .active(true)
                .build();

        newAssignment = mentorshipRepository.save(newAssignment);

        String deptName = student.getDepartment() != null ? student.getDepartment().getName() : "Not Provided";
        String studentName = student.getUser() != null ? student.getUser().getName() : "Student";
        String staffName = staff.getUser() != null ? staff.getUser().getName() : "Staff";
        String staffEmail = staff.getUser() != null ? staff.getUser().getEmail() : "";
        String staffDept = staff.getDepartment() != null ? staff.getDepartment().getName() : "Placement Cell";
        String assignedByName = assignedBy != null ? assignedBy.getName() : "Placement HOD";

        return MentorAssignmentDto.builder()
                .id(newAssignment.getId())
                .studentId(student.getId())
                .studentName(studentName)
                .registerNumber(student.getRegisterNumber())
                .department(deptName)
                .departmentName(deptName)
                .staffId(staff.getId())
                .staffName(staffName)
                .staffEmail(staffEmail)
                .staffDepartment(staffDept)
                .assignedByName(assignedByName)
                .assignedAt(newAssignment.getAssignedAt())
                .active(true)
                .build();
    }

    @Override
    @Transactional
    public MentorAssignmentDto updateMentor(Long assignmentId, Long newStaffId, Long updatedByUserId) {
        MentorshipAssignment assignment = mentorshipRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));

        PlacementStaff newStaff = staffRepository.findById(newStaffId)
                .orElseGet(() -> staffRepository.findByUserId(newStaffId)
                        .orElseThrow(() -> new ResourceNotFoundException("Staff not found with id: " + newStaffId)));

        User updatedBy = updatedByUserId != null ? userRepository.findById(updatedByUserId).orElse(null) : null;

        assignment.setStaff(newStaff);
        if (updatedBy != null) {
            assignment.setAssignedBy(updatedBy);
        }
        assignment.setActive(true);
        assignment = mentorshipRepository.save(assignment);

        Student student = assignment.getStudent();
        if (student != null) {
            student.setAssignedStaff(newStaff);
            studentRepository.save(student);
        }

        String deptName = student != null && student.getDepartment() != null ? student.getDepartment().getName() : "Not Provided";
        String studentName = student != null && student.getUser() != null ? student.getUser().getName() : "Student";
        String staffName = newStaff.getUser() != null ? newStaff.getUser().getName() : "Staff";
        String staffEmail = newStaff.getUser() != null ? newStaff.getUser().getEmail() : "";
        String staffDept = newStaff.getDepartment() != null ? newStaff.getDepartment().getName() : "Placement Cell";
        String assignedByName = updatedBy != null ? updatedBy.getName() : "Placement HOD";

        return MentorAssignmentDto.builder()
                .id(assignment.getId())
                .studentId(student != null ? student.getId() : null)
                .studentName(studentName)
                .registerNumber(student != null ? student.getRegisterNumber() : null)
                .department(deptName)
                .departmentName(deptName)
                .staffId(newStaff.getId())
                .staffName(staffName)
                .staffEmail(staffEmail)
                .staffDepartment(staffDept)
                .assignedByName(assignedByName)
                .assignedAt(assignment.getAssignedAt())
                .active(true)
                .build();
    }

    @Override
    @Transactional
    public void removeMentor(Long assignmentId) {
        MentorshipAssignment assignment = mentorshipRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + assignmentId));
        assignment.setActive(false);
        mentorshipRepository.save(assignment);

        if (assignment.getStudent() != null) {
            assignment.getStudent().setAssignedStaff(null);
            studentRepository.save(assignment.getStudent());
        }
    }
}
