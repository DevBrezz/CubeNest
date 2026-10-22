import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const API_BASE = (
  import.meta.env.VITE_CUBENEST_API_URL ||
  import.meta.env.VITE_CUBENEST_UPLOAD_API ||
  ''
).replace(/\/$/, '');

export type CubeNestUser = {
  id: number;
  username: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    preferred_username?: string;
  };
};

export type Profile = {
  id: string;
  username?: string;
  email?: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type AuthCtx = {
  ready: boolean;
  configured: boolean;
  session: { user: CubeNestUser } | null;
  user: CubeNestUser | null;
  profile: Profile | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error?: string }>;
};

const Ctx = createContext<AuthCtx | null>(null);

async function api(path: string, init: RequestInit = {}) {
  if (!API_BASE) {
    throw new Error('Backend belum dikonfigurasi. Periksa VITE_CUBENEST_UPLOAD_API.');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request gagal (${response.status})`);
  }
  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CubeNestUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    api('/api/auth/me')
      .then((data) => {
        if (active) setUser(data.user || null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfile(null);
      return () => {
        active = false;
      };
    }

    api('/api/profile')
      .then((data) => {
        if (active) setProfile(data.profile || null);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const signIn = async (identifier: string, password: string) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });

    if (data.user) {
      setUser(data.user);
    } else {
      const me = await api('/api/auth/me');
      setUser(me.user || null);
    }
  };

  const signOut = async () => {
    await api('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const data = await api('/api/profile');
    setProfile(data.profile || null);
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    try {
      const fields: Record<string, unknown> = {};
      if (patch.display_name !== undefined) fields.display_name = patch.display_name;
      if (patch.bio !== undefined) fields.bio = patch.bio;

      const data = await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(fields),
      });
      setProfile(data.profile || null);
      return {};
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Profil gagal diperbarui.',
      };
    }
  };

  const signInWithGoogle = async () => {
    throw new Error('Login Google tidak tersedia. Gunakan username/email dan password.');
  };

  const session = user ? { user } : null;

  return (
    <Ctx.Provider
      value={{
        ready,
        configured: Boolean(API_BASE),
        session,
        user,
        profile,
        signIn,
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
