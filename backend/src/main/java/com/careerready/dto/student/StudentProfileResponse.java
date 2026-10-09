package com.careerready.dto.student;

import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.dto.skill.StudentSkillDto;
import com.careerready.enums.ReadinessClassification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileResponse {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String registerNumber;
    private Long departmentId;
    private String department;
    private String departmentName;
    private Integer year;
    private Double cgpa;
    private Double tenthPercentage;
    private Double twelfthPercentage;
    private Integer backlogs;

    private Integer communicationScore;
    private Integer problemSolvingScore;
    private Integer teamworkScore;
    private Integer programmingScore;
    private Integer technicalSkillScore;
    private Integer technicalSkillsScore; // Alias

    // Synthesized assessment scores
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Integer academicScore;
    private Integer readinessScore;
    private ReadinessClassification classification;
    private String classificationDisplay;

    private List<StudentSkillDto> skills;
    private List<SemesterMarkDto> semesterMarks;
    private List<String> skillGaps;
    private Map<String, AssessmentResultResponse> assessmentStatus;
    private List<CompanyMatchResponse> companyMatches;
    private ReadinessResponse latestReadiness;

    private String status;
    private LocalDateTime lastLoginAt;
    private String mentorName;
    private String mentorEmail;
    private Long mentorStaffId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
