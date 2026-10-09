import api, { getErrorMessage } from './api';
import { assessmentService } from './assessmentService';
import { readinessService } from './readinessService';
import { companyService } from './companyService';

export const studentService = {
  /**
   * Fetch authenticated student's profile directly from MySQL Student table
   */
  async getProfile() {
    try {
      const res = await api.get('/students/me');
      if (res.data && res.data.success && res.data.data) {
        const d = res.data.data;
        const [readiness, assessmentState, companyMatches] = await Promise.all([
          readinessService.getReadinessScore().catch(() => null),
          assessmentService.getAssessmentStatus().catch(() => null),
          companyService.getCompanyMatches('All').catch(() => [])
        ]);

        return {
          id: d.id,
          studentId: d.id,
          name: d.name,
          email: d.email,
          regNo: d.registerNumber,
          department: d.departmentName,
          year: d.year ? `${d.year}th Year` : '4th Year',
          cgpa: d.cgpa || 0,
          tenthPercentage: d.tenthPercentage || 0,
          twelfthPercentage: d.twelfthPercentage || 0,
          backlogs: d.backlogs || 0,
          programmingScore: d.programmingScore || 0,
          technicalSkillScore: d.technicalSkillScore || 0,
          communicationScore: d.communicationScore || 0,
          problemSolvingScore: d.problemSolvingScore || 0,
          teamworkScore: d.teamworkScore || 0,
          skills: Array.isArray(d.skills) ? d.skills.map((s) => ({
            skillId: s.skillId,
            name: s.skillName,
            level: s.currentLevel === 'ADVANCED' ? 'Advanced' : s.currentLevel === 'INTERMEDIATE' ? 'Intermediate' : 'Beginner',
            rawLevel: s.currentLevel,
            category: s.category,
            verified: true
          })) : [],
          semesterMarks: Array.isArray(d.semesterMarks) ? d.semesterMarks.map((sm) => ({
            semester: sm.semester,
            marks: sm.marks
          })) : [],
          readinessScore: readiness?.readinessScore !== undefined && readiness?.readinessScore !== null ? readiness.readinessScore : null,
          classification: readiness?.classification || null,
          academicScore: readiness?.academicScore ?? (d.cgpa ? Math.round(d.cgpa * 10) : null),
          aptitudeScore: readiness?.aptitudeScore ?? null,
          technicalScore: readiness?.technicalScore ?? null,
          assessmentStatus: assessmentState,
          companyMatches: (companyMatches || []).map((c) => ({
            company: c.name || c.companyName,
            matchScore: c.matchPercentage,
            matchedSkills: c.matchedSkills,
            missingSkills: c.skillGaps,
            status: c.eligibilityStatus
          }))
        };
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Update student profile in MySQL database
   */
  async updateProfile(profileData) {
    try {
      const res = await api.put('/students/me', profileData);
      if (res.data && res.data.success) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to update student profile');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getReadiness() {
    return readinessService.getReadinessAnalysis();
  },

  async getCompanyMatches(filter = 'All') {
    return companyService.getCompanyMatches(filter);
  },

  async getSkillGaps() {
    try {
      const matches = await companyService.getCompanyMatches('All');
      const gapsMap = new Map();
      (matches || []).forEach((m) => {
        (m.missingSkills || m.skillGaps || []).forEach((g) => {
          const count = (gapsMap.get(g) || 0) + 1;
          gapsMap.set(g, count);
        });
      });
      return Array.from(gapsMap.entries()).map(([skill, count]) => ({
        skill,
        requiredLevel: count >= 3 ? 'Advanced' : 'Intermediate',
        currentLevel: 'Needs Improvement',
        gap: count >= 3 ? 'High' : 'Moderate',
        status: count >= 3 ? 'Critical Deficit' : 'Recommended Focus'
      }));
    } catch {
      return [];
    }
  }
};
