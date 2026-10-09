package com.careerready.entity;

import com.careerready.enums.ContentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cms_content", indexes = {
        @Index(name = "idx_cms_content_key", columnList = "content_key", unique = true),
        @Index(name = "idx_cms_page_section", columnList = "page, section")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CmsContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true, length = 120)
    private String contentKey;

    @Column(nullable = false, length = 60)
    private String page;

    @Column(nullable = false, length = 60)
    private String section;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 30)
    private ContentType contentType;

    @Column(name = "content_value", columnDefinition = "LONGTEXT")
    private String contentValue;

    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    @Column(length = 255)
    private String description;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
