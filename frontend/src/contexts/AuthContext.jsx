
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../lib/db';
import { syncStores, clearStores } from '../lib/stores';

const AuthContext = createContext(null);
const HEARTBEAT_SECONDS = 60;
const ACTIVE_COMPANY_KEY = 'mce_active_company';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(() => localStorage.getItem(ACTIVE_COMPANY_KEY));
  const [authorizedCompanies, setAuthorizedCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const activeLessonRef = useRef(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setCompany(null);
      setAuthorizedCompanies([]);
      setSelectedCompanyId(null);
      clearStores();
      return;
    }

    // V4 : relation explicite pour éviter l'erreur PGRST201.
    // La relation principale est profiles.company_id -> companies.id.
    const { data, error } = await db
      .from('profiles')
      .select('*, company:companies!profiles_company_id_fkey(*)')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur de chargement du profil MCE Academy :', error);
      setProfile(null);
      setCompany(null);
      return;
    }

    if (data) {
      const { company: c, ...p } = data;
      setProfile(p);
      setCompany(c || null);
      syncStores().catch((err) => {
        console.warn('Synchronisation des données MCE Academy :', err);
      });
    } else {
      setProfile(null);
      setCompany(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    db.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      await loadProfile(data.session?.user?.id);

      if (mounted) {
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Erreur de récupération de session :', error);
      if (mounted) setLoading(false);
    });

    const { data: sub } = db.auth.onAuthStateChange((event, s) => {
      setSession(s);

      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'USER_UPDATED'
      ) {
        // Différé pour laisser le rendu se terminer.
        setTimeout(() => loadProfile(s?.user?.id), 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Entreprises autorisées :
  // - Super Admin : toutes les entreprises.
  // - Formateur : entreprises qui lui sont affectées.
  // - Apprenant : son entreprise principale.
  useEffect(() => {
    let active = true;

    if (!profile?.id) {
      setAuthorizedCompanies([]);
      setCompaniesLoading(false);
      return;
    }

    if (profile.role === 'learner') {
      setAuthorizedCompanies(company ? [company] : []);
      setCompaniesLoading(false);
      return;
    }

    setCompaniesLoading(true);

    const getCompanies = async () => {
      if (profile.role === 'admin') {
        const { data, error } = await db
          .from('companies')
          .select('id,name,is_active')
          .order('name');

        return { data: data || [], error };
      }

      const [
        { data: links, error },
        { data: primary, error: primaryError }
      ] = await Promise.all([
        db
          .from('trainer_companies')
          .select('company_id,company:companies(id,name,is_active)')
          .eq('trainer_id', profile.id),

        db
          .from('companies')
          .select('id,name,is_active')
          .eq('id', profile.company_id)
          .maybeSingle(),
      ]);

      const byId = new Map();

      if (primary) {
        byId.set(primary.id, primary);
      }

      for (const link of links || []) {
        if (link.company) {
          byId.set(link.company.id, link.company);
        }
      }

      return {
        data: [...byId.values()].filter((x) => x.is_active),
        error: error || primaryError,
      };
    };

    getCompanies()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.warn('Affectations V4 :', error.message);
        }

        setAuthorizedCompanies(data);
        setCompaniesLoading(false);
      })
      .catch((error) => {
        if (!active) return;

        console.error('Erreur de chargement des entreprises V4 :', error);
        setAuthorizedCompanies([]);
        setCompaniesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    profile?.id,
    profile?.role,
    profile?.company_id,
    company?.id
  ]);

  // Sélection de l'entreprise active.
  useEffect(() => {
    if (companiesLoading || !profile || profile.role === 'learner') {
      return;
    }

    const ids = authorizedCompanies.map((c) => c.id);

    // Ne jamais conserver une entreprise devenue non autorisée.
    const next = ids.includes(selectedCompanyId)
      ? selectedCompanyId
      : (
          ids.includes(profile.company_id)
            ? profile.company_id
            : ids[0] || null
        );

    if (next !== selectedCompanyId) {
      setSelectedCompanyId(next);

      if (next) {
        localStorage.setItem(ACTIVE_COMPANY_KEY, next);
      } else {
        localStorage.removeItem(ACTIVE_COMPANY_KEY);
      }
    }
  }, [
    authorizedCompanies,
    companiesLoading,
    profile?.id,
    profile?.role,
    profile?.company_id,
    selectedCompanyId
  ]);

  // Suivi du temps de connexion et de la leçon ouverte.
  useEffect(() => {
    if (!session || !profile) return;

    const ping = (seconds) => {
      if (document.visibilityState !== 'visible') return;

      db.rpc('heartbeat', {
        p_lesson_id: activeLessonRef.current,
        p_seconds: seconds,
      }).then(() => {});
    };

    ping(0);

    const id = setInterval(
      () => ping(HEARTBEAT_SECONDS),
      HEARTBEAT_SECONDS * 1000
    );

    return () => clearInterval(id);
  }, [session, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveLesson = useCallback((lessonId) => {
    activeLessonRef.current = lessonId || null;
  }, []);

  const signIn = async (email, password) => {
    const { error } = await db.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      if (/invalid/i.test(error.message)) {
        throw new Error('Email ou mot de passe incorrect.');
      }

      if (/banned/i.test(error.message)) {
        throw new Error(
          'Votre compte est désactivé. Contactez votre formateur.'
        );
      }

      throw error;
    }
  };

  const signOut = async () => {
    await db.auth.signOut();

    setProfile(null);
    setCompany(null);
    setAuthorizedCompanies([]);
    setSelectedCompanyId(null);
    localStorage.removeItem(ACTIVE_COMPANY_KEY);
  };

  const setActiveCompanyId = (id) => {
    if (id && !authorizedCompanies.some((c) => c.id === id)) {
      return;
    }

    if (id) {
      localStorage.setItem(ACTIVE_COMPANY_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_COMPANY_KEY);
    }

    setSelectedCompanyId(id || null);
  };

  const activeCompanyId = profile?.role === 'learner'
    ? profile.company_id
    : (
        authorizedCompanies.some((c) => c.id === selectedCompanyId)
          ? selectedCompanyId
          : null
      );

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      profile,
      company,
      loading,
      role: profile?.role,
      isAdmin: profile?.role === 'admin',
      isTrainer: profile?.role === 'trainer',
      isLearner: profile?.role === 'learner',
      activeCompanyId,
      authorizedCompanies,
      companiesLoading,
      setActiveCompanyId,
      signIn,
      signOut,
      refreshProfile: () => loadProfile(session?.user?.id),
      setActiveLesson,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      session,
      profile,
      company,
      loading,
      activeCompanyId,
      authorizedCompanies,
      companiesLoading,
      loadProfile,
      setActiveLesson
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function homePathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'trainer') return '/formateur';
  return '/app';
}
