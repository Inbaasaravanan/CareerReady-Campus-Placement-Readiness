package com.careerready.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAssessmentHistoryResponse {
    private Long studentId;
    private AssessmentResultResponse aptitudeResult;
    private AssessmentResultResponse technicalResult;
    private List<AssessmentResultResponse> assessments;
    private List<AssessmentHistoryItemDto> history;
}
