package com.careerready.controller;

import com.careerready.dto.common.ApiResponse;
import com.careerready.service.CmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cms")
@RequiredArgsConstructor
@Tag(name = "CMS Public Content", description = "Public CMS Content APIs for dynamic frontend rendering")
public class PublicCmsController {

    private final CmsService cmsService;

    @GetMapping("/all")
    @Operation(summary = "Get all active CMS content key-value pairs")
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllActiveContent() {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getAllActiveContentMap()));
    }

    @GetMapping("/page/{pageKey}")
    @Operation(summary = "Get active CMS content key-value pairs for a specific page")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPageContent(@PathVariable String pageKey) {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getPageContentMap(pageKey)));
    }

    @GetMapping("/settings")
    @Operation(summary = "Get public global application settings")
    public ResponseEntity<ApiResponse<Map<String, String>>> getGlobalSettings() {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getGlobalSettingsMap()));
    }
}
