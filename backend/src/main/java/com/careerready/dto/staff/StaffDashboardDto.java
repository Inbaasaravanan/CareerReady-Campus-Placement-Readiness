package com.careerready.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffDashboardDto {
    private long assignedStudentsCount;
    private long totalStudents;
    private long assessmentsCompleted;
    private long atRiskCount;
    private double averageReadinessScore;
    private long highlyReadyCount;
    private long readyCount;
    private long needsImprovementCount;
    private long activeCompanies;
}
