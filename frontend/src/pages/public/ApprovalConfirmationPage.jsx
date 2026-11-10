import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { authService } from '../../services/authService';
import { LoadingState } from '../../components/common/StateViews';

export const ApprovalConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [verificationData, setVerificationData] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  const [confirming, setConfirming] = useState(false);
  const [confirmedResult, setConfirmedResult] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!token || !token.trim()) {
      setVerifying(false);
      setVerifyError('No security token was found in the URL. Please use the complete link provided in the administrator email.');
      return;
    }

    const verify = async () => {
      try {
        setVerifying(true);
        setVerifyError('');
        const data = await authService.verifyStaffApprovalToken(token.trim());
        setVerificationData(data);
      } catch (err) {
        setVerifyError(err?.message || 'Unable to verify approval token.');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  const handleConfirm = async () => {
    if (!token || confirming) return;

    setConfirming(true);
    setActionError('');
    try {
      const res = await authService.confirmStaffApproval(token.trim());
      setConfirmedResult(res);
    } catch (err) {
      setActionError(err?.message || 'Failed to execute requested action. The token may be expired or already consumed.');
    } finally {
      setConfirming(false);
    }
  };

  const isApprove = verificationData?.action === 'APPROVE';
  const actionColor = isApprove ? '#059669' : '#DC2626';
  const actionBg = isApprove ? '#ECFDF5' : '#FEF2F2';
  const actionBorder = isApprove ? '#A7F3D0' : '#FECACA';

  const formatRegDate = (dateVal) => {
    if (!dateVal) return 'Not Available';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not Available';
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', backgroundColor: 'var(--color-bg-app)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Logo variant="light" />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginTop: '16px', color: 'var(--color-navy-950)' }}>
            Staff Registration Approval
          </h2>
          <p className="form-hint" style={{ marginTop: '4px' }}>
            CareerReady AI Placement Readiness Analytics System
          </p>
        </div>

        {/* 1. Loading State */}
        {verifying && (
          <div style={{ padding: '32px 0' }}>
            <LoadingState message="Verifying secure single-use approval token..." />
          </div>
        )}

        {/* 2. Verification URL / Network Error */}
        {!verifying && verifyError && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              margin: '0 auto 16px',
              border: '2px solid #FECACA'
            }}>
              &#10005;
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#991B1B', marginBottom: '8px' }}>
              Invalid or Expired Link
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
              {verifyError}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login">
                <Button variant="secondary">Go to Login</Button>
              </Link>
            </div>
          </div>
        )}

        {/* 3. Successful Confirmation Outcome */}
        {!verifying && confirmedResult && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: confirmedResult.action === 'APPROVE' ? '#ECFDF5' : '#FEF2F2',
              color: confirmedResult.action === 'APPROVE' ? '#059669' : '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 16px',
              border: `2px solid ${confirmedResult.action === 'APPROVE' ? '#A7F3D0' : '#FECACA'}`
            }}>
              {confirmedResult.action === 'APPROVE' ? '✓' : '✕'}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-950)', marginBottom: '8px' }}>
              {confirmedResult.action === 'APPROVE' ? 'Staff Account Approved' : 'Registration Request Rejected'}
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
              {confirmedResult.message || (confirmedResult.action === 'APPROVE'
                ? `Account for ${confirmedResult.applicantName} has been approved and is now active.`
                : `Registration for ${confirmedResult.applicantName} has been rejected.`)}
            </p>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Applicant:</span>
                <strong style={{ color: '#0F172A' }}>{confirmedResult.applicantName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748B' }}>Official Email:</span>
                <span style={{ color: '#2563EB' }}>{confirmedResult.applicantEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Updated Status:</span>
                <span style={{
                  fontWeight: 700,
                  color: confirmedResult.newStatus === 'APPROVED' ? '#059669' : '#DC2626'
                }}>
                  {confirmedResult.newStatus}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login">
                <Button variant="primary">Go to Login</Button>
              </Link>
            </div>
          </div>
        )}

        {/* 4. Token Invalid / Already Used / Expired / Already Processed */}
        {!verifying && !confirmedResult && verificationData && !verificationData.valid && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '26px',
              margin: '0 auto 16px',
              border: '2px solid #FDE68A'
            }}>
              &#9888;
            </div>

            <div style={{ display: 'inline-block', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '9999px', textTransform: 'uppercase', marginBottom: '12px', border: '1px solid #FDE68A' }}>
              {verificationData.status || 'NOTICE'}
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-navy-950)', marginBottom: '8px' }}>
              Action Cannot Be Performed
            </h3>

            <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              {verificationData.message}
            </p>

            {verificationData.applicantName && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Applicant:</span>
                  <strong style={{ color: '#0F172A' }}>{verificationData.applicantName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#64748B' }}>Email:</span>
                  <span>{verificationData.applicantEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Current Status:</span>
                  <strong style={{ color: verificationData.currentAccountStatus === 'APPROVED' ? '#059669' : '#B45309' }}>
                    {verificationData.currentAccountStatus}
                  </strong>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/login">
                <Button variant="secondary">Go to Login</Button>
              </Link>
            </div>
          </div>
        )}

        {/* 5. Valid Token Ready for Confirmation */}
        {!verifying && !confirmedResult && verificationData && verificationData.valid && (
          <div>
            {/* Action Banner */}
            <div style={{
              backgroundColor: actionBg,
              border: `1px solid ${actionBorder}`,
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: actionColor,
                color: '#ffffff',
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}>
                {isApprove ? '✓ APPROVE STAFF' : '✕ REJECT REGISTRATION'}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: actionColor, margin: '4px 0 8px' }}>
                {isApprove ? 'Confirm Account Activation' : 'Confirm Registration Rejection'}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {isApprove
                  ? 'Confirming will activate this staff account, grant access to placement management features, and send an approval confirmation email to the applicant.'
                  : 'Confirming will reject this registration request and prevent account login. The registration record will be preserved for administrative audit.'}
              </p>
            </div>

            {/* Applicant Details Table */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '18px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748B', fontWeight: 700 }}>
                Applicant Details
              </h4>
              <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse', lineHeight: 2 }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#64748B', width: '130px', fontWeight: 600 }}>Full Name:</td>
                    <td><strong style={{ color: '#0F172A' }}>{verificationData.applicantName}</strong></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Official Email:</td>
                    <td><span style={{ color: '#2563EB' }}>{verificationData.applicantEmail}</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Requested Role:</td>
                    <td><span style={{ background: '#EFF6FF', color: '#1E40AF', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>Placement Staff</span></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Employee ID:</td>
                    <td><code style={{ background: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: '#0F172A' }}>{verificationData.employeeId}</code></td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Department:</td>
                    <td>{verificationData.departmentName}</td>
                  </tr>
                  {verificationData.phone && (
                    <tr>
                      <td style={{ color: '#64748B', fontWeight: 600 }}>Contact Phone:</td>
                      <td>{verificationData.phone}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Registration Date:</td>
                    <td>{formatRegDate(verificationData.registeredAt)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#64748B', fontWeight: 600 }}>Current Status:</td>
                    <td>
                      <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.6875rem' }}>
                        PENDING APPROVAL
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Error Message if Action Fails */}
            {actionError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#991B1B',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.8125rem',
                marginBottom: '16px'
              }}>
                {actionError}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '20px' }}>
              <Button
                type="button"
                variant={isApprove ? 'success' : 'danger'}
                onClick={handleConfirm}
                disabled={confirming}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  backgroundColor: isApprove ? '#059669' : '#DC2626',
                  borderColor: isApprove ? '#059669' : '#DC2626',
                  color: '#ffffff'
                }}
              >
                {confirming
                  ? (isApprove ? 'Processing Approval...' : 'Processing Rejection...')
                  : (isApprove ? '✓ Confirm & Approve Staff Account' : '✕ Confirm & Reject Registration')}
              </Button>
            </div>

            {/* Cancellation / Admin Console link */}
            <p style={{ margin: '16px 0 0', fontSize: '0.75rem', textAlign: 'center', color: '#94A3B8' }}>
              Single-use security token bound to this request &bull; <Link to="/login" style={{ color: '#64748B' }}>Cancel</Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
