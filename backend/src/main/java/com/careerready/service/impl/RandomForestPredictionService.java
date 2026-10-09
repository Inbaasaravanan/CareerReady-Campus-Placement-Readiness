package com.careerready.service.impl;

import com.careerready.config.ReadinessConfig;
import com.careerready.dto.readiness.PythonMlPredictRequest;
import com.careerready.dto.readiness.PythonMlPredictResponse;
import com.careerready.dto.readiness.ReadinessFactorDto;
import com.careerready.dto.readiness.ReadinessPredictRequest;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.entity.Assessment;
import com.careerready.entity.ReadinessPrediction;
import com.careerready.entity.Student;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import com.careerready.enums.ReadinessClassification;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.ReadinessPredictionRepository;
import com.careerready.repository.StudentAcademicRecordRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.service.PredictionService;
import com.careerready.service.PythonMlService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RandomForestPredictionService implements PredictionService {

    private static final String DEFAULT_MODEL_VERSION = "RandomForest-v2.5-ScikitLearn";

    private final ReadinessConfig readinessConfig;
    private final ReadinessPredictionRepository readinessPredictionRepository;
    private final StudentRepository studentRepository;
    private final AssessmentRepository assessmentRepository;
    private final StudentAcademicRecordRepository studentAcademicRecordRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final PythonMlService pythonMlService;

    @Override
    public ReadinessResponse predict(ReadinessPredictRequest request) {
        double cgpa = request.getCgpa() != null ? request.getCgpa() : 7.0;
        double academicScore = request.getAcademicScore() != null ? request.getAcademicScore()
                : (request.getCgpa() != null ? Math.min(100.0, request.getCgpa() * 10.0) : 75.0);

        double aptitudeScore = request.getAptitudeScore() != null ? request.getAptitudeScore() : 70.0;
        double technicalScore = request.getTechnicalScore() != null ? request.getTechnicalScore() : 70.0;
        double programmingScore = request.getProgrammingScore() != null ? request.getProgrammingScore() : 70.0;
        double technicalSkillScore = request.getTechnicalSkillScore() != null ? request.getTechnicalSkillScore() : 70.0;
        double communicationScore = request.getCommunicationScore() != null ? request.getCommunicationScore() : 70.0;
        double problemSolvingScore = request.getProblemSolvingScore() != null ? request.getProblemSolvingScore() : 70.0;
        double teamworkScore = request.getTeamworkScore() != null ? request.getTeamworkScore() : 70.0;
        int backlogs = request.getBacklogs() != null ? request.getBacklogs() : 0;

        // Dispatch real Random Forest inference to Python Flask ML service
        PythonMlPredictRequest mlRequest = PythonMlPredictRequest.builder()
                .studentId(request.getStudentId())
                .cgpa(cgpa)
                .academicScore(academicScore)
                .aptitudeScore(aptitudeScore)
                .technicalScore(technicalScore)
                .programmingScore(programmingScore)
                .technicalSkillsScore(technicalSkillScore)
                .communicationScore(communicationScore)
                .problemSolvingScore(problemSolvingScore)
                .teamworkScore(teamworkScore)
                .backlogs(backlogs)
                .build();

        PythonMlPredictResponse mlResponse = pythonMlService.predict(mlRequest);

        int finalScore = mlResponse.getReadinessScore() != null
                ? (int) Math.round(mlResponse.getReadinessScore())
                : 0;

        ReadinessClassification classification;
        try {
            classification = ReadinessClassification.valueOf(mlResponse.getReadinessCategory());
        } catch (Exception ex) {
            classification = readinessConfig.classify(finalScore);
        }

        String modelVersion = mlResponse.getVersion() != null ? mlResponse.getVersion() : DEFAULT_MODEL_VERSION;

        return buildResponse(null, request.getStudentId(), finalScore, classification,
                (int) Math.round(academicScore),
                (int) Math.round(aptitudeScore),
                (int) Math.round(technicalScore),
                (int) Math.round(programmingScore),
                (int) Math.round(technicalSkillScore),
                (int) Math.round(communicationScore),
                (int) Math.round(problemSolvingScore),
                (int) Math.round(teamworkScore),
                modelVersion, LocalDateTime.now());
    }

    @Override
    public boolean hasCompletedBothAssessments(Long studentId) {
        if (studentId == null) return false;
        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        boolean hasAptitude = assessments.stream()
                .anyMatch(a -> a.getAssessmentType() == AssessmentType.APTITUDE && a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null);
        boolean hasTechnical = assessments.stream()
                .anyMatch(a -> a.getAssessmentType() == AssessmentType.TECHNICAL && a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null);
        return hasAptitude && hasTechnical;
    }

    @Override
    @Transactional
    public ReadinessPrediction predictAndSaveForStudent(Student student) {
        if (student == null || student.getId() == null) return null;

        // ONLY calculate and save prediction if BOTH assessments have been completed!
        if (!hasCompletedBothAssessments(student.getId())) {
            log.info("Student {} has not completed both assessments. Readiness prediction will not be generated.", student.getId());
            return null;
        }

        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());

        Double aptitudeScore = null;
        Double technicalScore = null;

        for (Assessment a : assessments) {
            if (a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null) {
                if (a.getAssessmentType() == AssessmentType.APTITUDE && aptitudeScore == null) {
                    aptitudeScore = a.getPercentage();
                } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && technicalScore == null) {
                    technicalScore = a.getPercentage();
                }
            }
        }

        if (aptitudeScore == null || technicalScore == null) {
            log.warn("Missing assessment scores for student {}. Skipping readiness prediction.", student.getId());
            return null;
        }

        double cgpa = student.getCgpa() != null ? student.getCgpa() : 0.0;
        double academicScore = Math.min(100.0, cgpa * 10.0);
        List<com.careerready.entity.StudentAcademicRecord> academicRecords = studentAcademicRecordRepository.findByStudentIdOrderBySemesterAsc(student.getId());
        if (!academicRecords.isEmpty()) {
            academicScore = academicRecords.stream()
                    .mapToDouble(com.careerready.entity.StudentAcademicRecord::getMarks)
                    .average()
                    .orElse(academicScore);
        }

        // Derive technical skill score and programming score from real registered skills
        List<com.careerready.entity.StudentSkill> studentSkills = studentSkillRepository.findByStudentId(student.getId());
        int progScore = student.getProgrammingScore() != null ? student.getProgrammingScore() : 70;
        int techSkillScore = student.getTechnicalSkillScore() != null ? student.getTechnicalSkillScore() : 70;
        if (!studentSkills.isEmpty()) {
            double totalLevelScore = 0;
            for (com.careerready.entity.StudentSkill ss : studentSkills) {
                double score = switch (ss.getCurrentLevel()) {
                    case ADVANCED -> 95.0;
                    case INTERMEDIATE -> 80.0;
                    case BEGINNER -> 65.0;
                };
                totalLevelScore += score;
            }
            techSkillScore = (int) Math.round(totalLevelScore / studentSkills.size());
            progScore = techSkillScore;
        }

        int commScore = student.getCommunicationScore() != null ? student.getCommunicationScore() : 70;
        int psScore = student.getProblemSolvingScore() != null ? student.getProblemSolvingScore() : 70;
        int teamScore = student.getTeamworkScore() != null ? student.getTeamworkScore() : 70;
        int backlogs = student.getBacklogs() != null ? student.getBacklogs() : 0;

        // Dispatch real Random Forest inference to Python Flask ML service
        PythonMlPredictRequest mlRequest = PythonMlPredictRequest.builder()
                .studentId(student.getId())
                .cgpa(cgpa)
                .academicScore(academicScore)
                .aptitudeScore(aptitudeScore)
                .technicalScore(technicalScore)
                .programmingScore((double) progScore)
                .technicalSkillsScore((double) techSkillScore)
                .communicationScore((double) commScore)
                .problemSolvingScore((double) psScore)
                .teamworkScore((double) teamScore)
                .backlogs(backlogs)
                .build();

        PythonMlPredictResponse mlResponse = pythonMlService.predict(mlRequest);

        int finalScore = mlResponse.getReadinessScore() != null
                ? (int) Math.round(mlResponse.getReadinessScore())
                : 0;

        ReadinessClassification classification;
        try {
            classification = ReadinessClassification.valueOf(mlResponse.getReadinessCategory());
        } catch (Exception ex) {
            classification = readinessConfig.classify(finalScore);
        }

        String modelVersion = mlResponse.getVersion() != null ? mlResponse.getVersion() : DEFAULT_MODEL_VERSION;

        ReadinessPrediction prediction = ReadinessPrediction.builder()
                .student(student)
                .readinessScore((double) finalScore)
                .classification(classification)
                .academicScore(academicScore)
                .aptitudeScore(aptitudeScore)
                .technicalScore(technicalScore)
                .programmingScore((double) progScore)
                .technicalSkillScore((double) techSkillScore)
                .communicationScore((double) commScore)
                .problemSolvingScore((double) psScore)
                .teamworkScore((double) teamScore)
                .predictionDate(LocalDateTime.now())
                .modelVersion(modelVersion)
                .build();

        return readinessPredictionRepository.save(prediction);
    }

    @Override
    @Transactional(readOnly = true)
    public ReadinessResponse getLatestPredictionForStudent(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        // If both tests are not completed, return readiness response with whatever tests they have completed
        if (!hasCompletedBothAssessments(studentId)) {
            Integer aptScore = assessmentRepository.findTopByStudentIdAndAssessmentTypeAndStatusOrderByCreatedAtDesc(
                    studentId, AssessmentType.APTITUDE, AssessmentStatus.COMPLETED)
                    .map(a -> a.getPercentage() != null ? (int) Math.round(a.getPercentage()) : null)
                    .orElse(null);
            Integer techScore = assessmentRepository.findTopByStudentIdAndAssessmentTypeAndStatusOrderByCreatedAtDesc(
                    studentId, AssessmentType.TECHNICAL, AssessmentStatus.COMPLETED)
                    .map(a -> a.getPercentage() != null ? (int) Math.round(a.getPercentage()) : null)
                    .orElse(null);

            return ReadinessResponse.builder()
                    .studentId(studentId)
                    .readinessScore(null)
                    .classification(null)
                    .classificationDisplay(null)
                    .academicScore(student.getCgpa() != null ? (int) Math.round(student.getCgpa() * 10) : null)
                    .aptitudeScore(aptScore)
                    .technicalScore(techScore)
                    .evaluationNote("Complete both Aptitude and Technical Assessments to generate your Placement Readiness Score.")
                    .build();
        }

        return readinessPredictionRepository.findTopByStudentIdOrderByPredictionDateDesc(studentId)
                .map(this::mapToResponse)
                .orElseGet(() -> {
                    ReadinessPrediction saved = predictAndSaveForStudent(student);
                    return saved != null ? mapToResponse(saved) : ReadinessResponse.builder()
                            .studentId(studentId)
                            .readinessScore(null)
                            .classification(null)
                            .classificationDisplay(null)
                            .evaluationNote("Complete both Aptitude and Technical Assessments to generate your Placement Readiness Score.")
                            .build();
                });
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReadinessResponse> getReadinessHistory(Long studentId) {
        if (!hasCompletedBothAssessments(studentId)) {
            return List.of();
        }
        List<ReadinessPrediction> list = readinessPredictionRepository.findByStudentIdOrderByPredictionDateAsc(studentId);
        return list.stream().map(this::mapToResponse).collect(java.util.stream.Collectors.toList());
    }

    private ReadinessResponse mapToResponse(ReadinessPrediction prediction) {
        return buildResponse(
                prediction.getId(),
                prediction.getStudent() != null ? prediction.getStudent().getId() : null,
                prediction.getReadinessScore() != null ? (int) Math.round(prediction.getReadinessScore()) : 0,
                prediction.getClassification(),
                prediction.getAcademicScore() != null ? (int) Math.round(prediction.getAcademicScore()) : 0,
                prediction.getAptitudeScore() != null ? (int) Math.round(prediction.getAptitudeScore()) : 0,
                prediction.getTechnicalScore() != null ? (int) Math.round(prediction.getTechnicalScore()) : 0,
                prediction.getProgrammingScore() != null ? (int) Math.round(prediction.getProgrammingScore()) : 0,
                prediction.getTechnicalSkillScore() != null ? (int) Math.round(prediction.getTechnicalSkillScore()) : 0,
                prediction.getCommunicationScore() != null ? (int) Math.round(prediction.getCommunicationScore()) : 0,
                prediction.getProblemSolvingScore() != null ? (int) Math.round(prediction.getProblemSolvingScore()) : 0,
                prediction.getTeamworkScore() != null ? (int) Math.round(prediction.getTeamworkScore()) : 0,
                prediction.getModelVersion(),
                prediction.getPredictionDate()
        );
    }

    private ReadinessResponse buildResponse(Long predictionId, Long studentId,
                                            int score, ReadinessClassification classification,
                                            int academic, int aptitude, int technical,
                                            int programming, int techSkill, int communication,
                                            int problemSolving, int teamwork,
                                            String modelVersion, LocalDateTime date) {
        List<ReadinessFactorDto> factors = List.of(
                ReadinessFactorDto.builder()
                        .name("Academic Performance")
                        .score(academic)
                        .weight("25%")
                        .description("Academic track record, coursework consistency, and progression without arrears.")
                        .build(),
                ReadinessFactorDto.builder()
                        .name("Aptitude Assessment")
                        .score(aptitude)
                        .weight("20%")
                        .description("Quantitative analysis, logical reasoning sequences, and verbal accuracy.")
                        .build(),
                ReadinessFactorDto.builder()
                        .name("Technical Assessment")
                        .score(technical)
                        .weight("20%")
                        .description("Computer science fundamentals, OOP, SQL databases, and system architecture.")
                        .build(),
                ReadinessFactorDto.builder()
                        .name("Programming Skills")
                        .score(programming)
                        .weight("15%")
                        .description("Algorithmic proficiency, edge-case handling, and structured implementation.")
                        .build(),
                ReadinessFactorDto.builder()
                        .name("Technical Skills")
                        .score(techSkill)
                        .weight("10%")
                        .description("Application development stack mastery (Spring Boot, React, and Data models).")
                        .build(),
                ReadinessFactorDto.builder()
                        .name("Communication")
                        .score(communication)
                        .weight("10%")
                        .description("Technical articulation, structured problem breakdown, and workplace collaboration.")
                        .build()
        );

        List<String> strengths = new ArrayList<>();
        List<String> areasToImprove = new ArrayList<>();

        if (aptitude >= 75) strengths.add("Strong quantitative and logical deduction in placement assessment tests");
        else areasToImprove.add("Quantitative Aptitude: Practice time-speed-distance, profit/loss, and number series");

        if (technical >= 75) strengths.add("Solid grasp of core Computer Science principles and Object-Oriented Programming");
        else areasToImprove.add("Technical Fundamentals: Strengthen OOP concepts, DBMS queries, and OS process models");

        if (programming >= 80) strengths.add("High programming problem-solving efficiency and clean algorithmic implementation");
        else areasToImprove.add("Data Structures & Algorithms: Practice recursion, graph traversals, and dynamic programming");

        if (academic >= 80) strengths.add("Excellent academic consistency with strong university grade progression");
        else if (academic < 65) areasToImprove.add("Academic Focus: Prioritize semester grade improvement to clear company cutoffs");

        if (communication >= 75) strengths.add("Effective verbal and technical communication skills for interview rounds");
        else areasToImprove.add("Communication: Practice structured technical presentation and HR interview responses");

        if (strengths.isEmpty()) strengths.add("Active participation in placement preparation drives and foundation testing");
        if (areasToImprove.isEmpty()) areasToImprove.add("System Design: Explore high-level distributed systems and microservices patterns");

        String display = switch (classification) {
            case HIGHLY_READY -> "Highly Ready";
            case READY -> "Ready";
            case NEEDS_IMPROVEMENT -> "Needs Improvement";
            case AT_RISK -> "At Risk";
        };

        return ReadinessResponse.builder()
                .predictionId(predictionId)
                .studentId(studentId)
                .readinessScore(score)
                .classification(classification)
                .classificationDisplay(display)
                .academicScore(academic)
                .aptitudeScore(aptitude)
                .technicalScore(technical)
                .programmingScore(programming)
                .technicalSkillScore(techSkill)
                .technicalSkillsScore(techSkill)
                .communicationScore(communication)
                .problemSolvingScore(problemSolving)
                .teamworkScore(teamwork)
                .modelVersion(modelVersion)
                .predictionDate(date)
                .factors(factors)
                .strengths(strengths)
                .areasToImprove(areasToImprove)
                .evaluationNote("Evaluation synthesized using " + modelVersion + " with multi-factor academic and MCQ assessment weights.")
                .build();
    }
}
