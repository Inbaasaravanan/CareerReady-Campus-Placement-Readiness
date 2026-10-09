package com.careerready.dto.readiness;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessFactorDto {
    private String name;
    private Integer score;
    private String weight;
    private String description;
}
