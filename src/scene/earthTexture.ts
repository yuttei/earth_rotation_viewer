import * as THREE from "three";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import countriesTopoJson from "world-atlas/countries-50m.json";

/**
 * Natural Earth (world-atlas 50m) のデータから、
 * 地球儀用の高解像度テクスチャをブラウザ上で生成するモジュールです。
 * 外部画像ファイルに依存しないため、オフライン環境でも鮮明な地図を描画できます。
 */

export interface EarthTextures {
  /** 宇宙リアル用の地球表面カラーテクスチャ */
  realisticMap: THREE.CanvasTexture;
  /** R=陸マスク, G=夜間の街灯り を格納したデータテクスチャ */
  maskMap: THREE.CanvasTexture;
  /** 不要になったGPUリソースを解放する関数 */
  dispose: () => void;
}

interface CountryTopology extends Topology {
  objects: {
    countries: GeometryCollection;
    land: GeometryCollection;
  };
}

/**
 * 夜の地球側でほんのり灯す主要都市群の座標データ [経度, 緯度, 光の強さ(0..1), 広がり係数]
 */
const NIGHT_CITY_CLUSTERS: Array<[number, number, number, number]> = [
  // 東アジア
  [139.69, 35.69, 1.0, 1.2],   // 東京
  [135.50, 34.69, 0.85, 1.0],  // 大阪・京阪神
  [136.91, 35.18, 0.7, 0.85],  // 名古屋
  [130.40, 33.59, 0.55, 0.7],  // 福岡
  [141.35, 43.06, 0.45, 0.65], // 札幌
  [126.98, 37.57, 0.95, 1.1],  // ソウル
  [116.41, 39.90, 0.95, 1.2],  // 北京
  [121.47, 31.23, 1.0, 1.2],   // 上海
  [114.17, 22.32, 0.95, 1.1],  // 香港・広州
  [121.56, 25.03, 0.75, 0.85], // 台北
  [104.07, 30.57, 0.65, 0.9],  // 成都
  // 東南・南アジア
  [100.50, 13.76, 0.8, 1.0],   // バンコク
  [103.82, 1.35, 0.85, 0.85],  // シンガポール
  [106.85, -6.21, 0.85, 1.0],  // ジャカルタ
  [120.98, 14.60, 0.75, 0.9],  // マニラ
  [77.21, 28.61, 0.95, 1.2],   // デリー
  [72.88, 19.08, 0.9, 1.1],    // ムンバイ
  [77.59, 12.97, 0.7, 0.9],    // ベンガルール
  [90.41, 23.81, 0.75, 0.95],  // ダッカ
  // 中東・ヨーロッパ
  [55.27, 25.20, 0.85, 0.95],  // ドバイ
  [46.68, 24.71, 0.7, 0.9],    // リヤド
  [31.24, 30.04, 0.9, 1.0],    // カイロ
  [28.98, 41.01, 0.85, 1.0],   // イスタンブール
  [37.62, 55.76, 0.95, 1.2],   // モスクワ
  [30.31, 59.93, 0.65, 0.85],  // サンクトペテルブルク
  [-0.13, 51.51, 1.0, 1.15],   // ロンドン
  [2.35, 48.86, 0.95, 1.15],   // パリ
  [4.90, 52.37, 0.8, 0.95],    // アムステルダム
  [13.40, 52.52, 0.8, 1.0],    // ベルリン
  [12.50, 41.90, 0.8, 0.95],   // ローマ
  [-3.70, 40.42, 0.8, 0.95],   // マドリード
  [18.07, 59.33, 0.55, 0.75],  // ストックホルム
  [18.96, 69.65, 0.35, 0.55],  // トロムソ
  [-21.94, 64.15, 0.35, 0.55], // レイキャビク
  // 北米・南米
  [-74.01, 40.71, 1.0, 1.25],  // ニューヨーク
  [-79.38, 43.65, 0.8, 1.0],   // トロント
  [-87.63, 41.88, 0.85, 1.1],  // シカゴ
  [-95.37, 29.76, 0.8, 1.0],   // ヒューストン
  [-118.24, 34.05, 0.95, 1.15], // ロサンゼルス
  [-122.42, 37.77, 0.75, 0.9], // サンフランシスコ
  [-99.13, 19.43, 0.9, 1.1],   // メキシコシティ
  [-46.63, -23.55, 0.95, 1.15], // サンパウロ
  [-43.17, -22.91, 0.75, 0.95], // リオデジャネイロ
  [-58.38, -34.60, 0.8, 1.0],  // ブエノスアイレス
  [-74.07, 4.71, 0.7, 0.9],    // ボゴタ
  // アフリカ・オセアニア
  [3.38, 6.52, 0.8, 1.0],      // ラゴス
  [36.82, -1.29, 0.6, 0.8],    // ナイロビ
  [28.05, -26.20, 0.7, 0.95],  // ヨハネスブルグ
  [151.21, -33.87, 0.8, 1.0],  // シドニー
  [144.96, -37.81, 0.75, 0.9], // メルボルン
  [174.76, -36.85, 0.5, 0.75], // オークランド
];

/**
 * 緯度・経度（度）を、等距円筒図法キャンバスの X/Y 座標に変換します。
 * X=0 が西経180°、X=width/2 が経度0°、X=width が東経180° に対応します。
 */
function lonLatToCanvas(
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
 * 日付変更線（±180°）や南極周回リングを考慮しながら、
 * 1つの GeoJSON ポリゴンリングを Canvas パスへ描画します。
 */
function traceRingToCanvas(
  ctx: CanvasRenderingContext2D,
  ring: number[][],
  width: number,
  height: number
): void {
  if (ring.length < 3) return;

  // 連続する頂点間の経度差が180°を超える場合、±360°のオフセットを積算して連続化します。
  let offset = 0;
  let minLon = ring[0][0];
  let maxLon = ring[0][0];
  let latSum = 0;

  const unwrapped: Array<[number, number]> = [[ring[0][0], ring[0][1]]];
  latSum += ring[0][1];

  for (let i = 1; i < ring.length; i++) {
    const prevRawLon = ring[i - 1][0];
    const rawLon = ring[i][0];
    const lat = ring[i][1];
    const dlon = rawLon - prevRawLon;

    if (dlon > 180) {
      offset -= 360;
    } else if (dlon < -180) {
      offset += 360;
    }

    const contLon = rawLon + offset;
    unwrapped.push([contLon, lat]);
    if (contLon < minLon) minLon = contLon;
    if (contLon > maxLon) maxLon = contLon;
    latSum += lat;
  }

  const startLon = unwrapped[0][0];
  const endLon = unwrapped[unwrapped.length - 1][0];
  const spanLon = endLon - startLon;
  const avgLat = latSum / unwrapped.length;

  // 南極点周りの補助穴リング（ほぼ -90° に張り付いた極小線）は塗りに不要なためスキップします。
  if (Math.abs(spanLon) > 180 && avgLat < -88.5) {
    return;
  }

  // 南極大陸の海岸線リング（西経180°から東経180°まで1周するリング）は、
  // キャンバスの下端（南極点側）を通って閉じることで横線の飛びを防ぎます。
  if (Math.abs(spanLon) > 180 && avgLat < 0) {
    const [sx, sy] = lonLatToCanvas(startLon, unwrapped[0][1], width, height);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < unwrapped.length; i++) {
      const [px, py] = lonLatToCanvas(unwrapped[i][0], unwrapped[i][1], width, height);
      ctx.lineTo(px, py);
    }
    const [ex] = lonLatToCanvas(endLon, unwrapped[unwrapped.length - 1][1], width, height);
    ctx.lineTo(ex, height);
    ctx.lineTo(sx, height);
    ctx.closePath();
    return;
  }

  // 通常の陸地・島リングは、日付変更線を跨いだはみ出し分も反対側の端に複製してシームレスに描きます。
  const shifts = [0];
  if (minLon < -180) shifts.push(360);
  if (maxLon > 180) shifts.push(-360);

  for (const shift of shifts) {
    const [sx, sy] = lonLatToCanvas(unwrapped[0][0] + shift, unwrapped[0][1], width, height);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < unwrapped.length; i++) {
      const [px, py] = lonLatToCanvas(unwrapped[i][0] + shift, unwrapped[i][1], width, height);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}

/**
 * MultiPolygon / Polygon を含む GeoJSON FeatureCollection のパスを Canvas に積み上げます。
 */
function traceLandFeatureCollection(
  ctx: CanvasRenderingContext2D,
  collection: ReturnType<typeof feature>,
  width: number,
  height: number
): void {
  const drawRings = (rings: number[][][]) => {
    for (const ring of rings) {
      traceRingToCanvas(ctx, ring, width, height);
    }
  };

  if (collection.type === "FeatureCollection") {
    for (const feat of collection.features) {
      if (!feat.geometry) continue;
      if (feat.geometry.type === "Polygon") {
        drawRings(feat.geometry.coordinates);
      } else if (feat.geometry.type === "MultiPolygon") {
        for (const poly of feat.geometry.coordinates) {
          drawRings(poly);
        }
      }
    }
  } else if (collection.type === "Feature" && collection.geometry) {
    if (collection.geometry.type === "Polygon") {
      drawRings(collection.geometry.coordinates);
    } else if (collection.geometry.type === "MultiPolygon") {
      for (const poly of collection.geometry.coordinates) {
        drawRings(poly);
      }
    }
  }
}

/**
 * 日付変更線を跨ぐジャンプを避けて MultiLineString（国境線）を Canvas に描きます。
 */
function strokeBorders(
  ctx: CanvasRenderingContext2D,
  borderLines: ReturnType<typeof mesh>,
  width: number,
  height: number
): void {
  const lines = borderLines.coordinates;

  ctx.beginPath();
  for (const line of lines) {
    if (line.length < 2) continue;
    let [prevLon, prevLat] = line[0];
    const [px, py] = lonLatToCanvas(prevLon, prevLat, width, height);
    ctx.moveTo(px, py);

    for (let i = 1; i < line.length; i++) {
      const [lon, lat] = line[i];
      if (Math.abs(lon - prevLon) > 180) {
        const [nx, ny] = lonLatToCanvas(lon, lat, width, height);
        ctx.moveTo(nx, ny);
      } else {
        const [nx, ny] = lonLatToCanvas(lon, lat, width, height);
        ctx.lineTo(nx, ny);
      }
      prevLon = lon;
    }
  }
  ctx.stroke();
}

/**
 * 宇宙リアルモード・天文図解モード・海陸/夜景マスクの3枚のテクスチャを生成します。
 */
export function createEarthTextures(maxTextureSize = 4096): EarthTextures {
  // 高緯度の細部（日本や北欧・北極圏の島々）まで鮮明に出すため 4096x2048 を基本にします。
  const width = maxTextureSize >= 4096 ? 4096 : 2048;
  const height = width / 2;

  const topology = countriesTopoJson as unknown as CountryTopology;
  const landGeo = feature(topology, topology.objects.land);
  const bordersMesh = mesh(
    topology,
    topology.objects.countries,
    (a, b) => a !== b
  );

  // 1. 宇宙リアルモードのテクスチャ
  const realisticCanvas = document.createElement("canvas");
  realisticCanvas.width = width;
  realisticCanvas.height = height;
  const rCtx = realisticCanvas.getContext("2d")!;

  // 海の深み（緯度に応じた宇宙海洋グラデーション）
  const oceanGrad = rCtx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, "#153d63");
  oceanGrad.addColorStop(0.14, "#0d3057");
  oceanGrad.addColorStop(0.5, "#0a3868");
  oceanGrad.addColorStop(0.86, "#0d2e54");
  oceanGrad.addColorStop(1.0, "#14375a");
  rCtx.fillStyle = oceanGrad;
  rCtx.fillRect(0, 0, width, height);

  // 陸地パスを一度構築してクリップ・塗りに再利用します。
  rCtx.beginPath();
  traceLandFeatureCollection(rCtx, landGeo, width, height);

  // 陸地の気候帯グラデーション（高緯度の雪・氷床、温帯の緑、亜熱帯の茶緑、南極氷床）
  const landGrad = rCtx.createLinearGradient(0, 0, 0, height);
  landGrad.addColorStop(0.0, "#dbe8f2");   // 北極圏の雪氷
  landGrad.addColorStop(0.10, "#9ab0bd");  // ツンドラ
  landGrad.addColorStop(0.20, "#3b5f4b");  // 亜寒帯タイガ
  landGrad.addColorStop(0.32, "#466e49");  // 温帯
  landGrad.addColorStop(0.41, "#7b7350");  // 亜熱帯・乾燥帯
  landGrad.addColorStop(0.50, "#2f643e");  // 熱帯雨林
  landGrad.addColorStop(0.60, "#6f6c4a");  // 南半球サバンナ
  landGrad.addColorStop(0.74, "#40654a");  // 南温帯
  landGrad.addColorStop(0.86, "#9db2bf");  // 亜南極
  landGrad.addColorStop(0.92, "#dbe6f0");  // 南極氷床
  landGrad.addColorStop(1.0, "#eaf2f8");

  rCtx.save();
  rCtx.shadowColor = "rgba(44, 152, 206, 0.38)";
  rCtx.shadowBlur = width * 0.004;
  rCtx.fillStyle = landGrad;
  rCtx.fill("evenodd");
  rCtx.restore();

  // 海岸線の繊細なハイライト
  rCtx.strokeStyle = "rgba(186, 230, 253, 0.28)";
  rCtx.lineWidth = Math.max(1, width / 2048);
  rCtx.stroke();

  // さりげない国境線
  rCtx.strokeStyle = "rgba(255, 255, 255, 0.13)";
  rCtx.lineWidth = Math.max(0.75, width / 3072);
  strokeBorders(rCtx, bordersMesh, width, height);

  // 2. マスクテクスチャ（R = 陸地マスク, G = 夜間都市ライト）
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const mCtx = maskCanvas.getContext("2d")!;

  mCtx.fillStyle = "#000000";
  mCtx.fillRect(0, 0, width, height);

  mCtx.beginPath();
  traceLandFeatureCollection(mCtx, landGeo, width, height);
  mCtx.fillStyle = "#ff0000";
  mCtx.fill("evenodd");

  // 夜間ライトは加算合成（lighter）で G チャンネルのみを自然に発光させます（Rは陸マスクとして維持）。
  mCtx.save();
  mCtx.globalCompositeOperation = "lighter";
  for (const [lon, lat, intensity, spread] of NIGHT_CITY_CLUSTERS) {
    const [cx, cy] = lonLatToCanvas(lon, lat, width, height);
    // 高緯度では横方向に広がりやすいため、緯度の cos で横半径を調整しすぎず等方的に微調整します。
    const radius = (width / 150) * spread;
    const glow = mCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const greenVal = Math.round(235 * intensity);
    glow.addColorStop(0.0, `rgba(0, ${greenVal}, 0, 1)`);
    glow.addColorStop(0.35, `rgba(0, ${Math.round(greenVal * 0.55)}, 0, 1)`);
    glow.addColorStop(1.0, "rgba(0, 0, 0, 0)");

    mCtx.fillStyle = glow;
    mCtx.beginPath();
    mCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    mCtx.fill();
  }
  mCtx.restore();

  const realisticMap = new THREE.CanvasTexture(realisticCanvas);
  realisticMap.colorSpace = THREE.SRGBColorSpace;
  realisticMap.anisotropy = 8;
  realisticMap.needsUpdate = true;

  const maskMap = new THREE.CanvasTexture(maskCanvas);
  maskMap.colorSpace = THREE.NoColorSpace;
  maskMap.anisotropy = 4;
  maskMap.needsUpdate = true;

  return {
    realisticMap,
    maskMap,
    dispose: () => {
      realisticMap.dispose();
      maskMap.dispose();
    },
  };
}
