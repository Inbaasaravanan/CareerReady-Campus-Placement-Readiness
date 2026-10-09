package com.careerready.repository;

import com.careerready.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {
    Optional<Skill> findByName(String name);
    Optional<Skill> findByNameIgnoreCase(String name);
    Boolean existsByNameIgnoreCase(String name);
    List<Skill> findByCategory(String category);
    List<Skill> findByActiveTrue();
    List<Skill> findByActiveTrueOrderByNameAsc();
}
