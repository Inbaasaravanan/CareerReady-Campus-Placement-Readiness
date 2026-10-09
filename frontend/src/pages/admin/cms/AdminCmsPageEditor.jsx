import React, { useState, useEffect } from 'react';
import { cmsService } from '../../../services/cmsService';
import { useCms } from '../../../context/CmsContext';
import { Button } from '../../../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../../../components/common/StateViews';
import { CheckIcon, SparklesIcon } from '../../../components/common/Icons';

export const AdminCmsPageEditor = ({ pageKey, pageTitle, pageDescription }) => {
  const { refreshCms } = useCms();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadPageContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmsService.adminGetPageContent(pageKey);
      setItems(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load CMS content for page: ' + pageKey);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageContent();
  }, [pageKey]);

  const handleFieldChange = (id, newVal) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, contentValue: newVal } : item))
    );
    setSuccessMsg('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      await cmsService.adminSaveBatch(items);
      await refreshCms();
      setSuccessMsg('CMS Content saved successfully! All updates are now active.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Failed to save CMS content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message={`Loading ${pageTitle || pageKey} content from MySQL database...`} />;
  }

  if (error && items.length === 0) {
    return <ErrorState title="Failed to Load CMS Page" description={error} onRetry={loadPageContent} />;
  }

  // Group items by section
  const sections = {};
  items.forEach((item) => {
    const sec = item.section || 'GENERAL';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-950)', margin: 0 }}>
              {pageTitle || `${pageKey} Content Editor`}
            </h2>
            <p className="form-hint" style={{ marginTop: '4px' }}>
              {pageDescription || 'Edit presentation text and elements. Calculated business and evaluation data remain untouched.'}
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={CheckIcon}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {successMsg && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckIcon width={16} height={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No CMS items configured for this page."
          description="Click reload or verify seed data in MySQL database."
          onAction={loadPageContent}
          actionLabel="Reload Content"
        />
      ) : (
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Object.entries(sections).map(([sectionName, sectionItems]) => (
              <div key={sectionName} className="card">
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)' }}>
                    Section
                  </span>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-navy-950)', margin: '2px 0 0 0' }}>
                    {sectionName}
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sectionItems.map((item) => (
                    <div key={item.id} className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <label className="form-label" style={{ fontWeight: 600, color: 'var(--color-navy-950)', marginBottom: 0 }}>
                          {item.description || item.contentKey}
                        </label>
                        <code style={{ fontSize: '0.6875rem', backgroundColor: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-text-muted)' }}>
                          {item.contentKey}
                        </code>
                      </div>

                      {item.contentType === 'RICH_TEXT' ? (
                        <textarea
                          className="form-input"
                          rows={4}
                          value={item.contentValue || ''}
                          onChange={(e) => handleFieldChange(item.id, e.target.value)}
                          placeholder="Enter rich text or HTML description..."
                          style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: '0.875rem' }}
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={item.contentValue || ''}
                          onChange={(e) => handleFieldChange(item.id, e.target.value)}
                          placeholder={`Enter value for ${item.contentKey}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                icon={CheckIcon}
              >
                {saving ? 'Saving...' : 'Save All Changes'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
