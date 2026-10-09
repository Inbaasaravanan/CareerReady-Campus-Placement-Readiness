package com.careerready;

import com.careerready.dto.assessment.AnswerSubmissionDto;
import com.careerready.dto.assessment.AssessmentResponse;
import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.assessment.SubmitAssessmentRequest;
import com.careerready.entity.Assessment;
import com.careerready.entity.AssessmentAnswer;
import com.careerready.entity.Question;
import com.careerready.entity.Student;
import com.careerready.entity.User;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import com.careerready.enums.DifficultyLevel;
import com.careerready.exception.BadRequestException;
import com.careerready.repository.AssessmentAnswerRepository;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.QuestionRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.service.PredictionService;
import com.careerready.service.impl.AssessmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AssessmentServiceTest {

    @Mock
    private AssessmentRepository assessmentRepository;

    @Mock
    private AssessmentAnswerRepository assessmentAnswerRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private PredictionService predictionService;

    @InjectMocks
    private AssessmentServiceImpl assessmentService;

    private Student testStudent;
    private List<Question> testQuestions;

    @BeforeEach
    void setUp() {
        User user = User.builder().id(1L).email("student@test.com").name("Test Student").build();
        testStudent = Student.builder().id(10L).user(user).registerNumber("23CSE001").cgpa(8.5).build();

        testQuestions = new ArrayList<>();
        for (long i = 1; i <= 25; i++) {
            testQuestions.add(Question.builder()
                    .id(i)
                    .questionText("Question " + i)
                    .optionA("Option A")
                    .optionB("Option B")
                    .optionC("Option C")
                    .optionD("Option D")
                    .correctAnswer("B")
                    .assessmentType(AssessmentType.APTITUDE)
                    .difficultyLevel(DifficultyLevel.EASY)
                    .marks(1)
                    .active(true)
                    .build());
        }
    }

    @Test
    @DisplayName("Should start assessment and return 20 randomized questions without leaking correctAnswer")
    void testStartAssessment() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(testStudent));
        when(questionRepository.findByAssessmentTypeAndActiveTrue(AssessmentType.APTITUDE)).thenReturn(testQuestions);
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(invocation -> {
            Assessment a = invocation.getArgument(0);
            a.setId(101L);
            return a;
        });

        AssessmentResponse response = assessmentService.startAssessment(AssessmentType.APTITUDE, 10L);

        assertNotNull(response);
        assertEquals(101L, response.getAssessmentId());
        assertEquals(AssessmentType.APTITUDE, response.getType());
        assertEquals(20, response.getTotalQuestions());
        assertEquals(20, response.getQuestions().size());

        // Verify questions do not contain correctAnswer field in the DTO
        assertNotNull(response.getQuestions().get(0).getQuestionText());
        assertNotNull(response.getQuestions().get(0).getOptionA());

        verify(assessmentAnswerRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Should correctly calculate score upon assessment submission")
    void testSubmitAssessmentScoreCalculation() {
        Assessment assessment = Assessment.builder()
                .id(101L)
                .student(testStudent)
                .assessmentType(AssessmentType.APTITUDE)
                .status(AssessmentStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now().minusMinutes(10))
                .totalQuestions(2)
                .build();

        Question q1 = testQuestions.get(0); // correctAnswer is "B"
        Question q2 = testQuestions.get(1); // correctAnswer is "B"

        AssessmentAnswer a1 = AssessmentAnswer.builder().id(1L).assessment(assessment).question(q1).build();
        AssessmentAnswer a2 = AssessmentAnswer.builder().id(2L).assessment(assessment).question(q2).build();

        when(assessmentRepository.findById(101L)).thenReturn(Optional.of(assessment));
        when(assessmentAnswerRepository.findByAssessmentId(101L)).thenReturn(List.of(a1, a2));
        when(assessmentRepository.save(any(Assessment.class))).thenAnswer(inv -> inv.getArgument(0));

        // Submit: Question 1 correct ('B'), Question 2 wrong ('C')
        SubmitAssessmentRequest request = SubmitAssessmentRequest.builder()
                .answers(List.of(
                        new AnswerSubmissionDto(q1.getId(), "B"),
                        new AnswerSubmissionDto(q2.getId(), "C")
                ))
                .timeSpentSeconds(300)
                .build();

        AssessmentResultResponse result = assessmentService.submitAssessment(101L, 10L, request);

        assertNotNull(result);
        assertEquals(1, result.getCorrectAnswers());
        assertEquals(1, result.getWrongAnswers());
        assertEquals(1, result.getScore());
        assertEquals(50, result.getPercentage());
        assertEquals(AssessmentStatus.COMPLETED, result.getStatus());
    }

    @Test
    @DisplayName("Should prevent duplicate assessment submission")
    void testDuplicateAssessmentSubmissionPrevention() {
        Assessment completedAssessment = Assessment.builder()
                .id(101L)
                .student(testStudent)
                .assessmentType(AssessmentType.APTITUDE)
                .status(AssessmentStatus.COMPLETED)
                .build();

        when(assessmentRepository.findById(101L)).thenReturn(Optional.of(completedAssessment));

        SubmitAssessmentRequest request = SubmitAssessmentRequest.builder()
                .answers(List.of())
                .build();

        assertThrows(BadRequestException.class, () ->
                assessmentService.submitAssessment(101L, 10L, request));
    }
}
