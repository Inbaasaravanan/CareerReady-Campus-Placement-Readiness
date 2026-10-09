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
public class StudentSkillGapDetailDto {
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String department;
    private Double cgpa;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Boolean assessmentsCompleted;
    
    private List<SkillGapDetailItem> skillsRequiringImprovement;
    private List<SkillMetDetailItem> skillsCurrentlyMet;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillGapDetailItem {
        private String skill;
        private String category;
        private String currentLevel;
        private String requiredLevel;
        private String gapLevel; // "HIGH" | "MEDIUM" | "LOW"
        private String companyName;
        private Boolean mandatory;
        private String recommendation;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillMetDetailItem {
        private String skill;
        private String category;
        private String currentLevel;
        private String requiredLevel;
        private String companyName;
        private String status; // "Meets Requirement" | "Exceeds Requirement"
    }
}
