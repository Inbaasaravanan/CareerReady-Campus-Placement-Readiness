import React from 'react';
import { AdminCmsPageEditor } from './AdminCmsPageEditor';

export const AdminCmsDashboardPage = () => (
  <AdminCmsPageEditor
    pageKey="STUDENT_DASHBOARD"
    pageTitle="Student Dashboard CMS"
    pageDescription="Customize student dashboard banners, journey step headings, guidance text, and metric card labels."
  />
);

export const AdminCmsLandingPage = () => (
  <AdminCmsPageEditor
    pageKey="LANDING"
    pageTitle="Public Landing Page CMS"
    pageDescription="Customize hero banners, value propositions, features highlights, call-to-actions, and marketing copy."
  />
);

export const AdminCmsAuthPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <AdminCmsPageEditor
      pageKey="LOGIN"
      pageTitle="Sign In Page Content"
      pageDescription="Customize login card headings, field labels, button labels, and prompt links."
    />
    <AdminCmsPageEditor
      pageKey="REGISTER"
      pageTitle="Student Registration Page Content"
      pageDescription="Customize registration headers, instructions, button labels, and redirect notices."
    />
  </div>
);

export const AdminCmsStudentPage = () => (
  <AdminCmsPageEditor
    pageKey="STUDENT_DASHBOARD"
    pageTitle="Student Pages Informational Content"
    pageDescription="Manage student workflow headings, journey steps, and evaluation guidance."
  />
);

export const AdminCmsStaffPage = () => (
  <AdminCmsPageEditor
    pageKey="STAFF_DASHBOARD"
    pageTitle="Placement Staff Informational Content"
    pageDescription="Customize headers, descriptive text, and guidance across Placement Staff workflows."
  />
);

export const AdminCmsHodPage = () => (
  <AdminCmsPageEditor
    pageKey="HOD_DASHBOARD"
    pageTitle="Placement HOD Informational Content"
    pageDescription="Customize institutional analytics headers, descriptions, and executive summaries."
  />
);

export const AdminCmsCompaniesPage = () => (
  <AdminCmsPageEditor
    pageKey="COMPANIES"
    pageTitle="Companies Presentation Content"
    pageDescription="Customize drive announcements, recruitment instructions, eligibility notices, and company matching introductory content."
  />
);

export const AdminCmsAssessmentsPage = () => (
  <AdminCmsPageEditor
    pageKey="ASSESSMENT"
    pageTitle="Assessment Hub & MCQ Module Instructions"
    pageDescription="Customize assessment hub title, Aptitude and Technical instructions, duration notices, and submission prompts."
  />
);

export const AdminCmsReadinessPage = () => (
  <AdminCmsPageEditor
    pageKey="READINESS"
    pageTitle="Placement Readiness & Rubric Descriptions"
    pageDescription="Customize readiness titles, empty-state prompts, trajectory notices, and institutional rubric descriptions (Highly Ready, Ready, Needs Improvement, At Risk)."
  />
);

export const AdminCmsCompanyMatchingPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <AdminCmsPageEditor
      pageKey="COMPANY_MATCHING"
      pageTitle="Company Compatibility Page CMS"
      pageDescription="Customize company card section labels (Matched Skills, Skill Gaps), empty states, and recruiter match guidance."
    />
    <AdminCmsPageEditor
      pageKey="SKILL_GAP"
      pageTitle="Skill Gap Analysis Page CMS"
      pageDescription="Customize skill gap page headers, benchmarks description, and improvement notices."
    />
  </div>
);
