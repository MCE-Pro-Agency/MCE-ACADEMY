import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

import ProfilPro from './pages/learner/ProfilPro';
import LearnerTab from './pages/learner/LearnerTab';
import ProfilsSuivi from './pages/shared/ProfilsSuivi';

import TrainerDashboard from './pages/trainer/Dashboard';
import Learners from './pages/trainer/Learners';
import LearnerDetail from './pages/trainer/LearnerDetail';
import TrainerCourses from './pages/trainer/Courses';
import CourseEditor from './pages/trainer/CourseEditor';
import TrainerModuleDetail from './pages/trainer/ModuleDetail';
import Submissions from './pages/trainer/Submissions';
import Announcements from './pages/trainer/Announcements';
import CompanySettings from './pages/trainer/CompanySettings';
import TrainerProgramme from './pages/trainer/Programme';
import TrainerDocuments from './pages/trainer/Documents';
import TrainerExercises from './pages/trainer/Exercises';
import TrainerActivities from './pages/trainer/Activities';
import TrainerReports from './pages/trainer/Reports';
import AccessManagement from './pages/trainer/AccessManagement';

import AdminDashboard from './pages/admin/Dashboard';
import Companies from './pages/admin/Companies';
import AdminCompanyHubV1 from './pages/admin/AdminCompanyHubV1';
import TrainerAssignments from './pages/admin/TrainerAssignments';
import Users from './pages/admin/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/inscription" element={<Signup />} />
      <Route path="/reinitialiser" element={<ResetPassword />} />

      {/* Espace apprenant : test de profil professionnel uniquement.
          Les formations, modules, programme et exercices sont dÃ©veloppÃ©s dans l'espace Formateur
          (version prÃ©cÃ©dente des pages apprenant : commit 4580c6d de la branche espace-apprenant). */}
      <Route element={<ProtectedRoute roles={['learner', 'trainer', 'admin']} />}>
        <Route element={<AppLayout area="learner" />}>
          <Route path="/app" element={<Navigate to="/app/mon-profil" replace />} />
          <Route path="/app/mon-profil" element={<ProfilPro />} />
          <Route path="/app/annonces" element={<LearnerTab tabKey="annonces" />} />
          <Route path="/app/documents" element={<LearnerTab tabKey="documents" />} />
          <Route path="/app/exercices" element={<LearnerTab tabKey="exercices" />} />
          <Route path="/app/quiz" element={<LearnerTab tabKey="quiz" />} />
          <Route path="/app/cours" element={<LearnerTab tabKey="cours" />} />
          <Route path="/app/parcours" element={<LearnerTab tabKey="parcours" />} />
          <Route path="/app/profil" element={<Profile />} />
          {LEARNER_TABS.map((t) => <Route key={t.key} path={t.to} element={<LearnerTab tabKey={t.key} />} />)}
          <Route path="/app/*" element={<Navigate to="/app/mon-profil" replace />} />
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
          <Route path="/formateur/cours/:courseId/modules/:moduleId" element={<TrainerModuleDetail />} />
          <Route path="/formateur/corrections" element={<Submissions />} />
          <Route path="/formateur/exercices" element={<TrainerExercises />} />
          <Route path="/formateur/activites" element={<TrainerActivities />} />
          <Route path="/formateur/rapports" element={<TrainerReports />} />
          <Route path="/formateur/acces" element={<AccessManagement />} />
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
          <Route path="/admin/gestion-entreprises" element={<AdminCompanyHubV1 />} />
          <Route path="/admin/affectations" element={<TrainerAssignments />} />
          <Route path="/admin/formateurs" element={<Users fixedRole="trainer" />} />
          <Route path="/admin/apprenants" element={<Users fixedRole="learner" />} />
          <Route path="/admin/utilisateurs" element={<Users />} />
          <Route path="/admin/profils" element={<ProfilsSuivi scope="admin" />} />
          <Route path="/admin/apprenants/:userId" element={<LearnerDetail base="/admin" />} />
          <Route path="/admin/profil" element={<Profile />} />
        </Route>
      </Route>

      {/* Admin : vues qui nÃ©cessitent une entreprise sÃ©lectionnÃ©e */}
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
