import * as THREE from "three";

/**
 * 外部画像を使わずに、月の「海（Maria）」「高地」「クレーター」を備えた
 * 等距円筒図法の月面テクスチャ（1024x512）をブラウザ上で生成するモジュールです。
 * 経度 0°（中央）が地球側に向く「月の表側」に対応します。
 */

/**
 * 再現性のある擬似乱数生成器（ページを開くたびに模様が変わらないように固定シードを使用します）。
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * 経度（-180°..+180°）と緯度（-90°..+90°）を Canvas 座標へ変換します。
 */
function moonLonLatToCanvas(
  lonDeg: number,
  latDeg: number,
  width: number,
  height: number
): [number, number] {
  const x = ((lonDeg + 180) / 360) * width;
  const y = ((90 - latDeg) / 180) * height;
  return [x, y];
}

/**
 * 月の表側にある主要な「海（Maria）」のおおよその位置・大きさデータ [経度, 緯度, 半径(度), 暗さ]
 */
const LUNAR_MARIA: Array<[number, number, number, number]> = [
  [-45, 16, 26, 0.34],  // 嵐の大洋（Oceanus Procellarum）
  [-18, 34, 21, 0.32],  // 雨の海（Mare Imbrium）
  [18, 27, 14, 0.28],   // 晴れの海（Mare Serenitatis）
  [31, 8, 15, 0.30],    // 静かの海（Mare Tranquillitatis）
  [51, -8, 13, 0.26],   // 豊かの海（Mare Fecunditatis）
  [59, 17, 9, 0.32],    // 危機の海（Mare Crisium）
  [-17, -21, 14, 0.26], // 雲の海（Mare Nubium）
  [-38, -24, 10, 0.25], // 湿りの海（Mare Humorum）
  [34, -15, 10, 0.24],  // 神酒の海（Mare Nectaris）
  [0, 56, 18, 0.22],    // 氷の海（Mare Frigoris）
];

/**
 * 月面カラーテクスチャを生成します。
 */
export function createMoonTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const rand = createSeededRandom(20261119);

  // 1. ベースとなる明るい月面高地（レゴリス）のグラデーション
  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0.0, "#cbd0d8");
  baseGrad.addColorStop(0.5, "#bfc5ce");
  baseGrad.addColorStop(1.0, "#c8cdd6");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 柔らかな広域の明暗ムラ（地形の起伏感）
  for (let i = 0; i < 160; i++) {
    const lon = rand() * 360 - 180;
    const lat = (rand() - 0.5) * 160;
    const radiusPx = (14 + rand() * 44) * (width / 1024);
    const [cx, cy] = moonLonLatToCanvas(lon, lat, width, height);
    const isDark = rand() > 0.45;
    const alpha = 0.04 + rand() * 0.07;

    for (const shift of [-width, 0, width]) {
      const grad = ctx.createRadialGradient(
        cx + shift,
        cy,
        0,
        cx + shift,
        cy,
        radiusPx
      );
      grad.addColorStop(
        0,
        isDark ? `rgba(82, 88, 100, ${alpha})` : `rgba(236, 240, 246, ${alpha})`
      );
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + shift, cy, radiusPx, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3. 月の「海（Maria）」：暗い玄武岩質の盆地を月の表側中心に描画
  for (const [lon, lat, degRadius, darkness] of LUNAR_MARIA) {
    const [cx, cy] = moonLonLatToCanvas(lon, lat, width, height);
    const r = (degRadius / 180) * height;
    for (const shift of [-width, 0, width]) {
      const grad = ctx.createRadialGradient(cx + shift, cy, r * 0.12, cx + shift, cy, r);
      grad.addColorStop(0, `rgba(62, 68, 80, ${darkness})`);
      grad.addColorStop(0.65, `rgba(74, 80, 92, ${darkness * 0.72})`);
      grad.addColorStop(1, "rgba(74, 80, 92, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx + shift, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. クレーター（暗い内壁と明るいリム）を大小ランダムに散布
  for (let i = 0; i < 240; i++) {
    const lon = rand() * 360 - 180;
    const lat = (rand() - 0.5) * 165;
    const [cx, cy] = moonLonLatToCanvas(lon, lat, width, height);
    const r = (1.6 + Math.pow(rand(), 2.4) * 14) * (width / 1024);
    const strength = 0.14 + rand() * 0.24;

    for (const shift of [-width, 0, width]) {
      const x = cx + shift;
      if (x + r < 0 || x - r > width) continue;

      // クレーターの明るい外縁（リム）
      ctx.strokeStyle = `rgba(235, 240, 248, ${strength * 0.75})`;
      ctx.lineWidth = Math.max(0.7, r * 0.16);
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // クレーター内側のくぼみ陰影
      const innerGrad = ctx.createRadialGradient(
        x - r * 0.2,
        cy - r * 0.2,
        r * 0.1,
        x,
        cy,
        r * 0.92
      );
      innerGrad.addColorStop(0, `rgba(72, 78, 90, ${strength * 0.8})`);
      innerGrad.addColorStop(1, `rgba(110, 118, 130, ${strength * 0.2})`);
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(x, cy, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. ティコ（南半球の代表的な明るい光条クレーター）のハイライト
  const [tychoX, tychoY] = moonLonLatToCanvas(-11, -43, width, height);
  const tychoGrad = ctx.createRadialGradient(tychoX, tychoY, 0, tychoX, tychoY, 26);
  tychoGrad.addColorStop(0, "rgba(250, 252, 255, 0.72)");
  tychoGrad.addColorStop(0.3, "rgba(230, 236, 245, 0.24)");
  tychoGrad.addColorStop(1, "rgba(230, 236, 245, 0)");
  ctx.fillStyle = tychoGrad;
  ctx.beginPath();
  ctx.arc(tychoX, tychoY, 26, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
