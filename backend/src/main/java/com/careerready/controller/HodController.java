package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.hod.DepartmentAnalyticsDto;
import com.careerready.dto.hod.HodAnalyticsDto;
import com.careerready.dto.hod.HodAtRiskAnalyticsDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;
import com.careerready.service.HodAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hod")
@RequiredArgsConstructor
@Tag(name = "Placement HOD", description = "Institution-level placement performance, department analytics, and at-risk metrics")
public class HodController {

    private final HodAnalyticsService hodAnalyticsService;
    private final com.careerready.service.MentorshipService mentorshipService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get HOD Executive Dashboard Metrics", description = "Retrieves high-level summary counts and placement performance")
    public ResponseEntity<ApiResponse<com.careerready.dto.hod.HodDashboardDto>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(hodAnalyticsService.getHodDashboard()));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get HOD Profile", description = "Retrieves authenticated placement HOD profile information")
    public ResponseEntity<ApiResponse<com.careerready.dto.common.UserProfileDto>> getProfile(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(hodAnalyticsService.getHodProfile(userId)));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get Institution-Level Analytics", description = "Retrieves institution-wide student readiness metrics, score averages, and distribution")
    public ResponseEntity<ApiResponse<HodAnalyticsDto>> getInstitutionAnalytics() {
        HodAnalyticsDto analytics = hodAnalyticsService.getInstitutionAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/analytics/departments")
    @Operation(summary = "Get Department-Wise Analytics", description = "Retrieves readiness, CGPA averages, and at-risk counts broken down by academic department")
    public ResponseEntity<ApiResponse<List<DepartmentAnalyticsDto>>> getDepartmentAnalytics() {
        List<DepartmentAnalyticsDto> analytics = hodAnalyticsService.getDepartmentAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/analytics/at-risk")
    @Operation(summary = "Get HOD At-Risk Analytics", description = "Retrieves total at-risk student count, department-wise distribution, and top skill gaps")
    public ResponseEntity<ApiResponse<HodAtRiskAnalyticsDto>> getAtRiskAnalytics() {
        HodAtRiskAnalyticsDto analytics = hodAnalyticsService.getAtRiskAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/analytics/companies")
    @Operation(summary = "Get HOD Company Analytics", description = "Retrieves recruitment drive eligibility numbers and skill alignment across all partner companies")
    public ResponseEntity<ApiResponse<List<StaffCompanyAnalyticsDto>>> getCompanyAnalytics() {
        List<StaffCompanyAnalyticsDto> analytics = hodAnalyticsService.getCompanyAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @GetMapping("/staff-monitoring")
    @Operation(summary = "Get Staff Monitoring Overview", description = "Retrieves monitoring workload and at-risk detection metrics for placement staff")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.hod.StaffMonitoringDto>>> getStaffMonitoring() {
        List<com.careerready.dto.hod.StaffMonitoringDto> list = hodAnalyticsService.getStaffMonitoring();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    // --- HOD STAFF ASSIGNMENT ENDPOINTS ---

    @GetMapping("/staff-assignment/students")
    @Operation(summary = "Get Department Students for Staff Assignment", description = "Retrieves students in HOD's department with current staff assignment and readiness status")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.hod.StaffAssignmentDto>>> getStaffAssignmentStudents(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long hodUserId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(mentorshipService.getStaffAssignmentsForHod(hodUserId)));
    }

    @GetMapping("/staff-assignment/staff")
    @Operation(summary = "Get Available Staff for Assignment", description = "Retrieves active placement staff with their assigned student caseloads")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.hod.StaffAvailableDto>>> getAvailableStaff(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long hodUserId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(mentorshipService.getAvailableStaff(hodUserId)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/staff-assignment/assign")
    @Operation(summary = "Assign Selected Students to Staff", description = "Assigns one or more students to a placement staff member")
    public ResponseEntity<ApiResponse<String>> bulkAssignStudents(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.careerready.dto.hod.BulkAssignStaffRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long hodUserId = principal != null ? principal.getId() : null;
        mentorshipService.bulkAssignStudentsToStaff(request, hodUserId);
        return ResponseEntity.ok(ApiResponse.success("Students assigned to staff successfully", "Students assigned successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/staff-assignment/reassign")
    @Operation(summary = "Reassign Student to Another Staff", description = "Reassigns a specific student to a new placement staff member")
    public ResponseEntity<ApiResponse<com.careerready.dto.hod.StaffAssignmentDto>> reassignStudent(
            @RequestParam Long studentId,
            @RequestParam Long staffId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long hodUserId = principal != null ? principal.getId() : null;
        com.careerready.dto.hod.StaffAssignmentDto dto = mentorshipService.assignSingleStudent(studentId, staffId, hodUserId);
        return ResponseEntity.ok(ApiResponse.success("Student reassigned successfully", dto));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/staff-assignment/unassign/{studentId}")
    @Operation(summary = "Unassign Student from Staff", description = "Removes staff assignment for a student")
    public ResponseEntity<ApiResponse<Void>> unassignStudent(@org.springframework.web.bind.annotation.PathVariable Long studentId) {
        mentorshipService.unassignStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success("Student unassigned successfully", null));
    }

    // Legacy endpoints kept for backward compatibility
    @GetMapping("/mentor-assignments")
    @Operation(summary = "Get All Mentor Assignments", description = "Retrieves students and their assigned placement staff mentors")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.hod.MentorAssignmentDto>>> getMentorAssignments() {
        return ResponseEntity.ok(ApiResponse.success(mentorshipService.getAllAssignments()));
    }

    @org.springframework.web.bind.annotation.PostMapping("/mentor-assignments")
    @Operation(summary = "Assign Staff Mentor to Student", description = "Creates or updates active mentorship assignment")
    public ResponseEntity<ApiResponse<com.careerready.dto.hod.MentorAssignmentDto>> assignMentor(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.careerready.dto.hod.AssignMentorRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long assignedBy = principal != null ? principal.getId() : null;
        var assignment = mentorshipService.assignMentor(request, assignedBy);
        return ResponseEntity.ok(ApiResponse.success("Mentor assigned successfully", assignment));
    }

    @org.springframework.web.bind.annotation.PutMapping("/mentor-assignments/{id}")
    @Operation(summary = "Change Staff Mentor", description = "Updates mentor assignment for student")
    public ResponseEntity<ApiResponse<com.careerready.dto.hod.MentorAssignmentDto>> updateMentor(
            @org.springframework.web.bind.annotation.PathVariable Long id,
            @RequestParam Long staffId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.careerready.security.UserPrincipal principal) {
        Long updatedBy = principal != null ? principal.getId() : null;
        var assignment = mentorshipService.updateMentor(id, staffId, updatedBy);
        return ResponseEntity.ok(ApiResponse.success("Mentor updated successfully", assignment));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/mentor-assignments/{id}")
    @Operation(summary = "Remove Mentor Assignment", description = "Deactivates mentorship assignment")
    public ResponseEntity<ApiResponse<Void>> removeMentor(@org.springframework.web.bind.annotation.PathVariable Long id) {
        mentorshipService.removeMentor(id);
        return ResponseEntity.ok(ApiResponse.success("Mentor assignment removed successfully", null));
    }
}
