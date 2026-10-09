package com.careerready.dto.assessment;

import com.careerready.enums.AssessmentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StartAssessmentRequest {

    @NotNull(message = "Assessment type is required")
    private AssessmentType type;
}
