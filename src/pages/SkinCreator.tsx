import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, Undo2, Redo2, Eraser, Paintbrush, Pipette, PaintBucket,
  RotateCcw, User, Sparkles, Grid3x3, Eye, EyeOff,
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

const SCALE = 8;

function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function rgbaToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function SkinCreator() {
  const skinRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const paintTimer = useRef<number | null>(null);

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
  const [hint, setHint] = useState('Paint on the UV map · 3D preview uses skinview3d (professional renderer)');

  const getSkinCtx = () => skinRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  const pushHistory = useCallback(() => {
    const ctx = getSkinCtx();
    if (!ctx || !skinRef.current) return;
    const snap = ctx.getImageData(0, 0, 64, 64);
    setHistory((h) => [...h.slice(-40), cloneImageData(snap)]);
    setFuture([]);
  }, []);

  const syncViewer = useCallback(async () => {
    const skin = skinRef.current;
    const viewer = viewerRef.current;
    if (!skin || !viewer) return;
    try {
      await viewer.loadSkin(skin, {
        model: model === 'slim' ? 'slim' : 'default',
      });
      // toggle outer layer visibility
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
    const ctx = ed.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ed.width, ed.height);

    const cell = SCALE;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#1a1f24' : '#12161a';
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    ctx.drawImage(skin, 0, 0, 64, 64, 0, 0, 64 * cell, 64 * cell);

    const uv = partUv(part, layer, model);
    ctx.save();
    ctx.strokeStyle = layer === 'overlay' ? 'rgba(56,189,248,0.95)' : 'rgba(52,211,153,0.95)';
    ctx.lineWidth = 2;
    for (const face of Object.values(uv)) {
      ctx.strokeRect(face.x * cell + 1, face.y * cell + 1, face.w * cell - 2, face.h * cell - 2);
    }
    ctx.restore();

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 64; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, 64 * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(64 * cell, i * cell);
        ctx.stroke();
      }
    }
  }, [part, layer, model, showGrid]);

  const scheduleViewerSync = useCallback(() => {
    if (paintTimer.current) window.clearTimeout(paintTimer.current);
    paintTimer.current = window.setTimeout(() => {
      void syncViewer();
    }, 80);
  }, [syncViewer]);

  // init skin + viewer
  useEffect(() => {
    const c = skinRef.current;
    const pc = previewCanvasRef.current;
    if (!c || !pc) return;
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.putImageData(createDefaultSkinData(), 0, 0);

    const viewer = new SkinViewer({
      canvas: pc,
      width: 360,
      height: 420,
      skin: c,
      model: 'default',
      background: 0x0b1220,
      animation: new IdleAnimation(),
      zoom: 0.85,
      enableControls: true,
    });
    viewer.autoRotate = true;
    viewer.autoRotateSpeed = 0.6;
    viewerRef.current = viewer;

    redrawEditor();
    void syncViewer();

    return () => {
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
    const ctx = getSkinCtx();
    if (!ctx) return;
    pushHistory();
    ctx.putImageData(createDefaultSkinData(), 0, 0);
    redrawEditor();
    void syncViewer();
    setHint('Reset to default Steve-style template');
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
    }, 'image/png');
  };

  const importPng = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const ctx = getSkinCtx();
      if (!ctx) return;
      pushHistory();
      ctx.clearRect(0, 0, 64, 64);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, Math.min(img.width, 64), Math.min(img.height, 64), 0, 0, Math.min(img.width, 64), Math.min(img.height, 64));
      redrawEditor();
      void syncViewer();
      setHint('Skin imported');
    };
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
        accept="image/png"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importPng(f);
          e.target.value = '';
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-950/80 via-mc-surface to-violet-950/40 p-6 sm:p-8 mb-6"
        >
          <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-fuchsia-400/15 blur-3xl pointer-events-none" />
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-200">
            <Sparkles className="w-3.5 h-3.5" /> Preview powered by skinview3d · export stays on CubeNest
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-mc-white mt-3">
            Skin <span className="text-fuchsia-300">Creator</span>
          </h1>
          <p className="text-sm text-mc-muted mt-2 max-w-2xl">
            Paint Classic or Slim skins with a professional WebGL 3D preview (same engine many skin sites use).
            Export a ready 64×64 PNG — no need to leave CubeNest.
          </p>
          <p className="text-xs text-fuchsia-200/80 mt-3">{hint}</p>
        </motion.section>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-mc-border bg-mc-surface overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-mc-border">
                  <span className="text-xs font-semibold text-mc-white">UV map · 64×64</span>
                  <button type="button" onClick={() => setShowGrid((v) => !v)} className="inline-flex items-center gap-1 text-[11px] text-mc-muted hover:text-mc-white">
                    <Grid3x3 className="w-3.5 h-3.5" /> Grid
                  </button>
                </div>
                <div className="p-3 flex justify-center bg-black/30">
                  <canvas
                    ref={editorRef}
                    width={64 * SCALE}
                    height={64 * SCALE}
                    className="max-w-full rounded-lg cursor-crosshair touch-none border border-white/5"
                    style={{ width: 'min(100%, 360px)', imageRendering: 'pixelated' }}
                    onPointerDown={(e) => onEditorPointer(e, 'down')}
                    onPointerMove={(e) => onEditorPointer(e, 'move')}
                    onPointerUp={(e) => onEditorPointer(e, 'up')}
                    onPointerLeave={() => setPainting(false)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-mc-border bg-mc-surface overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-mc-border gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-mc-white">3D preview · skinview3d</span>
                  <div className="flex items-center gap-1">
                    {(['idle', 'walk', 'none'] as const).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAnim(a)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize ${
                          anim === a ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950' : 'border-mc-border text-mc-muted'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                    <button type="button" onClick={() => setShowOverlay((v) => !v)} className="inline-flex items-center gap-1 text-[11px] text-mc-muted hover:text-mc-white ml-1">
                      {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      Overlay
                    </button>
                  </div>
                </div>
                <div className="p-3 flex justify-center bg-gradient-to-b from-[#0b1220] to-emerald-950/30">
                  <canvas ref={previewCanvasRef} className="max-w-full rounded-lg" style={{ width: 'min(100%, 360px)', height: 'auto' }} />
                </div>
                <p className="text-[11px] text-mc-muted text-center pb-3">Drag to orbit · scroll to zoom · idle/walk animation</p>
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-3 sm:p-4 flex flex-wrap gap-2 items-center">
              {tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTool(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    tool === t.id
                      ? 'bg-fuchsia-500 border-fuchsia-400 text-slate-950'
                      : 'bg-mc-gray border-mc-border text-mc-text hover:border-fuchsia-500/40'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              ))}
              <span className="w-px h-6 bg-mc-border mx-1 hidden sm:block" />
              <button type="button" onClick={undo} disabled={!history.length} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs border border-mc-border bg-mc-gray disabled:opacity-40">
                <Undo2 className="w-3.5 h-3.5" /> Undo
              </button>
              <button type="button" onClick={redo} disabled={!future.length} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs border border-mc-border bg-mc-gray disabled:opacity-40">
                <Redo2 className="w-3.5 h-3.5" /> Redo
              </button>
              <button type="button" onClick={resetDefault} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs border border-mc-border bg-mc-gray">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs border border-mc-border bg-mc-gray">
                <Upload className="w-3.5 h-3.5" /> Import
              </button>
              <button type="button" onClick={exportPng} className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Download className="w-3.5 h-3.5" /> Export PNG
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-mc-border bg-mc-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-3">Model</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'classic' as const, label: 'Classic', sub: 'Steve · 4px arms' },
                  { id: 'slim' as const, label: 'Slim', sub: 'Alex · 3px arms' },
                ]).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`text-left rounded-xl border px-3 py-3 transition-colors ${
                      model === m.id ? 'border-fuchsia-400/60 bg-fuchsia-500/15' : 'border-mc-border bg-mc-gray hover:border-fuchsia-500/30'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold text-mc-white">
                      <User className="w-4 h-4" /> {m.label}
                    </span>
                    <span className="block text-[11px] text-mc-muted mt-1">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-3">Layer</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'base' as const, label: 'Base' },
                  { id: 'overlay' as const, label: 'Overlay' },
                ]).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayer(l.id)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
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

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-3">Body part highlight</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_PARTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPart(p)}
                    className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium text-left ${
                      part === p ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200' : 'border-mc-border bg-mc-gray text-mc-muted hover:text-mc-white'
                    }`}
                  >
                    {PART_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-mc-border bg-mc-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-mc-muted mb-3">Color</p>
              <div className="flex items-center gap-3 mb-3">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-14 rounded-lg border border-mc-border bg-transparent cursor-pointer" />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl bg-mc-gray border border-mc-border px-3 py-2 text-sm font-mono text-mc-white"
                />
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-md border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-xs text-mc-muted leading-relaxed">
              <p className="font-semibold text-emerald-200 mb-1">How to use</p>
              <ol className="list-decimal list-inside space-y-1">
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
