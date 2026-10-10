import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import {
  BriefcaseIcon,
  CheckIcon,
  AlertTriangleIcon,
  SearchIcon,
  UserIcon,
  ArrowRightIcon
} from '../../components/common/Icons';

export const StaffCompanyMatching = () => {
  const [companies, setCompanies] = useState([]);
  const [totalCohortStudents, setTotalCohortStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Company for viewing eligible / evaluated students
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  // Filters within company eligible students view
  const [eligibilityFilter, setEligibilityFilter] = useState('ELIGIBLE'); // 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ALL'
  const [deptFilter, setDeptFilter] = useState('All');
  const [studentSearch, setStudentSearch] = useState('');
  const [departments, setDepartments] = useState([]);

  // Detailed Student Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyData, statsData, deptData] = await Promise.all([
        staffService.getCompanyAnalytics(),
        staffService.getDashboardStats().catch(() => ({ totalStudents: 0 })),
        adminService.getDepartments().catch(() => [])
      ]);
      setCompanies(companyData || []);
      setTotalCohortStudents(statsData?.totalStudents || 0);
      setDepartments(deptData || []);
    } catch (err) {
      setError(err?.message || 'Unable to load company matching data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanyStudents = async (comp, status = eligibilityFilter, dept = deptFilter, search = studentSearch) => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const params = {};
      if (status) params.status = status;
      if (dept && dept !== 'All') params.department = dept;
      if (search && search.trim()) params.search = search.trim();

      const data = await staffService.getEligibleStudentsForCompany(comp.companyId || comp.id, params);
      setStudentsList(data || []);
    } catch (err) {
      setStudentsError(err?.message || 'Unable to load candidate eligibility list for this company.');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleSelectCompany = (comp, initialStatus = 'ELIGIBLE') => {
    setSelectedCompany(comp);
    setEligibilityFilter(initialStatus);
    setDeptFilter('All');
    setStudentSearch('');
    loadCompanyStudents(comp, initialStatus, 'All', '');
  };

  const handleEligibilityFilterChange = (newStatus) => {
    setEligibilityFilter(newStatus);
    if (selectedCompany) {
      loadCompanyStudents(selectedCompany, newStatus, deptFilter, studentSearch);
    }
  };

  const handleDeptFilterChange = (newDept) => {
    setDeptFilter(newDept);
    if (selectedCompany) {
      loadCompanyStudents(selectedCompany, eligibilityFilter, newDept, studentSearch);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (selectedCompany) {
      loadCompanyStudents(selectedCompany, eligibilityFilter, deptFilter, studentSearch);
    }
  };

  const handleBackToCompanies = () => {
    setSelectedCompany(null);
    setStudentsList([]);
    setStudentsError(null);
    setSelectedStudentDetail(null);
  };

  if (loading) {
    return <LoadingState message="Loading company matching analytics and eligibility metrics from MySQL database..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Company Matching"
        description={error}
        onRetry={loadCompanies}
      />
    );
  }

  // ----------------------------------------------------
  // SUBVIEW: COMPANY ELIGIBLE STUDENTS
  // ----------------------------------------------------
  if (selectedCompany) {
    const compName = selectedCompany.companyName || selectedCompany.company || selectedCompany.name;
    const reqCgpa = selectedCompany.requiredCgpa != null ? selectedCompany.requiredCgpa.toFixed(1) : '7.0';
    const minApt = selectedCompany.minimumAptitudeScore != null ? selectedCompany.minimumAptitudeScore : 60;
    const minTech = selectedCompany.minimumTechnicalScore != null ? selectedCompany.minimumTechnicalScore : 60;
    const reqSkills = selectedCompany.requiredSkills || [];

    return (
      <div>
        {/* Back and Page Header */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleBackToCompanies}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}
          >
            &larr; Back to Corporate Partners
          </button>

          <PageHeader
            title={`${compName} — Candidate Eligibility & Matching`}
            subtitle={`Evaluation of student cohort against corporate hiring criteria for ${compName}.`}
          />
        </div>

        {/* Company Requirements Benchmark Card */}
        <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-bg-subtle)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                Company Recruitment Criteria
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 6px 0', color: 'var(--color-navy-950)' }}>
                {compName}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '600px' }}>
                {selectedCompany.description || 'Enterprise Technology Partner'}
              </p>
            </div>

            {/* Benchmark Cutoffs Grid */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ background: '#FFFFFF', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>REQUIRED CGPA</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {reqCgpa}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>MIN APTITUDE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {minApt}%</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>MIN TECHNICAL</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {minTech}%</div>
              </div>
            </div>
          </div>

          {/* Required Skills list */}
          {reqSkills.length > 0 && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Required Skill Competencies:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {reqSkills.map((sk, skIdx) => (
                  <span
                    key={skIdx}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#FFFFFF',
                      border: '1px solid var(--color-border)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      color: 'var(--color-navy-900)'
                    }}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            
            {/* Eligibility Tabs (Eligible Only, Not Eligible, All Students) */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${eligibilityFilter === 'ELIGIBLE' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleEligibilityFilterChange('ELIGIBLE')}
              >
                Eligible Students Only
              </button>
              <button
                type="button"
                className={`btn btn-sm ${eligibilityFilter === 'NOT_ELIGIBLE' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleEligibilityFilterChange('NOT_ELIGIBLE')}
              >
                Not Eligible Students
              </button>
              <button
                type="button"
                className={`btn btn-sm ${eligibilityFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleEligibilityFilterChange('ALL')}
              >
                All Students
              </button>
            </div>

            {/* Department and Search Filter */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-control"
                value={deptFilter}
                onChange={(e) => handleDeptFilterChange(e.target.value)}
                style={{ width: '160px' }}
              >
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

              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search candidate name or reg..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: '220px', paddingLeft: '30px' }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
                  <SearchIcon width={14} height={14} />
                </span>
              </div>

              <Button type="submit" variant="primary" size="sm">Search</Button>
            </form>
          </div>
        </div>

        {/* Results List */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">
                {eligibilityFilter === 'ELIGIBLE' ? 'Eligible Candidates' : eligibilityFilter === 'NOT_ELIGIBLE' ? 'Ineligible Candidates' : 'Evaluated Cohort'}
              </h3>
              <p className="form-hint">
                {eligibilityFilter === 'ELIGIBLE'
                  ? `Showing only candidates who satisfy all academic, assessment, and mandatory skill cutoffs for ${compName}`
                  : `Cohort evaluation results benchmarked against ${compName}`}
              </p>
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              {studentsList.length} Students
            </span>
          </div>

          {studentsLoading ? (
            <LoadingState message={`Evaluating student cohort compatibility for ${compName}...`} />
          ) : studentsError ? (
            <ErrorState title="Error Loading Students" description={studentsError} onRetry={() => loadCompanyStudents(selectedCompany)} />
          ) : studentsList.length === 0 ? (
            <EmptyState
              title={eligibilityFilter === 'ELIGIBLE'
                ? "No students currently meet this company's eligibility requirements."
                : "No students found matching the selected criteria."}
              description={`Currently no students satisfy the applicable cutoffs (CGPA >= ${reqCgpa}, Aptitude >= ${minApt}%, Technical >= ${minTech}%, and mandatory skills).`}
              actionLabel="View All Students"
              onAction={() => handleEligibilityFilterChange('ALL')}
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Reg No</th>
                    <th>Department</th>
                    <th>CGPA</th>
                    <th>Aptitude</th>
                    <th>Technical</th>
                    <th>Matched Skills</th>
                    <th>Skill Gaps</th>
                    <th>Match %</th>
                    <th>Eligibility Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((st, idx) => {
                    const isEligible = st.isEligible || st.eligibilityStatus === 'Eligible';
                    const statusVariant = isEligible ? 'eligible' : st.eligibilityStatus === 'Borderline' ? 'needs-improvement' : 'not eligible';

                    return (
                      <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudentDetail(st)}>
                        <td>
                          <strong style={{ color: 'var(--color-navy-950)' }}>
                            {st.studentName || st.name}
                          </strong>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                          {st.registerNumber || '-'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                            {st.department || st.departmentName || 'Not Provided'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: (st.cgpa != null && st.cgpa >= reqCgpa) ? 'var(--color-navy-950)' : 'var(--status-at-risk-bar)' }}>
                            {st.cgpa != null ? st.cgpa.toFixed(2) : '-'}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: (st.aptitudeScore != null && st.aptitudeScore >= minApt) ? 'var(--color-navy-950)' : 'var(--color-text-muted)' }}>
                            {st.aptitudeScore != null ? `${st.aptitudeScore}%` : 'Not completed'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: (st.technicalScore != null && st.technicalScore >= minTech) ? 'var(--color-navy-950)' : 'var(--color-text-muted)' }}>
                            {st.technicalScore != null ? `${st.technicalScore}%` : 'Not completed'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
                            {st.matchedSkills && st.matchedSkills.length > 0 ? (
                              st.matchedSkills.slice(0, 3).map((ms, msIdx) => (
                                <span key={msIdx} className="skill-matched-box" style={{ fontSize: '0.6875rem' }}>
                                  {ms}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>None</span>
                            )}
                            {st.matchedSkills && st.matchedSkills.length > 3 && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                +{st.matchedSkills.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '180px' }}>
                            {st.skillGaps && st.skillGaps.length > 0 ? (
                              st.skillGaps.slice(0, 2).map((gs, gsIdx) => (
                                <span key={gsIdx} className="skill-gap-box" style={{ fontSize: '0.6875rem' }}>
                                  {gs}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--status-highly-ready-text)', fontWeight: 600 }}>None</span>
                            )}
                            {st.skillGaps && st.skillGaps.length > 2 && (
                              <span style={{ fontSize: '0.6875rem', color: 'var(--status-at-risk-bar)', fontWeight: 600 }}>
                                +{st.skillGaps.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.9375rem', color: (st.matchPercentage || 0) >= 70 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                            {st.matchPercentage || 0}%
                          </strong>
                        </td>
                        <td>
                          <Badge status={statusVariant}>
                            {st.eligibilityStatus || (isEligible ? 'Eligible' : 'Not Eligible')}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentDetail(st);
                            }}
                          >
                            Details
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

        {/* Student Detailed Breakdown Modal */}
        <Modal
          isOpen={Boolean(selectedStudentDetail)}
          onClose={() => setSelectedStudentDetail(null)}
          title={`Candidate Compatibility: ${selectedStudentDetail?.studentName || selectedStudentDetail?.name}`}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedStudentDetail(null)}>
                Close
              </Button>
            </div>
          }
        >
          {selectedStudentDetail && (
            <div>
              {/* Profile Bar */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--color-border)',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
                    {selectedStudentDetail.studentName || selectedStudentDetail.name}
                  </h4>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Reg No: <strong>{selectedStudentDetail.registerNumber || 'Not Provided'}</strong> &bull; Dept: <strong>{selectedStudentDetail.department || selectedStudentDetail.departmentName || 'Not Provided'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="company-match-metric" style={{ padding: '4px 12px' }}>
                    <span className="company-match-number">{selectedStudentDetail.matchPercentage || 0}%</span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Match Score</span>
                  </div>
                  <Badge status={selectedStudentDetail.isEligible ? 'eligible' : 'not eligible'}>
                    {selectedStudentDetail.eligibilityStatus || (selectedStudentDetail.isEligible ? 'Eligible' : 'Not Eligible')}
                  </Badge>
                </div>
              </div>

              {/* Benchmark vs Student Scores Comparison Grid */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  Hiring Benchmark Comparison
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {/* CGPA */}
                  <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Cumulative CGPA</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px' }}>
                      {selectedStudentDetail.cgpa != null ? selectedStudentDetail.cgpa.toFixed(2) : '-'}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        (Req: &ge; {reqCgpa})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', marginTop: '4px', fontWeight: 600, color: (selectedStudentDetail.cgpa != null && selectedStudentDetail.cgpa >= reqCgpa) ? 'var(--status-highly-ready-bar)' : 'var(--status-at-risk-bar)' }}>
                      {(selectedStudentDetail.cgpa != null && selectedStudentDetail.cgpa >= reqCgpa) ? '✓ Requirement Met' : '✗ Below Cutoff'}
                    </div>
                  </div>

                  {/* Aptitude */}
                  <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Aptitude Assessment</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px' }}>
                      {selectedStudentDetail.aptitudeScore != null ? `${selectedStudentDetail.aptitudeScore}%` : 'Not completed'}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        (Min: {minApt}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', marginTop: '4px', fontWeight: 600, color: (selectedStudentDetail.aptitudeScore != null && selectedStudentDetail.aptitudeScore >= minApt) ? 'var(--status-highly-ready-bar)' : 'var(--status-at-risk-bar)' }}>
                      {selectedStudentDetail.aptitudeScore == null ? '✗ Test Not Completed' : selectedStudentDetail.aptitudeScore >= minApt ? '✓ Requirement Met' : '✗ Below Cutoff'}
                    </div>
                  </div>

                  {/* Technical */}
                  <div style={{ padding: '12px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Technical Assessment</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, marginTop: '2px' }}>
                      {selectedStudentDetail.technicalScore != null ? `${selectedStudentDetail.technicalScore}%` : 'Not completed'}
                      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                        (Min: {minTech}%)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', marginTop: '4px', fontWeight: 600, color: (selectedStudentDetail.technicalScore != null && selectedStudentDetail.technicalScore >= minTech) ? 'var(--status-highly-ready-bar)' : 'var(--status-at-risk-bar)' }}>
                      {selectedStudentDetail.technicalScore == null ? '✗ Test Not Completed' : selectedStudentDetail.technicalScore >= minTech ? '✓ Requirement Met' : '✗ Below Cutoff'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Skills Matched vs Deficits */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {/* Matched Skills */}
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--status-highly-ready-bg)', border: '1px solid var(--status-highly-ready-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--status-highly-ready-text)', fontWeight: 700, fontSize: '0.875rem' }}>
                    <CheckIcon width={16} height={16} /> Matched Skills ({selectedStudentDetail.matchedSkills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedStudentDetail.matchedSkills && selectedStudentDetail.matchedSkills.length > 0 ? (
                      selectedStudentDetail.matchedSkills.map((sk, sIdx) => (
                        <span key={sIdx} className="skill-matched-box" style={{ fontSize: '0.75rem' }}>
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>None recorded</span>
                    )}
                  </div>
                </div>

                {/* Skill Gaps */}
                <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--status-at-risk-bg)', border: '1px solid var(--status-at-risk-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--status-at-risk-text)', fontWeight: 700, fontSize: '0.875rem' }}>
                    <AlertTriangleIcon width={16} height={16} /> Skill Deficits ({selectedStudentDetail.skillGaps?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedStudentDetail.skillGaps && selectedStudentDetail.skillGaps.length > 0 ? (
                      selectedStudentDetail.skillGaps.map((gap, gIdx) => (
                        <span key={gIdx} className="skill-gap-box" style={{ fontSize: '0.75rem' }}>
                          {gap}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-highly-ready-text)', fontWeight: 600 }}>No skill deficits for this company</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN VIEW: ALL COMPANIES CARDS / ROWS
  // ----------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Corporate Recruitment Readiness & Company Matching"
        subtitle={`Candidate eligibility and recruitment benchmarks evaluated across ${companies.length} corporate hiring partners.`}
      />

      {companies.length === 0 ? (
        <EmptyState
          title="No companies available."
          description="There are currently no partner companies configured in the MySQL Company table."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
          {companies.map((c, idx) => {
            const compId = c.companyId || c.id || idx + 1;
            const compName = c.companyName || c.company || c.name;
            const reqCgpa = c.requiredCgpa != null ? c.requiredCgpa.toFixed(1) : '7.0';
            const minApt = c.minimumAptitudeScore != null ? c.minimumAptitudeScore : 60;
            const minTech = c.minimumTechnicalScore != null ? c.minimumTechnicalScore : 60;
            const eligibleCount = c.eligibleStudents != null ? c.eligibleStudents : (c.eligibleStudentCount || 0);
            const totalStudents = c.totalStudents || totalCohortStudents || 0;
            const qualifiedPct = totalStudents > 0 ? Math.round((eligibleCount / totalStudents) * 100) : 0;
            const reqSkills = c.requiredSkills || [];

            return (
              <div
                key={idx}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div>
                  {/* Top Bar: Company Name & Avg Match */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-navy-950)' }}>
                        {compName}
                      </h3>
                      <p className="form-hint" style={{ marginTop: '2px', fontSize: '0.75rem' }}>
                        {c.description ? (c.description.length > 70 ? c.description.slice(0, 70) + '...' : c.description) : 'Corporate Hiring Partner'}
                      </p>
                    </div>
                    <div className="company-match-metric">
                      <span className="company-match-number">{c.averageMatchPercentage != null ? Math.round(c.averageMatchPercentage) : 0}%</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Avg Match</span>
                    </div>
                  </div>

                  {/* Benchmark Cutoffs Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-bg-subtle)',
                    marginBottom: '14px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Req CGPA</div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {reqCgpa}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Min Aptitude</div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {minApt}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Min Tech</div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>&ge; {minTech}%</div>
                    </div>
                  </div>

                  {/* Eligible Student Metric */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: eligibleCount > 0 ? 'var(--status-highly-ready-bg)' : 'var(--color-bg-subtle)',
                    border: eligibleCount > 0 ? '1px solid var(--status-highly-ready-border)' : '1px solid var(--color-border)',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600, display: 'block' }}>
                        Eligible Students Count:
                      </span>
                      <strong style={{ fontSize: '1.125rem', color: eligibleCount > 0 ? 'var(--status-highly-ready-text)' : 'var(--color-navy-950)' }}>
                        {eligibleCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>/ {totalStudents} candidates ({qualifiedPct}%)</span>
                      </strong>
                    </div>
                    <Badge status={eligibleCount > 0 ? 'ready' : 'needs improvement'}>
                      {eligibleCount > 0 ? `${eligibleCount} Eligible` : 'None Qualified'}
                    </Badge>
                  </div>

                  {/* Required Skills */}
                  <div className="company-section-block" style={{ marginBottom: '10px' }}>
                    <div className="company-section-label">Required Skills & Benchmark Levels</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {reqSkills.length > 0 ? (
                        reqSkills.map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              backgroundColor: '#FFFFFF',
                              border: '1px solid var(--color-border)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              color: 'var(--color-text-primary)'
                            }}
                          >
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Skills mapped in MySQL</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer with "View Eligible Students" Button */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleSelectCompany(c, 'ELIGIBLE')}
                  >
                    <BriefcaseIcon width={16} height={16} />
                    View Eligible Students ({eligibleCount})
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCompany(c, 'ALL')}
                    title="View all students evaluated against this company"
                  >
                    All Cohort
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
