package com.careerready.service.impl;

import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.company.CompanySkillGapResponse;
import com.careerready.dto.company.SkillGapItemDto;
import com.careerready.entity.Assessment;
import com.careerready.entity.Company;
import com.careerready.entity.CompanySkill;
import com.careerready.entity.Student;
import com.careerready.entity.StudentSkill;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import com.careerready.enums.SkillLevel;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.CompanyRepository;
import com.careerready.repository.CompanySkillRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.service.CompanyMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyMatchingServiceImpl implements CompanyMatchingService {

    private final CompanyRepository companyRepository;
    private final CompanySkillRepository companySkillRepository;
    private final StudentRepository studentRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final AssessmentRepository assessmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CompanyMatchResponse> getCompanyMatchesForStudent(Long studentId, String filter) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        List<Company> companies = companyRepository.findByActiveTrue();
        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(studentId);

        // Preload student assessment scores
        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        Integer aptitudeScore = null;
        Integer technicalScore = null;

        for (Assessment a : assessments) {
            if (a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null) {
                if (a.getAssessmentType() == AssessmentType.APTITUDE && aptitudeScore == null) {
                    aptitudeScore = (int) Math.round(a.getPercentage());
                } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && technicalScore == null) {
                    technicalScore = (int) Math.round(a.getPercentage());
                }
            }
        }

        List<CompanyMatchResponse> matches = new ArrayList<>();
        for (Company company : companies) {
            List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(company.getId());
            CompanyMatchResponse match = evaluateCompanyMatch(student, company, studentSkills, companySkills, aptitudeScore, technicalScore);
            matches.add(match);
        }

        // Apply optional filtering ("Eligible", "High Match", "Needs Improvement")
        if (filter != null && !filter.equalsIgnoreCase("All")) {
            if (filter.equalsIgnoreCase("Eligible")) {
                matches = matches.stream().filter(m -> "Eligible".equalsIgnoreCase(m.getEligibilityStatus())).toList();
            } else if (filter.equalsIgnoreCase("High Match")) {
                matches = matches.stream().filter(m -> m.getMatchPercentage() != null && m.getMatchPercentage() >= 75).toList();
            } else if (filter.equalsIgnoreCase("Needs Improvement")) {
                matches = matches.stream().filter(m -> "Needs Improvement".equalsIgnoreCase(m.getEligibilityStatus()) || (m.getMatchPercentage() != null && m.getMatchPercentage() < 70)).toList();
            }
        }

        return matches;
    }

    @Override
    @Transactional(readOnly = true)
    public CompanySkillGapResponse getCompanySkillGapsForStudent(Long companyId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        List<CompanySkill> requiredSkills = companySkillRepository.findByCompanyId(companyId);
        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(studentId);

        Map<String, SkillLevel> studentSkillMap = new HashMap<>();
        for (StudentSkill ss : studentSkills) {
            if (ss.getSkill() != null) {
                studentSkillMap.put(ss.getSkill().getName().toLowerCase().trim(), ss.getCurrentLevel());
            }
        }

        List<SkillGapItemDto> gapItems = new ArrayList<>();

        for (CompanySkill cs : requiredSkills) {
            if (cs.getSkill() == null) continue;

            String skillName = cs.getSkill().getName();
            SkillLevel reqLevel = cs.getRequiredLevel() != null ? cs.getRequiredLevel() : SkillLevel.INTERMEDIATE;
            SkillLevel currLevel = studentSkillMap.get(skillName.toLowerCase().trim());

            if (currLevel == null || currLevel.ordinal() < reqLevel.ordinal()) {
                String gapLevel = determineGapLevel(currLevel, reqLevel, Boolean.TRUE.equals(cs.getMandatory()));
                String recommendation = buildSkillRecommendation(skillName, reqLevel, currLevel);

                gapItems.add(SkillGapItemDto.builder()
                        .skill(skillName)
                        .requiredLevel(reqLevel)
                        .currentLevel(currLevel)
                        .gapLevel(gapLevel)
                        .mandatory(cs.getMandatory())
                        .recommendation(recommendation)
                        .build());
            }
        }

        return CompanySkillGapResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .skillGaps(gapItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CompanyMatchResponse getCompanyMatchDetail(Long companyId, Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(companyId);
        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(studentId);

        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        Integer aptitude = null;
        Integer technical = null;
        for (Assessment a : assessments) {
            if (a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null) {
                if (a.getAssessmentType() == AssessmentType.APTITUDE && aptitude == null) {
                    aptitude = (int) Math.round(a.getPercentage());
                } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && technical == null) {
                    technical = (int) Math.round(a.getPercentage());
                }
            }
        }

        return evaluateCompanyMatch(student, company, studentSkills, companySkills, aptitude, technical);
    }

    @Override
    public CompanyMatchResponse evaluateCompanyMatch(Student student, Company company,
                                                      List<StudentSkill> studentSkills,
                                                      List<CompanySkill> companySkills,
                                                      Integer aptitudeScore, Integer technicalScore) {
        Map<String, SkillLevel> studentSkillMap = new HashMap<>();
        for (StudentSkill ss : studentSkills) {
            if (ss.getSkill() != null) {
                studentSkillMap.put(ss.getSkill().getName().toLowerCase().trim(), ss.getCurrentLevel());
            }
        }

        List<String> matchedSkills = new ArrayList<>();
        List<String> skillGaps = new ArrayList<>();
        List<String> requiredSkills = new ArrayList<>();

        double skillScoreSum = 0.0;
        int totalSkillsCount = companySkills.isEmpty() ? 1 : companySkills.size();
        boolean mandatorySkillsMet = true;

        for (CompanySkill cs : companySkills) {
            if (cs.getSkill() == null) continue;
            String name = cs.getSkill().getName();
            requiredSkills.add(name);

            SkillLevel reqLevel = cs.getRequiredLevel() != null ? cs.getRequiredLevel() : SkillLevel.INTERMEDIATE;
            SkillLevel currLevel = studentSkillMap.get(name.toLowerCase().trim());

            if (currLevel != null && currLevel.ordinal() >= reqLevel.ordinal()) {
                matchedSkills.add(name);
                skillScoreSum += 1.0;
            } else if (currLevel != null) {
                // Partial credit for possessing the skill at lower level
                skillGaps.add(name);
                skillScoreSum += 0.5;
                if (Boolean.TRUE.equals(cs.getMandatory())) {
                    mandatorySkillsMet = false;
                }
            } else {
                skillGaps.add(name);
                if (Boolean.TRUE.equals(cs.getMandatory())) {
                    mandatorySkillsMet = false;
                }
            }
        }

        double skillMatchPct = (skillScoreSum / totalSkillsCount) * 100.0;

        // CGPA calculation
        double reqCgpa = company.getRequiredCgpa() != null ? company.getRequiredCgpa() : 7.0;
        double studentCgpa = student.getCgpa() != null ? student.getCgpa() : 0.0;
        double cgpaMatchPct = studentCgpa >= reqCgpa ? 100.0 : Math.max(0.0, (studentCgpa / reqCgpa) * 100.0);

        // Aptitude calculation
        int minAptitude = company.getMinimumAptitudeScore() != null ? (int) Math.round(company.getMinimumAptitudeScore()) : 60;
        double aptitudeMatchPct = 0.0;
        boolean aptitudePassed = false;
        if (aptitudeScore != null) {
            aptitudeMatchPct = aptitudeScore >= minAptitude ? 100.0 : ((double) aptitudeScore / minAptitude) * 100.0;
            aptitudePassed = aptitudeScore >= minAptitude;
        }

        // Technical calculation
        int minTech = company.getMinimumTechnicalScore() != null ? (int) Math.round(company.getMinimumTechnicalScore()) : 60;
        double techMatchPct = 0.0;
        boolean techPassed = false;
        if (technicalScore != null) {
            techMatchPct = technicalScore >= minTech ? 100.0 : ((double) technicalScore / minTech) * 100.0;
            techPassed = technicalScore >= minTech;
        }

        // Weighted overall match percentage: CGPA 25%, Skills 45%, Aptitude 15%, Technical 15%
        int overallMatchPct = (int) Math.round(
                (cgpaMatchPct * 0.25) +
                (skillMatchPct * 0.45) +
                (aptitudeMatchPct * 0.15) +
                (techMatchPct * 0.15)
        );
        overallMatchPct = Math.min(100, Math.max(0, overallMatchPct));

        // Eligibility determination:
        // Student is eligible ONLY when satisfying:
        // 1. CGPA requirement (studentCgpa >= reqCgpa)
        // 2. Aptitude requirement (aptitudePassed)
        // 3. Technical requirement (techPassed)
        // 4. Mandatory skill requirements (mandatorySkillsMet)
        // 5. Overall match percentage >= 70
        boolean isEligible = (studentCgpa >= reqCgpa) && aptitudePassed && techPassed && mandatorySkillsMet && (overallMatchPct >= 70);
        String status = isEligible ? "Eligible" : (overallMatchPct >= 60 ? "Borderline" : "Needs Improvement");

        String prepRec = skillGaps.isEmpty()
                ? "Profile matches all core recruitment criteria. Focus on mock HR interviews and company coding patterns."
                : "Priority skill improvement: " + String.join(", ", skillGaps) + " to satisfy mandatory hiring cutoffs.";

        return CompanyMatchResponse.builder()
                .companyId(company.getId())
                .id(company.getId())
                .companyName(company.getName())
                .name(company.getName())
                .company(company.getName())
                .description(company.getDescription())
                .matchPercentage(overallMatchPct)
                .matchScore(overallMatchPct)
                .eligibilityStatus(status)
                .status(status)
                .requiredCgpa(reqCgpa)
                .requiredCGPA(reqCgpa)
                .minimumAptitudeScore(minAptitude)
                .minimumTechnicalScore(minTech)
                .matchedSkills(matchedSkills)
                .skillGaps(skillGaps)
                .missingSkills(skillGaps)
                .requiredSkills(requiredSkills)
                .recommendedPreparation(prepRec)
                .eligibleStudentsCount(isEligible ? 1 : 0)
                .build();
    }

    private String determineGapLevel(SkillLevel current, SkillLevel required, boolean mandatory) {
        if (current == null) {
            return mandatory ? "HIGH" : "MEDIUM";
        }
        int diff = required.ordinal() - current.ordinal();
        if (diff >= 2) return "HIGH";
        if (diff == 1) return "MEDIUM";
        return "LOW";
    }

    private String buildSkillRecommendation(String skill, SkillLevel required, SkillLevel current) {
        if (current == null) {
            return "Complete foundational course in " + skill + " and build a practical portfolio project to reach " + required + " level.";
        }
        return "Advance knowledge in " + skill + " from " + current + " to " + required + " through problem-solving and coding practice.";
    }
}
