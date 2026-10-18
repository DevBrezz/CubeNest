import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, Upload, UserRound } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function ProfilePage() {
  const { ready, configured, user, profile, signInWithGoogle, signOut, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="pt-24 pb-28 text-center text-mc-muted text-sm">Loading…</div>;
  }

  if (!configured) {
    return (
      <div className="pt-20 pb-28 min-h-screen px-4">
        <div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-mc-white">Profile</h1>
          <p className="text-sm text-mc-muted mt-2">
            Google login and cloud profiles need Supabase. Add <code className="text-mc-red">VITE_SUPABASE_URL</code> and{' '}
            <code className="text-mc-red">VITE_SUPABASE_ANON_KEY</code> (see AUTH-SETUP.md), enable Google provider, then rebuild.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-20 pb-28 min-h-screen px-4">
        <div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6 text-center">
          <UserRound className="w-12 h-12 text-mc-muted mx-auto mb-3" />
          <h1 className="text-xl font-bold text-mc-white">Sign in</h1>
          <p className="text-sm text-mc-muted mt-2">Use Google to manage your profile and upload content securely via Supabase Auth.</p>
          <button
            type="button"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium"
            onClick={async () => {
              try {
                setBusy(true);
                await signInWithGoogle();
              } catch (e) {
                setMsg(e instanceof Error ? e.message : 'Login failed');
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
          >
            <LogIn className="w-4 h-4" /> Continue with Google
          </button>
          {msg && <p className="text-xs text-red-300 mt-3">{msg}</p>}
        </div>
      </div>
    );
  }

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await updateProfile({ display_name: name, bio });
    setBusy(false);
    setMsg(res.error || 'Profile saved');
  };

  const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return (
    <div className="pt-20 pb-28 min-h-screen px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-mc-surface border border-mc-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            {avatar ? (
              <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover border border-mc-border" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-mc-gray flex items-center justify-center">
                <UserRound className="w-7 h-7 text-mc-muted" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-mc-white truncate">{profile?.display_name || user.email}</p>
              <p className="text-xs text-mc-muted truncate">{user.email}</p>
            </div>
          </div>

          <form onSubmit={onSave} className="space-y-3">
            <div>
              <label className="text-xs text-mc-muted">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
              />
            </div>
            <div>
              <label className="text-xs text-mc-muted">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white resize-y"
              />
            </div>
            <p className="text-[11px] text-mc-muted">Profile photo comes from your Google account. Avatar URL can be updated after storage upload is enabled.</p>
            <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50">
              Save profile
            </button>
            {msg && <p className="text-xs text-mc-muted text-center">{msg}</p>}
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/upload" className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm">
              <Upload className="w-4 h-4" /> Upload
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-muted"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
