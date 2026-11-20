import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const HEARTBEAT_SECONDS = 60;
const ACTIVE_COMPANY_KEY = 'mce_active_company';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminCompanyId, setAdminCompanyId] = useState(() => localStorage.getItem(ACTIVE_COMPANY_KEY));
  const activeLessonRef = useRef(null);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setCompany(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*, company:companies(*)').eq('id', userId).single();
    if (data) {
      const { company: c, ...p } = data;
      setProfile(p);
      setCompany(c || null);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // éviter d'appeler supabase dans le callback (deadlock connu)
        setTimeout(() => loadProfile(s?.user?.id), 0);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Suivi du temps de connexion (et du temps passé sur la leçon ouverte)
  useEffect(() => {
    if (!session || !profile) return;
    const ping = (seconds) => {
      if (document.visibilityState !== 'visible') return;
      supabase.rpc('heartbeat', { p_lesson_id: activeLessonRef.current, p_seconds: seconds }).then(() => {});
    };
    ping(0);
    const id = setInterval(() => ping(HEARTBEAT_SECONDS), HEARTBEAT_SECONDS * 1000);
    return () => clearInterval(id);
  }, [session, profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveLesson = useCallback((lessonId) => {
    activeLessonRef.current = lessonId || null;
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (/invalid/i.test(error.message)) throw new Error('Email ou mot de passe incorrect.');
      if (/banned/i.test(error.message)) throw new Error('Votre compte est désactivé. Contactez votre formateur.');
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCompany(null);
  };

  const setActiveCompanyId = (id) => {
    if (id) localStorage.setItem(ACTIVE_COMPANY_KEY, id);
    else localStorage.removeItem(ACTIVE_COMPANY_KEY);
    setAdminCompanyId(id);
  };

  // Entreprise "gérée" : celle du formateur, ou celle choisie par l'administrateur
  const activeCompanyId = profile?.role === 'admin' ? adminCompanyId : profile?.company_id;

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
      setActiveCompanyId,
      signIn,
      signOut,
      refreshProfile: () => loadProfile(session?.user?.id),
      setActiveLesson,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, profile, company, loading, activeCompanyId, loadProfile, setActiveLesson]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function homePathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'trainer') return '/formateur';
  return '/app';
}
