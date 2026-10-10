import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useCms } from '../../context/CmsContext';
import { EyeIcon, EyeOffIcon } from '../../components/common/Icons';
import { getServerAddress, setServerAddress, resetServerAddress, checkBackendHealth } from '../../services/api';

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

  // Mobile / Local network server connectivity state
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentServer, setCurrentServer] = useState(getServerAddress());
  const [customServerInput, setCustomServerInput] = useState(currentServer);
  const [serverTestStatus, setServerTestStatus] = useState(null);

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

        <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>Server: <code style={{ background: 'var(--color-bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem' }}>{currentServer}</code></span>
          <button
            type="button"
            onClick={() => { setCustomServerInput(currentServer); setServerTestStatus(null); setShowServerModal(true); }}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}
          >
            Config
          </button>
        </div>

        {showServerModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ background: 'var(--color-bg-surface, #fff)', color: 'var(--color-text-primary, #1e293b)', borderRadius: '12px', padding: '24px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Server Network Configuration</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
                For Android demonstration, enter your laptop's Wi-Fi / Hotspot IPv4 address. Both phone and laptop must be on the same local network.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>Backend API URL / Host IP</label>
                <input
                  type="text"
                  value={customServerInput}
                  onChange={(e) => { setCustomServerInput(e.target.value); setServerTestStatus(null); }}
                  placeholder="e.g. 192.168.1.15 or http://192.168.1.15:8080/api"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
                />
              </div>

              {serverTestStatus && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '16px', background: serverTestStatus === 'online' ? '#dcfce7' : serverTestStatus === 'testing' ? '#e0f2fe' : '#fee2e2', color: serverTestStatus === 'online' ? '#166534' : serverTestStatus === 'testing' ? '#0369a1' : '#991b1b' }}>
                  {serverTestStatus === 'testing' ? 'Testing connectivity to backend...' : serverTestStatus === 'online' ? '✅ Connection successful! Backend is online and responding.' : '❌ Unable to connect. Verify laptop IP and ensure backend is running.'}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={async () => {
                    setServerTestStatus('testing');
                    const target = customServerInput.startsWith('http') ? customServerInput : `http://${customServerInput}:8080/api`;
                    const ok = await checkBackendHealth(target);
                    setServerTestStatus(ok ? 'online' : 'offline');
                  }}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Test Connection
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetServerAddress();
                    const reset = getServerAddress();
                    setCurrentServer(reset);
                    setCustomServerInput(reset);
                    setServerTestStatus(null);
                    setShowServerModal(false);
                  }}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (customServerInput.trim()) {
                      setServerAddress(customServerInput);
                      setCurrentServer(getServerAddress());
                    }
                    setShowServerModal(false);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--color-primary, #2563eb)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
