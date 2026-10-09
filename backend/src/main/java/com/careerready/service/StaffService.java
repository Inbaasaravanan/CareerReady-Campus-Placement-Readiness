package com.careerready.service;

import com.careerready.dto.staff.AtRiskStudentDto;
import com.careerready.dto.staff.ReadinessAnalyticsDto;
import com.careerready.dto.staff.SkillGapAnalyticsDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;
import com.careerready.dto.staff.StaffStudentItemDto;
import com.careerready.enums.ReadinessClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StaffService {

    Page<StaffStudentItemDto> getStudents(Long staffUserId, String search, String department, Integer year, ReadinessClassification classification, Pageable pageable);

    Page<StaffStudentItemDto> getStudents(String search, String department, Integer year, ReadinessClassification classification, Pageable pageable);

    List<StaffStudentItemDto> getAllStudents();

    List<AtRiskStudentDto> getAtRiskStudents();

    ReadinessAnalyticsDto getReadinessAnalytics();

    SkillGapAnalyticsDto getSkillGapAnalytics();

    List<StaffCompanyAnalyticsDto> getCompanyAnalytics();

    List<com.careerready.dto.staff.StudentSkillGapDto> getStudentSkillGaps(
            String department, String skill, String company, String skillLevel, String priority, String search);

    com.careerready.dto.staff.StudentSkillGapDetailDto getStudentSkillGapDetail(Long studentId, Long companyId);

    List<com.careerready.dto.staff.CompanyEligibleStudentDto> getEligibleStudentsForCompany(
            Long companyId, String status, String department, String search);

    com.careerready.dto.staff.StaffDashboardDto getStaffDashboard(Long userId);

    com.careerready.dto.common.UserProfileDto getStaffProfile(Long userId);

    List<StaffStudentItemDto> getMyAssignedStudents(Long userId);
}
