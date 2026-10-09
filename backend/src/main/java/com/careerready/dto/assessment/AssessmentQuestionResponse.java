package com.careerready.dto.assessment;

import com.careerready.enums.AssessmentType;
import com.careerready.enums.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentQuestionResponse {
    private Long id;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private AssessmentType assessmentType;
    private String topic;
    private DifficultyLevel difficultyLevel;
    private Integer marks;
}
