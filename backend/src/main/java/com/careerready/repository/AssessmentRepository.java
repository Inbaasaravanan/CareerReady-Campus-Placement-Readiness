package com.careerready.repository;

import com.careerready.entity.Assessment;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {
    List<Assessment> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Assessment> findByStudentIdAndAssessmentTypeOrderByCreatedAtDesc(Long studentId, AssessmentType assessmentType);
    Optional<Assessment> findTopByStudentIdAndAssessmentTypeAndStatusOrderByCreatedAtDesc(Long studentId, AssessmentType assessmentType, AssessmentStatus status);

    long countByStatus(AssessmentStatus status);
    long countByStudentId(Long studentId);

    @Query("SELECT AVG(a.percentage) FROM Assessment a WHERE a.assessmentType = :type AND a.status = 'COMPLETED'")
    Double getAveragePercentageByType(@Param("type") AssessmentType type);
}

