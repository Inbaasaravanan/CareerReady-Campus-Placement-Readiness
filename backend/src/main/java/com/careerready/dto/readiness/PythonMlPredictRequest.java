package com.careerready.dto.readiness;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PythonMlPredictRequest {
    private Long studentId;
    private Double cgpa;
    private Double academicScore;
    private Double aptitudeScore;
    private Double technicalScore;
    private Double programmingScore;
    private Double technicalSkillsScore;
    private Double communicationScore;
    private Double problemSolvingScore;
    private Double teamworkScore;
    private Integer backlogs;
}
