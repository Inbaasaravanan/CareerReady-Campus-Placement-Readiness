import React, { useState, useEffect } from 'react';
import { cmsService } from '../../../services/cmsService';
import { useCms } from '../../../context/CmsContext';
import { Button } from '../../../components/common/Button';
import { LoadingState, ErrorState } from '../../../components/common/StateViews';
import { CheckIcon } from '../../../components/common/Icons';

export const AdminGlobalSettings = () => {
  const { refreshCms } = useCms();
  const [settings, setSettings] = useState({
    'app.name': 'CareerReady AI',
    'app.tagline': 'Enterprise Placement Readiness & Competency Diagnostic Platform',
    'app.logo': '',
    'app.support_email': 'placement@careerready.ai',
    'app.footer_text': 'CareerReady AI Placement Management System. Empowering students, mentors, and corporate recruiters through verifiable performance metrics.',
    'app.copyright': '© 2026 CareerReady AI. All rights reserved.',
    'app.website_url': 'https://careerready.ai'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmsService.getGlobalSettings();
      if (data && Object.keys(data).length > 0) {
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      setError(err?.message || 'Failed to load global settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      await cmsService.adminUpdateSettings(settings);
      await refreshCms();
      setSuccessMsg('Global settings saved successfully! New branding and metadata are active.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save global settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading global application settings from MySQL..." />;
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-950)', margin: 0 }}>
              Global Branding & System Settings
            </h2>
            <p className="form-hint" style={{ marginTop: '4px' }}>
              Configure institutional branding, application names, support channels, and footer declarations.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
            icon={CheckIcon}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {successMsg && (
          <div style={{ marginBottom: '20px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon width={16} height={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '20px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Application Name</label>
              <input
                type="text"
                className="form-input"
                value={settings['app.name'] || ''}
                onChange={(e) => handleChange('app.name', e.target.value)}
                placeholder="e.g. CareerReady AI"
                required
              />
              <span className="form-hint">Displayed in the browser title bar, top navigation, and brand headers.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Platform Tagline</label>
              <input
                type="text"
                className="form-input"
                value={settings['app.tagline'] || ''}
                onChange={(e) => handleChange('app.tagline', e.target.value)}
                placeholder="e.g. Enterprise Placement Readiness & Competency Diagnostic Platform"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Custom Logo Image URL</label>
              <input
                type="text"
                className="form-input"
                value={settings['app.logo'] || ''}
                onChange={(e) => handleChange('app.logo', e.target.value)}
                placeholder="e.g. /uploads/cms/logo.png or https://your-college.edu/logo.png"
              />
              <span className="form-hint">Leave blank to use default SVG mark, or copy a URL from the Images & Media Library.</span>
            </div>

            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Placement Support Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings['app.support_email'] || ''}
                  onChange={(e) => handleChange('app.support_email', e.target.value)}
                  placeholder="e.g. placement@college.edu"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Institution Website URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={settings['app.website_url'] || ''}
                  onChange={(e) => handleChange('app.website_url', e.target.value)}
                  placeholder="e.g. https://college.edu"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Footer Description Text</label>
              <textarea
                className="form-input"
                rows={3}
                value={settings['app.footer_text'] || ''}
                onChange={(e) => handleChange('app.footer_text', e.target.value)}
                placeholder="Enter footer informative text..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Copyright Notice</label>
              <input
                type="text"
                className="form-input"
                value={settings['app.copyright'] || ''}
                onChange={(e) => handleChange('app.copyright', e.target.value)}
                placeholder="e.g. © 2026 CareerReady AI. All rights reserved."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                icon={CheckIcon}
              >
                {saving ? 'Saving...' : 'Save Global Settings'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
