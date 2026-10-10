import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';

const ROLE_OPTIONS = [
  { id: 'student', label: 'Student', apiRole: 'STUDENT' },
  { id: 'staff', label: 'Staff', apiRole: 'STAFF' },
  { id: 'hod', label: 'HOD', apiRole: 'HOD' }
];

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = searchParams.get('role');
  const validRole = ROLE_OPTIONS.some((r) => r.id === initialRole) ? initialRole : 'student';

  const [role, setRole] = useState(validRole);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    const r = searchParams.get('role');
    if (r && ROLE_OPTIONS.some((item) => item.id === r)) {
      setRole(r);
    }
  }, [searchParams]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    const currentRoleObj = ROLE_OPTIONS.find((r) => r.id === role) || ROLE_OPTIONS[0];

    try {
      setLoading(true);
      await authService.forgotPassword(email.trim(), currentRoleObj.apiRole);
      setSubmittedEmail(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Failed to process password reset request. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', backgroundColor: 'var(--color-bg-app)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Logo variant="light" />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '16px', color: 'var(--color-navy-950)' }}>
            Forgot Password
          </h2>
          <p className="form-hint" style={{ marginTop: '4px' }}>
            Enter your registered email address
          </p>
        </div>

        {/* Role Quick Selector Tabs */}
        <div className="forgot-role-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '24px', backgroundColor: 'var(--color-bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {ROLE_OPTIONS.map((item) => (
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

        {success ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#ECFDF5',
              border: '2px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: '#059669',
              fontSize: '28px'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-navy-950)', marginBottom: '8px' }}>
              Reset Link Sent!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              We've dispatched a secure single-use password reset link to{' '}
              <strong style={{ color: 'var(--color-navy-900)' }}>{submittedEmail}</strong> for the <strong>{role.toUpperCase()}</strong> account.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              The link will expire in 30 minutes. Please check your inbox (and spam folder).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
              >
                Send Another Link
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '18px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              style={{ marginTop: '16px' }}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
