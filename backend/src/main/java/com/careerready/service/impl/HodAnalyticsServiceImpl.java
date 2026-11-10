package com.careerready.service.impl;

import com.careerready.dto.hod.DepartmentAnalyticsDto;
import com.careerready.dto.hod.HodAnalyticsDto;
import com.careerready.dto.hod.HodAtRiskAnalyticsDto;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.dto.staff.ReadinessAnalyticsDto;
import com.careerready.dto.staff.SkillGapAnalyticsDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;
import com.careerready.entity.Department;
import com.careerready.entity.PlacementHod;
import com.careerready.entity.Student;
import com.careerready.entity.User;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.ReadinessClassification;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.DepartmentRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.service.HodAnalyticsService;
import com.careerready.service.PredictionService;
import com.careerready.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HodAnalyticsServiceImpl implements HodAnalyticsService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final PredictionService predictionService;
    private final StaffService staffService;

    @Override
    @Transactional(readOnly = true)
    public HodAnalyticsDto getInstitutionAnalytics() {
        ReadinessAnalyticsDto staffAnalytics = staffService.getReadinessAnalytics();

        return HodAnalyticsDto.builder()
                .totalStudents(staffAnalytics.getTotalStudents())
                .averageReadiness(staffAnalytics.getAverageReadinessScore())
                .highlyReady(staffAnalytics.getHighlyReadyCount())
                .ready(staffAnalytics.getReadyCount())
                .needsImprovement(staffAnalytics.getNeedsImprovementCount())
                .atRisk(staffAnalytics.getAtRiskCount())
                .averageAptitude(staffAnalytics.getAverageAptitudeScore())
                .averageTechnical(staffAnalytics.getAverageTechnicalScore())
                .build();
    }

    private final com.careerready.repository.PlacementStaffRepository staffRepository;
    private final com.careerready.repository.PlacementHodRepository hodRepository;
    private final com.careerready.repository.UserRepository userRepository;
    private final com.careerready.repository.CompanyRepository companyRepository;
    private final com.careerready.repository.AssessmentRepository assessmentRepository;
    private final com.careerready.repository.MentorshipAssignmentRepository mentorshipAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentAnalyticsDto> getDepartmentAnalytics() {
        List<Department> departments = departmentRepository.findAll();
        List<Student> allStudents = studentRepository.findAll();
        List<DepartmentAnalyticsDto> result = new ArrayList<>();

        for (Department dept : departments) {
            List<Student> deptStudents = allStudents.stream()
                    .filter(s -> s.getDepartment() != null && s.getDepartment().getId().equals(dept.getId()))
                    .toList();

            long count = deptStudents.size();
            double cgpaSum = 0.0;
            int cgpaCount = 0;
            double readinessSum = 0.0;
            int validCount = 0;
            long atRiskCount = 0;

            for (Student s : deptStudents) {
                if (s.getCgpa() != null) {
                    cgpaSum += s.getCgpa();
                    cgpaCount++;
                }
                ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
                if (pred != null) {
                    if (pred.getReadinessScore() != null) {
                        readinessSum += pred.getReadinessScore();
                        validCount++;
                    }
                    if (pred.getClassification() != null && pred.getClassification() == ReadinessClassification.AT_RISK) {
                        atRiskCount++;
                    }
                }
            }

            Double avgCgpa = cgpaCount > 0 ? Math.round((cgpaSum / cgpaCount) * 100.0) / 100.0 : null;
            Double avgReadiness = validCount > 0 ? Math.round((readinessSum / validCount) * 10.0) / 10.0 : null;

            result.add(DepartmentAnalyticsDto.builder()
                    .departmentId(dept.getId())
                    .department(dept.getName())
                    .departmentName(dept.getName())
                    .code(dept.getCode())
                    .studentCount(count)
                    .averageCgpa(avgCgpa)
                    .averageReadiness(avgReadiness)
                    .atRiskCount(atRiskCount)
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public HodAtRiskAnalyticsDto getAtRiskAnalytics() {
        List<Student> students = studentRepository.findAll();
        long totalAtRisk = 0;
        Map<String, Long> deptWise = new HashMap<>();

        for (Student s : students) {
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
            if (pred != null && pred.getClassification() != null && pred.getClassification() == ReadinessClassification.AT_RISK) {
                totalAtRisk++;
                String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "General";
                deptWise.put(deptName, deptWise.getOrDefault(deptName, 0L) + 1);
            }
        }

        SkillGapAnalyticsDto gaps = staffService.getSkillGapAnalytics();

        return HodAtRiskAnalyticsDto.builder()
                .totalAtRiskStudents(totalAtRisk)
                .departmentWiseAtRisk(deptWise)
                .mostCommonSkillGaps(gaps.getMostCommonSkillGaps())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.hod.StaffMonitoringDto> getStaffMonitoring() {
        List<com.careerready.entity.PlacementStaff> staffList = staffRepository.findAll();
        List<com.careerready.dto.hod.StaffMonitoringDto> result = new ArrayList<>();

        for (com.careerready.entity.PlacementStaff staff : staffList) {
            long assignedCount = mentorshipAssignmentRepository != null
                    ? mentorshipAssignmentRepository.countByStaffIdAndActiveTrue(staff.getId())
                    : 0;

            String deptName = staff.getDepartment() != null ? staff.getDepartment().getName() : "All Departments";
            String staffName = staff.getUser() != null ? staff.getUser().getName() : "Staff Member";
            String staffEmail = staff.getUser() != null ? staff.getUser().getEmail() : "";
            String status = staff.getUser() != null && staff.getUser().getStatus() != null ? staff.getUser().getStatus().name() : "ACTIVE";
            java.time.LocalDateTime lastLogin = staff.getUser() != null ? staff.getUser().getLastLoginAt() : null;

            result.add(com.careerready.dto.hod.StaffMonitoringDto.builder()
                    .staffId(staff.getId())
                    .staffName(staffName)
                    .email(staffEmail)
                    .department(deptName)
                    .status(status)
                    .assignedStudentCount(assignedCount)
                    .activeMentorships(assignedCount)
                    .lastLoginAt(lastLogin)
                    .lastLogin(lastLogin != null ? lastLogin.toString() : "Never")
                    .assignedArea(deptName)
                    .studentsMonitored(assignedCount)
                    .atRiskStudentsIdentified(0L)
                    .reportsGenerated(0)
                    .lastActivity(lastLogin != null ? "Active" : "Never logged in")
                    .build());
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffCompanyAnalyticsDto> getCompanyAnalytics() {
        return staffService.getCompanyAnalytics();
    }

    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.hod.HodDashboardDto getHodDashboard() {
        ReadinessAnalyticsDto analytics = staffService.getReadinessAnalytics();
        long totalStudents = studentRepository.count();
        long completedAssessments = assessmentRepository.countByStatus(AssessmentStatus.COMPLETED);
        long activeCompanies = companyRepository.count();
        long totalStaff = staffRepository.count();
        long totalMentorships = mentorshipAssignmentRepository != null ? mentorshipAssignmentRepository.findByActiveTrue().size() : 0;

        return com.careerready.dto.hod.HodDashboardDto.builder()
                .totalStudents(totalStudents)
                .studentsAssessed(completedAssessments)
                .studentsReady(analytics.getReadyCount() + analytics.getHighlyReadyCount())
                .studentsNeedingImprovement(analytics.getNeedsImprovementCount())
                .atRiskStudents(analytics.getAtRiskCount())
                .activeCompanies(activeCompanies)
                .averageReadinessScore(analytics.getAverageReadinessScore())
                .averageAptitudeScore(analytics.getAverageAptitudeScore())
                .averageTechnicalScore(analytics.getAverageTechnicalScore())
                .totalStaff(totalStaff)
                .totalMentorships(totalMentorships)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.common.UserProfileDto getHodProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        PlacementHod hod = hodRepository.findByUserId(userId).orElse(null);
        String deptName = hod != null && hod.getDepartment() != null ? hod.getDepartment().getName() : "Placement Department";
        Long deptId = hod != null && hod.getDepartment() != null ? hod.getDepartment().getId() : null;

        return com.careerready.dto.common.UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .department(deptName)
                .departmentId(deptId)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
