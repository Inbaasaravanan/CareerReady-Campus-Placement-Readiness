package com.careerready;

import com.careerready.config.ReadinessConfig;
import com.careerready.dto.readiness.ReadinessPredictRequest;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.enums.ReadinessClassification;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.ReadinessPredictionRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.service.impl.RandomForestPredictionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PredictionServiceTest {

    private ReadinessConfig readinessConfig;

    @Mock
    private ReadinessPredictionRepository readinessPredictionRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private com.careerready.repository.StudentAcademicRecordRepository studentAcademicRecordRepository;

    @Mock
    private com.careerready.repository.StudentSkillRepository studentSkillRepository;

    @Mock
    private com.careerready.service.PythonMlService pythonMlService;

    private RandomForestPredictionService predictionService;

    @BeforeEach
    void setUp() {
        readinessConfig = new ReadinessConfig();
        predictionService = new RandomForestPredictionService(
                readinessConfig,
                readinessPredictionRepository,
                studentRepository,
                assessmentRepository,
                studentAcademicRecordRepository,
                studentSkillRepository,
                pythonMlService
        );
    }

    @Test
    @DisplayName("Should classify high performing student as HIGHLY_READY")
    void testPredictHighPerformance() {
        ReadinessPredictRequest request = ReadinessPredictRequest.builder()
                .cgpa(9.5)
                .academicScore(95)
                .aptitudeScore(90)
                .technicalScore(92)
                .programmingScore(94)
                .technicalSkillScore(90)
                .communicationScore(88)
                .problemSolvingScore(90)
                .teamworkScore(88)
                .backlogs(0)
                .build();

        when(pythonMlService.predict(any())).thenReturn(
                com.careerready.dto.readiness.PythonMlPredictResponse.builder()
                        .model("RandomForestClassifier")
                        .version("RandomForest-v2.5-ScikitLearn")
                        .readinessCategory("HIGHLY_READY")
                        .readinessScore(92.0)
                        .confidence(0.92)
                        .build()
        );

        ReadinessResponse response = predictionService.predict(request);

        assertNotNull(response);
        assertTrue(response.getReadinessScore() >= 85);
        assertEquals(ReadinessClassification.HIGHLY_READY, response.getClassification());
        assertNotNull(response.getFactors());
        assertEquals(6, response.getFactors().size());
    }

    @Test
    @DisplayName("Should classify struggling student with backlogs as AT_RISK")
    void testPredictAtRiskClassification() {
        ReadinessPredictRequest request = ReadinessPredictRequest.builder()
                .cgpa(5.5)
                .academicScore(55)
                .aptitudeScore(45)
                .technicalScore(48)
                .programmingScore(40)
                .technicalSkillScore(45)
                .communicationScore(50)
                .problemSolvingScore(45)
                .teamworkScore(50)
                .backlogs(3)
                .build();

        when(pythonMlService.predict(any())).thenReturn(
                com.careerready.dto.readiness.PythonMlPredictResponse.builder()
                        .model("RandomForestClassifier")
                        .version("RandomForest-v2.5-ScikitLearn")
                        .readinessCategory("AT_RISK")
                        .readinessScore(36.0)
                        .confidence(0.95)
                        .build()
        );

        ReadinessResponse response = predictionService.predict(request);

        assertNotNull(response);
        assertTrue(response.getReadinessScore() < 55);
        assertEquals(ReadinessClassification.AT_RISK, response.getClassification());
        assertTrue(response.getAreasToImprove().size() > 0);
    }

    @Test
    @DisplayName("Should classify average student as READY")
    void testPredictReadyClassification() {
        ReadinessPredictRequest request = ReadinessPredictRequest.builder()
                .cgpa(7.5)
                .academicScore(75)
                .aptitudeScore(75)
                .technicalScore(75)
                .programmingScore(75)
                .technicalSkillScore(70)
                .communicationScore(72)
                .problemSolvingScore(74)
                .teamworkScore(75)
                .backlogs(0)
                .build();

        when(pythonMlService.predict(any())).thenReturn(
                com.careerready.dto.readiness.PythonMlPredictResponse.builder()
                        .model("RandomForestClassifier")
                        .version("RandomForest-v2.5-ScikitLearn")
                        .readinessCategory("READY")
                        .readinessScore(77.0)
                        .confidence(0.85)
                        .build()
        );

        ReadinessResponse response = predictionService.predict(request);

        assertNotNull(response);
        assertTrue(response.getReadinessScore() >= 70 && response.getReadinessScore() < 85);
        assertEquals(ReadinessClassification.READY, response.getClassification());
    }
}
