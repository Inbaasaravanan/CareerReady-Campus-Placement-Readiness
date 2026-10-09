package com.careerready.dto.readiness;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessPredictRequest {

    private Long studentId;

    @NotNull(message = "CGPA is required")
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private Double cgpa;

    @Min(0) @Max(100)
    private Integer academicScore;

    @Min(0) @Max(100)
    private Integer aptitudeScore;

    @Min(0) @Max(100)
    private Integer technicalScore;

    @Min(0) @Max(100)
    private Integer programmingScore;

    @Min(0) @Max(100)
    private Integer technicalSkillScore;

    @Min(0) @Max(100)
    private Integer communicationScore;

    @Min(0) @Max(100)
    private Integer problemSolvingScore;

    @Min(0) @Max(100)
    private Integer teamworkScore;

    @Min(0)
    private Integer backlogs;
}
