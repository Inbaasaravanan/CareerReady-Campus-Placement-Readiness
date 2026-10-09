package com.careerready.repository;

import com.careerready.entity.StudentAcademicRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAcademicRecordRepository extends JpaRepository<StudentAcademicRecord, Long> {

    List<StudentAcademicRecord> findByStudentIdOrderBySemesterAsc(Long studentId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM StudentAcademicRecord ar WHERE ar.student.id = :studentId")
    void deleteByStudentId(@org.springframework.data.repository.query.Param("studentId") Long studentId);
}
