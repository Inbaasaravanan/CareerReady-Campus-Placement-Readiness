package com.careerready.dto.assessment;

import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResultResponse {
    private Long assessmentId;
    private AssessmentType type;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Integer wrongAnswers;
    private Integer score;
    private Integer percentage;
    private AssessmentStatus status;
    private String performance;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer timeSpentSeconds;
    private Map<String, Object> evaluatedAnswers;
}
