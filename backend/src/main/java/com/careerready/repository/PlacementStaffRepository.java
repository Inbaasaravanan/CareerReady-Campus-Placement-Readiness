package com.careerready.repository;

import com.careerready.entity.PlacementStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlacementStaffRepository extends JpaRepository<PlacementStaff, Long> {
    Optional<PlacementStaff> findByUserId(Long userId);
    Optional<PlacementStaff> findByEmployeeId(String employeeId);
    boolean existsByEmployeeId(String employeeId);
    java.util.List<PlacementStaff> findByDepartmentId(Long departmentId);
}
