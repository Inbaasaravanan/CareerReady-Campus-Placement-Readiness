package com.careerready.dto.staff;

import com.careerready.enums.ReadinessClassification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffStudentItemDto {
    private Long id;
    private Long studentId;
    private String registerNumber;
    private String studentName;
    private String name; // Alias
    private String email;
    private String department;
    private String departmentName; // Alias for frontend
    private Integer year;
    private Double cgpa;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Integer readinessScore;
    private ReadinessClassification classification;
    private String classificationDisplay;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffEmail;
    private java.util.List<String> skillGaps;
    private String deficitArea;
    private String status;
}
