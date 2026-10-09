package com.careerready.dto.admin;

import com.careerready.enums.Role;
import com.careerready.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String name;
    private String email;
    private String password;
    private Role role;
    private UserStatus status;
}
