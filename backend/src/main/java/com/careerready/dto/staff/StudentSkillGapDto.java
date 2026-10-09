package com.careerready.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSkillGapDto {
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String department;
    private String departmentName; // Alias for frontend
    private Long skillId;
    private String skill;
    private String skillName; // Alias for frontend
    private String category;
    private String currentLevel; // e.g. "BEGINNER", "NONE"
    private String requiredLevel; // e.g. "ADVANCED", "INTERMEDIATE"
    private String gapStatus; // "Missing Skill", "Below Required Level"
    private String gapPriority; // "HIGH", "MEDIUM", "LOW"
    private Long companyId;
    private String company;
    private String companyName; // Alias for frontend
    private Boolean mandatory;
}
