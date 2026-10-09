package com.careerready.dto.company;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    private String name;

    private String description;

    @NotNull(message = "Required CGPA is mandatory")
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private Double requiredCgpa;

    @Min(0) @Max(100)
    private Integer minimumAptitudeScore;

    @Min(0) @Max(100)
    private Integer minimumTechnicalScore;

    private Boolean active = true;

    private List<CompanySkillRequirementDto> skills;
}
