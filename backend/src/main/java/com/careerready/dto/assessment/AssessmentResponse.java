package com.careerready.dto.assessment;

import com.careerready.enums.AssessmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResponse {
    private Long assessmentId;
    private AssessmentType type;
    private Integer totalQuestions;
    private Integer durationMinutes;
    private List<AssessmentQuestionResponse> questions;
}
