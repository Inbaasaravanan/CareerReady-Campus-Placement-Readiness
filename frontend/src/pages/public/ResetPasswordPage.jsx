import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';
import { EyeIcon, EyeOffIcon } from '../../components/common/Icons';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token || !token.trim()) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('Password reset link is invalid or expired.');
      return;
    }

    const checkToken = async () => {
      try {
        setVerifying(true);
        await authService.verifyResetToken(token.trim());
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setTokenError(err?.message || 'Password reset link is invalid or expired.');
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newPassword || newPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(token.trim(), newPassword, confirmPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful! Please sign in with your new password.' }
        });
      }, 2500);
    } catch (err) {
      setFormError(err?.message || 'Failed to reset password. Please check your reset link or try again.');
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
            Set New Password
          </h2>
          <p className="form-hint" style={{ marginTop: '4px' }}>
            Choose a secure new password for your account
          </p>
        </div>

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '36px',
              height: '36px',
              border: '3px solid var(--color-border)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              margin: '0 auto 16px auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Verifying your reset link...
            </p>
          </div>
        ) : !tokenValid ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: '#DC2626',
              fontSize: '26px'
            }}>
              ✕
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991B1B', marginBottom: '8px' }}>
              Invalid or Expired Link
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
              {tokenError || 'Password reset link is invalid or expired.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/forgot-password')}
              >
                Request New Reset Link
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/login')}
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
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
              Password Reset Complete!
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              Your password has been securely updated in MySQL. You can now use your new password to sign in.
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '20px' }}>
              Redirecting to Sign In...
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/login', {
                state: { message: 'Password reset successful! Please sign in with your new password.' }
              })}
            >
              Sign In Now
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '18px' }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter your new password"
                  style={{ paddingRight: '44px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
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
                  {showNewPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
                </button>
              </div>
              <span className="form-hint" style={{ marginTop: '4px', display: 'block' }}>
                Must be at least 6 characters long.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  style={{ paddingRight: '44px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                  {showConfirmPassword ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
                </button>
              </div>
              {newPassword && confirmPassword && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    display: 'block',
                    color: newPassword === confirmPassword ? '#059669' : '#DC2626'
                  }}
                >
                  {newPassword === confirmPassword ? '✓ Passwords match' : '✕ Passwords do not match'}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              style={{ marginTop: '16px' }}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Cancel and return to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
