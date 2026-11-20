import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

import LearnerDashboard from './pages/learner/Dashboard';
import Catalog from './pages/learner/Catalog';
import CourseDetail from './pages/learner/CourseDetail';
import LessonPlayer from './pages/learner/LessonPlayer';
import Grades from './pages/learner/Grades';
import Certificate from './pages/learner/Certificate';

import TrainerDashboard from './pages/trainer/Dashboard';
import Learners from './pages/trainer/Learners';
import LearnerDetail from './pages/trainer/LearnerDetail';
import TrainerCourses from './pages/trainer/Courses';
import CourseEditor from './pages/trainer/CourseEditor';
import Submissions from './pages/trainer/Submissions';
import Announcements from './pages/trainer/Announcements';
import CompanySettings from './pages/trainer/CompanySettings';

import AdminDashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import Users from './pages/admin/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reinitialiser" element={<ResetPassword />} />

      {/* Espace apprenant (accessible aussi aux formateurs/admin pour l'aperçu) */}
      <Route element={<ProtectedRoute roles={['learner', 'trainer', 'admin']} />}>
        <Route path="/app/cours/:courseId/lecon/:lessonId" element={<LessonPlayer />} />
        <Route path="/app/certificat/:courseId" element={<Certificate />} />
        <Route element={<AppLayout area="learner" />}>
          <Route path="/app" element={<LearnerDashboard />} />
          <Route path="/app/catalogue" element={<Catalog />} />
          <Route path="/app/cours/:courseId" element={<CourseDetail />} />
          <Route path="/app/notes" element={<Grades />} />
          <Route path="/app/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Espace formateur : gestion de l'entreprise */}
      <Route element={<ProtectedRoute roles={['trainer', 'admin']} needsCompany />}>
        <Route element={<AppLayout area="trainer" />}>
          <Route path="/formateur" element={<TrainerDashboard />} />
          <Route path="/formateur/apprenants" element={<Learners />} />
          <Route path="/formateur/apprenants/:userId" element={<LearnerDetail />} />
          <Route path="/formateur/cours" element={<TrainerCourses />} />
          <Route path="/formateur/cours/:courseId" element={<CourseEditor />} />
          <Route path="/formateur/corrections" element={<Submissions />} />
          <Route path="/formateur/annonces" element={<Announcements />} />
          <Route path="/formateur/entreprise" element={<CompanySettings />} />
          <Route path="/formateur/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Administration de la plateforme */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppLayout area="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/entreprises" element={<Companies />} />
          <Route path="/admin/utilisateurs" element={<Users />} />
          <Route path="/admin/profil" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/accueil" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
