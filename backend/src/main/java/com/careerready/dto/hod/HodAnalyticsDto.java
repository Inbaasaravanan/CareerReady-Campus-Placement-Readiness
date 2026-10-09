package com.careerready.dto.hod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodAnalyticsDto {
    private Long totalStudents;
    private Double averageReadiness;
    private Long highlyReady;
    private Long ready;
    private Long needsImprovement;
    private Long atRisk;
    private Double averageAptitude;
    private Double averageTechnical;
}
