import React, { useState, useEffect } from 'react';
import { cmsService } from '../../../services/cmsService';
import { Button } from '../../../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../../../components/common/StateViews';
import { SparklesIcon, CheckIcon, AlertTriangleIcon } from '../../../components/common/Icons';

export const AdminMediaLibrary = () => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [altText, setAltText] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const loadMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cmsService.adminGetMedia();
      setMediaList(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await cmsService.adminUploadMedia(selectedFile, altText);
      setSelectedFile(null);
      setAltText('');
      setSuccessMsg('Media uploaded successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadMedia();
    } catch (err) {
      setError(err?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this media item? Any CMS pages using this URL will lose this asset.')) {
      return;
    }

    try {
      await cmsService.adminDeleteMedia(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      setSuccessMsg('Media deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to delete media');
    }
  };

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div>
      {/* Upload Zone Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-950)', margin: '0 0 6px 0' }}>
          Media & Asset Library
        </h2>
        <p className="form-hint" style={{ marginBottom: '20px' }}>
          Upload institutional logos, banner images, and illustrative graphics for use throughout CMS pages. Max size 10MB.
        </p>

        {successMsg && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.875rem' }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Choose Image File</label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif"
                onChange={handleFileSelect}
                className="form-input"
                style={{ padding: '7px 12px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Alt Text / Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. University Placement Cell Logo"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="form-input"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={uploading || !selectedFile}
              icon={SparklesIcon}
            >
              {uploading ? 'Uploading...' : 'Upload Asset'}
            </Button>
          </div>
        </form>
      </div>

      {/* Gallery Section */}
      <div className="card">
        <div className="section-title-bar" style={{ marginBottom: '16px' }}>
          <div>
            <h3 className="section-heading-sm">Uploaded Assets ({mediaList.length})</h3>
            <p className="form-hint">Click "Copy URL" to reference any asset in CMS content fields</p>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading assets from MySQL media database..." />
        ) : mediaList.length === 0 ? (
          <EmptyState
            title="No media uploaded yet."
            description="Use the upload tool above to add your first institution logo or illustration."
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {mediaList.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'var(--color-bg-card)'
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: '140px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <img
                    src={item.fileUrl}
                    alt={item.altText || item.fileName}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Details */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-navy-950)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.fileName}>
                    {item.fileName}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    {formatFileSize(item.fileSize)} &bull; {item.mediaType}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.fileUrl, item.id)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: copiedId === item.id ? '#ECFDF5' : 'var(--color-bg-subtle)',
                        color: copiedId === item.id ? '#047857' : 'var(--color-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedId === item.id ? 'Copied!' : 'Copy URL'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#FEF2F2',
                        color: '#B91C1C',
                        border: '1px solid #FECACA',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer'
                      }}
                      title="Delete asset"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
