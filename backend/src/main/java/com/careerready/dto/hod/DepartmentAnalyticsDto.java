package com.careerready.dto.hod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentAnalyticsDto {
    private Long departmentId;
    private String department;
    private String departmentName; // Alias for frontend
    private String code;
    private Long studentCount;
    private Double averageCgpa;
    private Double averageReadiness;
    private Long atRiskCount;
}
