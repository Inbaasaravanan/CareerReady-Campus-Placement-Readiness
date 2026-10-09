import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState } from '../../components/common/StateViews';

export const StaffProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(err?.message || 'Failed to load staff profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <LoadingState message="Loading staff profile from database..." />;
  if (error) return <ErrorState message={error} onRetry={fetchProfile} />;

  return (
    <div>
      <PageHeader
        title="Placement Staff Profile"
        subtitle="Your verified faculty credentials and institutional placement administration assignment."
      />

      <div className="card" style={{ maxWidth: '720px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 700
            }}
          >
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-navy-950)', marginBottom: '4px' }}>
              {profile?.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Badge variant="success">Placement Staff</Badge>
              <Badge variant={profile?.status === 'ACTIVE' || profile?.status === 'APPROVED' ? 'success' : 'warning'}>
                {profile?.status}
              </Badge>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', fontSize: '0.875rem' }}>
          <div>
            <span className="form-hint">Official Email</span>
            <div style={{ fontWeight: 600, marginTop: '4px', wordBreak: 'break-all' }}>{profile?.email}</div>
          </div>

          <div>
            <span className="form-hint">Academic Department</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{profile?.departmentName || profile?.department || 'Not Provided'}</div>
          </div>

          <div>
            <span className="form-hint">Employee ID</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{profile?.employeeId || 'Not provided'}</div>
          </div>

          <div>
            <span className="form-hint">Contact Phone</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{profile?.phone || 'Not provided'}</div>
          </div>

          <div>
            <span className="form-hint">Last Successful Login</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>
              {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : 'Never'}
            </div>
          </div>

          <div>
            <span className="form-hint">Account Created</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
