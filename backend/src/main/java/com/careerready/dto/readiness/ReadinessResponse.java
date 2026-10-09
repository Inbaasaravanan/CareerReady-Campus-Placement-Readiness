package com.careerready.dto.readiness;

import com.careerready.enums.ReadinessClassification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadinessResponse {
    private Long predictionId;
    private Long studentId;
    private Integer readinessScore;
    private ReadinessClassification classification;
    private String classificationDisplay;

    private Integer academicScore;
    private Integer aptitudeScore;
    private Integer technicalScore;
    private Integer programmingScore;
    private Integer technicalSkillScore;
    private Integer technicalSkillsScore; // Alias for frontend compatibility
    private Integer communicationScore;
    private Integer problemSolvingScore;
    private Integer teamworkScore;

    private String modelVersion;
    private LocalDateTime predictionDate;

    private List<ReadinessFactorDto> factors;
    private List<String> strengths;
    private List<String> areasToImprove;
    private String evaluationNote;
}
