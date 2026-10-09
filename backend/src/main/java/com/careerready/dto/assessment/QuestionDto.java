package com.careerready.dto.assessment;

import com.careerready.enums.AssessmentType;
import com.careerready.enums.DifficultyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;
    private AssessmentType assessmentType;
    private String topic;
    private DifficultyLevel difficultyLevel;
    private String questionText;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctAnswer;
    private Integer marks;
    private Boolean active;

    public String getText() {
        return questionText;
    }

    public String getType() {
        return assessmentType != null ? assessmentType.name() : null;
    }

    public String getCategory() {
        return topic;
    }

    public String getDifficulty() {
        return difficultyLevel != null ? difficultyLevel.name() : null;
    }

    public void setText(String text) {
        if (text != null && !text.isBlank() && (this.questionText == null || this.questionText.isBlank())) {
            this.questionText = text;
        }
    }

    public void setCategory(String category) {
        if (category != null && !category.isBlank() && (this.topic == null || this.topic.isBlank())) {
            this.topic = category;
        }
    }
}
