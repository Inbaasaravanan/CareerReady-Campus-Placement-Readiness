package com.careerready.repository;

import com.careerready.entity.CmsContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CmsContentRepository extends JpaRepository<CmsContent, Long> {

    Optional<CmsContent> findByContentKey(String contentKey);

    List<CmsContent> findByPage(String page);

    List<CmsContent> findByPageAndIsActiveTrue(String page);

    List<CmsContent> findByPageAndSection(String page, String section);

    List<CmsContent> findByIsActiveTrue();
}
