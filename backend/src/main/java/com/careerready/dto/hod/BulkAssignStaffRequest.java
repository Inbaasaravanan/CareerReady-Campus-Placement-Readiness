package com.careerready.dto.hod;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAssignStaffRequest {
    @NotEmpty(message = "At least one student must be selected")
    private List<Long> studentIds;

    @NotNull(message = "Staff ID is required")
    private Long staffId;
}
