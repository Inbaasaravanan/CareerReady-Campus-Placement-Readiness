import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/StateViews';
import { SearchIcon } from '../../components/common/Icons';

export const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Question editing state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    assessmentType: 'APTITUDE',
    topic: '',
    difficultyLevel: 'MEDIUM'
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getQuestions();
      setQuestions(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load assessment questions from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic || q.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const s = search.trim().toLowerCase();
      const questionContent = (q.questionText || q.text || '').toLowerCase();
      const categoryContent = (q.topic || q.category || '').toLowerCase();
      const matchesSearch = !s || questionContent.includes(s) || categoryContent.includes(s);

      const qCat = q.topic || q.category || 'General';
      const matchesCat = selectedCategory === 'All' || qCat === selectedCategory;

      const qType = String(q.assessmentType || q.type || '').toUpperCase();
      const targetType = selectedType.toUpperCase();
      const matchesType = selectedType === 'All' || qType === targetType;

      return matchesSearch && matchesCat && matchesType;
    });
  }, [questions, search, selectedCategory, selectedType]);

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    setEditFormData({
      questionText: q.questionText || q.text || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctAnswer: q.correctAnswer || 'A',
      assessmentType: String(q.assessmentType || q.type || 'APTITUDE').toUpperCase(),
      topic: q.topic || q.category || '',
      difficultyLevel: String(q.difficultyLevel || q.difficulty || 'MEDIUM').toUpperCase()
    });
    setSaveErrorMsg('');
  };

  const handleCloseEditModal = () => {
    setEditingQuestion(null);
    setSaveErrorMsg('');
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuestion) return;
    setSavingEdit(true);
    setSaveErrorMsg('');

    try {
      await adminService.updateQuestion(editingQuestion.id, editFormData);

      // Immediately update local state so table and category dropdown reflect changes
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? {
                ...q,
                ...editFormData,
                text: editFormData.questionText,
                category: editFormData.topic,
                type: editFormData.assessmentType,
                difficulty: editFormData.difficultyLevel
              }
            : q
        )
      );

      setSaveSuccessMsg(`Question #${editingQuestion.id} updated successfully in database!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      handleCloseEditModal();
    } catch (err) {
      setSaveErrorMsg(err?.message || 'Failed to update question in database.');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingState message="Loading Assessment Question Bank from MySQL..." />;
  if (error) return <ErrorState message={error} onRetry={fetchQuestions} />;

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      sortable: true,
      render: (val) => <span className="table-cell-mono">#{val}</span>
    },
    {
      header: 'Question Text',
      accessor: 'questionText',
      sortable: true,
      render: (val, row) => (
        <span className="table-cell-bold" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {val || row?.text || ''}
        </span>
      )
    },
    {
      header: 'Type',
      accessor: 'assessmentType',
      sortable: true,
      render: (val, row) => {
        const typeVal = val || row?.type || '';
        const isTechnical = String(typeVal).toUpperCase() === 'TECHNICAL';
        const displayVal = isTechnical ? 'Technical' : 'Aptitude';
        return (
          <Badge variant={isTechnical ? 'primary' : 'info'}>
            {displayVal}
          </Badge>
        );
      }
    },
    {
      header: 'Category',
      accessor: 'topic',
      sortable: true,
      render: (val, row) => val || row?.category || 'General'
    },
    {
      header: 'Difficulty',
      accessor: 'difficultyLevel',
      sortable: true,
      render: (val, row) => {
        const diffVal = String(val || row?.difficulty || 'MEDIUM').toUpperCase();
        const displayLabel = diffVal === 'HARD' ? 'Hard' : diffVal === 'EASY' ? 'Easy' : 'Medium';
        return (
          <Badge variant={diffVal === 'HARD' ? 'danger' : diffVal === 'MEDIUM' ? 'warning' : 'success'}>
            {displayLabel}
          </Badge>
        );
      }
    },
    {
      header: 'Correct Answer',
      accessor: 'correctAnswer',
      render: (val) => <span className="table-cell-mono" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{val}</span>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => (
        <button
          type="button"
          onClick={() => handleOpenEditModal(row)}
          style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid var(--color-primary)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#EEF2FF';
            e.currentTarget.style.color = 'var(--color-primary)';
          }}
        >
          Edit
        </button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Assessment Question Bank"
        subtitle="Repository of aptitude, core technical, and domain-specific multiple choice questions evaluated by the scoring engine."
      />

      {saveSuccessMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#047857', fontSize: '0.8125rem', marginBottom: '16px' }}>
          {saveSuccessMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <SearchIcon
            width={16}
            height={16}
            style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search questions or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-control"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Type:</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="select-control"
            style={{ height: '40px', width: 'auto' }}
          >
            <option value="All">All Types</option>
            <option value="APTITUDE">Aptitude</option>
            <option value="TECHNICAL">Technical</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="select-control"
            style={{ height: '40px', width: 'auto' }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <EmptyState
          title="No Questions Found"
          message={search || selectedCategory !== 'All' || selectedType !== 'All' ? 'No questions matched your search criteria.' : 'No assessment questions found in MySQL database.'}
        />
      ) : (
        <DataTable columns={columns} data={filteredQuestions} pageSize={10} />
      )}

      {/* Edit Question Modal */}
      <Modal
        isOpen={!!editingQuestion}
        onClose={handleCloseEditModal}
        title={`Edit Question #${editingQuestion?.id}`}
      >
        {saveErrorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '14px' }}>
            {saveErrorMsg}
          </div>
        )}

        <form onSubmit={handleSaveQuestion}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="edit-q-text">
              Question Text <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              id="edit-q-text"
              rows={3}
              className="input-control"
              value={editFormData.questionText}
              onChange={(e) => setEditFormData({ ...editFormData, questionText: e.target.value })}
              required
              placeholder="Enter question statement..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-opt-a">Option A</label>
              <input
                id="edit-opt-a"
                type="text"
                className="input-control"
                value={editFormData.optionA}
                onChange={(e) => setEditFormData({ ...editFormData, optionA: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-opt-b">Option B</label>
              <input
                id="edit-opt-b"
                type="text"
                className="input-control"
                value={editFormData.optionB}
                onChange={(e) => setEditFormData({ ...editFormData, optionB: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-opt-c">Option C</label>
              <input
                id="edit-opt-c"
                type="text"
                className="input-control"
                value={editFormData.optionC}
                onChange={(e) => setEditFormData({ ...editFormData, optionC: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-opt-d">Option D</label>
              <input
                id="edit-opt-d"
                type="text"
                className="input-control"
                value={editFormData.optionD}
                onChange={(e) => setEditFormData({ ...editFormData, optionD: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-ans">Correct Answer</label>
              <select
                id="edit-ans"
                className="select-control"
                value={editFormData.correctAnswer}
                onChange={(e) => setEditFormData({ ...editFormData, correctAnswer: e.target.value })}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-type">Type</label>
              <select
                id="edit-type"
                className="select-control"
                value={editFormData.assessmentType}
                onChange={(e) => setEditFormData({ ...editFormData, assessmentType: e.target.value })}
              >
                <option value="APTITUDE">Aptitude</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-diff">Difficulty</label>
              <select
                id="edit-diff"
                className="select-control"
                value={editFormData.difficultyLevel}
                onChange={(e) => setEditFormData({ ...editFormData, difficultyLevel: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-topic">Category</label>
              <input
                id="edit-topic"
                type="text"
                className="input-control"
                value={editFormData.topic}
                onChange={(e) => setEditFormData({ ...editFormData, topic: e.target.value })}
                required
                placeholder="e.g. Data Structures"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
            <Button type="button" variant="outline" onClick={handleCloseEditModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={savingEdit}>
              {savingEdit ? 'Saving to Database...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

