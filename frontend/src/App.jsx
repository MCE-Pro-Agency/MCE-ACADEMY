import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LearnerGate from './components/LearnerGate';

import Landing from './pages/Landing';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

import ProfilPro from './pages/learner/ProfilPro';
import ProfilsSuivi from './pages/shared/ProfilsSuivi';

import TrainerDashboard from './pages/trainer/Dashboard';
import Learners from './pages/trainer/Learners';
import LearnerDetail from './pages/trainer/LearnerDetail';
import TrainerCourses from './pages/trainer/Courses';
import CourseEditor from './pages/trainer/CourseEditor';
import Submissions from './pages/trainer/Submissions';
import Announcements from './pages/trainer/Announcements';
import CompanySettings from './pages/trainer/CompanySettings';
import TrainerProgramme from './pages/trainer/Programme';
import TrainerDocuments from './pages/trainer/Documents';

import AdminDashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import Users from './pages/admin/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reinitialiser" element={<ResetPassword />} />

      {/* Espace apprenant : test de profil professionnel uniquement.
          Les formations, modules, programme et exercices sont développés dans l'espace Formateur
          (version précédente des pages apprenant : commit 4580c6d de la branche espace-apprenant). */}
      <Route element={<ProtectedRoute roles={['learner', 'trainer', 'admin']} />}>
       <Route element={<LearnerGate />}>
        <Route element={<AppLayout area="learner" />}>
          <Route path="/app" element={<Navigate to="/app/mon-profil" replace />} />
          <Route path="/app/mon-profil" element={<ProfilPro />} />
          <Route path="/app/profil" element={<Profile />} />
          <Route path="/app/*" element={<Navigate to="/app/mon-profil" replace />} />
        </Route>
       </Route>
      </Route>

      {/* Espace formateur : gestion de l'entreprise */}
      <Route element={<ProtectedRoute roles={['trainer', 'admin']} needsCompany />}>
        <Route element={<AppLayout area="trainer" />}>
          <Route path="/formateur" element={<TrainerDashboard />} />
          <Route path="/formateur/apprenants" element={<Learners />} />
          <Route path="/formateur/apprenants/:userId" element={<LearnerDetail />} />
          <Route path="/formateur/programme" element={<TrainerProgramme />} />
          <Route path="/formateur/documents" element={<TrainerDocuments />} />
          <Route path="/formateur/cours" element={<TrainerCourses />} />
          <Route path="/formateur/cours/:courseId" element={<CourseEditor />} />
          <Route path="/formateur/corrections" element={<Submissions />} />
          <Route path="/formateur/profils" element={<ProfilsSuivi scope="trainer" />} />
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
          <Route path="/admin/formateurs" element={<Users fixedRole="trainer" />} />
          <Route path="/admin/apprenants" element={<Users fixedRole="learner" />} />
          <Route path="/admin/utilisateurs" element={<Users />} />
          <Route path="/admin/profils" element={<ProfilsSuivi scope="admin" />} />
          <Route path="/admin/apprenants/:userId" element={<LearnerDetail base="/admin" />} />
          <Route path="/admin/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin : vues qui nécessitent une entreprise sélectionnée */}
      <Route element={<ProtectedRoute roles={['admin']} needsCompany />}>
        <Route element={<AppLayout area="admin" />}>
          <Route path="/admin/programme" element={<TrainerProgramme base="/admin" />} />
          <Route path="/admin/documents" element={<TrainerDocuments />} />
        </Route>
      </Route>

      <Route path="/accueil" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
