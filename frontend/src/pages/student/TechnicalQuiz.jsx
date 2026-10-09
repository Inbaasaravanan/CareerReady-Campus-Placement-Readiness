import React from 'react';
import { QuizComponent } from '../../components/assessment/QuizComponent';

export const TechnicalQuiz = () => {
  return (
    <QuizComponent
      assessmentType="technical"
      title="Technical Assessment"
      subtitle="Programming, Data Structures, OOP, SQL & Core CS Fundamentals Benchmark"
      durationMinutes={20}
    />
  );
};
