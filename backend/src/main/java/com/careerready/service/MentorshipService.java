package com.careerready.service;

import com.careerready.dto.hod.AssignMentorRequest;
import com.careerready.dto.hod.MentorAssignmentDto;
import com.careerready.dto.staff.StaffStudentItemDto;

import java.util.List;

public interface MentorshipService {

    List<MentorAssignmentDto> getAllAssignments();

    MentorAssignmentDto assignMentor(AssignMentorRequest request, Long assignedByUserId);

    MentorAssignmentDto updateMentor(Long assignmentId, Long newStaffId, Long updatedByUserId);

    void removeMentor(Long assignmentId);

    List<StaffStudentItemDto> getAssignedStudentsForStaff(Long staffUserId);

    long countAssignedStudentsForStaff(Long staffUserId);

    // HOD Staff Assignment Workflows
    List<com.careerready.dto.hod.StaffAssignmentDto> getStaffAssignmentsForHod(Long hodUserId);

    List<com.careerready.dto.hod.StaffAvailableDto> getAvailableStaff(Long hodUserId);

    void bulkAssignStudentsToStaff(com.careerready.dto.hod.BulkAssignStaffRequest request, Long assignedByUserId);

    com.careerready.dto.hod.StaffAssignmentDto assignSingleStudent(Long studentId, Long staffId, Long assignedByUserId);

    void unassignStudent(Long studentId);
}
