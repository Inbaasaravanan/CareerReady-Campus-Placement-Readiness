package com.careerready.dto.admin;

import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingApprovalDto {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private Role role;
    private String identifier; // Employee ID or Institutional ID
    private String department;
    private String departmentName; // Alias for frontend
    private Long departmentId;
    private String departmentAuthority;
    private String phone;
    private UserStatus status;
    private LocalDateTime registeredAt;
    private LocalDateTime createdAt;

    public LocalDateTime getCreatedAt() {
        return createdAt != null ? createdAt : registeredAt;
    }

    public LocalDateTime getRegisteredAt() {
        return registeredAt != null ? registeredAt : createdAt;
    }
}
