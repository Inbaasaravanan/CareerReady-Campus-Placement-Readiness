package com.careerready.dto.readiness;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PythonMlPredictResponse {
    private String model;
    private String version;
    private String readinessCategory;
    private Double readinessScore;
    private Double confidence;
    private Map<String, Double> probabilities;
    private Map<String, Object> features;
}
