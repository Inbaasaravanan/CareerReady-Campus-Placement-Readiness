import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from '../layouts/PublicLayout';
import { StudentLayout } from '../layouts/StudentLayout';
import { StaffLayout } from '../layouts/StaffLayout';
import { HodLayout } from '../layouts/HodLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';

// Student Pages
import { StudentDashboard } from '../pages/student/StudentDashboard';
import { StudentProfile } from '../pages/student/StudentProfile';
import { StudentAssessment } from '../pages/student/StudentAssessment';
import { AptitudeQuiz } from '../pages/student/AptitudeQuiz';
import { TechnicalQuiz } from '../pages/student/TechnicalQuiz';
import { AssessmentResult } from '../pages/student/AssessmentResult';
import { StudentReadiness } from '../pages/student/StudentReadiness';
import { StudentCompanyMatching } from '../pages/student/StudentCompanyMatching';
import { StudentSkillGap } from '../pages/student/StudentSkillGap';

// Staff Pages
import { StaffDashboard } from '../pages/staff/StaffDashboard';
import { StaffStudents } from '../pages/staff/StaffStudents';
import { StaffReadiness } from '../pages/staff/StaffReadiness';
import { StaffAtRisk } from '../pages/staff/StaffAtRisk';
import { StaffCompanyMatching } from '../pages/staff/StaffCompanyMatching';
import { StaffSkillGaps } from '../pages/staff/StaffSkillGaps';
import { StaffProfile } from '../pages/staff/StaffProfile';

// HOD Pages
import { HodDashboard } from '../pages/hod/HodDashboard';
import { HodAnalytics } from '../pages/hod/HodAnalytics';
import { HodDepartments } from '../pages/hod/HodDepartments';
import { HodAtRisk } from '../pages/hod/HodAtRisk';
import { HodCompanies } from '../pages/hod/HodCompanies';
import { HodStaffMonitoring } from '../pages/hod/HodStaffMonitoring';
import { HodProfile } from '../pages/hod/HodProfile';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminUsers } from '../pages/admin/AdminUsers';
import { AdminStudents } from '../pages/admin/AdminStudents';
import { AdminStaff } from '../pages/admin/AdminStaff';
import { AdminHod } from '../pages/admin/AdminHod';
import { AdminApprovals } from '../pages/admin/AdminApprovals';
import { AdminDepartments } from '../pages/admin/AdminDepartments';
import { AdminCompanies } from '../pages/admin/AdminCompanies';
import { AdminSkills } from '../pages/admin/AdminSkills';
import { AdminQuestions } from '../pages/admin/AdminQuestions';
import { AdminSettings } from '../pages/admin/AdminSettings';
import {
  AdminCmsLayout,
  AdminMediaLibrary,
  AdminGlobalSettings,
  AdminCmsDashboardPage,
  AdminCmsLandingPage,
  AdminCmsAuthPage,
  AdminCmsStudentPage,
  AdminCmsStaffPage,
  AdminCmsHodPage,
  AdminCmsCompaniesPage,
  AdminCmsAssessmentsPage,
  AdminCmsReadinessPage,
  AdminCmsCompanyMatchingPage
} from '../pages/admin/cms';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/:role" element={<RegisterPage />} />
      </Route>

      {/* Student Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<StudentLayout />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/assessment" element={<StudentAssessment />} />
          <Route path="/student/assessment/aptitude" element={<AptitudeQuiz />} />
          <Route path="/student/assessment/technical" element={<TechnicalQuiz />} />
          <Route path="/student/assessment/result" element={<AssessmentResult />} />
          <Route path="/student/readiness" element={<StudentReadiness />} />
          <Route path="/student/company-matching" element={<StudentCompanyMatching />} />
          <Route path="/student/companies" element={<Navigate to="/student/company-matching" replace />} />
          <Route path="/student/skill-gap" element={<StudentSkillGap />} />
        </Route>
      </Route>

      {/* Placement Staff Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/students" element={<StaffStudents />} />
          <Route path="/staff/readiness" element={<StaffReadiness />} />
          <Route path="/staff/at-risk" element={<StaffAtRisk />} />
          <Route path="/staff/company-matching" element={<StaffCompanyMatching />} />
          <Route path="/staff/companies" element={<Navigate to="/staff/company-matching" replace />} />
          <Route path="/staff/skill-gaps" element={<StaffSkillGaps />} />
          <Route path="/staff/profile" element={<StaffProfile />} />
        </Route>
      </Route>

      {/* Placement HOD Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
        <Route element={<HodLayout />}>
          <Route path="/hod/dashboard" element={<HodDashboard />} />
          <Route path="/hod/analytics" element={<HodAnalytics />} />
          <Route path="/hod/departments" element={<HodDepartments />} />
          <Route path="/hod/at-risk" element={<HodAtRisk />} />
          <Route path="/hod/companies" element={<HodCompanies />} />
          <Route path="/hod/staff-monitoring" element={<HodStaffMonitoring />} />
          <Route path="/hod/mentor-assignments" element={<Navigate to="/hod/staff-monitoring" replace />} />
          <Route path="/hod/profile" element={<HodProfile />} />
        </Route>
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/staff" element={<AdminStaff />} />
          <Route path="/admin/hod" element={<AdminHod />} />
          <Route path="/admin/approvals" element={<AdminApprovals />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/skills" element={<AdminSkills />} />
          <Route path="/admin/questions" element={<AdminQuestions />} />
          <Route path="/admin/settings" element={<AdminSettings />} />

          {/* Admin CMS Management Routes */}
          <Route path="/admin/cms" element={<AdminCmsLayout />}>
            <Route index element={<Navigate to="/admin/cms/landing" replace />} />
            <Route path="landing" element={<AdminCmsLandingPage />} />
            <Route path="auth" element={<AdminCmsAuthPage />} />
            <Route path="student" element={<AdminCmsStudentPage />} />
            <Route path="staff" element={<AdminCmsStaffPage />} />
            <Route path="hod" element={<AdminCmsHodPage />} />
            <Route path="companies" element={<AdminCmsCompaniesPage />} />
            <Route path="assessments" element={<AdminCmsAssessmentsPage />} />
            <Route path="readiness" element={<AdminCmsReadinessPage />} />
            <Route path="company-matching" element={<AdminCmsCompanyMatchingPage />} />
            <Route path="media" element={<AdminMediaLibrary />} />
            <Route path="settings" element={<AdminGlobalSettings />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
