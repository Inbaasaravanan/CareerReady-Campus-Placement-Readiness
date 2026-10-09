import React from 'react';
import { QuizComponent } from '../../components/assessment/QuizComponent';

export const AptitudeQuiz = () => {
  return (
    <QuizComponent
      assessmentType="aptitude"
      title="Aptitude Assessment"
      subtitle="Quantitative Aptitude, Logical Reasoning & Verbal Ability Benchmark"
      durationMinutes={20}
    />
  );
};
