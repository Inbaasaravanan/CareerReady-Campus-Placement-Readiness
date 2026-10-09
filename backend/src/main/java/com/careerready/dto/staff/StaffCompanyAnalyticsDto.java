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
public class StaffCompanyAnalyticsDto {
    private Long companyId;
    private Long id; // Alias
    private String company;
    private String companyName; // Alias
    private String description;
    private Double requiredCgpa;
    private Integer minimumAptitudeScore;
    private Integer minimumTechnicalScore;
    private List<String> requiredSkills;
    private Long eligibleStudents;
    private Long eligibleStudentCount; // Alias
    private Long totalStudents;
    private Double averageMatchPercentage;
    private List<String> topMatchedSkills;
    private List<String> commonSkillGaps;
}
