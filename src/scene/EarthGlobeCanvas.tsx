import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  City,
  DisplayLayers,
  MoonState,
  ReferenceFrame,
  SolarSystemState,
  VisualStyle,
} from "../types/astronomy";
import {
  EARTH_AXIAL_TILT_DEG,
  MOON_ORBIT_INCLINATION_DEG,
  degToRad,
  getLocalCompassVectors,
  latLonToVector3Tuple,
  observeCity,
} from "../astronomy/calculations";
import { createEarthTextures, EarthTextures } from "./earthTexture";
import { createMoonTexture } from "./moonTexture";
import {
  createAtmosphereMaterial,
  createEarthMaterial,
  createMoonMaterial,
  createSunCoronaMaterial,
  createSunMaterial,
  createTokyoGroundMaterial,
  createTokyoSkyMaterial,
} from "./shaders";

/** 3Dカメラが目標とする連続視点パラメータ */
export interface CameraPoseTarget {
  /** 基準平面に対する方位角（ラジアン） */
  yaw: number;
  /** 基準平面からの仰角（π/2 = 真上、0 = 水平真横） */
  pitch: number;
  /** 注視点からの距離 */
  distance: number;
  /** 座標基準のブレンド率（0 = 天の北極/赤道基準、1 = 黄道面基準） */
  eclipticBlend: number;
  /** 注視点のブレンド率（0 = 地球中心を注視、1 = 太陽中心を注視） */
  sunCenterBlend: number;
  /** 地上視点のブレンド率（0 = 宇宙空間カメラ、1 = 東京の地上観測カメラ） */
  groundBlend: number;
  /** 東京の地上視点で見る方位角（ラジアン：0 = 北, π/2 = 東, π = 南, -π/2 = 西） */
  groundAzimuth: number;
  /** 東京の地上視点で見上げる仰角（ラジアン：0 = 地平線, π/2 = 天頂） */
  groundElevation: number;
  /** トランジションにかける時間（秒）。プリセット移動時はゆっくり長めに設定します */
  durationSec: number;
  /** 同じ数値でもアニメーションを再適用するための連番トリガー */
  seq: number;
}

interface EarthGlobeCanvasProps {
  /** 現在の太陽・地球の姿勢状態 */
  solarState: SolarSystemState;
  /** 現在の月の位置（黄道座標）と満ち欠け状態 */
  moonState: MoonState;
  /** 表示する代表都市の配列 */
  cities: City[];
  /** 現在選択中の都市ID */
  selectedCityId: string;
  /** 都市選択時のコールバック */
  onSelectCity: (cityId: string) => void;
  /** ビジュアルモード（宇宙リアル / 天文図解） */
  visualStyle: VisualStyle;
  /** 基準座標系（太陽方向固定 / 恒星・春分点固定） */
  referenceFrame: ReferenceFrame;
  /** 目標カメラ姿勢（プリセット・連続スライダーから渡されます） */
  cameraPoseTarget: CameraPoseTarget;
  /** 手動ドラッグ時にプリセット選択表示を解除するための通知 */
  onCameraUserDrag: () => void;
  /** 3D補助レイヤーのON/OFF設定 */
  layers: DisplayLayers;
  /** 右側の観察パネルが開いているか（地球・軌道の水平センタリングを補正するため） */
  isInspectorOpen: boolean;
}

interface CameraSnapshot {
  yaw: number;
  pitch: number;
  distance: number;
  eclipticBlend: number;
  sunCenterBlend: number;
  groundBlend: number;
  groundAzimuth: number;
  groundElevation: number;
  rightAngle: number;
}

/** 公転軌道半径（地球半径 = 1.0 に対する観察用スケール） */
const ORBIT_RADIUS = 13.5;
/** 太陽の半径（地球半径 = 1.0 に対する観察用スケール） */
const SUN_RADIUS = 1.85;
/** 月の半径（実際の月/地球比 ≈ 0.273 に近い値） */
const MOON_RADIUS = 0.27;
/** 地球中心からの月の公転軌道半径（白道半径） */
const MOON_ORBIT_RADIUS = 3.45;
/** 東京の緯度・経度（地上視点の基準地点） */
const TOKYO_LAT_DEG = 35.6762;
const TOKYO_LON_DEG = 139.6503;
/** 東京の地表からの視点高さ（地球半径 1.0 基準） */
const GROUND_EYE_ALTITUDE = 0.014;

/** 東京の地上視点における8方位の地平線ラベル定義（azDeg: 北=0°, 東=90°, 南=180°, 西=270°） */
const TOKYO_COMPASS_POINTS: Array<{
  id: string;
  label: string;
  azDeg: number;
  isCardinal: boolean;
}> = [
  { id: "N", label: "北 (N)", azDeg: 0, isCardinal: true },
  { id: "NE", label: "北東", azDeg: 45, isCardinal: false },
  { id: "E", label: "東 (E)", azDeg: 90, isCardinal: true },
  { id: "SE", label: "南東", azDeg: 135, isCardinal: false },
  { id: "S", label: "南 (S)", azDeg: 180, isCardinal: true },
  { id: "SW", label: "南西", azDeg: 225, isCardinal: false },
  { id: "W", label: "西 (W)", azDeg: 270, isCardinal: true },
  { id: "NW", label: "北西", azDeg: 315, isCardinal: false },
];

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * 動き始めと着地が滑らかな 3 次イージング関数（Ease-In-Out Cubic）です。
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * 2つの角度（ラジアン）間の最短回転差（-π 〜 +π）を求めます。
 */
function shortestAngleDiff(from: number, to: number): number {
  const twoPi = Math.PI * 2;
  const diff = (((to - from) % twoPi) + twoPi) % twoPi;
  return diff > Math.PI ? diff - twoPi : diff;
}

/**
 * 太陽中心の公転軌道上に配置する 4 季節マーカー定義です。
 */
const ORBIT_SEASON_POINTS: Array<{
  id: string;
  label: string;
  position: [number, number, number];
}> = [
  { id: "vernal", label: "春分 (3月)", position: [-ORBIT_RADIUS, 0, 0] },
  { id: "summer", label: "夏至 (6月)", position: [0, 0, ORBIT_RADIUS] },
  { id: "autumnal", label: "秋分 (9月)", position: [ORBIT_RADIUS, 0, 0] },
  { id: "winter", label: "冬至 (12月)", position: [0, 0, -ORBIT_RADIUS] },
];

/**
 * 点型の柔らかな星テクスチャをキャンバスで生成します。
 */
function createStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.22, "rgba(224, 242, 254, 0.85)");
  grad.addColorStop(0.55, "rgba(148, 163, 184, 0.2)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * 緯度線（定緯度の円）の Line を生成します。
 */
function createLatitudeRing(
  latDeg: number,
  radius: number,
  segments: number,
  material: THREE.Material,
  dashed = false
): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const lonDeg = (i / segments) * 360 - 180;
    const [x, y, z] = latLonToVector3Tuple(latDeg, lonDeg, radius);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  if (dashed) {
    line.computeLineDistances();
  }
  return line;
}

/**
 * 経度線（南北の両極を結ぶ半円弧）の Line を生成します。
 */
function createLongitudeArc(
  lonDeg: number,
  radius: number,
  segments: number,
  material: THREE.Material
): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const latDeg = -90 + (i / segments) * 180;
    const [x, y, z] = latLonToVector3Tuple(latDeg, lonDeg, radius);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

/**
 * 指定された 3D 方向を向く矢印グループ（軸＋円錐ヘッド）を生成します。
 */
function createVectorArrow(
  direction: THREE.Vector3,
  length: number,
  color: number,
  opacity = 0.95
): THREE.Group {
  const group = new THREE.Group();
  const dir = direction.clone().normalize();
  const headLength = Math.min(length * 0.28, 0.065);
  const shaftLength = Math.max(0.01, length - headLength);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    dir.clone().multiplyScalar(shaftLength),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  group.add(new THREE.Line(lineGeo, lineMat));

  const coneGeo = new THREE.ConeGeometry(headLength * 0.42, headLength, 14);
  const coneMat = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.copy(dir.clone().multiplyScalar(shaftLength + headLength * 0.5));
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(cone);

  return group;
}

/**
 * XZ平面上の水平リング（Line）を生成するヘルパーです。
 */
function createHorizontalRing(
  radius: number,
  color: number,
  opacity: number,
  segments = 128
): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, -Math.sin(a) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

/**
 * 3D ワールド位置をスクリーン座標 (px) へ投影してバッジ位置を更新するヘルパーです。
 */
function updateFloatingBadgeAtPosition(
  badgeEl: HTMLSpanElement | null,
  worldPosition: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  hostW: number,
  hostH: number,
  visible: boolean,
  isInspectorOpen: boolean,
  clampToScreen: boolean
): void {
  if (!badgeEl) return;
  if (!visible) {
    badgeEl.style.display = "none";
    return;
  }

  const projected = worldPosition.clone().project(camera);
  if (projected.z > 1 || projected.z < -1) {
    badgeEl.style.display = "none";
    return;
  }

  let x = (projected.x * 0.5 + 0.5) * hostW;
  let y = (-projected.y * 0.5 + 0.5) * hostH;

  if (clampToScreen) {
    const maxX = isInspectorOpen && hostW > 860 ? hostW - 416 : hostW - 86;
    x = Math.max(60, Math.min(maxX, x));
    y = Math.max(84, Math.min(hostH - 86, y));
  } else if (x < 12 || x > hostW - 12 || y < 12 || y > hostH - 12) {
    badgeEl.style.display = "none";
    return;
  }

  badgeEl.style.display = "inline-flex";
  badgeEl.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

/**
 * Three.js を使って太陽・公転軌道・自転する3D地球儀・連続カメラ移動を描画するキャンバスです。
 * ワールド座標の原点 (0,0,0) に太陽を配置し、XZ 平面（Y = 0）を公転面（黄道面）として地球が公転します。
 */
export const EarthGlobeCanvas: React.FC<EarthGlobeCanvasProps> = ({
  solarState,
  moonState,
  cities,
  selectedCityId,
  onSelectCity,
  visualStyle,
  referenceFrame,
  cameraPoseTarget,
  onCameraUserDrag,
  layers,
  isInspectorOpen,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const labelButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const seasonBadgeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const compassBadgeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const sunBadgeRef = useRef<HTMLSpanElement | null>(null);
  const earthBadgeRef = useRef<HTMLSpanElement | null>(null);
  const moonBadgeRef = useRef<HTMLSpanElement | null>(null);
  const polarisBadgeRef = useRef<HTMLSpanElement | null>(null);
  const equinoxBadgeRef = useRef<HTMLSpanElement | null>(null);

  const latestPropsRef = useRef({
    solarState,
    moonState,
    cities,
    selectedCityId,
    visualStyle,
    referenceFrame,
    layers,
    isInspectorOpen,
  });
  latestPropsRef.current = {
    solarState,
    moonState,
    cities,
    selectedCityId,
    visualStyle,
    referenceFrame,
    layers,
    isInspectorOpen,
  };

  // カメラの現在値とアニメーション遷移管理を保持します。
  const cameraAnimRef = useRef<{
    current: CameraSnapshot;
    from: CameraSnapshot;
    to: CameraPoseTarget;
    elapsed: number;
    duration: number;
    active: boolean;
  }>({
    current: {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
      sunCenterBlend: cameraPoseTarget.sunCenterBlend,
      groundBlend: cameraPoseTarget.groundBlend,
      groundAzimuth: cameraPoseTarget.groundAzimuth,
      groundElevation: cameraPoseTarget.groundElevation,
      rightAngle:
        referenceFrame === "solar"
          ? degToRad(solarState.sunEclipticLongitudeDeg)
          : 0,
    },
    from: {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
      sunCenterBlend: cameraPoseTarget.sunCenterBlend,
      groundBlend: cameraPoseTarget.groundBlend,
      groundAzimuth: cameraPoseTarget.groundAzimuth,
      groundElevation: cameraPoseTarget.groundElevation,
      rightAngle:
        referenceFrame === "solar"
          ? degToRad(solarState.sunEclipticLongitudeDeg)
          : 0,
    },
    to: { ...cameraPoseTarget },
    elapsed: 0,
    duration: cameraPoseTarget.durationSec,
    active: false,
  });

  // 目標姿勢が更新されたら、現在位置を始点として新しい連続補間を開始します。
  useEffect(() => {
    const anim = cameraAnimRef.current;
    anim.from = { ...anim.current };
    anim.to = { ...cameraPoseTarget };
    anim.elapsed = 0;
    anim.duration = Math.max(0.15, cameraPoseTarget.durationSec);
    anim.active = true;
  }, [
    cameraPoseTarget.yaw,
    cameraPoseTarget.pitch,
    cameraPoseTarget.distance,
    cameraPoseTarget.eclipticBlend,
    cameraPoseTarget.sunCenterBlend,
    cameraPoseTarget.groundBlend,
    cameraPoseTarget.groundAzimuth,
    cameraPoseTarget.groundElevation,
    cameraPoseTarget.durationSec,
    cameraPoseTarget.seq,
  ]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // 太陽中心ビューで遠くから軌道全体を見るため、far クリップ面を 420 まで広げます。
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 420);

    // 1. テクスチャとシェーダーの構築
    const textures: EarthTextures = createEarthTextures(
      renderer.capabilities.maxTextureSize
    );
    const moonTexture = createMoonTexture();
    const starTexture = createStarSpriteTexture();

    const earthBundle = createEarthMaterial(
      textures.realisticMap,
      textures.maskMap
    );
    const atmosphereBundle = createAtmosphereMaterial();
    const moonBundle = createMoonMaterial(moonTexture);
    const sunBundle = createSunMaterial();
    const sunCoronaMaterial = createSunCoronaMaterial();
    const tokyoSkyBundle = createTokyoSkyMaterial();
    const tokyoGroundBundle = createTokyoGroundMaterial();

    // 2. 遠方星空（太陽中心ビュー時でも常に外側に位置するよう半径 110〜210 に配置）
    const starsGroup = new THREE.Group();
    scene.add(starsGroup);

    const tiltAngleRad = degToRad(EARTH_AXIAL_TILT_DEG);
    // ワールド座標での天の北極方向ベクトル (0, cos ε, -sin ε)
    const celestialNorthWorld = new THREE.Vector3(
      0,
      Math.cos(tiltAngleRad),
      -Math.sin(tiltAngleRad)
    ).normalize();

    const starCount = 2400;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    // 先頭の1星は天の北極方向（北極星・ポラリス）へ正確に配置します。
    starPositions[0] = celestialNorthWorld.x * 165;
    starPositions[1] = celestialNorthWorld.y * 165;
    starPositions[2] = celestialNorthWorld.z * 165;
    starColors[0] = 1.0;
    starColors[1] = 0.97;
    starColors[2] = 0.88;

    for (let i = 1; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 115 + Math.random() * 95;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tintPick = Math.random();
      const brightness = 0.55 + Math.random() * 0.45;
      if (tintPick < 0.25) {
        starColors[i * 3] = 0.72 * brightness;
        starColors[i * 3 + 1] = 0.86 * brightness;
        starColors[i * 3 + 2] = 1.0 * brightness;
      } else if (tintPick < 0.8) {
        starColors[i * 3] = 0.94 * brightness;
        starColors[i * 3 + 1] = 0.96 * brightness;
        starColors[i * 3 + 2] = 1.0 * brightness;
      } else {
        starColors[i * 3] = 1.0 * brightness;
        starColors[i * 3 + 1] = 0.85 * brightness;
        starColors[i * 3 + 2] = 0.68 * brightness;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.55,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    starPoints.renderOrder = 0;
    starsGroup.add(starPoints);

    // 東京の地上視点で見上げる大気スカイドーム（星 115〜210 の手前・太陽 75 と月 55 の奥に配置）
    const tokyoSkyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(95, 48, 32),
      tokyoSkyBundle.material
    );
    tokyoSkyMesh.renderOrder = 1;
    tokyoSkyMesh.visible = false;
    scene.add(tokyoSkyMesh);

    // 3. 太陽（ワールド原点 (0,0,0)）と公転軌道リング（Y = 0 の黄道面上）
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS, 48, 32),
      sunBundle.material
    );
    scene.add(sunMesh);

    const sunCoronaMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.48, 48, 32),
      sunCoronaMaterial
    );
    sunCoronaMesh.renderOrder = 2;
    scene.add(sunCoronaMesh);

    const orbitGuideGroup = new THREE.Group();
    scene.add(orbitGuideGroup);
    orbitGuideGroup.add(createHorizontalRing(ORBIT_RADIUS, 0xf59e0b, 0.36, 256));
    orbitGuideGroup.add(
      createHorizontalRing(ORBIT_RADIUS + 0.12, 0xfbbf24, 0.14, 256)
    );

    // 公転軌道上の 4 季節点（春分・夏至・秋分・冬至）に小さな目印を配置
    const seasonMarkerObjects = new Map<string, THREE.Object3D>();
    for (const sp of ORBIT_SEASON_POINTS) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      dot.position.set(...sp.position);
      orbitGuideGroup.add(dot);
      seasonMarkerObjects.set(sp.id, dot);
    }

    // 太陽と地球を結ぶ細い動径ライン（公転の角度が見やすくなります）
    const sunEarthLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-ORBIT_RADIUS, 0, 0),
    ]);
    const sunEarthLine = new THREE.Line(
      sunEarthLineGeo,
      new THREE.LineBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.28,
      })
    );
    scene.add(sunEarthLine);

    // 4. 地球システム（公転位置へ毎フレーム移動させるルート）
    const earthSystemGroup = new THREE.Group();
    scene.add(earthSystemGroup);

    // 地球周りのローカル黄道面ガイド（常に黄道面 Y = 0 と平行）
    const eclipticLocalGroup = new THREE.Group();
    earthSystemGroup.add(eclipticLocalGroup);
    eclipticLocalGroup.add(createHorizontalRing(1.44, 0xf59e0b, 0.36, 128));
    eclipticLocalGroup.add(createHorizontalRing(1.52, 0xfbbf24, 0.16, 128));

    const eclipticTicks: number[] = [];
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const rIn = deg % 90 === 0 ? 1.39 : 1.44;
      const rOut = 1.52;
      eclipticTicks.push(
        Math.cos(rad) * rIn,
        0,
        -Math.sin(rad) * rIn,
        Math.cos(rad) * rOut,
        0,
        -Math.sin(rad) * rOut
      );
    }
    const eclipticTickGeo = new THREE.BufferGeometry();
    eclipticTickGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(eclipticTicks, 3)
    );
    eclipticLocalGroup.add(
      new THREE.LineSegments(
        eclipticTickGeo,
        new THREE.LineBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.36,
        })
      )
    );

    // 地球側の太陽光線矢印3本（常に地球中心から太陽中心方向へ向けて平行光線を表現）
    const sunGuideGroup = new THREE.Group();
    earthSystemGroup.add(sunGuideGroup);

    const sunBeamRoot = new THREE.Group();
    sunGuideGroup.add(sunBeamRoot);

    const beamOffsets: Array<[number, number]> = [
      [0, 0],
      [0.28, 0],
      [-0.28, 0],
    ];
    for (const [ox, oy] of beamOffsets) {
      const arrow = createVectorArrow(
        new THREE.Vector3(0, 0, -1),
        0.42,
        0xfbbf24,
        ox === 0 ? 0.96 : 0.68
      );
      arrow.position.set(ox, oy, 1.82);
      sunBeamRoot.add(arrow);
    }

    const sunDirectionAnchor = new THREE.Object3D();
    sunDirectionAnchor.position.set(0, 0, 1.9);
    sunBeamRoot.add(sunDirectionAnchor);

    // 4.5 月システム（地球中心の黄道座標上で、黄道面に対して約5.145°傾いた白道上を公転）
    const moonSystemGroup = new THREE.Group();
    earthSystemGroup.add(moonSystemGroup);

    // 白道の昇交点方向（黄経 Ω）へ回転させ、その先に軌道傾斜角 +5.145° を与えたリングを配置します。
    const moonNodeGroup = new THREE.Group();
    moonSystemGroup.add(moonNodeGroup);

    const moonPlaneGroup = new THREE.Group();
    moonPlaneGroup.rotation.x = degToRad(MOON_ORBIT_INCLINATION_DEG);
    moonNodeGroup.add(moonPlaneGroup);
    moonPlaneGroup.add(
      createHorizontalRing(MOON_ORBIT_RADIUS, 0xcbd5e1, 0.56, 160)
    );
    moonPlaneGroup.add(
      createHorizontalRing(MOON_ORBIT_RADIUS + 0.05, 0x94a3b8, 0.2, 160)
    );

    // 昇交点（白道が黄道面を南から北へ横切る点）の小さな目印
    const ascendingNodeDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0 })
    );
    ascendingNodeDot.position.set(MOON_ORBIT_RADIUS, 0, 0);
    moonNodeGroup.add(ascendingNodeDot);

    // 月観察時に黄道面 (Y = 0) と白道 (約5.1°傾き) の角度差を比べやすくする淡いオレンジの基準リング
    const moonEclipticRefRing = createHorizontalRing(
      MOON_ORBIT_RADIUS,
      0xf59e0b,
      0.24,
      160
    );
    moonSystemGroup.add(moonEclipticRefRing);

    // 月本体メッシュ（常に地球へ表側を向ける潮汐ロック自転を行います）
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(MOON_RADIUS, 48, 32),
      moonBundle.material
    );
    moonSystemGroup.add(moonMesh);

    // 地球と月を結ぶ細い動径ライン（公転位置と位相角が読み取りやすくなります）
    const earthMoonLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(MOON_ORBIT_RADIUS, 0, 0),
    ]);
    const earthMoonLine = new THREE.Line(
      earthMoonLineGeo,
      new THREE.LineBasicMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.3,
      })
    );
    moonSystemGroup.add(earthMoonLine);

    // 5. 地軸の傾きグループ（黄道面 Y = 0 に対して +X 軸周りに -23.439° 傾けた赤道座標系）
    const earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.x = -tiltAngleRad;
    earthSystemGroup.add(earthTiltGroup);

    // 春分点方向（赤道面上・+X軸）の基準ライン
    const equinoxGroup = new THREE.Group();
    earthTiltGroup.add(equinoxGroup);

    const equinoxLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.36, 0, 0),
      new THREE.Vector3(1.85, 0, 0),
    ]);
    const equinoxLineMat = new THREE.LineDashedMaterial({
      color: 0xc084fc,
      dashSize: 0.06,
      gapSize: 0.035,
      transparent: true,
      opacity: 0.86,
    });
    const equinoxLine = new THREE.Line(equinoxLineGeo, equinoxLineMat);
    equinoxLine.computeLineDistances();
    equinoxGroup.add(equinoxLine);

    const equinoxMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xd8b4fe })
    );
    equinoxMarker.position.set(1.88, 0, 0);
    equinoxGroup.add(equinoxMarker);

    // 天球目盛りリングと反時計回り（自転方向）の矢印（赤道面上）
    const celestialCompassGroup = new THREE.Group();
    earthTiltGroup.add(celestialCompassGroup);

    celestialCompassGroup.add(createHorizontalRing(1.24, 0x38bdf8, 0.24));
    celestialCompassGroup.add(createHorizontalRing(1.33, 0x94a3b8, 0.18));

    const tickPositions: number[] = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const rIn = deg % 90 === 0 ? 1.21 : 1.24;
      const rOut = deg % 90 === 0 ? 1.35 : 1.31;
      tickPositions.push(
        Math.cos(rad) * rIn,
        0,
        -Math.sin(rad) * rIn,
        Math.cos(rad) * rOut,
        0,
        -Math.sin(rad) * rOut
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(tickPositions, 3)
    );
    celestialCompassGroup.add(
      new THREE.LineSegments(
        tickGeo,
        new THREE.LineBasicMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.36,
        })
      )
    );

    const addRotationArc = (startDeg: number, endDeg: number) => {
      const r = 1.15;
      const y = 0.02;
      const pts: THREE.Vector3[] = [];
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const a = ((startDeg + ((endDeg - startDeg) * i) / steps) * Math.PI) / 180;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r));
      }
      celestialCompassGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.88,
          })
        )
      );

      const endRad = (endDeg * Math.PI) / 180;
      const tipPos = new THREE.Vector3(Math.cos(endRad) * r, y, -Math.sin(endRad) * r);
      const tangent = new THREE.Vector3(-Math.sin(endRad), 0, -Math.cos(endRad)).normalize();
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.064, 14),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      cone.position.copy(tipPos);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      celestialCompassGroup.add(cone);
    };
    addRotationArc(22, 68);
    addRotationArc(202, 248);

    // 6. 地球本体グループ（earthGroup.rotation.y = GMST で自転）
    const earthGroup = new THREE.Group();
    earthTiltGroup.add(earthGroup);

    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 144, 72),
      earthBundle.material
    );
    earthGroup.add(earthMesh);

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 72, 36),
      atmosphereBundle.material
    );
    earthGroup.add(atmosphereMesh);

    // 経緯線・北極圏・地軸
    const graticuleGroup = new THREE.Group();
    earthGroup.add(graticuleGroup);

    const minorLineMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.16,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.42,
    });
    const arcticCircleMat = new THREE.LineDashedMaterial({
      color: 0x7dd3fc,
      dashSize: 0.045,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.85,
    });
    const primeMeridianMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.6,
    });

    for (const lat of [-60, -30, 30, 60]) {
      graticuleGroup.add(createLatitudeRing(lat, 1.003, 96, minorLineMat));
    }
    graticuleGroup.add(createLatitudeRing(0, 1.0035, 128, equatorMat));
    graticuleGroup.add(
      createLatitudeRing(66.5607, 1.004, 128, arcticCircleMat, true)
    );

    for (let lon = -150; lon <= 180; lon += 30) {
      graticuleGroup.add(
        createLongitudeArc(
          lon,
          lon === 0 ? 1.004 : 1.003,
          64,
          lon === 0 ? primeMeridianMat : minorLineMat
        )
      );
    }

    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.18, 0),
      new THREE.Vector3(0, 1.22, 0),
    ]);
    graticuleGroup.add(
      new THREE.Line(
        axisGeo,
        new THREE.LineBasicMaterial({
          color: 0xe2e8f0,
          transparent: true,
          opacity: 0.85,
        })
      )
    );
    const poleCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xbae6fd })
    );
    poleCrown.position.set(0, 1.22, 0);
    graticuleGroup.add(poleCrown);

    const southCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    southCrown.position.set(0, -1.18, 0);
    graticuleGroup.add(southCrown);

    const poleRing = new THREE.Mesh(
      new THREE.RingGeometry(0.024, 0.032, 24),
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    );
    poleRing.position.set(0, 1.015, 0);
    poleRing.rotation.x = -Math.PI / 2;
    graticuleGroup.add(poleRing);

    // 7. 都市3Dマーカーと選択都市の方位矢印
    const citiesGroup = new THREE.Group();
    earthGroup.add(citiesGroup);

    const cityMarkerMap = new Map<
      string,
      {
        mesh: THREE.Mesh;
        ring: THREE.Mesh;
        normalLocal: THREE.Vector3;
        city: City;
      }
    >();

    for (const city of cities) {
      const [px, py, pz] = latLonToVector3Tuple(city.latDeg, city.lonDeg, 1.011);
      const normalLocal = new THREE.Vector3(px, py, pz).normalize();

      const markerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      markerMesh.position.set(px, py, pz);
      citiesGroup.add(markerMesh);

      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.023, 0.034, 24),
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
        })
      );
      ringMesh.position.set(px * 1.003, py * 1.003, pz * 1.003);
      ringMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normalLocal
      );
      ringMesh.visible = false;
      citiesGroup.add(ringMesh);

      cityMarkerMap.set(city.id, {
        mesh: markerMesh,
        ring: ringMesh,
        normalLocal,
        city,
      });
    }

    const selectedCompassGroup = new THREE.Group();
    citiesGroup.add(selectedCompassGroup);
    let lastCompassCityId = "";

    const rebuildSelectedCompass = (city: City) => {
      while (selectedCompassGroup.children.length > 0) {
        selectedCompassGroup.remove(selectedCompassGroup.children[0]);
      }

      if (Math.abs(city.latDeg) >= 89.5) {
        return;
      }

      const [cx, cy, cz] = latLonToVector3Tuple(city.latDeg, city.lonDeg, 1.022);
      selectedCompassGroup.position.set(cx, cy, cz);

      const vectors = getLocalCompassVectors(city.latDeg, city.lonDeg);
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.east), 0.22, 0x22d3ee, 0.96)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.north), 0.17, 0xfb7185, 0.92)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.west), 0.11, 0x94a3b8, 0.42)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.south), 0.11, 0x94a3b8, 0.42)
      );
    };

    // 7.5 東京の地上観測ドーム（地球表面に固定された接平面：地平線ディスク・方位リング・高度線・北極星目印）
    const tokyoLocalCompass = getLocalCompassVectors(TOKYO_LAT_DEG, TOKYO_LON_DEG);
    const tokyoEastLocal = new THREE.Vector3(...tokyoLocalCompass.east);
    const tokyoNorthLocal = new THREE.Vector3(...tokyoLocalCompass.north);
    const tokyoUpLocal = new THREE.Vector3(...tokyoLocalCompass.up);

    // ローカル +X = 東, +Y = 天頂, +Z = 南（-Z = 北）となる右手直交基底を構築します。
    const tokyoBasisMat = new THREE.Matrix4().makeBasis(
      tokyoEastLocal,
      tokyoUpLocal,
      tokyoNorthLocal.clone().negate()
    );
    const tokyoGroundGroup = new THREE.Group();
    tokyoGroundGroup.quaternion.setFromRotationMatrix(tokyoBasisMat);
    tokyoGroundGroup.position
      .copy(tokyoUpLocal)
      .multiplyScalar(1.0 + GROUND_EYE_ALTITUDE - 0.002);
    tokyoGroundGroup.visible = false;
    earthGroup.add(tokyoGroundGroup);

    // 地平線より下の星・太陽・月を自然に隠す水平ディスク
    const tokyoGroundDisk = new THREE.Mesh(
      new THREE.CircleGeometry(14.0, 96),
      tokyoGroundBundle.material
    );
    tokyoGroundDisk.rotation.x = -Math.PI / 2;
    tokyoGroundDisk.position.y = -0.004;
    tokyoGroundGroup.add(tokyoGroundDisk);

    // 地平線沿いの控えめな遠景シルエット（東京の街並み・遠山の低い輪郭）
    const skylineSegs = 144;
    const skylineRadius = 12.8;
    const skylinePositions = new Float32Array((skylineSegs + 1) * 2 * 3);
    const skylineIndices: number[] = [];
    for (let i = 0; i <= skylineSegs; i++) {
      const a = (i / skylineSegs) * Math.PI * 2;
      const sx = Math.sin(a) * skylineRadius;
      const sz = -Math.cos(a) * skylineRadius;
      // なだらかな遠山＋街のシルエット（仰角約 0.5°〜2.0° の控えめな高さ）
      const hill =
        0.13 +
        0.11 * Math.sin(a * 3.0 + 0.5) +
        0.075 * Math.sin(a * 7.0 - 1.2) +
        0.045 * Math.cos(a * 17.0 + 2.1);
      const tower = i % 11 === 0 ? 0.16 : i % 19 === 0 ? 0.11 : 0.0;
      const h = Math.max(0.06, hill + tower);

      const baseIdx = i * 2 * 3;
      skylinePositions[baseIdx] = sx;
      skylinePositions[baseIdx + 1] = -0.03;
      skylinePositions[baseIdx + 2] = sz;
      skylinePositions[baseIdx + 3] = sx;
      skylinePositions[baseIdx + 4] = h;
      skylinePositions[baseIdx + 5] = sz;

      if (i < skylineSegs) {
        const p0 = i * 2;
        const p1 = p0 + 1;
        const p2 = p0 + 2;
        const p3 = p0 + 3;
        skylineIndices.push(p0, p2, p1, p1, p2, p3);
      }
    }
    const skylineGeo = new THREE.BufferGeometry();
    skylineGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(skylinePositions, 3)
    );
    skylineGeo.setIndex(skylineIndices);
    const skylineMat = new THREE.MeshBasicMaterial({
      color: 0x07101f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
      depthWrite: true,
    });
    const skylineMesh = new THREE.Mesh(skylineGeo, skylineMat);
    tokyoGroundGroup.add(skylineMesh);

    // 地平線方位リング・15°目盛り・高度ガイド線（30°/60°）・子午線/卯酉線
    const tokyoSkyGuidesGroup = new THREE.Group();
    tokyoGroundGroup.add(tokyoSkyGuidesGroup);
    const guideRadius = 10.5;

    const horizonRing = createHorizontalRing(guideRadius, 0x38bdf8, 0.8, 160);
    horizonRing.position.y = 0.02;
    horizonRing.renderOrder = 3;
    tokyoSkyGuidesGroup.add(horizonRing);

    // 15°ごとの方位目盛り
    const compassTickPts: number[] = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = degToRad(deg);
      const isMajor = deg % 90 === 0;
      const isMid = deg % 45 === 0;
      const topY = isMajor ? 0.52 : isMid ? 0.34 : 0.2;
      const tx = Math.sin(rad) * guideRadius;
      const tz = -Math.cos(rad) * guideRadius;
      compassTickPts.push(tx, 0.02, tz, tx, topY, tz);
    }
    const compassTickGeo = new THREE.BufferGeometry();
    compassTickGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(compassTickPts, 3)
    );
    const compassTicks = new THREE.LineSegments(
      compassTickGeo,
      new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.78,
      })
    );
    compassTicks.renderOrder = 3;
    tokyoSkyGuidesGroup.add(compassTicks);

    // 高度 30° / 60° の淡い天球ガイドリング
    for (const altDeg of [30, 60]) {
      const altRad = degToRad(altDeg);
      const altRing = createHorizontalRing(
        guideRadius * Math.cos(altRad),
        0x94a3b8,
        0.2,
        128
      );
      altRing.position.y = guideRadius * Math.sin(altRad);
      altRing.renderOrder = 3;
      tokyoSkyGuidesGroup.add(altRing);
    }

    // 南北子午線アーチ（南中ライン）と東西卯酉線アーチ
    const addSkyMeridianArc = (isNorthSouth: boolean, color: number, opacity: number) => {
      const pts: THREE.Vector3[] = [];
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI;
        const h = Math.cos(a) * guideRadius;
        const y = Math.sin(a) * guideRadius;
        pts.push(
          isNorthSouth
            ? new THREE.Vector3(0, y, -h)
            : new THREE.Vector3(h, y, 0)
        );
      }
      const arc = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity })
      );
      arc.renderOrder = 3;
      tokyoSkyGuidesGroup.add(arc);
    };
    addSkyMeridianArc(true, 0x38bdf8, 0.32);
    addSkyMeridianArc(false, 0x94a3b8, 0.2);

    // 北の空（高度 = 東京の緯度 35.6762°）にある北極星（天の北極）の繊細な目印リング
    const polarisAltRad = degToRad(TOKYO_LAT_DEG);
    const polarisAnchor = new THREE.Object3D();
    polarisAnchor.position.set(
      0,
      guideRadius * Math.sin(polarisAltRad),
      -guideRadius * Math.cos(polarisAltRad)
    );
    tokyoGroundGroup.add(polarisAnchor);

    const polarisRing = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.23, 32),
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      })
    );
    polarisRing.position.copy(polarisAnchor.position);
    polarisRing.lookAt(0, 0, 0);
    polarisRing.renderOrder = 3;
    tokyoSkyGuidesGroup.add(polarisRing);

    // 8方位の地平線ラベル用アンカー
    const compassAnchorMap = new Map<string, THREE.Object3D>();
    for (const cp of TOKYO_COMPASS_POINTS) {
      const azRad = degToRad(cp.azDeg);
      const anchor = new THREE.Object3D();
      anchor.position.set(
        Math.sin(azRad) * guideRadius,
        0.22,
        -Math.cos(azRad) * guideRadius
      );
      tokyoGroundGroup.add(anchor);
      compassAnchorMap.set(cp.id, anchor);
    }

    // 8. マウス・タッチドラッグおよびホイールズーム操作
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let groundFovOffset = 0;

    const onPointerDown = (ev: PointerEvent) => {
      isDragging = true;
      lastPointerX = ev.clientX;
      lastPointerY = ev.clientY;
      renderer.domElement.setPointerCapture(ev.pointerId);
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDragging) return;
      const dx = ev.clientX - lastPointerX;
      const dy = ev.clientY - lastPointerY;
      lastPointerX = ev.clientX;
      lastPointerY = ev.clientY;

      onCameraUserDrag();

      const anim = cameraAnimRef.current;
      anim.active = false;
      if (anim.current.groundBlend > 0.5) {
        // 東京の地上視点では、ドラッグで360°の空と天頂方向を自由に見渡せます。
        anim.current.groundAzimuth -= dx * 0.0055;
        anim.current.groundElevation = Math.max(
          degToRad(-2),
          Math.min(degToRad(84), anim.current.groundElevation + dy * 0.0055)
        );
      } else {
        anim.current.yaw -= dx * 0.0065;
        anim.current.pitch = Math.max(
          -Math.PI / 2 + 0.02,
          Math.min(Math.PI / 2, anim.current.pitch + dy * 0.0065)
        );
      }
      anim.from = { ...anim.current };
    };

    const onPointerUp = (ev: PointerEvent) => {
      isDragging = false;
      if (renderer.domElement.hasPointerCapture(ev.pointerId)) {
        renderer.domElement.releasePointerCapture(ev.pointerId);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const anim = cameraAnimRef.current;
      if (anim.current.groundBlend > 0.5) {
        // 地上視点ではホイールで望遠・広角（視野角 FOV）を滑らかに調整できます。
        groundFovOffset = Math.max(
          -36,
          Math.min(12, groundFovOffset + ev.deltaY * 0.025)
        );
        return;
      }
      const nextDist = Math.max(
        1.85,
        Math.min(95, anim.current.distance * Math.exp(ev.deltaY * 0.001))
      );
      anim.current.distance = nextDist;
      anim.to.distance = nextDist;
      anim.from.distance = nextDist;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);

    // 9. メイン描画ループ
    let animFrameId = 0;
    let lastTimestamp = performance.now();
    let totalTimeSec = 0;
    let currentOffsetX = 0;

    const earthOrbitPos = new THREE.Vector3();
    const sunDirWorld = new THREE.Vector3();
    const moonDirWorld = new THREE.Vector3();
    const moonSpaceLocalPos = new THREE.Vector3();
    const moonGroundLocalPos = new THREE.Vector3();
    const groundSunWorldPos = new THREE.Vector3();
    const tokyoUpWorld = new THREE.Vector3();
    const tokyoNorthWorld = new THREE.Vector3();
    const tokyoEastWorld = new THREE.Vector3();
    const tokyoEyeWorldPos = new THREE.Vector3();
    const tokyoLocalOffset = new THREE.Vector3();
    const groundHorizDir = new THREE.Vector3();
    const groundLookDir = new THREE.Vector3();
    const groundLookTarget = new THREE.Vector3();
    const groundCamUp = new THREE.Vector3();
    const spaceCamPos = new THREE.Vector3();
    const blendedCamPos = new THREE.Vector3();
    const camRelEarth = new THREE.Vector3();
    const camForward = new THREE.Vector3();
    const lookAtPos = new THREE.Vector3();
    const tmpWorldPos = new THREE.Vector3();
    const tmpWorldNormal = new THREE.Vector3();
    const tmpToCam = new THREE.Vector3();
    const tmpUpAxis = new THREE.Vector3();
    const tmpRefRight = new THREE.Vector3();
    const tmpRightBase = new THREE.Vector3();
    const tmpBackBase = new THREE.Vector3();
    const tmpHorizBack = new THREE.Vector3();
    const tmpCamDir = new THREE.Vector3();
    const tmpCamUp = new THREE.Vector3();
    const earthQuat = new THREE.Quaternion();
    const spaceLookMat = new THREE.Matrix4();
    const groundLookMat = new THREE.Matrix4();
    const spaceCamQuat = new THREE.Quaternion();
    const groundCamQuat = new THREE.Quaternion();
    let lastMoonBadgeText = "";

    const renderFrame = (now: number) => {
      animFrameId = requestAnimationFrame(renderFrame);
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      totalTimeSec += dt;

      const {
        solarState: curSolar,
        moonState: curMoon,
        cities: curCities,
        selectedCityId: curSelectedId,
        visualStyle: curStyle,
        referenceFrame: curFrame,
        layers: curLayers,
        isInspectorOpen: curInspectorOpen,
      } = latestPropsRef.current;

      const hostW = host.clientWidth || window.innerWidth;
      const hostH = host.clientHeight || window.innerHeight;

      // 太陽のプラズマアニメーション更新
      sunBundle.uniforms.uTime.value = totalTimeSec;

      // 1. 地球の公転位置（太陽中心・Y=0黄道面上で反時計回り）を更新します。
      const eclipticLonRad = degToRad(curSolar.sunEclipticLongitudeDeg);
      earthOrbitPos.set(
        -ORBIT_RADIUS * Math.cos(eclipticLonRad),
        0,
        ORBIT_RADIUS * Math.sin(eclipticLonRad)
      );
      earthSystemGroup.position.copy(earthOrbitPos);

      // 太陽-地球間の動径ガイド線を更新
      const lineAttr = sunEarthLine.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      lineAttr.setXYZ(1, earthOrbitPos.x, earthOrbitPos.y, earthOrbitPos.z);
      lineAttr.needsUpdate = true;

      // 地球中心から太陽中心 (0,0,0) へ向く単位ベクトル
      sunDirWorld.copy(earthOrbitPos).negate().normalize();
      sunBeamRoot.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        sunDirWorld
      );

      // 月の公転方向（白道上の黄経・黄緯）と潮汐ロック自転を更新します。
      moonNodeGroup.rotation.y = degToRad(curMoon.ascendingNodeDeg);
      const moonLonRad = degToRad(curMoon.eclipticLongitudeDeg);
      const moonLatRad = degToRad(curMoon.eclipticLatitudeDeg);
      const moonCosLat = Math.cos(moonLatRad);
      moonDirWorld
        .set(
          moonCosLat * Math.cos(moonLonRad),
          Math.sin(moonLatRad),
          -moonCosLat * Math.sin(moonLonRad)
        )
        .normalize();
      moonSpaceLocalPos.copy(moonDirWorld).multiplyScalar(MOON_ORBIT_RADIUS);
      // 月の表側（テクスチャ中央 +X 方向）が常に地球側を向くよう公転角 + π に合わせます。
      moonMesh.rotation.y = moonLonRad + Math.PI;

      const moonLineAttr = earthMoonLine.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      moonLineAttr.setXYZ(
        1,
        moonSpaceLocalPos.x,
        moonSpaceLocalPos.y,
        moonSpaceLocalPos.z
      );
      moonLineAttr.needsUpdate = true;

      // 地球の自転（赤道座標系内の Y 軸周り GMST）
      earthGroup.rotation.y = curSolar.gmstRad;

      earthSystemGroup.updateMatrixWorld(true);
      earthGroup.getWorldQuaternion(earthQuat);

      // 東京の地表における現在の天頂・北・東のワールド単位ベクトルと視点座標を算出します。
      tokyoUpWorld.copy(tokyoUpLocal).applyQuaternion(earthQuat).normalize();
      tokyoNorthWorld.copy(tokyoNorthLocal).applyQuaternion(earthQuat).normalize();
      tokyoEastWorld.copy(tokyoEastLocal).applyQuaternion(earthQuat).normalize();
      tokyoLocalOffset
        .copy(tokyoUpWorld)
        .multiplyScalar(1.0 + GROUND_EYE_ALTITUDE);
      tokyoEyeWorldPos.copy(earthOrbitPos).add(tokyoLocalOffset);

      earthBundle.uniforms.uSunDirection.value.copy(sunDirWorld);
      atmosphereBundle.uniforms.uSunDirection.value.copy(sunDirWorld);
      // 太陽は非常に遠く太陽光線はほぼ平行なため、月の満ち欠けにも平行光線ベクトルを使い上弦・下弦の半月を正確に再現します。
      moonBundle.uniforms.uSunDirection.value.copy(sunDirWorld);

      // 2. 左視点カード（288px）と右観察パネル（318px）の中央に収まるよう水平オフセットを補間
      const targetOffsetX = curInspectorOpen && hostW > 860 ? 16 : 0;
      currentOffsetX += (targetOffsetX - currentOffsetX) * (1 - Math.exp(-9 * dt));
      if (Math.abs(currentOffsetX) > 0.5) {
        camera.setViewOffset(hostW, hostH, currentOffsetX, 0, hostW, hostH);
      } else {
        camera.clearViewOffset();
      }

      // 3. 連続視点アニメーション（ゆっくり・EaseInOutCubic・対数ズーム・地上視点ブレンド）
      const anim = cameraAnimRef.current;
      const desiredEarthRightAngle = curFrame === "solar" ? eclipticLonRad : 0;
      // 太陽中心ビューでは、下/手前=春分(-X)、右=夏至(+Z)、上/奥=秋分(+X)、左=冬至(-Z) となるよう -π/2 を基準にします。
      const desiredSunRightAngle = -Math.PI / 2;
      const desiredTargetRightAngle =
        anim.to.sunCenterBlend > 0.5
          ? desiredSunRightAngle
          : desiredEarthRightAngle;

      if (anim.active) {
        anim.elapsed += dt;
        const rawT = Math.min(1, anim.elapsed / anim.duration);
        const ease = easeInOutCubic(rawT);

        anim.current.yaw =
          anim.from.yaw + shortestAngleDiff(anim.from.yaw, anim.to.yaw) * ease;
        anim.current.pitch =
          anim.from.pitch + (anim.to.pitch - anim.from.pitch) * ease;
        anim.current.distance = Math.exp(
          Math.log(anim.from.distance) +
            (Math.log(anim.to.distance) - Math.log(anim.from.distance)) * ease
        );
        anim.current.eclipticBlend =
          anim.from.eclipticBlend +
          (anim.to.eclipticBlend - anim.from.eclipticBlend) * ease;
        anim.current.sunCenterBlend =
          anim.from.sunCenterBlend +
          (anim.to.sunCenterBlend - anim.from.sunCenterBlend) * ease;
        anim.current.groundBlend =
          anim.from.groundBlend +
          (anim.to.groundBlend - anim.from.groundBlend) * ease;
        anim.current.groundAzimuth =
          anim.from.groundAzimuth +
          shortestAngleDiff(anim.from.groundAzimuth, anim.to.groundAzimuth) *
            ease;
        anim.current.groundElevation =
          anim.from.groundElevation +
          (anim.to.groundElevation - anim.from.groundElevation) * ease;
        anim.current.rightAngle =
          anim.from.rightAngle +
          shortestAngleDiff(anim.from.rightAngle, desiredTargetRightAngle) *
            ease;

        if (rawT >= 1) {
          anim.active = false;
        }
      } else {
        // 静止後は現在の地球位置／基準フレームにぴったり合わせます。
        anim.current.rightAngle =
          anim.current.sunCenterBlend > 0.5
            ? desiredSunRightAngle
            : desiredEarthRightAngle;
      }

      const curPose = anim.current;
      const g = THREE.MathUtils.clamp(curPose.groundBlend, 0, 1);

      // 宇宙視点へ戻るときは地上用の FOV ズームオフセットを滑らかにリセットします。
      if (g < 0.05 && Math.abs(groundFovOffset) > 0.01) {
        groundFovOffset *= Math.exp(-8 * dt);
      }

      // 地上視点へ降りるにつれ、視差（地球半径によるズレ）を無くすため太陽・月・星空を遠方天球位置へ滑らかに押し出します。
      groundSunWorldPos
        .copy(tokyoEyeWorldPos)
        .addScaledVector(sunDirWorld, 75);
      sunMesh.position.set(0, 0, 0).lerp(groundSunWorldPos, g);
      const sunScale = 1.0 + 1.15 * g;
      sunMesh.scale.setScalar(sunScale);
      sunCoronaMesh.position.copy(sunMesh.position);
      sunCoronaMesh.scale.setScalar(sunScale);

      moonGroundLocalPos
        .copy(tokyoLocalOffset)
        .addScaledVector(moonDirWorld, 55);
      moonMesh.position.copy(moonSpaceLocalPos).lerp(moonGroundLocalPos, g);
      const moonScale = 1.0 + 8.5 * g;
      moonMesh.scale.setScalar(moonScale);
      moonMesh.updateMatrixWorld(true);

      starsGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
      tokyoSkyMesh.position.copy(tokyoEyeWorldPos);

      // 宇宙視点カメラの位置・姿勢を計算
      lookAtPos
        .copy(earthOrbitPos)
        .multiplyScalar(1 - curPose.sunCenterBlend);

      tmpUpAxis
        .copy(celestialNorthWorld)
        .lerp(Y_AXIS, curPose.eclipticBlend)
        .normalize();

      tmpRefRight.set(
        Math.cos(curPose.rightAngle),
        0,
        -Math.sin(curPose.rightAngle)
      );
      tmpRightBase
        .copy(tmpRefRight)
        .addScaledVector(tmpUpAxis, -tmpRefRight.dot(tmpUpAxis));
      if (tmpRightBase.lengthSq() < 1e-6) {
        tmpRightBase.copy(X_AXIS);
      }
      tmpRightBase.normalize();
      tmpBackBase.crossVectors(tmpRightBase, tmpUpAxis).normalize();

      const cosYaw = Math.cos(curPose.yaw);
      const sinYaw = Math.sin(curPose.yaw);
      const cosPitch = Math.cos(curPose.pitch);
      const sinPitch = Math.sin(curPose.pitch);

      tmpHorizBack
        .copy(tmpBackBase)
        .multiplyScalar(cosYaw)
        .addScaledVector(tmpRightBase, sinYaw);

      tmpCamDir
        .copy(tmpHorizBack)
        .multiplyScalar(cosPitch)
        .addScaledVector(tmpUpAxis, sinPitch);

      tmpCamUp
        .copy(tmpUpAxis)
        .multiplyScalar(cosPitch)
        .addScaledVector(tmpHorizBack, -sinPitch);

      spaceCamPos
        .copy(lookAtPos)
        .addScaledVector(tmpCamDir, curPose.distance);

      // 東京の地上視点カメラの位置・姿勢を計算（az: 北=0, 東=π/2, 南=π, 西=-π/2）
      const cosAz = Math.cos(curPose.groundAzimuth);
      const sinAz = Math.sin(curPose.groundAzimuth);
      const cosEl = Math.cos(curPose.groundElevation);
      const sinEl = Math.sin(curPose.groundElevation);

      groundHorizDir
        .copy(tokyoNorthWorld)
        .multiplyScalar(cosAz)
        .addScaledVector(tokyoEastWorld, sinAz)
        .normalize();

      groundLookDir
        .copy(groundHorizDir)
        .multiplyScalar(cosEl)
        .addScaledVector(tokyoUpWorld, sinEl)
        .normalize();

      groundLookTarget.copy(tokyoEyeWorldPos).add(groundLookDir);
      groundCamUp
        .copy(tokyoUpWorld)
        .multiplyScalar(cosEl)
        .addScaledVector(groundHorizDir, -sinEl)
        .normalize();

      // 宇宙カメラと東京地上カメラを位置（地表回避カーブ付き）＆クォータニオン slerp で連続補間します。
      blendedCamPos.copy(spaceCamPos).lerp(tokyoEyeWorldPos, g);
      if (g > 0.001 && g < 0.999) {
        camRelEarth.copy(blendedCamPos).sub(earthOrbitPos);
        const minSafeR = THREE.MathUtils.lerp(
          1.22,
          1.0 + GROUND_EYE_ALTITUDE,
          Math.pow(g, 2.4)
        );
        const curR = camRelEarth.length();
        if (curR > 1e-4 && curR < minSafeR) {
          camRelEarth.multiplyScalar(minSafeR / curR);
          blendedCamPos.copy(earthOrbitPos).add(camRelEarth);
        }
      }

      spaceLookMat.lookAt(spaceCamPos, lookAtPos, tmpCamUp);
      spaceCamQuat.setFromRotationMatrix(spaceLookMat);
      groundLookMat.lookAt(tokyoEyeWorldPos, groundLookTarget, groundCamUp);
      groundCamQuat.setFromRotationMatrix(groundLookMat);

      camera.position.copy(blendedCamPos);
      camera.quaternion.copy(spaceCamQuat).slerp(groundCamQuat, g);
      camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camForward.set(0, 0, -1).applyQuaternion(camera.quaternion);

      // 地上視点ではプラネタリウム風の広角視野（約 76°）にして、地平線シルエット・方位・南中太陽・北極星を一望できるようにします。
      const targetFov = THREE.MathUtils.lerp(40, 76 + groundFovOffset, g);
      const targetNear = THREE.MathUtils.lerp(0.1, 0.005, g);
      const targetFar = THREE.MathUtils.lerp(420, 360, g);
      if (
        Math.abs(camera.fov - targetFov) > 0.01 ||
        Math.abs(camera.near - targetNear) > 0.0005 ||
        Math.abs(camera.far - targetFar) > 0.1
      ) {
        camera.fov = targetFov;
        camera.near = targetNear;
        camera.far = targetFar;
        camera.updateProjectionMatrix();
      }
      camera.updateMatrixWorld(true);

      // 4. ビジュアルモードと補助レイヤー表示設定を適用
      const isDiagram = curStyle === "diagram";
      earthBundle.uniforms.uDayMap.value = isDiagram
        ? textures.diagramMap
        : textures.realisticMap;
      earthBundle.uniforms.uIsDiagram.value = isDiagram ? 1.0 : 0.0;
      earthBundle.uniforms.uShowTerminatorHighlight.value =
        curLayers.terminatorGuide ? 1.0 : 0.0;
      atmosphereBundle.uniforms.uIsDiagram.value = isDiagram ? 1.0 : 0.0;

      const isGroundView = g >= 0.55;
      const isOrbitOverview = !isGroundView && curPose.sunCenterBlend >= 0.45;
      const isEarthCloseup =
        !isGroundView && !isOrbitOverview && curPose.distance < 7.5;
      const isMoonView =
        !isGroundView && !isOrbitOverview && curPose.distance >= 7.5;

      // 東京の大気スカイドーム・地平線ディスク・方位ガイドの滑らかなフェード制御
      const skyOpacity = Math.pow(g, 1.8);
      const groundOpacity = THREE.MathUtils.clamp((g - 0.28) / 0.52, 0, 1);
      const tokyoSunElev = sunDirWorld.dot(tokyoUpWorld);

      tokyoSkyMesh.visible = skyOpacity > 0.01;
      tokyoSkyBundle.uniforms.uUpWorld.value.copy(tokyoUpWorld);
      tokyoSkyBundle.uniforms.uSunDirWorld.value.copy(sunDirWorld);
      tokyoSkyBundle.uniforms.uOpacity.value = skyOpacity;
      tokyoSkyBundle.uniforms.uIsDiagram.value = isDiagram ? 1.0 : 0.0;

      tokyoGroundGroup.visible = groundOpacity > 0.01;
      tokyoGroundBundle.uniforms.uSunElevation.value = tokyoSunElev;
      tokyoGroundBundle.uniforms.uOpacity.value = groundOpacity;
      skylineMat.opacity = 0.96 * groundOpacity;
      tokyoSkyGuidesGroup.visible = groundOpacity > 0.35 && curLayers.graticule;

      // 地上へ降りきった後は地球本体の球面メッシュを隠して、地平線ディスクとの干渉を防ぎます。
      earthMesh.visible = g < 0.78;
      atmosphereMesh.visible = g < 0.48;

      // 月の観察距離では、太陽光線矢印と「☀ 太陽」バッジが白道リングの外側に来るよう滑らかに押し出します。
      const moonBeamFactor = THREE.MathUtils.clamp(
        (curPose.distance - 5.5) / 5.5,
        0,
        1
      );
      sunBeamRoot.position.copy(sunDirWorld).multiplyScalar(2.45 * moonBeamFactor);
      sunBeamRoot.updateMatrixWorld(true);

      graticuleGroup.visible = curLayers.graticule && g < 0.45;
      celestialCompassGroup.visible =
        curLayers.celestialCompass && isEarthCloseup;
      eclipticLocalGroup.visible =
        curLayers.eclipticPlane && !isOrbitOverview && !isGroundView;
      orbitGuideGroup.visible = curLayers.eclipticPlane && isOrbitOverview;
      sunEarthLine.visible =
        (curLayers.eclipticPlane || curLayers.terminatorGuide) &&
        isOrbitOverview;
      sunGuideGroup.visible =
        curLayers.terminatorGuide && !isOrbitOverview && !isGroundView;
      citiesGroup.visible = curLayers.cities && isEarthCloseup;
      equinoxGroup.visible = curLayers.starsAndEquinox && isEarthCloseup;
      starsGroup.visible = curLayers.starsAndEquinox || isGroundView;
      moonSystemGroup.visible = curLayers.moonAndOrbit;
      moonNodeGroup.visible = !isGroundView;
      earthMoonLine.visible = !isGroundView;
      moonEclipticRefRing.visible =
        curLayers.moonAndOrbit && curLayers.eclipticPlane && isMoonView;

      if (lastCompassCityId !== curSelectedId) {
        const foundCity = curCities.find((c) => c.id === curSelectedId);
        if (foundCity) {
          rebuildSelectedCompass(foundCity);
          lastCompassCityId = curSelectedId;
        }
      }

      // 5. 都市マーカー色と 2D 投影バッジ更新
      for (const [cityId, entry] of cityMarkerMap.entries()) {
        const obs = observeCity(entry.city, curSolar);
        const isDay = obs.daylightPhase === "day";
        const isSelected = cityId === curSelectedId;

        const mat = entry.mesh.material as THREE.MeshBasicMaterial;
        if (isSelected) {
          mat.color.setHex(0xfde047);
          entry.mesh.scale.setScalar(1.35);
        } else if (isDay) {
          mat.color.setHex(0xfbbf24);
          entry.mesh.scale.setScalar(1.0);
        } else {
          mat.color.setHex(0x60a5fa);
          entry.mesh.scale.setScalar(1.0);
        }
        entry.ring.visible = isSelected;

        const btn = labelButtonRefs.current.get(cityId);
        if (!btn) continue;

        if (!curLayers.cities || !isEarthCloseup) {
          btn.style.display = "none";
          continue;
        }

        entry.mesh.getWorldPosition(tmpWorldPos);
        tmpWorldNormal.copy(entry.normalLocal).applyQuaternion(earthQuat);
        tmpToCam.copy(camera.position).sub(tmpWorldPos).normalize();

        const facing = tmpToCam.dot(tmpWorldNormal);
        if (facing < -0.05) {
          btn.style.display = "none";
          continue;
        }

        const projected = tmpWorldPos.clone().project(camera);
        if (projected.z > 1) {
          btn.style.display = "none";
          continue;
        }

        const screenX = (projected.x * 0.5 + 0.5) * hostW;
        const screenY = (-projected.y * 0.5 + 0.5) * hostH;

        btn.style.display = "inline-flex";
        btn.style.transform = `translate(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px)`;
        btn.classList.toggle("is-day", isDay);
        btn.classList.toggle("is-night", !isDay);
      }

      // 太陽・地球・月・春分点・公転軌道の季節ラベル・東京地上の8方位/北極星ラベルを更新
      if (isGroundView) {
        const sunInFront = sunDirWorld.dot(camForward) > 0.12;
        const sunAboveHorizon = tokyoSunElev > -0.03;
        tmpWorldPos
          .copy(sunMesh.position)
          .addScaledVector(camera.up, SUN_RADIUS * sunScale + 0.8);
        updateFloatingBadgeAtPosition(
          sunBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          sunInFront && sunAboveHorizon,
          curInspectorOpen,
          false
        );
      } else if (isOrbitOverview) {
        tmpWorldPos.copy(camera.up).multiplyScalar(SUN_RADIUS + 0.22);
        updateFloatingBadgeAtPosition(
          sunBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          true,
          curInspectorOpen,
          false
        );
      } else {
        sunDirectionAnchor.getWorldPosition(tmpWorldPos);
        updateFloatingBadgeAtPosition(
          sunBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.terminatorGuide,
          curInspectorOpen,
          true
        );
      }

      if (isMoonView) {
        tmpWorldPos
          .copy(earthOrbitPos)
          .addScaledVector(camera.up, 1.12);
      } else {
        tmpWorldPos.copy(earthOrbitPos);
      }
      updateFloatingBadgeAtPosition(
        earthBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        isOrbitOverview || isMoonView,
        curInspectorOpen,
        false
      );

      if (moonBadgeRef.current) {
        const nextMoonText = `☾ 月 (${curMoon.phaseLabelJa})`;
        if (lastMoonBadgeText !== nextMoonText) {
          moonBadgeRef.current.textContent = nextMoonText;
          lastMoonBadgeText = nextMoonText;
        }
      }
      moonMesh.getWorldPosition(tmpWorldPos);
      if (isGroundView) {
        const moonInFront = moonDirWorld.dot(camForward) > 0.12;
        const moonAboveHorizon = moonDirWorld.dot(tokyoUpWorld) > -0.03;
        tmpWorldPos.addScaledVector(camera.up, MOON_RADIUS * moonScale + 0.65);
        updateFloatingBadgeAtPosition(
          moonBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.moonAndOrbit && moonInFront && moonAboveHorizon,
          curInspectorOpen,
          false
        );
      } else {
        tmpWorldPos.addScaledVector(camera.up, MOON_RADIUS + 0.14);
        updateFloatingBadgeAtPosition(
          moonBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.moonAndOrbit && isMoonView,
          curInspectorOpen,
          true
        );
      }

      // 東京地上視点時の北極星ラベル（北の空・高度 35.7°）
      polarisAnchor.getWorldPosition(tmpWorldPos);
      tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
      updateFloatingBadgeAtPosition(
        polarisBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        isGroundView && tmpToCam.dot(camForward) > 0.18,
        curInspectorOpen,
        false
      );

      // 東京地上視点時の8方位（北・北東・東・南東・南・南西・西・北西）地平線ラベル
      for (const cp of TOKYO_COMPASS_POINTS) {
        const el = compassBadgeRefs.current.get(cp.id) ?? null;
        const anchor = compassAnchorMap.get(cp.id);
        if (anchor) {
          anchor.getWorldPosition(tmpWorldPos);
          tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            isGroundView && tmpToCam.dot(camForward) > 0.2,
            curInspectorOpen,
            false
          );
        }
      }

      equinoxMarker.getWorldPosition(tmpWorldPos);
      updateFloatingBadgeAtPosition(
        equinoxBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        curLayers.starsAndEquinox && isEarthCloseup,
        curInspectorOpen,
        true
      );

      for (const sp of ORBIT_SEASON_POINTS) {
        const el = seasonBadgeRefs.current.get(sp.id) ?? null;
        const markerObj = seasonMarkerObjects.get(sp.id);
        if (markerObj) {
          markerObj.getWorldPosition(tmpWorldPos);
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            isOrbitOverview && curLayers.eclipticPlane,
            curInspectorOpen,
            false
          );
        }
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      textures.dispose();
      moonTexture.dispose();
      starTexture.dispose();
      earthBundle.material.dispose();
      atmosphereBundle.material.dispose();
      moonBundle.material.dispose();
      sunBundle.material.dispose();
      sunCoronaMaterial.dispose();
      tokyoSkyBundle.material.dispose();
      tokyoGroundBundle.material.dispose();
      skylineMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [cities, onCameraUserDrag]);

  return (
    <div className="viewport-stage">
      <div ref={hostRef} className="three-canvas-host" />
      <div className="city-overlay-layer" aria-label="3D空間のラベル">
        {cities.map((city) => {
          const isSelected = city.id === selectedCityId;
          return (
            <button
              key={city.id}
              ref={(el) => {
                if (el) {
                  labelButtonRefs.current.set(city.id, el);
                } else {
                  labelButtonRefs.current.delete(city.id);
                }
              }}
              type="button"
              className={`city-chip ${isSelected ? "is-selected" : ""}`}
              style={{ display: "none" }}
              onClick={() => onSelectCity(city.id)}
              title={`${city.nameJa}の観測情報を表示`}
            >
              <span className="city-chip-dot" aria-hidden="true" />
              <span className="city-chip-name">{city.nameJa}</span>
            </button>
          );
        })}

        <span
          ref={sunBadgeRef}
          className="space-badge is-sun"
          style={{ display: "none" }}
        >
          ☀ 太陽
        </span>

        <span
          ref={earthBadgeRef}
          className="space-badge is-earth"
          style={{ display: "none" }}
        >
          ● 地球
        </span>

        <span
          ref={moonBadgeRef}
          className="space-badge is-moon"
          style={{ display: "none" }}
        >
          ☾ 月
        </span>

        <span
          ref={polarisBadgeRef}
          className="space-badge is-polaris"
          style={{ display: "none" }}
        >
          ★ 北極星 (高度 35.7°)
        </span>

        <span
          ref={equinoxBadgeRef}
          className="space-badge is-equinox"
          style={{ display: "none" }}
        >
          ♈ 春分点
        </span>

        {TOKYO_COMPASS_POINTS.map((cp) => (
          <span
            key={cp.id}
            ref={(el) => {
              if (el) {
                compassBadgeRefs.current.set(cp.id, el);
              } else {
                compassBadgeRefs.current.delete(cp.id);
              }
            }}
            className={`space-badge is-compass ${
              cp.isCardinal ? "is-cardinal" : ""
            }`}
            style={{ display: "none" }}
          >
            {cp.label}
          </span>
        ))}

        {ORBIT_SEASON_POINTS.map((sp) => (
          <span
            key={sp.id}
            ref={(el) => {
              if (el) {
                seasonBadgeRefs.current.set(sp.id, el);
              } else {
                seasonBadgeRefs.current.delete(sp.id);
              }
            }}
            className="space-badge is-season"
            style={{ display: "none" }}
          >
            {sp.label}
          </span>
        ))}
      </div>
    </div>
  );
};
