import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useCms } from '../../context/CmsContext';
import api, { getErrorMessage } from '../../services/api';
import { authService } from '../../services/authService';

const DEFAULT_SKILLS = [
  { id: 1, name: 'Java', category: 'Programming' },
  { id: 2, name: 'Python', category: 'Programming' },
  { id: 3, name: 'SQL', category: 'Database' },
  { id: 4, name: 'DBMS', category: 'Database' },
  { id: 5, name: 'Data Structures', category: 'Core CS' },
  { id: 6, name: 'JavaScript', category: 'Web Development' },
  { id: 7, name: 'React', category: 'Web Development' },
  { id: 8, name: 'Spring Boot', category: 'Backend' },
  { id: 9, name: 'HTML & CSS', category: 'Web Development' },
  { id: 10, name: 'Communication', category: 'Soft Skills' },
  { id: 11, name: 'Problem Solving', category: 'Core CS' },
  { id: 12, name: 'Computer Networks', category: 'Core CS' }
];

export const RegisterPage = () => {
  const { register, loading } = useAuth();
  const { cms } = useCms();
  const navigate = useNavigate();
  const location = useLocation();
  const { role: paramRole } = useParams();

  // Role resolution: 'student', 'staff', 'hod'
  const queryParams = new URLSearchParams(location.search);
  const queryRole = queryParams.get('role');

  const resolveRole = (pRole, qRole, path) => {
    const raw = (pRole || qRole || '').toLowerCase();
    if (raw === 'staff' || path.includes('/register/staff')) return 'staff';
    if (raw === 'hod' || path.includes('/register/hod')) return 'hod';
    return 'student';
  };

  const [activeRole, setActiveRole] = useState(() => resolveRole(paramRole, queryRole, location.pathname));

  useEffect(() => {
    setActiveRole(resolveRole(paramRole, queryRole, location.pathname));
  }, [paramRole, queryRole, location.pathname]);

  const [departmentsList, setDepartmentsList] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    regNo: '',
    departmentId: '1',
    department: 'Computer Science and Engineering',
    year: '4th Year',
    cgpa: '',
    backlogs: '',
    password: ''
  });

  // Staff / HOD specific form state
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    departmentId: '1',
    employeeId: '',
    institutionalId: '',
    departmentAuthority: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // Map of semester number -> marks (e.g. { 1: 82, 2: 76, 3: 88, 4: 81 })
  const [semesterMarks, setSemesterMarks] = useState({});

  // Map of skillId -> level (e.g. { 1: 'ADVANCED', 3: 'INTERMEDIATE', 7: 'BEGINNER' })
  const [selectedSkills, setSelectedSkills] = useState({});

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch departments list
  useEffect(() => {
    authService.getPublicDepartments().then((depts) => {
      if (depts && depts.length > 0) {
        setDepartmentsList(depts);
        setStaffFormData((prev) => ({ ...prev, departmentId: String(depts[0].id) }));
        setFormData((prev) => ({
          ...prev,
          departmentId: String(depts[0].id),
          department: depts[0].name
        }));
      }
    });
  }, []);

  // Fetch skill catalog from backend
  useEffect(() => {
    let isMounted = true;
    api.get('/skills')
      .then((res) => {
        if (isMounted && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAvailableSkills(res.data.data);
        } else if (isMounted) {
          setAvailableSkills(DEFAULT_SKILLS);
        }
      })
      .catch(() => {
        if (isMounted) setAvailableSkills(DEFAULT_SKILLS);
      });
    return () => { isMounted = false; };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSemesterMarkChange = (semester, value) => {
    setSemesterMarks((prev) => ({
      ...prev,
      [semester]: value
    }));
    setError('');
  };

  const toggleSkill = (skill) => {
    setError('');
    setSelectedSkills((prev) => {
      const copy = { ...prev };
      if (copy[skill.id]) {
        delete copy[skill.id];
      } else {
        copy[skill.id] = 'INTERMEDIATE'; // Default level upon selection
      }
      return copy;
    });
  };

  const setSkillLevel = (skillId, level) => {
    setSelectedSkills((prev) => ({
      ...prev,
      [skillId]: level
    }));
  };

  // Determine semesters to collect based on Academic Year
  const getSemestersForYear = (yearStr) => {
    if (yearStr === '1st Year') return [1];
    if (yearStr === '2nd Year') return [1, 2, 3];
    if (yearStr === '3rd Year') return [1, 2, 3, 4, 5];
    return [1, 2, 3, 4, 5, 6]; // 4th Year default completed semesters
  };

  const currentSemesters = getSemestersForYear(formData.year);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Password validation
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // 2. Backlogs validation (Must be explicitly provided, integer >= 0)
    if (formData.backlogs === '' || formData.backlogs === null || isNaN(formData.backlogs)) {
      setError('Number of backlogs is required. Please enter 0 if you have no active backlogs.');
      return;
    }
    const backlogsInt = parseInt(formData.backlogs, 10);
    if (backlogsInt < 0) {
      setError('Number of backlogs cannot be negative.');
      return;
    }

    // 3. CGPA validation
    if (formData.cgpa === '' || isNaN(formData.cgpa)) {
      setError('Cumulative CGPA is required (between 0.0 and 10.0).');
      return;
    }
    const cgpaFloat = parseFloat(formData.cgpa);
    if (cgpaFloat < 0 || cgpaFloat > 10.0) {
      setError('Cumulative CGPA must be between 0.0 and 10.0.');
      return;
    }

    // 4. Semester Marks formatting and validation
    const formattedMarks = [];
    for (const sem of currentSemesters) {
      const val = semesterMarks[sem];
      if (val !== undefined && val !== '' && val !== null) {
        const markNum = parseFloat(val);
        if (isNaN(markNum) || markNum < 0 || markNum > 100) {
          setError(`Semester ${sem} mark must be a valid percentage between 0 and 100.`);
          return;
        }
        formattedMarks.push({
          semester: Number(sem),
          marks: markNum
        });
      }
    }

    // 5. Skills formatting and validation
    const formattedSkills = Object.entries(selectedSkills).map(([skillId, level]) => {
      const skillObj = availableSkills.find((s) => s.id === Number(skillId));
      return {
        skillId: Number(skillId),
        skillName: skillObj ? skillObj.name : undefined,
        level: level
      };
    });

    for (const sk of formattedSkills) {
      if (!sk.level || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(sk.level)) {
        setError(`Please select a valid proficiency level for all selected skills.`);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId) || 1,
        cgpa: cgpaFloat,
        backlogs: backlogsInt,
        semesterMarks: formattedMarks,
        skills: formattedSkills
      };

      const res = await register(payload);
      if (res && res.success) {
        setSuccess('Registration successful. Please sign in using your registered email and password.');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Registration successful. Please sign in using your registered email and password.' } });
        }, 1200);
      }
    } catch (err) {
      setError(err?.message || 'Registration failed');
    }
  };

  const handleStaffChange = (e) => {
    setStaffFormData({ ...staffFormData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!staffFormData.name || !staffFormData.name.trim()) {
      setError('Full Name is mandatory.');
      return;
    }

    if (!staffFormData.email || !staffFormData.email.trim()) {
      setError('Official Email is mandatory.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(staffFormData.email.trim())) {
      setError('Please provide a valid official email address.');
      return;
    }

    if (activeRole === 'staff') {
      if (!staffFormData.employeeId || !staffFormData.employeeId.trim()) {
        setError('Employee ID is mandatory for Placement Staff registration.');
        return;
      }
    } else if (activeRole === 'hod') {
      if (!staffFormData.institutionalId || !staffFormData.institutionalId.trim()) {
        setError('Institutional ID is mandatory for Placement HOD registration.');
        return;
      }
      if (!staffFormData.departmentAuthority || !staffFormData.departmentAuthority.trim()) {
        setError('Department Authority is mandatory for Placement HOD registration.');
        return;
      }
    }

    if (!staffFormData.departmentId) {
      setError('Please select an authorized Department.');
      return;
    }

    if (!staffFormData.password || staffFormData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (staffFormData.password !== staffFormData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setStaffSubmitting(true);
    try {
      let res;
      if (activeRole === 'staff') {
        res = await authService.registerStaff(staffFormData);
      } else {
        res = await authService.registerHod(staffFormData);
      }

      if (res && res.success) {
        setSuccess('Registration submitted successfully. Your account is waiting for Admin approval.');
        setTimeout(() => {
          navigate('/login', {
            state: { message: 'Registration submitted successfully. Your account is waiting for Admin approval.' }
          });
        }, 2000);
      }
    } catch (err) {
      setError(err?.message || 'Registration request failed.');
    } finally {
      setStaffSubmitting(false);
    }
  };

  const switchRole = (role) => {
    setActiveRole(role);
    setError('');
    setSuccess('');
    navigate(role === 'student' ? '/register/student' : `/register/${role}`);
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', backgroundColor: 'var(--color-bg-app)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Logo variant="light" />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '16px', color: 'var(--color-navy-950)' }}>
            {activeRole === 'staff'
              ? 'Register as Placement Staff'
              : activeRole === 'hod'
              ? 'Register as Placement HOD'
              : cms('register.title', 'Student Registration')}
          </h2>
          <p className="form-hint" style={{ marginTop: '4px' }}>
            {activeRole === 'staff'
              ? 'Create your staff account. Registrations require administrator approval before access is granted.'
              : activeRole === 'hod'
              ? 'Create your HOD account. Registrations require administrator approval before access is granted.'
              : cms('register.subtitle', 'Enter your verified academic profile and skillset for real placement readiness analytics.')}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="register-role-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '22px', backgroundColor: 'var(--color-bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'student', label: 'Student' },
            { id: 'staff', label: 'Placement Staff' },
            { id: 'hod', label: 'Placement HOD' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => switchRole(item.id)}
              style={{
                padding: '8px 6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeRole === item.id ? '#FFFFFF' : 'transparent',
                color: activeRole === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: activeRole === item.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.8125rem', marginBottom: '18px', fontWeight: 500 }}>
            {success}
          </div>
        )}

        {/* Staff & HOD Registration Form */}
        {(activeRole === 'staff' || activeRole === 'hod') && (
          <form onSubmit={handleStaffSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="staff-name">
                {activeRole === 'staff' ? 'Full Name' : 'Officer Name'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="staff-name"
                name="name"
                type="text"
                className="input-control"
                placeholder={activeRole === 'staff' ? "e.g. Dr. Ramesh Kumar" : "e.g. Prof. Sundar Rajan"}
                value={staffFormData.name}
                onChange={handleStaffChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="staff-email">
                Official Email <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="staff-email"
                name="email"
                type="email"
                className="input-control"
                placeholder={activeRole === 'staff' ? "e.g. staff.ramesh@careerready.ai" : "e.g. hod.sundar@careerready.ai"}
                value={staffFormData.email}
                onChange={handleStaffChange}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="staff-dept">
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="staff-dept"
                  name="departmentId"
                  className="select-control"
                  value={staffFormData.departmentId}
                  onChange={handleStaffChange}
                  required
                >
                  {departmentsList.length > 0 ? (
                    departmentsList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))
                  ) : (
                    <>
                      <option value="1">Computer Science and Engineering (CSE)</option>
                      <option value="2">Information Technology (IT)</option>
                      <option value="3">Electronics and Communication Engineering (ECE)</option>
                      <option value="4">Electrical and Electronics Engineering (EEE)</option>
                      <option value="5">Mechanical Engineering (MECH)</option>
                    </>
                  )}
                </select>
              </div>

              {activeRole === 'staff' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="staff-empid">
                    Employee ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="staff-empid"
                    name="employeeId"
                    type="text"
                    className="input-control"
                    placeholder="e.g. EMP-STF-102"
                    value={staffFormData.employeeId}
                    onChange={handleStaffChange}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="hod-instid">
                    Institutional ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    id="hod-instid"
                    name="institutionalId"
                    type="text"
                    className="input-control"
                    placeholder="e.g. INST-HOD-001"
                    value={staffFormData.institutionalId}
                    onChange={handleStaffChange}
                    required
                  />
                </div>
              )}
            </div>

            {activeRole === 'hod' && (
              <div className="form-group">
                <label className="form-label" htmlFor="hod-authority">
                  Department Authority <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="hod-authority"
                  name="departmentAuthority"
                  type="text"
                  className="input-control"
                  placeholder="e.g. Head of Placement & Training / Dean of Industry Relations"
                  value={staffFormData.departmentAuthority}
                  onChange={handleStaffChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="staff-phone">Contact Phone</label>
              <input
                id="staff-phone"
                name="phone"
                type="tel"
                className="input-control"
                placeholder="e.g. +91 9876543210"
                value={staffFormData.phone}
                onChange={handleStaffChange}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="staff-password">
                  Password <span style={{ color: '#EF4444' }}>*</span> <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(min 6)</span>
                </label>
                <input
                  id="staff-password"
                  name="password"
                  type="password"
                  className="input-control"
                  placeholder="Min. 6 characters"
                  value={staffFormData.password}
                  onChange={handleStaffChange}
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="staff-confirm-password">
                  Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="staff-confirm-password"
                  name="confirmPassword"
                  type="password"
                  className="input-control"
                  placeholder="Re-enter password"
                  value={staffFormData.confirmPassword}
                  onChange={handleStaffChange}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', marginBottom: '16px', fontSize: '0.75rem', color: '#64748B' }}>
              <strong>Notice:</strong> All {activeRole === 'staff' ? 'Placement Staff' : 'Placement HOD'} accounts require administrative verification. Once submitted, your profile will be placed in <em>PENDING</em> status until an administrator activates your credentials.
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={staffSubmitting}
              style={{ width: '100%', marginTop: '6px' }}
            >
              {staffSubmitting ? 'Submitting Registration...' : activeRole === 'staff' ? 'Register as Placement Staff' : 'Register as Placement HOD'}
            </Button>
          </form>
        )}

        {/* Existing Student Registration Form */}
        {activeRole === 'student' && (

        <form onSubmit={handleSubmit}>
          {/* Personal & Registry Details */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                name="name"
                type="text"
                className="input-control"
                placeholder="e.g. Test Student"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-regNo">Register Number</label>
              <input
                id="reg-regNo"
                name="regNo"
                type="text"
                className="input-control"
                placeholder="e.g. 2022CS041"
                value={formData.regNo}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">University Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              className="input-control"
              placeholder="e.g. teststudent@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-dept">
                Department <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                id="reg-dept"
                name="departmentId"
                className="select-control"
                value={formData.departmentId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const deptObj = departmentsList.find((d) => String(d.id) === String(selectedId));
                  setFormData((prev) => ({
                    ...prev,
                    departmentId: selectedId,
                    department: deptObj ? deptObj.name : ''
                  }));
                }}
                required
              >
                {departmentsList.length > 0 ? (
                  departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))
                ) : (
                  <>
                    <option value="1">Computer Science and Engineering (CSE)</option>
                    <option value="2">Information Technology (IT)</option>
                    <option value="3">Electronics and Communication Engineering (ECE)</option>
                    <option value="4">Electrical and Electronics Engineering (EEE)</option>
                    <option value="5">Mechanical Engineering (MECH)</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-year">Academic Year</label>
              <select
                id="reg-year"
                name="year"
                className="select-control"
                value={formData.year}
                onChange={handleChange}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year (Pre-Final)</option>
                <option value="4th Year">4th Year (Final Year)</option>
              </select>
            </div>
          </div>

          {/* Academic Standings: CGPA + Backlogs */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-cgpa">
                Cumulative CGPA <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(0.0 - 10.0)</span>
              </label>
              <input
                id="reg-cgpa"
                name="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="input-control"
                placeholder="e.g. 8.5"
                value={formData.cgpa}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-backlogs">
                Number of Backlogs <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(0 if none)</span>
              </label>
              <input
                id="reg-backlogs"
                name="backlogs"
                type="number"
                min="0"
                step="1"
                className="input-control"
                placeholder="e.g. 0, 1, 2"
                value={formData.backlogs}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Academic Details: Semester Marks */}
          <div style={{ marginTop: '12px', marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: 'var(--color-navy-950)' }}>
                Academic Details — Semester Marks (%)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>0 - 100% per semester</span>
            </div>
            <p className="form-hint" style={{ marginBottom: '14px', fontSize: '0.75rem' }}>
              Enter your actual completed semester percentage marks:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
              {currentSemesters.map((sem) => (
                <div key={sem}>
                  <label htmlFor={`sem-${sem}`} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                    Semester {sem}
                  </label>
                  <input
                    id={`sem-${sem}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="input-control"
                    placeholder="e.g. 82.5"
                    value={semesterMarks[sem] ?? ''}
                    onChange={(e) => handleSemesterMarkChange(sem, e.target.value)}
                    style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Student Skills & Levels Section */}
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: 'var(--color-navy-950)' }}>
                Skills & Proficiency Levels
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {Object.keys(selectedSkills).length} selected
              </span>
            </div>
            <p className="form-hint" style={{ marginBottom: '12px', fontSize: '0.75rem' }}>
              Select the skills you know, then set your verified proficiency level:
            </p>

            {/* Skill Selector Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {availableSkills.map((s) => {
                const isSelected = Boolean(selectedSkills[s.id]);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSelected ? `✓ ${s.name}` : `+ ${s.name}`}
                  </button>
                );
              })}
            </div>

            {/* Active Selected Skills with Level Radios */}
            {Object.keys(selectedSkills).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {Object.entries(selectedSkills).map(([skillId, level]) => {
                  const skill = availableSkills.find((s) => s.id === Number(skillId));
                  if (!skill) return null;
                  return (
                    <div
                      key={skillId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.8125rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{skill.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSkillLevel(skill.id, lvl)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: level === lvl ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                              backgroundColor: level === lvl ? 'var(--color-primary)' : 'transparent',
                              color: level === lvl ? '#FFFFFF' : 'var(--color-text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            {lvl === 'BEGINNER' ? 'Beginner' : lvl === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced'}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          style={{
                            marginLeft: '4px',
                            background: 'none',
                            border: 'none',
                            color: '#9CA3AF',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            lineHeight: 1
                          }}
                          title="Remove skill"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
                No skills selected yet. Click skills above to select.
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(min 6 characters)</span>
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              className="input-control"
              placeholder="Create a strong password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '12px' }}
          >
            {loading ? 'Creating Profile...' : cms('register.submit_btn', 'Complete Registration')}
          </Button>
        </form>
        )}

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)', fontSize: '0.8125rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {cms('register.login_prompt', 'Already have an account?')}{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
            {cms('register.login_link', 'Sign In')}
          </Link>
        </div>
      </div>
    </div>
  );
};
