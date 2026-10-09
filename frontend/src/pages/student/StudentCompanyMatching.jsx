import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { companyService } from '../../services/companyService';
import { useCms } from '../../context/CmsContext';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { BriefcaseIcon, CheckIcon, AlertTriangleIcon, ArrowRightIcon } from '../../components/common/Icons';

export const StudentCompanyMatching = () => {
  const { cms } = useCms();
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await companyService.getCompanyMatches(filter);
      setCompanies(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [filter]);

  if (error) {
    return (
      <div>
        <PageHeader
          title={cms('company.matching.title', 'Company Matches')}
          subtitle={cms('company.matching.subtitle', 'Explore companies that align with your current profile and placement readiness.')}
        />
        <ErrorState
          title="Failed to Load Company Matching"
          description={error}
          onRetry={fetchCompanies}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={cms('company.matching.title', 'Company Matches')}
        subtitle={cms('company.matching.subtitle', 'Explore companies that align with your current profile and placement readiness.')}
      />

      {/* Filter Tabs */}
      <div className="company-filter-tabs">
        {['All', 'Eligible', 'High Match', 'Needs Improvement'].map((f) => (
          <button
            key={f}
            type="button"
            className={`company-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'All' ? 'All Companies' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Calculating company compatibility and skill gaps from MySQL database..." />
      ) : companies.length === 0 ? (
        <EmptyState
          title={cms('company.no_companies', 'No company matches available.')}
          description={filter === 'All' ? "No recruiting companies configured in the database yet." : "No companies match the selected filter. Try selecting 'All Companies'."}
          actionLabel={filter !== 'All' ? "Reset Filter" : undefined}
          onAction={filter !== 'All' ? () => setFilter('All') : undefined}
        />
      ) : (
        /* Company Cards Grid (Requirement 14, 15, 16, 17) */
        <div className="company-cards-grid">
          {companies.map((company) => (
            <div key={company.id} className="company-card">
              <div>
                {/* Header */}
                <div className="company-card-top">
                  <div>
                    <h3 className="company-name-heading">{company.name}</h3>
                    <div className="company-sub-info">
                      {company.fullName} &bull; {company.industry}
                    </div>
                  </div>
                  <div className="company-match-metric">
                    <span className="company-match-number">{company.matchPercentage}%</span>
                    <Badge status={company.eligibilityStatus}>{company.eligibilityStatus}</Badge>
                  </div>
                </div>

                {/* Meta details & Cutoffs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '10px 12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '0.8125rem' }}>
                  <span>CGPA Cutoff: <strong>&ge; {company.requiredCGPA}</strong></span>
                  <span>Package: <strong>{company.packageRange}</strong></span>
                  <span>Aptitude Cutoff: <strong>&ge; {company.minimumAptitudeScore}%</strong></span>
                  <span>Technical Cutoff: <strong>&ge; {company.minimumTechnicalScore}%</strong></span>
                </div>

                {/* Matched Skills */}
                <div className="company-section-block">
                  <div className="company-section-label">{cms('company.matched_skills_label', 'Matched Skills')}</div>
                  <div className="skills-tags-wrap">
                    {(company.matchedSkills || []).length > 0 ? (
                      (company.matchedSkills || []).map((skill, sIdx) => (
                        <span key={sIdx} className="skill-matched-box">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="form-hint" style={{ fontSize: '0.75rem' }}>No direct matched skills yet</span>
                    )}
                  </div>
                </div>

                {/* Compact Skill Gap Summary (Leading to Dedicated Skill Gap Page) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: (company.skillGaps || []).length > 0 ? '#FFFBEB' : '#ECFDF5',
                  border: `1px solid ${(company.skillGaps || []).length > 0 ? '#FDE68A' : '#A7F3D0'}`,
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {(company.skillGaps || []).length > 0 ? (
                      <>
                        <AlertTriangleIcon width={14} height={14} style={{ color: '#D97706', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#92400E' }}>
                          {company.skillGaps.length} skill{company.skillGaps.length > 1 ? 's' : ''} need improvement
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckIcon width={14} height={14} style={{ color: '#059669', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#065F46' }}>
                          All required skills matched!
                        </span>
                      </>
                    )}
                  </div>
                  <Link to="/student/skill-gap" style={{ textDecoration: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      View Skill Gaps &rarr;
                    </span>
                  </Link>
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedCompany(company)}
                >
                  View Details
                </Button>
                <Link to="/student/skill-gap" style={{ textDecoration: 'none', flex: 1 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ width: '100%' }}
                  >
                    View Skill Gaps
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Details Modal (Requirement 19) */}
      <Modal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        title="Company Compatibility & Preparation Diagnostic"
        footer={
          <Button variant="secondary" onClick={() => setSelectedCompany(null)}>
            Close
          </Button>
        }
      >
        {selectedCompany && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Top Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-navy-950)' }}>
                  {selectedCompany.name}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {selectedCompany.fullName} &bull; {selectedCompany.industry}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {selectedCompany.matchPercentage}% Match
                </div>
                <Badge status={selectedCompany.eligibilityStatus}>{selectedCompany.eligibilityStatus}</Badge>
              </div>
            </div>

            {/* Recruiter Benchmarks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Required CGPA</div>
                <div style={{ fontWeight: 700, color: 'var(--color-navy-900)' }}>&ge; {selectedCompany.requiredCGPA}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Package Range</div>
                <div style={{ fontWeight: 700, color: 'var(--color-navy-900)' }}>{selectedCompany.packageRange}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Eligible Students</div>
                <div style={{ fontWeight: 700, color: 'var(--color-navy-900)' }}>{selectedCompany.eligibleStudentsCount} Candidates</div>
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Required Skills For Role
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedCompany.requiredSkills || []).length > 0 ? (
                  (selectedCompany.requiredSkills || []).map((req, rIdx) => (
                    <span key={rIdx} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                      {req}
                    </span>
                  ))
                ) : (
                  <span className="form-hint" style={{ fontSize: '0.75rem' }}>Standard technical proficiency benchmark</span>
                )}
              </div>
            </div>

            {/* Matched Skills */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                {cms('company.matched_skills_label', 'Your Matched Skills')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(selectedCompany.matchedSkills || []).length > 0 ? (
                  (selectedCompany.matchedSkills || []).map((mat, mIdx) => (
                    <span key={mIdx} className="skill-matched-box">
                      {mat}
                    </span>
                  ))
                ) : (
                  <span className="form-hint" style={{ fontSize: '0.75rem' }}>No direct matched skills recorded yet</span>
                )}
              </div>
            </div>

            {/* Company-Specific Skill Gaps */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Your {cms('company.skill_gaps_label', 'Skill Gaps')} for {selectedCompany.name}
              </div>
              <div className="skill-gap-boxes-list">
                {(selectedCompany.skillGaps || []).length > 0 ? (
                  (selectedCompany.skillGaps || []).map((gap, gIdx) => (
                    <span key={gIdx} className="skill-gap-box" style={{ borderColor: 'var(--status-needs-imp-border)' }}>
                      {gap}
                    </span>
                  ))
                ) : (
                  <span className="form-hint" style={{ fontSize: '0.75rem' }}>
                    {cms('company.no_skill_gaps', 'No critical skill gaps identified')}
                  </span>
                )}
              </div>
            </div>

            {/* Recommended Preparation */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                Recommended Preparation
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(Array.isArray(selectedCompany.recommendedPreparation)
                  ? selectedCompany.recommendedPreparation
                  : [selectedCompany.recommendedPreparation || 'Focus on company-specific technical assessment topics and mock coding interviews.']
                ).map((prep, pIdx) => (
                  <div
                    key={pIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      lineHeight: 1.4,
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <CheckIcon width={16} height={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{prep}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
