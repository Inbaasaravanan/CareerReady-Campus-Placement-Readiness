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
public class StaffAssignmentDto {
    private Long studentId;
    private Long assignmentId;
    private String registerNumber;
    private String studentName;
    private String department;
    private String departmentName;
    private Double cgpa;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Integer readinessScore;
    private String classificationDisplay;
    private String status;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffEmail;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private boolean assigned;
}
