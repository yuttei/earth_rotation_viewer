import * as THREE from "three";
import { CelestialBodyId } from "../data/celestialBodies";
import {
  FEATURED_BRIGHT_STARS,
  FEATURED_STAR_MAP,
  FeaturedStarId,
  starDistanceLyToSceneRadius,
} from "../astronomy/seasonalStars";

/**
 * 太陽系からシームレスにズームアウトして繋がる宇宙の7階層
 * （①近傍恒星(3D奥行き) → ②天の川銀河 → ③天の川＆アンドロメダ → ④局部銀河群 → ⑤おとめ座銀河団 → ⑥ラニアケア超銀河団 → ⑦観測可能な宇宙）
 * を 3D パーティクル・流線・フィラメント・CMB球殻・タップ判定用メッシュで構築するモジュールです。
 */

export type CosmicBadgeId =
  | "nearbySun"
  | "nearbyRing10"
  | "nearbyRing100"
  | "nearbyRing1000"
  | "nearbyAlphaCen"
  | "nearbySirius"
  | "nearbyProcyon"
  | "nearbyAltair"
  | "nearbyVega"
  | "nearbyArcturus"
  | "nearbyCapella"
  | "nearbySpica"
  | "nearbyBetelgeuse"
  | "nearbyRigel"
  | "nearbyDeneb"
  | "milkyWay"
  | "solarSystemInGalaxy"
  | "galacticCenter"
  | "andromeda"
  | "triangulum"
  | "magellanicClouds"
  | "localGroup"
  | "virgoCluster"
  | "greatAttractor"
  | "comaCluster"
  | "fornaxCluster"
  | "distancePair"
  | "distanceVirgo"
  | "laniakea"
  | "greatAttractorCore"
  | "virgoSuperclusterNode"
  | "shapleySupercluster"
  | "perseusPisces"
  | "observableUniverse"
  | "cmbHorizon"
  | "cosmicVoid"
  | "cosmicWeb"
  | "ourPositionInUniverse";

export interface CosmicBadgeSpec {
  id: CosmicBadgeId;
  label: string;
  accentColor: string;
  /** タップすると詳細解説カードが開く天体ID（案内専用ラベルは null） */
  clickableBodyId: CelestialBodyId | null;
}

export const COSMIC_BADGE_SPECS: CosmicBadgeSpec[] = [
  {
    id: "nearbySun",
    label: "☀ 太陽系（中心・0光年）",
    accentColor: "#fbbf24",
    clickableBodyId: "sun",
  },
  {
    id: "nearbyRing10",
    label: "○ 10光年",
    accentColor: "#38bdf8",
    clickableBodyId: null,
  },
  {
    id: "nearbyRing100",
    label: "○ 100光年",
    accentColor: "#818cf8",
    clickableBodyId: null,
  },
  {
    id: "nearbyRing1000",
    label: "○ 1,000光年",
    accentColor: "#c084fc",
    clickableBodyId: null,
  },
  {
    id: "nearbyAlphaCen",
    label: "★ アルファ・ケンタウリ (4.4光年)",
    accentColor: "#fef08a",
    clickableBodyId: "alphaCentauri",
  },
  {
    id: "nearbySirius",
    label: "★ シリウス (8.6光年)",
    accentColor: "#bae6fd",
    clickableBodyId: "sirius",
  },
  {
    id: "nearbyProcyon",
    label: "★ プロキオン (11.5光年)",
    accentColor: "#fef9c3",
    clickableBodyId: "procyon",
  },
  {
    id: "nearbyAltair",
    label: "★ アルタイル (16.7光年)",
    accentColor: "#f0f9ff",
    clickableBodyId: "altair",
  },
  {
    id: "nearbyVega",
    label: "★ ベガ (25光年)",
    accentColor: "#bfdbfe",
    clickableBodyId: "vega",
  },
  {
    id: "nearbyArcturus",
    label: "★ アークトゥルス (37光年)",
    accentColor: "#fdba74",
    clickableBodyId: "arcturus",
  },
  {
    id: "nearbyCapella",
    label: "★ カペラ (43光年)",
    accentColor: "#fde68a",
    clickableBodyId: "capella",
  },
  {
    id: "nearbySpica",
    label: "★ スピカ (250光年)",
    accentColor: "#93c5fd",
    clickableBodyId: "spica",
  },
  {
    id: "nearbyBetelgeuse",
    label: "★ ベテルギウス (550光年)",
    accentColor: "#fb923c",
    clickableBodyId: "betelgeuse",
  },
  {
    id: "nearbyRigel",
    label: "★ リゲル (860光年)",
    accentColor: "#93c5fd",
    clickableBodyId: "rigel",
  },
  {
    id: "nearbyDeneb",
    label: "★ デネブ (2,600光年)",
    accentColor: "#dbeafe",
    clickableBodyId: "deneb",
  },
  {
    id: "milkyWay",
    label: "✦ 天の川銀河",
    accentColor: "#93c5fd",
    clickableBodyId: "milkyWay",
  },
  {
    id: "solarSystemInGalaxy",
    label: "☀ 太陽系（オリオン腕・約2.6万光年）",
    accentColor: "#fbbf24",
    clickableBodyId: "sun",
  },
  {
    id: "galacticCenter",
    label: "◎ 銀河中心（いて座A*）",
    accentColor: "#fde68a",
    clickableBodyId: "milkyWay",
  },
  {
    id: "andromeda",
    label: "✧ アンドロメダ銀河 (M31)",
    accentColor: "#c4b5fd",
    clickableBodyId: "andromeda",
  },
  {
    id: "triangulum",
    label: "✶ さんかく座銀河 (M33)",
    accentColor: "#67e8f9",
    clickableBodyId: "triangulum",
  },
  {
    id: "magellanicClouds",
    label: "☁ 大小マゼラン雲",
    accentColor: "#bae6fd",
    clickableBodyId: "magellanicClouds",
  },
  {
    id: "localGroup",
    label: "◎ 局部銀河群（直径 約1,000万光年）",
    accentColor: "#7dd3fc",
    clickableBodyId: "localGroup",
  },
  {
    id: "virgoCluster",
    label: "❖ おとめ座銀河団 (M87・約2,000銀河)",
    accentColor: "#fde68a",
    clickableBodyId: "virgoCluster",
  },
  {
    id: "greatAttractor",
    label: "◈ グレートアトラクター方向",
    accentColor: "#f0abfc",
    clickableBodyId: "greatAttractor",
  },
  {
    id: "comaCluster",
    label: "◈ かみのけ座銀河団",
    accentColor: "#a5b4fc",
    clickableBodyId: "comaCluster",
  },
  {
    id: "fornaxCluster",
    label: "◈ ろ座銀河団",
    accentColor: "#93c5fd",
    clickableBodyId: "fornaxCluster",
  },
  {
    id: "distancePair",
    label: "⟷ 約250万光年（約45億年後に合体）",
    accentColor: "#fde68a",
    clickableBodyId: null,
  },
  {
    id: "distanceVirgo",
    label: "⟷ 約5,400万光年",
    accentColor: "#7dd3fc",
    clickableBodyId: null,
  },
  {
    id: "laniakea",
    label: "❖ ラニアケア超銀河団（直径 約5.2億光年）",
    accentColor: "#f0abfc",
    clickableBodyId: "laniakea",
  },
  {
    id: "greatAttractorCore",
    label: "★ グレートアトラクター（重力中心）",
    accentColor: "#fde68a",
    clickableBodyId: "greatAttractor",
  },
  {
    id: "virgoSuperclusterNode",
    label: "◎ おとめ座超銀河団（天の川の住所）",
    accentColor: "#7dd3fc",
    clickableBodyId: "virgoCluster",
  },
  {
    id: "shapleySupercluster",
    label: "◈ シャプレー超銀河団（さらに奥の重力源）",
    accentColor: "#f472b6",
    clickableBodyId: "laniakea",
  },
  {
    id: "perseusPisces",
    label: "◈ ペルセウス座・うお座超銀河団",
    accentColor: "#a5b4fc",
    clickableBodyId: null,
  },
  {
    id: "observableUniverse",
    label: "✦ 観測可能な宇宙（直径 約930億光年）",
    accentColor: "#38bdf8",
    clickableBodyId: "observableUniverse",
  },
  {
    id: "cmbHorizon",
    label: "◎ 宇宙マイクロ波背景放射 (CMB・約138億年前)",
    accentColor: "#fbbf24",
    clickableBodyId: "observableUniverse",
  },
  {
    id: "cosmicVoid",
    label: "◯ 超空洞（ボイド：銀河がほぼない空間）",
    accentColor: "#94a3b8",
    clickableBodyId: null,
  },
  {
    id: "cosmicWeb",
    label: "❖ 銀河フィラメント（コズミック・ウェブ）",
    accentColor: "#c4b5fd",
    clickableBodyId: "observableUniverse",
  },
  {
    id: "ourPositionInUniverse",
    label: "◎ ラニアケア超銀河団（私たちの位置）",
    accentColor: "#7dd3fc",
    clickableBodyId: "laniakea",
  },
];

/**
 * 観測可能な宇宙の最外殻を彩る「宇宙マイクロ波背景放射（CMB）」の
 * 温度ゆらぎ模様（プランク衛星風の青・水色・金・橙のまだら模様）をプロシージャル生成します。
 */
function createCmbTexture(): THREE.CanvasTexture {
  const width = 384;
  const height = 192;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(width, height);
  const data = img.data;

  // 球面調和風の複数周波数の波を合成して、シームレスな宇宙背景放射ゆらぎを作ります。
  const rand = createSeededRandom(13800);
  const waves: Array<{
    kx: number;
    ky: number;
    kz: number;
    phase: number;
    amp: number;
  }> = [];
  for (let i = 0; i < 28; i++) {
    const freq = i < 10 ? 3 + i * 0.7 : 8 + (i - 10) * 1.1;
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    waves.push({
      kx: s * Math.cos(th) * freq,
      ky: u * freq,
      kz: s * Math.sin(th) * freq,
      phase: rand() * Math.PI * 2,
      amp: i < 10 ? 1.0 : 0.45,
    });
  }

  for (let y = 0; y < height; y++) {
    const lat = (0.5 - y / height) * Math.PI;
    const cosLat = Math.cos(lat);
    const sinLat = Math.sin(lat);
    for (let x = 0; x < width; x++) {
      const lon = (x / width) * Math.PI * 2;
      const sx = cosLat * Math.cos(lon);
      const sy = sinLat;
      const sz = cosLat * Math.sin(lon);

      let sum = 0;
      for (const w of waves) {
        sum += Math.sin(sx * w.kx + sy * w.ky + sz * w.kz + w.phase) * w.amp;
      }
      const norm = THREE.MathUtils.clamp(sum * 0.14 + 0.5, 0, 1);

      let r = 0;
      let g = 0;
      let b = 0;
      if (norm < 0.35) {
        const t = norm / 0.35;
        r = THREE.MathUtils.lerp(12, 36, t);
        g = THREE.MathUtils.lerp(36, 118, t);
        b = THREE.MathUtils.lerp(116, 212, t);
      } else if (norm < 0.62) {
        const t = (norm - 0.35) / 0.27;
        r = THREE.MathUtils.lerp(36, 94, t);
        g = THREE.MathUtils.lerp(118, 198, t);
        b = THREE.MathUtils.lerp(212, 216, t);
      } else if (norm < 0.82) {
        const t = (norm - 0.62) / 0.2;
        r = THREE.MathUtils.lerp(94, 245, t);
        g = THREE.MathUtils.lerp(198, 186, t);
        b = THREE.MathUtils.lerp(216, 72, t);
      } else {
        const t = (norm - 0.82) / 0.18;
        r = THREE.MathUtils.lerp(245, 224, t);
        g = THREE.MathUtils.lerp(186, 92, t);
        b = THREE.MathUtils.lerp(72, 46, t);
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.round(r);
      data[idx + 1] = Math.round(g);
      data[idx + 2] = Math.round(b);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** 再現性のある美しい銀河配置を得るための軽量な疑似乱数生成器です。 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function createCircleLine(
  radius: number,
  color: number,
  opacity: number,
  segments = 128,
  dashed = false
): { line: THREE.Line; mat: THREE.Material; geo: THREE.BufferGeometry } {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, -Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = dashed
    ? new THREE.LineDashedMaterial({
        color,
        dashSize: radius * 0.08,
        gapSize: radius * 0.05,
        transparent: true,
        opacity,
        depthWrite: false,
      })
    : new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      });
  const line = new THREE.Line(geo, mat);
  if (dashed) {
    line.computeLineDistances();
  }
  return { line, mat, geo };
}

interface GalaxyBuildOptions {
  radius: number;
  starCount: number;
  arms: number;
  twist: number;
  barStrength: number;
  coreColor: THREE.Color;
  armColor: THREE.Color;
  nebulaColor: THREE.Color;
  pointSize: number;
  seed: number;
  starTexture: THREE.Texture;
}

interface GalaxyBuildResult {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  materials: Array<{ mat: THREE.Material; baseOpacity: number }>;
  geometries: THREE.BufferGeometry[];
}

/**
 * 対数渦巻腕・中央バルジ（棒状構造）・星形成領域（ピンクのHII領域）・ハロー星を備えた
 * 3D 渦巻銀河（天の川銀河・アンドロメダ銀河・さんかく座銀河用）を生成します。
 */
function createSpiralGalaxy(opts: GalaxyBuildOptions): GalaxyBuildResult {
  const rand = createSeededRandom(opts.seed);
  const group = new THREE.Group();
  const materials: Array<{ mat: THREE.Material; baseOpacity: number }> = [];
  const geometries: THREE.BufferGeometry[] = [];

  const positions = new Float32Array(opts.starCount * 3);
  const colors = new Float32Array(opts.starCount * 3);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < opts.starCount; i++) {
    const pick = rand();
    let x = 0;
    let y = 0;
    let z = 0;
    let tRadial = 0;

    if (pick < 0.22) {
      // 中央バルジ・棒状構造（暖かな黄金白色の古い星々）
      const rNorm = Math.pow(rand(), 1.8) * 0.28;
      const angle = rand() * Math.PI * 2;
      const barStretch = 1 + opts.barStrength * 0.85;
      x = Math.cos(angle) * rNorm * opts.radius * barStretch;
      z = Math.sin(angle) * rNorm * opts.radius * (1 - opts.barStrength * 0.35);
      y = (rand() - 0.5) * opts.radius * 0.12 * (1 - rNorm * 2.2);
      tRadial = rNorm;
      tmpColor.copy(opts.coreColor).lerp(new THREE.Color(0xffffff), (1 - rNorm * 3) * 0.45);
    } else if (pick < 0.92) {
      // 対数渦巻腕（青い若い星々とピンクの星形成領域）
      const armIdx = i % opts.arms;
      const rNorm = Math.pow(rand(), 0.72);
      const r = (0.1 + rNorm * 0.9) * opts.radius;
      const baseAngle = (armIdx / opts.arms) * Math.PI * 2;
      const spiralAngle = baseAngle + rNorm * opts.twist;
      const scatter = (rand() - 0.5 + (rand() - 0.5)) * (0.28 + rNorm * 0.42);
      const finalAngle = spiralAngle + scatter;
      x = Math.cos(finalAngle) * r;
      z = Math.sin(finalAngle) * r;
      const thickness = opts.radius * (0.045 * (1 - rNorm * 0.65) + 0.012);
      y = (rand() - 0.5) * thickness;
      tRadial = rNorm;

      if (rand() < 0.08 && rNorm > 0.2 && rNorm < 0.85) {
        tmpColor.copy(opts.nebulaColor);
      } else {
        tmpColor.copy(opts.coreColor).lerp(opts.armColor, Math.min(1, rNorm * 1.25));
      }
      const brightness = 0.55 + rand() * 0.45;
      tmpColor.multiplyScalar(brightness);
    } else {
      // 銀河ハロー（球状星団を含む淡い立体ハロー）
      const u = rand();
      const v = rand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = (0.25 + rand() * 0.85) * opts.radius;
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi) * 0.42;
      z = r * Math.sin(phi) * Math.sin(theta);
      tRadial = r / opts.radius;
      tmpColor.copy(opts.coreColor).lerp(opts.armColor, tRadial * 0.6).multiplyScalar(0.5);
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const starMat = new THREE.PointsMaterial({
    size: opts.pointSize,
    map: opts.starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const starPoints = new THREE.Points(starGeo, starMat);
  group.add(starPoints);
  geometries.push(starGeo);
  materials.push({ mat: starMat, baseOpacity: 0.95 });

  // 銀河中心の柔らかなコア発光スプライト
  const coreSpriteMat = new THREE.SpriteMaterial({
    map: opts.starTexture,
    color: opts.coreColor,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const coreSprite = new THREE.Sprite(coreSpriteMat);
  coreSprite.scale.setScalar(opts.radius * 0.56);
  group.add(coreSprite);
  materials.push({ mat: coreSpriteMat, baseOpacity: 0.9 });

  // レイキャスト（タップ選択）用の不可視ヒット球
  const hitGeo = new THREE.SphereGeometry(opts.radius * 0.72, 16, 12);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.scale.set(1, 0.42, 1);
  group.add(hitMesh);
  geometries.push(hitGeo);
  materials.push({ mat: hitMat, baseOpacity: 0 });

  return { group, hitMesh, materials, geometries };
}

/**
 * 大小マゼラン雲などの不規則銀河（青い星雲状の星団）を生成します。
 */
function createIrregularCloud(
  radius: number,
  starCount: number,
  seed: number,
  starTexture: THREE.Texture
): GalaxyBuildResult {
  const rand = createSeededRandom(seed);
  const group = new THREE.Group();
  const materials: Array<{ mat: THREE.Material; baseOpacity: number }> = [];
  const geometries: THREE.BufferGeometry[] = [];

  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const c1 = new THREE.Color(0xbae6fd);
  const c2 = new THREE.Color(0xf472b6);
  const tmp = new THREE.Color();

  for (let i = 0; i < starCount; i++) {
    const isSmall = i > starCount * 0.65;
    const cx = isSmall ? radius * 0.85 : 0;
    const cy = isSmall ? -radius * 0.35 : 0;
    const cz = isSmall ? radius * 0.5 : 0;
    const spread = isSmall ? radius * 0.48 : radius * 0.85;
    positions[i * 3] = cx + (rand() - 0.5 + (rand() - 0.5)) * spread;
    positions[i * 3 + 1] = cy + (rand() - 0.5) * spread * 0.55;
    positions[i * 3 + 2] = cz + (rand() - 0.5 + (rand() - 0.5)) * spread * 0.75;

    tmp.copy(rand() < 0.14 ? c2 : c1).multiplyScalar(0.65 + rand() * 0.35);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.72,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  group.add(new THREE.Points(geo, mat));
  geometries.push(geo);
  materials.push({ mat, baseOpacity: 0.9 });

  const hitGeo = new THREE.SphereGeometry(radius * 1.1, 12, 10);
  const hitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitMesh);
  geometries.push(hitGeo);
  materials.push({ mat: hitMat, baseOpacity: 0 });

  return { group, hitMesh, materials, geometries };
}

export interface CosmicScaleRig {
  root: THREE.Group;
  update: (
    cosmicLevel: number,
    totalTimeSec: number,
    cameraDistance: number,
    isTransitioning: boolean,
    fromStage: number,
    fromDistance: number
  ) => void;
  getBadgeWorldPositions: (
    cosmicLevel: number
  ) => Array<{ id: CosmicBadgeId; position: THREE.Vector3; visible: boolean }>;
  getPickCandidates: (
    cosmicLevel: number
  ) => Array<{ id: CelestialBodyId; mesh: THREE.Object3D }>;
  getFocusWorldPosAndRadius: (
    bodyId: CelestialBodyId,
    cosmicLevel: number,
    outPos: THREE.Vector3
  ) => number | null;
  dispose: () => void;
}

/**
 * 宇宙の7階層（近傍恒星・天の川銀河・天の川＆アンドロメダ・局部銀河群・おとめ座銀河団・ラニアケア超銀河団・観測可能な宇宙）の
 * 3D ステージ群をまとめて生成します。
 */
export function createCosmicScaleRig(starTexture: THREE.Texture): CosmicScaleRig {
  const root = new THREE.Group();
  root.visible = false;

  const allGeos: THREE.BufferGeometry[] = [];
  const allMats: THREE.Material[] = [];

  const registerMaterials = (
    target: Array<{ mat: THREE.Material; baseOpacity: number }>,
    items: Array<{ mat: THREE.Material; baseOpacity: number }>,
    geos: THREE.BufferGeometry[]
  ) => {
    for (const item of items) {
      target.push(item);
      allMats.push(item.mat);
    }
    for (const g of geos) {
      allGeos.push(g);
    }
  };

  // =========================================================================
  // Stage 1 (cosmicLevel = 1): 近傍恒星（太陽系近傍〜2,600光年・星座の3D奥行き）
  // =========================================================================
  const stageNearbyGroup = new THREE.Group();
  root.add(stageNearbyGroup);
  const stageNearbyMats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  // 中心の太陽系マーカー
  const nearbySunGeo = new THREE.SphereGeometry(0.95, 16, 12);
  const nearbySunMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.98,
  });
  const nearbySunMesh = new THREE.Mesh(nearbySunGeo, nearbySunMat);
  stageNearbyGroup.add(nearbySunMesh);
  allGeos.push(nearbySunGeo);
  allMats.push(nearbySunMat);
  stageNearbyMats.push({ mat: nearbySunMat, baseOpacity: 0.98 });

  const nearbySunGlowMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const nearbySunGlow = new THREE.Sprite(nearbySunGlowMat);
  nearbySunGlow.scale.setScalar(6.5);
  stageNearbyGroup.add(nearbySunGlow);
  allMats.push(nearbySunGlowMat);
  stageNearbyMats.push({ mat: nearbySunGlowMat, baseOpacity: 0.95 });

  // 10光年・100光年・1,000光年の対数距離基準リング（黄道面 Y = 0 上）
  const r10 = starDistanceLyToSceneRadius(10);
  const r100 = starDistanceLyToSceneRadius(100);
  const r1000 = starDistanceLyToSceneRadius(1000);
  for (const [ringR, ringCol, ringOp, isDash] of [
    [r10, 0x38bdf8, 0.34, false],
    [r100, 0x818cf8, 0.3, true],
    [r1000, 0xc084fc, 0.28, true],
  ] as Array<[number, number, number, boolean]>) {
    const ring = createCircleLine(ringR, ringCol, ringOp, 128, isDash);
    stageNearbyGroup.add(ring.line);
    allGeos.push(ring.geo);
    allMats.push(ring.mat);
    stageNearbyMats.push({ mat: ring.mat, baseOpacity: ringOp });
  }

  // 黄道面の十字ガイド線（X・Z軸）
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-r1000 - 3, 0, 0),
    new THREE.Vector3(r1000 + 3, 0, 0),
    new THREE.Vector3(0, 0, -r1000 - 3),
    new THREE.Vector3(0, 0, r1000 + 3),
  ]);
  const axisMat = new THREE.LineBasicMaterial({
    color: 0x475569,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  stageNearbyGroup.add(new THREE.LineSegments(axisGeo, axisMat));
  allGeos.push(axisGeo);
  allMats.push(axisMat);
  stageNearbyMats.push({ mat: axisMat, baseOpacity: 0.22 });

  // 周囲のオリオン腕背景恒星（約850個）
  const nearbyBgRand = createSeededRandom(8600);
  const bgCount = 850;
  const bgPos = new Float32Array(bgCount * 3);
  const bgCol = new Float32Array(bgCount * 3);
  for (let i = 0; i < bgCount; i++) {
    const u = nearbyBgRand() * 2 - 1;
    const th = nearbyBgRand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 8 + Math.cbrt(nearbyBgRand()) * 32;
    bgPos[i * 3] = s * Math.cos(th) * r;
    bgPos[i * 3 + 1] = u * r * 0.65;
    bgPos[i * 3 + 2] = s * Math.sin(th) * r;
    const tint = nearbyBgRand();
    bgCol[i * 3] = tint < 0.3 ? 0.72 : 0.92;
    bgCol[i * 3 + 1] = 0.85;
    bgCol[i * 3 + 2] = tint > 0.7 ? 0.75 : 1.0;
  }
  const bgPtsGeo = new THREE.BufferGeometry();
  bgPtsGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
  bgPtsGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
  const bgPtsMat = new THREE.PointsMaterial({
    size: 0.85,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stageNearbyGroup.add(new THREE.Points(bgPtsGeo, bgPtsMat));
  allGeos.push(bgPtsGeo);
  allMats.push(bgPtsMat);
  stageNearbyMats.push({ mat: bgPtsMat, baseOpacity: 0.52 });

  // 主要15恒星を実際のJ2000.0方向 × 対数距離で3D配置＋黄道面への垂線（高さガイド）
  const nearbyStarPosMap = new Map<FeaturedStarId, THREE.Vector3>();
  const nearbyStarHitList: Array<{ id: CelestialBodyId; mesh: THREE.Object3D }> = [
    { id: "sun", mesh: nearbySunMesh },
  ];
  const dropLinePts: THREE.Vector3[] = [];
  const sightRayPts: THREE.Vector3[] = [];
  const starDotGeo = new THREE.SphereGeometry(0.68, 32, 24);
  const starHitGeo = new THREE.SphereGeometry(2.1, 10, 8);
  const footDotGeo = new THREE.CircleGeometry(0.32, 12);
  footDotGeo.rotateX(-Math.PI / 2);
  allGeos.push(starDotGeo, starHitGeo, footDotGeo);

  for (const star of FEATURED_BRIGHT_STARS) {
    const r = starDistanceLyToSceneRadius(star.distanceLy);
    const pos = new THREE.Vector3(
      star.unitDir[0] * r,
      star.unitDir[1] * r,
      star.unitDir[2] * r
    );
    nearbyStarPosMap.set(star.id, pos);

    const isSupergiant =
      star.id === "betelgeuse" || star.id === "rigel" || star.id === "deneb";
    const sizeScale =
      star.id === "sirius" ? 1.4 : isSupergiant ? 1.55 : 1.05;
    const starCol = new THREE.Color(star.colorHex);

    const sMat = new THREE.MeshBasicMaterial({
      color: starCol,
      transparent: true,
      opacity: 0.98,
    });
    const sMesh = new THREE.Mesh(starDotGeo, sMat);
    sMesh.position.copy(pos);
    sMesh.scale.setScalar(sizeScale);
    stageNearbyGroup.add(sMesh);
    allMats.push(sMat);
    stageNearbyMats.push({ mat: sMat, baseOpacity: 0.98 });

    const glowMat = new THREE.SpriteMaterial({
      map: starTexture,
      color: starCol,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.position.copy(pos);
    glowSprite.scale.setScalar(sizeScale * 4.2);
    stageNearbyGroup.add(glowSprite);
    allMats.push(glowMat);
    stageNearbyMats.push({ mat: glowMat, baseOpacity: 0.92 });

    // 黄道面 (Y = 0) への垂直ドロップラインと足元ドット
    dropLinePts.push(pos.clone(), new THREE.Vector3(pos.x, 0, pos.z));
    const footMat = new THREE.MeshBasicMaterial({
      color: starCol,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const footMesh = new THREE.Mesh(footDotGeo, footMat);
    footMesh.position.set(pos.x, 0.02, pos.z);
    stageNearbyGroup.add(footMesh);
    allMats.push(footMat);
    stageNearbyMats.push({ mat: footMat, baseOpacity: 0.45 });

    // タップ判定用ヒット球
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const hitMesh = new THREE.Mesh(starHitGeo, hitMat);
    hitMesh.position.copy(pos);
    stageNearbyGroup.add(hitMesh);
    allMats.push(hitMat);
    nearbyStarHitList.push({ id: star.bodyId, mesh: hitMesh });

    // 太陽からの視線方向ガイド（主要三角構成星のみ淡く結んで「地球からは三角形に見える」ことを視覚化）
    if (
      star.id === "sirius" ||
      star.id === "betelgeuse" ||
      star.id === "procyon" ||
      star.id === "vega" ||
      star.id === "altair" ||
      star.id === "deneb"
    ) {
      sightRayPts.push(new THREE.Vector3(0, 0, 0), pos.clone());
    }
  }

  const dropGeo = new THREE.BufferGeometry().setFromPoints(dropLinePts);
  const dropMat = new THREE.LineBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  stageNearbyGroup.add(new THREE.LineSegments(dropGeo, dropMat));
  allGeos.push(dropGeo);
  allMats.push(dropMat);
  stageNearbyMats.push({ mat: dropMat, baseOpacity: 0.32 });

  const sightRayGeo = new THREE.BufferGeometry().setFromPoints(sightRayPts);
  const sightRayMat = new THREE.LineBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  stageNearbyGroup.add(new THREE.LineSegments(sightRayGeo, sightRayMat));
  allGeos.push(sightRayGeo);
  allMats.push(sightRayMat);
  stageNearbyMats.push({ mat: sightRayMat, baseOpacity: 0.16 });

  // 実際の3D空間で歪んで見える「春・夏・冬の大三角」ラインを描画します！
  const add3DTriangle = (
    ids: [FeaturedStarId, FeaturedStarId, FeaturedStarId],
    colorHex: number
  ) => {
    const p0 = nearbyStarPosMap.get(ids[0]);
    const p1 = nearbyStarPosMap.get(ids[1]);
    const p2 = nearbyStarPosMap.get(ids[2]);
    if (!p0 || !p1 || !p2) return;
    const triGeo = new THREE.BufferGeometry().setFromPoints([
      p0.clone(),
      p1.clone(),
      p2.clone(),
      p0.clone(),
    ]);
    const triMat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });
    stageNearbyGroup.add(new THREE.Line(triGeo, triMat));
    allGeos.push(triGeo);
    allMats.push(triMat);
    stageNearbyMats.push({ mat: triMat, baseOpacity: 0.68 });
  };
  add3DTriangle(["sirius", "betelgeuse", "procyon"], 0x93c5fd); // 冬の大三角（3D奥行き）
  add3DTriangle(["vega", "altair", "deneb"], 0x67e8f9); // 夏の大三角（3D奥行き）
  add3DTriangle(["arcturus", "spica", "denebola"], 0xf9a8d4); // 春の大三角（3D奥行き）

  // =========================================================================
  // Stage 2 (cosmicLevel = 2): 天の川銀河（直径 約10万光年）
  // =========================================================================
  const stage1Group = new THREE.Group();
  root.add(stage1Group);
  const stage1Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  const mwHero = createSpiralGalaxy({
    radius: 24,
    starCount: 5200,
    arms: 4,
    twist: 4.3,
    barStrength: 0.52,
    coreColor: new THREE.Color(0xfde68a),
    armColor: new THREE.Color(0x60a5fa),
    nebulaColor: new THREE.Color(0xf472b6),
    pointSize: 0.95,
    seed: 101,
    starTexture,
  });
  stage1Group.add(mwHero.group);
  registerMaterials(stage1Mats, mwHero.materials, mwHero.geometries);

  // 太陽系の位置（オリオン腕：銀河中心から約2.6万光年 = 半径 12.5）
  const solarAnchor = new THREE.Group();
  solarAnchor.position.set(10.8, 0.35, 6.2);
  mwHero.group.add(solarAnchor);

  const solarDotGeo = new THREE.SphereGeometry(0.45, 16, 16);
  const solarDotMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.98,
  });
  const solarDotMesh = new THREE.Mesh(solarDotGeo, solarDotMat);
  solarAnchor.add(solarDotMesh);
  allGeos.push(solarDotGeo);
  allMats.push(solarDotMat);
  stage1Mats.push({ mat: solarDotMat, baseOpacity: 0.98 });

  const solarGlowMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0xfde68a,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const solarGlowSprite = new THREE.Sprite(solarGlowMat);
  solarGlowSprite.scale.setScalar(3.4);
  solarAnchor.add(solarGlowSprite);
  allMats.push(solarGlowMat);
  stage1Mats.push({ mat: solarGlowMat, baseOpacity: 0.95 });

  // 太陽系の銀河公転軌道リング（半径 12.5）と天の川銀河外周リング（半径 25.2）
  const sunGalacticOrbit = createCircleLine(12.45, 0xfbbf24, 0.38, 128, true);
  stage1Group.add(sunGalacticOrbit.line);
  allGeos.push(sunGalacticOrbit.geo);
  allMats.push(sunGalacticOrbit.mat);
  stage1Mats.push({ mat: sunGalacticOrbit.mat, baseOpacity: 0.38 });

  const mwScaleRing = createCircleLine(25.2, 0x38bdf8, 0.22, 160, false);
  stage1Group.add(mwScaleRing.line);
  allGeos.push(mwScaleRing.geo);
  allMats.push(mwScaleRing.mat);
  stage1Mats.push({ mat: mwScaleRing.mat, baseOpacity: 0.22 });

  // =========================================================================
  // Stage 3 (cosmicLevel = 3): 天の川銀河とアンドロメダ銀河（約250万光年）
  // =========================================================================
  const stage2Group = new THREE.Group();
  root.add(stage2Group);
  const stage2Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  const mwPair = createSpiralGalaxy({
    radius: 7.4,
    starCount: 2400,
    arms: 4,
    twist: 4.1,
    barStrength: 0.5,
    coreColor: new THREE.Color(0xfde68a),
    armColor: new THREE.Color(0x60a5fa),
    nebulaColor: new THREE.Color(0xf472b6),
    pointSize: 0.72,
    seed: 202,
    starTexture,
  });
  mwPair.group.position.set(-16.5, -2.2, 4.0);
  mwPair.group.rotation.set(0.32, 0.2, -0.18);
  stage2Group.add(mwPair.group);
  registerMaterials(stage2Mats, mwPair.materials, mwPair.geometries);

  const magellanicPair = createIrregularCloud(2.2, 320, 209, starTexture);
  magellanicPair.group.position.set(-20.4, -5.8, 7.2);
  stage2Group.add(magellanicPair.group);
  registerMaterials(
    stage2Mats,
    magellanicPair.materials,
    magellanicPair.geometries
  );

  const andromedaPair = createSpiralGalaxy({
    radius: 10.8,
    starCount: 3400,
    arms: 2,
    twist: 5.2,
    barStrength: 0.15,
    coreColor: new THREE.Color(0xfffbeb),
    armColor: new THREE.Color(0xc4b5fd),
    nebulaColor: new THREE.Color(0x93c5fd),
    pointSize: 0.78,
    seed: 303,
    starTexture,
  });
  andromedaPair.group.position.set(17.5, 4.0, -5.0);
  andromedaPair.group.rotation.set(0.68, -0.35, 0.42);
  stage2Group.add(andromedaPair.group);
  registerMaterials(
    stage2Mats,
    andromedaPair.materials,
    andromedaPair.geometries
  );

  // 天の川銀河 ↔ アンドロメダ銀河を結ぶ距離・接近ライン（約250万光年）
  const pairLineGeo = new THREE.BufferGeometry().setFromPoints([
    mwPair.group.position.clone(),
    andromedaPair.group.position.clone(),
  ]);
  const pairLineMat = new THREE.LineDashedMaterial({
    color: 0xfbbf24,
    dashSize: 1.1,
    gapSize: 0.7,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const pairLine = new THREE.Line(pairLineGeo, pairLineMat);
  pairLine.computeLineDistances();
  stage2Group.add(pairLine);
  allGeos.push(pairLineGeo);
  allMats.push(pairLineMat);
  stage2Mats.push({ mat: pairLineMat, baseOpacity: 0.55 });

  // =========================================================================
  // Stage 4 (cosmicLevel = 4): 局部銀河群（直径 約1,000万光年・50個以上の銀河）
  // =========================================================================
  const stage3Group = new THREE.Group();
  root.add(stage3Group);
  const stage3Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  // 局部銀河群の広がりを示す3軸の球体境界リング（直径 約1,000万光年）
  for (const rot of [
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    [Math.PI / 2, Math.PI / 2, 0],
  ] as Array<[number, number, number]>) {
    const ring = createCircleLine(29.5, 0x38bdf8, 0.18, 128, true);
    ring.line.rotation.set(rot[0], rot[1], rot[2]);
    stage3Group.add(ring.line);
    allGeos.push(ring.geo);
    allMats.push(ring.mat);
    stage3Mats.push({ mat: ring.mat, baseOpacity: 0.18 });
  }

  const mwLocal = createSpiralGalaxy({
    radius: 5.2,
    starCount: 1500,
    arms: 4,
    twist: 4.0,
    barStrength: 0.48,
    coreColor: new THREE.Color(0xfde68a),
    armColor: new THREE.Color(0x60a5fa),
    nebulaColor: new THREE.Color(0xf472b6),
    pointSize: 0.65,
    seed: 404,
    starTexture,
  });
  mwLocal.group.position.set(-11.8, -2.0, 3.2);
  mwLocal.group.rotation.set(0.32, 0.2, -0.18);
  stage3Group.add(mwLocal.group);
  registerMaterials(stage3Mats, mwLocal.materials, mwLocal.geometries);

  const magellanicLocal = createIrregularCloud(1.6, 200, 405, starTexture);
  magellanicLocal.group.position.set(-15.0, -4.8, 5.8);
  stage3Group.add(magellanicLocal.group);
  registerMaterials(
    stage3Mats,
    magellanicLocal.materials,
    magellanicLocal.geometries
  );

  const andromedaLocal = createSpiralGalaxy({
    radius: 7.4,
    starCount: 2000,
    arms: 2,
    twist: 5.0,
    barStrength: 0.15,
    coreColor: new THREE.Color(0xfffbeb),
    armColor: new THREE.Color(0xc4b5fd),
    nebulaColor: new THREE.Color(0x93c5fd),
    pointSize: 0.68,
    seed: 505,
    starTexture,
  });
  andromedaLocal.group.position.set(12.2, 3.8, -3.6);
  andromedaLocal.group.rotation.set(0.66, -0.34, 0.4);
  stage3Group.add(andromedaLocal.group);
  registerMaterials(
    stage3Mats,
    andromedaLocal.materials,
    andromedaLocal.geometries
  );

  const triangulumLocal = createSpiralGalaxy({
    radius: 3.9,
    starCount: 1100,
    arms: 2,
    twist: 3.8,
    barStrength: 0.05,
    coreColor: new THREE.Color(0xfef3c7),
    armColor: new THREE.Color(0x67e8f9),
    nebulaColor: new THREE.Color(0xf472b6),
    pointSize: 0.62,
    seed: 606,
    starTexture,
  });
  triangulumLocal.group.position.set(19.5, -3.2, 7.6);
  triangulumLocal.group.rotation.set(0.45, 0.3, -0.25);
  stage3Group.add(triangulumLocal.group);
  registerMaterials(
    stage3Mats,
    triangulumLocal.materials,
    triangulumLocal.geometries
  );

  // 局部銀河群を構成する約52個の矮小銀河（M32, M110, NGC 6822, IC 1613 など）
  const dwarfRand = createSeededRandom(707);
  const dwarfCount = 52;
  const dwarfCoords = new Float32Array(dwarfCount * 3);
  const dwarfCols = new Float32Array(dwarfCount * 3);
  const dwarfLinks: THREE.Vector3[] = [];
  for (let i = 0; i < dwarfCount; i++) {
    const aroundAndromeda = i < 26;
    const aroundMw = i >= 26 && i < 44;
    const baseCenter = aroundAndromeda
      ? andromedaLocal.group.position
      : aroundMw
      ? mwLocal.group.position
      : new THREE.Vector3(0, 0, 0);
    const spread = aroundAndromeda || aroundMw ? 10.5 : 26.0;
    const u = dwarfRand();
    const v = dwarfRand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = (0.35 + dwarfRand() * 0.65) * spread;
    const dx = baseCenter.x + r * Math.sin(phi) * Math.cos(theta);
    const dy = baseCenter.y + r * Math.cos(phi) * 0.72;
    const dz = baseCenter.z + r * Math.sin(phi) * Math.sin(theta);
    dwarfCoords[i * 3] = dx;
    dwarfCoords[i * 3 + 1] = dy;
    dwarfCoords[i * 3 + 2] = dz;

    if (aroundAndromeda) {
      dwarfCols[i * 3] = 0.85;
      dwarfCols[i * 3 + 1] = 0.78;
      dwarfCols[i * 3 + 2] = 1.0;
    } else if (aroundMw) {
      dwarfCols[i * 3] = 0.72;
      dwarfCols[i * 3 + 1] = 0.9;
      dwarfCols[i * 3 + 2] = 1.0;
    } else {
      dwarfCols[i * 3] = 0.95;
      dwarfCols[i * 3 + 1] = 0.9;
      dwarfCols[i * 3 + 2] = 0.72;
    }
    if (i % 4 === 0 && (aroundAndromeda || aroundMw)) {
      dwarfLinks.push(baseCenter.clone(), new THREE.Vector3(dx, dy, dz));
    }
  }
  const dwarfGeo = new THREE.BufferGeometry();
  dwarfGeo.setAttribute("position", new THREE.BufferAttribute(dwarfCoords, 3));
  dwarfGeo.setAttribute("color", new THREE.BufferAttribute(dwarfCols, 3));
  const dwarfMat = new THREE.PointsMaterial({
    size: 2.1,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage3Group.add(new THREE.Points(dwarfGeo, dwarfMat));
  allGeos.push(dwarfGeo);
  allMats.push(dwarfMat);
  stage3Mats.push({ mat: dwarfMat, baseOpacity: 0.9 });

  const dwarfLinkGeo = new THREE.BufferGeometry().setFromPoints(dwarfLinks);
  const dwarfLinkMat = new THREE.LineBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  stage3Group.add(new THREE.LineSegments(dwarfLinkGeo, dwarfLinkMat));
  allGeos.push(dwarfLinkGeo);
  allMats.push(dwarfLinkMat);
  stage3Mats.push({ mat: dwarfLinkMat, baseOpacity: 0.14 });

  // 局部銀河群全体をタップ選択できるヒット球
  const lgHitGeo = new THREE.SphereGeometry(14, 14, 10);
  const lgHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const lgHitMesh = new THREE.Mesh(lgHitGeo, lgHitMat);
  stage3Group.add(lgHitMesh);
  allGeos.push(lgHitGeo);
  allMats.push(lgHitMat);

  // =========================================================================
  // Stage 5 (cosmicLevel = 5): おとめ座銀河団（約5,400万光年）＆ 宇宙の大規模構造
  // =========================================================================
  const stage4Group = new THREE.Group();
  root.add(stage4Group);
  const stage4Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  const clusterRand = createSeededRandom(808);
  const virgoCenter = new THREE.Vector3(0, 0, 0);
  const localGroupNodePos = new THREE.Vector3(-27, -4.0, 14);
  const greatAttractorPos = new THREE.Vector3(22, -7.5, -12);
  const comaClusterPos = new THREE.Vector3(10, 24, -20);
  const fornaxClusterPos = new THREE.Vector3(-21, -20, -14);
  const superNodes = [
    virgoCenter,
    localGroupNodePos,
    greatAttractorPos,
    comaClusterPos,
    fornaxClusterPos,
    new THREE.Vector3(36, 16, 18),
    new THREE.Vector3(-34, 18, -14),
    new THREE.Vector3(6, -24, 24),
  ];

  // おとめ座銀河団（中心 M87 周りの約1,600銀河）＋ 超銀河団フィラメント（約2,200銀河）
  const totalClusterGalaxies = 3800;
  const cgCoords = new Float32Array(totalClusterGalaxies * 3);
  const cgCols = new Float32Array(totalClusterGalaxies * 3);
  const cGold = new THREE.Color(0xfde68a);
  const cCyan = new THREE.Color(0x7dd3fc);
  const cViolet = new THREE.Color(0xc4b5fd);
  const cTmp = new THREE.Color();

  const filamentEdges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [0, 7],
    [1, 4],
    [1, 6],
    [2, 3],
    [2, 5],
    [3, 6],
    [4, 7],
    [5, 7],
  ];

  for (let i = 0; i < totalClusterGalaxies; i++) {
    let x = 0;
    let y = 0;
    let z = 0;
    if (i < 1600) {
      // おとめ座銀河団本体の密集コア（M87中心）
      const u = clusterRand();
      const v = clusterRand();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = Math.pow(clusterRand(), 1.65) * 19.5;
      x = r * Math.sin(phi) * Math.cos(theta);
      y = r * Math.cos(phi) * 0.85;
      z = r * Math.sin(phi) * Math.sin(theta);
      cTmp.copy(cGold).lerp(cCyan, Math.min(1, r / 17));
      cTmp.multiplyScalar(0.62 + clusterRand() * 0.38);
    } else if (i < 1820) {
      // 局部銀河群ノードの小さな塊
      const r = Math.pow(clusterRand(), 1.2) * 5.2;
      const a1 = clusterRand() * Math.PI * 2;
      const a2 = Math.acos(2 * clusterRand() - 1);
      x = localGroupNodePos.x + r * Math.sin(a2) * Math.cos(a1);
      y = localGroupNodePos.y + r * Math.cos(a2);
      z = localGroupNodePos.z + r * Math.sin(a2) * Math.sin(a1);
      cTmp.copy(cCyan).multiplyScalar(0.75 + clusterRand() * 0.25);
    } else {
      // コズミック・ウェブ（フィラメントに沿って連なる超銀河団の銀河群）
      const edge = filamentEdges[i % filamentEdges.length];
      const pA = superNodes[edge[0]];
      const pB = superNodes[edge[1]];
      const t = clusterRand();
      const midSag = Math.sin(t * Math.PI) * 3.8;
      const jitter = (clusterRand() - 0.5 + (clusterRand() - 0.5)) * 5.8;
      const jitterY = (clusterRand() - 0.5 + (clusterRand() - 0.5)) * 4.8;
      const jitterZ = (clusterRand() - 0.5 + (clusterRand() - 0.5)) * 5.8;
      x = THREE.MathUtils.lerp(pA.x, pB.x, t) + jitter;
      y = THREE.MathUtils.lerp(pA.y, pB.y, t) + midSag * 0.35 + jitterY;
      z = THREE.MathUtils.lerp(pA.z, pB.z, t) + jitterZ;
      cTmp
        .copy(clusterRand() < 0.45 ? cViolet : clusterRand() < 0.75 ? cCyan : cGold)
        .multiplyScalar(0.5 + clusterRand() * 0.45);
    }
    cgCoords[i * 3] = x;
    cgCoords[i * 3 + 1] = y;
    cgCoords[i * 3 + 2] = z;
    cgCols[i * 3] = cTmp.r;
    cgCols[i * 3 + 1] = cTmp.g;
    cgCols[i * 3 + 2] = cTmp.b;
  }

  const clusterGeo = new THREE.BufferGeometry();
  clusterGeo.setAttribute("position", new THREE.BufferAttribute(cgCoords, 3));
  clusterGeo.setAttribute("color", new THREE.BufferAttribute(cgCols, 3));
  const clusterMat = new THREE.PointsMaterial({
    size: 1.55,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.94,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage4Group.add(new THREE.Points(clusterGeo, clusterMat));
  allGeos.push(clusterGeo);
  allMats.push(clusterMat);
  stage4Mats.push({ mat: clusterMat, baseOpacity: 0.94 });

  // おとめ座銀河団中心 M87 の黄金コア発光と、局部銀河群のシアンマーカー
  const m87Mat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0xfde68a,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const m87Sprite = new THREE.Sprite(m87Mat);
  m87Sprite.scale.setScalar(13.5);
  stage4Group.add(m87Sprite);
  allMats.push(m87Mat);
  stage4Mats.push({ mat: m87Mat, baseOpacity: 0.96 });

  const lgNodeRing = createCircleLine(5.8, 0x38bdf8, 0.55, 64, true);
  lgNodeRing.line.position.copy(localGroupNodePos);
  stage4Group.add(lgNodeRing.line);
  allGeos.push(lgNodeRing.geo);
  allMats.push(lgNodeRing.mat);
  stage4Mats.push({ mat: lgNodeRing.mat, baseOpacity: 0.55 });

  // フィラメントの繊細な網目ライン
  const webLinePts: THREE.Vector3[] = [];
  for (const [ia, ib] of filamentEdges) {
    webLinePts.push(superNodes[ia], superNodes[ib]);
  }
  const webLineGeo = new THREE.BufferGeometry().setFromPoints(webLinePts);
  const webLineMat = new THREE.LineBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  stage4Group.add(new THREE.LineSegments(webLineGeo, webLineMat));
  allGeos.push(webLineGeo);
  allMats.push(webLineMat);
  stage4Mats.push({ mat: webLineMat, baseOpacity: 0.2 });

  // 局部銀河群 ↔ おとめ座銀河団を結ぶ距離ガイド線（約5,400万光年）
  const virgoLinkGeo = new THREE.BufferGeometry().setFromPoints([
    localGroupNodePos.clone(),
    virgoCenter.clone(),
  ]);
  const virgoLinkMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    dashSize: 1.5,
    gapSize: 0.9,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
  });
  const virgoLinkLine = new THREE.Line(virgoLinkGeo, virgoLinkMat);
  virgoLinkLine.computeLineDistances();
  stage4Group.add(virgoLinkLine);
  allGeos.push(virgoLinkGeo);
  allMats.push(virgoLinkMat);
  stage4Mats.push({ mat: virgoLinkMat, baseOpacity: 0.62 });

  // おとめ座銀河団・局部銀河群のヒット球
  const virgoHitGeo = new THREE.SphereGeometry(14, 16, 12);
  const virgoHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const virgoHitMesh = new THREE.Mesh(virgoHitGeo, virgoHitMat);
  stage4Group.add(virgoHitMesh);
  allGeos.push(virgoHitGeo);
  allMats.push(virgoHitMat);

  const lgClusterHitGeo = new THREE.SphereGeometry(6.2, 12, 10);
  const lgClusterHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const lgClusterHitMesh = new THREE.Mesh(lgClusterHitGeo, lgClusterHitMat);
  lgClusterHitMesh.position.copy(localGroupNodePos);
  stage4Group.add(lgClusterHitMesh);
  allGeos.push(lgClusterHitGeo);
  allMats.push(lgClusterHitMat);

  // ろ座銀河団・かみのけ座銀河団・グレートアトラクターのタップ判定用ヒット球
  const createClusterHitSphere = (pos: THREE.Vector3, radius: number) => {
    const g = new THREE.SphereGeometry(radius, 12, 10);
    const m = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(pos);
    stage4Group.add(mesh);
    allGeos.push(g);
    allMats.push(m);
    return mesh;
  };
  const fornaxHitMesh = createClusterHitSphere(fornaxClusterPos, 6.5);
  const comaHitMesh = createClusterHitSphere(comaClusterPos, 6.5);
  const gaStage4HitMesh = createClusterHitSphere(greatAttractorPos, 6.8);

  // =========================================================================
  // Stage 6 (cosmicLevel = 6): ラニアケア超銀河団（直径 約5.2億光年・約10万銀河）
  // =========================================================================
  const stage5Group = new THREE.Group();
  root.add(stage5Group);
  const stage5Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];
  const allTextures: THREE.Texture[] = [];

  const laniRand = createSeededRandom(5200);
  const gaCorePos = new THREE.Vector3(4.5, 0.5, -1.5);
  const virgoSuperPos = new THREE.Vector3(-21.5, -4.5, 10.5);
  const shapleyPos = new THREE.Vector3(17.5, 9.5, -12.0);
  const perseusPos = new THREE.Vector3(-25.0, 10.0, -12.0);

  // ラニアケア超銀河団の流域境界（直径 約5.2億光年の淡い破線リング）
  for (const rot of [
    [0.2, 0.1, 0],
    [Math.PI / 2 + 0.15, 0.3, 0],
  ] as Array<[number, number, number]>) {
    const ring = createCircleLine(31.5, 0xf0abfc, 0.18, 128, true);
    ring.line.rotation.set(rot[0], rot[1], rot[2]);
    stage5Group.add(ring.line);
    allGeos.push(ring.geo);
    allMats.push(ring.mat);
    stage5Mats.push({ mat: ring.mat, baseOpacity: 0.18 });
  }

  // 羽根のように広がる重力流線（4つの主要ローブがグレートアトラクターへ流れ込む構造）
  const laniakeaBranches: Array<{
    tip: THREE.Vector3;
    ctrl: THREE.Vector3;
    color: THREE.Color;
    count: number;
  }> = [
    // おとめ座超銀河団・局部銀河群の枝（水色系）
    {
      tip: virgoSuperPos.clone(),
      ctrl: new THREE.Vector3(-9.0, -3.0, 9.5),
      color: new THREE.Color(0x38bdf8),
      count: 14,
    },
    // うみへび座・ケンタウルス座の枝（薄紫系）
    {
      tip: new THREE.Vector3(-12.0, 14.5, 14.0),
      ctrl: new THREE.Vector3(-4.0, 9.0, 8.0),
      color: new THREE.Color(0xa5b4fc),
      count: 13,
    },
    // くじゃく座・インディアン座の枝（ピンク・マゼンタ系）
    {
      tip: new THREE.Vector3(22.0, -14.0, 12.0),
      ctrl: new THREE.Vector3(14.5, -8.5, 6.5),
      color: new THREE.Color(0xf472b6),
      count: 14,
    },
    // 南方超銀河団・ろ座方面の枝（シアン・バイオレット系）
    {
      tip: new THREE.Vector3(16.0, 16.5, -14.0),
      ctrl: new THREE.Vector3(11.0, 10.5, -9.0),
      color: new THREE.Color(0xc4b5fd),
      count: 13,
    },
  ];

  const streamLinePositions: number[] = [];
  const streamLineColors: number[] = [];
  const laniGalaxyPos: number[] = [];
  const laniGalaxyCol: number[] = [];
  const gaGold = new THREE.Color(0xfde68a);
  const lTmp = new THREE.Color();

  for (const branch of laniakeaBranches) {
    for (let sIdx = 0; sIdx < branch.count; sIdx++) {
      const jitter = new THREE.Vector3(
        (laniRand() - 0.5) * 14,
        (laniRand() - 0.5) * 11,
        (laniRand() - 0.5) * 14
      );
      const startPt = branch.tip.clone().add(jitter);
      const midPt = branch.ctrl
        .clone()
        .add(jitter.clone().multiplyScalar(0.55));
      const curve = new THREE.QuadraticBezierCurve3(startPt, midPt, gaCorePos);
      const segs = 22;
      const pts = curve.getPoints(segs);

      for (let k = 0; k < segs; k++) {
        const a = pts[k];
        const b = pts[k + 1];
        const t = k / segs;
        lTmp.copy(branch.color).lerp(gaGold, Math.pow(t, 1.8));
        streamLinePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        streamLineColors.push(
          lTmp.r,
          lTmp.g,
          lTmp.b,
          lTmp.r,
          lTmp.g,
          lTmp.b
        );
      }

      // 各流線に沿って銀河パーティクルを配置
      const starsOnLine = 56;
      for (let p = 0; p < starsOnLine; p++) {
        const t = Math.pow(laniRand(), 0.85);
        const pt = curve.getPoint(t);
        const spread = THREE.MathUtils.lerp(2.4, 0.75, t);
        laniGalaxyPos.push(
          pt.x + (laniRand() - 0.5) * spread,
          pt.y + (laniRand() - 0.5) * spread,
          pt.z + (laniRand() - 0.5) * spread
        );
        lTmp
          .copy(branch.color)
          .lerp(gaGold, Math.pow(t, 1.5))
          .multiplyScalar(0.68 + laniRand() * 0.32);
        laniGalaxyCol.push(lTmp.r, lTmp.g, lTmp.b);
      }
    }
  }

  // シャプレー超銀河団とペルセウス・うお座超銀河団の隣接銀河群も淡く添えます
  for (const [nbPos, nbHex, nbCount] of [
    [shapleyPos, 0xf472b6, 260],
    [perseusPos, 0x818cf8, 220],
  ] as Array<[THREE.Vector3, number, number]>) {
    const nbCol = new THREE.Color(nbHex);
    for (let i = 0; i < nbCount; i++) {
      const r = Math.pow(laniRand(), 1.3) * 6.5;
      const th = laniRand() * Math.PI * 2;
      const ph = Math.acos(2 * laniRand() - 1);
      laniGalaxyPos.push(
        nbPos.x + r * Math.sin(ph) * Math.cos(th),
        nbPos.y + r * Math.cos(ph) * 0.75,
        nbPos.z + r * Math.sin(ph) * Math.sin(th)
      );
      const br = 0.58 + laniRand() * 0.38;
      laniGalaxyCol.push(nbCol.r * br, nbCol.g * br, nbCol.b * br);
    }
  }

  const streamGeo = new THREE.BufferGeometry();
  streamGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(streamLinePositions, 3)
  );
  streamGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(streamLineColors, 3)
  );
  const streamMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage5Group.add(new THREE.LineSegments(streamGeo, streamMat));
  allGeos.push(streamGeo);
  allMats.push(streamMat);
  stage5Mats.push({ mat: streamMat, baseOpacity: 0.34 });

  const laniPtsGeo = new THREE.BufferGeometry();
  laniPtsGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(laniGalaxyPos, 3)
  );
  laniPtsGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(laniGalaxyCol, 3)
  );
  const laniPtsMat = new THREE.PointsMaterial({
    size: 1.55,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage5Group.add(new THREE.Points(laniPtsGeo, laniPtsMat));
  allGeos.push(laniPtsGeo);
  allMats.push(laniPtsMat);
  stage5Mats.push({ mat: laniPtsMat, baseOpacity: 0.92 });

  // グレートアトラクター中心とおとめ座超銀河団のハイライト・スプライト
  const gaGlowMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0xfde68a,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const gaGlowSprite = new THREE.Sprite(gaGlowMat);
  gaGlowSprite.position.copy(gaCorePos);
  gaGlowSprite.scale.setScalar(13.5);
  stage5Group.add(gaGlowSprite);
  allMats.push(gaGlowMat);
  stage5Mats.push({ mat: gaGlowMat, baseOpacity: 0.92 });

  const virgoLaniGlowMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const virgoLaniGlowSprite = new THREE.Sprite(virgoLaniGlowMat);
  virgoLaniGlowSprite.position.copy(virgoSuperPos);
  virgoLaniGlowSprite.scale.setScalar(8.5);
  stage5Group.add(virgoLaniGlowSprite);
  allMats.push(virgoLaniGlowMat);
  stage5Mats.push({ mat: virgoLaniGlowMat, baseOpacity: 0.95 });

  // グレートアトラクター → シャプレー超銀河団方向の破線ガイド
  const gaShapleyGeo = new THREE.BufferGeometry().setFromPoints([
    gaCorePos.clone(),
    shapleyPos.clone(),
  ]);
  const gaShapleyMat = new THREE.LineDashedMaterial({
    color: 0xf472b6,
    dashSize: 1.4,
    gapSize: 1.0,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const gaShapleyLine = new THREE.Line(gaShapleyGeo, gaShapleyMat);
  gaShapleyLine.computeLineDistances();
  stage5Group.add(gaShapleyLine);
  allGeos.push(gaShapleyGeo);
  allMats.push(gaShapleyMat);
  stage5Mats.push({ mat: gaShapleyMat, baseOpacity: 0.5 });

  // Stage 6 タップ用ヒット球
  const createStage5Hit = (pos: THREE.Vector3, radius: number) => {
    const g = new THREE.SphereGeometry(radius, 12, 10);
    const m = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(pos);
    stage5Group.add(mesh);
    allGeos.push(g);
    allMats.push(m);
    return mesh;
  };
  const gaCoreHitMesh = createStage5Hit(gaCorePos, 7.2);
  const virgoLaniHitMesh = createStage5Hit(virgoSuperPos, 6.2);
  const laniakeaHitMesh = createStage5Hit(new THREE.Vector3(0, 0, 0), 22.0);

  // =========================================================================
  // Stage 7 (cosmicLevel = 7): 観測可能な宇宙（直径 約930億光年・コズミック・ウェブ＆CMB）
  // =========================================================================
  const stage6Group = new THREE.Group();
  root.add(stage6Group);
  const stage6Mats: Array<{ mat: THREE.Material; baseOpacity: number }> = [];

  const univRand = createSeededRandom(93000);
  const UNIVERSE_RADIUS = 34.0;
  const cmbTexture = createCmbTexture();
  allTextures.push(cmbTexture);

  // 最外殻：宇宙マイクロ波背景放射（CMB・宇宙誕生約38万年後の光の球殻）
  const cmbSphereGeo = new THREE.SphereGeometry(UNIVERSE_RADIUS, 48, 32);
  const cmbBackMat = new THREE.MeshBasicMaterial({
    map: cmbTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const cmbBackMesh = new THREE.Mesh(cmbSphereGeo, cmbBackMat);
  stage6Group.add(cmbBackMesh);

  const cmbFrontMat = new THREE.MeshBasicMaterial({
    map: cmbTexture,
    side: THREE.FrontSide,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const cmbFrontMesh = new THREE.Mesh(cmbSphereGeo, cmbFrontMat);
  stage6Group.add(cmbFrontMesh);
  allGeos.push(cmbSphereGeo);
  allMats.push(cmbBackMat, cmbFrontMat);
  stage6Mats.push({ mat: cmbBackMat, baseOpacity: 0.34 });
  stage6Mats.push({ mat: cmbFrontMat, baseOpacity: 0.14 });

  // 観測可能な宇宙の経線・赤道リング（930億光年ホライズン境界）
  for (const rot of [
    [0, 0, 0],
    [Math.PI / 2, 0, 0],
    [Math.PI / 2, Math.PI / 2, 0],
  ] as Array<[number, number, number]>) {
    const hRing = createCircleLine(UNIVERSE_RADIUS + 0.15, 0x38bdf8, 0.28, 128, false);
    hRing.line.rotation.set(rot[0], rot[1], rot[2]);
    stage6Group.add(hRing.line);
    allGeos.push(hRing.geo);
    allMats.push(hRing.mat);
    stage6Mats.push({ mat: hRing.mat, baseOpacity: 0.28 });
  }

  // 超空洞（ボイド）の中心群：銀河をほとんど置かない「泡」の空洞領域を定義します
  const featuredVoidPos = new THREE.Vector3(-13.5, 6.0, 9.5);
  const voidCenters: Array<{ pos: THREE.Vector3; radius: number }> = [
    { pos: featuredVoidPos, radius: 7.4 },
    { pos: new THREE.Vector3(14.0, -7.0, 8.0), radius: 7.0 },
    { pos: new THREE.Vector3(10.0, 12.0, -11.0), radius: 7.2 },
    { pos: new THREE.Vector3(-12.0, -11.0, -10.0), radius: 6.8 },
    { pos: new THREE.Vector3(2.0, 15.0, 10.0), radius: 6.2 },
    { pos: new THREE.Vector3(-4.0, -16.0, 8.0), radius: 6.2 },
    { pos: new THREE.Vector3(18.0, 4.0, -2.0), radius: 6.0 },
    { pos: new THREE.Vector3(-19.0, -2.0, -4.0), radius: 6.0 },
  ];

  // 代表ボイドの輪郭を淡い破線円で示して「超空洞（ボイド）」を直感的に見せます
  const voidOutline = createCircleLine(6.4, 0x94a3b8, 0.42, 64, true);
  voidOutline.line.position.copy(featuredVoidPos);
  voidOutline.line.rotation.set(Math.PI / 3, 0.4, 0.2);
  stage6Group.add(voidOutline.line);
  allGeos.push(voidOutline.geo);
  allMats.push(voidOutline.mat);
  stage6Mats.push({ mat: voidOutline.mat, baseOpacity: 0.42 });

  // 球内部にコズミック・ウェブの結節点（超銀河団ノード）とフィラメントを構築
  const webNodes: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
  let guard = 0;
  while (webNodes.length < 44 && guard < 600) {
    guard++;
    const u = univRand();
    const v = univRand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = (0.22 + Math.cbrt(univRand()) * 0.72) * (UNIVERSE_RADIUS - 3.5);
    const cand = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    const insideVoid = voidCenters.some(
      (vc) => cand.distanceTo(vc.pos) < vc.radius * 0.92
    );
    if (!insideVoid) {
      webNodes.push(cand);
    }
  }

  const webEdges: Array<[number, number]> = [];
  for (let i = 0; i < webNodes.length; i++) {
    const dists: Array<{ j: number; d: number }> = [];
    for (let j = i + 1; j < webNodes.length; j++) {
      const d = webNodes[i].distanceTo(webNodes[j]);
      if (d < 19.5) {
        dists.push({ j, d });
      }
    }
    dists.sort((a, b) => a.d - b.d);
    const maxConnect = i === 0 ? 5 : 3;
    for (let k = 0; k < Math.min(maxConnect, dists.length); k++) {
      webEdges.push([i, dists[k].j]);
    }
  }

  const webLineCoords: number[] = [];
  for (const [aIdx, bIdx] of webEdges) {
    const a = webNodes[aIdx];
    const b = webNodes[bIdx];
    webLineCoords.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const univWebLineGeo = new THREE.BufferGeometry();
  univWebLineGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(webLineCoords, 3)
  );
  const univWebLineMat = new THREE.LineBasicMaterial({
    color: 0x818cf8,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage6Group.add(new THREE.LineSegments(univWebLineGeo, univWebLineMat));
  allGeos.push(univWebLineGeo);
  allMats.push(univWebLineMat);
  stage6Mats.push({ mat: univWebLineMat, baseOpacity: 0.24 });

  // コズミック・ウェブのフィラメントに沿って約4,200個の超銀河団ポイントを分布させます
  const webPtsPos: number[] = [];
  const webPtsCol: number[] = [];
  const wColGold = new THREE.Color(0xfde68a);
  const wColViolet = new THREE.Color(0xc4b5fd);
  const wColSky = new THREE.Color(0x7dd3fc);
  const wTmp = new THREE.Color();

  for (let i = 0; i < 4200; i++) {
    const edge = webEdges[i % webEdges.length];
    const a = webNodes[edge[0]];
    const b = webNodes[edge[1]];
    const t = univRand();
    const px = THREE.MathUtils.lerp(a.x, b.x, t) + (univRand() - 0.5) * 2.9;
    const py = THREE.MathUtils.lerp(a.y, b.y, t) + (univRand() - 0.5) * 2.9;
    const pz = THREE.MathUtils.lerp(a.z, b.z, t) + (univRand() - 0.5) * 2.9;
    const distFromOrigin = Math.hypot(px, py, pz);
    if (distFromOrigin > UNIVERSE_RADIUS - 1.4) continue;
    webPtsPos.push(px, py, pz);

    const radialRatio = distFromOrigin / UNIVERSE_RADIUS;
    if (radialRatio < 0.35) {
      wTmp.copy(wColSky).lerp(wColGold, univRand() * 0.55);
    } else if (radialRatio < 0.72) {
      wTmp.copy(wColViolet).lerp(wColSky, univRand() * 0.5);
    } else {
      // 遠方（初期宇宙寄り）は赤方偏移をイメージした暖色・紫系へ
      wTmp.copy(wColViolet).lerp(wColGold, 0.35 + univRand() * 0.45);
    }
    wTmp.multiplyScalar(0.62 + univRand() * 0.38);
    webPtsCol.push(wTmp.r, wTmp.g, wTmp.b);
  }

  const webPtsGeo = new THREE.BufferGeometry();
  webPtsGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(webPtsPos, 3)
  );
  webPtsGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(webPtsCol, 3)
  );
  const webPtsMat = new THREE.PointsMaterial({
    size: 1.35,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  stage6Group.add(new THREE.Points(webPtsGeo, webPtsMat));
  allGeos.push(webPtsGeo);
  allMats.push(webPtsMat);
  stage6Mats.push({ mat: webPtsMat, baseOpacity: 0.9 });

  // 中心（私たちの位置：ラニアケア超銀河団）の輝く点
  const univCenterMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.98,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const univCenterSprite = new THREE.Sprite(univCenterMat);
  univCenterSprite.scale.setScalar(6.5);
  stage6Group.add(univCenterSprite);
  allMats.push(univCenterMat);
  stage6Mats.push({ mat: univCenterMat, baseOpacity: 0.98 });

  // Stage 7 タップ用ヒット球（中心のラニアケア＋観測可能な宇宙全体）
  const univCenterHitGeo = new THREE.SphereGeometry(4.2, 12, 10);
  const univCenterHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const univCenterHitMesh = new THREE.Mesh(univCenterHitGeo, univCenterHitMat);
  stage6Group.add(univCenterHitMesh);
  allGeos.push(univCenterHitGeo);
  allMats.push(univCenterHitMat);

  const univHitGeo = new THREE.SphereGeometry(UNIVERSE_RADIUS, 16, 12);
  const univHitMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const univHitMesh = new THREE.Mesh(univHitGeo, univHitMat);
  stage6Group.add(univHitMesh);
  allGeos.push(univHitGeo);
  allMats.push(univHitMat);

  // 各ステージのフェード重み（cosmicLevel = 1〜7 の周辺で滑らかに重なるテント関数）
  const stageWeight = (level: number, center: number): number => {
    const d = Math.abs(level - center);
    if (d >= 0.92) return 0;
    const t = 1 - d / 0.92;
    return t * t * (3 - 2 * t);
  };

  const pointBaseSizeMap = new WeakMap<THREE.PointsMaterial, number>();
  // 各コズミック・ステージ（1〜7）の標準カメラ距離（App.tsx の PRESET_POSES と一致）
  const STAGE_TARGET_DIST = [0, 90, 62, 66, 80, 100, 98, 116];

  const applyStageFade = (
    group: THREE.Group,
    mats: Array<{ mat: THREE.Material; baseOpacity: number }>,
    weight: number,
    scaleFactor: number
  ) => {
    group.visible = weight > 0.01;
    if (!group.visible) return;
    group.scale.setScalar(scaleFactor);
    for (const item of mats) {
      if (item.baseOpacity > 0) {
        (item.mat as THREE.Material & { opacity: number }).opacity =
          item.baseOpacity * weight;
      }
      if (item.mat instanceof THREE.PointsMaterial) {
        let baseSize = pointBaseSizeMap.get(item.mat);
        if (baseSize === undefined) {
          baseSize = item.mat.size;
          pointBaseSizeMap.set(item.mat, baseSize);
        }
        item.mat.size = baseSize * THREE.MathUtils.clamp(scaleFactor, 0.35, 36.0);
      }
    }
  };

  const tmpSolarWorld = new THREE.Vector3();
  const tmpPairMid = new THREE.Vector3();
  const tmpVirgoMid = new THREE.Vector3();

  return {
    root,
    update(
      cosmicLevel: number,
      totalTimeSec: number,
      cameraDistance: number,
      isTransitioning: boolean,
      fromStage: number,
      fromDistance: number
    ) {
      root.visible = cosmicLevel > 0.08;
      if (!root.visible) return;

      // 銀河・大規模構造の緩やかな回転演出
      mwHero.group.rotation.y = totalTimeSec * 0.035;
      mwPair.group.rotation.y = 0.2 + totalTimeSec * 0.03;
      andromedaPair.group.rotation.y = -0.35 - totalTimeSec * 0.025;
      mwLocal.group.rotation.y = 0.2 + totalTimeSec * 0.028;
      andromedaLocal.group.rotation.y = -0.34 - totalTimeSec * 0.022;
      triangulumLocal.group.rotation.y = 0.3 + totalTimeSec * 0.032;
      stage5Group.rotation.y = totalTimeSec * 0.012;
      stage6Group.rotation.y = totalTimeSec * 0.01;

      // トランジション中のカメラ距離変化（例：リアル太陽系 1320 → 近傍恒星 90）を光学的に相殺し、
      // 太陽系→近傍恒星→天の川→…→観測可能な宇宙へ向かう動きが常に滑らかな「ズームアウト」になるよう計算します。
      const stageConfigs: Array<{
        stageNum: number;
        group: THREE.Group;
        mats: Array<{ mat: THREE.Material; baseOpacity: number }>;
        zoomBase: number;
      }> = [
        { stageNum: 1, group: stageNearbyGroup, mats: stageNearbyMats, zoomBase: 0.16 },
        { stageNum: 2, group: stage1Group, mats: stage1Mats, zoomBase: 0.18 },
        { stageNum: 3, group: stage2Group, mats: stage2Mats, zoomBase: 0.22 },
        { stageNum: 4, group: stage3Group, mats: stage3Mats, zoomBase: 0.22 },
        { stageNum: 5, group: stage4Group, mats: stage4Mats, zoomBase: 0.24 },
        { stageNum: 6, group: stage5Group, mats: stage5Mats, zoomBase: 0.24 },
        { stageNum: 7, group: stage6Group, mats: stage6Mats, zoomBase: 0.26 },
      ];

      for (const cfg of stageConfigs) {
        const w = stageWeight(cosmicLevel, cfg.stageNum);
        const apparentScale = THREE.MathUtils.clamp(
          Math.pow(cfg.zoomBase, cosmicLevel - cfg.stageNum),
          0.08,
          5.2
        );
        const refDist =
          isTransitioning && fromStage === cfg.stageNum && fromDistance > 1
            ? fromDistance
            : STAGE_TARGET_DIST[cfg.stageNum];
        const distComp = isTransitioning
          ? Math.max(0.25, cameraDistance / Math.max(10, refDist))
          : 1.0;
        applyStageFade(cfg.group, cfg.mats, w, apparentScale * distComp);
      }

      root.updateMatrixWorld(true);
    },

    getBadgeWorldPositions(cosmicLevel: number) {
      const results: Array<{
        id: CosmicBadgeId;
        position: THREE.Vector3;
        visible: boolean;
      }> = [];
      const activeStage = Math.round(cosmicLevel);
      const nearStage =
        cosmicLevel >= 0.85 && Math.abs(cosmicLevel - activeStage) < 0.14;

      solarAnchor.getWorldPosition(tmpSolarWorld);
      tmpPairMid
        .copy(mwPair.group.position)
        .lerp(andromedaPair.group.position, 0.5)
        .add(new THREE.Vector3(0, 2.4, 0));
      tmpVirgoMid
        .copy(localGroupNodePos)
        .lerp(virgoCenter, 0.5)
        .add(new THREE.Vector3(0, 3.0, 0));

      const addStagePos = (
        id: CosmicBadgeId,
        group: THREE.Group,
        localPos: THREE.Vector3,
        visible: boolean
      ) => {
        const worldPos = localPos.clone();
        group.localToWorld(worldPos);
        results.push({ id, position: worldPos, visible });
      };

      if (nearStage && activeStage === 1) {
        addStagePos("nearbySun", stageNearbyGroup, new THREE.Vector3(0, 2.2, 0), true);
        addStagePos("nearbyRing10", stageNearbyGroup, new THREE.Vector3(r10, 0.6, 0), true);
        addStagePos("nearbyRing100", stageNearbyGroup, new THREE.Vector3(r100, 0.6, 0), true);
        addStagePos("nearbyRing1000", stageNearbyGroup, new THREE.Vector3(r1000, 0.6, 0), true);

        const nearbyLabelPairs: Array<[CosmicBadgeId, FeaturedStarId]> = [
          ["nearbyAlphaCen", "alphaCentauri"],
          ["nearbySirius", "sirius"],
          ["nearbyProcyon", "procyon"],
          ["nearbyAltair", "altair"],
          ["nearbyVega", "vega"],
          ["nearbyArcturus", "arcturus"],
          ["nearbyCapella", "capella"],
          ["nearbySpica", "spica"],
          ["nearbyBetelgeuse", "betelgeuse"],
          ["nearbyRigel", "rigel"],
          ["nearbyDeneb", "deneb"],
        ];
        for (const [badgeId, starId] of nearbyLabelPairs) {
          const sp = nearbyStarPosMap.get(starId);
          if (sp) {
            // 画面上端付近になりやすいデネブは星の下側にラベルを置いて見切れを防ぎます。
            const yOff = starId === "deneb" ? -2.4 : 2.0;
            addStagePos(
              badgeId,
              stageNearbyGroup,
              sp.clone().add(new THREE.Vector3(0, yOff, 0)),
              true
            );
          }
        }
      } else if (nearStage && activeStage === 2) {
        addStagePos("milkyWay", stage1Group, new THREE.Vector3(0, 5.5, -18), true);
        results.push({
          id: "solarSystemInGalaxy",
          position: tmpSolarWorld.clone().add(new THREE.Vector3(0, 2.2, 0)),
          visible: true,
        });
        addStagePos("galacticCenter", stage1Group, new THREE.Vector3(0, 2.6, 0), true);
      } else if (nearStage && activeStage === 3) {
        addStagePos(
          "milkyWay",
          stage2Group,
          mwPair.group.position.clone().add(new THREE.Vector3(0, 5.2, 0)),
          true
        );
        addStagePos(
          "magellanicClouds",
          stage2Group,
          magellanicPair.group.position
            .clone()
            .add(new THREE.Vector3(0, -2.5, 0)),
          true
        );
        addStagePos(
          "andromeda",
          stage2Group,
          andromedaPair.group.position
            .clone()
            .add(new THREE.Vector3(0, 7.2, 0)),
          true
        );
        addStagePos("distancePair", stage2Group, tmpPairMid, true);
      } else if (nearStage && activeStage === 4) {
        addStagePos("localGroup", stage3Group, new THREE.Vector3(0, 23, 0), true);
        addStagePos(
          "milkyWay",
          stage3Group,
          mwLocal.group.position.clone().add(new THREE.Vector3(0, 4.4, 0)),
          true
        );
        addStagePos(
          "magellanicClouds",
          stage3Group,
          magellanicLocal.group.position
            .clone()
            .add(new THREE.Vector3(0, -2.6, 0)),
          true
        );
        addStagePos(
          "andromeda",
          stage3Group,
          andromedaLocal.group.position
            .clone()
            .add(new THREE.Vector3(0, 5.8, 0)),
          true
        );
        addStagePos(
          "triangulum",
          stage3Group,
          triangulumLocal.group.position
            .clone()
            .add(new THREE.Vector3(0, 3.6, 0)),
          true
        );
      } else if (nearStage && activeStage === 5) {
        addStagePos("virgoCluster", stage4Group, new THREE.Vector3(0, 12.5, 0), true);
        addStagePos(
          "localGroup",
          stage4Group,
          localGroupNodePos.clone().add(new THREE.Vector3(0, 5.8, 0)),
          true
        );
        addStagePos(
          "greatAttractor",
          stage4Group,
          greatAttractorPos.clone().add(new THREE.Vector3(0, 5.0, 0)),
          true
        );
        addStagePos(
          "comaCluster",
          stage4Group,
          comaClusterPos.clone().add(new THREE.Vector3(0, 4.5, 0)),
          true
        );
        addStagePos(
          "fornaxCluster",
          stage4Group,
          fornaxClusterPos.clone().add(new THREE.Vector3(0, -4.5, 0)),
          true
        );
        addStagePos("distanceVirgo", stage4Group, tmpVirgoMid, true);
      } else if (nearStage && activeStage === 6) {
        addStagePos("laniakea", stage5Group, new THREE.Vector3(0, 24.5, 0), true);
        addStagePos(
          "greatAttractorCore",
          stage5Group,
          gaCorePos.clone().add(new THREE.Vector3(0, 4.8, 0)),
          true
        );
        addStagePos(
          "virgoSuperclusterNode",
          stage5Group,
          virgoSuperPos.clone().add(new THREE.Vector3(0, -5.2, 0)),
          true
        );
        addStagePos(
          "shapleySupercluster",
          stage5Group,
          shapleyPos.clone().add(new THREE.Vector3(-2.0, 4.5, 0)),
          true
        );
        addStagePos(
          "perseusPisces",
          stage5Group,
          perseusPos.clone().add(new THREE.Vector3(-2.0, 3.8, 0)),
          true
        );
      } else if (nearStage && activeStage === 7) {
        addStagePos(
          "observableUniverse",
          stage6Group,
          new THREE.Vector3(0, UNIVERSE_RADIUS - 3.0, 0),
          true
        );
        addStagePos(
          "cmbHorizon",
          stage6Group,
          new THREE.Vector3(-17.0, -21.0, 15.0),
          true
        );
        addStagePos(
          "cosmicVoid",
          stage6Group,
          featuredVoidPos.clone().add(new THREE.Vector3(0, 5.2, 0)),
          true
        );
        addStagePos(
          "cosmicWeb",
          stage6Group,
          new THREE.Vector3(14.0, 11.5, 8.0),
          true
        );
        addStagePos(
          "ourPositionInUniverse",
          stage6Group,
          new THREE.Vector3(0, -4.5, 0),
          true
        );
      }

      return results;
    },

    getPickCandidates(cosmicLevel: number) {
      const stage = Math.round(cosmicLevel);
      if (cosmicLevel < 0.55) return [];
      if (stage === 1) {
        return nearbyStarHitList;
      }
      if (stage === 2) {
        return [
          { id: "sun", mesh: solarDotMesh },
          { id: "milkyWay", mesh: mwHero.hitMesh },
        ];
      }
      if (stage === 3) {
        return [
          { id: "milkyWay", mesh: mwPair.hitMesh },
          { id: "magellanicClouds", mesh: magellanicPair.hitMesh },
          { id: "andromeda", mesh: andromedaPair.hitMesh },
        ];
      }
      if (stage === 4) {
        return [
          { id: "milkyWay", mesh: mwLocal.hitMesh },
          { id: "magellanicClouds", mesh: magellanicLocal.hitMesh },
          { id: "andromeda", mesh: andromedaLocal.hitMesh },
          { id: "triangulum", mesh: triangulumLocal.hitMesh },
          { id: "localGroup", mesh: lgHitMesh },
        ];
      }
      if (stage === 5) {
        return [
          { id: "virgoCluster", mesh: virgoHitMesh },
          { id: "localGroup", mesh: lgClusterHitMesh },
          { id: "fornaxCluster", mesh: fornaxHitMesh },
          { id: "comaCluster", mesh: comaHitMesh },
          { id: "greatAttractor", mesh: gaStage4HitMesh },
        ];
      }
      if (stage === 6) {
        return [
          { id: "greatAttractor", mesh: gaCoreHitMesh },
          { id: "virgoCluster", mesh: virgoLaniHitMesh },
          { id: "laniakea", mesh: laniakeaHitMesh },
        ];
      }
      return [
        { id: "laniakea", mesh: univCenterHitMesh },
        { id: "observableUniverse", mesh: univHitMesh },
      ];
    },

    getFocusWorldPosAndRadius(
      bodyId: CelestialBodyId,
      cosmicLevel: number,
      outPos: THREE.Vector3
    ): number | null {
      const stage = Math.round(cosmicLevel);
      if (stage === 1 && cosmicLevel >= 0.55) {
        if (bodyId === "sun") {
          outPos.set(0, 0, 0);
          stageNearbyGroup.localToWorld(outPos);
          return 2.6;
        }
        const featured = FEATURED_STAR_MAP[bodyId as FeaturedStarId];
        if (featured) {
          const sp = nearbyStarPosMap.get(featured.id);
          if (sp) {
            outPos.copy(sp);
            stageNearbyGroup.localToWorld(outPos);
            return 2.8;
          }
        }
      }
      if (bodyId === "sun" && cosmicLevel >= 1.55) {
        solarAnchor.getWorldPosition(outPos);
        return 3.0;
      }
      if (bodyId === "milkyWay") {
        if (stage === 2) {
          mwHero.group.getWorldPosition(outPos);
          return 17.5;
        }
        if (stage === 3) {
          mwPair.group.getWorldPosition(outPos);
          return 7.8;
        }
        mwLocal.group.getWorldPosition(outPos);
        return 5.6;
      }
      if (bodyId === "andromeda") {
        if (stage === 3) {
          andromedaPair.group.getWorldPosition(outPos);
          return 11.0;
        }
        andromedaLocal.group.getWorldPosition(outPos);
        return 7.6;
      }
      if (bodyId === "triangulum") {
        triangulumLocal.group.getWorldPosition(outPos);
        return 4.4;
      }
      if (bodyId === "magellanicClouds") {
        if (stage === 3) {
          magellanicPair.group.getWorldPosition(outPos);
          return 3.2;
        }
        magellanicLocal.group.getWorldPosition(outPos);
        return 2.4;
      }
      if (bodyId === "localGroup") {
        if (stage >= 5) {
          outPos.copy(localGroupNodePos);
          stage4Group.localToWorld(outPos);
          return 8.0;
        }
        outPos.set(0, 0, 0);
        stage3Group.localToWorld(outPos);
        return 22.0;
      }
      if (bodyId === "virgoCluster") {
        if (stage === 6) {
          outPos.copy(virgoSuperPos);
          stage5Group.localToWorld(outPos);
          return 9.5;
        }
        outPos.copy(virgoCenter);
        stage4Group.localToWorld(outPos);
        return 17.5;
      }
      if (bodyId === "fornaxCluster") {
        outPos.copy(fornaxClusterPos);
        stage4Group.localToWorld(outPos);
        return 9.0;
      }
      if (bodyId === "comaCluster") {
        outPos.copy(comaClusterPos);
        stage4Group.localToWorld(outPos);
        return 9.5;
      }
      if (bodyId === "greatAttractor") {
        if (stage === 6) {
          outPos.copy(gaCorePos);
          stage5Group.localToWorld(outPos);
          return 11.0;
        }
        outPos.copy(greatAttractorPos);
        stage4Group.localToWorld(outPos);
        return 9.5;
      }
      if (bodyId === "laniakea") {
        if (stage >= 7) {
          outPos.set(0, 0, 0);
          stage6Group.localToWorld(outPos);
          return 9.0;
        }
        outPos.set(0, 0, 0);
        stage5Group.localToWorld(outPos);
        return 24.0;
      }
      if (bodyId === "observableUniverse") {
        outPos.set(0, 0, 0);
        stage6Group.localToWorld(outPos);
        return 28.5;
      }
      return null;
    },

    dispose() {
      for (const g of allGeos) g.dispose();
      for (const m of allMats) m.dispose();
      for (const t of allTextures) t.dispose();
    },
  };
}
