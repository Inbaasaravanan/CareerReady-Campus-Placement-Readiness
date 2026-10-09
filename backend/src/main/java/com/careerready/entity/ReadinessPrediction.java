package com.careerready.entity;

import com.careerready.enums.ReadinessClassification;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "readiness_predictions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReadinessPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "readiness_score", nullable = false)
    private Double readinessScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReadinessClassification classification;

    @Column(name = "academic_score")
    private Double academicScore;

    @Column(name = "aptitude_score")
    private Double aptitudeScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "programming_score")
    private Double programmingScore;

    @Column(name = "technical_skill_score")
    private Double technicalSkillScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "problem_solving_score")
    private Double problemSolvingScore;

    @Column(name = "teamwork_score")
    private Double teamworkScore;

    @CreationTimestamp
    @Column(name = "prediction_date")
    private LocalDateTime predictionDate;

    @Column(name = "model_version", length = 50)
    private String modelVersion;
}
