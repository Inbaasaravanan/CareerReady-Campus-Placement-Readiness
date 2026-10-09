package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.skill.UpdateStudentSkillsRequest;
import com.careerready.dto.student.StudentProfileResponse;
import com.careerready.dto.student.UpdateStudentProfileRequest;
import com.careerready.security.UserPrincipal;
import com.careerready.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Student Profile", description = "Student profile management and performance tracking")
public class StudentController {

    private final StudentService studentService;

    @GetMapping("/me")
    @Operation(summary = "Get Current Student Profile", description = "Retrieves academic, performance, skills, readiness, and company matching details for current student")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        StudentProfileResponse profile = studentService.getProfileByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    @Operation(summary = "Update Current Student Profile", description = "Updates student academic scores, skills, and triggers readiness re-evaluation")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateStudentProfileRequest request) {

        StudentProfileResponse updated = studentService.updateProfile(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    @PutMapping("/me/skills")
    @Operation(summary = "Update Current Student Skills", description = "Updates student technical and soft skills inventory")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMySkills(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody UpdateStudentSkillsRequest request) {

        StudentProfileResponse updated = studentService.updateSkills(userPrincipal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Skills updated successfully", updated));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Student by ID", description = "Retrieves student profile by student ID (accessible to staff, HOD, and admin)")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getStudentById(@PathVariable Long id) {
        StudentProfileResponse profile = studentService.getProfileByStudentId(id);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }
}
