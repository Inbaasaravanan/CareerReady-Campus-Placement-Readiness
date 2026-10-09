package com.careerready.dto.hod;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffAvailableDto {
    private Long id;
    private Long staffId;
    private Long userId;
    private String name;
    private String email;
    private String employeeId;
    private String department;
    private long assignedCount;
}
