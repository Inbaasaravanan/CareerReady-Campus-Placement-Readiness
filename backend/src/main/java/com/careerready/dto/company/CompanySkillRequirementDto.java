package com.careerready.dto.company;

import com.careerready.enums.SkillLevel;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySkillRequirementDto {
    private Long skillId;
    private String skillName;

    @NotNull(message = "Required level is mandatory")
    private SkillLevel requiredLevel;

    private Boolean mandatory;
}
