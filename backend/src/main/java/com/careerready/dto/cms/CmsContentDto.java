package com.careerready.dto.cms;

import com.careerready.enums.ContentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsContentDto {

    private Long id;

    @NotBlank(message = "Content key is required")
    private String contentKey;

    @NotBlank(message = "Page is required")
    private String page;

    @NotBlank(message = "Section is required")
    private String section;

    @NotNull(message = "Content type is required")
    private ContentType contentType;

    private String contentValue;

    private String mediaUrl;

    private String description;

    private Boolean isActive;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String updatedBy;
}
