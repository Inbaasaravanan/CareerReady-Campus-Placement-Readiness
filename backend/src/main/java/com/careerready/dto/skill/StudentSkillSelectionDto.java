package com.careerready.dto.skill;

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
public class StudentSkillSelectionDto {

    @NotNull(message = "Skill ID is required")
    private Long skillId;

    private String skillName;

    @NotNull(message = "Skill level is required")
    private SkillLevel level;
}
