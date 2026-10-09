package com.careerready.service.impl;

import com.careerready.dto.assessment.AssessmentResultResponse;
import com.careerready.dto.company.CompanyMatchResponse;
import com.careerready.dto.readiness.ReadinessResponse;
import com.careerready.dto.skill.StudentSkillDto;
import com.careerready.dto.skill.UpdateStudentSkillsRequest;
import com.careerready.dto.student.SemesterMarkDto;
import com.careerready.dto.student.StudentProfileResponse;
import com.careerready.dto.student.UpdateStudentProfileRequest;
import com.careerready.entity.Skill;
import com.careerready.entity.Student;
import com.careerready.entity.StudentAcademicRecord;
import com.careerready.entity.StudentSkill;
import com.careerready.entity.User;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.SkillRepository;
import com.careerready.repository.StudentAcademicRecordRepository;
import com.careerready.repository.StudentRepository;
import com.careerready.repository.StudentSkillRepository;
import com.careerready.repository.UserRepository;
import com.careerready.service.AssessmentService;
import com.careerready.service.CompanyMatchingService;
import com.careerready.service.PredictionService;
import com.careerready.service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentAcademicRecordRepository studentAcademicRecordRepository;
    private final AssessmentService assessmentService;
    private final PredictionService predictionService;
    private final CompanyMatchingService companyMatchingService;
    private final com.careerready.repository.MentorshipAssignmentRepository mentorshipAssignmentRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getProfileByUserId(Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));

        return buildStudentProfileResponse(student);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentProfileResponse getProfileByStudentId(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));

        return buildStudentProfileResponse(student);
    }

    @Override
    @Transactional
    public StudentProfileResponse updateProfile(Long userId, UpdateStudentProfileRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));

        if (request.getName() != null && !request.getName().isBlank()) {
            User user = student.getUser();
            user.setName(request.getName().trim());
            userRepository.save(user);
        }

        if (request.getYear() != null) student.setYear(request.getYear());
        if (request.getCgpa() != null) student.setCgpa(request.getCgpa());
        if (request.getTenthPercentage() != null) student.setTenthPercentage(request.getTenthPercentage());
        if (request.getTwelfthPercentage() != null) student.setTwelfthPercentage(request.getTwelfthPercentage());
        if (request.getBacklogs() != null) student.setBacklogs(request.getBacklogs());
        if (request.getCommunicationScore() != null) student.setCommunicationScore(request.getCommunicationScore());
        if (request.getProblemSolvingScore() != null) student.setProblemSolvingScore(request.getProblemSolvingScore());
        if (request.getTeamworkScore() != null) student.setTeamworkScore(request.getTeamworkScore());
        if (request.getProgrammingScore() != null) student.setProgrammingScore(request.getProgrammingScore());
        if (request.getTechnicalSkillScore() != null) student.setTechnicalSkillScore(request.getTechnicalSkillScore());

        final Student savedStudent = studentRepository.save(student);

        // Update skills if provided
        if (request.getSkills() != null) {
            updateStudentSkillsInternal(savedStudent, request.getSkills());
        }

        // Update semester marks if provided
        if (request.getSemesterMarks() != null) {
            studentAcademicRecordRepository.deleteByStudentId(savedStudent.getId());
            studentAcademicRecordRepository.flush();
            List<StudentAcademicRecord> newRecords = request.getSemesterMarks().stream()
                    .filter(sm -> sm.getSemester() != null && sm.getMarks() != null)
                    .map(sm -> StudentAcademicRecord.builder()
                            .student(savedStudent)
                            .semester(sm.getSemester())
                            .marks(sm.getMarks())
                            .build())
                    .collect(Collectors.toList());
            if (!newRecords.isEmpty()) {
                studentAcademicRecordRepository.saveAll(newRecords);
            }
        }

        // Re-evaluate readiness prediction with newly updated student parameters
        try {
            predictionService.predictAndSaveForStudent(savedStudent);
        } catch (Exception ex) {
            log.error("Failed to recompute readiness prediction after profile update: {}", ex.getMessage());
        }

        return buildStudentProfileResponse(savedStudent);
    }

    @Override
    @Transactional
    public StudentProfileResponse updateSkills(Long userId, UpdateStudentSkillsRequest request) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user id: " + userId));

        if (request.getSkills() != null) {
            updateStudentSkillsInternal(student, request.getSkills());
        }

        return buildStudentProfileResponse(student);
    }

    private void updateStudentSkillsInternal(Student student, List<StudentSkillDto> skillDtos) {
        studentSkillRepository.deleteByStudentId(student.getId());
        studentSkillRepository.flush();

        List<StudentSkill> newSkills = new ArrayList<>();
        for (StudentSkillDto dto : skillDtos) {
            Skill skill = null;
            if (dto.getSkillId() != null) {
                skill = skillRepository.findById(dto.getSkillId()).orElse(null);
            }
            if (skill == null && dto.getSkillName() != null) {
                skill = skillRepository.findByNameIgnoreCase(dto.getSkillName()).orElse(null);
            }

            if (skill != null && dto.getCurrentLevel() != null) {
                newSkills.add(StudentSkill.builder()
                        .student(student)
                        .skill(skill)
                        .currentLevel(dto.getCurrentLevel())
                        .build());
            }
        }
        if (!newSkills.isEmpty()) {
            studentSkillRepository.saveAll(newSkills);
        }
    }

    private StudentProfileResponse buildStudentProfileResponse(Student student) {
        List<StudentSkill> studentSkills = studentSkillRepository.findByStudentId(student.getId());
        List<StudentSkillDto> skillDtos = studentSkills.stream()
                .map(ss -> StudentSkillDto.builder()
                        .skillId(ss.getSkill().getId())
                        .skillName(ss.getSkill().getName())
                        .category(ss.getSkill().getCategory())
                        .currentLevel(ss.getCurrentLevel())
                        .build())
                .collect(Collectors.toList());

        List<SemesterMarkDto> semesterMarks = studentAcademicRecordRepository.findByStudentIdOrderBySemesterAsc(student.getId()).stream()
                .map(ar -> SemesterMarkDto.builder()
                        .semester(ar.getSemester())
                        .marks(ar.getMarks())
                        .build())
                .collect(Collectors.toList());

        ReadinessResponse latestReadiness = predictionService.getLatestPredictionForStudent(student.getId());
        Map<String, AssessmentResultResponse> assessmentStatus = assessmentService.getStudentAssessmentStatus(student.getId());
        List<CompanyMatchResponse> companyMatches = companyMatchingService.getCompanyMatchesForStudent(student.getId(), "All");

        // Aggregated skill gaps across companies
        List<String> combinedGaps = companyMatches.stream()
                .filter(c -> c.getSkillGaps() != null)
                .flatMap(c -> c.getSkillGaps().stream())
                .distinct()
                .limit(6)
                .toList();

        // Mentorship details if assigned
        String mentorName = null;
        String mentorEmail = null;
        Long mentorStaffId = null;
        if (mentorshipAssignmentRepository != null) {
            var assignment = mentorshipAssignmentRepository.findByStudentIdAndActiveTrue(student.getId()).orElse(null);
            if (assignment != null && assignment.getStaff() != null) {
                mentorStaffId = assignment.getStaff().getId();
                if (assignment.getStaff().getUser() != null) {
                    mentorName = assignment.getStaff().getUser().getName();
                    mentorEmail = assignment.getStaff().getUser().getEmail();
                }
            }
        }

        return StudentProfileResponse.builder()
                .id(student.getId())
                .userId(student.getUser() != null ? student.getUser().getId() : null)
                .name(student.getUser() != null ? student.getUser().getName() : null)
                .email(student.getUser() != null ? student.getUser().getEmail() : null)
                .registerNumber(student.getRegisterNumber())
                .departmentId(student.getDepartment() != null ? student.getDepartment().getId() : null)
                .department(student.getDepartment() != null ? student.getDepartment().getName() : null)
                .departmentName(student.getDepartment() != null ? student.getDepartment().getName() : null)
                .year(student.getYear())
                .cgpa(student.getCgpa())
                .tenthPercentage(student.getTenthPercentage())
                .twelfthPercentage(student.getTwelfthPercentage())
                .backlogs(student.getBacklogs())
                .communicationScore(student.getCommunicationScore())
                .problemSolvingScore(student.getProblemSolvingScore())
                .teamworkScore(student.getTeamworkScore())
                .programmingScore(student.getProgrammingScore())
                .technicalSkillScore(student.getTechnicalSkillScore())
                .technicalSkillsScore(student.getTechnicalSkillScore())
                .aptitudeScore(latestReadiness.getAptitudeScore())
                .technicalScore(latestReadiness.getTechnicalScore())
                .academicScore(latestReadiness.getAcademicScore())
                .readinessScore(latestReadiness.getReadinessScore())
                .classification(latestReadiness.getClassification())
                .classificationDisplay(latestReadiness.getClassificationDisplay())
                .skills(skillDtos)
                .semesterMarks(semesterMarks)
                .skillGaps(combinedGaps)
                .assessmentStatus(assessmentStatus)
                .companyMatches(companyMatches)
                .latestReadiness(latestReadiness)
                .status(student.getUser() != null && student.getUser().getStatus() != null ? student.getUser().getStatus().name() : "ACTIVE")
                .lastLoginAt(student.getUser() != null ? student.getUser().getLastLoginAt() : null)
                .mentorName(mentorName)
                .mentorEmail(mentorEmail)
                .mentorStaffId(mentorStaffId)
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }
}
