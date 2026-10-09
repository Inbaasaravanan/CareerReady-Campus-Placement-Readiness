package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.dto.skill.SkillDto;
import com.careerready.repository.SkillRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
@Tag(name = "Skills", description = "Public skills directory for registration and profile profiling")
public class SkillController {

    private final SkillRepository skillRepository;

    @GetMapping
    @Operation(summary = "Get All Active Skills", description = "Returns active skills list for student skill selection during registration and profile update")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getAllSkills() {
        List<SkillDto> skills = skillRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(s -> SkillDto.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .category(s.getCategory())
                        .description(s.getDescription())
                        .active(s.getActive())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(skills));
    }
}
