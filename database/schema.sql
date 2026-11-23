-- =====================================================================
--  MCE ACADEMY — Base MySQL 8 (remplace Supabase)
--  Rôles : admin / trainer (formateur) / learner (apprenant)
--  Création :  mysql -u root -p < database/schema.sql
--  ou automatiquement :  cd server && npm run db:init
--  Les règles d'accès par rôle sont appliquées par l'API Node.js (server/src/policies.js).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS mce_academy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mce_academy;

-- Entreprises clientes
CREATE TABLE IF NOT EXISTS companies (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  name           VARCHAR(190) NOT NULL,
  slug           VARCHAR(190) NOT NULL,
  logo_url       TEXT,
  sector         VARCHAR(190),
  contact_email  VARCHAR(190),
  max_learners   INT,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  -- Espace apprenant : 'test' = seul le test de profil est ouvert ; 'complet' = modules, programme, mémos, documents
  learner_space  ENUM('test','complet') NOT NULL DEFAULT 'complet',
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY companies_slug_uq (slug)
) ENGINE=InnoDB;

-- Utilisateurs (compte + profil)
CREATE TABLE IF NOT EXISTS profiles (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id     CHAR(36)     NULL,
  role           ENUM('admin','trainer','learner') NOT NULL DEFAULT 'learner',
  full_name      VARCHAR(190) NOT NULL DEFAULT '',
  email          VARCHAR(190) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  avatar_url     TEXT,
  job_title      VARCHAR(190),
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_seen_at   DATETIME(3)  NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY profiles_email_uq (email),
  KEY profiles_company_idx (company_id),
  CONSTRAINT profiles_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Cours
CREATE TABLE IF NOT EXISTS courses (
  id                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id         CHAR(36)     NOT NULL,
  title              VARCHAR(255) NOT NULL,
  subtitle           VARCHAR(255),
  description        MEDIUMTEXT,
  cover_url          TEXT,
  category           VARCHAR(190),
  level              ENUM('debutant','intermediaire','avance') NOT NULL DEFAULT 'debutant',
  estimated_minutes  INT          NOT NULL DEFAULT 0,
  is_published       TINYINT(1)   NOT NULL DEFAULT 0,
  created_by         CHAR(36)     NULL,
  created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY courses_company_idx (company_id),
  CONSTRAINT courses_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT courses_creator_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Modules (chapitres)
CREATE TABLE IF NOT EXISTS modules (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  course_id    CHAR(36)     NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  position     INT          NOT NULL DEFAULT 0,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY modules_course_idx (course_id),
  CONSTRAINT modules_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Réglages de déblocage des modules
CREATE TABLE IF NOT EXISTS module_settings (
  module_id         CHAR(36)    NOT NULL,
  mode              ENUM('open','closed','date','sequential') NOT NULL DEFAULT 'open',
  opens_at          DATE        NULL,
  requires_profile  TINYINT(1)  NOT NULL DEFAULT 0,
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (module_id),
  CONSTRAINT module_settings_module_fk FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Leçons
CREATE TABLE IF NOT EXISTS lessons (
  id                CHAR(36)     NOT NULL DEFAULT (UUID()),
  module_id         CHAR(36)     NOT NULL,
  course_id         CHAR(36)     NOT NULL,
  title             VARCHAR(255) NOT NULL,
  type              ENUM('video','text','quiz','exercise','document') NOT NULL DEFAULT 'text',
  content           MEDIUMTEXT,
  video_url         TEXT,
  file_url          TEXT,
  duration_minutes  INT          NOT NULL DEFAULT 5,
  passing_score     INT          NOT NULL DEFAULT 70,
  position          INT          NOT NULL DEFAULT 0,
  created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY lessons_module_idx (module_id),
  KEY lessons_course_idx (course_id),
  CONSTRAINT lessons_module_fk FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  CONSTRAINT lessons_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Questions de quiz (visibles par l'apprenant)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id         CHAR(36) NOT NULL DEFAULT (UUID()),
  lesson_id  CHAR(36) NOT NULL,
  question   TEXT     NOT NULL,
  options    JSON     NOT NULL,
  position   INT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY quiz_questions_lesson_idx (lesson_id),
  CONSTRAINT quiz_questions_lesson_fk FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bonnes réponses (jamais envoyées aux apprenants)
CREATE TABLE IF NOT EXISTS quiz_answers (
  question_id    CHAR(36) NOT NULL,
  correct_index  INT      NOT NULL DEFAULT 0,
  explanation    TEXT,
  PRIMARY KEY (question_id),
  CONSTRAINT quiz_answers_question_fk FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Inscriptions
CREATE TABLE IF NOT EXISTS enrollments (
  id            CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)    NOT NULL,
  course_id     CHAR(36)    NOT NULL,
  enrolled_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at  DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY enrollments_user_course_uq (user_id, course_id),
  KEY enrollments_course_idx (course_id),
  CONSTRAINT enrollments_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT enrollments_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Progression par leçon
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id             CHAR(36)    NOT NULL,
  lesson_id           CHAR(36)    NOT NULL,
  course_id           CHAR(36)    NOT NULL,
  completed           TINYINT(1)  NOT NULL DEFAULT 0,
  completed_at        DATETIME(3) NULL,
  time_spent_seconds  INT         NOT NULL DEFAULT 0,
  last_viewed_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, lesson_id),
  KEY lesson_progress_course_idx (course_id),
  CONSTRAINT lesson_progress_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT lesson_progress_lesson_fk FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT lesson_progress_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tentatives de quiz
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id               CHAR(36)      NOT NULL DEFAULT (UUID()),
  user_id          CHAR(36)      NOT NULL,
  lesson_id        CHAR(36)      NOT NULL,
  course_id        CHAR(36)      NOT NULL,
  score            DECIMAL(5,2)  NOT NULL DEFAULT 0,
  correct_count    INT           NOT NULL DEFAULT 0,
  total_questions  INT           NOT NULL DEFAULT 0,
  passed           TINYINT(1)    NOT NULL DEFAULT 0,
  answers          JSON          NULL,
  created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY quiz_attempts_user_idx (user_id),
  CONSTRAINT quiz_attempts_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT quiz_attempts_lesson_fk FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT quiz_attempts_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Rendus d'exercices (notés sur 20 par le formateur)
CREATE TABLE IF NOT EXISTS exercise_submissions (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)     NOT NULL,
  lesson_id     CHAR(36)     NOT NULL,
  course_id     CHAR(36)     NOT NULL,
  content       MEDIUMTEXT,
  file_url      TEXT,
  status        ENUM('submitted','graded','returned') NOT NULL DEFAULT 'submitted',
  grade         DECIMAL(4,2) NULL,
  feedback      TEXT,
  graded_by     CHAR(36)     NULL,
  submitted_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  graded_at     DATETIME(3)  NULL,
  PRIMARY KEY (id),
  UNIQUE KEY submissions_user_lesson_uq (user_id, lesson_id),
  KEY submissions_course_idx (course_id),
  CONSTRAINT submissions_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT submissions_lesson_fk FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  CONSTRAINT submissions_course_fk FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT submissions_grader_fk FOREIGN KEY (graded_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT submissions_grade_chk CHECK (grade IS NULL OR (grade >= 0 AND grade <= 20))
) ENGINE=InnoDB;

-- Sessions de connexion (temps passé)
CREATE TABLE IF NOT EXISTS user_sessions (
  id                CHAR(36)    NOT NULL DEFAULT (UUID()),
  user_id           CHAR(36)    NOT NULL,
  company_id        CHAR(36)    NULL,
  started_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_ping_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  duration_seconds  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY user_sessions_user_idx (user_id, last_ping_at),
  KEY user_sessions_company_idx (company_id, started_at),
  CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT user_sessions_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Annonces aux apprenants d'une entreprise
CREATE TABLE IF NOT EXISTS announcements (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id  CHAR(36)     NOT NULL,
  author_id   CHAR(36)     NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY announcements_company_idx (company_id, created_at),
  CONSTRAINT announcements_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT announcements_author_fk FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Profil professionnel (test 25 min) : passations, brouillon, observations du formateur
CREATE TABLE IF NOT EXISTS profile_assessments (
  user_id     CHAR(36)    NOT NULL,
  runs        JSON        NOT NULL,
  draft       JSON        NULL,
  retake      TINYINT(1)  NOT NULL DEFAULT 0,
  comment     TEXT,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT profile_assessments_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Documents de l'espace « Mes documents »
--   user_id NULL  → document commun à tous les apprenants de l'entreprise (support, livret…)
--   user_id défini → document personnel (e-book individuel, attestation remise…)
CREATE TABLE IF NOT EXISTS documents (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id    CHAR(36)     NOT NULL,
  user_id       CHAR(36)     NULL,
  kind          ENUM('support','livret','ebook','attestation','autre') NOT NULL DEFAULT 'autre',
  title         VARCHAR(255) NOT NULL,
  description   VARCHAR(500) NULL,
  file_url      TEXT         NOT NULL,
  is_available  TINYINT(1)   NOT NULL DEFAULT 1,
  created_by    CHAR(36)     NULL,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY documents_company_idx (company_id),
  KEY documents_user_idx (user_id),
  CONSTRAINT documents_company_fk FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT documents_user_fk FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT documents_author_fk FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB;
