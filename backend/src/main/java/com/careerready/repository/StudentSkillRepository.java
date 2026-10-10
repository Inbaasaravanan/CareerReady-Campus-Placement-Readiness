package com.careerready.repository;

import com.careerready.entity.StudentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSkillRepository extends JpaRepository<StudentSkill, Long> {
    List<StudentSkill> findByStudentId(Long studentId);
    Optional<StudentSkill> findByStudentIdAndSkillId(Long studentId, Long skillId);
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM StudentSkill ss WHERE ss.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    long countBySkillId(Long skillId);

    @Query("SELECT ss.skill.name, COUNT(ss) FROM StudentSkill ss WHERE ss.currentLevel = 'BEGINNER' GROUP BY ss.skill.name ORDER BY COUNT(ss) DESC")
    List<Object[]> findMostCommonSkillGaps();
}

