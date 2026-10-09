package com.careerready.dto.skill;

import com.careerready.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSkillDto {
    private Long skillId;
    private String skillName;
    private String category;
    private SkillLevel currentLevel;
}
