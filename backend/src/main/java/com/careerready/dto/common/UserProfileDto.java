package com.careerready.dto.common;

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
public class UserProfileDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private String department;
    private Long departmentId;
    private String phone;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
