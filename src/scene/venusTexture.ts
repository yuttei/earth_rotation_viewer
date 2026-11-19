import * as THREE from "three";

/**
 * 再現性のある擬似乱数生成器（Mulberry32）です。
 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 金星の分厚い硫酸の雲（帯状の黄金クリーム色と淡いV字の雲模様）を
 * 等距円筒図法の CanvasTexture としてプロシージャル生成します。
 */
export function createVenusTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 1. 緯度方向の基本グラデーション（極域はやや明るく淡いクリーム、赤道帯は暖かなシャンパンゴールド）
  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0.0, "#f5ead4");
  baseGrad.addColorStop(0.18, "#edd8a8");
  baseGrad.addColorStop(0.38, "#e3c382");
  baseGrad.addColorStop(0.5, "#dfc07d");
  baseGrad.addColorStop(0.62, "#e4c585");
  baseGrad.addColorStop(0.82, "#edd9ac");
  baseGrad.addColorStop(1.0, "#f5ebd6");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 金星特有のスーパーローテーションによる横縞と柔らかなV字雲バンドを描画
  const rand = createSeededRandom(20260723);

  for (let i = 0; i < 48; i++) {
    const baseY = rand() * height;
    const bandHeight = 6 + rand() * 24;
    const isBright = rand() > 0.45;
    const alpha = 0.06 + rand() * 0.1;

    ctx.strokeStyle = isBright
      ? `rgba(255, 248, 228, ${alpha.toFixed(3)})`
      : `rgba(176, 130, 62, ${alpha.toFixed(3)})`;
    ctx.lineWidth = bandHeight;
    ctx.lineCap = "round";

    const waveAmp = 4 + rand() * 14;
    const waveFreq = 1 + Math.floor(rand() * 3);
    const phase = rand() * Math.PI * 2;

    ctx.beginPath();
    for (let x = 0; x <= width; x += 16) {
      const t = (x / width) * Math.PI * 2;
      // 赤道付近ほど少し東へ引っ張られるV字カーブを加えます。
      const latFactor = Math.cos(((baseY / height) - 0.5) * Math.PI);
      const y =
        baseY +
        Math.sin(t * waveFreq + phase) * waveAmp +
        Math.cos(t + phase * 0.5) * 8 * latFactor;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  // 3. 雲の柔らかな明暗ムラ（シームレスに左右端も繋ぎます）
  for (let i = 0; i < 140; i++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const rx = 28 + rand() * 90;
    const ry = 8 + rand() * 22;
    const bright = rand() > 0.48;
    const alpha = 0.04 + rand() * 0.07;

    for (const shiftX of [-width, 0, width]) {
      const x = cx + shiftX;
      if (x + rx < 0 || x - rx > width) continue;
      const g = ctx.createRadialGradient(x, cy, 0, x, cy, rx);
      if (bright) {
        g.addColorStop(0, `rgba(255, 250, 236, ${alpha.toFixed(3)})`);
        g.addColorStop(1, "rgba(255, 250, 236, 0)");
      } else {
        g.addColorStop(0, `rgba(164, 118, 54, ${alpha.toFixed(3)})`);
        g.addColorStop(1, "rgba(164, 118, 54, 0)");
      }
      ctx.save();
      ctx.translate(x, cy);
      ctx.scale(1, ry / rx);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
