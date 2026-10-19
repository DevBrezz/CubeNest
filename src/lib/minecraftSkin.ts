/** Minecraft 64×64 skin UV helpers (classic / slim). */

export type SkinModel = 'classic' | 'slim';

export type BodyPartId =
  | 'head'
  | 'body'
  | 'rightArm'
  | 'leftArm'
  | 'rightLeg'
  | 'leftLeg';

export type LayerId = 'base' | 'overlay';

export interface UvBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Face rectangles for a cuboid part (top, bottom, right, front, left, back). */
export interface PartUv {
  top: UvBox;
  bottom: UvBox;
  right: UvBox;
  front: UvBox;
  left: UvBox;
  back: UvBox;
}

function box(x: number, y: number, w: number, h: number): UvBox {
  return { x, y, w, h };
}

/** Standard classic (Steve) UVs — arm width 4. */
export function classicPartUv(part: BodyPartId, layer: LayerId): PartUv {
  const o = layer === 'overlay';
  switch (part) {
    case 'head': {
      const ox = o ? 32 : 0;
      const oy = o ? 0 : 0;
      return {
        top: box(ox + 8, oy + 0, 8, 8),
        bottom: box(ox + 16, oy + 0, 8, 8),
        right: box(ox + 0, oy + 8, 8, 8),
        front: box(ox + 8, oy + 8, 8, 8),
        left: box(ox + 16, oy + 8, 8, 8),
        back: box(ox + 24, oy + 8, 8, 8),
      };
    }
    case 'body': {
      const oy = o ? 32 : 16;
      return {
        top: box(20, oy, 8, 4),
        bottom: box(28, oy, 8, 4),
        right: box(16, oy + 4, 4, 12),
        front: box(20, oy + 4, 8, 12),
        left: box(28, oy + 4, 4, 12),
        back: box(32, oy + 4, 8, 12),
      };
    }
    case 'rightArm': {
      const oy = o ? 32 : 16;
      return {
        top: box(44, oy, 4, 4),
        bottom: box(48, oy, 4, 4),
        right: box(40, oy + 4, 4, 12),
        front: box(44, oy + 4, 4, 12),
        left: box(48, oy + 4, 4, 12),
        back: box(52, oy + 4, 4, 12),
      };
    }
    case 'leftArm': {
      // left arm base 32,48 — overlay 48,48
      const ox = o ? 48 : 32;
      const oy = 48;
      return {
        top: box(ox + 4, oy, 4, 4),
        bottom: box(ox + 8, oy, 4, 4),
        right: box(ox + 0, oy + 4, 4, 12),
        front: box(ox + 4, oy + 4, 4, 12),
        left: box(ox + 8, oy + 4, 4, 12),
        back: box(ox + 12, oy + 4, 4, 12),
      };
    }
    case 'rightLeg': {
      const oy = o ? 32 : 16;
      return {
        top: box(4, oy, 4, 4),
        bottom: box(8, oy, 4, 4),
        right: box(0, oy + 4, 4, 12),
        front: box(4, oy + 4, 4, 12),
        left: box(8, oy + 4, 4, 12),
        back: box(12, oy + 4, 4, 12),
      };
    }
    case 'leftLeg': {
      // left leg base 16,48 — overlay 0,48
      const ox = o ? 0 : 16;
      const oy = 48;
      return {
        top: box(ox + 4, oy, 4, 4),
        bottom: box(ox + 8, oy, 4, 4),
        right: box(ox + 0, oy + 4, 4, 12),
        front: box(ox + 4, oy + 4, 4, 12),
        left: box(ox + 8, oy + 4, 4, 12),
        back: box(ox + 12, oy + 4, 4, 12),
      };
    }
  }
}

/** Slim (Alex) arm UVs — width 3 on front/back/top/bottom. */
export function slimPartUv(part: BodyPartId, layer: LayerId): PartUv {
  if (part !== 'rightArm' && part !== 'leftArm') {
    return classicPartUv(part, layer);
  }
  if (part === 'rightArm') {
    const oy = layer === 'overlay' ? 32 : 16;
    return {
      top: box(44, oy, 3, 4),
      bottom: box(47, oy, 3, 4),
      right: box(40, oy + 4, 4, 12),
      front: box(44, oy + 4, 3, 12),
      left: box(47, oy + 4, 4, 12),
      back: box(51, oy + 4, 3, 12),
    };
  }
  // left arm
  const ox = layer === 'overlay' ? 48 : 32;
  const oy = 48;
  return {
    top: box(ox + 4, oy, 3, 4),
    bottom: box(ox + 7, oy, 3, 4),
    right: box(ox + 0, oy + 4, 4, 12),
    front: box(ox + 4, oy + 4, 3, 12),
    left: box(ox + 7, oy + 4, 4, 12),
    back: box(ox + 11, oy + 4, 3, 12),
  };
}

export function partUv(part: BodyPartId, layer: LayerId, model: SkinModel): PartUv {
  return model === 'slim' ? slimPartUv(part, layer) : classicPartUv(part, layer);
}

export const PART_LABELS: Record<BodyPartId, string> = {
  head: 'Head',
  body: 'Body',
  rightArm: 'Right arm',
  leftArm: 'Left arm',
  rightLeg: 'Right leg',
  leftLeg: 'Left leg',
};

export const ALL_PARTS: BodyPartId[] = [
  'head',
  'body',
  'rightArm',
  'leftArm',
  'rightLeg',
  'leftLeg',
];

/** Fill a brand-new 64×64 skin with a simple Steve-like base (opaque body, transparent overlays). */
export function createDefaultSkinData(): ImageData {
  const data = new ImageData(64, 64);
  const d = data.data;
  // transparent by default
  for (let i = 0; i < d.length; i += 4) {
    d[i + 3] = 0;
  }

  const setPx = (x: number, y: number, r: number, g: number, b: number, a = 255) => {
    if (x < 0 || y < 0 || x >= 64 || y >= 64) return;
    const i = (y * 64 + x) * 4;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    d[i + 3] = a;
  };

  const fillBox = (bx: number, by: number, bw: number, bh: number, r: number, g: number, b: number) => {
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) setPx(x, y, r, g, b);
    }
  };

  // Head — light skin
  fillBox(0, 8, 32, 8, 229, 194, 152); // sides band
  fillBox(8, 0, 16, 8, 229, 194, 152); // top/bottom
  // Hair (top + back-ish)
  fillBox(8, 0, 8, 2, 62, 42, 26);
  fillBox(24, 8, 8, 3, 62, 42, 26);
  // Eyes
  fillBox(10, 12, 2, 1, 255, 255, 255);
  fillBox(14, 12, 2, 1, 255, 255, 255);
  fillBox(11, 12, 1, 1, 45, 90, 160);
  fillBox(15, 12, 1, 1, 45, 90, 160);
  // Mouth
  fillBox(12, 14, 2, 1, 180, 120, 100);

  // Body — cyan shirt
  fillBox(16, 20, 24, 12, 0, 170, 170);
  fillBox(20, 16, 16, 4, 0, 170, 170);

  // Right arm classic
  fillBox(40, 20, 16, 12, 229, 194, 152);
  fillBox(44, 16, 8, 4, 229, 194, 152);

  // Right leg — blue pants
  fillBox(0, 20, 16, 12, 55, 70, 160);
  fillBox(4, 16, 8, 4, 55, 70, 160);

  // Left arm (mirrored simple)
  fillBox(32, 52, 16, 12, 229, 194, 152);
  fillBox(36, 48, 8, 4, 229, 194, 152);

  // Left leg
  fillBox(16, 52, 16, 12, 55, 70, 160);
  fillBox(20, 48, 8, 4, 55, 70, 160);

  return data;
}

export function cloneImageData(src: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
}

export function floodFill(
  img: ImageData,
  sx: number,
  sy: number,
  r: number,
  g: number,
  b: number,
  a: number,
): void {
  const { width: w, height: h, data } = img;
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
  const idx = (sy * w + sx) * 4;
  const tr = data[idx];
  const tg = data[idx + 1];
  const tb = data[idx + 2];
  const ta = data[idx + 3];
  if (tr === r && tg === g && tb === b && ta === a) return;

  const stack: number[] = [sx, sy];
  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const i = (y * w + x) * 4;
    if (data[i] !== tr || data[i + 1] !== tg || data[i + 2] !== tb || data[i + 3] !== ta) continue;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
}

export const PRESET_COLORS = [
  '#000000', '#1a1a1a', '#4a4a4a', '#808080', '#c0c0c0', '#ffffff',
  '#8B4513', '#A0522D', '#D2691E', '#E5C298', '#FFE0BD', '#FFF5E6',
  '#1a0a00', '#3d2817', '#5c4033', '#6b4423', '#8B6914',
  '#7f0000', '#c41e3a', '#ff0000', '#ff6b6b', '#ffb3b3',
  '#ff7f00', '#ffaa00', '#ffd700', '#ffff00', '#ffff99',
  '#006400', '#228B22', '#32CD32', '#90EE90', '#00ff7f',
  '#00008b', '#0000cd', '#1e90ff', '#87ceeb', '#00ffff',
  '#4b0082', '#8b00ff', '#da70d6', '#ff69b4', '#ffc0cb',
  '#00aaaa', '#55ffff', '#003366', '#36454f',
];
