import * as THREE from "three";

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function finalizeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * 水星・火星・木星・土星・天王星・海王星・冥王星および土星/天王星の環テクスチャを一括生成します。
 */
export interface SolarPlanetTextures {
  mercury: THREE.CanvasTexture;
  mars: THREE.CanvasTexture;
  jupiter: THREE.CanvasTexture;
  saturn: THREE.CanvasTexture;
  saturnRing: THREE.CanvasTexture;
  uranus: THREE.CanvasTexture;
  neptune: THREE.CanvasTexture;
  pluto: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCrateredBody(
  baseHex: string,
  darkHex: string,
  lightHex: string,
  seed: number,
  extraDraw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rand = createSeededRandom(seed);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, w, h);

  // 大域的な明暗地形
  for (let i = 0; i < 65; i++) {
    const cx = rand() * w;
    const cy = rand() * h;
    const rx = 18 + rand() * 55;
    const ry = 10 + rand() * 30;
    ctx.fillStyle = rand() > 0.45 ? darkHex : lightHex;
    ctx.globalAlpha = 0.14 + rand() * 0.2;
    for (const shift of [-w, 0, w]) {
      ctx.beginPath();
      ctx.ellipse(cx + shift, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // クレーター
  for (let i = 0; i < 95; i++) {
    const cx = rand() * w;
    const cy = 12 + rand() * (h - 24);
    const r = 1.8 + rand() * 7.5;
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = darkHex;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lightHex;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  if (extraDraw) {
    extraDraw(ctx, w, h);
  }
  return finalizeTexture(canvas);
}

function makeGasGiantTexture(
  bands: Array<[number, string]>,
  seed: number,
  stormDraw?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const rand = createSeededRandom(seed);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of bands) {
    grad.addColorStop(stop, color);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 横縞のうねり（ジェット気流バンド）
  for (let i = 0; i < 42; i++) {
    const y0 = rand() * h;
    const amp = 1.5 + rand() * 5;
    const freq = 1 + Math.floor(rand() * 3);
    const phase = rand() * Math.PI * 2;
    ctx.strokeStyle =
      rand() > 0.5 ? "rgba(255, 250, 240, 0.14)" : "rgba(45, 28, 18, 0.14)";
    ctx.lineWidth = 2 + rand() * 8;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const t = (x / w) * Math.PI * 2;
      const y = y0 + Math.sin(t * freq + phase) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  if (stormDraw) {
    stormDraw(ctx, w, h);
  }
  return finalizeTexture(canvas);
}

function makeSaturnRingTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 32;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // 内側 (u=0) から外側 (u=1) へ C環・B環・カッシーニの間隙・A環 を描画
  for (let x = 0; x < w; x++) {
    const u = x / (w - 1);
    let alpha = 0;
    let r = 228;
    let g = 204;
    let b = 158;

    if (u < 0.08) {
      alpha = 0;
    } else if (u < 0.24) {
      // C環（半透明の淡い内環）
      alpha = 0.24 * ((u - 0.08) / 0.16);
      r = 180;
      g = 165;
      b = 140;
    } else if (u < 0.62) {
      // B環（もっとも明るく高密度）
      const ripple = 0.85 + 0.15 * Math.sin(u * 130);
      alpha = 0.92 * ripple;
      r = 240;
      g = 219;
      b = 175;
    } else if (u < 0.7) {
      // カッシーニの間隙（暗い隙間）
      alpha = 0.08;
      r = 90;
      g = 80;
      b = 70;
    } else if (u < 0.95) {
      // A環（やや落ち着いた明るさ＋エンケの間隙）
      const encke = Math.abs(u - 0.88) < 0.01 ? 0.18 : 1.0;
      const ripple = 0.88 + 0.12 * Math.sin(u * 170);
      alpha = 0.72 * ripple * encke;
      r = 216;
      g = 196;
      b = 156;
    } else {
      alpha = 0;
    }

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createSolarPlanetTextures(): SolarPlanetTextures {
  const mercury = makeCrateredBody("#9ca3af", "#525866", "#d1d5db", 101);

  const mars = makeCrateredBody("#c86134", "#7c2d12", "#eda06c", 404, (ctx, w, h) => {
    // 北極冠・南極冠の白い氷
    const northIce = ctx.createLinearGradient(0, 0, 0, 26);
    northIce.addColorStop(0, "rgba(248, 250, 252, 0.95)");
    northIce.addColorStop(1, "rgba(248, 250, 252, 0)");
    ctx.fillStyle = northIce;
    ctx.fillRect(0, 0, w, 26);

    const southIce = ctx.createLinearGradient(0, h - 22, 0, h);
    southIce.addColorStop(0, "rgba(248, 250, 252, 0)");
    southIce.addColorStop(1, "rgba(248, 250, 252, 0.9)");
    ctx.fillStyle = southIce;
    ctx.fillRect(0, h - 22, w, 22);
  });

  const jupiter = makeGasGiantTexture(
    [
      [0.0, "#a89278"],
      [0.14, "#d9c29f"],
      [0.24, "#b86f43"],
      [0.35, "#f0dfc3"],
      [0.46, "#c47442"],
      [0.54, "#f4e7cf"],
      [0.65, "#b36236"],
      [0.77, "#dfc9a6"],
      [0.88, "#9c7c5c"],
      [1.0, "#7c6752"],
    ],
    505,
    (ctx, w, h) => {
      // 大赤斑（南緯約 22°）
      const gx = w * 0.62;
      const gy = h * 0.62;
      const spot = ctx.createRadialGradient(gx, gy, 2, gx, gy, 24);
      spot.addColorStop(0, "rgba(214, 86, 46, 0.95)");
      spot.addColorStop(0.65, "rgba(186, 72, 38, 0.78)");
      spot.addColorStop(1, "rgba(186, 72, 38, 0)");
      ctx.save();
      ctx.translate(gx, gy);
      ctx.scale(1.45, 0.85);
      ctx.fillStyle = spot;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  );

  const saturn = makeGasGiantTexture(
    [
      [0.0, "#b8a98a"],
      [0.18, "#e6d5a8"],
      [0.36, "#d4bc88"],
      [0.5, "#f0e2bc"],
      [0.66, "#cfb580"],
      [0.84, "#e0cc9e"],
      [1.0, "#a89878"],
    ],
    606
  );

  const saturnRing = makeSaturnRingTexture();

  const uranus = makeGasGiantTexture(
    [
      [0.0, "#a5f3fc"],
      [0.3, "#7dd3fc"],
      [0.55, "#67e8f9"],
      [0.8, "#5eead4"],
      [1.0, "#99f6e4"],
    ],
    707
  );

  const neptune = makeGasGiantTexture(
    [
      [0.0, "#1e3a8a"],
      [0.22, "#2563eb"],
      [0.45, "#1d4ed8"],
      [0.65, "#3b82f6"],
      [0.84, "#1e40af"],
      [1.0, "#172554"],
    ],
    808,
    (ctx, w, h) => {
      // 大暗斑と白いメタン雲筋
      ctx.fillStyle = "rgba(15, 23, 66, 0.55)";
      ctx.beginPath();
      ctx.ellipse(w * 0.36, h * 0.6, 20, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(191, 219, 254, 0.55)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, h * 0.54);
      ctx.quadraticCurveTo(w * 0.36, h * 0.5, w * 0.48, h * 0.55);
      ctx.stroke();
    }
  );

  const pluto = makeCrateredBody("#c9b39b", "#6e473b", "#f3e8d8", 909, (ctx, w, h) => {
    // 冥王星の明るいハート型平原「トンボー地域（スプートニク平原）」
    ctx.fillStyle = "rgba(248, 241, 230, 0.88)";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.52, 34, 28, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.56, h * 0.49, 24, 22, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  return {
    mercury,
    mars,
    jupiter,
    saturn,
    saturnRing,
    uranus,
    neptune,
    pluto,
    dispose: () => {
      mercury.dispose();
      mars.dispose();
      jupiter.dispose();
      saturn.dispose();
      saturnRing.dispose();
      uranus.dispose();
      neptune.dispose();
      pluto.dispose();
    },
  };
}
