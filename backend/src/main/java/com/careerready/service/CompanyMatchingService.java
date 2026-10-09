package com.careerready.service;

import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.company.CompanySkillGapResponse;

import java.util.List;

public interface CompanyMatchingService {

    /**
     * Compute company matching across all active companies for a student
     */
    List<CompanyMatchResponse> getCompanyMatchesForStudent(Long studentId, String filter);

    /**
     * Compute dynamic company-specific skill gaps for a student against a specific company
     */
    CompanySkillGapResponse getCompanySkillGapsForStudent(Long companyId, Long studentId);

    /**
     * Get details for a single company match for a student
     */
    CompanyMatchResponse getCompanyMatchDetail(Long companyId, Long studentId);

    /**
     * Evaluate single company match using student skills, company skills, and actual assessment scores
     */
    CompanyMatchResponse evaluateCompanyMatch(
            com.careerready.entity.Student student,
            com.careerready.entity.Company company,
            List<com.careerready.entity.StudentSkill> studentSkills,
            List<com.careerready.entity.CompanySkill> companySkills,
            Integer aptitudeScore,
            Integer technicalScore);
}
