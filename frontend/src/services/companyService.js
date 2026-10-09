import api, { getErrorMessage } from './api';

export const companyService = {
  /**
   * Get dynamic recruitment matching and eligibility from MySQL database
   * Filter options: 'All' | 'Eligible' | 'High Match' | 'Needs Improvement'
   */
  async getCompanyMatches(filter = 'All') {
    try {
      const res = await api.get('/companies/matches/me', { params: { filter } });
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((c) => {
          const matchedSkills = Array.isArray(c.matchedSkills) ? c.matchedSkills : [];
          const skillGaps = Array.isArray(c.skillGaps) ? c.skillGaps : [];
          const requiredSkills = Array.isArray(c.requiredSkills)
            ? c.requiredSkills
            : (matchedSkills.length > 0 || skillGaps.length > 0 ? [...matchedSkills, ...skillGaps] : []);

          let recPrep = [];
          if (Array.isArray(c.recommendedPreparation)) {
            recPrep = c.recommendedPreparation;
          } else if (typeof c.recommendedPreparation === 'string' && c.recommendedPreparation.trim()) {
            recPrep = [c.recommendedPreparation.trim()];
          } else {
            recPrep = ['Focus on company-specific technical assessment topics and mock coding interviews.'];
          }

          const isEligible = c.eligibilityStatus === 'ELIGIBLE' || c.eligibilityStatus === 'Eligible';

          return {
            id: 'comp-' + c.companyId,
            companyId: c.companyId,
            name: c.companyName || c.name,
            companyName: c.companyName || c.name,
            fullName: c.companyName || c.name,
            industry: 'Technology & Software Engineering',
            packageRange: '6 - 12 LPA',
            tier: 'Tier 1',
            description: c.description || 'Enterprise Technology Solutions & Software Development',
            matchPercentage: c.matchPercentage || 0,
            eligibilityStatus: isEligible ? 'Eligible' : 'Needs Improvement',
            requiredCGPA: c.requiredCgpa || 7.0,
            minimumAptitudeScore: c.minimumAptitudeScore || 60,
            minimumTechnicalScore: c.minimumTechnicalScore || 60,
            matchedSkills,
            skillGaps,
            requiredSkills,
            recommendedPreparation: recPrep,
            eligibleStudentsCount: c.eligibleStudentsCount !== undefined ? c.eligibleStudentsCount : (isEligible ? 1 : 0)
          };
        });
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get real company details from MySQL Company table
   */
  async getCompanyDetails(id) {
    try {
      const numericId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
      if (!numericId) return null;

      const res = await api.get(`/companies/${numericId}`);
      if (res.data && res.data.success && res.data.data) {
        const c = res.data.data;
        return {
          id: 'comp-' + c.id,
          companyId: c.id,
          name: c.name,
          companyName: c.name,
          description: c.description,
          requiredCGPA: c.requiredCgpa,
          minimumAptitudeScore: c.minimumAptitudeScore,
          minimumTechnicalScore: c.minimumTechnicalScore,
          requiredSkills: c.skills ? c.skills.map((s) => s.skillName) : []
        };
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get dynamic company-specific skill gaps for all recruiting companies
   */
  async getCompanySkillGaps() {
    try {
      const matches = await this.getCompanyMatches('All');
      return matches;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get company-specific skill gaps for a single company
   */
  async getCompanySpecificSkillGap(companyId) {
    try {
      const numericId = typeof companyId === 'string' ? companyId.replace(/\D/g, '') : companyId;
      const res = await api.get(`/companies/${numericId}/skill-gaps/me`);
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getCompanies() {
    return this.getCompanyMatches('All');
  },

  async getCompanyById(id) {
    return this.getCompanyDetails(id);
  }
};
