package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.company.CompanyDto;
import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.company.CompanySkillGapResponse;
import com.careerready.entity.Student;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.StudentRepository;
import com.careerready.security.UserPrincipal;
import com.careerready.service.AdminService;
import com.careerready.service.CompanyMatchingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "Companies & Matching", description = "Company Recruitment, Dynamic Matching, and Company-Specific Skill Gaps")
public class CompanyController {

    private final CompanyMatchingService companyMatchingService;
    private final AdminService adminService;
    private final StudentRepository studentRepository;

    @GetMapping("/matches/student/{studentId}")
    @Operation(summary = "Get Company Matches for Student", description = "Calculates recruitment matching and eligibility across all companies for a given student")
    public ResponseEntity<ApiResponse<List<CompanyMatchResponse>>> getMatchesForStudent(
            @PathVariable Long studentId,
            @RequestParam(required = false, defaultValue = "All") String filter) {

        List<CompanyMatchResponse> matches = companyMatchingService.getCompanyMatchesForStudent(studentId, filter);
        return ResponseEntity.ok(ApiResponse.success(matches));
    }

    @GetMapping("/{companyId}/skill-gaps/student/{studentId}")
    @Operation(summary = "Get Company-Specific Skill Gaps for Student", description = "Dynamically evaluates skill gaps tailored specifically to a single company's criteria")
    public ResponseEntity<ApiResponse<CompanySkillGapResponse>> getCompanySkillGapsForStudent(
            @PathVariable Long companyId,
            @PathVariable Long studentId) {

        CompanySkillGapResponse skillGaps = companyMatchingService.getCompanySkillGapsForStudent(companyId, studentId);
        return ResponseEntity.ok(ApiResponse.success(skillGaps));
    }

    @GetMapping("/matches/me")
    @Operation(summary = "Get Company Matches for Current Student", description = "Calculates recruitment matching for the currently logged-in student")
    public ResponseEntity<ApiResponse<List<CompanyMatchResponse>>> getMyCompanyMatches(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false, defaultValue = "All") String filter) {

        Long studentId = resolveStudentId(userPrincipal);
        List<CompanyMatchResponse> matches = companyMatchingService.getCompanyMatchesForStudent(studentId, filter);
        return ResponseEntity.ok(ApiResponse.success(matches));
    }

    @GetMapping("/{companyId}/skill-gaps/me")
    @Operation(summary = "Get Company Skill Gaps for Current Student", description = "Calculates company-specific skill gaps for the currently logged-in student")
    public ResponseEntity<ApiResponse<CompanySkillGapResponse>> getMyCompanySkillGaps(
            @PathVariable Long companyId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long studentId = resolveStudentId(userPrincipal);
        CompanySkillGapResponse skillGaps = companyMatchingService.getCompanySkillGapsForStudent(companyId, studentId);
        return ResponseEntity.ok(ApiResponse.success(skillGaps));
    }

    @GetMapping
    @Operation(summary = "List Active Companies", description = "Retrieves active recruitment partner companies")
    public ResponseEntity<ApiResponse<List<CompanyDto>>> getAllCompanies() {
        List<CompanyDto> companies = adminService.getAllCompanies();
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @GetMapping("/{companyId}")
    @Operation(summary = "Get Company Details", description = "Retrieves detailed information and required skill set for a specific company")
    public ResponseEntity<ApiResponse<CompanyDto>> getCompanyById(@PathVariable Long companyId) {
        CompanyDto company = adminService.getCompanyById(companyId);
        return ResponseEntity.ok(ApiResponse.success(company));
    }

    private Long resolveStudentId(UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            throw new ResourceNotFoundException("Authenticated user not found");
        }
        Student student = studentRepository.findByUserId(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userPrincipal.getUsername()));
        return student.getId();
    }
}
