import React, { useEffect, useState, useMemo } from 'react';
import { staffService } from '../../services/staffService';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { SearchIcon, AlertTriangleIcon, CheckIcon, LayersIcon, BriefcaseIcon, UserIcon, ChevronDownIcon } from '../../components/common/Icons';

export const StaffSkillGaps = () => {
  const [skillGaps, setSkillGaps] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View presentation mode: 'grouped' (expandable student cards - default) or 'table' (compact continuous table)
  const [viewMode, setViewMode] = useState('grouped');
  const [expandedStudents, setExpandedStudents] = useState(() => new Set());

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

  // Group gaps by unique student identifier (studentId or registerNumber)
  const studentGroups = useMemo(() => {
    const map = new Map();
    skillGaps.forEach((item) => {
      const key = item.studentId ? `std-${item.studentId}` : `reg-${item.registerNumber || item.studentName}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          studentId: item.studentId,
          studentName: item.studentName || 'Student',
          registerNumber: item.registerNumber || '-',
          department: item.department || item.departmentName || 'Not Provided',
          gaps: []
        });
      }
      map.get(key).gaps.push(item);
    });
    return Array.from(map.values());
  }, [skillGaps]);

  const toggleStudent = (key) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedStudents(new Set(studentGroups.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedStudents(new Set());
  };

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
        <div className="section-title-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="section-heading-sm">Student-Level Skill Gap Registry</h3>
            <p className="form-hint">
              {viewMode === 'grouped'
                ? `Organized by student • ${studentGroups.length} candidates with ${skillGaps.length} total requirements`
                : `Continuous registry of all ${skillGaps.length} candidate skill gaps`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--color-bg-subtle)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grouped' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grouped' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: viewMode === 'grouped' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Grouped by Student ({studentGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: viewMode === 'table' ? 'var(--shadow-xs)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Continuous Table ({skillGaps.length})
              </button>
            </div>

            {/* Expand / Collapse All (Grouped mode only) */}
            {viewMode === 'grouped' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
                  onClick={expandAll}
                >
                  Expand All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  style={{ fontSize: '0.75rem', padding: '3px 8px', height: '28px' }}
                  onClick={collapseAll}
                >
                  Collapse All
                </Button>
              </div>
            )}
          </div>
        </div>

        {skillGaps.length === 0 ? (
          <EmptyState
            title="No skill gaps identified for the available students."
            description="All active students meet or exceed the skill requirements for the selected criteria, or no candidates match the search filters."
            actionLabel="Clear Filters"
            onAction={resetFilters}
          />
        ) : viewMode === 'grouped' ? (
          /* Expandable Grouped Student View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {studentGroups.map((group) => {
              const isExpanded = expandedStudents.has(group.key);
              const highCount = group.gaps.filter(g => (g.gapPriority || '').toUpperCase() === 'HIGH').length;
              const companiesCount = new Set(group.gaps.map(g => g.companyName || g.company)).size;

              return (
                <div
                  key={group.key}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-bg-surface)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  {/* Student Header Bar */}
                  <div
                    onClick={() => toggleStudent(group.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: isExpanded ? 'var(--color-bg-subtle)' : 'var(--color-bg-surface)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                      transition: 'background-color 0.15s ease',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px', flex: '1 1 auto' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isExpanded ? '#EFF6FF' : 'var(--color-bg-subtle)',
                          color: isExpanded ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <ChevronDownIcon width={14} height={14} />
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.875rem', color: 'var(--color-navy-950)' }}>
                            {group.studentName}
                          </strong>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', padding: '1px 6px', borderRadius: '4px' }}>
                            {group.registerNumber}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            • {group.department}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary Badges and Dossier Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '0 0 auto', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        backgroundColor: '#FEF3C7',
                        color: '#92400E'
                      }}>
                        {group.gaps.length} Gaps ({highCount} High)
                      </span>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        backgroundColor: 'var(--color-bg-subtle)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        {companiesCount} {companiesCount === 1 ? 'Company' : 'Companies'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', height: '26px', whiteSpace: 'nowrap' }}
                        onClick={() => handleOpenStudentDetail(group.studentId)}
                      >
                        View Dossier
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Individual Gaps Table */}
                  {isExpanded && (
                    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', backgroundColor: '#FAFAFA' }}>
                      <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '920px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <colgroup>
                          <col style={{ width: '18%' }} />
                          <col style={{ width: '22%' }} />
                          <col style={{ width: '12%' }} />
                          <col style={{ width: '12%' }} />
                          <col style={{ width: '14%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '12%' }} />
                        </colgroup>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-bg-subtle)' }}>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Target Company</th>
                            <th style={{ padding: '6px 10px', textAlign: 'left', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Assessed Skill</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Current Level</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Required Level</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Gap Status</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Priority</th>
                            <th style={{ padding: '6px 10px', textAlign: 'center', fontSize: '0.72rem', letterSpacing: '0.04em' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.gaps.map((item, gIdx) => {
                            const p = (item.gapPriority || 'MEDIUM').toUpperCase();
                            const priorityVariant = p === 'HIGH' ? 'at-risk' : p === 'MEDIUM' ? 'needs-improvement' : 'ready';

                            return (
                              <tr key={gIdx} style={{ height: '34px', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-primary)', wordBreak: 'break-word' }}>
                                  {item.companyName || item.company || 'Enterprise'}
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'left', wordBreak: 'break-word' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.skillName || item.skill}</span>
                                    {item.mandatory && (
                                      <span style={{ fontSize: '0.65rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '1px 4px', borderRadius: '3px', fontWeight: 600 }}>
                                        Mandatory
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.category || 'Technical'}</span>
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    backgroundColor: item.currentLevel === 'NONE' ? '#FEE2E2' : '#F1F5F9',
                                    color: item.currentLevel === 'NONE' ? '#991B1B' : '#334155',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.currentLevel || 'NONE'}
                                  </span>
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    backgroundColor: '#EFF6FF',
                                    color: '#1E40AF',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {item.requiredLevel || 'INTERMEDIATE'}
                                  </span>
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                  {item.gapStatus || 'Skill Gap'}
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                  <Badge status={p} variant={priorityVariant} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                                    {p}
                                  </Badge>
                                </td>
                                <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    style={{ fontSize: '0.72rem', padding: '2px 8px', height: '24px', whiteSpace: 'nowrap' }}
                                    onClick={() => handleOpenStudentDetail(item.studentId)}
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
              );
            })}
          </div>
        ) : (
          /* Continuous Compact Table with Visual Grouping */
          <div className="table-container" style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: '1240px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '6%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ width: '13%', textAlign: 'left', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Student Name</th>
                  <th style={{ width: '8%', textAlign: 'left', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Reg No</th>
                  <th style={{ width: '13%', textAlign: 'left', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Department</th>
                  <th style={{ width: '12%', textAlign: 'left', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Target Company</th>
                  <th style={{ width: '13%', textAlign: 'left', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Assessed Skill</th>
                  <th style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Current Level</th>
                  <th style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Required Level</th>
                  <th style={{ width: '9%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Gap Status</th>
                  <th style={{ width: '6%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Priority</th>
                  <th style={{ width: '8%', textAlign: 'center', verticalAlign: 'middle', padding: '6px 10px', whiteSpace: 'nowrap' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {skillGaps.map((item, idx) => {
                  const p = (item.gapPriority || 'MEDIUM').toUpperCase();
                  const priorityVariant = p === 'HIGH' ? 'at-risk' : p === 'MEDIUM' ? 'needs-improvement' : 'ready';
                  const isFirstOfStudent = idx === 0 || item.studentId !== skillGaps[idx - 1].studentId;

                  return (
                    <tr
                      key={idx}
                      style={{
                        height: '34px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: isFirstOfStudent ? '#FFFFFF' : '#FAFAFA'
                      }}
                    >
                      <td style={{ textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', padding: '5px 10px' }}>
                        {isFirstOfStudent ? (
                          <strong style={{ color: 'var(--color-navy-950)', display: 'block', fontSize: '0.8125rem' }}>
                            {item.studentName || 'Student'}
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', paddingLeft: '8px' }}>
                            ↳ (same)
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'left', verticalAlign: 'middle', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '5px 10px' }}>
                        {isFirstOfStudent ? (item.registerNumber || '-') : <span style={{ color: 'var(--color-text-muted)' }}>″</span>}
                      </td>
                      <td style={{ textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', lineHeight: 1.25, padding: '5px 10px' }}>
                        {isFirstOfStudent ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                            {item.department || item.departmentName || 'Not Provided'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>″</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', padding: '5px 10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>
                          {item.companyName || item.company || 'Enterprise'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'left', verticalAlign: 'middle', wordBreak: 'break-word', lineHeight: 1.25, padding: '5px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{item.skillName || item.skill}</span>
                          {item.mandatory && (
                            <span style={{ fontSize: '0.62rem', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '1px 4px', borderRadius: '3px', fontWeight: 600 }}>
                              Mandatory
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{item.category || 'Technical'}</span>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: item.currentLevel === 'NONE' ? '#FEE2E2' : '#F1F5F9',
                          color: item.currentLevel === 'NONE' ? '#991B1B' : '#334155',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.currentLevel || 'NONE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: '#EFF6FF',
                          color: '#1E40AF',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.requiredLevel || 'INTERMEDIATE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {item.gapStatus || 'Skill Gap'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
                        <Badge status={p} variant={priorityVariant} style={{ fontSize: '0.7rem', padding: '2px 6px', whiteSpace: 'nowrap' }}>
                          {p}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle', padding: '5px 10px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={{ fontSize: '0.72rem', padding: '2px 8px', height: '24px', whiteSpace: 'nowrap' }}
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
