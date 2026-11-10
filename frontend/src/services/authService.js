import api, { getErrorMessage } from './api';

const normalizeRoleToFrontend = (backendRole) => {
  if (!backendRole) return 'student';
  const r = backendRole.toUpperCase();
  if (r === 'STUDENT') return 'student';
  if (r === 'PLACEMENT_STAFF') return 'staff';
  if (r === 'PLACEMENT_HOD') return 'hod';
  if (r === 'ADMIN') return 'admin';
  return backendRole.toLowerCase();
};

export const authService = {
  /**
   * Log in user against the real MySQL User database table
   */
  async login(email, password, role) {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data && res.data.success && res.data.data) {
        const { token, userId, name, email: userEmail, role: backendRole } = res.data.data;
        const frontendRole = normalizeRoleToFrontend(backendRole);
        const user = {
          id: userId,
          name: name || userEmail.split('@')[0],
          email: userEmail,
          role: frontendRole,
          rawRole: backendRole
        };

        localStorage.setItem('careerready_token', token);
        localStorage.setItem('careerready_user', JSON.stringify(user));

        return {
          success: true,
          token,
          user
        };
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Register a new student in MySQL database
   * Does NOT auto-authenticate; redirects user to Sign In
   */
  async register(studentData) {
    try {
      const deptMap = {
        'Computer Science and Engineering': 1,
        'Computer Science & Engineering': 1,
        'Information Technology': 2,
        'Electronics and Communication Engineering': 3,
        'Electronics & Communication': 3,
        'Electrical and Electronics Engineering': 4,
        'Electrical & Electronics Engineering': 4,
        'Mechanical Engineering': 5
      };
      const yearMap = {
        '1st Year': 1,
        '2nd Year': 2,
        '3rd Year': 3,
        '4th Year': 4
      };

      const payload = {
        name: studentData.name,
        email: studentData.email,
        password: studentData.password,
        registerNumber: studentData.registerNumber || studentData.regNo,
        departmentId: Number(studentData.departmentId) || deptMap[studentData.department] || 1,
        year: typeof studentData.year === 'number' ? studentData.year : (yearMap[studentData.year] || parseInt(studentData.year) || 4),
        cgpa: parseFloat(studentData.cgpa),
        backlogs: parseInt(studentData.backlogs, 10),
        semesterMarks: Array.isArray(studentData.semesterMarks) ? studentData.semesterMarks : [],
        skills: Array.isArray(studentData.skills) ? studentData.skills : []
      };

      const res = await api.post('/auth/register/student', payload);
      if (res.data && res.data.success) {
        // Do not store token or user in localStorage!
        return {
          success: true,
          message: 'Registration successful. Please sign in.'
        };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('email')) {
        throw new Error('Email already registered.');
      }
      throw new Error(msg);
    }
  },

  /**
   * Register a new staff member (status: PENDING_APPROVAL)
   */
  async registerStaff(staffData) {
    try {
      const payload = {
        name: staffData.name ? staffData.name.trim() : '',
        email: staffData.email ? staffData.email.trim() : '',
        password: staffData.password,
        departmentId: staffData.departmentId ? Number(staffData.departmentId) : null,
        employeeId: staffData.employeeId ? staffData.employeeId.trim().toUpperCase() : '',
        phone: staffData.phone ? staffData.phone.trim() : null
      };
      const res = await api.post('/auth/register/staff', payload);
      if (res.data && res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Registration submitted successfully. Your account is awaiting administrator approval.'
        };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = getErrorMessage(err);
      throw new Error(msg);
    }
  },

  /**
   * Register a new HOD (status: PENDING_APPROVAL)
   */
  async registerHod(hodData) {
    try {
      const payload = {
        name: hodData.name ? hodData.name.trim() : '',
        email: hodData.email ? hodData.email.trim() : '',
        password: hodData.password,
        departmentId: hodData.departmentId ? Number(hodData.departmentId) : null,
        institutionalId: (hodData.institutionalId || hodData.employeeId) ? (hodData.institutionalId || hodData.employeeId).trim().toUpperCase() : '',
        departmentAuthority: hodData.departmentAuthority ? hodData.departmentAuthority.trim() : '',
        phone: hodData.phone ? hodData.phone.trim() : null
      };
      const res = await api.post('/auth/register/hod', payload);
      if (res.data && res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Registration submitted successfully. Your account is awaiting administrator approval.'
        };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = getErrorMessage(err);
      throw new Error(msg);
    }
  },

  /**
   * Register a new Administrator (status: PENDING_APPROVAL)
   */
  async registerAdmin(adminData) {
    try {
      const payload = {
        name: adminData.name ? adminData.name.trim() : '',
        email: adminData.email ? adminData.email.trim() : '',
        password: adminData.password,
        phone: adminData.phone ? adminData.phone.trim() : null
      };
      const res = await api.post('/auth/register/admin', payload);
      if (res.data && res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Registration submitted successfully. Your administrator account is awaiting approval.'
        };
      }
      throw new Error(res.data?.message || 'Registration failed');
    } catch (err) {
      const msg = getErrorMessage(err);
      throw new Error(msg);
    }
  },

  /**
   * Fetch public departments list for registration forms
   */
  async getPublicDepartments() {
    try {
      const res = await api.get('/auth/departments');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.warn('Failed to fetch public departments:', err);
      return [];
    }
  },

  /**
   * Get authenticated user from storage
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem('careerready_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Request password reset link for role
   */
  async forgotPassword(email, role) {
    try {
      const res = await api.post('/auth/forgot-password', { email, role });
      if (res.data && res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Password reset link sent to your registered email.'
        };
      }
      throw new Error(res.data?.message || 'Failed to send password reset email.');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Verify password reset token validity
   */
  async verifyResetToken(token) {
    try {
      const res = await api.get('/auth/verify-reset-token', { params: { token } });
      if (res.data && res.data.success) {
        return { success: true };
      }
      throw new Error(res.data?.message || 'Invalid or expired reset token.');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Reset user password with token
   */
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword, confirmPassword });
      if (res.data && res.data.success) {
        return {
          success: true,
          message: res.data.message || 'Password has been reset successfully.'
        };
      }
      throw new Error(res.data?.message || 'Failed to reset password.');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Verify staff approval token and fetch applicant details
   */
  async verifyStaffApprovalToken(token) {
    try {
      const res = await api.get('/auth/staff-approval/verify', { params: { token } });
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Invalid or unrecognized approval token.');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Confirm staff approval or rejection action via POST
   */
  async confirmStaffApproval(token) {
    try {
      const res = await api.post('/auth/staff-approval/confirm', { token });
      if (res.data && res.data.success && res.data.data) {
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to process approval action.');
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
  },

  /**
   * Log out user
   */
  logout() {
    localStorage.removeItem('careerready_token');
    localStorage.removeItem('careerready_user');
    sessionStorage.clear();
  }
};
