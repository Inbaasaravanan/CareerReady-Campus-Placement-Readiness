package com.careerready.dto.assessment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAssessmentRequest {

    @NotNull(message = "Answers list is required")
    @Valid
    private List<AnswerSubmissionDto> answers;

    private Integer timeSpentSeconds;
}
