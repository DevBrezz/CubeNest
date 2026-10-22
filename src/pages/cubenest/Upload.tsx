import { useEffect, useState } from 'react';
import type { FormEvent, DragEvent } from 'react';
import {
  AlertCircle,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  FileArchive,
  FileImage,
  FileText,
  ImagePlus,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';
import './Upload.css';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MAX_PREVIEW_SIZE = 1024 * 1024;

const categories = [
  'Mods',
  'Texture Packs',
  'Shaders',
  'Addons',
  'Skins',
  'Administration',
  'Economy',
  'Gameplay',
  'Protection',
  'Utility',
  'World management'
];

const kindCategory: Record<string, string> = {
  Mod: 'Mods',
  'Texture Pack': 'Texture Packs',
  Shader: 'Shaders',
  Addon: 'Addons',
  Skin: 'Skins',
  Plugin: 'Administration'
};

const extensions: Record<string, string[]> = {
  Java: [
    '.jar', '.zip', '.json', '.schem', '.schematic',
    '.litematic', '.png', '.jpg', '.jpeg', '.webp'
  ],
  Bedrock: [
    '.mcpack', '.mcaddon', '.mcworld', '.mcstructure',
    '.mctemplate', '.zip', '.json', '.png', '.jpg',
    '.jpeg', '.webp'
  ]
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getExtension(file: File) {
  return file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
}

export function Upload() {
  const [kind, setKind] = useState('Mod');
  const [platform, setPlatform] = useState('Java');
  const [category, setCategory] = useState('Mods');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBytes, setUploadBytes] = useState({ loaded: 0, total: 0 });
  const [notice, setNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const apiUrl = String(
    import.meta.env.VITE_CUBENEST_UPLOAD_API ||
    import.meta.env.VITE_CUBENEST_API_URL || ''
  ).trim().replace(/\/+$/, '');

  const apiConfigured = Boolean(apiUrl);

  useEffect(() => {
    if (!preview) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(preview);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [preview]);

  function chooseFile(nextFile: File | null) {
    setNotice(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    const ext = getExtension(nextFile);

    if (!extensions[platform].includes(ext)) {
      setNotice({
        type: 'error',
        message: `Format ${ext || 'tanpa ekstensi'} tidak sesuai dengan pilihan platform ${platform}.`
      });
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      setNotice({
        type: 'error',
        message: 'Ukuran resource melebihi batas default server 50 MB.'
      });
      return;
    }

    setFile(nextFile);
  }

  function choosePreview(nextFile: File | null) {
    setNotice(null);

    if (!nextFile) {
      setPreview(null);
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(nextFile.type)) {
      setNotice({
        type: 'error',
        message: 'Gambar preview harus berupa PNG, JPG, WebP, atau GIF.'
      });
      return;
    }

    if (nextFile.size > MAX_PREVIEW_SIZE) {
      setNotice({
        type: 'error',
        message: 'Ukuran gambar preview maksimal 1 MB.'
      });
      return;
    }

    setPreview(nextFile);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] || null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    if (!apiConfigured) {
      setNotice({
        type: 'error',
        message: 'Upload API belum dikonfigurasi untuk deployment ini.'
      });
      return;
    }

    if (!file) {
      setNotice({
        type: 'error',
        message: 'Pilih file resource sebelum mengirim submission.'
      });
      return;
    }

    if (description.trim().length < 30) {
      setNotice({
        type: 'error',
        message: 'Deskripsi harus berisi minimal 30 karakter.'
      });
      return;
    }

    const confirmed = window.confirm(
      `Konfirmasi upload "${title.trim()}"?\n\nFile resource${preview ? ' dan gambar preview' : ''} akan dikirim ke CubeNest. Setelah dikonfirmasi, submission masuk antrean Pending dan diproses oleh server.`
    );
    if (!confirmed) {
      setNotice({
        type: 'info',
        message: 'Upload belum dikirim. Periksa kembali detail dan file sebelum mencoba lagi.'
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setUploadBytes({ loaded: 0, total: file.size + (preview?.size || 0) });

    try {
      const body = new FormData();
      body.append('title', title.trim());
      body.append('kind', kind);
      body.append('platform', platform);
      body.append('category', category);
      body.append('version', version.trim());
      body.append('description', description.trim());
      body.append('file', file);

      if (preview) {
        body.append('image', preview);
      }

      const data = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${apiUrl}/api/submissions`);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          setUploadProgress(percent);
          setUploadBytes({ loaded: event.loaded, total: event.total });
        };
        xhr.onload = () => {
          let result: Record<string, unknown> = {};
          try { result = JSON.parse(xhr.responseText || '{}') as Record<string, unknown>; } catch { /* server may return non-JSON */ }
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve(result);
          } else {
            reject(new Error(typeof result.error === 'string' ? result.error : `Upload gagal (HTTP ${xhr.status}).`));
          }
        };
        xhr.onerror = () => reject(new Error('Koneksi upload gagal. Periksa URL API, tunnel, dan konfigurasi CORS.'));
        xhr.onabort = () => reject(new Error('Upload dibatalkan.'));
        xhr.send(body);
      });

      setNotice({
        type: 'success',
        message: 'Upload berhasil! Resource dan gambar telah dikirim ke server. Status Pending; penerbitan otomatis dijadwalkan sekitar 1 menit setelah server menerima submission.'
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error
          ? error.message
          : 'Upload gagal. Periksa koneksi lalu coba lagi.'
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cn-page cn-upload-v2">
      <div className="cn-upload-v2-shell">
        <header className="cn-upload-v2-hero">
          <div className="cn-upload-v2-eyebrow">
            <Sparkles size={15} />
            <span>CREATOR TOOLS</span>
            <span className="cn-upload-v2-dot" />
            <span>COMMUNITY SUBMISSIONS</span>
          </div>

          <h1>
            Upload Center<span className="cn-upload-v2-accent">.</span>
          </h1>

          <p>
            Punya sesuatu yang keren? Bagikan karyamu dengan komunitas
            CubeNest. Lengkapi detail resource dan kirim untuk ditinjau.
          </p>

          <div className="cn-upload-v2-benefits">
            <span><ShieldCheck size={15} /> Moderated uploads</span>
            <span><Clock3 size={15} /> Review before publishing</span>
            <span><CheckCircle2 size={15} /> No account required</span>
          </div>
        </header>

        <div className="cn-upload-v2-layout">
          <form className="cn-upload-v2-form" onSubmit={submit}>
            <section className="cn-upload-v2-section">
              <div className="cn-upload-v2-section-heading">
                <span className="cn-upload-v2-step">01</span>
                <div>
                  <h2>Resource details</h2>
                  <p>Informasi utama untuk mengenali karyamu.</p>
                </div>
              </div>

              <label className="cn-upload-v2-field">
                <span>Resource title <b>*</b></span>
                <input
                  required
                  maxLength={100}
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Contoh: Better Survival Essentials"
                />
                <small>Gunakan nama yang jelas dan mudah dicari.</small>
              </label>

              <div className="cn-upload-v2-grid">
                <label className="cn-upload-v2-field">
                  <span>Resource type <b>*</b></span>
                  <select
                    value={kind}
                    onChange={event => {
                      setKind(event.target.value);
                      setCategory(kindCategory[event.target.value] || 'Mods');
                    }}
                  >
                    {['Mod', 'Texture Pack', 'Shader', 'Addon', 'Skin', 'Plugin']
                      .map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>

                <label className="cn-upload-v2-field">
                  <span>Platform <b>*</b></span>
                  <select
                    value={platform}
                    onChange={event => {
                      setPlatform(event.target.value);
                      setFile(null);
                    }}
                  >
                    <option>Java</option>
                    <option>Bedrock</option>
                  </select>
                </label>
              </div>

              <div className="cn-upload-v2-grid">
                <label className="cn-upload-v2-field">
                  <span>Category <b>*</b></span>
                  <select
                    value={category}
                    onChange={event => setCategory(event.target.value)}
                  >
                    {categories.map(value => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>

                <label className="cn-upload-v2-field">
                  <span>Minecraft version(s) <b>*</b></span>
                  <input
                    required
                    maxLength={120}
                    value={version}
                    onChange={event => setVersion(event.target.value)}
                    placeholder="1.21.1, 1.21.4"
                  />
                </label>
              </div>

              <label className="cn-upload-v2-field">
                <span>Description <b>*</b></span>
                <textarea
                  required
                  minLength={30}
                  maxLength={5000}
                  rows={7}
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Jelaskan fitur utama, cara penggunaan, dependencies, kompatibilitas, perubahan versi, dan hal penting lainnya..."
                />
                <div className="cn-upload-v2-counter">
                  <small>Minimal 30 karakter. Jangan lupa informasi kompatibilitas.</small>
                  <small>{description.length}/5000</small>
                </div>
              </label>
            </section>

            <section className="cn-upload-v2-section">
              <div className="cn-upload-v2-section-heading">
                <span className="cn-upload-v2-step">02</span>
                <div>
                  <h2>Resource files</h2>
                  <p>Unggah file utama dan gambar preview.</p>
                </div>
              </div>

              <div
                className={`cn-upload-v2-dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={event => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={event => event.preventDefault()}
                onDragLeave={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragging(false);
                  }
                }}
                onDrop={onDrop}
              >
                <input
                  id="cn-resource-file"
                  type="file"
                  accept={extensions[platform].join(',')}
                  onChange={event => chooseFile(event.target.files?.[0] || null)}
                />

                {file ? (
                  <div className="cn-upload-v2-selected-file">
                    <div className="cn-upload-v2-file-icon">
                      <FileArchive size={25} />
                    </div>
                    <div className="cn-upload-v2-file-meta">
                      <strong>{file.name}</strong>
                      <span>{formatSize(file.size)} · {getExtension(file).toUpperCase()}</span>
                      <span className="cn-upload-v2-file-valid">
                        <CheckCircle2 size={13} /> File dipilih
                      </span>
                    </div>
                    <button
                      type="button"
                      className="cn-upload-v2-icon-button"
                      aria-label="Hapus file"
                      onClick={() => chooseFile(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="cn-resource-file" className="cn-upload-v2-drop-content">
                    <div className="cn-upload-v2-drop-icon">
                      <ArrowUpFromLine size={27} />
                    </div>
                    <strong>Drop your resource here</strong>
                    <span>atau klik untuk memilih file dari perangkat</span>
                    <span className="cn-upload-v2-file-limit">
                      {platform} · Maksimal 50 MB
                    </span>
                    <span className="cn-upload-v2-browse">Browse files</span>
                  </label>
                )}
              </div>

              <div className="cn-upload-v2-hint">
                <AlertCircle size={16} />
                <span>
                  Server tetap memvalidasi ekstensi dan batas ukuran. Jangan
                  unggah file yang tidak kamu miliki hak untuk membagikannya.
                </span>
              </div>

              <div className="cn-upload-v2-preview-heading">
                <div className="cn-upload-v2-preview-icon">
                  <ImagePlus size={20} />
                </div>
                <div>
                  <h3>Cover / preview image</h3>
                  <p>Tambahkan gambar agar resource lebih mudah dikenali.</p>
                </div>
                <span className="cn-upload-v2-optional">OPTIONAL</span>
              </div>

              {previewUrl ? (
                <div className="cn-upload-v2-image-preview">
                  <img src={previewUrl} alt="Preview resource" />
                  <div className="cn-upload-v2-image-overlay">
                    <span><FileImage size={15} /> {preview?.name}</span>
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      aria-label="Hapus gambar preview"
                    >
                      <X size={17} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cn-upload-v2-image-drop" htmlFor="cn-preview-file">
                  <ImagePlus size={25} />
                  <strong>Upload cover image</strong>
                  <span>PNG, JPG, WebP atau GIF · Maksimal 1 MB</span>
                  <input
                    id="cn-preview-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={event => choosePreview(event.target.files?.[0] || null)}
                  />
                </label>
              )}
              <small className="cn-upload-v2-muted">
                Preview gambar saat ini satu file. Galeri multi-gambar memerlukan dukungan tambahan pada backend.
              </small>
            </section>

            <section className="cn-upload-v2-submit-panel">
              <div className="cn-upload-v2-submit-copy">
                <ShieldCheck size={23} />
                <div>
                  <strong>Ready for review?</strong>
                  <p>Resource akan masuk antrean moderasi sebelum diterbitkan.</p>
                </div>
              </div>

              {submitting && (
                <div className="cn-upload-progress" role="status" aria-live="polite">
                  <div className="cn-upload-progress-top">
                    <span><LoaderCircle size={16} className="cn-upload-v2-spin" /> Mengunggah file dan gambar…</span>
                    <strong>{uploadProgress}%</strong>
                  </div>
                  <div className="cn-upload-progress-track" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress} role="progressbar">
                    <span style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className="cn-upload-progress-bottom">
                    <span>{formatSize(uploadBytes.loaded)} / {formatSize(uploadBytes.total || file?.size || 0)}</span>
                    <span>{uploadProgress === 100 ? 'Menunggu konfirmasi server…' : 'Transfer berlangsung'}</span>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="cn-upload-v2-submit"
                disabled={submitting || !apiConfigured}
              >
                {submitting
                  ? <LoaderCircle size={18} className="cn-upload-v2-spin" />
                  : <ArrowUpFromLine size={18} />}
                {submitting ? 'Submitting...' : 'Submit for moderation'}
              </button>

              {!apiConfigured && (
                <p className="cn-upload-v2-api-warning">
                  Upload API belum dikonfigurasi pada deployment ini.
                </p>
              )}

              {notice && (
                <div className={`cn-upload-v2-notice ${notice.type}`} role="status">
                  {notice.type === 'success'
                    ? <CheckCircle2 size={19} />
                    : <AlertCircle size={19} />}
                  <span>{notice.message}</span>
                </div>
              )}
            </section>
          </form>

          <aside className="cn-upload-v2-sidebar">
            <section className="cn-upload-v2-resource-card">
              <div className="cn-upload-v2-card-top">
                <span><Sparkles size={14} /> LIVE PREVIEW</span>
                <span className="cn-upload-v2-pending"><Clock3 size={12} /> Pending</span>
              </div>

              <div className="cn-upload-v2-card-image">
                {previewUrl ? (
                  <img src={previewUrl} alt="" />
                ) : (
                  <div className="cn-upload-v2-placeholder-art">
                    <FileImage size={38} />
                    <span>RESOURCE COVER</span>
                  </div>
                )}
              </div>

              <div className="cn-upload-v2-card-body">
                <div className="cn-upload-v2-card-tags">
                  <span>{platform}</span>
                  <span>{kind}</span>
                </div>
                <h3>{title.trim() || 'Your resource title'}</h3>
                <p className="cn-upload-v2-card-version">
                  Minecraft {version.trim() || 'version'}
                </p>
                <p className="cn-upload-v2-card-description">
                  {description.trim() || 'Deskripsi resource kamu akan tampil di sini sebagai preview sebelum dikirim untuk moderasi.'}
                </p>
                <div className="cn-upload-v2-card-footer">
                  <span><FileText size={14} /> {category}</span>
                  <span><FileArchive size={14} /> {file ? formatSize(file.size) : 'No file yet'}</span>
                </div>
              </div>
            </section>

            <section className="cn-upload-v2-moderation">
              <div className="cn-upload-v2-moderation-icon">
                <ShieldCheck size={23} />
              </div>
              <h3>Moderated by design</h3>
              <p>
                Semua submission diperiksa sebelum masuk ke daftar resource
                publik CubeNest.
              </p>
              <div className="cn-upload-v2-status-list">
                <div>
                  <span className="cn-upload-v2-status-dot pending" />
                  <div><strong>Pending</strong><small>Menunggu pemeriksaan</small></div>
                </div>
                <div>
                  <span className="cn-upload-v2-status-dot approved" />
                  <div><strong>Approved</strong><small>Dapat diterbitkan</small></div>
                </div>
                <div>
                  <span className="cn-upload-v2-status-dot rejected" />
                  <div><strong>Rejected</strong><small>Ditolak dengan alasan</small></div>
                </div>
              </div>
            </section>

            <div className="cn-upload-v2-safety">
              <ShieldCheck size={17} />
              <p>
                <strong>Upload safely.</strong> Jangan kirim malware, file
                curian, atau resource yang tidak punya izin distribusi.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
