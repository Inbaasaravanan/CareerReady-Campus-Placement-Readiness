package com.careerready.dto.skill;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentSkillsRequest {

    @NotNull(message = "Skills list is mandatory")
    private List<StudentSkillDto> skills;
}
