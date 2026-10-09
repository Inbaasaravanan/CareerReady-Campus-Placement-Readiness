package com.careerready.repository;

import com.careerready.entity.GlobalSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlobalSettingRepository extends JpaRepository<GlobalSetting, Long> {

    Optional<GlobalSetting> findBySettingKey(String settingKey);

    List<GlobalSetting> findBySettingGroup(String settingGroup);
}
