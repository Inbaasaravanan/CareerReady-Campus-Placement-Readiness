import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { LoadingState, ErrorState } from '../common/StateViews';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, AlertTriangleIcon } from '../common/Icons';

export const QuizComponent = ({
  assessmentType = 'aptitude',
  title = 'Aptitude Assessment',
  subtitle = 'Quantitative Aptitude, Logical Reasoning & Verbal Ability Benchmark',
  questions: propQuestions = [],
  durationMinutes = 20
}) => {
  const navigate = useNavigate();

  // State
  const [questions, setQuestions] = useState(propQuestions);
  const [loading, setLoading] = useState(propQuestions.length === 0);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(durationMinutes * 60);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.startAssessment(assessmentType);
      if (data && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        if (data.durationMinutes) {
          setTimeLeftSeconds(data.durationMinutes * 60);
        }
      } else {
        throw new Error('No assessment questions returned from server.');
      }
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real database questions if not provided via props
  useEffect(() => {
    if (propQuestions && propQuestions.length > 0) {
      setQuestions(propQuestions);
      setLoading(false);
    } else {
      loadQuestions();
    }
  }, [assessmentType, propQuestions?.length]);

  // Countdown timer with auto-submit
  useEffect(() => {
    if (loading || error || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, questions.length]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const padMins = String(mins).padStart(2, '0');
    const padSecs = String(secs).padStart(2, '0');
    return `${padMins}:${padSecs}`;
  };

  const handleSelectOption = (questionId, optionKey) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleClearCurrent = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentQ.id];
      return updated;
    });
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalCount = questions.length || 20;
  const remainingCount = totalCount - answeredCount;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      const timeSpent = (durationMinutes * 60) - timeLeftSeconds;
      await assessmentService.submitAssessment(assessmentType, selectedAnswers, timeSpent);
      navigate(`/student/assessment/result?type=${assessmentType}`);
    } catch (err) {
      setError(err?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const timeSpent = (durationMinutes * 60) - timeLeftSeconds;
      await assessmentService.submitAssessment(assessmentType, selectedAnswers, timeSpent);
      setIsSubmitModalOpen(false);
      navigate(`/student/assessment/result?type=${assessmentType}`);
    } catch (err) {
      setError(err?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message={`Fetching real ${title} questions from MySQL database...`} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Assessment Service Unavailable"
        description={error}
        onRetry={loadQuestions}
      />
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <h3>No questions available</h3>
        <p style={{ color: 'var(--color-text-muted)' }}>The question bank for this assessment is currently empty.</p>
        <Button variant="outline" onClick={() => navigate('/student/assessment')}>Back to Assessments</Button>
      </div>
    );
  }

  const isTimerLow = timeLeftSeconds <= 180; // under 3 minutes

  return (
    <div className="quiz-container">
      {/* Top Quiz Header */}
      <header className="quiz-header-card">
        <div className="quiz-header-top">
          <div className="quiz-header-title-zone">
            <h2>{title}</h2>
            <p>{subtitle} &bull; Question {currentIndex + 1} of {totalCount}</p>
          </div>

          {/* Real-time Countdown Timer */}
          <div className={`quiz-timer-box ${isTimerLow ? 'timer-warning' : ''}`} title="Remaining Time">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>
        </div>

        {/* Progress & Answered / Remaining Counters */}
        <div className="quiz-progress-section">
          <div className="quiz-progress-stats">
            <span>Progress: {progressPercent}%</span>
            <span>
              Answered: <strong>{answeredCount}</strong> &bull; Remaining: <strong>{remainingCount}</strong>
            </span>
          </div>
          <div className="quiz-progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
            <div className="quiz-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      {/* Main Assessment Body Grid: Question Area (Left) + Question Palette (Right) */}
      <div className="quiz-stage-grid">
        {/* Left: Active Question Card */}
        <div className="question-card">
          <div>
            <div className="question-meta-bar">
              <span className="question-number-badge">Question {currentIndex + 1}</span>
              <span className="question-topic-badge">{currentQuestion.topic || 'General'}</span>
              <span className="question-marks-badge">{currentQuestion.marks || 1} Mark</span>
            </div>

            <div className="question-text">
              {currentQuestion.questionText || currentQuestion.question}
            </div>

            {/* MCQ Options A, B, C, D */}
            <div className="options-list">
              {['A', 'B', 'C', 'D'].map((optKey) => {
                const optText = currentQuestion[`option${optKey}`] || currentQuestion.options?.[optKey];
                if (!optText) return null;

                const isSelected = selectedAnswers[currentQuestion.id] === optKey;

                return (
                  <button
                    key={optKey}
                    type="button"
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectOption(currentQuestion.id, optKey)}
                    aria-pressed={isSelected}
                  >
                    <span className="option-indicator">{optKey}</span>
                    <span className="option-label-text">{optText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls inside question card */}
          <div className="question-actions-bar">
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCurrent}
                disabled={!selectedAnswers[currentQuestion.id]}
              >
                Clear Selection
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                icon={ArrowLeftIcon}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </Button>

              {currentIndex < totalCount - 1 ? (
                <Button
                  variant="primary"
                  icon={ArrowRightIcon}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  icon={CheckIcon}
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  Finish Test
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Palette */}
        <aside className="question-palette-card" aria-label="Question Navigation Palette">
          <div className="palette-header">
            <h3>Question Palette</h3>
            <p>Jump to question instantly</p>
          </div>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentIndex;

              let btnClass = 'palette-btn';
              if (isCurrent) btnClass += ' current';
              else if (isAnswered) btnClass += ' answered';

              return (
                <button
                  key={q.id}
                  type="button"
                  className={btnClass}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to Question ${idx + 1} (${isAnswered ? 'Answered' : 'Unanswered'})`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="legend-item">
              <span className="legend-box current"></span>
              <span>Current</span>
            </div>
            <div className="legend-item">
              <span className="legend-box"></span>
              <span>Unanswered ({remainingCount})</span>
            </div>
          </div>

          <div className="palette-submit-zone">
            <Button
              variant="primary"
              fullWidth
              icon={CheckIcon}
              onClick={() => setIsSubmitModalOpen(true)}
            >
              Submit Assessment
            </Button>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Confirm Submission"
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangleIcon width={22} height={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Are you ready to submit?</h4>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                You have answered <strong>{answeredCount}</strong> out of <strong>{totalCount}</strong> questions.
              </p>
            </div>
          </div>

          {remainingCount > 0 && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '16px' }}>
              <strong>Notice:</strong> You still have {remainingCount} unanswered question{remainingCount > 1 ? 's' : ''}. Unanswered questions will receive 0 marks.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button
              variant="outline"
              onClick={() => setIsSubmitModalOpen(false)}
              disabled={isSubmitting}
            >
              Review Questions
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Evaluating with Backend...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
