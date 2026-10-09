import api, { getErrorMessage } from './api';

export const staffService = {
  /**
   * Get staff dashboard metrics calculated from MySQL database
   */
  async getDashboardStats() {
    try {
      const res = await api.get('/staff/analytics/readiness');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        return {
          totalStudents: d.totalStudents || 0,
          assessmentsCompleted: d.assessmentsCompleted || 0,
          averageAptitudeScore: d.averageAptitudeScore || 0,
          averageTechnicalScore: d.averageTechnicalScore || 0,
          averageReadinessScore: d.averageReadinessScore || 0,
          highlyReady: d.highlyReadyCount || 0,
          ready: d.readyCount || 0,
          needsImprovement: d.needsImprovementCount || 0,
          atRisk: d.atRiskCount || 0
        };
      }
      return {
        totalStudents: 0,
        highlyReady: 0,
        ready: 0,
        needsImprovement: 0,
        atRisk: 0
      };
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get students with search, department, and classification filters from MySQL database
   */
  async getStudents(params = {}) {
    try {
      const apiParams = {
        page: params.page != null ? params.page : 0,
        size: params.size || 50
      };
      if (params.search) apiParams.search = params.search;
      if (params.department && params.department !== 'All') apiParams.department = params.department;
      if (params.category && params.category !== 'All') {
        apiParams.classification = params.category.toUpperCase().replace(/\s+/g, '_');
      }

      const res = await api.get('/staff/students', { params: apiParams });
      if (res.data && res.data.success && res.data.data) {
        const content = res.data.data.content || [];
        return content.map((s) => ({
          id: 'std-' + (s.studentId || s.id),
          studentId: s.studentId || s.id,
          name: s.studentName || s.name,
          regNo: s.registerNumber || s.regNo || 'Not Provided',
          department: s.department || s.departmentName || 'Not Provided',
          departmentName: s.departmentName || s.department || 'Not Provided',
          year: s.year ? `${s.year}th Year` : '4th Year',
          cgpa: s.cgpa != null ? s.cgpa : null,
          readinessScore: s.readinessScore != null ? s.readinessScore : null,
          classification: s.classificationDisplay || (s.classification === 'HIGHLY_READY' ? 'Highly Ready' : s.classification === 'READY' ? 'Ready' : s.classification === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : s.classification === 'AT_RISK' ? 'At Risk' : 'Pending Assessment'),
          aptitudeScore: s.aptitudeScore != null ? s.aptitudeScore : null,
          technicalScore: s.technicalScore != null ? s.technicalScore : null,
          deficitArea: s.deficitArea || 'None Identified',
          skillGaps: s.skillGaps || [],
          status: s.status || 'ACTIVE',
          assignedStaff: s.assignedStaffName || 'Unassigned',
          assignedStaffId: s.assignedStaffId || null,
          assignedStaffName: s.assignedStaffName || null,
          assignedStaffEmail: s.assignedStaffEmail || null
        }));
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get real At-Risk students from MySQL database (classification = AT_RISK)
   */
  async getAtRiskStudents() {
    try {
      const res = await api.get('/staff/students/at-risk');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((s) => ({
          id: 'std-' + (s.studentId || s.id),
          studentId: s.studentId || s.id,
          name: s.studentName || s.name,
          regNo: s.registerNumber || s.regNo || 'Not Provided',
          department: s.department || s.departmentName || 'Not Provided',
          departmentName: s.departmentName || s.department || 'Not Provided',
          year: s.year ? `${s.year}th Year` : '4th Year',
          readinessScore: s.readinessScore != null ? s.readinessScore : null,
          classification: 'At Risk',
          aptitudeScore: s.aptitudeScore != null ? s.aptitudeScore : null,
          technicalScore: s.technicalScore != null ? s.technicalScore : null,
          riskFactors: s.riskFactors || ['Low Assessment Score / Performance'],
          skillGaps: s.mainSkillGaps || []
        }));
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get real institution-wide skill gaps analytics
   */
  async getSkillGapsAnalytics() {
    try {
      const res = await api.get('/staff/analytics/skill-gaps');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data.mostCommonSkillGaps || [];
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get real company recruitment drive analytics
   */
  async getCompanyAnalytics() {
    try {
      const res = await api.get('/staff/analytics/companies');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get staff dashboard summary metrics
   */
  async getDashboard() {
    try {
      const res = await api.get('/staff/dashboard');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get staff authenticated profile
   */
  async getProfile() {
    try {
      const res = await api.get('/staff/profile');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get assigned students for the logged-in staff mentor
   */
  async getMyStudents() {
    try {
      const res = await api.get('/staff/my-students');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((s) => ({
          id: 'std-' + (s.studentId || s.id),
          studentId: s.studentId || s.id,
          name: s.studentName || s.name,
          regNo: s.registerNumber || s.regNo || 'Not Provided',
          department: s.department || s.departmentName || 'Not Provided',
          departmentName: s.departmentName || s.department || 'Not Provided',
          year: s.year ? `${s.year}th Year` : '4th Year',
          cgpa: s.cgpa != null ? s.cgpa : null,
          readinessScore: s.readinessScore != null ? s.readinessScore : null,
          classification: s.classificationDisplay || (s.classification === 'HIGHLY_READY' ? 'Highly Ready' : s.classification === 'READY' ? 'Ready' : s.classification === 'NEEDS_IMPROVEMENT' ? 'Needs Improvement' : s.classification === 'AT_RISK' ? 'At Risk' : 'Pending Assessment'),
          aptitudeScore: s.aptitudeScore != null ? s.aptitudeScore : null,
          technicalScore: s.technicalScore != null ? s.technicalScore : null,
          deficitArea: s.deficitArea || 'None Identified',
          skillGaps: s.skillGaps || [],
          status: s.status || 'ACTIVE',
          assignedStaff: s.assignedStaffName || 'Unassigned',
          assignedStaffId: s.assignedStaffId || null,
          assignedStaffName: s.assignedStaffName || null,
          assignedStaffEmail: s.assignedStaffEmail || null
        }));
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get student-level skill gaps comparing student skills against company requirements
   */
  async getStudentSkillGaps(params = {}) {
    try {
      const res = await api.get('/staff/skill-gaps/students', { params });
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get detailed skill gap analysis for a specific student
   */
  async getStudentSkillGapDetail(studentId, companyId = null) {
    try {
      const params = companyId ? { companyId } : {};
      const res = await api.get(`/staff/skill-gaps/students/${studentId}`, { params });
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get eligible students evaluated against a specific company's requirements
   */
  async getEligibleStudentsForCompany(companyId, params = {}) {
    try {
      const res = await api.get(`/staff/companies/${companyId}/eligible-students`, { params });
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  }
};
