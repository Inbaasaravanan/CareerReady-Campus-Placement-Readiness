package com.careerready.repository;

import com.careerready.entity.StaffApprovalToken;
import com.careerready.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffApprovalTokenRepository extends JpaRepository<StaffApprovalToken, Long> {

    Optional<StaffApprovalToken> findByTokenHash(String tokenHash);

    List<StaffApprovalToken> findByUserAndUsedFalse(User user);

    @Modifying
    @Query("DELETE FROM StaffApprovalToken t WHERE t.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
