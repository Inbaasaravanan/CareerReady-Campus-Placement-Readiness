package com.careerready.dto.hod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodDashboardDto {
    private long totalStudents;
    private long studentsAssessed;
    private long studentsReady;
    private long studentsNeedingImprovement;
    private long atRiskStudents;
    private long activeCompanies;
    private double averageReadinessScore;
    private double averageAptitudeScore;
    private double averageTechnicalScore;
    private long totalStaff;
    private long totalMentorships;
}
