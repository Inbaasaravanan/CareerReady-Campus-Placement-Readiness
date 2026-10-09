package com.careerready.repository;

import com.careerready.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<Department> findByNameIgnoreCase(String name);
    Optional<Department> findByCode(String code);
    Boolean existsByNameIgnoreCase(String name);
    Boolean existsByCode(String code);
}
