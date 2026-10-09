package com.careerready.dto.hod;

import com.careerready.dto.staff.SkillGapAnalyticsDto.SkillGapCountDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HodAtRiskAnalyticsDto {
    private Long totalAtRiskStudents;
    private Map<String, Long> departmentWiseAtRisk;
    private List<SkillGapCountDto> mostCommonSkillGaps;
}
