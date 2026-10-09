import api, { getErrorMessage } from './api';

export const analyticsService = {
  async getAlgorithmModules() {
    return [
      { name: 'Random Forest Ensemble', version: 'RF-v2.4', trees: 50, accuracy: '94.2%' },
      { name: 'Multi-Factor Scorer', version: 'v3.1', metrics: 10, status: 'Active' },
      { name: 'Company Skill Gap Matrix', version: 'v2.0', status: 'Active' }
    ];
  },

  async getInstitutionalReadiness() {
    try {
      const res = await api.get('/staff/analytics/readiness');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        return {
          distribution: {
            highlyReady: d.highlyReadyCount || 0,
            ready: d.readyCount || 0,
            needsImprovement: d.needsImprovementCount || 0,
            atRisk: d.atRiskCount || 0
          },
          averageReadiness: d.averageReadinessScore || 0,
          totalStudents: d.totalStudents || 0
        };
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getSkillMetrics() {
    try {
      const res = await api.get('/admin/skills');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};
