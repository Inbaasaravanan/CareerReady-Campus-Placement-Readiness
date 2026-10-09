package com.careerready.config;

import com.careerready.enums.ReadinessClassification;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.readiness")
@Getter
@Setter
public class ReadinessConfig {

    private Threshold threshold = new Threshold();
    private String modelVersion = "RandomForest-v2.1-Ensemble50";

    // Feature weights for ML model feature synthesis (sums to 1.0)
    private double academicWeight = 0.25;
    private double aptitudeWeight = 0.20;
    private double technicalWeight = 0.20;
    private double programmingWeight = 0.15;
    private double technicalSkillsWeight = 0.10;
    private double communicationWeight = 0.10;

    public static class Threshold {
        private double highlyReady = 85.0;
        private double ready = 70.0;
        private double needsImprovement = 55.0;

        public double getHighlyReady() { return highlyReady; }
        public void setHighlyReady(double highlyReady) { this.highlyReady = highlyReady; }
        public double getReady() { return ready; }
        public void setReady(double ready) { this.ready = ready; }
        public double getNeedsImprovement() { return needsImprovement; }
        public void setNeedsImprovement(double needsImprovement) { this.needsImprovement = needsImprovement; }
    }

    public double getHighlyReadyThreshold() {
        return threshold != null ? threshold.getHighlyReady() : 85.0;
    }

    public double getReadyThreshold() {
        return threshold != null ? threshold.getReady() : 70.0;
    }

    public double getNeedsImprovementThreshold() {
        return threshold != null ? threshold.getNeedsImprovement() : 55.0;
    }

    /**
     * Centralized classification logic based on threshold properties.
     */
    public ReadinessClassification classify(double score) {
        if (score >= getHighlyReadyThreshold()) {
            return ReadinessClassification.HIGHLY_READY;
        } else if (score >= getReadyThreshold()) {
            return ReadinessClassification.READY;
        } else if (score >= getNeedsImprovementThreshold()) {
            return ReadinessClassification.NEEDS_IMPROVEMENT;
        } else {
            return ReadinessClassification.AT_RISK;
        }
    }
}
