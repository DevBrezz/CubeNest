import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, Upload, Undo2, Redo2, Eraser, Paintbrush,
  RotateCcw, User, Eye, EyeOff, X, Play, Pause, RotateCw, Hand,
} from 'lucide-react';
import { SkinViewer, WalkingAnimation, IdleAnimation, RunningAnimation } from 'skinview3d';
import { Raycaster, Vector2, type Object3D, type Intersection } from 'three';
import {
  PRESET_COLORS,
  SkinModel,
  cloneImageData,
  createDefaultSkinData,
} from '../lib/minecraftSkin';
import steveSkinUrl from '../assets/skins/steve.png';
import alexSkinUrl from '../assets/skins/alex.png';

type Tool = 'pencil' | 'eraser';
type TemplateId = 'steve' | 'alex' | 'blank';
type InteractMode = 'draw' | 'rotate';
type PreviewAnim = 'idle' | 'walk' | 'run';
type BodyPartKey = 'head' | 'body' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

const BODY_PARTS: { id: BodyPartKey; label: string }[] = [
  { id: 'head', label: 'Head' },
  { id: 'body', label: 'Body' },
  { id: 'rightArm', label: 'Right Arm' },
  { id: 'leftArm', label: 'Left Arm' },
  { id: 'rightLeg', label: 'Right Leg' },
  { id: 'leftLeg', label: 'Left Leg' },
];

const BUNDLED: Record<'steve' | 'alex', string> = {
  steve: steveSkinUrl,
  alex: alexSkinUrl,
};

function publicSkinUrl(id: 'steve' | 'alex'): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}images/skins/${id}.png`;
}

function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('load failed'));
    img.src = url;
  });
}

async function loadTemplateImage(id: 'steve' | 'alex'): Promise<HTMLImageElement> {
  for (const url of [publicSkinUrl(id), BUNDLED[id]]) {
    try {
      return await loadImage(url);
    } catch {
      /* try next */
    }
  }
  throw new Error('template missing');
}

/** Map a raycast hit to a 64×64 skin pixel via mesh UV. */
function hitToSkinPixel(hit: Intersection): { x: number; y: number } | null {
  const uv = hit.uv;
  if (!uv) return null;
  const x = Math.min(63, Math.max(0, Math.floor(uv.x * 64)));
  const y = Math.min(63, Math.max(0, Math.floor((1 - uv.y) * 64)));
  return { x, y };
}

function findBodyPartName(obj: Object3D | null): BodyPartKey | null {
  let o: Object3D | null = obj;
  while (o) {
    const n = (o.name || '').toLowerCase();
    if (n.includes('head')) return 'head';
    if (n.includes('body') || n.includes('torso')) return 'body';
    if (n.includes('leftarm') || n.includes('left_arm') || n === 'leftarm') return 'leftArm';
    if (n.includes('rightarm') || n.includes('right_arm') || n === 'rightarm') return 'rightArm';
    if (n.includes('leftleg') || n.includes('left_leg') || n === 'leftleg') return 'leftLeg';
    if (n.includes('rightleg') || n.includes('right_leg') || n === 'rightleg') return 'rightLeg';
    o = o.parent;
  }
  return null;
}

export function SkinCreator() {
  const skinCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const editorViewerRef = useRef<SkinViewer | null>(null);
  const previewViewerRef = useRef<SkinViewer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  const paintSyncTimer = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const paintingRef = useRef(false);
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null);

  const [model, setModel] = useState<SkinModel>('classic');
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#5c4033');
  const [mode, setMode] = useState<InteractMode>('draw');
  const [showOuter, setShowOuter] = useState(true);
  const [template, setTemplate] = useState<TemplateId>('steve');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const [hint, setHint] = useState('Draw on the character · switch to Rotate to orbit');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAnim, setPreviewAnim] = useState<PreviewAnim>('idle');
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [partFilter, setPartFilter] = useState<BodyPartKey | 'all'>('all');
  const [inspectPart, setInspectPart] = useState<BodyPartKey | 'all'>('all');
  const [webglError, setWebglError] = useState<string | null>(null);

  const getCtx = () =>
    skinCanvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  const pushHistory = useCallback(() => {
    const ctx = getCtx();
    if (!ctx || !skinCanvasRef.current) return;
    const snap = ctx.getImageData(0, 0, 64, 64);
    setHistory((h) => [...h.slice(-40), cloneImageData(snap)]);
    setFuture([]);
    dirtyRef.current = true;
  }, []);

  const applyVisibility = useCallback(
    (viewer: SkinViewer | null, filter: BodyPartKey | 'all', outer: boolean) => {
      const skin = viewer?.playerObject?.skin;
      if (!skin) return;
      const parts: BodyPartKey[] = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
      for (const p of parts) {
        const part = skin[p];
        if (!part) continue;
        const show = filter === 'all' || filter === p;
        part.visible = show;
        if (part.innerLayer) part.innerLayer.visible = show;
        if (part.outerLayer) part.outerLayer.visible = show && outer;
      }
    },
    [],
  );

  const syncEditorSkin = useCallback(async () => {
    const canvas = skinCanvasRef.current;
    const viewer = editorViewerRef.current;
    if (!canvas || !viewer) return;
    try {
      await viewer.loadSkin(canvas, { model: model === 'slim' ? 'slim' : 'default' });
      applyVisibility(viewer, partFilter, showOuter);
    } catch {
      /* transient */
    }
  }, [model, partFilter, showOuter, applyVisibility]);

  const scheduleSkinSync = useCallback(() => {
    if (paintSyncTimer.current) window.clearTimeout(paintSyncTimer.current);
    paintSyncTimer.current = window.setTimeout(() => {
      void syncEditorSkin();
    }, 40);
  }, [syncEditorSkin]);

  const paintPixel = (x: number, y: number, recordHistory: boolean) => {
    const ctx = getCtx();
    if (!ctx) return;
    if (recordHistory) pushHistory();
    const [r, g, b, a] = tool === 'eraser' ? [0, 0, 0, 0] : hexToRgba(color);
    const img = ctx.createImageData(1, 1);
    img.data[0] = r;
    img.data[1] = g;
    img.data[2] = b;
    img.data[3] = a;
    ctx.putImageData(img, x, y);
    dirtyRef.current = true;
    scheduleSkinSync();
  };

  const raycastPaint = (clientX: number, clientY: number, isStart: boolean) => {
    const viewer = editorViewerRef.current;
    const canvas = editorCanvasRef.current;
    if (!viewer || !canvas || mode !== 'draw') return;

    const rect = canvas.getBoundingClientRect();
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
    pointer.current.set(ndcX, ndcY);

    raycaster.current.setFromCamera(pointer.current, viewer.camera);
    const skinRoot = viewer.playerObject?.skin;
    if (!skinRoot) return;

    const targets: Object3D[] = [];
    skinRoot.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) targets.push(o);
    });

    const hits = raycaster.current.intersectObjects(targets, false);
    if (!hits.length) return;

    const hit = hits[0];
    if (partFilter !== 'all') {
      const part = findBodyPartName(hit.object);
      if (part && part !== partFilter) return;
    }

    const px = hitToSkinPixel(hit);
    if (!px) return;

    const last = lastPixelRef.current;
    if (last && last.x === px.x && last.y === px.y && !isStart) return;
    lastPixelRef.current = px;
    paintPixel(px.x, px.y, isStart);
  };

  const onEditorPointer = (e: React.PointerEvent, type: 'down' | 'move' | 'up') => {
    if (mode !== 'draw') return;
    if (type === 'down') {
      paintingRef.current = true;
      lastPixelRef.current = null;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      if (editorViewerRef.current?.controls) {
        editorViewerRef.current.controls.enabled = false;
      }
      raycastPaint(e.clientX, e.clientY, true);
    } else if (type === 'move' && paintingRef.current) {
      raycastPaint(e.clientX, e.clientY, false);
    } else if (type === 'up') {
      paintingRef.current = false;
      lastPixelRef.current = null;
      if (editorViewerRef.current?.controls) {
        editorViewerRef.current.controls.enabled = mode === 'rotate';
      }
      void syncEditorSkin();
    }
  };

  const drawImageToSkin = (img: CanvasImageSource, w: number, h: number) => {
    const ctx = getCtx();
    if (!ctx || !skinCanvasRef.current) return;
    ctx.clearRect(0, 0, 64, 64);
    ctx.imageSmoothingEnabled = false;
    const dw = Math.min(w, 64);
    const dh = Math.min(h, 64);
    ctx.drawImage(img, 0, 0, dw, dh, 0, 0, dw, dh);
    dirtyRef.current = false;
    setHistory([]);
    setFuture([]);
    void syncEditorSkin();
  };

  const loadTemplate = async (id: TemplateId, force = false) => {
    if (!force && dirtyRef.current) {
      if (!window.confirm('You have unsaved edits. Switch template and discard changes?')) return;
    }
    const ctx = getCtx();
    if (!ctx) return;

    if (id === 'blank') {
      pushHistory();
      ctx.putImageData(createDefaultSkinData(), 0, 0);
      dirtyRef.current = false;
      setHistory([]);
      setFuture([]);
      setTemplate('blank');
      setModel('classic');
      void syncEditorSkin();
      setHint('Loaded blank template.');
      return;
    }

    try {
      const img = await loadTemplateImage(id);
      if (dirtyRef.current) pushHistory();
      drawImageToSkin(img, img.width, img.height);
      setTemplate(id);
      setModel(id === 'alex' ? 'slim' : 'classic');
      setHint(`Loaded ${id === 'steve' ? 'Steve' : 'Alex'} default skin.`);
    } catch {
      ctx.putImageData(createDefaultSkinData(), 0, 0);
      setTemplate(id);
      setModel(id === 'alex' ? 'slim' : 'classic');
      void syncEditorSkin();
      setHint('Could not load template. Using generated default.');
    }
  };

  useEffect(() => {
    const el = editorCanvasRef.current;
    const skinEl = skinCanvasRef.current;
    if (!el || !skinEl) return;

    skinEl.width = 64;
    skinEl.height = 64;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    let viewer: SkinViewer;
    try {
      viewer = new SkinViewer({
        canvas: el,
        width: isMobile ? 320 : 420,
        height: isMobile ? 400 : 520,
        model: 'default',
        background: 0x0b1220,
        animation: undefined,
        zoom: 0.85,
        enableControls: true,
      });
    } catch {
      setWebglError('WebGL is not available on this device. Skin Creator needs WebGL.');
      return;
    }

    viewer.autoRotate = false;
    try {
      viewer.renderer.setPixelRatio(dpr);
    } catch {
      /* ignore */
    }
    if (viewer.controls) {
      viewer.controls.enablePan = false;
      viewer.controls.enabled = false;
    }
    editorViewerRef.current = viewer;

    void (async () => {
      try {
        const img = await loadTemplateImage('steve');
        const ctx = skinEl.getContext('2d', { willReadFrequently: true })!;
        ctx.clearRect(0, 0, 64, 64);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 64, 64);
      } catch {
        const ctx = skinEl.getContext('2d', { willReadFrequently: true })!;
        ctx.putImageData(createDefaultSkinData(), 0, 0);
      }
      try {
        await viewer.loadSkin(skinEl, { model: 'default' });
      } catch {
        /* ignore */
      }
    })();

    const onVis = () => {
      if (!editorViewerRef.current) return;
      if (document.hidden) {
        editorViewerRef.current.autoRotate = false;
        editorViewerRef.current.animation = null;
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (paintSyncTimer.current) window.clearTimeout(paintSyncTimer.current);
      viewer.dispose();
      editorViewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void syncEditorSkin();
  }, [syncEditorSkin]);

  useEffect(() => {
    const v = editorViewerRef.current;
    if (v?.controls) v.controls.enabled = mode === 'rotate';
  }, [mode]);

  useEffect(() => {
    if (!previewOpen) {
      if (previewViewerRef.current) {
        previewViewerRef.current.dispose();
        previewViewerRef.current = null;
      }
      return;
    }
    const el = previewCanvasRef.current;
    const skinEl = skinCanvasRef.current;
    if (!el || !skinEl) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const viewer = new SkinViewer({
      canvas: el,
      width: isMobile ? Math.min(window.innerWidth - 48, 360) : 480,
      height: isMobile ? 420 : 560,
      model: model === 'slim' ? 'slim' : 'default',
      background: 0x0b1220,
      animation: new IdleAnimation(),
      zoom: 0.9,
      enableControls: true,
    });
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.5;
    try {
      viewer.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    } catch {
      /* ignore */
    }
    previewViewerRef.current = viewer;

    void (async () => {
      try {
        await viewer.loadSkin(skinEl, { model: model === 'slim' ? 'slim' : 'default' });
        applyVisibility(viewer, inspectPart, showOuter);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      viewer.dispose();
      previewViewerRef.current = null;
    };
  }, [previewOpen, model, applyVisibility, inspectPart, showOuter]);

  useEffect(() => {
    const v = previewViewerRef.current;
    if (!v || !previewOpen) return;
    if (!previewPlaying) {
      v.animation = null;
      v.autoRotate = false;
      return;
    }
    v.autoRotate = true;
    if (previewAnim === 'walk') v.animation = new WalkingAnimation();
    else if (previewAnim === 'run') v.animation = new RunningAnimation();
    else v.animation = new IdleAnimation();
  }, [previewAnim, previewPlaying, previewOpen]);

  useEffect(() => {
    applyVisibility(previewViewerRef.current, inspectPart, showOuter);
  }, [inspectPart, showOuter, applyVisibility, previewOpen]);

  const undo = () => {
    const ctx = getCtx();
    if (!ctx || !history.length) return;
    const current = ctx.getImageData(0, 0, 64, 64);
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [...f, cloneImageData(current)]);
    ctx.putImageData(prev, 0, 0);
    void syncEditorSkin();
  };

  const redo = () => {
    const ctx = getCtx();
    if (!ctx || !future.length) return;
    const current = ctx.getImageData(0, 0, 64, 64);
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setHistory((h) => [...h, cloneImageData(current)]);
    ctx.putImageData(next, 0, 0);
    void syncEditorSkin();
  };

  const resetSkin = () => {
    if (!window.confirm('Reset skin and lose unsaved edits?')) return;
    void loadTemplate(template === 'blank' ? 'steve' : template, true);
  };

  const exportPng = () => {
    const skin = skinCanvasRef.current;
    if (!skin) return;
    skin.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cubenest-skin-${model}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      dirtyRef.current = false;
      setHint(`Exported 64×64 PNG (${model}).`);
    }, 'image/png');
  };

  const importPng = (file: File) => {
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      setHint('Please choose a PNG skin (64×64).');
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ctx = getCtx();
      if (!ctx) return;
      if (img.width < 64 || img.height < 32) {
        setHint('Image too small. Use a 64×64 Minecraft skin PNG.');
        return;
      }
      pushHistory();
      ctx.clearRect(0, 0, 64, 64);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        0,
        0,
        Math.min(img.width, 64),
        Math.min(img.height, 64),
        0,
        0,
        Math.min(img.width, 64),
        Math.min(img.height, 64),
      );
      dirtyRef.current = true;
      void syncEditorSkin();
      setHint('Skin imported.');
    };
    img.onerror = () => setHint('Could not read that image.');
    img.src = URL.createObjectURL(file);
  };

  if (webglError) {
    return (
      <div className="pt-20 pb-28 min-h-screen mc-grid-bg px-4">
        <div className="max-w-lg mx-auto mt-10 rounded-2xl border border-red-500/40 bg-mc-surface p-6 text-center">
          <p className="text-red-300 font-semibold">{webglError}</p>
          <p className="text-sm text-mc-muted mt-2">Try another browser or enable hardware acceleration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <canvas ref={skinCanvasRef} className="hidden" width={64} height={64} />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,.png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importPng(f);
          e.target.value = '';
        }}
      />

      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <header className="rounded-2xl border border-fuchsia-500/20 bg-mc-surface p-4 sm:p-5 mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-mc-white">
            Skin <span className="text-fuchsia-300">Creator</span>
          </h1>
          <p className="text-sm text-mc-muted mt-1">
            Draw on Character — paint directly on the 3D model. Use Preview for animations.
          </p>
          <p className="text-xs text-fuchsia-200/80 mt-2" role="status">
            {hint}
          </p>
        </header>

        <div className="flex flex-wrap gap-2 mb-3">
          {([
            { id: 'steve' as const, label: 'Steve' },
            { id: 'alex' as const, label: 'Alex' },
            { id: 'blank' as const, label: 'Blank' },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void loadTemplate(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border min-h-[44px] ${
                template === t.id
                  ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                  : 'bg-mc-gray border-mc-border text-mc-text'
              }`}
            >
              <User className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div className="space-y-3">
            <div className="rounded-2xl border border-mc-border bg-mc-surface overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-mc-border flex-wrap gap-2">
                <span className="text-xs font-semibold text-mc-white">Draw on Character</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMode('draw')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border min-h-[36px] ${
                      mode === 'draw'
                        ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                        : 'border-mc-border text-mc-muted'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" /> Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('rotate')}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border min-h-[36px] ${
                      mode === 'rotate'
                        ? 'bg-sky-500 border-sky-400 text-slate-950'
                        : 'border-mc-border text-mc-muted'
                    }`}
                  >
                    <Hand className="w-3.5 h-3.5" /> Rotate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOuter((v) => !v)}
                    className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] text-mc-muted min-h-[36px]"
                  >
                    {showOuter ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Outer
                  </button>
                </div>
              </div>
              <div
                className="flex justify-center bg-[#0b1220] touch-none"
                style={{ cursor: mode === 'draw' ? 'crosshair' : 'grab' }}
              >
                <canvas
                  ref={editorCanvasRef}
                  className="max-w-full rounded-b-lg"
                  style={{ width: 'min(100%, 420px)', height: 'auto', touchAction: 'none' }}
                  onPointerDown={(e) => onEditorPointer(e, 'down')}
                  onPointerMove={(e) => onEditorPointer(e, 'move')}
                  onPointerUp={(e) => onEditorPointer(e, 'up')}
                  onPointerCancel={(e) => onEditorPointer(e, 'up')}
                />
              </div>
              <p className="text-[11px] text-mc-muted text-center py-2">
                {mode === 'draw'
                  ? 'Tap or drag on the character to paint'
                  : 'Drag to rotate · scroll to zoom'}
              </p>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-2 flex flex-wrap gap-2 items-center">
              <button
                type="button"
                onClick={() => setTool('pencil')}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] ${
                  tool === 'pencil'
                    ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                    : 'bg-mc-gray border-mc-border text-mc-text'
                }`}
              >
                <Paintbrush className="w-4 h-4" /> Pencil
              </button>
              <button
                type="button"
                onClick={() => setTool('eraser')}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] ${
                  tool === 'eraser'
                    ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                    : 'bg-mc-gray border-mc-border text-mc-text'
                }`}
              >
                <Eraser className="w-4 h-4" /> Eraser
              </button>
              <button
                type="button"
                onClick={undo}
                disabled={!history.length}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray disabled:opacity-40 min-h-[44px]"
              >
                <Undo2 className="w-4 h-4" /> Undo
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!future.length}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray disabled:opacity-40 min-h-[44px]"
              >
                <Redo2 className="w-4 h-4" /> Redo
              </button>
              <button
                type="button"
                onClick={resetSkin}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" /> Reset Skin
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray min-h-[44px]"
              >
                <Upload className="w-4 h-4" /> Import Skin
              </button>
              <button
                type="button"
                onClick={exportPng}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Export PNG
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-fuchsia-500 text-slate-950 min-h-[44px]"
              >
                <Play className="w-4 h-4" /> Preview
              </button>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-2">Model</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'classic' as const, label: 'Classic', sub: 'Steve · 4px arms' },
                    { id: 'slim' as const, label: 'Slim', sub: 'Alex · 3px arms' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`text-left rounded-xl border px-3 py-3 min-h-[52px] ${
                      model === m.id
                        ? 'border-fuchsia-400/60 bg-fuchsia-500/15'
                        : 'border-mc-border bg-mc-gray'
                    }`}
                  >
                    <span className="text-sm font-bold text-mc-white">{m.label}</span>
                    <span className="block text-[11px] text-mc-muted mt-0.5">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-2">Body Parts</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPartFilter('all')}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-medium min-h-[40px] ${
                    partFilter === 'all'
                      ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                      : 'border-mc-border bg-mc-gray text-mc-muted'
                  }`}
                >
                  Show All Parts
                </button>
                {BODY_PARTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPartFilter(p.id)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-medium text-left min-h-[40px] ${
                      partFilter === p.id
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-mc-border bg-mc-gray text-mc-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-mc-muted mt-2">
                Selecting a part isolates it and limits painting to that surface.
              </p>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-2">Color</p>
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-14 rounded-lg border border-mc-border bg-transparent cursor-pointer"
                  aria-label="Custom color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl bg-mc-gray border border-mc-border px-3 py-2 text-sm font-mono text-mc-white min-h-[44px]"
                />
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-md border-2 min-h-[28px] ${
                      color === c ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-mc-muted leading-relaxed">
              <p className="font-semibold text-emerald-200 mb-1">How to use</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Choose Steve or Alex.</li>
                <li>Use Draw mode and paint on the 3D character.</li>
                <li>Switch to Rotate to inspect angles.</li>
                <li>Open Preview for idle / walk / run animations.</li>
                <li>Export PNG for the Minecraft launcher.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          role="dialog"
          aria-modal="true"
          aria-label="Skin preview"
        >
          <div className="w-full max-w-lg rounded-2xl border border-mc-border bg-mc-surface shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-mc-border">
              <h2 className="text-sm font-bold text-mc-white flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-fuchsia-300" /> Preview
              </h2>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-lg border border-mc-border text-mc-muted hover:text-mc-white min-h-[40px] min-w-[40px]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center bg-[#0b1220] py-2">
              <canvas ref={previewCanvasRef} className="max-w-full" />
            </div>

            <div className="p-3 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[11px] text-mc-muted font-semibold uppercase">Animation</span>
                {(['idle', 'walk', 'run'] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setPreviewAnim(a);
                      setPreviewPlaying(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize min-h-[36px] ${
                      previewAnim === a
                        ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                        : 'border-mc-border text-mc-muted'
                    }`}
                  >
                    {a}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPreviewPlaying((p) => !p)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border border-mc-border min-h-[36px]"
                >
                  {previewPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Play
                    </>
                  )}
                </button>
              </div>

              <div>
                <p className="text-[11px] text-mc-muted font-semibold uppercase mb-1.5">
                  Part Inspection
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setInspectPart('all')}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border min-h-[32px] ${
                      inspectPart === 'all'
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-mc-border text-mc-muted'
                    }`}
                  >
                    Show All Parts
                  </button>
                  {BODY_PARTS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setInspectPart(p.id)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] border min-h-[32px] ${
                        inspectPart === p.id
                          ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                          : 'border-mc-border text-mc-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-mc-muted">
                Drag to rotate · your edits stay when you close Preview.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
