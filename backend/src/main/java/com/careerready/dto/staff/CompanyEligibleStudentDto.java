package com.careerready.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyEligibleStudentDto {
    private Long studentId;
    private Long id; // alias
    private String studentName;
    private String name; // alias
    private String registerNumber;
    private String department;
    private String departmentName; // alias
    private Integer year;
    private Double cgpa;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Boolean assessmentsCompleted;
    private String assessmentStatus; // "Completed", "Pending Aptitude", "Pending Technical", "Not Completed"

    private List<String> matchedSkills;
    private List<String> skillGaps;
    private List<String> requiredSkills;
    private Integer matchPercentage;
    private String eligibilityStatus; // "Eligible", "Borderline", "Needs Improvement"
    private Boolean isEligible;

    // Company Context
    private Long companyId;
    private String companyName;
    private Double requiredCgpa;
    private Integer minimumAptitudeScore;
    private Integer minimumTechnicalScore;
}
