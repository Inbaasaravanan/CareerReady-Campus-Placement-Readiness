import api, { getErrorMessage } from './api';

export const readinessService = {
  /**
   * Get real Random Forest ML readiness score from MySQL backend
   */
  async getReadinessScore() {
    try {
      const res = await api.get('/readiness/me');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        if (d.readinessScore === null || d.readinessScore === undefined) {
          return {
            readinessScore: null,
            classification: null,
            academicScore: d.academicScore || 0,
            aptitudeScore: d.aptitudeScore || null,
            technicalScore: d.technicalScore || null,
            programmingScore: d.programmingScore || 0,
            technicalSkillsScore: d.technicalSkillsScore || d.technicalSkillScore || 0,
            communicationScore: d.communicationScore || 0
          };
        }
        return {
          readinessScore: d.readinessScore,
          classification: d.classificationDisplay || (d.classification === 'HIGHLY_READY' ? 'Highly Ready' : d.classification === 'READY' ? 'Ready' : d.classification === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : 'At Risk'),
          academicScore: d.academicScore || 0,
          aptitudeScore: d.aptitudeScore || 0,
          technicalScore: d.technicalScore || 0,
          programmingScore: d.programmingScore || 0,
          technicalSkillsScore: d.technicalSkillsScore || d.technicalSkillScore || 0,
          communicationScore: d.communicationScore || 0
        };
      }
      return null;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get full multi-dimensional diagnostic evaluation from real Random Forest prediction
   */
  async getReadinessAnalysis() {
    try {
      const res = await api.get('/readiness/me');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        if (d.readinessScore === null || d.readinessScore === undefined) {
          return {
            readinessScore: null,
            classification: null,
            academicScore: d.academicScore || 0,
            aptitudeScore: d.aptitudeScore || null,
            technicalScore: d.technicalScore || null,
            programmingScore: d.programmingScore || 0,
            technicalSkillsScore: d.technicalSkillsScore || d.technicalSkillScore || 0,
            communicationScore: d.communicationScore || 0,
            factors: [],
            strengths: [],
            areasToImprove: [],
            evaluationNote: d.evaluationNote || "Complete both Aptitude and Technical Assessments to generate your Placement Readiness Score."
          };
        }
        return {
          readinessScore: d.readinessScore,
          classification: d.classificationDisplay || (d.classification === 'HIGHLY_READY' ? 'Highly Ready' : d.classification === 'READY' ? 'Ready' : d.classification === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : 'At Risk'),
          academicScore: d.academicScore || 0,
          aptitudeScore: d.aptitudeScore || 0,
          technicalScore: d.technicalScore || 0,
          programmingScore: d.programmingScore || 0,
          technicalSkillsScore: d.technicalSkillsScore || d.technicalSkillScore || 0,
          communicationScore: d.communicationScore || 0,
          factors: d.factors || [],
          strengths: d.strengths || [],
          areasToImprove: d.areasToImprove || [],
          evaluationNote: d.evaluationNote || `Evaluated by ${d.modelVersion || 'Random Forest Classifier'}`
        };
      }
      return null;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get historical readiness predictions for real trajectory tracking
   */
  async getReadinessHistory() {
    try {
      const res = await api.get('/readiness/history/me');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((d) => ({
          predictionId: d.predictionId,
          readinessScore: d.readinessScore,
          classification: d.classificationDisplay || (d.classification === 'HIGHLY_READY' ? 'Highly Ready' : d.classification === 'READY' ? 'Ready' : d.classification === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : 'At Risk'),
          date: d.predictionDate,
          academicScore: d.academicScore,
          aptitudeScore: d.aptitudeScore,
          technicalScore: d.technicalScore
        }));
      }
      return [];
    } catch {
      return [];
    }
  }
};
