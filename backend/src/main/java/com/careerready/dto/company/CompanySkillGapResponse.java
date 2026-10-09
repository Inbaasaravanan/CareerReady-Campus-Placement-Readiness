package com.careerready.dto.company;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanySkillGapResponse {
    private Long companyId;
    private String companyName;
    private List<SkillGapItemDto> skillGaps;
}
