package com.careerready.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessAnalyticsDto {
    private Long totalStudents;
    private Long assessmentsCompleted;
    private Double averageAptitudeScore;
    private Double averageTechnicalScore;
    private Double averageReadinessScore;
    private Long highlyReadyCount;
    private Long readyCount;
    private Long needsImprovementCount;
    private Long atRiskCount;
}
