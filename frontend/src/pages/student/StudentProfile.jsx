import React, { useEffect, useState } from 'react';
import { studentService } from '../../services/studentService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState } from '../../components/common/StateViews';
import api from '../../services/api';

const DEFAULT_AVAILABLE_SKILLS = [
  { id: 1, name: 'Java' },
  { id: 2, name: 'Python' },
  { id: 3, name: 'SQL' },
  { id: 4, name: 'DBMS' },
  { id: 5, name: 'Data Structures' },
  { id: 6, name: 'JavaScript' },
  { id: 7, name: 'React' },
  { id: 8, name: 'Spring Boot' },
  { id: 9, name: 'HTML & CSS' },
  { id: 10, name: 'Communication' },
  { id: 11, name: 'Problem Solving' },
  { id: 12, name: 'Computer Networks' }
];

export const StudentProfile = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [editCgpa, setEditCgpa] = useState('');
  const [editBacklogs, setEditBacklogs] = useState('');
  const [editSemesterMarks, setEditSemesterMarks] = useState({});
  const [editSkills, setEditSkills] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getProfile();
      setData(res);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api.get('/skills')
      .then((res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setAvailableSkills(res.data.data);
        } else {
          setAvailableSkills(DEFAULT_AVAILABLE_SKILLS);
        }
      })
      .catch(() => setAvailableSkills(DEFAULT_AVAILABLE_SKILLS));
  }, []);

  const openEditModal = () => {
    if (!data) return;
    setEditCgpa(data.cgpa !== undefined && data.cgpa !== null ? String(data.cgpa) : '');
    setEditBacklogs(data.backlogs !== undefined && data.backlogs !== null ? String(data.backlogs) : '');

    // Map semester marks
    const smMap = {};
    if (Array.isArray(data.semesterMarks)) {
      data.semesterMarks.forEach((sm) => {
        smMap[sm.semester] = sm.marks;
      });
    }
    setEditSemesterMarks(smMap);

    // Map skills
    const skMap = {};
    if (Array.isArray(data.skills)) {
      data.skills.forEach((sk) => {
        if (sk.skillId) {
          skMap[sk.skillId] = sk.rawLevel || (sk.level ? sk.level.toUpperCase() : 'INTERMEDIATE');
        } else {
          const match = availableSkills.find((as) => as.name.toLowerCase() === sk.name.toLowerCase());
          if (match) {
            skMap[match.id] = sk.rawLevel || (sk.level ? sk.level.toUpperCase() : 'INTERMEDIATE');
          }
        }
      });
    }
    setEditSkills(skMap);
    setEditError('');
    setIsEditOpen(true);
  };

  const handleEditSemesterChange = (sem, val) => {
    setEditSemesterMarks((prev) => ({
      ...prev,
      [sem]: val
    }));
  };

  const toggleEditSkill = (skill) => {
    setEditSkills((prev) => {
      const copy = { ...prev };
      if (copy[skill.id]) {
        delete copy[skill.id];
      } else {
        copy[skill.id] = 'INTERMEDIATE';
      }
      return copy;
    });
  };

  const setEditSkillLevel = (skillId, lvl) => {
    setEditSkills((prev) => ({
      ...prev,
      [skillId]: lvl
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');

    if (editBacklogs === '' || isNaN(editBacklogs) || parseInt(editBacklogs, 10) < 0) {
      setEditError('Active backlogs count must be a non-negative integer (0 or more).');
      return;
    }

    const parsedCgpa = parseFloat(editCgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10.0) {
      setEditError('CGPA must be between 0.0 and 10.0.');
      return;
    }

    // Format semester marks
    const formattedMarks = [];
    for (const [semStr, markVal] of Object.entries(editSemesterMarks)) {
      if (markVal !== '' && markVal !== null && markVal !== undefined) {
        const markNum = parseFloat(markVal);
        if (isNaN(markNum) || markNum < 0 || markNum > 100) {
          setEditError(`Semester ${semStr} mark must be between 0% and 100%.`);
          return;
        }
        formattedMarks.push({
          semester: Number(semStr),
          marks: markNum
        });
      }
    }

    // Format skills
    const formattedSkills = Object.entries(editSkills).map(([skillId, level]) => {
      const skillObj = availableSkills.find((s) => s.id === Number(skillId));
      return {
        skillId: Number(skillId),
        skillName: skillObj ? skillObj.name : undefined,
        currentLevel: level
      };
    });

    setSaving(true);
    try {
      await studentService.updateProfile({
        cgpa: parsedCgpa,
        backlogs: parseInt(editBacklogs, 10),
        semesterMarks: formattedMarks,
        skills: formattedSkills
      });

      setIsEditOpen(false);
      await load();
    } catch (err) {
      setEditError(err?.message || 'Failed to update student profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading student profile from MySQL..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Student Profile"
        description={error}
        onRetry={load}
      />
    );
  }

  if (!data) return <LoadingState />;

  const semesterRecords = Array.isArray(data.semesterMarks) ? data.semesterMarks : [];
  const studentSkillsList = Array.isArray(data.skills) ? data.skills : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <PageHeader
          title="Student Profile"
          subtitle="Verified academic registry, backlogs status, semester marks, and skills."
        />
        <Button variant="outline" onClick={openEditModal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✎</span> Edit Profile
        </Button>
      </div>

      {/* Main Student Identity Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
            {data.name.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700, margin: 0 }}>{data.name}</h2>
              {data.classification && (
                <Badge status={data.classification}>{data.classification}</Badge>
              )}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Register Number: <strong>{data.regNo}</strong> &bull; {data.department}
            </p>
          </div>
        </div>

        <div className="dashboard-grid-3" style={{ marginTop: '20px' }}>
          <div>
            <span className="form-hint">Email Address</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{data.email}</div>
          </div>
          <div>
            <span className="form-hint">Academic Standing</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>{data.year}</div>
          </div>
          <div>
            <span className="form-hint">Placement Season</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>2026 - 2027 Campus Drive</div>
          </div>
          <div>
            <span className="form-hint">Cumulative CGPA</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '2px' }}>
              {data.cgpa !== null && data.cgpa !== undefined ? `${data.cgpa} / 10.0` : 'Not provided'}
            </div>
          </div>
          <div>
            <span className="form-hint">Active Backlogs</span>
            <div style={{
              fontWeight: 700,
              color: data.backlogs === 0 ? 'var(--status-highly-ready-bar)' : 'var(--status-at-risk-bar)',
              marginTop: '2px'
            }}>
              {data.backlogs !== null && data.backlogs !== undefined ? `${data.backlogs} Backlogs` : 'Not specified'}
            </div>
          </div>
          <div>
            <span className="form-hint">Readiness Score</span>
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
              {data.readinessScore !== null && data.readinessScore !== undefined ? `${data.readinessScore} / 100` : 'Pending Assessment'}
            </div>
          </div>
        </div>
      </div>

      {/* Semester Examination Records */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="section-heading-sm" style={{ marginBottom: '14px', color: 'var(--color-navy-950)' }}>
          Academic Details — Semester Examination Records
        </h3>
        {semesterRecords.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px' }}>
            {semesterRecords.map((sm) => (
              <div
                key={sm.semester}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Semester {sm.semester}
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-950)', marginTop: '4px' }}>
                  {sm.marks}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
            Semester marks not provided.
          </p>
        )}
      </div>

      {/* Student Skills & Levels */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="section-heading-sm" style={{ marginBottom: '14px', color: 'var(--color-navy-950)' }}>
          Technical & Core Skills Inventory
        </h3>
        {studentSkillsList.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {studentSkillsList.map((sk, idx) => {
              const lvl = (sk.level || 'Intermediate').toLowerCase();
              const badgeBg = lvl === 'advanced' ? '#EEF2FF' : lvl === 'intermediate' ? '#ECFDF5' : '#F3F4F6';
              const badgeBorder = lvl === 'advanced' ? '#C7D2FE' : lvl === 'intermediate' ? '#A7F3D0' : '#E5E7EB';
              const badgeText = lvl === 'advanced' ? '#4338CA' : lvl === 'intermediate' ? '#047857' : '#374151';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${badgeBorder}`,
                    backgroundColor: badgeBg,
                    fontSize: '0.8125rem'
                  }}
                >
                  <strong style={{ color: 'var(--color-navy-950)' }}>{sk.name}</strong>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      color: badgeText,
                      textTransform: 'uppercase'
                    }}
                  >
                    {sk.level || 'Intermediate'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
            No skills added.
          </p>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Academic & Skill Profile"
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      >
        {editError && (
          <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', fontSize: '0.8125rem', marginBottom: '14px' }}>
            {editError}
          </div>
        )}

        {/* CGPA & Backlogs Edit */}
        <div className="form-grid-2" style={{ marginBottom: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-cgpa">Cumulative CGPA</label>
            <input
              id="edit-cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              className="input-control"
              value={editCgpa}
              onChange={(e) => setEditCgpa(e.target.value)}
              placeholder="e.g. 8.5"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-backlogs">Active Backlogs (0 if none)</label>
            <input
              id="edit-backlogs"
              type="number"
              min="0"
              step="1"
              className="input-control"
              value={editBacklogs}
              onChange={(e) => setEditBacklogs(e.target.value)}
              placeholder="e.g. 0, 1, 2"
            />
          </div>
        </div>

        {/* Semester Marks Edit */}
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
            Semester Examination Marks (%)
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '8px' }}>
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <div key={sem}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Sem {sem}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="input-control"
                  placeholder="e.g. 82.0"
                  value={editSemesterMarks[sem] ?? ''}
                  onChange={(e) => handleEditSemesterChange(sem, e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Skills Selection & Levels Edit */}
        <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
            Skills & Proficiency
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {availableSkills.map((s) => {
              const isSelected = Boolean(editSkills[s.id]);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleEditSkill(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--color-text-primary)'
                  }}
                >
                  {isSelected ? `✓ ${s.name}` : `+ ${s.name}`}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
            {Object.entries(editSkills).map(([skillId, level]) => {
              const skill = availableSkills.find((s) => s.id === Number(skillId));
              if (!skill) return null;
              return (
                <div
                  key={skillId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.8125rem'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{skill.name}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEditSkillLevel(skill.id, lvl)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-sm)',
                          border: level === lvl ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          backgroundColor: level === lvl ? 'var(--color-primary)' : 'transparent',
                          color: level === lvl ? '#FFFFFF' : 'var(--color-text-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        {lvl.charAt(0) + lvl.slice(1).toLowerCase()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => toggleEditSkill(skill)}
                      style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', marginLeft: '4px' }}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};
