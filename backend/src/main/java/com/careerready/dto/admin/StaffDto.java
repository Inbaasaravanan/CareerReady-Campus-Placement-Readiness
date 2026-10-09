package com.careerready.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffDto {
    private Long id;
    private Long userId;
    private String name;
    private String employeeId;
    private String email;
    private String department;
    private Long departmentId;
    private String phone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private String approvedBy;
    private boolean isComplete;
}
