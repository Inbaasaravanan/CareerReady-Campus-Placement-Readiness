package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.staff.AtRiskStudentDto;
import com.careerready.dto.staff.ReadinessAnalyticsDto;
import com.careerready.dto.staff.SkillGapAnalyticsDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;
import com.careerready.dto.staff.StaffStudentItemDto;
import com.careerready.enums.ReadinessClassification;
import com.careerready.service.StaffService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@Tag(name = "Placement Staff", description = "Placement staff student monitoring, at-risk detection, and analytics (NO reports)")
public class StaffController {

    private final StaffService staffService;

    @GetMapping("/students")
    @Operation(summary = "Get Students with Filters", description = "Retrieves student placement status with search, department, year, classification filters and pagination")
    public ResponseEntity<ApiResponse<Page<StaffStudentItemDto>>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) ReadinessClassification classification,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {

        Long staffUserId = principal != null ? principal.getId() : null;
        Page<StaffStudentItemDto> students = staffService.getStudents(
                staffUserId, search, department, year, classification,
                PageRequest.of(page, size, Sort.by("id").descending()));
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @GetMapping("/students/at-risk")
    @Operation(summary = "Get At-Risk Students", description = "Retrieves students classified as AT_RISK by the Random Forest prediction engine")
    public ResponseEntity<ApiResponse<List<AtRiskStudentDto>>> getAtRiskStudents() {
        List<AtRiskStudentDto> atRiskStudents = staffService.getAtRiskStudents();
        return ResponseEntity.ok(ApiResponse.success(atRiskStudents));
    }

    @GetMapping("/analytics/readiness")
    @Operation(summary = "Get Placement Readiness Analytics", description = "Aggregates overall student readiness counts, score distributions, and averages")
    public ResponseEntity<ApiResponse<ReadinessAnalyticsDto>> getReadinessAnalytics() {
        ReadinessAnalyticsDto analytics = staffService.getReadinessAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/analytics/skill-gaps")
    @Operation(summary = "Get Institutional Skill Gap Analytics", description = "Identifies most prevalent skill gaps across all active recruitment requirements")
    public ResponseEntity<ApiResponse<SkillGapAnalyticsDto>> getSkillGapAnalytics() {
        SkillGapAnalyticsDto analytics = staffService.getSkillGapAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/skill-gaps/students")
    @Operation(summary = "Get Student-Level Skill Gaps", description = "Lists individual students with actual skill deficits compared against company requirements")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.staff.StudentSkillGapDto>>> getStudentSkillGaps(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String skillLevel,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String search) {
        List<com.careerready.dto.staff.StudentSkillGapDto> gaps = staffService.getStudentSkillGaps(
                department, skill, company, skillLevel, priority, search);
        return ResponseEntity.ok(ApiResponse.success(gaps));
    }

    @GetMapping("/skill-gaps/students/{studentId}")
    @Operation(summary = "Get Student Skill Gap Detail", description = "Detailed skill gap view showing met skills and skills requiring improvement")
    public ResponseEntity<ApiResponse<com.careerready.dto.staff.StudentSkillGapDetailDto>> getStudentSkillGapDetail(
            @org.springframework.web.bind.annotation.PathVariable Long studentId,
            @RequestParam(required = false) Long companyId) {
        com.careerready.dto.staff.StudentSkillGapDetailDto detail = staffService.getStudentSkillGapDetail(studentId, companyId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @GetMapping("/analytics/companies")
    @Operation(summary = "Get Company Recruitment Drive Analytics", description = "Aggregates eligibility criteria, required skills, and candidate compatibility for all active companies")
    public ResponseEntity<ApiResponse<List<StaffCompanyAnalyticsDto>>> getCompanyAnalytics() {
        List<StaffCompanyAnalyticsDto> analytics = staffService.getCompanyAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/companies/{companyId}/eligible-students")
    @Operation(summary = "Get Eligible Students for Company", description = "Retrieves students evaluated against specific company cutoffs and mandatory skills")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.staff.CompanyEligibleStudentDto>>> getEligibleStudentsForCompany(
            @org.springframework.web.bind.annotation.PathVariable Long companyId,
            @RequestParam(required = false, defaultValue = "ELIGIBLE") String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String search) {
        List<com.careerready.dto.staff.CompanyEligibleStudentDto> eligibleStudents =
                staffService.getEligibleStudentsForCompany(companyId, status, department, search);
        return ResponseEntity.ok(ApiResponse.success(eligibleStudents));
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get Staff Dashboard Metrics", description = "Retrieves high-level counts and statistics for placement staff dashboard")
    public ResponseEntity<ApiResponse<com.careerready.dto.staff.StaffDashboardDto>> getDashboard(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(staffService.getStaffDashboard(userId)));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get Staff Profile", description = "Retrieves authenticated placement staff profile information")
    public ResponseEntity<ApiResponse<com.careerready.dto.common.UserProfileDto>> getProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(staffService.getStaffProfile(userId)));
    }

    @GetMapping("/my-students")
    @Operation(summary = "Get My Assigned Students", description = "Retrieves students explicitly assigned to this staff member as mentor")
    public ResponseEntity<ApiResponse<List<StaffStudentItemDto>>> getMyAssignedStudents(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(staffService.getMyAssignedStudents(userId)));
    }
}
