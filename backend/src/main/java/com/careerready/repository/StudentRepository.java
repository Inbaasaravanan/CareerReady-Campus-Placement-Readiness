package com.careerready.repository;

import com.careerready.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(Long userId);
    Optional<Student> findByRegisterNumber(String registerNumber);
    Boolean existsByRegisterNumber(String registerNumber);

    List<Student> findByDepartmentId(Long departmentId);
    long countByDepartmentId(Long departmentId);

    List<Student> findByAssignedStaffId(Long staffId);
    List<Student> findByAssignedStaffUserId(Long userId);
    long countByAssignedStaffId(Long staffId);

    @Query("SELECT s FROM Student s WHERE " +
           "(:search IS NULL OR LOWER(s.user.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.registerNumber) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:departmentId IS NULL OR s.department.id = :departmentId) AND " +
           "(:year IS NULL OR s.year = :year)")
    Page<Student> filterStudents(@Param("search") String search,
                                @Param("departmentId") Long departmentId,
                                @Param("year") Integer year,
                                Pageable pageable);
}
