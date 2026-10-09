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
public class HodDto {
    private Long id;
    private Long userId;
    private String name;
    private String institutionalId;
    private String email;
    private String department;
    private Long departmentId;
    private String departmentAuthority;
    private String phone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private String approvedBy;
    private boolean isComplete;
}
