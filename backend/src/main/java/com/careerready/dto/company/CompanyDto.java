package com.careerready.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDto {
    private Long id;
    private String name;
    private String description;
    private Double requiredCgpa;
    private Integer minimumAptitudeScore;
    private Integer minimumTechnicalScore;
    private Boolean active;
    private List<CompanySkillRequirementDto> skills;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
