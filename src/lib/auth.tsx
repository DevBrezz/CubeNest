import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  const currentUserId = useRef<string | null>(null);

  const loadProfile = async (uid: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id,display_name,avatar_url,bio')
      .eq('id', uid)
      .maybeSingle();

    // A missing profile row is valid for a first-time user. Do not create
    // a fake row; the profile editor can save it later with upsert().
    if (error) {
      console.error('CubeNest profile load failed:', error.message);
      setProfile({ id: uid, display_name: null, avatar_url: null, bio: null });
      return;
    }

    if (currentUserId.current === uid) {
      setProfile(
        data
          ? (data as Profile)
          : { id: uid, display_name: null, avatar_url: null, bio: null },
      );
    }
  };

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      const nextUserId = nextSession?.user?.id ?? null;
      currentUserId.current = nextUserId;
      setSession(nextSession);
      setReady(true);

      if (nextUserId) {
        // Defer Supabase queries out of the auth callback to avoid deadlocks.
        setTimeout(() => {
          if (active && currentUserId.current === nextUserId) {
            void loadProfile(nextUserId);
          }
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // onAuthStateChange handles the initial session event too. This explicit
    // check provides a fallback in case the initial event is delayed.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        console.error('CubeNest session restore failed:', error.message);
      }

      const restoredSession = data.session;
      const restoredUserId = restoredSession?.user?.id ?? null;

      // Do not overwrite a newer auth event with an older getSession result.
      if (currentUserId.current === null && restoredUserId) {
        currentUserId.current = restoredUserId;
        setSession(restoredSession);
        void loadProfile(restoredUserId);
      } else if (currentUserId.current === null && !restoredUserId) {
        setSession(null);
        setProfile(null);
      }

      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase is not configured');

    const redirectTo = `${window.location.origin}/profile`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUserId.current = null;
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!supabase || !session?.user) return { error: 'Not signed in' };

    const row = {
      id: session.user.id,
      display_name: patch.display_name ?? profile?.display_name ?? null,
      avatar_url: patch.avatar_url ?? profile?.avatar_url ?? null,
      bio: patch.bio ?? profile?.bio ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
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
  const value = useContext(Ctx);
  if (!value) throw new Error('useAuth outside AuthProvider');
  return value;
}
