package com.careerready.dto.staff;

import com.careerready.enums.ReadinessClassification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtRiskStudentDto {
    private Long studentId;
    private Long id; // Alias
    private String registerNumber;
    private String studentName;
    private String name; // Alias
    private String department;
    private String departmentName; // Alias for frontend
    private Integer year;
    private Double cgpa;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Integer readinessScore;
    private ReadinessClassification classification;
    private String classificationDisplay;
    private List<String> mainSkillGaps;
    private List<String> riskFactors;
}
