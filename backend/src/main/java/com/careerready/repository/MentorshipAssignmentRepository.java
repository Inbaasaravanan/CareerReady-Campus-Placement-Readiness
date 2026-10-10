package com.careerready.repository;

import com.careerready.entity.MentorshipAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MentorshipAssignmentRepository extends JpaRepository<MentorshipAssignment, Long> {

    Optional<MentorshipAssignment> findByStudentIdAndActiveTrue(Long studentId);

    List<MentorshipAssignment> findByStaffIdAndActiveTrue(Long staffId);

    List<MentorshipAssignment> findByActiveTrue();

    List<MentorshipAssignment> findAllByOrderByAssignedAtDesc();

    long countByStaffIdAndActiveTrue(Long staffId);

    @Query("SELECT ma FROM MentorshipAssignment ma WHERE ma.staff.user.id = :userId AND ma.active = true")
    List<MentorshipAssignment> findByStaffUserIdAndActiveTrue(@Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MentorshipAssignment ma WHERE ma.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM MentorshipAssignment ma WHERE ma.staff.id = :staffId")
    void deleteByStaffId(@Param("staffId") Long staffId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE MentorshipAssignment ma SET ma.assignedBy = null WHERE ma.assignedBy.id = :userId")
    void clearAssignedByUserId(@Param("userId") Long userId);
}

