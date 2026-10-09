import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const AdminSkills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'Programming',
    description: '',
    active: true
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getSkills();
      setSkills(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createSkill(newSkill);
      setIsAddModalOpen(false);
      setNewSkill({ name: '', category: 'Programming', description: '', active: true });
      await load();
    } catch (err) {
      alert(`Failed to create skill: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (id, name) => {
    if (!window.confirm(`Delete ${name} from MySQL skill registry?`)) return;
    try {
      await adminService.deleteSkill(id);
      await load();
    } catch (err) {
      alert(`Delete failed: ${err?.message || err}`);
    }
  };

  if (loading) return <LoadingState message="Loading skills from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Skills"
        description={error}
        onRetry={load}
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
      header: 'Skill Name',
      accessor: 'name',
      sortable: true,
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (val) => <Badge variant="primary">{val}</Badge>
    },
    {
      header: 'Description',
      accessor: 'description',
      sortable: false
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
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteSkill(val, row.name)}
        >
          Delete
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Skills Taxonomy Management"
        subtitle="Manage master technical, aptitude, and behavioral skills tracked across company recruitment benchmarks."
        actions={
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add New Skill
          </Button>
        }
      />

      {skills.length === 0 ? (
        <EmptyState
          title="No skills registered."
          description="There are currently no skills in the database registry."
          actionLabel="Add Skill"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={skills}
            searchPlaceholder="Search skill name, category..."
            defaultPageSize={10}
          />
        </div>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Skill"
      >
        <form onSubmit={handleAddSkill}>
          <div className="form-group">
            <label className="form-label" htmlFor="skill-name">Skill Name</label>
            <input
              id="skill-name"
              type="text"
              className="input-control"
              placeholder="e.g. Kubernetes"
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skill-cat">Category</label>
            <select
              id="skill-cat"
              className="input-control"
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
            >
              <option value="Programming">Programming</option>
              <option value="Database">Database</option>
              <option value="Core CS">Core CS</option>
              <option value="Web Development">Web Development</option>
              <option value="Backend Development">Backend Development</option>
              <option value="DevOps & Cloud">DevOps & Cloud</option>
              <option value="Soft Skills">Soft Skills</option>
              <option value="Aptitude">Aptitude</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="skill-desc">Description</label>
            <textarea
              id="skill-desc"
              className="input-control"
              rows={3}
              placeholder="Core topics and competencies included..."
              value={newSkill.description}
              onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving to MySQL...' : 'Save Skill'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
