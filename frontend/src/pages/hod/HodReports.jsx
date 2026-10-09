import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { FileTextIcon } from '../../components/common/Icons';

export const HodReports = () => {
  const reports = [
    {
      id: 'hod-rep-01',
      title: 'Institutional Placement Readiness Comprehensive Audit 2026',
      date: '2026-09-24',
      size: '4.8 MB',
      type: 'Executive PDF',
      desc: 'All-inclusive analysis of 480 students across 4 departments, predictive hireability matrix, and multi-year comparisons.'
    },
    {
      id: 'hod-rep-02',
      title: 'Department-Level Placement Readiness Indices',
      date: '2026-09-23',
      size: '2.1 MB',
      type: 'Executive PDF',
      desc: 'CSE, IT, ECE, and MECH breakdown including academic averages, skill deficits, and drive preparedness.'
    },
    {
      id: 'hod-rep-03',
      title: 'Recruiter Drive Compatibility & Package Readiness Study',
      date: '2026-09-20',
      size: '1.9 MB',
      type: 'Data Spreadsheet',
      desc: 'Mapping of student competency cohorts to Tier-1, Tier-2, and product recruitment CTC brackets.'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Executive Placement Audit Reports"
        subtitle="Formal compliance, departmental accreditations, and institutional readiness records."
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
                  Published: {r.date} &bull; File Size: {r.size} &bull; {r.type}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => alert(`Exporting Executive Report: ${r.title}`)}
            >
              Export Executive Brief
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
