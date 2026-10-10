import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { companyService } from '../../services/companyService';
import { useCms } from '../../context/CmsContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import {
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  LayersIcon
} from '../../components/common/Icons';

export const StudentSkillGap = () => {
  const { cms } = useCms();
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state
  const [viewMode, setViewMode] = useState('inventory'); // 'inventory' | 'company'
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'MISSING' | 'NEEDS_IMPROVEMENT' | 'SATISFIED'
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileData, companyData] = await Promise.all([
        studentService.getProfile(),
        companyService.getCompanyMatches('All')
      ]);
      setProfile(profileData);
      setCompanies(companyData || []);
      if (companyData && companyData.length > 0) {
        setSelectedCompanyId(companyData[0].companyId || companyData[0].id);
      }
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute skill-centric matrix from real student skills and company requirements
  const { skillMatrix, stats } = useMemo(() => {
    if (!profile || !companies) return { skillMatrix: [], stats: { total: 0, missing: 0, needsImp: 0, satisfied: 0 } };

    const studentSkills = profile.skills || [];
    const studentSkillMap = new Map();
    studentSkills.forEach((s) => {
      const key = (s.name || s.skillName || '').toLowerCase().trim();
      studentSkillMap.set(key, s);
    });

    // Map of skillKey -> skill aggregate data
    const skillAggMap = new Map();

    // 1. Gather all skills required by companies
    companies.forEach((comp) => {
      const compName = comp.name || comp.companyName;
      const matchedList = (comp.matchedSkills || []).map((s) => s.toLowerCase().trim());
      const gapList = (comp.skillGaps || []).map((s) => s.toLowerCase().trim());
      const reqList = (comp.requiredSkills || []).map((s) => s.toLowerCase().trim());

      // If requiredSkills is empty, combine matched + gaps
      const allCompSkills = reqList.length > 0 ? reqList : [...matchedList, ...gapList];

      allCompSkills.forEach((skKey) => {
        if (!skKey) return;
        if (!skillAggMap.has(skKey)) {
          // Find original casing if possible
          const originalName =
            comp.requiredSkills?.find((orig) => orig.toLowerCase().trim() === skKey) ||
            comp.matchedSkills?.find((orig) => orig.toLowerCase().trim() === skKey) ||
            comp.skillGaps?.find((orig) => orig.toLowerCase().trim() === skKey) ||
            skKey;

          skillAggMap.set(skKey, {
            name: originalName,
            companies: new Set(),
            gapInCompanies: new Set(),
            matchedInCompanies: new Set()
          });
        }

        const item = skillAggMap.get(skKey);
        item.companies.add(compName);
        if (gapList.includes(skKey)) {
          item.gapInCompanies.add(compName);
        } else if (matchedList.includes(skKey)) {
          item.matchedInCompanies.add(compName);
        }
      });
    });

    // 2. Also incorporate student's own verified skills that may not be strictly required yet
    studentSkills.forEach((s) => {
      const skKey = (s.name || s.skillName || '').toLowerCase().trim();
      if (!skillAggMap.has(skKey)) {
        skillAggMap.set(skKey, {
          name: s.name || s.skillName,
          companies: new Set(),
          gapInCompanies: new Set(),
          matchedInCompanies: new Set()
        });
      }
    });

    // 3. Synthesize status for each skill
    let missingCount = 0;
    let needsImpCount = 0;
    let satisfiedCount = 0;

    const list = Array.from(skillAggMap.values()).map((item) => {
      const skKey = item.name.toLowerCase().trim();
      const studentSkill = studentSkillMap.get(skKey);

      const hasAdded = !!studentSkill;
      const currentLevel = hasAdded ? studentSkill.level || studentSkill.rawLevel || 'Intermediate' : 'Not Added';
      const category = studentSkill?.category || 'Technical Competency';

      // Benchmark level required by recruitment partners
      const requiredLevel = 'Intermediate';

      let status = 'SATISFIED';
      let gapLabel = 'Satisfied';
      let severity = 'LOW';
      let recommendation = 'Your skill level meets placement benchmarks for major tech recruiters.';

      if (!hasAdded) {
        status = 'MISSING';
        gapLabel = 'Missing';
        severity = 'HIGH';
        recommendation = 'Required by campus recruiters. Add this skill to your profile and complete foundational projects.';
        missingCount++;
      } else if (item.gapInCompanies.size > 0 || currentLevel === 'Beginner') {
        status = 'NEEDS_IMPROVEMENT';
        gapLabel = 'Needs Improvement';
        severity = 'MEDIUM';
        recommendation = 'Upgrade from Beginner to Intermediate/Advanced to meet high-tier placement criteria.';
        needsImpCount++;
      } else {
        satisfiedCount++;
      }

      return {
        name: item.name,
        category,
        currentLevel,
        requiredLevel,
        status,
        gapLabel,
        severity,
        recommendation,
        companies: Array.from(item.companies),
        gapInCompanies: Array.from(item.gapInCompanies),
        matchedInCompanies: Array.from(item.matchedInCompanies)
      };
    });

    // Sort: Missing first, then Needs Improvement, then Satisfied
    const priorityOrder = { MISSING: 1, NEEDS_IMPROVEMENT: 2, SATISFIED: 3 };
    list.sort((a, b) => (priorityOrder[a.status] || 9) - (priorityOrder[b.status] || 9) || a.name.localeCompare(b.name));

    return {
      skillMatrix: list,
      stats: {
        total: studentSkills.length,
        missing: missingCount,
        needsImp: needsImpCount,
        satisfied: satisfiedCount
      }
    };
  }, [profile, companies]);

  // Filtered skills based on search and status
  const filteredSkills = useMemo(() => {
    return skillMatrix.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [skillMatrix, searchQuery, statusFilter]);

  // Selected company for company-specific drilldown
  const activeCompany = useMemo(() => {
    if (!companies || companies.length === 0) return null;
    return companies.find((c) => (c.companyId || c.id) === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  // Company-specific skills hierarchy: Skill -> Current Level -> Required Level -> Gap
  const companySkillRows = useMemo(() => {
    if (!activeCompany || !profile) return [];
    const studentSkillMap = new Map();
    (profile.skills || []).forEach((s) => {
      studentSkillMap.set((s.name || s.skillName || '').toLowerCase().trim(), s);
    });

    const matchedList = (activeCompany.matchedSkills || []).map((s) => s.toLowerCase().trim());
    const gapList = (activeCompany.skillGaps || []).map((s) => s.toLowerCase().trim());
    const reqList = (activeCompany.requiredSkills || []).map((s) => s.toLowerCase().trim());
    const combined = reqList.length > 0 ? reqList : [...matchedList, ...gapList];

    return combined.map((skKey) => {
      const originalName =
        activeCompany.requiredSkills?.find((orig) => orig.toLowerCase().trim() === skKey) ||
        activeCompany.matchedSkills?.find((orig) => orig.toLowerCase().trim() === skKey) ||
        activeCompany.skillGaps?.find((orig) => orig.toLowerCase().trim() === skKey) ||
        skKey;

      const studentSkill = studentSkillMap.get(skKey);
      const hasAdded = !!studentSkill;
      const currentLevel = hasAdded ? studentSkill.level || studentSkill.rawLevel || 'Intermediate' : 'Not Added';
      const requiredLevel = 'Intermediate';

      let gapStatus = 'Satisfied';
      let gapCode = 'SATISFIED';
      let recommendation = `Meets ${activeCompany.name} screening benchmark.`;

      if (!hasAdded) {
        gapStatus = 'Missing';
        gapCode = 'MISSING';
        recommendation = `Required for ${activeCompany.name}. Add this skill to your profile.`;
      } else if (gapList.includes(skKey) || currentLevel === 'Beginner') {
        gapStatus = 'Needs Improvement';
        gapCode = 'NEEDS_IMPROVEMENT';
        recommendation = `Current ${currentLevel} level is below ${activeCompany.name}'s benchmark.`;
      }

      return {
        skill: originalName,
        currentLevel,
        requiredLevel,
        gapStatus,
        gapCode,
        recommendation
      };
    });
  }, [activeCompany, profile]);

  if (loading) return <LoadingState message="Analyzing skill competencies and industry benchmarks from MySQL database..." />;

  if (error) {
    return (
      <div>
        <PageHeader
          title={cms('skillgap.title', 'Skill Gap Analysis')}
          subtitle={cms('skillgap.subtitle', 'Identify the skills you need to strengthen for your target companies.')}
        />
        <ErrorState
          title="Failed to Load Skill Gap Analysis"
          description={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 1. Page Header with CTA to Profile Skill Management */}
      <PageHeader
        title={cms('skillgap.title', 'Skill Gap Analysis')}
        subtitle={cms('skillgap.subtitle', 'Identify the skills you need to strengthen for your target companies.')}
        actions={
          <Link to="/student/profile">
            <Button variant="primary" icon={ArrowRightIcon}>
              Update Skills in Profile
            </Button>
          </Link>
        }
      />

      {/* 2. Top Summary Metric Cards (Skill-Centric KPIs) */}
      <div className="dashboard-grid-4" style={{ marginBottom: '24px' }}>
        {/* Verified Skills */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <LayersIcon width={22} height={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy-950)', lineHeight: 1.1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              Your Verified Skills
            </div>
          </div>
        </div>

        {/* Missing Skills */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderLeft: '4px solid #EF4444' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DC2626'
          }}>
            <AlertTriangleIcon width={22} height={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#B91C1C', lineHeight: 1.1 }}>
              {stats.missing}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              Missing Critical Skills
            </div>
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderLeft: '4px solid #F59E0B' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#FFFBEB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706'
          }}>
            <AlertTriangleIcon width={22} height={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#92400E', lineHeight: 1.1 }}>
              {stats.needsImp}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              Needs Level Upgrade
            </div>
          </div>
        </div>

        {/* Satisfied Placement Skills */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px', borderLeft: '4px solid #10B981' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <CheckIcon width={22} height={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065F46', lineHeight: 1.1 }}>
              {stats.satisfied}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '4px' }}>
              Satisfied Benchmarks
            </div>
          </div>
        </div>
      </div>

      {/* 3. View Mode Tabs (Skill Inventory vs Company-Wise Breakdown) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--color-border)'
      }}>
        {/* Toggle Mode */}
        <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('inventory')}
            style={{
              padding: '8px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'inventory' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'inventory' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'inventory' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Skill-Centric Matrix
          </button>
          <button
            type="button"
            onClick={() => setViewMode('company')}
            style={{
              padding: '8px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'company' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'company' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              boxShadow: viewMode === 'company' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Company-Wise Breakdown
          </button>
        </div>

        {/* Search or Quick Hint */}
        {viewMode === 'inventory' ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search skill (e.g. Java, React)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ width: '240px', padding: '6px 12px', fontSize: '0.8125rem' }}
            />
          </div>
        ) : (
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Showing specific requirements for target recruiter
          </span>
        )}
      </div>

      {/* ============================================================
          VIEW 1: SKILL-CENTRIC MATRIX (PRIMARY)
          ============================================================ */}
      {viewMode === 'inventory' && (
        <div>
          {/* Status Filters */}
          <div className="company-filter-tabs" style={{ marginBottom: '18px' }}>
            {[
              { id: 'ALL', label: `All Skills (${skillMatrix.length})` },
              { id: 'MISSING', label: `Missing (${stats.missing})` },
              { id: 'NEEDS_IMPROVEMENT', label: `Needs Improvement (${stats.needsImp})` },
              { id: 'SATISFIED', label: `Satisfied (${stats.satisfied})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`company-filter-btn ${statusFilter === f.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredSkills.length === 0 ? (
            <EmptyState
              title="No skills found"
              description="No skills match your search or selected filter status."
              actionLabel="Clear Filters"
              onAction={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
            />
          ) : (
            /* Clear Skill-Focused Containers */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '18px' }}>
              {filteredSkills.map((item, idx) => {
                const isMissing = item.status === 'MISSING';
                const isNeedsImp = item.status === 'NEEDS_IMPROVEMENT';
                const isSatisfied = item.status === 'SATISFIED';

                const borderColor = isMissing ? '#FCA5A5' : isNeedsImp ? '#FDE68A' : '#A7F3D0';
                const accentColor = isMissing ? '#EF4444' : isNeedsImp ? '#F59E0B' : '#10B981';

                return (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      borderTop: `4px solid ${accentColor}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '20px'
                    }}
                  >
                    <div>
                      {/* Top Header: Skill Name & Gap Badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--color-navy-950)' }}>
                            {item.name}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                            {item.category}
                          </span>
                        </div>
                        <div>
                          {isMissing && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              color: '#B91C1C',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              <AlertTriangleIcon width={12} height={12} />
                              Missing
                            </span>
                          )}
                          {isNeedsImp && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              color: '#B45309',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              <AlertTriangleIcon width={12} height={12} />
                              Needs Improvement
                            </span>
                          )}
                          {isSatisfied && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#047857',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              <CheckIcon width={12} height={12} />
                              Satisfied
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Level Comparison: Current Level vs Required Level */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        padding: '12px',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '14px',
                        border: '1px solid var(--color-border)'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                            Current Level
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: isMissing ? 'var(--color-text-muted)' : 'var(--color-navy-900)',
                            fontStyle: isMissing ? 'italic' : 'normal',
                            marginTop: '2px'
                          }}>
                            {item.currentLevel}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                            Target Benchmark
                          </div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
                            {item.requiredLevel}
                          </div>
                        </div>
                      </div>

                      {/* Target Companies demanding this skill */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Demanded by Recruiting Partners
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(item.companies || []).length > 0 ? (
                            item.companies.map((cName, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: '#FFFFFF',
                                  border: '1px solid var(--color-border)',
                                  color: 'var(--color-navy-900)'
                                }}
                              >
                                {cName}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              General institutional technology benchmark
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Footer */}
                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border)',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      color: 'var(--color-text-secondary)'
                    }}>
                      <strong style={{ color: 'var(--color-navy-950)' }}>Action:</strong> {item.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 2: COMPANY-WISE SKILL BREAKDOWN (SECONDARY)
          Hierarchy: Skill -> Current Level -> Required Level -> Gap
          ============================================================ */}
      {viewMode === 'company' && activeCompany && (
        <div>
          {/* Company Selector Ribbon (Secondary) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
            {companies.map((comp) => {
              const compId = comp.companyId || comp.id;
              const isSelected = compId === (activeCompany.companyId || activeCompany.id);
              return (
                <button
                  key={compId}
                  type="button"
                  onClick={() => setSelectedCompanyId(compId)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--color-primary)' : 'var(--color-navy-900)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {comp.name}
                  {(comp.skillGaps || []).length > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontSize: '0.6875rem',
                      backgroundColor: isSelected ? 'var(--color-primary)' : '#FEF2F2',
                      color: isSelected ? '#FFFFFF' : '#DC2626'
                    }}>
                      {comp.skillGaps.length} gaps
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Company Target Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-navy-950)' }}>
                  {activeCompany.name} Skill Requirements
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Evaluated against your verified academic profile and skillset
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/student/company-matching" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="sm" icon={ArrowRightIcon}>
                    View Company Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick summary notice for this company */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: (activeCompany.skillGaps || []).length > 0 ? '#FFFBEB' : '#ECFDF5',
              border: `1px solid ${(activeCompany.skillGaps || []).length > 0 ? '#FDE68A' : '#A7F3D0'}`,
              marginBottom: '20px'
            }}>
              {(activeCompany.skillGaps || []).length > 0 ? (
                <>
                  <AlertTriangleIcon width={18} height={18} style={{ color: '#D97706', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E' }}>
                    Missing or Insufficient Skills for {activeCompany.name}: {activeCompany.skillGaps.join(', ')}
                  </span>
                </>
              ) : (
                <>
                  <CheckIcon width={18} height={18} style={{ color: '#059669', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065F46' }}>
                    All required skills for {activeCompany.name} are satisfied by your profile!
                  </span>
                </>
              )}
            </div>

            {/* Strict Hierarchy Table: Skill -> Current Level -> Required Level -> Gap */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-bg-subtle)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Skill
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Current Level
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Required Level
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Gap Status
                    </th>
                    <th style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                      Recommendation
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {companySkillRows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--color-navy-950)' }}>
                        {row.skill}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontWeight: 600,
                          color: row.currentLevel === 'Not Added' ? 'var(--color-text-muted)' : 'var(--color-navy-900)',
                          fontStyle: row.currentLevel === 'Not Added' ? 'italic' : 'normal'
                        }}>
                          {row.currentLevel}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>
                        {row.requiredLevel}
                      </td>
                      <td style={{ padding: '14px' }}>
                        {row.gapCode === 'MISSING' && (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #FCA5A5' }}>
                            Missing
                          </span>
                        )}
                        {row.gapCode === 'NEEDS_IMPROVEMENT' && (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#FFFBEB', color: '#B45309', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #FDE68A' }}>
                            Needs Improvement
                          </span>
                        )}
                        {row.gapCode === 'SATISFIED' && (
                          <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#047857', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #A7F3D0' }}>
                            Satisfied
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        {row.recommendation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
