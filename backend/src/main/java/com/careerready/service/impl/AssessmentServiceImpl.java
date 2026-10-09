package com.careerready.service.impl;

import com.careerready.dto.assessment.AnswerSubmissionDto;
import com.careerready.dto.assessment.AssessmentHistoryItemDto;
import com.careerready.dto.assessment.AssessmentQuestionResponse;
import com.careerready.dto.assessment.AssessmentResponse;
import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.assessment.StudentAssessmentHistoryResponse;
import com.careerready.dto.assessment.SubmitAssessmentRequest;
import com.careerready.entity.Assessment;
import com.careerready.entity.AssessmentAnswer;
import com.careerready.entity.Question;
import com.careerready.entity.Student;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.exception.UnauthorizedException;
import com.careerready.repository.AssessmentAnswerRepository;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.QuestionRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.service.AssessmentService;
import com.careerready.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentServiceImpl implements AssessmentService {

    private static final int ASSESSMENT_QUESTIONS_COUNT = 20;
    private static final int ASSESSMENT_DURATION_MINUTES = 20;

    private final AssessmentRepository assessmentRepository;
    private final AssessmentAnswerRepository assessmentAnswerRepository;
    private final QuestionRepository questionRepository;
    private final StudentRepository studentRepository;
    private final PredictionService predictionService;

    @Override
    @Transactional
    public AssessmentResponse startAssessment(AssessmentType type, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        // Retrieve active questions for the assessment type
        List<Question> pool = questionRepository.findByAssessmentTypeAndActiveTrue(type);
        if (pool.isEmpty()) {
            throw new BadRequestException("No active questions available for assessment type: " + type);
        }

        // Randomize questions
        List<Question> shuffled = new ArrayList<>(pool);
        Collections.shuffle(shuffled);

        int count = Math.min(ASSESSMENT_QUESTIONS_COUNT, shuffled.size());
        List<Question> selectedQuestions = shuffled.subList(0, count);

        // Create new assessment record
        Assessment assessment = Assessment.builder()
                .student(student)
                .assessmentType(type)
                .status(AssessmentStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .totalQuestions(count)
                .correctAnswers(0)
                .wrongAnswers(0)
                .score(0)
                .percentage(0.0)
                .build();

        assessment = assessmentRepository.save(assessment);

        // Pre-create placeholder answers linking the selected questions to this assessment
        List<AssessmentAnswer> answers = new ArrayList<>();
        for (Question q : selectedQuestions) {
            answers.add(AssessmentAnswer.builder()
                    .assessment(assessment)
                    .question(q)
                    .marksObtained(0)
                    .isCorrect(false)
                    .build());
        }
        assessmentAnswerRepository.saveAll(answers);

        // Convert to DTO strictly without correctAnswer
        List<AssessmentQuestionResponse> questionDtos = selectedQuestions.stream()
                .map(this::mapToQuestionResponse)
                .collect(Collectors.toList());

        return AssessmentResponse.builder()
                .assessmentId(assessment.getId())
                .type(type)
                .totalQuestions(count)
                .durationMinutes(ASSESSMENT_DURATION_MINUTES)
                .questions(questionDtos)
                .build();
    }

    @Override
    @Transactional
    public AssessmentResultResponse submitAssessment(Long assessmentId, Long studentId, SubmitAssessmentRequest request) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + assessmentId));

        // Validate ownership
        if (assessment.getStudent() == null || !assessment.getStudent().getId().equals(studentId)) {
            throw new UnauthorizedException("You do not have permission to submit this assessment");
        }

        // Prevent duplicate submissions
        if (assessment.getStatus() == AssessmentStatus.COMPLETED) {
            throw new BadRequestException("This assessment has already been submitted and completed");
        }

        // Map submitted answers by questionId
        Map<Long, String> submissionMap = new HashMap<>();
        if (request.getAnswers() != null) {
            for (AnswerSubmissionDto ans : request.getAnswers()) {
                if (ans.getQuestionId() != null) {
                    submissionMap.put(ans.getQuestionId(), ans.getSelectedAnswer());
                }
            }
        }

        List<AssessmentAnswer> existingAnswers = assessmentAnswerRepository.findByAssessmentId(assessmentId);
        int correctCount = 0;
        int wrongCount = 0;
        int totalScore = 0;
        Map<String, Object> evaluatedMap = new HashMap<>();

        for (AssessmentAnswer answerRecord : existingAnswers) {
            Question q = answerRecord.getQuestion();
            String submitted = submissionMap.get(q.getId());
            answerRecord.setSelectedAnswer(submitted);

            boolean isCorrect = submitted != null && submitted.trim().equalsIgnoreCase(q.getCorrectAnswer().trim());
            int marks = isCorrect ? (q.getMarks() != null ? q.getMarks() : 1) : 0;

            answerRecord.setIsCorrect(isCorrect);
            answerRecord.setMarksObtained(marks);

            if (isCorrect) {
                correctCount++;
                totalScore += marks;
            } else {
                wrongCount++;
            }

            Map<String, Object> evalDetail = new HashMap<>();
            evalDetail.put("selected", submitted);
            evalDetail.put("correct", q.getCorrectAnswer());
            evalDetail.put("isCorrect", isCorrect);
            evalDetail.put("questionText", q.getQuestionText());
            evaluatedMap.put(String.valueOf(q.getId()), evalDetail);
        }

        assessmentAnswerRepository.saveAll(existingAnswers);

        int totalQuestions = assessment.getTotalQuestions() != null && assessment.getTotalQuestions() > 0
                ? assessment.getTotalQuestions()
                : existingAnswers.size();

        int percentage = totalQuestions > 0 ? (int) Math.round(((double) correctCount / totalQuestions) * 100.0) : 0;

        assessment.setStatus(AssessmentStatus.COMPLETED);
        assessment.setSubmittedAt(LocalDateTime.now());
        assessment.setCorrectAnswers(correctCount);
        assessment.setWrongAnswers(wrongCount);
        assessment.setScore(totalScore);
        assessment.setPercentage((double) percentage);
        assessment = assessmentRepository.save(assessment);

        // Update student profile scores
        Student student = assessment.getStudent();
        if (assessment.getAssessmentType() == AssessmentType.APTITUDE) {
            student.setProblemSolvingScore(percentage);
        } else if (assessment.getAssessmentType() == AssessmentType.TECHNICAL) {
            student.setTechnicalSkillScore(percentage);
        }
        studentRepository.save(student);

        // AUTOMATIC READINESS FLOW:
        // Check if both Aptitude and Technical assessments have been completed
        List<Assessment> allStudentAssessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(student.getId());
        boolean hasCompletedAptitude = allStudentAssessments.stream()
                .anyMatch(a -> a.getAssessmentType() == AssessmentType.APTITUDE && a.getStatus() == AssessmentStatus.COMPLETED);
        boolean hasCompletedTechnical = allStudentAssessments.stream()
                .anyMatch(a -> a.getAssessmentType() == AssessmentType.TECHNICAL && a.getStatus() == AssessmentStatus.COMPLETED);

        if (hasCompletedAptitude && hasCompletedTechnical) {
            try {
                log.info("Both Aptitude and Technical assessments completed for student {}. Triggering automatic readiness prediction.", student.getId());
                predictionService.predictAndSaveForStudent(student);
            } catch (Exception ex) {
                log.error("Failed to automatically generate readiness prediction after assessment submission: {}", ex.getMessage());
            }
        }

        String performance = getPerformanceLabel(percentage);

        return AssessmentResultResponse.builder()
                .assessmentId(assessment.getId())
                .type(assessment.getAssessmentType())
                .totalQuestions(totalQuestions)
                .correctAnswers(correctCount)
                .wrongAnswers(wrongCount)
                .score(totalScore)
                .percentage(percentage)
                .status(assessment.getStatus())
                .performance(performance)
                .startedAt(assessment.getStartedAt())
                .submittedAt(assessment.getSubmittedAt())
                .timeSpentSeconds(request.getTimeSpentSeconds())
                .evaluatedAnswers(evaluatedMap)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentResultResponse getAssessmentResult(Long assessmentId, Long studentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment not found with id: " + assessmentId));

        if (studentId != null && assessment.getStudent() != null && !assessment.getStudent().getId().equals(studentId)) {
            throw new UnauthorizedException("You do not have permission to view this assessment result");
        }

        List<AssessmentAnswer> answers = assessmentAnswerRepository.findByAssessmentId(assessmentId);
        Map<String, Object> evaluatedMap = new HashMap<>();

        for (AssessmentAnswer a : answers) {
            Map<String, Object> detail = new HashMap<>();
            detail.put("selected", a.getSelectedAnswer());
            detail.put("correct", a.getQuestion() != null ? a.getQuestion().getCorrectAnswer() : null);
            detail.put("isCorrect", a.getIsCorrect());
            detail.put("questionText", a.getQuestion() != null ? a.getQuestion().getQuestionText() : null);
            evaluatedMap.put(String.valueOf(a.getQuestion().getId()), detail);
        }

        int percentage = assessment.getPercentage() != null ? (int) Math.round(assessment.getPercentage()) : 0;

        return AssessmentResultResponse.builder()
                .assessmentId(assessment.getId())
                .type(assessment.getAssessmentType())
                .totalQuestions(assessment.getTotalQuestions())
                .correctAnswers(assessment.getCorrectAnswers())
                .wrongAnswers(assessment.getWrongAnswers())
                .score(assessment.getScore())
                .percentage(percentage)
                .status(assessment.getStatus())
                .performance(getPerformanceLabel(percentage))
                .startedAt(assessment.getStartedAt())
                .submittedAt(assessment.getSubmittedAt())
                .evaluatedAnswers(evaluatedMap)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentAssessmentHistoryResponse getStudentAssessmentHistory(Long studentId) {
        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);

        AssessmentResultResponse latestAptitude = null;
        AssessmentResultResponse latestTechnical = null;
        List<AssessmentResultResponse> results = new ArrayList<>();
        List<AssessmentHistoryItemDto> historyItems = new ArrayList<>();

        for (Assessment a : assessments) {
            int pct = a.getPercentage() != null ? (int) Math.round(a.getPercentage()) : 0;
            AssessmentResultResponse res = AssessmentResultResponse.builder()
                    .assessmentId(a.getId())
                    .type(a.getAssessmentType())
                    .totalQuestions(a.getTotalQuestions())
                    .correctAnswers(a.getCorrectAnswers())
                    .wrongAnswers(a.getWrongAnswers())
                    .score(a.getScore())
                    .percentage(pct)
                    .status(a.getStatus())
                    .performance(getPerformanceLabel(pct))
                    .startedAt(a.getStartedAt())
                    .submittedAt(a.getSubmittedAt())
                    .build();

            results.add(res);

            if (a.getStatus() == AssessmentStatus.COMPLETED) {
                if (a.getAssessmentType() == AssessmentType.APTITUDE && latestAptitude == null) {
                    latestAptitude = res;
                } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && latestTechnical == null) {
                    latestTechnical = res;
                }

                historyItems.add(AssessmentHistoryItemDto.builder()
                        .id("att-" + a.getId())
                        .type(a.getAssessmentType() == AssessmentType.APTITUDE ? "Aptitude Assessment" : "Technical Assessment")
                        .score(a.getScore() != null ? a.getScore() : 0)
                        .total(a.getTotalQuestions() != null ? a.getTotalQuestions() : 20)
                        .percentage(pct)
                        .date(a.getSubmittedAt() != null ? a.getSubmittedAt() : a.getCreatedAt())
                        .status(a.getStatus().name())
                        .build());
            }
        }

        return StudentAssessmentHistoryResponse.builder()
                .studentId(studentId)
                .aptitudeResult(latestAptitude)
                .technicalResult(latestTechnical)
                .assessments(results)
                .history(historyItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, AssessmentResultResponse> getStudentAssessmentStatus(Long studentId) {
        StudentAssessmentHistoryResponse history = getStudentAssessmentHistory(studentId);
        Map<String, AssessmentResultResponse> statusMap = new HashMap<>();
        statusMap.put("aptitude", history.getAptitudeResult());
        statusMap.put("APTITUDE", history.getAptitudeResult());
        statusMap.put("technical", history.getTechnicalResult());
        statusMap.put("TECHNICAL", history.getTechnicalResult());
        return statusMap;
    }

    private AssessmentQuestionResponse mapToQuestionResponse(Question q) {
        return AssessmentQuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .assessmentType(q.getAssessmentType())
                .topic(q.getTopic())
                .difficultyLevel(q.getDifficultyLevel())
                .marks(q.getMarks())
                .build();
    }

    private String getPerformanceLabel(Integer percentage) {
        if (percentage == null) return "Not Attempted";
        if (percentage >= 85) return "Excellent";
        if (percentage >= 70) return "Good";
        if (percentage >= 50) return "Average";
        return "Needs Improvement";
    }
}
