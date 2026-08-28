import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleSuccess from './pages/GoogleSuccess';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import UploadResumes from './pages/UploadResumes';
import CandidateRanking from './pages/CandidateRanking';
import CandidateDetails from './pages/CandidateDetails';
import CandidateComparison from './pages/CandidateComparison';
import FairnessDashboard from './pages/FairnessDashboard';
import AuditDashboard from './pages/AuditDashboard';
import EvaluationDashboard from './pages/EvaluationDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import CandidateProfile from './pages/CandidateProfile';
import CandidateInterviews from './pages/CandidateInterviews';
import RecruiterApplications from './pages/RecruiterApplications';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  return <Navigate to={user.role === 'candidate' ? '/candidate/dashboard' : '/dashboard'} replace />;
}

function DashboardIndex() {
  const { user } = useAuth();
  if (user?.role === 'candidate') {
    return <Navigate to="/candidate/dashboard" replace />;
  }
  return <Dashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/auth/google/success" element={<GoogleSuccess />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardIndex /></PrivateRoute>} />
      <Route path="/candidate/dashboard" element={<PrivateRoute><CandidateDashboard /></PrivateRoute>} />
      <Route path="/candidate/profile" element={<PrivateRoute><CandidateProfile /></PrivateRoute>} />
      <Route path="/candidate/interviews" element={<PrivateRoute><CandidateInterviews /></PrivateRoute>} />
      <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
      <Route path="/jobs/create" element={<PrivateRoute><CreateJob /></PrivateRoute>} />
      <Route path="/jobs/applications" element={<PrivateRoute><RecruiterApplications /></PrivateRoute>} />
      <Route path="/jobs/:jobId/applications" element={<PrivateRoute><RecruiterApplications /></PrivateRoute>} />
      <Route path="/jobs/:jobId/upload" element={<Navigate to="/jobs/applications" replace />} />
      <Route path="/jobs/:jobId/ranking" element={<PrivateRoute><CandidateRanking /></PrivateRoute>} />
      <Route path="/jobs/:jobId/candidate/:candidateId" element={<PrivateRoute><CandidateDetails /></PrivateRoute>} />
      <Route path="/jobs/:jobId/compare" element={<PrivateRoute><CandidateComparison /></PrivateRoute>} />
      <Route path="/jobs/:jobId/fairness" element={<PrivateRoute><FairnessDashboard /></PrivateRoute>} />
      <Route path="/audit" element={<PrivateRoute><AuditDashboard /></PrivateRoute>} />
      <Route path="/jobs/:jobId/evaluation" element={<PrivateRoute><EvaluationDashboard /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import MobileNav from './components/MobileNav';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <AppRoutes />
        <MobileNav />
      </BrowserRouter>
    </AuthProvider>
  );
}
