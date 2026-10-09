package com.careerready.entity;

import com.careerready.enums.SkillLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "company_skills", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "skill_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_level", nullable = false, length = 30)
    @Builder.Default
    private SkillLevel requiredLevel = SkillLevel.INTERMEDIATE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean mandatory = true;
}
