package com.careerready.repository;

import com.careerready.entity.Question;
import com.careerready.enums.AssessmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByAssessmentTypeAndActiveTrue(AssessmentType assessmentType);

    @Query(value = "SELECT * FROM questions WHERE assessment_type = :type AND active = true ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Question> findRandomActiveQuestions(@Param("type") String type, @Param("limit") int limit);
}
