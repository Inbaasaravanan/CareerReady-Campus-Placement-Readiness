package com.careerready.dto.cms;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsMediaDto {

    private Long id;
    private String fileName;
    private String fileUrl;
    private String altText;
    private String mediaType;
    private Long fileSize;
    private String uploadedBy;
    private LocalDateTime createdAt;
}
