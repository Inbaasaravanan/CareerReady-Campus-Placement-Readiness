import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useCms } from '../../context/CmsContext';
import { EyeIcon, EyeOffIcon } from '../../components/common/Icons';

const ROLE_TO_API_MAP = {
  student: 'STUDENT',
  staff: 'STAFF',
  hod: 'HOD',
  admin: 'ADMIN'
};

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const { cms } = useCms();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clean up window history state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const backendRole = ROLE_TO_API_MAP[role] || role.toUpperCase();

    try {
      const res = await login(email, password, backendRole);
      if (res && res.success) {
        const userRole = res.user?.role || role;
        if (userRole === 'student') navigate('/student/dashboard');
        else if (userRole === 'staff') navigate('/staff/dashboard');
        else if (userRole === 'hod') navigate('/hod/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      }
    } catch (err) {
      setError(err?.message || 'Invalid credentials or unable to connect to Spring Boot server.');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', backgroundColor: 'var(--color-bg-app)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Logo variant="light" />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '16px', color: 'var(--color-navy-950)' }}>
            {cms('login.title', 'Sign In to Placement Portal')}
          </h2>
          <p className="form-hint" style={{ marginTop: '4px' }}>
            {cms('login.subtitle', 'Authenticate with real database credentials')}
          </p>
        </div>

        {/* Role Quick Selector Tabs */}
        <div className="login-role-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '24px', backgroundColor: 'var(--color-bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {[
            { id: 'student', label: 'Student' },
            { id: 'staff', label: 'Staff' },
            { id: 'hod', label: 'HOD' },
            { id: 'admin', label: 'Admin' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRoleSelect(item.id)}
              style={{
                padding: '6px 4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: role === item.id ? '#FFFFFF' : 'transparent',
                color: role === item.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                boxShadow: role === item.id ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {successMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.8125rem', marginBottom: '18px' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">{cms('login.email_label', 'Email Address')}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your registered email address"
            />
          </div>

          <div className="form-group" style={{ marginBottom: role !== 'admin' ? '8px' : '20px' }}>
            <label className="form-label" htmlFor="password">{cms('login.password_label', 'Password')}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{ paddingRight: '44px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color 0.15s ease, background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-navy-950)';
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {showPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            </div>
          </div>

          {role !== 'admin' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <Link
                to={`/forgot-password?role=${role}`}
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Forgot Password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={loading}
            style={{ marginTop: role === 'admin' ? '8px' : '0' }}
          >
            {loading ? 'Authenticating with Backend...' : cms('login.submit_btn', 'Sign In')}
          </Button>
        </form>

        {role !== 'admin' && (
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {role === 'staff'
              ? cms('login.register_prompt_staff', 'New faculty or placement staff?')
              : role === 'hod'
              ? cms('login.register_prompt_hod', 'New Department HOD?')
              : cms('login.register_prompt', 'New student registering for campus placements?')}{' '}
            <Link
              to={
                role === 'staff'
                  ? '/register/staff'
                  : role === 'hod'
                  ? '/register/hod'
                  : '/register/student'
              }
              style={{ color: 'var(--color-primary)', fontWeight: 600 }}
            >
              {role === 'staff'
                ? 'Register as Staff'
                : role === 'hod'
                ? 'Register as HOD'
                : 'Register as a Student'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
