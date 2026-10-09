package com.careerready.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "register_number", nullable = false, unique = true, length = 50)
    private String registerNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private PlacementStaff assignedStaff;

    @Column(name = "academic_year")
    private Integer year;

    @Column(name = "cgpa")
    private Double cgpa;

    @Column(name = "tenth_percentage")
    private Double tenthPercentage;

    @Column(name = "twelfth_percentage")
    private Double twelfthPercentage;

    @Column(name = "backlogs")
    private Integer backlogs;

    @Column(name = "communication_score")
    @Builder.Default
    private Integer communicationScore = 75;

    @Column(name = "problem_solving_score")
    @Builder.Default
    private Integer problemSolvingScore = 80;

    @Column(name = "teamwork_score")
    @Builder.Default
    private Integer teamworkScore = 78;

    @Column(name = "programming_score")
    @Builder.Default
    private Integer programmingScore = 80;

    @Column(name = "technical_skill_score")
    @Builder.Default
    private Integer technicalSkillScore = 80;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
