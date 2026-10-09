package com.careerready.dto.assessment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentHistoryItemDto {
    private String id;
    private String type;
    private Integer score;
    private Integer total;
    private Integer percentage;
    private LocalDateTime date;
    private String status;
}
