import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/StateViews';

export const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await adminService.getSettings();
        setSettings(s);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await adminService.updateSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (loading || !settings) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="System Settings & Analytics Configuration"
        subtitle="Manage institutional parameters, analytical thresholds, and automated alert preferences."
      />

      {saveSuccess && (
        <div className="badge-highly-ready" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          System preferences and analytics cutoffs saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 1. General Settings */}
        <section className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">1. General Institutional Settings</h3>
            <p className="form-section-desc">University identity and active placement season</p>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="inst-name">Institution Name</label>
              <input
                id="inst-name"
                type="text"
                className="input-control"
                value={settings.general.institutionName}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, institutionName: e.target.value } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="academic-yr">Academic Year</label>
              <input
                id="academic-yr"
                type="text"
                className="input-control"
                value={settings.general.academicYear}
                onChange={(e) => setSettings({ ...settings, general: { ...settings.general, academicYear: e.target.value } })}
              />
            </div>
          </div>
        </section>

        {/* 2. Analytics & Readiness Thresholds */}
        <section className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">2. Analytics Cutoffs & Categorization Thresholds</h3>
            <p className="form-section-desc">Minimum score boundaries for candidate readiness tiers</p>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="thresh-high">Highly Ready Threshold (%)</label>
              <input
                id="thresh-high"
                type="number"
                className="input-control"
                value={settings.thresholds.highlyReadyThreshold}
                onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, highlyReadyThreshold: parseInt(e.target.value, 10) } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="thresh-ready">Ready Cutoff (%)</label>
              <input
                id="thresh-ready"
                type="number"
                className="input-control"
                value={settings.thresholds.readyThreshold}
                onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, readyThreshold: parseInt(e.target.value, 10) } })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="thresh-at-risk">At-Risk Boundary (&lt; %)</label>
              <input
                id="thresh-at-risk"
                type="number"
                className="input-control"
                value={settings.thresholds.needsImprovementThreshold}
                onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, needsImprovementThreshold: parseInt(e.target.value, 10) } })}
              />
            </div>
          </div>
        </section>

        {/* 3. Notification Settings */}
        <section className="form-section">
          <div className="form-section-header">
            <h3 className="form-section-title">3. Notification & Alert Settings</h3>
            <p className="form-section-desc">Automated emails and diagnostic alerts</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={settings.notifications.emailAlertsAtRisk}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, emailAlertsAtRisk: e.target.checked } })}
              />
              Send immediate alert to Department Placement Coordinator when a student is classified as At-Risk
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={settings.notifications.weeklyHODDigest}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, weeklyHODDigest: e.target.checked } })}
              />
              Deliver weekly executive readiness digest to Placement HOD
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={settings.notifications.studentScoreAlerts}
                onChange={(e) => setSettings({ ...settings, notifications: { ...settings.notifications, studentScoreAlerts: e.target.checked } })}
              />
              Notify students automatically upon evaluation score updates
            </label>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <Button type="submit" variant="primary" size="lg">
            Save System Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
