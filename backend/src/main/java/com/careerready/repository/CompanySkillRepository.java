package com.careerready.repository;

import com.careerready.entity.CompanySkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanySkillRepository extends JpaRepository<CompanySkill, Long> {
    List<CompanySkill> findByCompanyId(Long companyId);
    Optional<CompanySkill> findByCompanyIdAndSkillId(Long companyId, Long skillId);
    void deleteByCompanyId(Long companyId);
    long countBySkillId(Long skillId);
}

