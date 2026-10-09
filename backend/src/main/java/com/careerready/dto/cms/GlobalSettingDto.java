package com.careerready.dto.cms;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlobalSettingDto {

    private Long id;

    @NotBlank(message = "Setting key is required")
    private String settingKey;

    private String settingValue;

    private String settingGroup;

    private String description;

    private LocalDateTime updatedAt;

    private String updatedBy;
}
