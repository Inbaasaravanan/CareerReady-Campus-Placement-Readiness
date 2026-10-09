package com.careerready.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {
    private long totalStudents;
    private long totalStaff;
    private long totalHod;
    private long pendingApprovals;
    private long totalCompanies;
    private long totalDepartments;
    private long totalSkills;
    private long totalQuestions;
}
