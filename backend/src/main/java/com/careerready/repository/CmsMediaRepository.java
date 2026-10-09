package com.careerready.repository;

import com.careerready.entity.CmsMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CmsMediaRepository extends JpaRepository<CmsMedia, Long> {

    List<CmsMedia> findAllByOrderByCreatedAtDesc();
}
