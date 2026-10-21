import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, Upload, UserRound } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function ProfilePage() {
  const { ready, configured, user, signIn, signOut } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ready) return <div className="pt-24 pb-28 text-center text-mc-muted text-sm">Loading…</div>;
  if (!configured) return <div className="pt-20 pb-28 min-h-screen px-4"><div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6"><h1 className="text-xl font-bold text-mc-white">Backend belum dikonfigurasi</h1><p className="text-sm text-mc-muted mt-2">Tambahkan <code className="text-mc-red">VITE_CUBENEST_API_URL</code> di environment build frontend, lalu build ulang.</p></div></div>;
  const onLogin = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await signIn(identifier.trim(), password); setPassword(''); setMsg('Login berhasil.'); }
    catch (error) { setMsg(error instanceof Error ? error.message : 'Login gagal.'); }
    finally { setBusy(false); }
  };
  return <div className="pt-20 pb-28 min-h-screen px-4"><div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6">
    {user ? <>
      <div className="flex items-center gap-3 mb-5"><div className="w-14 h-14 rounded-full bg-mc-gray flex items-center justify-center"><UserRound className="w-7 h-7 text-mc-muted" /></div><div className="min-w-0"><h1 className="text-xl font-bold text-mc-white">Your CubeNest account</h1><p className="text-sm text-mc-muted">{user.username} · {user.email}</p></div></div>
      <p className="text-sm text-mc-muted mb-4">Akun terhubung ke CubeNest Storage.</p>
      <div className="grid grid-cols-2 gap-2"><Link to="/upload" className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-mc-red text-white text-sm"><Upload className="w-4 h-4" /> Upload</Link><button type="button" onClick={() => void signOut().catch(e => setMsg(e instanceof Error ? e.message : 'Logout gagal'))} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm"><LogOut className="w-4 h-4" /> Sign out</button></div>
    </> : <>
      <UserRound className="w-12 h-12 text-mc-muted mx-auto mb-3" /><h1 className="text-xl font-bold text-mc-white text-center">Sign in to CubeNest</h1><p className="text-sm text-mc-muted text-center mt-2 mb-5">Masuk memakai username/email dan password akun CubeNest.</p>
      <form onSubmit={onLogin} className="space-y-3"><div><label className="text-xs text-mc-muted">Username or email</label><input required autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white" /></div><div><label className="text-xs text-mc-muted">Password</label><input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white" /></div><button disabled={busy} type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50"><LogIn className="w-4 h-4" />{busy ? 'Signing in…' : 'Sign in'}</button></form>
    </>}
    {msg && <p role="status" className="text-xs text-center text-mc-muted mt-3">{msg}</p>}
  </div></div>;
}
