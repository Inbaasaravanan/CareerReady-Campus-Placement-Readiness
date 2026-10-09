package com.careerready;

import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.company.CompanySkillGapResponse;
import com.careerready.entity.Company;
import com.careerready.entity.CompanySkill;
import com.careerready.entity.Skill;
import com.careerready.entity.Student;
import com.careerready.entity.StudentSkill;
import com.careerready.enums.SkillLevel;
import com.careerready.repository.AssessmentRepository;
import com.careerready.repository.CompanyRepository;
import com.careerready.repository.CompanySkillRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.service.impl.CompanyMatchingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyMatchingServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanySkillRepository companySkillRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private StudentSkillRepository studentSkillRepository;

    @Mock
    private AssessmentRepository assessmentRepository;

    @InjectMocks
    private CompanyMatchingServiceImpl companyMatchingService;

    private Student student;
    private Company tcs;
    private Skill javaSkill;
    private Skill dataStructuresSkill;

    @BeforeEach
    void setUp() {
        student = Student.builder().id(10L).cgpa(8.2).build();

        tcs = Company.builder()
                .id(1L)
                .name("TCS")
                .requiredCgpa(7.0)
                .minimumAptitudeScore(60.0)
                .minimumTechnicalScore(60.0)
                .active(true)
                .build();

        javaSkill = Skill.builder().id(100L).name("Java").build();
        dataStructuresSkill = Skill.builder().id(101L).name("Data Structures").build();
    }

    @Test
    @DisplayName("Should evaluate company matches and identify matched skills and gaps")
    void testGetCompanyMatches() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(companyRepository.findByActiveTrue()).thenReturn(List.of(tcs));
        when(assessmentRepository.findByStudentIdOrderByCreatedAtDesc(10L)).thenReturn(Collections.emptyList());

        // Student has Java at ADVANCED level
        StudentSkill sSkill = StudentSkill.builder().student(student).skill(javaSkill).currentLevel(SkillLevel.ADVANCED).build();
        when(studentSkillRepository.findByStudentId(10L)).thenReturn(List.of(sSkill));

        // Company requires Java (INTERMEDIATE) and Data Structures (INTERMEDIATE)
        CompanySkill csJava = CompanySkill.builder().company(tcs).skill(javaSkill).requiredLevel(SkillLevel.INTERMEDIATE).mandatory(true).build();
        CompanySkill csDS = CompanySkill.builder().company(tcs).skill(dataStructuresSkill).requiredLevel(SkillLevel.INTERMEDIATE).mandatory(true).build();
        when(companySkillRepository.findByCompanyId(1L)).thenReturn(List.of(csJava, csDS));

        List<CompanyMatchResponse> matches = companyMatchingService.getCompanyMatchesForStudent(10L, "All");

        assertNotNull(matches);
        assertEquals(1, matches.size());
        CompanyMatchResponse match = matches.get(0);
        assertEquals("TCS", match.getCompanyName());
        assertTrue(match.getMatchedSkills().contains("Java"));
        assertTrue(match.getSkillGaps().contains("Data Structures"));
    }

    @Test
    @DisplayName("Should compute company-specific skill gaps dynamically")
    void testCompanySpecificSkillGaps() {
        when(studentRepository.findById(10L)).thenReturn(Optional.of(student));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(tcs));

        // Student has Java BEGINNER, does not have Data Structures
        StudentSkill sSkill = StudentSkill.builder().student(student).skill(javaSkill).currentLevel(SkillLevel.BEGINNER).build();
        when(studentSkillRepository.findByStudentId(10L)).thenReturn(List.of(sSkill));

        // Company requires Java INTERMEDIATE and Data Structures INTERMEDIATE (mandatory)
        CompanySkill csJava = CompanySkill.builder().company(tcs).skill(javaSkill).requiredLevel(SkillLevel.INTERMEDIATE).mandatory(false).build();
        CompanySkill csDS = CompanySkill.builder().company(tcs).skill(dataStructuresSkill).requiredLevel(SkillLevel.INTERMEDIATE).mandatory(true).build();
        when(companySkillRepository.findByCompanyId(1L)).thenReturn(List.of(csJava, csDS));

        CompanySkillGapResponse response = companyMatchingService.getCompanySkillGapsForStudent(1L, 10L);

        assertNotNull(response);
        assertEquals("TCS", response.getCompanyName());
        assertEquals(2, response.getSkillGaps().size());

        // Java: 1 level below (BEGINNER vs INTERMEDIATE) -> MEDIUM gap
        var javaGap = response.getSkillGaps().stream().filter(g -> g.getSkill().equals("Java")).findFirst().orElseThrow();
        assertEquals("MEDIUM", javaGap.getGapLevel());

        // Data Structures: completely missing & mandatory -> HIGH gap
        var dsGap = response.getSkillGaps().stream().filter(g -> g.getSkill().equals("Data Structures")).findFirst().orElseThrow();
        assertEquals("HIGH", dsGap.getGapLevel());
    }
}
