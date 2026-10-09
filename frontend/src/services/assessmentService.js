import api, { getErrorMessage } from './api';

export const assessmentService = {
  /**
   * Get current assessment statuses for Aptitude & Technical directly from MySQL database
   */
  async getAssessmentStatus() {
    try {
      const res = await api.get('/assessments/status');
      if (res.data && res.data.success && res.data.data) {
        const backendStatus = res.data.data;
        const result = {
          aptitude: {
            status: 'Not Attempted',
            score: 0,
            totalQuestions: 20,
            percentage: 0,
            correctCount: 0,
            incorrectCount: 0,
            performance: 'Not Attempted',
            completedAt: null
          },
          technical: {
            status: 'Not Attempted',
            score: 0,
            totalQuestions: 20,
            percentage: 0,
            correctCount: 0,
            incorrectCount: 0,
            performance: 'Not Attempted',
            completedAt: null
          },
          history: []
        };

        const apt = backendStatus.APTITUDE || backendStatus.aptitude;
        if (apt) {
          result.aptitude = {
            assessmentId: apt.assessmentId,
            status: apt.status === 'COMPLETED' ? 'Completed' : 'In Progress',
            score: apt.score || 0,
            totalQuestions: apt.totalQuestions || 20,
            percentage: apt.percentage || 0,
            correctCount: apt.correctAnswers || 0,
            incorrectCount: apt.wrongAnswers || 0,
            performance: (apt.percentage || 0) >= 85 ? 'Excellent' : (apt.percentage || 0) >= 70 ? 'Good' : 'Needs Improvement',
            completedAt: apt.submittedAt
          };
          if (apt.status === 'COMPLETED') {
            result.history.push({
              id: 'att-' + apt.assessmentId,
              type: 'Aptitude Assessment',
              score: apt.score,
              total: apt.totalQuestions,
              percentage: apt.percentage,
              date: apt.submittedAt ? new Date(apt.submittedAt).toLocaleString() : 'Recent'
            });
          }
        }

        const tech = backendStatus.TECHNICAL || backendStatus.technical;
        if (tech) {
          result.technical = {
            assessmentId: tech.assessmentId,
            status: tech.status === 'COMPLETED' ? 'Completed' : 'In Progress',
            score: tech.score || 0,
            totalQuestions: tech.totalQuestions || 20,
            percentage: tech.percentage || 0,
            correctCount: tech.correctAnswers || 0,
            incorrectCount: tech.wrongAnswers || 0,
            performance: (tech.percentage || 0) >= 85 ? 'Excellent' : (tech.percentage || 0) >= 70 ? 'Good' : 'Needs Improvement',
            completedAt: tech.submittedAt
          };
          if (tech.status === 'COMPLETED') {
            result.history.push({
              id: 'att-' + tech.assessmentId,
              type: 'Technical Assessment',
              score: tech.score,
              total: tech.totalQuestions,
              percentage: tech.percentage,
              date: tech.submittedAt ? new Date(tech.submittedAt).toLocaleString() : 'Recent'
            });
          }
        }

        return result;
      }
      throw new Error(res.data?.message || 'Failed to retrieve assessment statuses');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Start assessment by fetching real questions from MySQL Question table
   */
  async startAssessment(type) {
    try {
      const typeUpper = (type || 'APTITUDE').toUpperCase();
      const res = await api.post('/assessments/start', { type: typeUpper });
      if (res.data && res.data.success && res.data.data) {
        const data = res.data.data;
        // Cache active assessment session
        sessionStorage.setItem(`active_assessment_id_${type.toLowerCase()}`, data.assessmentId);
        return {
          assessmentId: data.assessmentId,
          type: data.type,
          totalQuestions: data.totalQuestions,
          durationMinutes: data.durationMinutes || 20,
          questions: data.questions.map((q) => ({
            id: q.id,
            questionText: q.questionText,
            question: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            options: {
              A: q.optionA,
              B: q.optionB,
              C: q.optionC,
              D: q.optionD
            },
            topic: q.topic,
            difficulty: q.difficultyLevel,
            marks: q.marks
          }))
        };
      }
      throw new Error(res.data?.message || 'Failed to start assessment from server');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Submit answers to backend for server-side evaluation & MySQL persistence
   */
  async submitAssessment(type, userAnswers, timeSpentSeconds = 0) {
    try {
      const typeLower = (type || 'aptitude').toLowerCase();
      let assessmentId = sessionStorage.getItem(`active_assessment_id_${typeLower}`);

      // Format answers payload
      const formattedAnswers = Object.entries(userAnswers).map(([qid, ans]) => ({
        questionId: Number(qid),
        selectedAnswer: ans
      }));

      // If assessment ID is not in session, start one first or retrieve status
      if (!assessmentId) {
        const startRes = await this.startAssessment(type);
        assessmentId = startRes.assessmentId;
      }

      const res = await api.post(`/assessments/${assessmentId}/submit`, {
        answers: formattedAnswers
      });

      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        const resultRecord = {
          assessmentId: d.assessmentId,
          type: d.type,
          score: d.score,
          totalQuestions: d.totalQuestions,
          percentage: d.percentage,
          correctCount: d.correctAnswers,
          incorrectCount: d.wrongAnswers,
          performance: d.percentage >= 85 ? 'Excellent' : d.percentage >= 70 ? 'Good' : 'Needs Improvement',
          status: 'Completed',
          completedAt: d.submittedAt,
          answers: d.answerBreakdown || {}
        };

        // Cache latest result for the result view
        sessionStorage.setItem(`latest_result_${typeLower}`, JSON.stringify(resultRecord));
        sessionStorage.removeItem(`active_assessment_id_${typeLower}`);

        window.dispatchEvent(new CustomEvent('assessment-updated', { detail: { type, result: resultRecord } }));
        return resultRecord;
      }
      throw new Error(res.data?.message || 'Failed to submit assessment to server');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Retrieve latest result for a given assessment type from server or session
   */
  async getAssessmentResult(type) {
    const typeLower = (type || 'aptitude').toLowerCase();
    // Check cached latest result from this session
    const cached = sessionStorage.getItem(`latest_result_${typeLower}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Continue to server fetch
      }
    }

    try {
      const statuses = await this.getAssessmentStatus();
      const st = statuses[typeLower];
      if (st && st.status === 'Completed' && st.assessmentId) {
        const res = await api.get(`/assessments/${st.assessmentId}/result`);
        if (res.data && res.data.success && res.data.data) {
          const d = res.data.data;
          return {
            assessmentId: d.assessmentId,
            type: d.type,
            score: d.score,
            totalQuestions: d.totalQuestions,
            percentage: d.percentage,
            correctCount: d.correctAnswers,
            incorrectCount: d.wrongAnswers,
            performance: d.percentage >= 85 ? 'Excellent' : d.percentage >= 70 ? 'Good' : 'Needs Improvement',
            status: 'Completed',
            completedAt: d.submittedAt,
            answers: d.answerBreakdown || {}
          };
        }
      }
      return st?.status === 'Completed' ? st : null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Full assessment history
   */
  async getAssessmentHistory() {
    try {
      const statuses = await this.getAssessmentStatus();
      return statuses.history || [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};
