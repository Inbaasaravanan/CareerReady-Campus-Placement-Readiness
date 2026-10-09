import api, { getErrorMessage } from './api';

export const adminService = {
  // --- USERS CRUD ---
  async getUsers(role = 'all', search = '') {
    try {
      const res = await api.get('/admin/users');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        let list = res.data.data.map((u) => {
          const rawDept = u.department || u.departmentName || u.departmentCode || null;
          const displayDept = rawDept && String(rawDept).trim() !== '' ? String(rawDept).trim() : '-';
          return {
            id: u.id,
            name: u.name || u.userName || 'Unnamed',
            userName: u.userName || u.name || 'Unnamed',
            email: u.email,
            role: u.role ? u.role.toLowerCase().replace('placement_', '') : 'student',
            department: displayDept,
            departmentName: displayDept,
            departmentCode: u.departmentCode || null,
            status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
            lastLogin: u.lastLogin || u.lastLoginAt || null,
            lastLoginAt: u.lastLoginAt || u.lastLogin || null,
            createdAt: u.createdAt
          };
        });

        if (role && role !== 'all') {
          list = list.filter((u) => u.role === role.toLowerCase());
        }
        if (search) {
          const q = search.toLowerCase();
          list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
        }
        return list;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createUser(userData) {
    try {
      const res = await api.post('/admin/users', userData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateUser(id, userData) {
    try {
      const res = await api.put(`/admin/users/${id}`, userData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteUser(id) {
    try {
      const res = await api.delete(`/admin/users/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateUserStatus(id, newStatus) {
    return this.updateUser(id, { status: newStatus.toUpperCase() });
  },

  // --- ACCOUNT APPROVALS (STAFF & HOD) ---
  async getPendingApprovals() {
    try {
      const res = await api.get('/admin/pending-approvals');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((u) => {
          const regDate = u.createdAt || u.registeredAt || null;
          return {
            ...u,
            id: u.userId || u.id,
            userId: u.userId || u.id,
            departmentName: u.department || u.departmentName,
            createdAt: regDate,
            registeredAt: regDate
          };
        });
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async approveUser(userId) {
    try {
      const res = await api.post(`/admin/approvals/${userId}/approve`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async rejectUser(userId) {
    try {
      const res = await api.post(`/admin/approvals/${userId}/reject`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- ADMIN DASHBOARD ---
  async getDashboard() {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- QUESTIONS MANAGEMENT ---
  async getQuestions() {
    try {
      const res = await api.get('/admin/questions');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data.map((q) => {
          const qText = q.questionText || q.text || '';
          const qType = q.assessmentType || q.type || '';
          const qCategory = q.topic || q.category || 'General';
          const qDifficulty = q.difficultyLevel || q.difficulty || 'MEDIUM';
          return {
            ...q,
            questionText: qText,
            text: qText,
            assessmentType: qType,
            type: qType,
            topic: qCategory,
            category: qCategory,
            difficultyLevel: qDifficulty,
            difficulty: qDifficulty
          };
        });
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateQuestion(id, questionData) {
    try {
      const res = await api.put(`/admin/questions/${id}`, questionData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- COMPANIES CRUD ---
  async getCompanies() {
    try {
      const res = await api.get('/admin/companies');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createCompany(companyData) {
    try {
      const res = await api.post('/admin/companies', companyData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateCompany(id, companyData) {
    try {
      const res = await api.put(`/admin/companies/${id}`, companyData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteCompany(id) {
    try {
      const res = await api.delete(`/admin/companies/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- SKILLS CRUD ---
  async getSkills() {
    try {
      const res = await api.get('/admin/skills');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createSkill(skillData) {
    try {
      const res = await api.post('/admin/skills', skillData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateSkill(id, skillData) {
    try {
      const res = await api.put(`/admin/skills/${id}`, skillData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteSkill(id) {
    try {
      const res = await api.delete(`/admin/skills/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- DEPARTMENTS CRUD ---
  async getDepartments() {
    try {
      const res = await api.get('/admin/departments');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createDepartment(deptData) {
    try {
      const res = await api.post('/admin/departments', deptData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateDepartment(id, deptData) {
    try {
      const res = await api.put(`/admin/departments/${id}`, deptData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteDepartment(id) {
    try {
      const res = await api.delete(`/admin/departments/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- STUDENTS CRUD ---
  async getStudents() {
    try {
      const res = await api.get('/admin/students');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- STAFF & HOD CRUD ---
  async getStaff() {
    try {
      const res = await api.get('/admin/staff');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createStaff(staffData) {
    try {
      const res = await api.post('/admin/staff', staffData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateStaff(id, staffData) {
    try {
      const res = await api.put(`/admin/staff/${id}`, staffData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteStaff(id) {
    try {
      const res = await api.delete(`/admin/staff/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async getHod() {
    try {
      const res = await api.get('/admin/hod');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async createHod(hodData) {
    try {
      const res = await api.post('/admin/hod', hodData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async updateHod(id, hodData) {
    try {
      const res = await api.put(`/admin/hod/${id}`, hodData);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  async deleteHod(id) {
    try {
      const res = await api.delete(`/admin/hod/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  // --- SYSTEM SETTINGS ---
  async getSettings() {
    return {
      general: {
        institutionName: 'CareerReady AI Partner Institution',
        academicYear: '2025 - 2026',
        placementSeason: 'Placement Readiness & Assessment Cycle'
      },
      thresholds: {
        highlyReadyThreshold: 85,
        readyThreshold: 70,
        needsImprovementThreshold: 55
      },
      notifications: {
        emailAlertsAtRisk: true,
        weeklyHODDigest: true,
        studentScoreAlerts: true
      }
    };
  },

  async updateSettings(newSettings) {
    return { success: true, settings: newSettings };
  }
};
