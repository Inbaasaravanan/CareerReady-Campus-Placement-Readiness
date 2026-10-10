import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: 'Corporate Placement Partner',
    requiredCgpa: '7.0',
    minimumAptitudeScore: '60',
    minimumTechnicalScore: '65',
    active: true
  });

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getCompanies();
      setCompanies(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createCompany({
        name: newCompany.name,
        description: newCompany.description,
        requiredCgpa: parseFloat(newCompany.requiredCgpa) || 7.0,
        minimumAptitudeScore: parseInt(newCompany.minimumAptitudeScore, 10) || 60,
        minimumTechnicalScore: parseInt(newCompany.minimumTechnicalScore, 10) || 65,
        active: newCompany.active
      });
      setIsAddModalOpen(false);
      setNewCompany({
        name: '',
        description: 'Corporate Placement Partner',
        requiredCgpa: '7.0',
        minimumAptitudeScore: '60',
        minimumTechnicalScore: '65',
        active: true
      });
      // Real-time refresh from MySQL database
      await fetchCompanies();
    } catch (err) {
      alert(`Failed to save company: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from MySQL database? This action cannot be undone.`)) return;
    setFeedback(null);
    try {
      await adminService.deleteCompany(id);
      setFeedback({ type: 'success', text: `Company "${name}" was deleted successfully.` });
      await fetchCompanies();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Delete failed.' });
    }
  };

  if (loading) return <LoadingState message="Loading companies from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Companies"
        description={error}
        onRetry={fetchCompanies}
      />
    );
  }

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      sortable: true,
      render: (val) => <span>#{val}</span>
    },
    {
      header: 'Company Name',
      accessor: 'name',
      sortable: true,
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Required CGPA',
      accessor: 'requiredCgpa',
      sortable: true,
      render: (val) => <strong>&ge; {val}</strong>
    },
    {
      header: 'Min Aptitude Score',
      accessor: 'minimumAptitudeScore',
      sortable: true,
      render: (val) => <span>{val || 60}%</span>
    },
    {
      header: 'Min Technical Score',
      accessor: 'minimumTechnicalScore',
      sortable: true,
      render: (val) => <span>{val || 60}%</span>
    },
    {
      header: 'Status',
      accessor: 'active',
      sortable: true,
      render: (val) => <Badge status={val !== false ? 'Ready' : 'Needs Improvement'}>{val !== false ? 'Active' : 'Inactive'}</Badge>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteCompany(val, row.name)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Recruiting Companies Registry"
        subtitle="Manage recruitment partnerships, minimum academic cutoffs, and hiring criteria directly in MySQL."
        actions={
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add New Recruiter
          </Button>
        }
      />

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: feedback.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${feedback.type === 'error' ? '#fca5a5' : '#86efac'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              color: 'inherit',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      )}


      {companies.length === 0 ? (
        <EmptyState
          title="No companies registered in database."
          description="Click 'Add New Recruiter' above to register your first corporate partner."
          actionLabel="Add Recruiter"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={companies}
            pageSize={10}
            searchPlaceholder="Search recruiters by name..."
          />
        </div>
      )}

      {/* Add Company Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Recruiting Company"
      >
        <form onSubmit={handleAddCompany}>
          <div className="form-group">
            <label className="form-label" htmlFor="comp-name">Company Name</label>
            <input
              id="comp-name"
              type="text"
              className="input-control"
              placeholder="e.g. Oracle Financial Services"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="comp-desc">Description</label>
            <input
              id="comp-desc"
              type="text"
              className="input-control"
              placeholder="e.g. Enterprise Cloud & Database Systems"
              value={newCompany.description}
              onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="comp-cgpa">Min CGPA</label>
              <input
                id="comp-cgpa"
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="input-control"
                value={newCompany.requiredCgpa}
                onChange={(e) => setNewCompany({ ...newCompany, requiredCgpa: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-apt">Min Aptitude %</label>
              <input
                id="comp-apt"
                type="number"
                min="0"
                max="100"
                className="input-control"
                value={newCompany.minimumAptitudeScore}
                onChange={(e) => setNewCompany({ ...newCompany, minimumAptitudeScore: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="comp-tech">Min Tech %</label>
              <input
                id="comp-tech"
                type="number"
                min="0"
                max="100"
                className="input-control"
                value={newCompany.minimumTechnicalScore}
                onChange={(e) => setNewCompany({ ...newCompany, minimumTechnicalScore: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving to MySQL...' : 'Save Recruiter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
