package com.careerready.dto.staff;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkillGapAnalyticsDto {

    private List<SkillGapCountDto> mostCommonSkillGaps;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillGapCountDto {
        private String skill;
        private Long studentCount;
        private Double percentage;
        private String category;
    }
}
