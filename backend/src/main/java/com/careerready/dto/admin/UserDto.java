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
public class UserDto {
    private Long id;
    private String name;
    private String userName;
    private String email;
    private Role role;
    private UserStatus status;
    private String department;
    private String departmentName;
    private String departmentCode;
    private Long departmentId;
    private LocalDateTime lastLogin;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
