import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Lock, ImagePlus } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { bbcodeToHtml } from '../lib/bbcode';

const PLATFORMS = ['Java', 'Bedrock', 'Both'] as const;
const CATEGORIES = ['Mod', 'Plugin', 'Resource Pack', 'Shader', 'Modpack', 'Datapack', 'Map', 'Skin', 'Other'] as const;

export function UploadPage() {
  const { ready, configured, user } = useAuth();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [platform, setPlatform] = useState<string>('Java');
  const [category, setCategory] = useState<string>('Mod');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<FileList | null>(null);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="pt-24 pb-28 text-center text-mc-muted text-sm">Loading…</div>;

  if (!configured || !user) {
    return (
      <div className="pt-20 pb-28 min-h-screen px-4">
        <div className="max-w-md mx-auto bg-mc-surface border border-mc-border rounded-xl p-6 text-center">
          <Lock className="w-10 h-10 text-mc-muted mx-auto mb-3" />
          <h1 className="text-xl font-bold text-mc-white">Login required</h1>
          <p className="text-sm text-mc-muted mt-2">You must sign in with Google before uploading content.</p>
          <Link to="/profile" className="mt-5 inline-flex px-4 py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium">
            Go to Profile / Login
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !file) {
      setStatus('Choose a file to upload.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const uid = user.id;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${uid}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      const galleryPaths: string[] = [];
      if (gallery) {
        for (const g of Array.from(gallery).slice(0, 8)) {
          const gpath = `${uid}/gallery/${Date.now()}-${g.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error } = await supabase.storage.from('uploads').upload(gpath, g, { upsert: false });
          if (!error) galleryPaths.push(gpath);
        }
      }

      const { error: dbErr } = await supabase.from('user_uploads').insert({
        user_id: uid,
        name,
        summary,
        description,
        platform,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        file_path: path,
        gallery_paths: galleryPaths,
        status: 'pending',
      });
      if (dbErr) throw dbErr;
      setStatus('Upload submitted for review.');
      setName('');
      setSummary('');
      setDescription('');
      setTags('');
      setFile(null);
      setGallery(null);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-20 pb-28 min-h-screen px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-mc-white mb-1 flex items-center gap-2">
          <Upload className="w-6 h-6 text-mc-red" /> Upload content
        </h1>
        <p className="text-sm text-mc-muted mb-5">
          Name, summary, BBCode description, platform, category, tags, file, and gallery images. Uploads are stored in your Supabase project (pending review).
        </p>

        <form onSubmit={onSubmit} className="space-y-3 bg-mc-surface border border-mc-border rounded-xl p-4">
          <div>
            <label className="text-xs text-mc-muted">Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white" />
          </div>
          <div>
            <label className="text-xs text-mc-muted">Summary *</label>
            <input required maxLength={160} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white" placeholder="Short one-line summary" />
          </div>
          <div>
            <label className="text-xs text-mc-muted">Description (BBCode)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white font-mono resize-y"
              placeholder="[b]Bold[/b] [i]italic[/i] [url=https://...]link[/url] [img]https://...[/img]"
            />
            <button type="button" className="text-[11px] text-mc-red mt-1" onClick={() => setPreview((p) => !p)}>
              {preview ? 'Hide preview' : 'Preview BBCode'}
            </button>
            {preview && (
              <div
                className="mt-2 p-3 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-text prose-invert"
                dangerouslySetInnerHTML={{ __html: bbcodeToHtml(description) }}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-mc-muted">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white">
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-mc-muted">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-mc-muted">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg bg-mc-gray border border-mc-border text-sm text-mc-white" placeholder="survival, rpg, fabric" />
          </div>
          <div>
            <label className="text-xs text-mc-muted">Main file *</label>
            <input
              required
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-1 w-full text-xs text-mc-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-mc-red file:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-mc-muted flex items-center gap-1"><ImagePlus className="w-3.5 h-3.5" /> Gallery images (optional, max 8)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setGallery(e.target.files)}
              className="mt-1 w-full text-xs text-mc-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-mc-gray file:text-mc-white"
            />
          </div>
          <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg bg-mc-red text-white text-sm font-medium disabled:opacity-50">
            {busy ? 'Uploading…' : 'Submit upload'}
          </button>
          {status && <p className="text-xs text-center text-mc-muted">{status}</p>}
        </form>
      </div>
    </div>
  );
}
