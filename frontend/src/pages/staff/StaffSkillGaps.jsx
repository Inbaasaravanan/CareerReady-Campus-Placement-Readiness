import React, { useEffect, useState, useMemo } from 'react';
import { staffService } from '../../services/staffService';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { SearchIcon, AlertTriangleIcon, CheckIcon, LayersIcon, BriefcaseIcon, UserIcon } from '../../components/common/Icons';

export const StaffSkillGaps = () => {
  const [skillGaps, setSkillGaps] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [company, setCompany] = useState('All');
  const [skill, setSkill] = useState('All');
  const [priority, setPriority] = useState('All');

  // Student Detail Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const fetchFiltersData = async () => {
    try {
      const [compData, skData, deptData] = await Promise.all([
        staffService.getCompanyAnalytics().catch(() => []),
        adminService.getSkills().catch(() => []),
        adminService.getDepartments().catch(() => [])
      ]);
      setCompanies(compData || []);
      setSkillsList(skData || []);
      setDepartments(deptData || []);
    } catch (e) {
      console.error('Failed to load filter metadata:', e);
    }
  };

  const fetchGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (department && department !== 'All') params.department = department;
      if (company && company !== 'All') params.company = company;
      if (skill && skill !== 'All') params.skill = skill;
      if (priority && priority !== 'All') params.priority = priority;
      if (search && search.trim()) params.search = search.trim();

      const data = await staffService.getStudentSkillGaps(params);
      setSkillGaps(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchGaps();
  }, [department, company, skill, priority]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGaps();
  };

  const handleOpenStudentDetail = async (studentId) => {
    setSelectedStudentId(studentId);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await staffService.getStudentSkillGapDetail(studentId);
      setStudentDetail(detail);
    } catch (err) {
      setDetailError(err?.message || 'Failed to load detailed student skill gap profile.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
    setDetailError(null);
  };

  const resetFilters = () => {
    setSearch('');
    setDepartment('All');
    setCompany('All');
    setSkill('All');
    setPriority('All');
  };

  // Metrics
  const totalGapsCount = skillGaps.length;
  const highPriorityCount = useMemo(() => skillGaps.filter(g => g.gapPriority === 'HIGH').length, [skillGaps]);
  const uniqueStudentsCount = useMemo(() => new Set(skillGaps.map(g => g.studentId)).size, [skillGaps]);
  const uniqueCompaniesCount = useMemo(() => new Set(skillGaps.map(g => g.companyName || g.company)).size, [skillGaps]);

  if (loading && skillGaps.length === 0) {
    return <LoadingState message="Loading student skill gap analysis from MySQL database..." />;
  }

  if (error && skillGaps.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Skill Gap Analysis"
        description={error}
        onRetry={fetchGaps}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title="Candidate Skill Gap Analysis"
        subtitle="Individual student skill deficits benchmarked against live corporate recruitment requirements."
      />

      {/* Analytics Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <LayersIcon width={24} height={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>{totalGapsCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Identified Skill Gaps</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--status-at-risk-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-at-risk-bar)' }}>
            <AlertTriangleIcon width={24} height={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-at-risk-bar)' }}>{highPriorityCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>High Priority Deficits</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy-800)' }}>
            <UserIcon width={24} height={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>{uniqueStudentsCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Students Requiring Upskilling</div>
          </div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'var(--color-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <BriefcaseIcon width={24} height={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>{uniqueCompaniesCount}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Target Companies</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
          
          {/* Search */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Search Student or Skill</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Student name, reg number, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                <SearchIcon width={16} height={16} />
              </span>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Department</label>
            <select className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="All">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name} ({d.code})</option>
              ))}
              {!departments.length && (
                <>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                </>
              )}
            </select>
          </div>

          {/* Target Company */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Target Company</label>
            <select className="form-control" value={company} onChange={(e) => setCompany(e.target.value)}>
              <option value="All">All Companies</option>
              {companies.map((c, idx) => (
                <option key={idx} value={c.companyName || c.company || c.name}>
                  {c.companyName || c.company || c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assessed Skill */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Skill</label>
            <select className="form-control" value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="All">All Skills</option>
              {skillsList.map((sk) => (
                <option key={sk.id} value={sk.name}>{sk.name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Gap Priority</label>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="All">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" variant="primary" size="sm" style={{ flex: 1 }}>
              Apply
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* Main Student Skill Gap Table */}
      <div className="card">
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">Student-Level Skill Gap Registry</h3>
            <p className="form-hint">Detailed breakdown of candidate competencies compared against corporate hiring benchmarks</p>
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
            Showing {skillGaps.length} gaps
          </span>
        </div>

        {skillGaps.length === 0 ? (
          <EmptyState
            title="No skill gaps identified for the available students."
            description="All active students meet or exceed the skill requirements for the selected criteria, or no candidates match the search filters."
            actionLabel="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Reg No</th>
                  <th>Department</th>
                  <th>Target Company</th>
                  <th>Assessed Skill</th>
                  <th>Current Level</th>
                  <th>Required Level</th>
                  <th>Gap Status</th>
                  <th>Priority</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {skillGaps.map((item, idx) => {
                  const p = (item.gapPriority || 'MEDIUM').toUpperCase();
                  const priorityVariant = p === 'HIGH' ? 'at-risk' : p === 'MEDIUM' ? 'needs-improvement' : 'ready';

                  return (
                    <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => handleOpenStudentDetail(item.studentId)}>
                      <td>
                        <strong style={{ color: 'var(--color-navy-950)' }}>
                          {item.studentName || 'Student'}
                        </strong>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                        {item.registerNumber || '-'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          {item.department || item.departmentName || 'Not Provided'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {item.companyName || item.company || 'Enterprise'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.skillName || item.skill}</span>
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                            {item.category || 'Technical'} {item.mandatory ? '• Mandatory' : ''}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: item.currentLevel === 'NONE' ? '#FEE2E2' : '#F1F5F9',
                          color: item.currentLevel === 'NONE' ? '#991B1B' : '#334155'
                        }}>
                          {item.currentLevel || 'NONE'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: '#EFF6FF',
                          color: '#1E40AF'
                        }}>
                          {item.requiredLevel || 'INTERMEDIATE'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                          {item.gapStatus || 'Skill Gap'}
                        </span>
                      </td>
                      <td>
                        <Badge status={p} variant={priorityVariant}>
                          {p}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudentDetail(item.studentId);
                          }}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Student Skill Gap Modal */}
      <Modal
        isOpen={Boolean(selectedStudentId)}
        onClose={handleCloseModal}
        title={studentDetail ? `Skill Gap Profile: ${studentDetail.studentName}` : 'Student Skill Gap Details'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <Button variant="outline" size="sm" onClick={handleCloseModal}>
              Close
            </Button>
          </div>
        }
      >
        {detailLoading ? (
          <LoadingState message="Analyzing candidate skill requirements from MySQL database..." />
        ) : detailError ? (
          <ErrorState title="Error Loading Profile" description={detailError} />
        ) : studentDetail ? (
          <div>
            {/* Student Profile Header Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--color-bg-subtle)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
              gap: '12px'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
                  {studentDetail.studentName}
                </h4>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                  Reg No: <strong>{studentDetail.registerNumber || 'Not Provided'}</strong> &bull; Dept: <strong>{studentDetail.department || studentDetail.departmentName || 'Not Provided'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>CGPA</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
                    {studentDetail.cgpa != null ? studentDetail.cgpa.toFixed(2) : '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Aptitude</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: studentDetail.aptitudeScore != null ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {studentDetail.aptitudeScore != null ? `${studentDetail.aptitudeScore}%` : 'Not completed'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Technical</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: studentDetail.technicalScore != null ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                    {studentDetail.technicalScore != null ? `${studentDetail.technicalScore}%` : 'Not completed'}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Skills Requiring Improvement */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangleIcon width={18} height={18} style={{ color: 'var(--status-at-risk-bar)' }} />
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
                  Skills Requiring Improvement ({studentDetail.skillsRequiringImprovement?.length || 0})
                </h4>
              </div>

              {(!studentDetail.skillsRequiringImprovement || studentDetail.skillsRequiringImprovement.length === 0) ? (
                <div style={{ padding: '16px', background: 'var(--status-highly-ready-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-highly-ready-text)', fontSize: '0.875rem' }}>
                  ✓ This student currently meets or exceeds all tracked company skill benchmarks!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {studentDetail.skillsRequiringImprovement.map((gap, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: '#FFFFFF',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '0.9375rem', color: 'var(--color-navy-950)' }}>{gap.skill}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                            ({gap.category}) &bull; Required by <strong>{gap.companyName}</strong> {gap.mandatory ? '• Mandatory' : '• Optional'}
                          </span>
                        </div>
                        <Badge status={gap.gapLevel} variant={gap.gapLevel === 'HIGH' ? 'at-risk' : 'needs-improvement'}>
                          {gap.gapLevel} GAP
                        </Badge>
                      </div>

                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                        <span>Current: <strong style={{ color: gap.currentLevel === 'None' ? 'var(--status-at-risk-bar)' : 'inherit' }}>{gap.currentLevel}</strong></span>
                        <span>Required: <strong style={{ color: 'var(--color-primary)' }}>{gap.requiredLevel}</strong></span>
                      </div>

                      {gap.recommendation && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-subtle)', padding: '6px 10px', borderRadius: '4px' }}>
                          💡 <em>{gap.recommendation}</em>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Skills Currently Met */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <CheckIcon width={18} height={18} style={{ color: 'var(--status-highly-ready-bar)' }} />
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
                  Skills the Student Currently Meets ({studentDetail.skillsCurrentlyMet?.length || 0})
                </h4>
              </div>

              {(!studentDetail.skillsCurrentlyMet || studentDetail.skillsCurrentlyMet.length === 0) ? (
                <div style={{ padding: '16px', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  No skills recorded at or above corporate requirements yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {studentDetail.skillsCurrentlyMet.map((met, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--status-highly-ready-border)',
                        backgroundColor: 'var(--status-highly-ready-bg)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--status-highly-ready-text)' }}>{met.skill}</strong>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--status-highly-ready-text)' }}>
                          {met.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--status-highly-ready-text)' }}>
                        Level: <strong>{met.currentLevel}</strong> (Req: {met.requiredLevel}) &bull; {met.companyName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
