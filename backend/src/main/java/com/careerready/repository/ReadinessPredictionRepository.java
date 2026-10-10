package com.careerready.repository;

import com.careerready.entity.ReadinessPrediction;
import com.careerready.enums.ReadinessClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadinessPredictionRepository extends JpaRepository<ReadinessPrediction, Long> {
    Optional<ReadinessPrediction> findTopByStudentIdOrderByPredictionDateDesc(Long studentId);
    List<ReadinessPrediction> findByStudentIdOrderByPredictionDateDesc(Long studentId);
    List<ReadinessPrediction> findByStudentIdOrderByPredictionDateAsc(Long studentId);

    long countByClassification(ReadinessClassification classification);
    long countByStudentId(Long studentId);

    @Query("SELECT AVG(rp.readinessScore) FROM ReadinessPrediction rp")
    Double getOverallAverageReadiness();

    @Query("SELECT AVG(rp.readinessScore) FROM ReadinessPrediction rp WHERE rp.student.department.id = :deptId")
    Double getAverageReadinessByDepartment(@Param("deptId") Long deptId);

    @Query("SELECT COUNT(rp) FROM ReadinessPrediction rp WHERE rp.classification = 'AT_RISK'")
    long countAtRiskStudents();

    @Query("SELECT rp FROM ReadinessPrediction rp WHERE rp.classification = 'AT_RISK' ORDER BY rp.readinessScore ASC")
    List<ReadinessPrediction> findAllAtRisk();
}
