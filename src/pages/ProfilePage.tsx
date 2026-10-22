import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  LogIn, LogOut, Upload, UserRound, Save, RefreshCw,
  FolderOpen, ImagePlus,
} from 'lucide-react';
import { useAuth, type Profile } from '../lib/auth';

const API_BASE = (
  import.meta.env.VITE_CUBENEST_API_URL ||
  import.meta.env.VITE_CUBENEST_UPLOAD_API ||
  ''
).replace(/\/$/, '');

type Submission = {
  id: number | string;
  title: string;
  kind: string;
  platform: string;
  category: string;
  version: string;
  status: string;
  moderation_reason?: string | null;
  created_at?: number | string;
};

function apiAsset(path: string | null | undefined) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes('approv') || s.includes('publish')) {
    return 'border-green-500/30 bg-green-500/10 text-green-400';
  }
  if (s.includes('reject') || s.includes('denied')) {
    return 'border-red-500/30 bg-red-500/10 text-red-400';
  }
  return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
}

export function ProfilePage() {
  const {
    ready, configured, user, profile, signIn, registerAccount,
    verifyEmail, resendVerification, signOut, refreshProfile, updateProfile,
  } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'verify'>('login');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [projects, setProjects] = useState<Submission[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [projectsBusy, setProjectsBusy] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
    setBio(profile?.bio || '');
  }, [profile]);

  useEffect(() => {
    if (!user || !API_BASE) {
      setProjects([]);
      return;
    }

    let active = true;
    setProjectsBusy(true);

    fetch(`${API_BASE}/api/profile/projects`, { credentials: 'include' })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Gagal memuat proyek.');
        if (active) setProjects(Array.isArray(data.submissions) ? data.submissions : []);
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Gagal memuat proyek.');
      })
      .finally(() => {
        if (active) setProjectsBusy(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  if (!ready) {
    return <div className="pt-24 pb-28 text-center text-mc-muted text-sm">Loading…</div>;
  }

  if (!configured) {
    return (
      <div className="pt-20 pb-28 min-h-screen px-4">
        <div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6">
          <h1 className="text-xl font-bold text-mc-white">Backend belum dikonfigurasi</h1>
          <p className="text-sm text-mc-muted mt-2">
            Periksa VITE_CUBENEST_UPLOAD_API pada environment build frontend.
          </p>
        </div>
      </div>
    );
  }

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await signIn(identifier.trim(), password);
      setPassword('');
      setMessage('Login berhasil.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login gagal.');
    } finally {
      setBusy(false);
    }
  };

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const email = registerEmail.trim().toLowerCase();
      await registerAccount(registerUsername.trim(), email, registerPassword);
      setPendingEmail(email);
      setOtpCode('');
      setAuthMode('verify');
      setMessage('Jika pendaftaran berhasil diproses, periksa email untuk kode verifikasi.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Pendaftaran gagal.');
    } finally {
      setBusy(false);
    }
  };

  const onVerifyEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await verifyEmail(pendingEmail, otpCode.trim());
      setIdentifier(pendingEmail);
      setPassword('');
      setAuthMode('login');
      setMessage('Email berhasil diverifikasi. Silakan login.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verifikasi gagal.');
    } finally {
      setBusy(false);
    }
  };

  const onResendVerification = async () => {
    setBusy(true);
    setMessage('');
    try {
      await resendVerification(pendingEmail);
      setMessage('Jika email terdaftar dan belum diverifikasi, kode akan dikirim.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Permintaan kode gagal.');
    } finally {
      setBusy(false);
    }
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const result = await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim(),
    });
    setMessage(result.error || 'Profil berhasil disimpan.');
    setBusy(false);
  };

  const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setMessage('Avatar harus berupa PNG, JPG, WebP, atau GIF.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Ukuran avatar maksimal 2 MB.');
      return;
    }

    const body = new FormData();
    body.append('avatar', file);
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/profile/avatar`, {
        method: 'POST',
        body,
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Avatar gagal diunggah.');
      await refreshProfile();
      setMessage('Avatar berhasil diperbarui.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Avatar gagal diunggah.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-20 pb-28 min-h-screen px-4">
      <div className="max-w-3xl mx-auto space-y-5">
        {!user ? (
          <div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6">
            <UserRound className="w-12 h-12 text-mc-muted mx-auto mb-3" />
            <h1 className="text-xl font-bold text-mc-white text-center">
              {authMode === 'login' ? 'Sign in to CubeNest' :
               authMode === 'register' ? 'Create your CubeNest account' : 'Verify your email'}
            </h1>
            <p className="text-sm text-mc-muted text-center mt-2 mb-5">
              {authMode === 'login'
                ? 'Masuk untuk mengedit profil dan melihat proyek yang diunggah dengan akun ini.'
                : authMode === 'register'
                  ? 'Buat akun untuk menggunakan fitur akun CubeNest. Email harus dapat menerima kode verifikasi.'
                  : `Masukkan kode 5 digit yang dikirim ke ${pendingEmail}. Kode berlaku selama 10 menit.`}
            </p>

            {authMode === 'login' && (
              <form onSubmit={onLogin} className="space-y-3">
                <div>
                  <label className="text-xs text-mc-muted">Username atau email</label>
                  <input
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-mc-muted">Password</label>
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <button
                  disabled={busy}
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
                <p className="text-sm text-center text-mc-muted">
                  Belum punya akun?{' '}
                  <button type="button" disabled={busy} onClick={() => { setAuthMode('register'); setMessage(''); }}
                    className="text-mc-white underline disabled:opacity-50">
                    Create account
                  </button>
                </p>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={onRegister} className="space-y-3">
                <div>
                  <label className="text-xs text-mc-muted">Username (3–32 karakter, huruf/angka/_)</label>
                  <input
                    required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]{3,32}"
                    autoComplete="username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-mc-muted">Email</label>
                  <input
                    required type="email" maxLength={254} autoComplete="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-mc-muted">Password (10–128 karakter)</label>
                  <input
                    required type="password" minLength={10} maxLength={128}
                    autoComplete="new-password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <button disabled={busy} type="submit"
                  className="w-full px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50">
                  {busy ? 'Creating account…' : 'Create account'}
                </button>
                <p className="text-sm text-center text-mc-muted">
                  Sudah punya akun?{' '}
                  <button type="button" disabled={busy} onClick={() => { setAuthMode('login'); setMessage(''); }}
                    className="text-mc-white underline disabled:opacity-50">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {authMode === 'verify' && (
              <form onSubmit={onVerifyEmail} className="space-y-3">
                <div>
                  <label className="text-xs text-mc-muted">Kode verifikasi (5 digit)</label>
                  <input
                    required type="text" inputMode="numeric" autoComplete="one-time-code"
                    pattern="[0-9]{5}" minLength={5} maxLength={5}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white tracking-widest"
                  />
                </div>
                <button disabled={busy} type="submit"
                  className="w-full px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50">
                  {busy ? 'Verifying…' : 'Verify email'}
                </button>
                <button disabled={busy} type="button" onClick={onResendVerification}
                  className="w-full px-4 py-2 rounded-lg border border-mc-border text-sm text-mc-white disabled:opacity-50">
                  Kirim ulang kode
                </button>
                <button disabled={busy} type="button"
                  onClick={() => { setAuthMode('register'); setMessage(''); }}
                  className="w-full text-sm text-mc-muted underline disabled:opacity-50">
                  Kembali ke pendaftaran
                </button>
              </form>
            )}

            {message && (
              <p role="status" aria-live="polite" className="text-sm text-center text-mc-muted mt-4 break-words">
                {message}
              </p>
            )}
          </div>
        ) : (
          <>
            <section className="bg-mc-surface border border-mc-border rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-mc-gray border border-mc-border flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={apiAsset(profile.avatar_url)}
                      alt="Avatar profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound className="w-9 h-9 text-mc-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-bold text-mc-white">
                    {profile?.display_name || user.username}
                  </h1>
                  <p className="text-sm text-mc-muted">@{user.username}</p>
                  <p className="text-xs text-mc-muted break-all">{user.email}</p>
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm cursor-pointer">
                  <ImagePlus className="w-4 h-4" />
                  Ganti avatar
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={busy}
                    onChange={onAvatar}
                  />
                </label>
              </div>

              <form onSubmit={onSave} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-mc-muted">Nama tampilan</label>
                  <input
                    maxLength={60}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={user.username}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-mc-muted">Bio</label>
                  <textarea
                    maxLength={300}
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ceritakan sedikit tentang dirimu…"
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white resize-y"
                  />
                  <p className="text-xs text-mc-muted mt-1">{bio.length}/300 karakter</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={busy}
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-mc-red text-white text-sm disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Simpan profil
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void signOut().catch((error) =>
                      setMessage(error instanceof Error ? error.message : 'Logout gagal.')
                    )}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                  <Link
                    to="/upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm"
                  >
                    <Upload className="w-4 h-4" /> Upload proyek
                  </Link>
                </div>
              </form>
            </section>

            <section className="bg-mc-surface border border-mc-border rounded-xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-mc-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" /> My Projects
                  </h2>
                  <p className="text-xs text-mc-muted mt-1">
                    Proyek yang terkait dengan akun ini, maksimal 100 entri terbaru.
                  </p>
                </div>
                <button
                  type="button"
                  title="Muat ulang proyek"
                  disabled={projectsBusy}
                  onClick={() => {
                    setProjectsBusy(true);
                    fetch(`${API_BASE}/api/profile/projects`, { credentials: 'include' })
                      .then(async (response) => {
                        const data = await response.json().catch(() => ({}));
                        if (!response.ok) throw new Error(data.error || 'Gagal memuat proyek.');
                        setProjects(Array.isArray(data.submissions) ? data.submissions : []);
                        setMessage('');
                      })
                      .catch((error) => setMessage(error instanceof Error ? error.message : 'Gagal memuat proyek.'))
                      .finally(() => setProjectsBusy(false));
                  }}
                  className="p-2 rounded-lg bg-mc-gray border border-mc-border disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${projectsBusy ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {projectsBusy ? (
                <p className="text-sm text-mc-muted py-5 text-center">Memuat proyek…</p>
              ) : projects.length === 0 ? (
                <div className="py-7 text-center">
                  <FolderOpen className="w-9 h-9 text-mc-muted mx-auto mb-2" />
                  <p className="text-sm text-mc-muted">Belum ada proyek yang terhubung ke akun ini.</p>
                  <p className="text-xs text-mc-muted mt-1">
                    Upload anonim tidak otomatis masuk ke daftar akun.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <article key={project.id} className="rounded-lg border border-mc-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-mc-white break-words">{project.title}</h3>
                          <p className="text-xs text-mc-muted mt-1">
                            {project.kind} · {project.platform} · {project.category}
                            {project.version ? ` · ${project.version}` : ''}
                          </p>
                        </div>
                        <span className={`text-xs border rounded-full px-2.5 py-1 ${statusClass(project.status || 'Pending')}`}>
                          {project.status || 'Pending'}
                        </span>
                      </div>
                      {project.moderation_reason && (
                        <p className="text-xs text-mc-muted mt-3">
                          Catatan moderasi: {project.moderation_reason}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {message && (
          <p role="status" className="text-sm text-center text-mc-muted" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
