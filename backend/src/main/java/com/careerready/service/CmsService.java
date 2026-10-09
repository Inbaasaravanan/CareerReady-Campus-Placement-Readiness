package com.careerready.service;

import com.careerready.dto.cms.CmsContentDto;
import com.careerready.dto.cms.CmsMediaDto;
import com.careerready.dto.cms.GlobalSettingDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface CmsService {

    Map<String, String> getAllActiveContentMap();

    Map<String, String> getPageContentMap(String page);

    List<CmsContentDto> getAllContent();

    List<CmsContentDto> getContentByPage(String page);

    CmsContentDto getContentById(Long id);

    CmsContentDto getContentByKey(String contentKey);

    CmsContentDto saveContent(CmsContentDto dto, String username);

    List<CmsContentDto> saveBatchContent(List<CmsContentDto> dtos, String username);

    void deleteContent(Long id);

    List<CmsMediaDto> getAllMedia();

    CmsMediaDto uploadMedia(MultipartFile file, String altText, String username);

    void deleteMedia(Long id);

    Map<String, String> getGlobalSettingsMap();

    List<GlobalSettingDto> getGlobalSettingsList();

    void updateGlobalSettings(Map<String, String> settings, String username);
}
