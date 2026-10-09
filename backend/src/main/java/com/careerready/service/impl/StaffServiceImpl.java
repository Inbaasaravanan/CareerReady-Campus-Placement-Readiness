package com.careerready.service.impl;

import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.dto.staff.AtRiskStudentDto;
import com.careerready.dto.staff.ReadinessAnalyticsDto;
import com.careerready.dto.staff.SkillGapAnalyticsDto;
import com.careerready.dto.staff.SkillGapAnalyticsDto.SkillGapCountDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;
import com.careerready.dto.staff.StaffStudentItemDto;
import com.careerready.entity.Assessment;
import com.careerready.entity.Company;
import com.careerready.entity.CompanySkill;
import com.careerready.entity.PlacementStaff;
import com.careerready.entity.Student;
import com.careerready.entity.StudentSkill;
import com.careerready.entity.User;
import com.careerready.enums.AssessmentStatus;
import com.careerready.enums.AssessmentType;
import com.careerready.enums.ReadinessClassification;
import com.careerready.enums.SkillLevel;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.CompanyRepository;
import com.careerready.repository.CompanySkillRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.service.CompanyMatchingService;
import com.careerready.service.PredictionService;
import com.careerready.service.StaffService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final StudentRepository studentRepository;
    private final AssessmentRepository assessmentRepository;
    private final PredictionService predictionService;
    private final CompanyRepository companyRepository;
    private final CompanySkillRepository companySkillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final CompanyMatchingService companyMatchingService;
    private final com.careerready.repository.PlacementStaffRepository staffRepository;
    private final com.careerready.repository.UserRepository userRepository;
    private final com.careerready.service.MentorshipService mentorshipService;

    @Override
    @Transactional(readOnly = true)
    public Page<StaffStudentItemDto> getStudents(Long staffUserId, String search, String department, Integer year,
                                                 ReadinessClassification classification, Pageable pageable) {
        List<StaffStudentItemDto> allItems;
        if (staffUserId != null) {
            allItems = mentorshipService.getAssignedStudentsForStaff(staffUserId);
        } else {
            allItems = getAllStudents();
        }

        List<StaffStudentItemDto> filtered = allItems.stream()
                .filter(item -> {
                    if (search != null && !search.isBlank()) {
                        String s = search.trim().toLowerCase();
                        boolean matchName = item.getStudentName() != null && item.getStudentName().toLowerCase().contains(s);
                        boolean matchReg = item.getRegisterNumber() != null && item.getRegisterNumber().toLowerCase().contains(s);
                        if (!matchName && !matchReg) return false;
                    }
                    if (department != null && !department.isBlank() && !department.equalsIgnoreCase("All")) {
                        if (item.getDepartment() == null || !item.getDepartment().equalsIgnoreCase(department.trim())) {
                            return false;
                        }
                    }
                    if (year != null) {
                        if (item.getYear() == null || !item.getYear().equals(year)) {
                            return false;
                        }
                    }
                    if (classification != null) {
                        if (item.getClassification() != classification) {
                            return false;
                        }
                    }
                    return true;
                })
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filtered.size());

        List<StaffStudentItemDto> pagedList = start < filtered.size() ? filtered.subList(start, end) : Collections.emptyList();
        return new PageImpl<>(pagedList, pageable, filtered.size());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StaffStudentItemDto> getStudents(String search, String department, Integer year,
                                                 ReadinessClassification classification, Pageable pageable) {
        return getStudents(null, search, department, year, classification, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffStudentItemDto> getAllStudents() {
        List<Student> students = studentRepository.findAll();
        List<StaffStudentItemDto> result = new ArrayList<>();

        for (Student s : students) {
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "Not Provided";
            PlacementStaff staff = s.getAssignedStaff();

            StaffStudentItemDto item = StaffStudentItemDto.builder()
                    .id(s.getId())
                    .studentId(s.getId())
                    .registerNumber(s.getRegisterNumber())
                    .studentName(s.getUser() != null ? s.getUser().getName() : "")
                    .name(s.getUser() != null ? s.getUser().getName() : "")
                    .email(s.getUser() != null ? s.getUser().getEmail() : "")
                    .department(deptName)
                    .departmentName(deptName)
                    .year(s.getYear())
                    .cgpa(s.getCgpa())
                    .aptitudeScore(pred != null ? pred.getAptitudeScore() : null)
                    .technicalScore(pred != null ? pred.getTechnicalScore() : null)
                    .readinessScore(pred != null ? pred.getReadinessScore() : null)
                    .classification(pred != null ? pred.getClassification() : null)
                    .classificationDisplay(pred != null ? pred.getClassificationDisplay() : "Pending Assessment")
                    .status(s.getUser() != null && s.getUser().getStatus() != null ? s.getUser().getStatus().name() : "ACTIVE")
                    .assignedStaffId(staff != null ? staff.getId() : null)
                    .assignedStaffName(staff != null && staff.getUser() != null ? staff.getUser().getName() : null)
                    .assignedStaffEmail(staff != null && staff.getUser() != null ? staff.getUser().getEmail() : null)
                    .build();

            result.add(item);
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtRiskStudentDto> getAtRiskStudents() {
        List<Student> students = studentRepository.findAll();
        List<AtRiskStudentDto> atRiskList = new ArrayList<>();

        for (Student s : students) {
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());

            if (pred != null && pred.getClassification() == ReadinessClassification.AT_RISK) {
                List<CompanyMatchResponse> matches = companyMatchingService.getCompanyMatchesForStudent(s.getId(), "All");
                List<String> mainGaps = matches != null ? matches.stream()
                        .filter(m -> m.getSkillGaps() != null)
                        .flatMap(m -> m.getSkillGaps().stream())
                        .distinct()
                        .limit(5)
                        .toList() : List.of();

                List<String> riskFactors = new ArrayList<>();
                if (pred.getAptitudeScore() != null && pred.getAptitudeScore() < 60) riskFactors.add("Aptitude Qualifier Below 60%");
                if (pred.getTechnicalScore() != null && pred.getTechnicalScore() < 60) riskFactors.add("Technical Qualifier Below 60%");
                if (s.getCgpa() != null && s.getCgpa() < 7.0) riskFactors.add("CGPA Below Standard Cutoff (7.0)");
                if (s.getBacklogs() != null && s.getBacklogs() > 0) riskFactors.add("Active Backlogs: " + s.getBacklogs());
                if (riskFactors.isEmpty()) riskFactors.add("Multi-factor diagnostic readiness index below institutional threshold");

                String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "Not Provided";

                atRiskList.add(AtRiskStudentDto.builder()
                        .studentId(s.getId())
                        .id(s.getId())
                        .registerNumber(s.getRegisterNumber())
                        .studentName(s.getUser() != null ? s.getUser().getName() : "")
                        .name(s.getUser() != null ? s.getUser().getName() : "")
                        .department(deptName)
                        .departmentName(deptName)
                        .year(s.getYear())
                        .cgpa(s.getCgpa())
                        .aptitudeScore(pred.getAptitudeScore())
                        .technicalScore(pred.getTechnicalScore())
                        .readinessScore(pred.getReadinessScore())
                        .classification(pred.getClassification())
                        .classificationDisplay(pred.getClassificationDisplay())
                        .mainSkillGaps(mainGaps)
                        .riskFactors(riskFactors)
                        .build());
            }
        }

        return atRiskList;
    }

    @Override
    @Transactional(readOnly = true)
    public ReadinessAnalyticsDto getReadinessAnalytics() {
        List<Student> students = studentRepository.findAll();
        long totalStudents = students.size();

        long assessmentsCompleted = assessmentRepository.countByStatus(AssessmentStatus.COMPLETED);

        if (totalStudents == 0) {
            return ReadinessAnalyticsDto.builder()
                    .totalStudents(0L)
                    .assessmentsCompleted(assessmentsCompleted)
                    .averageAptitudeScore(0.0)
                    .averageTechnicalScore(0.0)
                    .averageReadinessScore(0.0)
                    .highlyReadyCount(0L)
                    .readyCount(0L)
                    .needsImprovementCount(0L)
                    .atRiskCount(0L)
                    .build();
        }

        double aptSum = 0;
        int aptCount = 0;
        double techSum = 0;
        int techCount = 0;
        double readySum = 0;
        int readyCountTotal = 0;
        long highlyReady = 0;
        long ready = 0;
        long needsImp = 0;
        long atRisk = 0;

        for (Student s : students) {
            ReadinessResponse pred = predictionService.getLatestPredictionForStudent(s.getId());
            if (pred != null) {
                if (pred.getAptitudeScore() != null) {
                    aptSum += pred.getAptitudeScore();
                    aptCount++;
                }
                if (pred.getTechnicalScore() != null) {
                    techSum += pred.getTechnicalScore();
                    techCount++;
                }
                if (pred.getReadinessScore() != null) {
                    readySum += pred.getReadinessScore();
                    readyCountTotal++;
                }

                if (pred.getClassification() != null) {
                    switch (pred.getClassification()) {
                        case HIGHLY_READY -> highlyReady++;
                        case READY -> ready++;
                        case NEEDS_IMPROVEMENT -> needsImp++;
                        case AT_RISK -> atRisk++;
                    }
                }
            }
        }

        double avgApt = aptCount > 0 ? Math.round((aptSum / aptCount) * 10.0) / 10.0 : 0.0;
        double avgTech = techCount > 0 ? Math.round((techSum / techCount) * 10.0) / 10.0 : 0.0;
        double avgReady = readyCountTotal > 0 ? Math.round((readySum / readyCountTotal) * 10.0) / 10.0 : 0.0;

        return ReadinessAnalyticsDto.builder()
                .totalStudents(totalStudents)
                .assessmentsCompleted(assessmentsCompleted)
                .averageAptitudeScore(avgApt)
                .averageTechnicalScore(avgTech)
                .averageReadinessScore(avgReady)
                .highlyReadyCount(highlyReady)
                .readyCount(ready)
                .needsImprovementCount(needsImp)
                .atRiskCount(atRisk)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.staff.StaffDashboardDto getStaffDashboard(Long userId) {
        long assignedCount = userId != null ? mentorshipService.countAssignedStudentsForStaff(userId) : 0;
        long totalStudents = studentRepository.count();
        long completed = assessmentRepository.countByStatus(AssessmentStatus.COMPLETED);
        ReadinessAnalyticsDto readiness = getReadinessAnalytics();
        long activeCompanies = companyRepository.count();

        return com.careerready.dto.staff.StaffDashboardDto.builder()
                .assignedStudentsCount(assignedCount)
                .totalStudents(totalStudents)
                .assessmentsCompleted(completed)
                .atRiskCount(readiness.getAtRiskCount())
                .averageReadinessScore(readiness.getAverageReadinessScore())
                .highlyReadyCount(readiness.getHighlyReadyCount())
                .readyCount(readiness.getReadyCount())
                .needsImprovementCount(readiness.getNeedsImprovementCount())
                .activeCompanies(activeCompanies)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.common.UserProfileDto getStaffProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        PlacementStaff staff = staffRepository.findByUserId(userId).orElse(null);
        String deptName = staff != null && staff.getDepartment() != null ? staff.getDepartment().getName() : "Placement Department";
        Long deptId = staff != null && staff.getDepartment() != null ? staff.getDepartment().getId() : null;

        return com.careerready.dto.common.UserProfileDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .department(deptName)
                .departmentId(deptId)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffStudentItemDto> getMyAssignedStudents(Long userId) {
        return mentorshipService.getAssignedStudentsForStaff(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public SkillGapAnalyticsDto getSkillGapAnalytics() {
        List<Student> students = studentRepository.findAll();
        List<CompanySkill> companySkills = companySkillRepository.findAll();

        Map<String, Set<Long>> skillMissingStudents = new HashMap<>();
        Map<String, String> skillCategoryMap = new HashMap<>();

        for (CompanySkill cs : companySkills) {
            if (cs.getSkill() == null) continue;
            String skillName = cs.getSkill().getName();
            skillMissingStudents.putIfAbsent(skillName, new HashSet<>());
            skillCategoryMap.putIfAbsent(skillName, cs.getSkill().getCategory() != null ? cs.getSkill().getCategory() : "Technical");
        }

        for (Student s : students) {
            List<StudentSkill> skills = studentSkillRepository.findByStudentId(s.getId());
            Set<String> studentSkillNames = skills.stream()
                    .filter(ss -> ss.getSkill() != null)
                    .map(ss -> ss.getSkill().getName().toLowerCase().trim())
                    .collect(Collectors.toSet());

            for (CompanySkill cs : companySkills) {
                if (cs.getSkill() == null) continue;
                String name = cs.getSkill().getName();
                if (!studentSkillNames.contains(name.toLowerCase().trim())) {
                    skillMissingStudents.get(name).add(s.getId());
                }
            }
        }

        long totalStudents = Math.max(1, students.size());
        List<SkillGapCountDto> gapsList = new ArrayList<>();

        for (Map.Entry<String, Set<Long>> entry : skillMissingStudents.entrySet()) {
            long count = entry.getValue().size();
            double pct = Math.round(((double) count / totalStudents) * 1000.0) / 10.0;

            gapsList.add(SkillGapCountDto.builder()
                    .skill(entry.getKey())
                    .studentCount(count)
                    .percentage(pct)
                    .category(skillCategoryMap.get(entry.getKey()))
                    .build());
        }

        // Sort descending by student count
        gapsList.sort((a, b) -> Long.compare(b.getStudentCount(), a.getStudentCount()));

        return SkillGapAnalyticsDto.builder()
                .mostCommonSkillGaps(gapsList)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffCompanyAnalyticsDto> getCompanyAnalytics() {
        List<Company> companies = companyRepository.findByActiveTrue();
        List<Student> students = studentRepository.findAll();
        List<StaffCompanyAnalyticsDto> list = new ArrayList<>();

        for (Company c : companies) {
            long eligibleCount = 0;
            double matchSum = 0;
            Map<String, Integer> matchedSkillFreq = new HashMap<>();
            Map<String, Integer> gapSkillFreq = new HashMap<>();

            List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(c.getId());
            List<String> requiredSkillNames = companySkills.stream()
                    .filter(cs -> cs.getSkill() != null)
                    .map(cs -> cs.getSkill().getName() + " (" + (cs.getRequiredLevel() != null ? cs.getRequiredLevel().name() : "INTERMEDIATE") + (Boolean.TRUE.equals(cs.getMandatory()) ? " - Mandatory" : "") + ")")
                    .toList();

            for (Student s : students) {
                CompanyMatchResponse match = companyMatchingService.getCompanyMatchDetail(c.getId(), s.getId());
                matchSum += match.getMatchPercentage() != null ? match.getMatchPercentage() : 0;
                if ("Eligible".equalsIgnoreCase(match.getEligibilityStatus())) {
                    eligibleCount++;
                }

                if (match.getMatchedSkills() != null) {
                    for (String ms : match.getMatchedSkills()) {
                        matchedSkillFreq.put(ms, matchedSkillFreq.getOrDefault(ms, 0) + 1);
                    }
                }
                if (match.getSkillGaps() != null) {
                    for (String gs : match.getSkillGaps()) {
                        gapSkillFreq.put(gs, gapSkillFreq.getOrDefault(gs, 0) + 1);
                    }
                }
            }

            double avgMatch = students.isEmpty() ? 0.0 : Math.round((matchSum / students.size()) * 10.0) / 10.0;

            List<String> topMatched = matchedSkillFreq.entrySet().stream()
                    .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                    .limit(4)
                    .map(Map.Entry::getKey)
                    .toList();

            List<String> commonGaps = gapSkillFreq.entrySet().stream()
                    .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                    .limit(4)
                    .map(Map.Entry::getKey)
                    .toList();

            int minApt = c.getMinimumAptitudeScore() != null ? (int) Math.round(c.getMinimumAptitudeScore()) : 60;
            int minTech = c.getMinimumTechnicalScore() != null ? (int) Math.round(c.getMinimumTechnicalScore()) : 60;

            list.add(StaffCompanyAnalyticsDto.builder()
                    .companyId(c.getId())
                    .id(c.getId())
                    .company(c.getName())
                    .companyName(c.getName())
                    .description(c.getDescription())
                    .requiredCgpa(c.getRequiredCgpa() != null ? c.getRequiredCgpa() : 7.0)
                    .minimumAptitudeScore(minApt)
                    .minimumTechnicalScore(minTech)
                    .requiredSkills(requiredSkillNames)
                    .eligibleStudents(eligibleCount)
                    .eligibleStudentCount(eligibleCount)
                    .totalStudents((long) students.size())
                    .averageMatchPercentage(avgMatch)
                    .topMatchedSkills(topMatched)
                    .commonSkillGaps(commonGaps)
                    .build());
        }

        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.staff.CompanyEligibleStudentDto> getEligibleStudentsForCompany(
            Long companyId, String status, String department, String search) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(companyId);
        List<String> requiredSkillNames = companySkills.stream()
                .filter(cs -> cs.getSkill() != null)
                .map(cs -> cs.getSkill().getName() + " (" + (cs.getRequiredLevel() != null ? cs.getRequiredLevel().name() : "INTERMEDIATE") + (Boolean.TRUE.equals(cs.getMandatory()) ? " - Mandatory" : "") + ")")
                .toList();

        List<Student> students = studentRepository.findAll();
        List<com.careerready.dto.staff.CompanyEligibleStudentDto> result = new ArrayList<>();

        for (Student s : students) {
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "General";
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("All")) {
                if (!deptName.equalsIgnoreCase(department.trim())) {
                    continue;
                }
            }

            String sName = s.getUser() != null ? s.getUser().getName() : "";
            String regNo = s.getRegisterNumber() != null ? s.getRegisterNumber() : "";
            if (search != null && !search.isBlank()) {
                String q = search.trim().toLowerCase();
                boolean matchName = sName.toLowerCase().contains(q);
                boolean matchReg = regNo.toLowerCase().contains(q);
                if (!matchName && !matchReg) {
                    continue;
                }
            }

            // Real assessment scores from assessmentRepository
            List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(s.getId());
            Integer aptScore = null;
            Integer techScore = null;
            for (Assessment a : assessments) {
                if (a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null) {
                    if (a.getAssessmentType() == AssessmentType.APTITUDE && aptScore == null) {
                        aptScore = (int) Math.round(a.getPercentage());
                    } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && techScore == null) {
                        techScore = (int) Math.round(a.getPercentage());
                    }
                }
            }

            boolean bothCompleted = (aptScore != null && techScore != null);
            String assessmentStatusDisplay;
            if (bothCompleted) {
                assessmentStatusDisplay = "Completed";
            } else if (aptScore != null) {
                assessmentStatusDisplay = "Pending Technical";
            } else if (techScore != null) {
                assessmentStatusDisplay = "Pending Aptitude";
            } else {
                assessmentStatusDisplay = "Not Completed";
            }

            List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(s.getId());
            CompanyMatchResponse match = companyMatchingService.evaluateCompanyMatch(
                    s, company, studentSkills, companySkills, aptScore, techScore);

            boolean isEligible = "Eligible".equalsIgnoreCase(match.getEligibilityStatus());

            // Filter by eligibility status
            // Default or ELIGIBLE -> only isEligible == true
            if (status == null || status.isBlank() || status.equalsIgnoreCase("ELIGIBLE")) {
                if (!isEligible) continue;
            } else if (status.equalsIgnoreCase("NOT_ELIGIBLE")) {
                if (isEligible) continue;
            } // else if status is ALL, include both

            result.add(com.careerready.dto.staff.CompanyEligibleStudentDto.builder()
                    .studentId(s.getId())
                    .id(s.getId())
                    .studentName(sName)
                    .name(sName)
                    .registerNumber(regNo)
                    .department(deptName)
                    .departmentName(deptName)
                    .year(s.getYear())
                    .cgpa(s.getCgpa())
                    .aptitudeScore(aptScore)
                    .technicalScore(techScore)
                    .assessmentsCompleted(bothCompleted)
                    .assessmentStatus(assessmentStatusDisplay)
                    .matchedSkills(match.getMatchedSkills())
                    .skillGaps(match.getSkillGaps())
                    .requiredSkills(requiredSkillNames)
                    .matchPercentage(match.getMatchPercentage())
                    .eligibilityStatus(match.getEligibilityStatus())
                    .isEligible(isEligible)
                    .companyId(company.getId())
                    .companyName(company.getName())
                    .requiredCgpa(company.getRequiredCgpa() != null ? company.getRequiredCgpa() : 7.0)
                    .minimumAptitudeScore(company.getMinimumAptitudeScore() != null ? (int) Math.round(company.getMinimumAptitudeScore()) : 60)
                    .minimumTechnicalScore(company.getMinimumTechnicalScore() != null ? (int) Math.round(company.getMinimumTechnicalScore()) : 60)
                    .build());
        }

        // Sort by match percentage descending
        result.sort((a, b) -> Integer.compare(
                b.getMatchPercentage() != null ? b.getMatchPercentage() : 0,
                a.getMatchPercentage() != null ? a.getMatchPercentage() : 0));

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.careerready.dto.staff.StudentSkillGapDto> getStudentSkillGaps(
            String department, String skill, String company, String skillLevel, String priority, String search) {
        List<Student> students = studentRepository.findAll();
        List<Company> companies = companyRepository.findByActiveTrue();
        List<com.careerready.dto.staff.StudentSkillGapDto> result = new ArrayList<>();

        for (Student s : students) {
            String deptName = s.getDepartment() != null ? s.getDepartment().getName() : "General";
            if (department != null && !department.isBlank() && !department.equalsIgnoreCase("All")) {
                if (!deptName.equalsIgnoreCase(department.trim())) {
                    continue;
                }
            }

            String sName = s.getUser() != null ? s.getUser().getName() : "";
            String regNo = s.getRegisterNumber() != null ? s.getRegisterNumber() : "";

            List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(s.getId());
            Map<String, StudentSkill> studentSkillMap = new HashMap<>();
            for (StudentSkill ss : studentSkills) {
                if (ss.getSkill() != null) {
                    studentSkillMap.put(ss.getSkill().getName().toLowerCase().trim(), ss);
                }
            }

            for (Company c : companies) {
                if (company != null && !company.isBlank() && !company.equalsIgnoreCase("All")) {
                    if (!c.getName().equalsIgnoreCase(company.trim()) && !String.valueOf(c.getId()).equals(company.trim())) {
                        continue;
                    }
                }

                List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(c.getId());
                for (CompanySkill cs : companySkills) {
                    if (cs.getSkill() == null) continue;

                    String skName = cs.getSkill().getName();
                    String skCategory = cs.getSkill().getCategory() != null ? cs.getSkill().getCategory() : "Technical";

                    if (skill != null && !skill.isBlank() && !skill.equalsIgnoreCase("All")) {
                        if (!skName.equalsIgnoreCase(skill.trim())) {
                            continue;
                        }
                    }

                    SkillLevel reqLevel = cs.getRequiredLevel() != null ? cs.getRequiredLevel() : SkillLevel.INTERMEDIATE;
                    StudentSkill ss = studentSkillMap.get(skName.toLowerCase().trim());
                    SkillLevel currLevel = ss != null ? ss.getCurrentLevel() : null;

                    // Condition check:
                    // 1. Student does not have the required skill -> Skill Gap
                    // 2. Student has skill but below required level -> Skill Gap
                    // 3. Student meets or exceeds -> No Gap (do NOT add)
                    if (currLevel != null && currLevel.ordinal() >= reqLevel.ordinal()) {
                        continue; // Satisfies requirement -> No Gap!
                    }

                    boolean isMissing = (currLevel == null);
                    String currentLevelStr = isMissing ? "NONE" : currLevel.name();
                    String gapStatus = isMissing ? "Missing Skill" : "Below Required Level";
                    String gapPriority = determineGapPriority(currLevel, reqLevel, Boolean.TRUE.equals(cs.getMandatory()));

                    if (skillLevel != null && !skillLevel.isBlank() && !skillLevel.equalsIgnoreCase("All")) {
                        if (!currentLevelStr.equalsIgnoreCase(skillLevel.trim()) && !reqLevel.name().equalsIgnoreCase(skillLevel.trim())) {
                            continue;
                        }
                    }

                    if (priority != null && !priority.isBlank() && !priority.equalsIgnoreCase("All")) {
                        if (!gapPriority.equalsIgnoreCase(priority.trim())) {
                            continue;
                        }
                    }

                    if (search != null && !search.isBlank()) {
                        String q = search.trim().toLowerCase();
                        boolean matchName = sName.toLowerCase().contains(q);
                        boolean matchReg = regNo.toLowerCase().contains(q);
                        boolean matchSkill = skName.toLowerCase().contains(q);
                        if (!matchName && !matchReg && !matchSkill) {
                            continue;
                        }
                    }

                    result.add(com.careerready.dto.staff.StudentSkillGapDto.builder()
                            .studentId(s.getId())
                            .studentName(sName)
                            .registerNumber(regNo)
                            .department(deptName)
                            .skillId(cs.getSkill().getId())
                            .skill(skName)
                            .skillName(skName)
                            .category(skCategory)
                            .currentLevel(currentLevelStr)
                            .requiredLevel(reqLevel.name())
                            .gapStatus(gapStatus)
                            .gapPriority(gapPriority)
                            .companyId(c.getId())
                            .company(c.getName())
                            .companyName(c.getName())
                            .mandatory(cs.getMandatory())
                            .build());
                }
            }
        }

        // Sort: HIGH priority first, then MEDIUM, then LOW
        result.sort((a, b) -> {
            int pA = "HIGH".equalsIgnoreCase(a.getGapPriority()) ? 3 : "MEDIUM".equalsIgnoreCase(a.getGapPriority()) ? 2 : 1;
            int pB = "HIGH".equalsIgnoreCase(b.getGapPriority()) ? 3 : "MEDIUM".equalsIgnoreCase(b.getGapPriority()) ? 2 : 1;
            int comp = Integer.compare(pB, pA);
            if (comp != 0) return comp;
            return a.getStudentName().compareToIgnoreCase(b.getStudentName());
        });

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public com.careerready.dto.staff.StudentSkillGapDetailDto getStudentSkillGapDetail(Long studentId, Long companyId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(studentId);
        Map<String, StudentSkill> studentSkillMap = new HashMap<>();
        for (StudentSkill ss : studentSkills) {
            if (ss.getSkill() != null) {
                studentSkillMap.put(ss.getSkill().getName().toLowerCase().trim(), ss);
            }
        }

        List<Assessment> assessments = assessmentRepository.findByStudentIdOrderByCreatedAtDesc(studentId);
        Integer aptScore = null;
        Integer techScore = null;
        for (Assessment a : assessments) {
            if (a.getStatus() == AssessmentStatus.COMPLETED && a.getPercentage() != null) {
                if (a.getAssessmentType() == AssessmentType.APTITUDE && aptScore == null) {
                    aptScore = (int) Math.round(a.getPercentage());
                } else if (a.getAssessmentType() == AssessmentType.TECHNICAL && techScore == null) {
                    techScore = (int) Math.round(a.getPercentage());
                }
            }
        }

        List<Company> companies;
        if (companyId != null) {
            Company c = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
            companies = List.of(c);
        } else {
            companies = companyRepository.findByActiveTrue();
        }

        List<com.careerready.dto.staff.StudentSkillGapDetailDto.SkillGapDetailItem> gaps = new ArrayList<>();
        List<com.careerready.dto.staff.StudentSkillGapDetailDto.SkillMetDetailItem> met = new ArrayList<>();

        for (Company c : companies) {
            List<CompanySkill> companySkills = companySkillRepository.findByCompanyId(c.getId());
            for (CompanySkill cs : companySkills) {
                if (cs.getSkill() == null) continue;

                String skName = cs.getSkill().getName();
                String skCategory = cs.getSkill().getCategory() != null ? cs.getSkill().getCategory() : "Technical";
                SkillLevel reqLevel = cs.getRequiredLevel() != null ? cs.getRequiredLevel() : SkillLevel.INTERMEDIATE;
                StudentSkill ss = studentSkillMap.get(skName.toLowerCase().trim());
                SkillLevel currLevel = ss != null ? ss.getCurrentLevel() : null;

                if (currLevel != null && currLevel.ordinal() >= reqLevel.ordinal()) {
                    met.add(com.careerready.dto.staff.StudentSkillGapDetailDto.SkillMetDetailItem.builder()
                            .skill(skName)
                            .category(skCategory)
                            .currentLevel(currLevel.name())
                            .requiredLevel(reqLevel.name())
                            .companyName(c.getName())
                            .status(currLevel.ordinal() > reqLevel.ordinal() ? "Exceeds Requirement" : "Meets Requirement")
                            .build());
                } else {
                    String gapPriority = determineGapPriority(currLevel, reqLevel, Boolean.TRUE.equals(cs.getMandatory()));
                    String rec = buildRecommendation(skName, reqLevel, currLevel);

                    gaps.add(com.careerready.dto.staff.StudentSkillGapDetailDto.SkillGapDetailItem.builder()
                            .skill(skName)
                            .category(skCategory)
                            .currentLevel(currLevel != null ? currLevel.name() : "None")
                            .requiredLevel(reqLevel.name())
                            .gapLevel(gapPriority)
                            .companyName(c.getName())
                            .mandatory(cs.getMandatory())
                            .recommendation(rec)
                            .build());
                }
            }
        }

        // Sort gaps by priority
        gaps.sort((a, b) -> {
            int pA = "HIGH".equalsIgnoreCase(a.getGapLevel()) ? 3 : "MEDIUM".equalsIgnoreCase(a.getGapLevel()) ? 2 : 1;
            int pB = "HIGH".equalsIgnoreCase(b.getGapLevel()) ? 3 : "MEDIUM".equalsIgnoreCase(b.getGapLevel()) ? 2 : 1;
            return Integer.compare(pB, pA);
        });

        String deptName = student.getDepartment() != null ? student.getDepartment().getName() : "General";
        String sName = student.getUser() != null ? student.getUser().getName() : "";

        return com.careerready.dto.staff.StudentSkillGapDetailDto.builder()
                .studentId(student.getId())
                .studentName(sName)
                .registerNumber(student.getRegisterNumber())
                .department(deptName)
                .cgpa(student.getCgpa())
                .aptitudeScore(aptScore)
                .technicalScore(techScore)
                .assessmentsCompleted(aptScore != null && techScore != null)
                .skillsRequiringImprovement(gaps)
                .skillsCurrentlyMet(met)
                .build();
    }

    private String determineGapPriority(SkillLevel current, SkillLevel required, boolean mandatory) {
        if (current == null) {
            return mandatory ? "HIGH" : "MEDIUM";
        }
        int diff = required.ordinal() - current.ordinal();
        if (diff >= 2 || (diff >= 1 && mandatory)) return "HIGH";
        if (diff == 1) return "MEDIUM";
        return "LOW";
    }

    private String buildRecommendation(String skill, SkillLevel required, SkillLevel current) {
        if (current == null) {
            return "Complete foundational curriculum in " + skill + " and build a portfolio project targeting " + required + " proficiency.";
        }
        return "Advance knowledge in " + skill + " from " + current + " to " + required + " through targeted interview problem-solving.";
    }
}
