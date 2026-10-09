package com.careerready.dto.company;

import com.careerready.enums.SkillLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillGapItemDto {
    private String skill;
    private SkillLevel requiredLevel;
    private SkillLevel currentLevel;
    private String gapLevel; // "HIGH" | "MEDIUM" | "LOW"
    private Boolean mandatory;
    private String recommendation;
}
