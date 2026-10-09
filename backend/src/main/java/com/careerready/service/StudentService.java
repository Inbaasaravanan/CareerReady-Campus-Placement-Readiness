package com.careerready.service;

import com.careerready.dto.skill.UpdateStudentSkillsRequest;
import com.careerready.dto.student.StudentProfileResponse;
import com.careerready.dto.student.UpdateStudentProfileRequest;

public interface StudentService {

    StudentProfileResponse getProfileByUserId(Long userId);

    StudentProfileResponse getProfileByStudentId(Long studentId);

    StudentProfileResponse updateProfile(Long userId, UpdateStudentProfileRequest request);

    StudentProfileResponse updateSkills(Long userId, UpdateStudentSkillsRequest request);
}
