package com.careerready.controller;

import com.careerready.dto.cms.BatchCmsUpdateRequest;
import com.careerready.dto.cms.CmsContentDto;
import com.careerready.dto.cms.CmsMediaDto;
import com.careerready.dto.cms.GlobalSettingDto;
import com.careerready.dto.common.ApiResponse;
import com.careerready.security.UserPrincipal;
import com.careerready.service.CmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/cms")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin CMS", description = "Administrative Content Management System APIs (Admin Only)")
public class AdminCmsController {

    private final CmsService cmsService;

    // --- Content Management ---

    @GetMapping("/content")
    @Operation(summary = "Get all CMS content items")
    public ResponseEntity<ApiResponse<List<CmsContentDto>>> getAllContent() {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getAllContent()));
    }

    @GetMapping("/page/{pageKey}")
    @Operation(summary = "Get CMS content items for a specific page")
    public ResponseEntity<ApiResponse<List<CmsContentDto>>> getContentByPage(@PathVariable String pageKey) {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getContentByPage(pageKey)));
    }

    @GetMapping("/content/{id}")
    @Operation(summary = "Get CMS content item by ID")
    public ResponseEntity<ApiResponse<CmsContentDto>> getContentById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getContentById(id)));
    }

    @PostMapping("/content")
    @Operation(summary = "Create or update a CMS content item")
    public ResponseEntity<ApiResponse<CmsContentDto>> saveContent(
            @Valid @RequestBody CmsContentDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        String username = principal != null ? principal.getEmail() : "admin";
        return ResponseEntity.ok(ApiResponse.success("Content saved successfully", cmsService.saveContent(dto, username)));
    }

    @PostMapping("/batch")
    @Operation(summary = "Batch update multiple CMS content items")
    public ResponseEntity<ApiResponse<List<CmsContentDto>>> saveBatchContent(
            @Valid @RequestBody BatchCmsUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        String username = principal != null ? principal.getEmail() : "admin";
        return ResponseEntity.ok(ApiResponse.success("Batch content saved successfully", cmsService.saveBatchContent(request.getItems(), username)));
    }

    @PutMapping("/content/{id}")
    @Operation(summary = "Update a specific CMS content item by ID")
    public ResponseEntity<ApiResponse<CmsContentDto>> updateContent(
            @PathVariable Long id,
            @Valid @RequestBody CmsContentDto dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        dto.setId(id);
        String username = principal != null ? principal.getEmail() : "admin";
        return ResponseEntity.ok(ApiResponse.success("Content updated successfully", cmsService.saveContent(dto, username)));
    }

    @DeleteMapping("/content/{id}")
    @Operation(summary = "Delete a CMS content item")
    public ResponseEntity<ApiResponse<Void>> deleteContent(@PathVariable Long id) {
        cmsService.deleteContent(id);
        return ResponseEntity.ok(ApiResponse.success("Content deleted successfully", null));
    }

    // --- Media Library ---

    @GetMapping("/media")
    @Operation(summary = "List all uploaded CMS media")
    public ResponseEntity<ApiResponse<List<CmsMediaDto>>> getAllMedia() {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getAllMedia()));
    }

    @PostMapping(value = "/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image or media file to CMS media library")
    public ResponseEntity<ApiResponse<CmsMediaDto>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "altText", required = false) String altText,
            @AuthenticationPrincipal UserPrincipal principal) {
        String username = principal != null ? principal.getEmail() : "admin";
        CmsMediaDto media = cmsService.uploadMedia(file, altText, username);
        return ResponseEntity.ok(ApiResponse.success("Media uploaded successfully", media));
    }

    @DeleteMapping("/media/{id}")
    @Operation(summary = "Delete a media file from library")
    public ResponseEntity<ApiResponse<Void>> deleteMedia(@PathVariable Long id) {
        cmsService.deleteMedia(id);
        return ResponseEntity.ok(ApiResponse.success("Media deleted successfully", null));
    }

    // --- Global Settings ---

    @GetMapping("/settings")
    @Operation(summary = "Get global application settings list")
    public ResponseEntity<ApiResponse<List<GlobalSettingDto>>> getGlobalSettings() {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getGlobalSettingsList()));
    }

    @PutMapping("/settings")
    @Operation(summary = "Update global application settings map")
    public ResponseEntity<ApiResponse<Map<String, String>>> updateGlobalSettings(
            @RequestBody Map<String, String> settings,
            @AuthenticationPrincipal UserPrincipal principal) {
        String username = principal != null ? principal.getEmail() : "admin";
        cmsService.updateGlobalSettings(settings, username);
        return ResponseEntity.ok(ApiResponse.success("Global settings updated successfully", cmsService.getGlobalSettingsMap()));
    }
}
