package com.careerready.controller;

import com.careerready.dto.admin.CreateUserRequest;
import com.careerready.dto.admin.DepartmentDto;
import com.careerready.dto.admin.DepartmentRequest;
import com.careerready.dto.admin.HodDto;
import com.careerready.dto.admin.HodRequest;
import com.careerready.dto.admin.StaffDto;
import com.careerready.dto.admin.StaffRequest;
import com.careerready.dto.admin.UpdateUserRequest;
import com.careerready.dto.admin.UserDto;
import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.company.CompanyDto;
import com.careerready.dto.company.CompanyRequest;
import com.careerready.dto.skill.SkillDto;
import com.careerready.dto.skill.SkillRequest;
import com.careerready.dto.student.StudentProfileResponse;
import com.careerready.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Administration", description = "Admin CRUD APIs for Users, Students, Staff, HOD, Departments, Companies, and Skills")
public class AdminController {

    private final AdminService adminService;

    // --- USERS ---
    @GetMapping("/users")
    @Operation(summary = "List Users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @GetMapping("/users/{id}")
    @Operation(summary = "Get User by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getUserById(id)));
    }

    @PostMapping("/users")
    @Operation(summary = "Create User")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully", adminService.createUser(request)));
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update User")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", adminService.updateUser(id, request)));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete User")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    // --- STUDENTS ---
    @GetMapping("/students")
    @Operation(summary = "List All Students")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> getAllStudents() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllStudents()));
    }

    @DeleteMapping("/students/{id}")
    @Operation(summary = "Delete Student")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable Long id) {
        adminService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted successfully", null));
    }

    // --- STAFF ---
    @GetMapping("/staff")
    @Operation(summary = "List Placement Staff")
    public ResponseEntity<ApiResponse<List<StaffDto>>> getAllStaff() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllStaff()));
    }

    @PostMapping("/staff")
    @Operation(summary = "Create Placement Staff")
    public ResponseEntity<ApiResponse<StaffDto>> createStaff(@Valid @RequestBody StaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Staff created successfully", adminService.createStaff(request)));
    }

    @PutMapping("/staff/{id}")
    @Operation(summary = "Update Placement Staff Details")
    public ResponseEntity<ApiResponse<StaffDto>> updateStaff(@PathVariable Long id, @RequestBody StaffRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Staff details updated successfully", adminService.updateStaff(id, request)));
    }

    @DeleteMapping("/staff/{id}")
    @Operation(summary = "Delete Placement Staff")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable Long id) {
        adminService.deleteStaff(id);
        return ResponseEntity.ok(ApiResponse.success("Staff deleted successfully", null));
    }

    // --- HOD ---
    @GetMapping("/hod")
    @Operation(summary = "List Placement HODs")
    public ResponseEntity<ApiResponse<List<HodDto>>> getAllHod() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllHod()));
    }

    @PostMapping("/hod")
    @Operation(summary = "Create Placement HOD")
    public ResponseEntity<ApiResponse<HodDto>> createHod(@Valid @RequestBody HodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("HOD created successfully", adminService.createHod(request)));
    }

    @PutMapping("/hod/{id}")
    @Operation(summary = "Update Placement HOD Details")
    public ResponseEntity<ApiResponse<HodDto>> updateHod(@PathVariable Long id, @RequestBody HodRequest request) {
        return ResponseEntity.ok(ApiResponse.success("HOD details updated successfully", adminService.updateHod(id, request)));
    }

    @DeleteMapping("/hod/{id}")
    @Operation(summary = "Delete Placement HOD")
    public ResponseEntity<ApiResponse<Void>> deleteHod(@PathVariable Long id) {
        adminService.deleteHod(id);
        return ResponseEntity.ok(ApiResponse.success("HOD deleted successfully", null));
    }

    // --- DEPARTMENTS ---
    @GetMapping("/departments")
    @Operation(summary = "List Departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllDepartments()));
    }

    @GetMapping("/departments/{id}")
    @Operation(summary = "Get Department by ID")
    public ResponseEntity<ApiResponse<DepartmentDto>> getDepartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDepartmentById(id)));
    }

    @PostMapping("/departments")
    @Operation(summary = "Create Department")
    public ResponseEntity<ApiResponse<DepartmentDto>> createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created successfully", adminService.createDepartment(request)));
    }

    @PutMapping("/departments/{id}")
    @Operation(summary = "Update Department")
    public ResponseEntity<ApiResponse<DepartmentDto>> updateDepartment(@PathVariable Long id, @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", adminService.updateDepartment(id, request)));
    }

    @DeleteMapping("/departments/{id}")
    @Operation(summary = "Delete Department")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        adminService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }

    // --- COMPANIES ---
    @GetMapping("/companies")
    @Operation(summary = "List All Companies (Admin)")
    public ResponseEntity<ApiResponse<List<CompanyDto>>> getAllCompanies() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllCompanies()));
    }

    @GetMapping("/companies/{id}")
    @Operation(summary = "Get Company by ID (Admin)")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompanyById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getCompanyById(id)));
    }

    @PostMapping("/companies")
    @Operation(summary = "Create Company")
    public ResponseEntity<ApiResponse<CompanyDto>> createCompany(@Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Company created successfully", adminService.createCompany(request)));
    }

    @PutMapping("/companies/{id}")
    @Operation(summary = "Update Company")
    public ResponseEntity<ApiResponse<CompanyDto>> updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Company updated successfully", adminService.updateCompany(id, request)));
    }

    @DeleteMapping("/companies/{id}")
    @Operation(summary = "Delete Company")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable Long id) {
        adminService.deleteCompany(id);
        return ResponseEntity.ok(ApiResponse.success("Company deleted successfully", null));
    }

    // --- SKILLS ---
    @GetMapping("/skills")
    @Operation(summary = "List All Skills (Admin)")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getAllSkills() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllSkills()));
    }

    @GetMapping("/skills/{id}")
    @Operation(summary = "Get Skill by ID (Admin)")
    public ResponseEntity<ApiResponse<SkillDto>> getSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getSkillById(id)));
    }

    @PostMapping("/skills")
    @Operation(summary = "Create Skill")
    public ResponseEntity<ApiResponse<SkillDto>> createSkill(@Valid @RequestBody SkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill created successfully", adminService.createSkill(request)));
    }

    @PutMapping("/skills/{id}")
    @Operation(summary = "Update Skill")
    public ResponseEntity<ApiResponse<SkillDto>> updateSkill(@PathVariable Long id, @Valid @RequestBody SkillRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Skill updated successfully", adminService.updateSkill(id, request)));
    }

    @DeleteMapping("/skills/{id}")
    @Operation(summary = "Delete Skill")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable Long id) {
        adminService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.success("Skill deleted successfully", null));
    }

    // --- DASHBOARD ---
    @GetMapping("/dashboard")
    @Operation(summary = "Get Admin Dashboard Metrics")
    public ResponseEntity<ApiResponse<com.careerready.dto.admin.AdminDashboardDto>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getDashboard()));
    }

    // --- APPROVALS ---
    @GetMapping("/pending-approvals")
    @Operation(summary = "List Pending Staff and HOD Approvals")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.admin.PendingApprovalDto>>> getPendingApprovals() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getPendingApprovals()));
    }

    @PostMapping("/approvals/{userId}/approve")
    @Operation(summary = "Approve User Account")
    public ResponseEntity<ApiResponse<String>> approveUser(@PathVariable Long userId) {
        String msg = adminService.approveUser(userId);
        return ResponseEntity.ok(ApiResponse.success(msg, msg));
    }

    @PostMapping("/approvals/{userId}/reject")
    @Operation(summary = "Reject User Account")
    public ResponseEntity<ApiResponse<String>> rejectUser(@PathVariable Long userId) {
        String msg = adminService.rejectUser(userId);
        return ResponseEntity.ok(ApiResponse.success(msg, msg));
    }

    // --- QUESTIONS ---
    @GetMapping("/questions")
    @Operation(summary = "List All Assessment Questions (Admin)")
    public ResponseEntity<ApiResponse<List<com.careerready.dto.assessment.QuestionDto>>> getAllQuestions() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllQuestions()));
    }

    @PutMapping("/questions/{id}")
    @Operation(summary = "Update Assessment Question (Admin)")
    public ResponseEntity<ApiResponse<com.careerready.dto.assessment.QuestionDto>> updateQuestion(
            @PathVariable Long id,
            @RequestBody com.careerready.dto.assessment.QuestionDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", adminService.updateQuestion(id, dto)));
    }
}
