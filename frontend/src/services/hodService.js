import api, { getErrorMessage } from './api';

export const hodService = {
  /**
   * Get executive institution-level placement analytics from MySQL
   */
  async getDashboardMetrics() {
    try {
      const res = await api.get('/hod/analytics');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        return {
          totalStudents: d.totalStudents || 0,
          averageReadinessScore: d.averageReadiness != null ? d.averageReadiness : null,
          averageAptitudeScore: d.averageAptitude != null ? d.averageAptitude : null,
          averageTechnicalScore: d.averageTechnicalScore != null ? d.averageTechnicalScore : d.averageTechnical,
          highlyReadyCount: d.highlyReady || 0,
          readyCount: d.ready || 0,
          needsImprovementCount: d.needsImprovement || 0,
          atRiskCount: d.atRisk || 0
        };
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get real department-wise readiness and at-risk breakdown
   */
  async getDepartmentAnalytics() {
    try {
      const res = await api.get('/hod/analytics/departments');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((dept) => ({
          department: dept.department || dept.departmentName || dept.name || 'Not Provided',
          departmentName: dept.department || dept.departmentName || dept.name || 'Not Provided',
          name: dept.department || dept.departmentName || dept.name || 'Not Provided',
          code: dept.code,
          studentCount: dept.studentCount || 0,
          studentsCount: dept.studentCount || 0,
          averageCgpa: dept.averageCgpa != null ? dept.averageCgpa : 'N/A',
          averageCGPA: dept.averageCgpa != null ? dept.averageCgpa : 'N/A',
          averageReadiness: dept.averageReadiness != null ? dept.averageReadiness : null,
          atRiskCount: dept.atRiskCount || 0,
          topSkill: 'Java / SQL'
        }));
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get institution at-risk overview
   */
  async getAtRiskOverview() {
    try {
      const res = await api.get('/hod/analytics/at-risk');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get corporate recruitment analytics
   */
  async getCompanyAnalytics() {
    try {
      const res = await api.get('/hod/analytics/companies');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get staff monitoring overview directly from /api/hod/staff-monitoring
   */
  async getStaffMonitoring() {
    try {
      const res = await api.get('/hod/staff-monitoring');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get HOD dashboard metrics directly from /api/hod/dashboard
   */
  async getDashboard() {
    try {
      const res = await api.get('/hod/dashboard');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Get HOD authenticated profile
   */
  async getProfile() {
    try {
      const res = await api.get('/hod/profile');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * HOD Staff Assignment - Get registered/approved students belonging to HOD department
   */
  async getStaffAssignmentStudents() {
    try {
      const res = await api.get('/hod/staff-assignment/students');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * HOD Staff Assignment - Get available placement staff with caseloads
   */
  async getAvailableStaff() {
    try {
      const res = await api.get('/hod/staff-assignment/staff');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * HOD Staff Assignment - Bulk assign selected students to staff
   */
  async bulkAssignStudents(studentIds, staffId) {
    try {
      const res = await api.post('/hod/staff-assignment/assign', { studentIds, staffId });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * HOD Staff Assignment - Reassign a single student to staff
   */
  async reassignStudent(studentId, staffId) {
    try {
      const res = await api.put('/hod/staff-assignment/reassign', null, {
        params: { studentId, staffId }
      });
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * HOD Staff Assignment - Unassign a student from staff
   */
  async unassignStudent(studentId) {
    try {
      const res = await api.delete(`/hod/staff-assignment/unassign/${studentId}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Backward-compatibility aliases
   */
  async getMentorAssignments() {
    return this.getStaffAssignmentStudents();
  },

  async assignMentor(studentId, staffId) {
    return this.bulkAssignStudents([studentId], staffId);
  },

  async updateMentor(id, staffId) {
    return this.reassignStudent(id, staffId);
  },

  async removeMentor(id) {
    return this.unassignStudent(id);
  }
};
