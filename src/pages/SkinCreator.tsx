import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download, Upload, Undo2, Redo2, Eraser, Paintbrush, Pipette, PaintBucket,
  RotateCcw, User, Grid3x3, Eye, EyeOff, ZoomIn, ZoomOut, Trash2,
} from 'lucide-react';
import { SkinViewer, WalkingAnimation, IdleAnimation } from 'skinview3d';
import {
  ALL_PARTS,
  BodyPartId,
  LayerId,
  PART_LABELS,
  PRESET_COLORS,
  SkinModel,
  cloneImageData,
  createDefaultSkinData,
  floodFill,
  partUv,
} from '../lib/minecraftSkin';

type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';
type TemplateId = 'steve' | 'alex' | 'blank';

const BASE_SCALE = 8;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;

/** Resolve public asset URL (works with Vite base path). */
function assetUrl(path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/');
  return `${base}${path.replace(/^\//, '')}`;
}

function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function rgbaToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

async function loadSkinImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

export function SkinCreator() {
  const skinRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const paintTimer = useRef<number | null>(null);
  const dirtyRef = useRef(false);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const [model, setModel] = useState<SkinModel>('classic');
  const [layer, setLayer] = useState<LayerId>('base');
  const [part, setPart] = useState<BodyPartId>('head');
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#5c4033');
  const [showGrid, setShowGrid] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [anim, setAnim] = useState<'idle' | 'walk' | 'none'>('idle');
  const [painting, setPainting] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future, setFuture] = useState<ImageData[]>([]);
  const [hint, setHint] = useState('Select Steve or Alex, then paint on the UV map.');
  const [zoom, setZoom] = useState(1);
  const [template, setTemplate] = useState<TemplateId>('steve');
  const [previewReady, setPreviewReady] = useState(false);

  const getSkinCtx = () => skinRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  const pushHistory = useCallback(() => {
    const ctx = getSkinCtx();
    if (!ctx || !skinRef.current) return;
    const snap = ctx.getImageData(0, 0, 64, 64);
    setHistory((h) => [...h.slice(-40), cloneImageData(snap)]);
    setFuture([]);
    dirtyRef.current = true;
  }, []);

  const syncViewer = useCallback(async () => {
    const skin = skinRef.current;
    const viewer = viewerRef.current;
    if (!skin || !viewer) return;
    try {
      await viewer.loadSkin(skin, {
        model: model === 'slim' ? 'slim' : 'default',
      });
      const player = viewer.playerObject;
      if (player?.skin) {
        const layerVisible = showOverlay;
        player.skin.head.outerLayer.visible = layerVisible;
        player.skin.body.outerLayer.visible = layerVisible;
        player.skin.leftArm.outerLayer.visible = layerVisible;
        player.skin.rightArm.outerLayer.visible = layerVisible;
        player.skin.leftLeg.outerLayer.visible = layerVisible;
        player.skin.rightLeg.outerLayer.visible = layerVisible;
      }
    } catch {
      /* ignore transient load errors while painting */
    }
  }, [model, showOverlay]);

  const redrawEditor = useCallback(() => {
    const skin = skinRef.current;
    const ed = editorRef.current;
    if (!skin || !ed) return;
    const cell = Math.round(BASE_SCALE * zoom);
    const size = 64 * cell;
    if (ed.width !== size || ed.height !== size) {
      ed.width = size;
      ed.height = size;
    }
    const ctx = ed.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);

    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1f24' : '#12161a';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    ctx.drawImage(skin, 0, 0, 64, 64, 0, 0, size, size);

    const uv = partUv(part, layer, model);
    ctx.save();
    ctx.strokeStyle = layer === 'overlay' ? 'rgba(56,189,248,0.95)' : 'rgba(52,211,153,0.95)';
    ctx.lineWidth = Math.max(1, Math.round(2 * zoom));
    for (const face of Object.values(uv)) {
      ctx.strokeRect(face.x * cell + 1, face.y * cell + 1, face.w * cell - 2, face.h * cell - 2);
    }
    ctx.restore();

    if (showGrid && zoom >= 0.75) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 64; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size, i * cell);
        ctx.stroke();
      }
    }
  }, [part, layer, model, showGrid, zoom]);

  const scheduleViewerSync = useCallback(() => {
    if (paintTimer.current) window.clearTimeout(paintTimer.current);
    paintTimer.current = window.setTimeout(() => {
      void syncViewer();
    }, 120);
  }, [syncViewer]);

  const applyImageToSkin = useCallback(
    (img: CanvasImageSource, w: number, h: number) => {
      const ctx = getSkinCtx();
      if (!ctx || !skinRef.current) return;
      ctx.clearRect(0, 0, 64, 64);
      ctx.imageSmoothingEnabled = false;
      const dw = Math.min(w, 64);
      const dh = Math.min(h, 64);
      ctx.drawImage(img, 0, 0, dw, dh, 0, 0, dw, dh);
      dirtyRef.current = false;
      setHistory([]);
      setFuture([]);
      redrawEditor();
      void syncViewer();
    },
    [redrawEditor, syncViewer],
  );

  const loadTemplate = useCallback(
    async (id: TemplateId, force = false) => {
      if (!force && dirtyRef.current) {
        const ok = window.confirm(
          'You have unsaved edits. Switch template and discard changes?',
        );
        if (!ok) return;
      }
      const ctx = getSkinCtx();
      if (!ctx) return;

      if (id === 'blank') {
        pushHistory();
        ctx.putImageData(createDefaultSkinData(), 0, 0);
        dirtyRef.current = false;
        setHistory([]);
        setFuture([]);
        setTemplate('blank');
        setModel('classic');
        redrawEditor();
        void syncViewer();
        setHint('Loaded blank Steve-style template.');
        return;
      }

      const url = assetUrl(`images/skins/${id}.png`);
      try {
        const img = await loadSkinImage(url);
        if (dirtyRef.current) pushHistory();
        applyImageToSkin(img, img.width, img.height);
        setTemplate(id);
        setModel(id === 'alex' ? 'slim' : 'classic');
        setHint(`Loaded ${id === 'steve' ? 'Steve' : 'Alex'} default skin.`);
      } catch {
        setHint('Could not load template image. Using generated default.');
        ctx.putImageData(createDefaultSkinData(), 0, 0);
        setTemplate(id);
        setModel(id === 'alex' ? 'slim' : 'classic');
        redrawEditor();
        void syncViewer();
      }
    },
    [applyImageToSkin, pushHistory, redrawEditor, syncViewer],
  );

  // Init skin + 3D viewer (lightweight defaults for mobile)
  useEffect(() => {
    const c = skinRef.current;
    const pc = previewCanvasRef.current;
    if (!c || !pc) return;
    c.width = 64;
    c.height = 64;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vw = isMobile ? 240 : 320;
    const vh = isMobile ? 280 : 380;

    const viewer = new SkinViewer({
      canvas: pc,
      width: vw,
      height: vh,
      skin: c,
      model: 'default',
      background: 0x0b1220,
      animation: reducedMotion ? undefined : new IdleAnimation(),
      zoom: 0.9,
      enableControls: true,
    });
    viewer.autoRotate = !isMobile && !reducedMotion;
    viewer.autoRotateSpeed = 0.4;
    viewerRef.current = viewer;
    setPreviewReady(true);

    // Load Steve by default
    void (async () => {
      try {
        const img = await loadSkinImage(assetUrl('images/skins/steve.png'));
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.clearRect(0, 0, 64, 64);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 64, 64);
      } catch {
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.putImageData(createDefaultSkinData(), 0, 0);
      }
      redrawEditor();
      void syncViewer();
    })();

    // Pause rendering when tab/page hidden or preview off-screen
    const onVisibility = () => {
      if (!viewerRef.current) return;
      if (document.hidden) {
        viewerRef.current.autoRotate = false;
        viewerRef.current.animation = null;
      } else if (!reducedMotion) {
        viewerRef.current.autoRotate = !isMobile;
        if (anim === 'walk') viewerRef.current.animation = new WalkingAnimation();
        else if (anim === 'idle') viewerRef.current.animation = new IdleAnimation();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    let io: IntersectionObserver | null = null;
    if (previewWrapRef.current && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          const vis = entries.some((e) => e.isIntersecting);
          if (!viewerRef.current) return;
          if (!vis) {
            viewerRef.current.autoRotate = false;
            viewerRef.current.animation = null;
          } else if (!document.hidden && !reducedMotion) {
            viewerRef.current.autoRotate = !isMobile;
            if (anim === 'walk') viewerRef.current.animation = new WalkingAnimation();
            else if (anim === 'idle') viewerRef.current.animation = new IdleAnimation();
          }
        },
        { threshold: 0.15 },
      );
      io.observe(previewWrapRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    redrawEditor();
  }, [redrawEditor]);

  useEffect(() => {
    void syncViewer();
  }, [syncViewer]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || document.hidden) {
      v.animation = null;
      return;
    }
    if (anim === 'walk') v.animation = new WalkingAnimation();
    else if (anim === 'idle') v.animation = new IdleAnimation();
    else v.animation = null;
  }, [anim]);

  const paintAt = (clientX: number, clientY: number, isStart: boolean) => {
    const ed = editorRef.current;
    const skin = skinRef.current;
    const ctx = getSkinCtx();
    if (!ed || !skin || !ctx) return;
    const rect = ed.getBoundingClientRect();
    const x = Math.floor(((clientX - rect.left) / rect.width) * 64);
    const y = Math.floor(((clientY - rect.top) / rect.height) * 64);
    if (x < 0 || y < 0 || x >= 64 || y >= 64) return;

    if (tool === 'eyedropper') {
      const px = ctx.getImageData(x, y, 1, 1).data;
      if (px[3] > 0) setColor(rgbaToHex(px[0], px[1], px[2]));
      setTool('pencil');
      setHint('Color sampled · switched to pencil');
      return;
    }

    if (isStart) pushHistory();

    const [r, g, b, a] = tool === 'eraser' ? [0, 0, 0, 0] : hexToRgba(color);

    if (tool === 'fill') {
      const img = ctx.getImageData(0, 0, 64, 64);
      floodFill(img, x, y, r, g, b, a);
      ctx.putImageData(img, 0, 0);
    } else {
      const img = ctx.createImageData(1, 1);
      img.data[0] = r;
      img.data[1] = g;
      img.data[2] = b;
      img.data[3] = a;
      ctx.putImageData(img, x, y);
    }
    dirtyRef.current = true;
    redrawEditor();
    scheduleViewerSync();
  };

  const onEditorPointer = (e: React.PointerEvent, type: 'down' | 'move' | 'up') => {
    if (type === 'down') {
      setPainting(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      paintAt(e.clientX, e.clientY, true);
    } else if (type === 'move' && painting) {
      paintAt(e.clientX, e.clientY, false);
    } else if (type === 'up') {
      setPainting(false);
      scheduleViewerSync();
    }
  };

  const undo = () => {
    const ctx = getSkinCtx();
    if (!ctx || history.length === 0) return;
    const current = ctx.getImageData(0, 0, 64, 64);
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [...f, cloneImageData(current)]);
    ctx.putImageData(prev, 0, 0);
    redrawEditor();
    void syncViewer();
  };

  const redo = () => {
    const ctx = getSkinCtx();
    if (!ctx || future.length === 0) return;
    const current = ctx.getImageData(0, 0, 64, 64);
    const next = future[future.length - 1];
    setFuture((f) => f.slice(0, -1));
    setHistory((h) => [...h, cloneImageData(current)]);
    ctx.putImageData(next, 0, 0);
    redrawEditor();
    void syncViewer();
  };

  const resetDefault = () => {
    if (!window.confirm('Reset to the current template and lose unsaved edits?')) return;
    void loadTemplate(template === 'blank' ? 'steve' : template, true);
  };

  const clearSelectedPart = () => {
    const ctx = getSkinCtx();
    if (!ctx) return;
    pushHistory();
    const uv = partUv(part, layer, model);
    for (const face of Object.values(uv)) {
      const img = ctx.getImageData(face.x, face.y, face.w, face.h);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = 0;
        img.data[i + 1] = 0;
        img.data[i + 2] = 0;
        img.data[i + 3] = 0;
      }
      ctx.putImageData(img, face.x, face.y);
    }
    dirtyRef.current = true;
    redrawEditor();
    scheduleViewerSync();
    setHint(`Cleared ${PART_LABELS[part]} (${layer}).`);
  };

  const exportPng = () => {
    const skin = skinRef.current;
    if (!skin) return;
    skin.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cubenest-skin-${model}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setHint(`Exported 64×64 PNG (${model}). Java Launcher → Skins → upload · match Classic/Slim.`);
      dirtyRef.current = false;
    }, 'image/png');
  };

  const importPng = (file: File) => {
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      setHint('Please choose a PNG skin texture (64×64 or 64×32).');
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ctx = getSkinCtx();
      if (!ctx) return;
      if (img.width < 64 || img.height < 32) {
        setHint('Image too small. Use a 64×64 (or legacy 64×32) Minecraft skin PNG.');
        return;
      }
      pushHistory();
      ctx.clearRect(0, 0, 64, 64);
      ctx.imageSmoothingEnabled = false;
      const dw = Math.min(img.width, 64);
      const dh = Math.min(img.height, 64);
      ctx.drawImage(img, 0, 0, dw, dh, 0, 0, dw, dh);
      dirtyRef.current = true;
      redrawEditor();
      void syncViewer();
      setHint('Skin imported.');
    };
    img.onerror = () => setHint('Could not read that image.');
    img.src = URL.createObjectURL(file);
  };

  const tools: { id: Tool; icon: typeof Paintbrush; label: string }[] = [
    { id: 'pencil', icon: Paintbrush, label: 'Pencil' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'eyedropper', icon: Pipette, label: 'Pick' },
  ];

  return (
    <div className="pt-20 pb-28 min-h-screen mc-grid-bg">
      <canvas ref={skinRef} className="hidden" width={64} height={64} />
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-mc-surface p-4 sm:p-6 mb-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">
            CubeNest Skin Creator
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-mc-white mt-2">
            Skin <span className="text-fuchsia-300">Creator</span>
          </h1>
          <p className="text-sm text-mc-muted mt-1 max-w-2xl">
            Paint Classic or Slim Minecraft skins. Export a ready 64×64 PNG — stays on CubeNest.
          </p>
          <p className="text-xs text-fuchsia-200/80 mt-2" role="status">
            {hint}
          </p>
        </section>

        {/* Template picker — Steve / Alex */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => void loadTemplate('steve')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border min-h-[44px] ${
              template === 'steve'
                ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                : 'bg-mc-gray border-mc-border text-mc-text hover:border-fuchsia-500/40'
            }`}
          >
            <User className="w-4 h-4" /> Steve
          </button>
          <button
            type="button"
            onClick={() => void loadTemplate('alex')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border min-h-[44px] ${
              template === 'alex'
                ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                : 'bg-mc-gray border-mc-border text-mc-text hover:border-fuchsia-500/40'
            }`}
          >
            <User className="w-4 h-4" /> Alex
          </button>
          <button
            type="button"
            onClick={() => void loadTemplate('blank')}
            className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border min-h-[44px] ${
              template === 'blank'
                ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                : 'bg-mc-gray border-mc-border text-mc-muted'
            }`}
          >
            Blank template
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* UV editor */}
              <div className="rounded-2xl border border-mc-border bg-mc-surface overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-mc-border gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-mc-white">UV map · 64×64</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))}
                      className="p-1.5 rounded-lg border border-mc-border text-mc-muted hover:text-mc-white"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-mc-muted w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))}
                      className="p-1.5 rounded-lg border border-mc-border text-mc-muted hover:text-mc-white"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowGrid((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] text-mc-muted hover:text-mc-white ml-1"
                    >
                      <Grid3x3 className="w-3.5 h-3.5" /> Grid
                    </button>
                  </div>
                </div>
                <div className="p-2 sm:p-3 flex justify-center bg-black/30 overflow-auto max-h-[70vh]">
                  <canvas
                    ref={editorRef}
                    width={64 * BASE_SCALE}
                    height={64 * BASE_SCALE}
                    className="rounded-lg cursor-crosshair touch-none border border-white/5"
                    style={{
                      width: 'min(100%, 360px)',
                      imageRendering: 'pixelated',
                      touchAction: 'none',
                    }}
                    onPointerDown={(e) => onEditorPointer(e, 'down')}
                    onPointerMove={(e) => onEditorPointer(e, 'move')}
                    onPointerUp={(e) => onEditorPointer(e, 'up')}
                    onPointerLeave={() => setPainting(false)}
                    onPointerCancel={() => setPainting(false)}
                  />
                </div>
              </div>

              {/* 3D preview */}
              <div className="rounded-2xl border border-mc-border bg-mc-surface overflow-hidden" ref={previewWrapRef}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-mc-border gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-mc-white">3D preview</span>
                  <div className="flex items-center gap-1">
                    {(['idle', 'walk', 'none'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAnim(a)}
                        className={`px-2 py-1 rounded-md text-[10px] font-semibold border capitalize min-h-[32px] ${
                          anim === a ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950' : 'border-mc-border text-mc-muted'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowOverlay((v) => !v)}
                      className="inline-flex items-center gap-1 text-[11px] text-mc-muted hover:text-mc-white ml-1 min-h-[32px]"
                    >
                      {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      Overlay
                    </button>
                  </div>
                </div>
                <div className="p-3 flex justify-center bg-[#0b1220] min-h-[200px]">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-w-full rounded-lg"
                    style={{ width: 'min(100%, 320px)', height: 'auto' }}
                  />
                </div>
                <p className="text-[11px] text-mc-muted text-center pb-2">
                  {previewReady ? 'Drag to orbit · scroll to zoom' : 'Loading preview…'}
                </p>
              </div>
            </div>

            {/* Toolbar — large tap targets */}
            <div className="rounded-2xl border border-mc-border bg-mc-surface p-2 sm:p-3 flex flex-wrap gap-2 items-center">
              {tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-colors ${
                    tool === t.id
                      ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                      : 'bg-mc-gray border-mc-border text-mc-text hover:border-fuchsia-500/40'
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
              <span className="w-px h-6 bg-mc-border mx-0.5 hidden sm:block" />
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
                onClick={clearSelectedPart}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray min-h-[44px]"
                title="Clear selected body part"
              >
                <Trash2 className="w-4 h-4" /> Clear part
              </button>
              <button
                type="button"
                onClick={resetDefault}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray min-h-[44px]"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs border border-mc-border bg-mc-gray min-h-[44px]"
              >
                <Upload className="w-4 h-4" /> Import
              </button>
              <button
                type="button"
                onClick={exportPng}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 min-h-[44px]"
              >
                <Download className="w-4 h-4" /> Export PNG
              </button>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3 sm:p-4">
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
                    className={`text-left rounded-xl border px-3 py-3 min-h-[52px] transition-colors ${
                      model === m.id ? 'border-fuchsia-400/60 bg-fuchsia-500/15' : 'border-mc-border bg-mc-gray hover:border-fuchsia-500/30'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-mc-white">
                      <User className="w-4 h-4" /> {m.label}
                    </span>
                    <span className="block text-[11px] text-mc-muted mt-0.5">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-2">Layer</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'base' as const, label: 'Base' },
                    { id: 'overlay' as const, label: 'Overlay' },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayer(l.id)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold min-h-[40px] ${
                      layer === l.id ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200' : 'border-mc-border bg-mc-gray text-mc-text'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-mc-muted mt-2 leading-relaxed">
                Base = body colors. Overlay = hat / jacket / sleeves (eraser = transparent).
              </p>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-2">Body part</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_PARTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPart(p)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-medium text-left min-h-[40px] ${
                      part === p
                        ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-mc-border bg-mc-gray text-mc-muted hover:text-mc-white'
                    }`}
                  >
                    {PART_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3 sm:p-4">
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
                  aria-label="Color hex"
                />
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-md border-2 min-h-[28px] ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 sm:p-4 text-xs text-mc-muted leading-relaxed">
              <p className="font-semibold text-emerald-200 mb-1">How to use</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Pick Steve or Alex, then paint on the UV map.</li>
                <li>Export PNG from CubeNest.</li>
                <li>Java: Launcher → Skins → New skin → upload · pick Classic or Slim.</li>
                <li>Bedrock: character creator / skin pack import where supported.</li>
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
