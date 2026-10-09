package com.careerready.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Institutional ID is required")
    private String institutionalId;

    @NotBlank(message = "Department Authority is required")
    private String departmentAuthority;

    private String password;

    private String department;
    private Long departmentId;
    private String phone;
    private String status;
}
