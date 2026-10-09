package com.careerready.dto.hod;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignMentorRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Staff ID is required")
    private Long staffId;
}
