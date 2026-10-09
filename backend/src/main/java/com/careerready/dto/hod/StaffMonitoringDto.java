package com.careerready.dto.hod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffMonitoringDto {
    private Long staffId;
    private String staffName;
    private String email;
    private String department;
    private String status;
    private Long assignedStudentCount;
    private Long activeMentorships;
    private LocalDateTime lastLoginAt;
    private String lastLogin;

    // Compatibility fields
    private String assignedArea;
    private Long studentsMonitored;
    private Long atRiskStudentsIdentified;
    private Integer reportsGenerated;
    private String lastActivity;
}
