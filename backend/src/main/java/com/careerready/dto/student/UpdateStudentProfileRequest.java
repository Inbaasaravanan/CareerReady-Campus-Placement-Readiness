package com.careerready.dto.student;

import com.careerready.dto.skill.StudentSkillDto;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentProfileRequest {

    private String name;

    private Integer year;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private Double cgpa;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private Double tenthPercentage;

    @DecimalMin(value = "0.0")
    @DecimalMax(value = "100.0")
    private Double twelfthPercentage;

    @Min(0)
    private Integer backlogs;

    @Min(0) @Max(100)
    private Integer communicationScore;

    @Min(0) @Max(100)
    private Integer problemSolvingScore;

    @Min(0) @Max(100)
    private Integer teamworkScore;

    @Min(0) @Max(100)
    private Integer programmingScore;

    @Min(0) @Max(100)
    private Integer technicalSkillScore;

    private List<StudentSkillDto> skills;
    private List<SemesterMarkDto> semesterMarks;
}
