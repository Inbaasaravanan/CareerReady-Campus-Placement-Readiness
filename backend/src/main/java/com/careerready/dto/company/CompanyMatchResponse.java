package com.careerready.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyMatchResponse {
    private Long companyId;
    private Long id; // Alias for frontend
    private String companyName;
    private String name; // Alias for frontend
    private String company; // Alias for frontend
    private String description;

    private Integer matchPercentage;
    private Integer matchScore; // Alias for frontend

    private String eligibilityStatus; // "Eligible" | "Borderline" | "Needs Improvement"
    private String status; // Alias for frontend

    private Double requiredCgpa;
    private Double requiredCGPA; // Alias for frontend

    private Integer minimumAptitudeScore;
    private Integer minimumTechnicalScore;

    private List<String> matchedSkills;
    private List<String> skillGaps;
    private List<String> missingSkills; // Alias for frontend
    private List<String> requiredSkills;

    private String recommendedPreparation;
    private Integer eligibleStudentsCount;
}
