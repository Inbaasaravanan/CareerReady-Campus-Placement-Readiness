package com.careerready.service;

import com.careerready.dto.hod.DepartmentAnalyticsDto;
import com.careerready.dto.hod.HodAnalyticsDto;
import com.careerready.dto.hod.HodAtRiskAnalyticsDto;
import com.careerready.dto.staff.StaffCompanyAnalyticsDto;

import java.util.List;

public interface HodAnalyticsService {

    HodAnalyticsDto getInstitutionAnalytics();

    List<DepartmentAnalyticsDto> getDepartmentAnalytics();

    HodAtRiskAnalyticsDto getAtRiskAnalytics();

    List<StaffCompanyAnalyticsDto> getCompanyAnalytics();

    List<com.careerready.dto.hod.StaffMonitoringDto> getStaffMonitoring();

    com.careerready.dto.hod.HodDashboardDto getHodDashboard();

    com.careerready.dto.common.UserProfileDto getHodProfile(Long userId);
}
