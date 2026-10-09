import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { FileTextIcon } from '../../components/common/Icons';

export const StaffReports = () => {
  const reports = [
    {
      id: 'rep-01',
      title: 'Final Year Cohort Readiness Audit Report 2026',
      date: '2026-09-24',
      size: '2.4 MB',
      type: 'PDF Document',
      desc: 'Complete departmental evaluation with 480 candidate readiness scores and category breakdowns.'
    },
    {
      id: 'rep-02',
      title: 'At-Risk Candidates & Intervention Mandate',
      date: '2026-09-22',
      size: '1.1 MB',
      type: 'PDF Document',
      desc: '48 flagged students requiring intensive remedial programming and aptitude coaching.'
    },
    {
      id: 'rep-03',
      title: 'Company Cutoff Matching Matrix',
      date: '2026-09-18',
      size: '860 KB',
      type: 'Spreadsheet / CSV',
      desc: 'Eligibility mapping across TCS, Infosys, Accenture, Cisco, and Wipro campus recruitment drives.'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Placement Readiness Reports & Audits"
        subtitle="Formal academic documentation and institutional reports generated for recruitment coordination."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileTextIcon width={20} height={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '2px', maxWidth: '640px' }}>
                  {r.desc}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  Generated: {r.date} &bull; File Size: {r.size} &bull; Format: {r.type}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => alert(`Downloading verified report: ${r.title}`)}
            >
              Export Report
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
