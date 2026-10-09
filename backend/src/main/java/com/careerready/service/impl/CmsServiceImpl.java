package com.careerready.service.impl;

import com.careerready.dto.cms.CmsContentDto;
import com.careerready.dto.cms.CmsMediaDto;
import com.careerready.dto.cms.GlobalSettingDto;
import com.careerready.entity.CmsContent;
import com.careerready.entity.CmsMedia;
import com.careerready.entity.GlobalSetting;
import com.careerready.enums.ContentType;
import com.careerready.exception.BadRequestException;
import com.careerready.exception.ResourceNotFoundException;
import com.careerready.repository.CmsContentRepository;
import com.careerready.repository.CmsMediaRepository;
import com.careerready.repository.GlobalSettingRepository;
import com.careerready.service.CmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CmsServiceImpl implements CmsService {

    private final CmsContentRepository cmsContentRepository;
    private final CmsMediaRepository cmsMediaRepository;
    private final GlobalSettingRepository globalSettingRepository;

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "svg", "gif"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAllActiveContentMap() {
        List<CmsContent> list = cmsContentRepository.findByIsActiveTrue();
        Map<String, String> map = new HashMap<>();
        for (CmsContent c : list) {
            String val = c.getContentValue() != null ? c.getContentValue() : (c.getMediaUrl() != null ? c.getMediaUrl() : "");
            map.put(c.getContentKey(), val);
        }
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getPageContentMap(String page) {
        List<CmsContent> list = cmsContentRepository.findByPageAndIsActiveTrue(page.toUpperCase());
        Map<String, String> map = new HashMap<>();
        for (CmsContent c : list) {
            String val = c.getContentValue() != null ? c.getContentValue() : (c.getMediaUrl() != null ? c.getMediaUrl() : "");
            map.put(c.getContentKey(), val);
        }
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CmsContentDto> getAllContent() {
        return cmsContentRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CmsContentDto> getContentByPage(String page) {
        return cmsContentRepository.findByPage(page.toUpperCase()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CmsContentDto getContentById(Long id) {
        CmsContent content = cmsContentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CMS content not found with id: " + id));
        return mapToDto(content);
    }

    @Override
    @Transactional(readOnly = true)
    public CmsContentDto getContentByKey(String contentKey) {
        CmsContent content = cmsContentRepository.findByContentKey(contentKey)
                .orElseThrow(() -> new ResourceNotFoundException("CMS content not found with key: " + contentKey));
        return mapToDto(content);
    }

    @Override
    @Transactional
    public CmsContentDto saveContent(CmsContentDto dto, String username) {
        CmsContent content;

        if (dto.getId() != null) {
            content = cmsContentRepository.findById(dto.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("CMS content not found with id: " + dto.getId()));
        } else {
            Optional<CmsContent> existing = cmsContentRepository.findByContentKey(dto.getContentKey());
            content = existing.orElseGet(CmsContent::new);
        }

        content.setContentKey(dto.getContentKey().trim());
        content.setPage(dto.getPage().toUpperCase().trim());
        content.setSection(dto.getSection().toUpperCase().trim());
        content.setContentType(dto.getContentType() != null ? dto.getContentType() : ContentType.TEXT);
        content.setContentValue(dto.getContentValue());
        content.setMediaUrl(dto.getMediaUrl());
        content.setDescription(dto.getDescription());
        content.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        content.setUpdatedBy(username != null ? username : "admin");
        content.setUpdatedAt(LocalDateTime.now());

        CmsContent saved = cmsContentRepository.save(content);
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public List<CmsContentDto> saveBatchContent(List<CmsContentDto> dtos, String username) {
        List<CmsContentDto> result = new ArrayList<>();
        for (CmsContentDto dto : dtos) {
            if (dto.getContentKey() != null && !dto.getContentKey().isBlank()) {
                result.add(saveContent(dto, username));
            }
        }
        return result;
    }

    @Override
    @Transactional
    public void deleteContent(Long id) {
        if (!cmsContentRepository.existsById(id)) {
            throw new ResourceNotFoundException("CMS content not found with id: " + id);
        }
        cmsContentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CmsMediaDto> getAllMedia() {
        return cmsMediaRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapMediaToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CmsMediaDto uploadMedia(MultipartFile file, String altText, String username) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds 10MB limit");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "media"));
        String extension = "";
        int extIdx = originalFilename.lastIndexOf('.');
        if (extIdx > 0) {
            extension = originalFilename.substring(extIdx + 1).toLowerCase();
        }

        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported media type. Allowed formats: " + ALLOWED_IMAGE_EXTENSIONS);
        }

        try {
            Path uploadDir = Paths.get("uploads", "cms");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String uniqueFilename = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
            Path targetPath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/cms/" + uniqueFilename;

            CmsMedia media = CmsMedia.builder()
                    .fileName(originalFilename)
                    .fileUrl(fileUrl)
                    .altText(altText != null ? altText : originalFilename)
                    .mediaType(file.getContentType() != null ? file.getContentType() : "image/" + extension)
                    .fileSize(file.getSize())
                    .uploadedBy(username != null ? username : "admin")
                    .createdAt(LocalDateTime.now())
                    .build();

            CmsMedia saved = cmsMediaRepository.save(media);
            return mapMediaToDto(saved);
        } catch (IOException ex) {
            log.error("Failed to upload CMS media: {}", ex.getMessage());
            throw new RuntimeException("Could not store file: " + ex.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteMedia(Long id) {
        CmsMedia media = cmsMediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media not found with id: " + id));

        try {
            if (media.getFileUrl() != null && media.getFileUrl().startsWith("/uploads/")) {
                Path filePath = Paths.get("uploads").resolve(media.getFileUrl().substring("/uploads/".length()));
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ex) {
            log.warn("Could not delete physical file for media id {}: {}", id, ex.getMessage());
        }

        cmsMediaRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getGlobalSettingsMap() {
        List<GlobalSetting> list = globalSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (GlobalSetting s : list) {
            map.put(s.getSettingKey(), s.getSettingValue() != null ? s.getSettingValue() : "");
        }
        return map;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GlobalSettingDto> getGlobalSettingsList() {
        return globalSettingRepository.findAll().stream()
                .map(this::mapSettingToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateGlobalSettings(Map<String, String> settings, String username) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();

            GlobalSetting setting = globalSettingRepository.findBySettingKey(key)
                    .orElseGet(() -> GlobalSetting.builder()
                            .settingKey(key)
                            .settingGroup("GENERAL")
                            .build());

            setting.setSettingValue(value);
            setting.setUpdatedBy(username != null ? username : "admin");
            setting.setUpdatedAt(LocalDateTime.now());
            globalSettingRepository.save(setting);
        }
    }

    private CmsContentDto mapToDto(CmsContent c) {
        return CmsContentDto.builder()
                .id(c.getId())
                .contentKey(c.getContentKey())
                .page(c.getPage())
                .section(c.getSection())
                .contentType(c.getContentType())
                .contentValue(c.getContentValue())
                .mediaUrl(c.getMediaUrl())
                .description(c.getDescription())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .updatedBy(c.getUpdatedBy())
                .build();
    }

    private CmsMediaDto mapMediaToDto(CmsMedia m) {
        return CmsMediaDto.builder()
                .id(m.getId())
                .fileName(m.getFileName())
                .fileUrl(m.getFileUrl())
                .altText(m.getAltText())
                .mediaType(m.getMediaType() != null ? m.getMediaType() : "image")
                .fileSize(m.getFileSize())
                .uploadedBy(m.getUploadedBy())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private GlobalSettingDto mapSettingToDto(GlobalSetting s) {
        return GlobalSettingDto.builder()
                .id(s.getId())
                .settingKey(s.getSettingKey())
                .settingValue(s.getSettingValue())
                .settingGroup(s.getSettingGroup())
                .description(s.getDescription())
                .updatedAt(s.getUpdatedAt())
                .updatedBy(s.getUpdatedBy())
                .build();
    }
}
