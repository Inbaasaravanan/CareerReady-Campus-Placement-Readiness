package com.careerready.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cms_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "media_type", nullable = false, length = 100)
    private String mediaType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
