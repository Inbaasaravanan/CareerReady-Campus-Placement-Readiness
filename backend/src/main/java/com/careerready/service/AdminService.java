package com.careerready.service;

import com.careerready.dto.admin.CreateUserRequest;
import com.careerready.dto.admin.DepartmentDto;
import com.careerready.dto.admin.DepartmentRequest;
import com.careerready.dto.admin.HodDto;
import com.careerready.dto.admin.HodRequest;
import com.careerready.dto.admin.StaffDto;
import com.careerready.dto.admin.StaffRequest;
import com.careerready.dto.admin.UpdateUserRequest;
import com.careerready.dto.admin.UserDto;
import com.careerready.dto.company.CompanyDto;
import com.careerready.dto.company.CompanyRequest;
import com.careerready.dto.skill.SkillDto;
import com.careerready.dto.skill.SkillRequest;
import com.careerready.dto.student.StudentProfileResponse;

import java.util.List;

public interface AdminService {

    // User management
    List<UserDto> getAllUsers();
    UserDto getUserById(Long id);
    UserDto createUser(CreateUserRequest request);
    UserDto updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);

    // Students
    List<StudentProfileResponse> getAllStudents();
    void deleteStudent(Long id);

    // Staff
    List<StaffDto> getAllStaff();
    StaffDto createStaff(StaffRequest request);
    StaffDto updateStaff(Long id, StaffRequest request);
    void deleteStaff(Long id);

    // HOD
    List<HodDto> getAllHod();
    HodDto createHod(HodRequest request);
    HodDto updateHod(Long id, HodRequest request);
    void deleteHod(Long id);

    // Departments
    List<DepartmentDto> getAllDepartments();
    DepartmentDto getDepartmentById(Long id);
    DepartmentDto createDepartment(DepartmentRequest request);
    DepartmentDto updateDepartment(Long id, DepartmentRequest request);
    void deleteDepartment(Long id);

    // Companies
    List<CompanyDto> getAllCompanies();
    CompanyDto getCompanyById(Long id);
    CompanyDto createCompany(CompanyRequest request);
    CompanyDto updateCompany(Long id, CompanyRequest request);
    void deleteCompany(Long id);

    // Skills
    List<SkillDto> getAllSkills();
    SkillDto getSkillById(Long id);
    SkillDto createSkill(SkillRequest request);
    SkillDto updateSkill(Long id, SkillRequest request);
    void deleteSkill(Long id);

    // Pending Approvals
    List<com.careerready.dto.admin.PendingApprovalDto> getPendingApprovals();
    String approveUser(Long userId);
    String rejectUser(Long userId);

    // Dashboard & Questions
    com.careerready.dto.admin.AdminDashboardDto getDashboard();
    List<com.careerready.dto.assessment.QuestionDto> getAllQuestions();
    com.careerready.dto.assessment.QuestionDto updateQuestion(Long id, com.careerready.dto.assessment.QuestionDto dto);
}
