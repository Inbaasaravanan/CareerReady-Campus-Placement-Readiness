package com.careerready.dto.assessment;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerSubmissionDto {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private String selectedAnswer;
}
