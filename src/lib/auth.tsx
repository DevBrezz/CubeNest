import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabase';

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type AuthCtx = {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error?: string }>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = async (uid: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('id,display_name,avatar_url,bio').eq('id', uid).maybeSingle();
    if (data) setProfile(data as Profile);
    else setProfile({ id: uid, display_name: null, avatar_url: null, bio: null });
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) void loadProfile(data.session.user.id);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) void loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase is not configured');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!supabase || !session?.user) return { error: 'Not signed in' };
    const row = {
      id: session.user.id,
      display_name: patch.display_name ?? profile?.display_name,
      avatar_url: patch.avatar_url ?? profile?.avatar_url,
      bio: patch.bio ?? profile?.bio,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('profiles').upsert(row);
    if (error) return { error: error.message };
    await loadProfile(session.user.id);
    return {};
  };

  return (
    <Ctx.Provider
      value={{
        ready,
        configured: isSupabaseConfigured,
        session,
        user: session?.user ?? null,
        profile,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
