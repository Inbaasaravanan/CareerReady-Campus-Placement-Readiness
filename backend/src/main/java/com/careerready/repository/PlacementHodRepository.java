package com.careerready.repository;

import com.careerready.entity.PlacementHod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlacementHodRepository extends JpaRepository<PlacementHod, Long> {
    Optional<PlacementHod> findByUserId(Long userId);
    Optional<PlacementHod> findByInstitutionalId(String institutionalId);
    boolean existsByInstitutionalId(String institutionalId);
}
