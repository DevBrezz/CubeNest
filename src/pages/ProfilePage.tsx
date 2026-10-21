import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, Upload, UserRound, FolderOpen, Clock3, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type OwnProject = { id: string; name: string; summary: string; status: 'pending' | 'approved' | 'rejected'; created_at: string };

export function ProfilePage() {
  const { ready, configured, user, profile, signInWithGoogle, signOut, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<OwnProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    if (!user) { setName(''); setBio(''); setProjects([]); return; }
    setName(profile?.display_name || String(user.user_metadata?.full_name || user.user_metadata?.name || ''));
    setBio(profile?.bio || '');
  }, [user?.id, profile?.display_name, profile?.bio]);

  useEffect(() => {
    let active = true;
    async function loadProjects() {
      if (!user || !supabase) { setProjects([]); return; }
      setProjectsLoading(true);
      const { data, error } = await supabase.from('user_uploads').select('id,name,summary,status,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (active) {
        setProjects((error ? [] : (data as OwnProject[] | null)) || []);
        setProjectsLoading(false);
      }
    }
    void loadProjects();
    return () => { active = false; };
  }, [user?.id]);

  if (!ready) return <div className="pt-24 pb-28 text-center text-mc-muted text-sm">Loading account…</div>;

  if (!configured) return (
    <div className="pt-24 pb-28 min-h-screen px-4"><div className="max-w-xl mx-auto bg-mc-surface border border-mc-border rounded-2xl p-6">
      <h1 className="text-2xl font-bold text-mc-white">Your CubeNest account</h1>
      <p className="text-sm text-mc-muted mt-2">Login is not connected yet. Add the Supabase project URL and Publishable key as GitHub Actions secrets named <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then run the deploy workflow again.</p>
    </div></div>
  );

  if (!user) return (
    <div className="pt-24 pb-28 min-h-screen px-4 flex items-start justify-center">
      <div className="w-full max-w-md bg-mc-surface border border-mc-border rounded-2xl p-7 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-4"><UserRound className="w-8 h-8 text-emerald-400" /></div>
        <p className="text-xs uppercase tracking-[.2em] text-emerald-400">CubeNest account</p>
        <h1 className="text-2xl font-bold text-mc-white mt-2">Welcome back</h1>
        <p className="text-sm text-mc-muted mt-2">Sign in to manage your creator profile, see your uploads, and track your project submissions.</p>
        <button type="button" className="mt-6 w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60" disabled={busy} onClick={async () => { try { setBusy(true); setMsg(null); await signInWithGoogle(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Google login failed.'); } finally { setBusy(false); } }}>
          <svg aria-hidden="true" viewBox="0 0 48 48" className="w-5 h-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.06 13.22l7.98 6.19C11.93 13.72 17.47 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.01 46.98 31.94 46.98 24.55Z"/><path fill="#FBBC05" d="M10.04 28.59A14.4 14.4 0 0 1 9.27 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.48-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.87 2.3-8.18 2.3-6.53 0-12.07-4.22-14.06-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
          {busy ? 'Connecting to Google…' : 'Continue with Google'}
        </button>
        {msg && <p role="alert" className="text-sm text-red-300 mt-4">{msg}</p>}
        <p className="text-[11px] text-mc-muted mt-4">Your Google password is handled by Google, not CubeNest.</p>
      </div>
    </div>
  );

  const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const onSave = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const result = await updateProfile({ display_name: name.trim(), bio: bio.trim(), avatar_url: avatar || null });
    setBusy(false); setMsg(result.error ? `Could not save profile: ${result.error}` : 'Profile saved successfully.');
  };

  const statusIcon = (status: OwnProject['status']) => status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : status === 'rejected' ? <XCircle className="w-4 h-4 text-red-400" /> : <Clock3 className="w-4 h-4 text-amber-300" />;

  return (
    <div className="pt-24 pb-28 min-h-screen px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-7"><p className="text-xs uppercase tracking-[.2em] text-emerald-400">Creator dashboard</p><h1 className="text-3xl sm:text-4xl font-bold text-mc-white mt-2">Your account<span className="text-emerald-400">.</span></h1><p className="text-sm text-mc-muted mt-2">Manage your public identity and keep track of your CubeNest submissions.</p></div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-5 items-start">
          <section className="bg-mc-surface border border-mc-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-4 mb-6">
              {avatar ? <img src={avatar} alt="Profile avatar" referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400/50" /> : <div className="w-16 h-16 rounded-full bg-mc-gray flex items-center justify-center"><UserRound className="w-8 h-8 text-mc-muted" /></div>}
              <div className="min-w-0"><h2 className="font-semibold text-lg text-mc-white truncate">{profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email}</h2><p className="text-xs text-mc-muted truncate">{user.email}</p><p className="text-[11px] text-emerald-400 mt-1">Google account connected</p></div>
            </div>
            <form onSubmit={onSave} className="space-y-4">
              <div><label htmlFor="profile-name" className="text-xs text-mc-muted">Display name</label><input id="profile-name" value={name} maxLength={60} onChange={e => setName(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white focus:outline-none focus:border-emerald-400" placeholder="Your creator name" /></div>
              <div><label htmlFor="profile-bio" className="text-xs text-mc-muted">About you</label><textarea id="profile-bio" value={bio} maxLength={300} onChange={e => setBio(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white resize-y focus:outline-none focus:border-emerald-400" placeholder="Tell the community what you create…" /></div>
              <p className="text-[11px] text-mc-muted">Profile photo is taken from your Google account. You can change your display name and bio here.</p>
              <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save profile'}</button>
              {msg && <p role="status" className="text-xs text-mc-muted">{msg}</p>}
            </form>
            <div className="mt-4 grid grid-cols-2 gap-2"><Link to="/upload" className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm hover:border-emerald-400"><Upload className="w-4 h-4" /> Upload project</Link><button type="button" onClick={() => void signOut()} className="inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-muted hover:text-white"><LogOut className="w-4 h-4" /> Sign out</button></div>
          </section>
          <section className="bg-mc-surface border border-mc-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="text-lg font-semibold text-mc-white flex items-center gap-2"><FolderOpen className="w-5 h-5 text-emerald-400" /> My projects</h2><p className="text-xs text-mc-muted mt-1">Your uploads and their review status</p></div><span className="rounded-full bg-mc-gray px-2.5 py-1 text-xs text-mc-muted">{projects.length}</span></div>
            {projectsLoading ? <p className="text-sm text-mc-muted py-8 text-center">Loading your projects…</p> : projects.length === 0 ? <div className="text-center py-10 border border-dashed border-mc-border rounded-xl"><FolderOpen className="w-8 h-8 mx-auto text-mc-muted mb-3" /><p className="text-sm font-medium text-mc-white">No submitted projects yet</p><p className="text-xs text-mc-muted mt-1 mb-4">Upload your first Minecraft resource to see it here.</p><Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black text-sm font-semibold"><Upload className="w-4 h-4" /> Submit a project</Link></div> : <div className="space-y-3">{projects.map(project => <article key={project.id} className="rounded-xl border border-mc-border bg-mc-gray/50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-medium text-sm text-mc-white break-words">{project.name}</h3><p className="text-xs text-mc-muted mt-1 line-clamp-2">{project.summary}</p><p className="text-[11px] text-mc-muted mt-2">Submitted {new Date(project.created_at).toLocaleDateString()}</p></div><span className="shrink-0 inline-flex items-center gap-1.5 text-[11px] capitalize text-mc-muted">{statusIcon(project.status)}{project.status}</span></div></article>)}</div>}
            <Link to="/projects" className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline">Browse community projects <ExternalLink className="w-3 h-3" /></Link>
          </section>
        </div>
      </div>
    </div>
  );
}
