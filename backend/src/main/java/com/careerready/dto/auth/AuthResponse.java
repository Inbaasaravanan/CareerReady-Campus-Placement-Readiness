package com.careerready.dto.auth;

import com.careerready.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private Long studentId;
    private String name;
    private String email;
    private Role role;
    private String status;
}
