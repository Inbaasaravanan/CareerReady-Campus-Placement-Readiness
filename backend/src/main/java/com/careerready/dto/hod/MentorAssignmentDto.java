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
public class MentorAssignmentDto {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registerNumber;
    private String department;
    private String departmentName;
    private Integer readinessScore;
    private String classificationDisplay;
    private Long staffId;
    private String staffName;
    private String staffEmail;
    private String staffDepartment;
    private String assignedByName;
    private LocalDateTime assignedAt;
    private boolean active;
}
