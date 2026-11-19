import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  City,
  DisplayLayers,
  GalileanMoonState,
  MoonState,
  ReferenceFrame,
  SolarBodyId,
  SolarSystemBodyState,
  SolarSystemState,
  VenusState,
} from "../types/astronomy";
import {
  EARTH_AXIAL_TILT_DEG,
  MOON_ORBIT_INCLINATION_DEG,
  VENUS_ASCENDING_NODE_DEG,
  VENUS_ORBIT_INCLINATION_DEG,
  degToRad,
  getLocalCompassVectors,
  latLonToVector3Tuple,
  observeCity,
} from "../astronomy/calculations";
import {
  GALILEAN_MOONS,
  SOLAR_SYSTEM_ELEMENTS,
  sampleKeplerOrbitPointsAu,
} from "../astronomy/solarSystem";
import {
  CASSIOPEIA_CONSTELLATION,
  ECLIPTIC_CARDINAL_POINTS,
  ZODIAC_CONSTELLATIONS,
  ZodiacConstellationId,
  eclipticToWorldUnitVector,
  getZodiacConstellationAtLongitude,
} from "../astronomy/zodiac";
import { createEarthTextures, EarthTextures } from "./earthTexture";
import { createMoonTexture } from "./moonTexture";
import { createVenusTexture } from "./venusTexture";
import { createSolarPlanetTextures } from "./planetTextures";
import { createZodiacArtTextures } from "./zodiacArt";
import {
  createAtmosphereMaterial,
  createEarthMaterial,
  createMoonMaterial,
  createPlanetMaterial,
  createSunCoronaMaterial,
  createSunMaterial,
  createTokyoGroundMaterial,
  createTokyoSkyMaterial,
  createVenusMaterial,
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
  /** リアル太陽系モードのブレンド率（0 = 簡易版、1 = 忠実な太陽系 水〜冥） */
  solarSystemBlend: number;
  /** 木星・主要4衛星フォーカス率（0 = 太陽/地球注視、1 = 木星中心注視） */
  jupiterFocusBlend: number;
  /** 地球中心の黄道・13星座ビュー率（0 = 通常カメラ、1 = 地球から黄道と太陽を見渡す視点） */
  eclipticViewBlend: number;
  /** 黄道ビューでの太陽追尾率（1 = 太陽を中央に追尾、0 = 星座を固定して太陽の移動を観察） */
  eclipticFollowSun: number;
  /** 黄道ビュー（太陽追尾時）の水平ドラッグオフセット（ラジアン） */
  eclipticYawOffset: number;
  /** 黄道ビュー（星座固定時）の基準黄経（ラジアン） */
  eclipticFixedLon: number;
  /** 黄道ビューの上下チルト（黄緯方向の仰角・ラジアン） */
  eclipticViewLatRad: number;
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
  /** 現在の金星の位置（日心・地心黄道座標）と見え方状態 */
  venusState: VenusState;
  /** リアル太陽系モード用：水金地火木土天海冥の9天体の瞬間状態 */
  solarSystemBodies: SolarSystemBodyState[];
  /** 木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）の瞬間状態 */
  galileanMoons: GalileanMoonState[];
  /** 表示する代表都市の配列 */
  cities: City[];
  /** 現在選択中の都市ID */
  selectedCityId: string;
  /** 都市選択時のコールバック */
  onSelectCity: (cityId: string) => void;
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
  roll: number;
  panX: number;
  panY: number;
  panZ: number;
  distance: number;
  eclipticBlend: number;
  sunCenterBlend: number;
  groundBlend: number;
  groundAzimuth: number;
  groundElevation: number;
  solarSystemBlend: number;
  jupiterFocusBlend: number;
  eclipticViewBlend: number;
  eclipticFollowSun: number;
  eclipticYawOffset: number;
  eclipticFixedLon: number;
  eclipticViewLatRad: number;
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
/** 金星の半径（実際の金星/地球比 ≈ 0.95 だが地球を主役に見せるためやや控えめに設定） */
const VENUS_RADIUS = 0.78;
/** 太陽中心からの金星の公転軌道半径（月の軌道 13.5 - 3.45 = 10.05 の内側に余裕を持って配置） */
const VENUS_ORBIT_RADIUS = 8.9;
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
const Z_AXIS = new THREE.Vector3(0, 0, 1);

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
    const maxX = isInspectorOpen && hostW >= 601 ? hostW - 360 : hostW - 60;
    x = Math.max(56, Math.min(maxX, x));
    y = Math.max(52, Math.min(hostH - 86, y));
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
  venusState,
  solarSystemBodies,
  galileanMoons,
  cities,
  selectedCityId,
  onSelectCity,
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
  const planetBadgeRefs = useRef<Map<SolarBodyId, HTMLSpanElement>>(new Map());
  const galileanBadgeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const zodiacBadgeRefs = useRef<Map<ZodiacConstellationId, HTMLSpanElement>>(
    new Map()
  );
  const eclipticCardinalBadgeRefs = useRef<Map<string, HTMLSpanElement>>(
    new Map()
  );
  const sunBadgeRef = useRef<HTMLSpanElement | null>(null);
  const earthBadgeRef = useRef<HTMLSpanElement | null>(null);
  const moonBadgeRef = useRef<HTMLSpanElement | null>(null);
  const venusBadgeRef = useRef<HTMLSpanElement | null>(null);
  const polarisBadgeRef = useRef<HTMLSpanElement | null>(null);
  const cassiopeiaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const equinoxBadgeRef = useRef<HTMLSpanElement | null>(null);

  const latestPropsRef = useRef({
    solarState,
    moonState,
    venusState,
    solarSystemBodies,
    galileanMoons,
    cities,
    selectedCityId,
    referenceFrame,
    layers,
    isInspectorOpen,
  });
  latestPropsRef.current = {
    solarState,
    moonState,
    venusState,
    solarSystemBodies,
    galileanMoons,
    cities,
    selectedCityId,
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
      roll: 0,
      panX: 0,
      panY: 0,
      panZ: 0,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
      sunCenterBlend: cameraPoseTarget.sunCenterBlend,
      groundBlend: cameraPoseTarget.groundBlend,
      groundAzimuth: cameraPoseTarget.groundAzimuth,
      groundElevation: cameraPoseTarget.groundElevation,
      solarSystemBlend: cameraPoseTarget.solarSystemBlend,
      jupiterFocusBlend: cameraPoseTarget.jupiterFocusBlend,
      eclipticViewBlend: cameraPoseTarget.eclipticViewBlend,
      eclipticFollowSun: cameraPoseTarget.eclipticFollowSun,
      eclipticYawOffset: cameraPoseTarget.eclipticYawOffset,
      eclipticFixedLon: cameraPoseTarget.eclipticFixedLon,
      eclipticViewLatRad: cameraPoseTarget.eclipticViewLatRad,
      rightAngle:
        referenceFrame === "solar"
          ? degToRad(solarState.sunEclipticLongitudeDeg)
          : 0,
    },
    from: {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      roll: 0,
      panX: 0,
      panY: 0,
      panZ: 0,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
      sunCenterBlend: cameraPoseTarget.sunCenterBlend,
      groundBlend: cameraPoseTarget.groundBlend,
      groundAzimuth: cameraPoseTarget.groundAzimuth,
      groundElevation: cameraPoseTarget.groundElevation,
      solarSystemBlend: cameraPoseTarget.solarSystemBlend,
      jupiterFocusBlend: cameraPoseTarget.jupiterFocusBlend,
      eclipticViewBlend: cameraPoseTarget.eclipticViewBlend,
      eclipticFollowSun: cameraPoseTarget.eclipticFollowSun,
      eclipticYawOffset: cameraPoseTarget.eclipticYawOffset,
      eclipticFixedLon: cameraPoseTarget.eclipticFixedLon,
      eclipticViewLatRad: cameraPoseTarget.eclipticViewLatRad,
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
    cameraPoseTarget.solarSystemBlend,
    cameraPoseTarget.jupiterFocusBlend,
    cameraPoseTarget.eclipticViewBlend,
    cameraPoseTarget.eclipticFollowSun,
    cameraPoseTarget.eclipticYawOffset,
    cameraPoseTarget.eclipticFixedLon,
    cameraPoseTarget.eclipticViewLatRad,
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
    const venusTexture = createVenusTexture();
    const planetTextures = createSolarPlanetTextures();
    const starTexture = createStarSpriteTexture();

    const earthBundle = createEarthMaterial(
      textures.realisticMap,
      textures.maskMap
    );
    const atmosphereBundle = createAtmosphereMaterial();
    const moonBundle = createMoonMaterial(moonTexture);
    const venusBundle = createVenusMaterial(venusTexture);
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

    // 2.5 黄道ライン・天の赤道・黄道13星座（黄道12星座＋へびつかい座）天球グループ
    const ZODIAC_RADIUS = 112;
    const zodiacGroup = new THREE.Group();
    scene.add(zodiacGroup);
    const zodiacDisposableGeos: THREE.BufferGeometry[] = [];
    const zodiacDisposableMats: THREE.Material[] = [];

    // 黄道（太陽の通り道・黄金ライン、Y = 0 の大円）
    const eclipticCirclePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      eclipticCirclePts.push(
        new THREE.Vector3(
          Math.cos(a) * ZODIAC_RADIUS,
          0,
          -Math.sin(a) * ZODIAC_RADIUS
        )
      );
    }
    const eclipticCircleGeo = new THREE.BufferGeometry().setFromPoints(
      eclipticCirclePts
    );
    const eclipticCircleMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.85,
    });
    const eclipticCircleLine = new THREE.Line(
      eclipticCircleGeo,
      eclipticCircleMat
    );
    zodiacGroup.add(eclipticCircleLine);
    zodiacDisposableGeos.push(eclipticCircleGeo);
    zodiacDisposableMats.push(eclipticCircleMat);

    // 黄道上の 10° ごとの目盛り・30° ごとの太陽の移動方向矢印（西→東＝黄経増加方向）
    const eclipticTicksPts: THREE.Vector3[] = [];
    for (let deg = 0; deg < 360; deg += 10) {
      const a = degToRad(deg);
      const isMajor = deg % 30 === 0;
      const halfTick = isMajor ? 2.6 : 1.15;
      const cx = Math.cos(a) * ZODIAC_RADIUS;
      const cz = -Math.sin(a) * ZODIAC_RADIUS;
      eclipticTicksPts.push(
        new THREE.Vector3(cx, -halfTick, cz),
        new THREE.Vector3(cx, halfTick, cz)
      );
      if (isMajor) {
        // 黄経が増える方向（接線ベクトル: (-sin a, 0, -cos a)）への小さな矢じり
        const tipA = degToRad(deg + 4.2);
        const baseA = degToRad(deg + 1.8);
        const tipX = Math.cos(tipA) * ZODIAC_RADIUS;
        const tipZ = -Math.sin(tipA) * ZODIAC_RADIUS;
        const baseX = Math.cos(baseA) * ZODIAC_RADIUS;
        const baseZ = -Math.sin(baseA) * ZODIAC_RADIUS;
        eclipticTicksPts.push(
          new THREE.Vector3(baseX, 1.35, baseZ),
          new THREE.Vector3(tipX, 0, tipZ),
          new THREE.Vector3(baseX, -1.35, baseZ),
          new THREE.Vector3(tipX, 0, tipZ)
        );
      }
    }
    const eclipticTicksGeo = new THREE.BufferGeometry().setFromPoints(
      eclipticTicksPts
    );
    const eclipticTicksMat = new THREE.LineBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.62,
    });
    const eclipticTicksLines = new THREE.LineSegments(
      eclipticTicksGeo,
      eclipticTicksMat
    );
    zodiacGroup.add(eclipticTicksLines);
    zodiacDisposableGeos.push(eclipticTicksGeo);
    zodiacDisposableMats.push(eclipticTicksMat);

    // 天の赤道（黄道に対して 23.44° 傾いた破線リング：春分点 0°・秋分点 180° で黄道と交差）
    const celEqPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      celEqPts.push(
        new THREE.Vector3(
          Math.cos(a) * ZODIAC_RADIUS,
          0,
          -Math.sin(a) * ZODIAC_RADIUS
        )
      );
    }
    const celEqGeo = new THREE.BufferGeometry().setFromPoints(celEqPts);
    const celEqMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 3.4,
      gapSize: 2.2,
      transparent: true,
      opacity: 0.45,
    });
    const celEqLine = new THREE.Line(celEqGeo, celEqMat);
    celEqLine.computeLineDistances();
    celEqLine.rotation.x = -tiltAngleRad;
    zodiacGroup.add(celEqLine);
    zodiacDisposableGeos.push(celEqGeo);
    zodiacDisposableMats.push(celEqMat);

    // 太陽が黄道上を移動してきた軌跡（直近32°）と進行方向ガイド弧
    const TRAIL_SEGMENTS = 32;
    const sunEclipticTrailGeo = new THREE.BufferGeometry();
    sunEclipticTrailGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array((TRAIL_SEGMENTS + 1) * 3), 3)
    );
    const sunEclipticTrailMat = new THREE.LineBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.92,
    });
    const sunEclipticTrailLine = new THREE.Line(
      sunEclipticTrailGeo,
      sunEclipticTrailMat
    );
    zodiacGroup.add(sunEclipticTrailLine);
    zodiacDisposableGeos.push(sunEclipticTrailGeo);
    zodiacDisposableMats.push(sunEclipticTrailMat);

    // 黄道13星座の星座線と主要恒星ポイント
    const zodiacConstellationEntries = new Map<
      ZodiacConstellationId,
      {
        lineMat: THREE.LineBasicMaterial;
        isThirteenth: boolean;
        labelUnitDir: THREE.Vector3;
      }
    >();
    const zodiacStarCoords: number[] = [];
    const zodiacStarCols: number[] = [];

    for (const c of ZODIAC_CONSTELLATIONS) {
      const starVectors: THREE.Vector3[] = [];
      for (const st of c.stars) {
        const [ux, uy, uz] = eclipticToWorldUnitVector(st.lonDeg, st.latDeg);
        const vec = new THREE.Vector3(
          ux * ZODIAC_RADIUS,
          uy * ZODIAC_RADIUS,
          uz * ZODIAC_RADIUS
        );
        starVectors.push(vec);
        zodiacStarCoords.push(vec.x, vec.y, vec.z);
        // 等級が明るい星ほど明るく・アンタレスやアルデバランなどは暖色寄りにします。
        const lum = THREE.MathUtils.clamp(1.18 - st.mag * 0.14, 0.55, 1.0);
        if (c.isThirteenth) {
          zodiacStarCols.push(0.95 * lum, 0.78 * lum, 1.0 * lum);
        } else if (st.nameJa === "アンタレス" || st.nameJa === "アルデバラン") {
          zodiacStarCols.push(1.0 * lum, 0.68 * lum, 0.45 * lum);
        } else {
          zodiacStarCols.push(0.86 * lum, 0.94 * lum, 1.0 * lum);
        }
      }

      const edgePts: THREE.Vector3[] = [];
      for (const [aIdx, bIdx] of c.edges) {
        if (starVectors[aIdx] && starVectors[bIdx]) {
          edgePts.push(starVectors[aIdx], starVectors[bIdx]);
        }
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(edgePts);
      const lineMat = new THREE.LineBasicMaterial({
        color: c.isThirteenth ? 0xd8b4fe : 0x7dd3fc,
        transparent: true,
        opacity: c.isThirteenth ? 0.68 : 0.55,
      });
      const segs = new THREE.LineSegments(lineGeo, lineMat);
      zodiacGroup.add(segs);
      zodiacDisposableGeos.push(lineGeo);
      zodiacDisposableMats.push(lineMat);

      const [lx, ly, lz] = eclipticToWorldUnitVector(
        c.labelLonDeg,
        c.labelLatDeg
      );
      zodiacConstellationEntries.set(c.id, {
        lineMat,
        isThirteenth: c.isThirteenth,
        labelUnitDir: new THREE.Vector3(lx, ly, lz).normalize(),
      });
    }

    const zodiacStarsGeo = new THREE.BufferGeometry();
    zodiacStarsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(zodiacStarCoords, 3)
    );
    zodiacStarsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(zodiacStarCols, 3)
    );
    const zodiacStarsMat = new THREE.PointsMaterial({
      size: 3.1,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const zodiacStarsPoints = new THREE.Points(zodiacStarsGeo, zodiacStarsMat);
    zodiacGroup.add(zodiacStarsPoints);
    zodiacDisposableGeos.push(zodiacStarsGeo);
    zodiacDisposableMats.push(zodiacStarsMat);

    // 太陽の真上・公転面（やや上）視点用：外周の黄道13星座リング＋星座イラストメダリオン＋「地球 → 太陽 → 今の星座」視線ガイド
    const zodiacArtBundle = createZodiacArtTextures();
    const sunOverheadZodiacRing = createHorizontalRing(21.4, 0x94a3b8, 0.3, 128);
    scene.add(sunOverheadZodiacRing);
    zodiacDisposableGeos.push(sunOverheadZodiacRing.geometry);
    zodiacDisposableMats.push(sunOverheadZodiacRing.material as THREE.Material);

    const sunOverheadZodiacArtGroup = new THREE.Group();
    scene.add(sunOverheadZodiacArtGroup);
    const sunOverheadZodiacArtMap = new Map<
      ZodiacConstellationId,
      { sprite: THREE.Sprite; mat: THREE.SpriteMaterial }
    >();

    const zodiacSkyArtGroup = new THREE.Group();
    zodiacGroup.add(zodiacSkyArtGroup);
    const zodiacSkyArtMap = new Map<
      ZodiacConstellationId,
      { sprite: THREE.Sprite; mat: THREE.SpriteMaterial }
    >();

    for (const c of ZODIAC_CONSTELLATIONS) {
      const tex = zodiacArtBundle.textures.get(c.id);
      if (!tex) continue;

      // 太陽と地球の公転ビュー（太陽の真上・公転面やや上）の外周メダリオン（半径 24.8）
      const [ox, , oz] = eclipticToWorldUnitVector(c.labelLonDeg, 0);
      const orbitMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const orbitSprite = new THREE.Sprite(orbitMat);
      orbitSprite.position.set(ox * 24.8, 0.3, oz * 24.8);
      orbitSprite.scale.set(5.4, 5.4, 1);
      orbitSprite.renderOrder = 4;
      sunOverheadZodiacArtGroup.add(orbitSprite);
      sunOverheadZodiacArtMap.set(c.id, { sprite: orbitSprite, mat: orbitMat });
      zodiacDisposableMats.push(orbitMat);

      // 地球から見る黄道ビューの天球背景イラスト（星図の背後に淡く配置）
      const [sx, sy, sz] = eclipticToWorldUnitVector(
        c.labelLonDeg,
        c.labelLatDeg * 0.45
      );
      const skyMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });
      const skySprite = new THREE.Sprite(skyMat);
      skySprite.position.set(
        sx * (ZODIAC_RADIUS + 2),
        sy * (ZODIAC_RADIUS + 2),
        sz * (ZODIAC_RADIUS + 2)
      );
      skySprite.scale.set(22, 22, 1);
      skySprite.renderOrder = 0;
      zodiacSkyArtGroup.add(skySprite);
      zodiacSkyArtMap.set(c.id, { sprite: skySprite, mat: skyMat });
      zodiacDisposableMats.push(skyMat);
    }

    const earthSunZodiacSightGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.06, 0),
      new THREE.Vector3(21.4, 0.06, 0),
    ]);
    const earthSunZodiacSightMat = new THREE.LineDashedMaterial({
      color: 0xfbbf24,
      dashSize: 0.55,
      gapSize: 0.35,
      transparent: true,
      opacity: 0.78,
    });
    const earthSunZodiacSightLine = new THREE.Line(
      earthSunZodiacSightGeo,
      earthSunZodiacSightMat
    );
    scene.add(earthSunZodiacSightLine);
    zodiacDisposableGeos.push(earthSunZodiacSightGeo);
    zodiacDisposableMats.push(earthSunZodiacSightMat);

    // 2.6 東京の北の空で見える周極星座「カシオペア座」（W字形・J2000.0 実座標）
    const cassiopeiaGroup = new THREE.Group();
    scene.add(cassiopeiaGroup);
    const cassiopeiaStarVecs: THREE.Vector3[] = [];
    const cassiopeiaStarCoords: number[] = [];
    const cassiopeiaStarCols: number[] = [];
    for (const st of CASSIOPEIA_CONSTELLATION.stars) {
      const [ux, uy, uz] = eclipticToWorldUnitVector(st.lonDeg, st.latDeg);
      const v = new THREE.Vector3(
        ux * ZODIAC_RADIUS,
        uy * ZODIAC_RADIUS,
        uz * ZODIAC_RADIUS
      );
      cassiopeiaStarVecs.push(v);
      cassiopeiaStarCoords.push(v.x, v.y, v.z);
      cassiopeiaStarCols.push(0.92, 0.97, 1.0);
    }
    const cassiopeiaEdgePts: THREE.Vector3[] = [];
    for (const [a, b] of CASSIOPEIA_CONSTELLATION.edges) {
      if (cassiopeiaStarVecs[a] && cassiopeiaStarVecs[b]) {
        cassiopeiaEdgePts.push(cassiopeiaStarVecs[a], cassiopeiaStarVecs[b]);
      }
    }
    const cassiopeiaLineGeo = new THREE.BufferGeometry().setFromPoints(
      cassiopeiaEdgePts
    );
    const cassiopeiaLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    const cassiopeiaLines = new THREE.LineSegments(
      cassiopeiaLineGeo,
      cassiopeiaLineMat
    );
    cassiopeiaLines.renderOrder = 2;
    cassiopeiaGroup.add(cassiopeiaLines);
    zodiacDisposableGeos.push(cassiopeiaLineGeo);
    zodiacDisposableMats.push(cassiopeiaLineMat);

    const cassiopeiaStarsGeo = new THREE.BufferGeometry();
    cassiopeiaStarsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(cassiopeiaStarCoords, 3)
    );
    cassiopeiaStarsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(cassiopeiaStarCols, 3)
    );
    const cassiopeiaStarsMat = new THREE.PointsMaterial({
      size: 4.8,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const cassiopeiaStarsPoints = new THREE.Points(
      cassiopeiaStarsGeo,
      cassiopeiaStarsMat
    );
    cassiopeiaStarsPoints.renderOrder = 2;
    cassiopeiaGroup.add(cassiopeiaStarsPoints);
    zodiacDisposableGeos.push(cassiopeiaStarsGeo);
    zodiacDisposableMats.push(cassiopeiaStarsMat);

    const [clx, cly, clz] = eclipticToWorldUnitVector(
      CASSIOPEIA_CONSTELLATION.labelPoint.lonDeg,
      CASSIOPEIA_CONSTELLATION.labelPoint.latDeg
    );
    const cassiopeiaLabelUnitDir = new THREE.Vector3(clx, cly, clz).normalize();

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

    // 3.5 金星（太陽の内側を約224.7日で公転する内惑星：軌道傾斜角 約3.395°）
    const venusOrbitGroup = new THREE.Group();
    venusOrbitGroup.rotation.y = degToRad(VENUS_ASCENDING_NODE_DEG);
    scene.add(venusOrbitGroup);

    const venusPlaneGroup = new THREE.Group();
    venusPlaneGroup.rotation.x = degToRad(VENUS_ORBIT_INCLINATION_DEG);
    venusOrbitGroup.add(venusPlaneGroup);
    venusPlaneGroup.add(
      createHorizontalRing(VENUS_ORBIT_RADIUS, 0xfde68a, 0.44, 192)
    );
    venusPlaneGroup.add(
      createHorizontalRing(VENUS_ORBIT_RADIUS + 0.08, 0xfcd34d, 0.16, 192)
    );

    const venusMesh = new THREE.Mesh(
      new THREE.SphereGeometry(VENUS_RADIUS, 48, 32),
      venusBundle.material
    );
    scene.add(venusMesh);

    // 東京の地上視点で明けの明星・宵の明星として輝く淡いシャンパン色の輝きスプライト
    const venusGlowMat = new THREE.SpriteMaterial({
      map: starTexture,
      color: 0xfff3c4,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const venusGlowSprite = new THREE.Sprite(venusGlowMat);
    venusGlowSprite.renderOrder = 2;
    venusGlowSprite.visible = false;
    scene.add(venusGlowSprite);

    // 太陽の真上視点で「地球から見える半球の境目（地球に対して平行な補助線）」を示すガイド線群
    const makeDynamicLine = (
      color: number,
      opacity: number,
      dashed = false
    ) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
      ]);
      const mat = dashed
        ? new THREE.LineDashedMaterial({
            color,
            dashSize: 0.45,
            gapSize: 0.35,
            transparent: true,
            opacity,
          })
        : new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity,
          });
      const line = new THREE.Line(geo, mat);
      line.renderOrder = 4;
      line.visible = false;
      scene.add(line);
      return { line, mat };
    };

    // 月・金星それぞれに地球と平行な断面補助線（地球から見える面と裏側を分ける線）と、地球-金星の視線ガイド線
    const moonEarthParallel = makeDynamicLine(0x38bdf8, 0.96, false);
    const venusEarthParallel = makeDynamicLine(0x38bdf8, 0.96, false);
    const earthVenusSight = makeDynamicLine(0x7dd3fc, 0.36, true);

    // 3.8 リアル太陽系モード（1 AU = ORBIT_RADIUS = 13.5 基準の忠実な 3D ケプラー楕円軌道＋水金地火木土天海冥＋木星主要4衛星）
    const realSolarSystemGroup = new THREE.Group();
    realSolarSystemGroup.visible = false;
    scene.add(realSolarSystemGroup);

    const realOrbitMaterials: THREE.LineBasicMaterial[] = [];
    for (const el of SOLAR_SYSTEM_ELEMENTS) {
      const ptsAu = sampleKeplerOrbitPointsAu(el, 224);
      const ptsScene = ptsAu.map(
        ([x, y, z]) =>
          new THREE.Vector3(x * ORBIT_RADIUS, y * ORBIT_RADIUS, z * ORBIT_RADIUS)
      );
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(ptsScene);
      const orbitMat = new THREE.LineBasicMaterial({
        color: el.orbitHex,
        transparent: true,
        opacity: el.id === "pluto" ? 0.62 : 0.46,
      });
      realOrbitMaterials.push(orbitMat);
      realSolarSystemGroup.add(new THREE.Line(orbitGeo, orbitMat));
    }

    // 土星の環テクスチャを内周→外周方向（u: 0 -> 1）へ同心円マッピングするためのヘルパー
    const createRadialRingGeometry = (
      innerR: number,
      outerR: number,
      segments: number
    ): THREE.RingGeometry => {
      const geo = new THREE.RingGeometry(innerR, outerR, segments);
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        const r = Math.hypot(v.x, v.y);
        const u = (r - innerR) / Math.max(1e-5, outerR - innerR);
        uvAttr.setXY(i, u, 0.5);
      }
      uvAttr.needsUpdate = true;
      return geo;
    };

    type ExtraPlanetId =
      | "mercury"
      | "mars"
      | "jupiter"
      | "saturn"
      | "uranus"
      | "neptune"
      | "pluto";
    const extraPlanetIds: ExtraPlanetId[] = [
      "mercury",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
    ];
    const extraPlanetMap = new Map<
      ExtraPlanetId,
      {
        root: THREE.Group;
        spinMesh: THREE.Mesh;
        uniforms: { uSunDirection: { value: THREE.Vector3 } };
        material: THREE.ShaderMaterial;
        baseSize: number;
      }
    >();

    const extraDisposableMaterials: THREE.Material[] = [];

    // 木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）のメッシュ参照
    const jupiterGalileanMeshes = new Map<
      string,
      { mesh: THREE.Mesh; orbitFactor: number }
    >();
    let jupiterMoonsGroup: THREE.Group | null = null;

    for (const id of extraPlanetIds) {
      const el = SOLAR_SYSTEM_ELEMENTS.find((item) => item.id === id)!;
      const root = new THREE.Group();
      realSolarSystemGroup.add(root);

      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.x = -degToRad(el.axialTiltDeg);
      root.add(tiltGroup);

      // 外惑星や冥王星でも輪郭が暗すぎないよう少し環境光を補います。
      const ambientBoost =
        id === "pluto" || id === "neptune" || id === "uranus" ? 0.34 : 0.24;
      const bundle = createPlanetMaterial(planetTextures[id], ambientBoost);
      const spinMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 40, 24),
        bundle.material
      );
      tiltGroup.add(spinMesh);

      if (id === "saturn") {
        // 土星の美しい同心円リング（C環・B環・カッシーニの間隙・A環）
        const ringGeo = createRadialRingGeometry(1.3, 2.38, 96);
        const ringMat = new THREE.MeshBasicMaterial({
          map: planetTextures.saturnRing,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
        });
        extraDisposableMaterials.push(ringMat);
        const saturnRingMesh = new THREE.Mesh(ringGeo, ringMat);
        saturnRingMesh.rotation.x = Math.PI / 2;
        tiltGroup.add(saturnRingMesh);
      } else if (id === "uranus") {
        // 天王星の横倒し自転軸に沿った淡い細い環
        const uRingMat = new THREE.MeshBasicMaterial({
          color: 0xa5f3fc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
        });
        extraDisposableMaterials.push(uRingMat);
        const uRingMesh = new THREE.Mesh(
          new THREE.RingGeometry(1.42, 1.72, 64),
          uRingMat
        );
        uRingMesh.rotation.x = Math.PI / 2;
        tiltGroup.add(uRingMesh);
      } else if (id === "jupiter") {
        // 木星の赤道面上に主要4衛星（イオ・エウロパ・ガニメデ・カリスト）とそれぞれの軌道リングを配置
        jupiterMoonsGroup = new THREE.Group();
        tiltGroup.add(jupiterMoonsGroup);

        for (const gm of GALILEAN_MOONS) {
          const ringLine = createHorizontalRing(
            gm.visualOrbitFactor,
            gm.hex,
            0.44,
            96
          );
          jupiterMoonsGroup.add(ringLine);

          const mMat = new THREE.MeshBasicMaterial({ color: gm.hex });
          extraDisposableMaterials.push(mMat);
          const mMesh = new THREE.Mesh(
            new THREE.SphereGeometry(gm.visualRadiusFactor, 20, 14),
            mMat
          );
          jupiterMoonsGroup.add(mMesh);
          jupiterGalileanMeshes.set(gm.id, {
            mesh: mMesh,
            orbitFactor: gm.visualOrbitFactor,
          });
        }
      }

      extraPlanetMap.set(id, {
        root,
        spinMesh,
        uniforms: bundle.uniforms,
        material: bundle.material,
        baseSize: el.relativeSizeWeight,
      });
    }

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

    // 8. 6DOF マウス・タッチ・キーボード操作（回転3軸：Yaw/Pitch/Roll ＋ 平行移動3軸：Pan X/Y・前後Z）
    const activePointers = new Map<
      number,
      { x: number; y: number; button: number }
    >();
    let lastPinchDist: number | null = null;
    let lastTwoFingerMid: { x: number; y: number } | null = null;
    let lastTwoFingerAngle: number | null = null;
    let groundFovOffset = 0;
    let eclipticFovOffset = 0;
    const pressedKeys = new Set<string>();
    const camRightVec = new THREE.Vector3();
    const camUpVec = new THREE.Vector3();
    const camForwardVec = new THREE.Vector3();
    const panStepVec = new THREE.Vector3();

    const getTwoFingerMetrics = (): {
      dist: number;
      midX: number;
      midY: number;
      angle: number;
    } | null => {
      if (activePointers.size < 2) return null;
      const pts = Array.from(activePointers.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      return {
        dist: Math.hypot(dx, dy),
        midX: (pts[0].x + pts[1].x) * 0.5,
        midY: (pts[0].y + pts[1].y) * 0.5,
        angle: Math.atan2(dy, dx),
      };
    };

    const applyCameraSpacePan = (screenDx: number, screenDy: number) => {
      const anim = cameraAnimRef.current;
      // 現在のカメラ距離に比例した自然な平行移動スピードで左右・上下へ移動します。
      const panScale = Math.max(0.0025, anim.current.distance * 0.0014);
      camRightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
      camUpVec.set(0, 1, 0).applyQuaternion(camera.quaternion);
      panStepVec
        .copy(camRightVec)
        .multiplyScalar(-screenDx * panScale)
        .addScaledVector(camUpVec, screenDy * panScale);
      anim.current.panX += panStepVec.x;
      anim.current.panY += panStepVec.y;
      anim.current.panZ += panStepVec.z;
    };

    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
    };

    const onPointerDown = (ev: PointerEvent) => {
      activePointers.set(ev.pointerId, {
        x: ev.clientX,
        y: ev.clientY,
        button: ev.button,
      });
      const m = getTwoFingerMetrics();
      lastPinchDist = m ? m.dist : null;
      lastTwoFingerMid = m ? { x: m.midX, y: m.midY } : null;
      lastTwoFingerAngle = m ? m.angle : null;
      renderer.domElement.setPointerCapture(ev.pointerId);
    };

    const onPointerMove = (ev: PointerEvent) => {
      const prevPt = activePointers.get(ev.pointerId);
      if (!prevPt) return;

      const dx = ev.clientX - prevPt.x;
      const dy = ev.clientY - prevPt.y;
      prevPt.x = ev.clientX;
      prevPt.y = ev.clientY;

      const anim = cameraAnimRef.current;

      // 2本指ジェスチャー：ピンチ（前後ズーム）＋ 2本指平行移動（Pan X/Y）＋ 2本指ひねり（Roll）の同時 6DOF 操作
      if (activePointers.size >= 2) {
        const m = getTwoFingerMetrics();
        if (m) {
          onCameraUserDrag();
          anim.active = false;
          // 1) ピンチズーム（前後Z / FOV）
          if (lastPinchDist !== null && lastPinchDist > 4) {
            const ratio = lastPinchDist / Math.max(4, m.dist);
            if (anim.current.eclipticViewBlend > 0.5) {
              eclipticFovOffset = Math.max(
                -30,
                Math.min(28, eclipticFovOffset + (ratio - 1) * 45)
              );
            } else if (anim.current.groundBlend > 0.5) {
              groundFovOffset = Math.max(
                -36,
                Math.min(12, groundFovOffset + (ratio - 1) * 45)
              );
            } else {
              const maxZoomDist =
                anim.current.solarSystemBlend > 0.25 ? 2400 : 120;
              const nextDist = Math.max(
                1.5,
                Math.min(maxZoomDist, anim.current.distance * ratio)
              );
              anim.current.distance = nextDist;
              anim.to.distance = nextDist;
              anim.from.distance = nextDist;
            }
          }
          // 2) 2本指平行移動（宇宙空間での X/Y パン）
          if (
            lastTwoFingerMid !== null &&
            anim.current.groundBlend < 0.5 &&
            anim.current.eclipticViewBlend < 0.5
          ) {
            applyCameraSpacePan(
              m.midX - lastTwoFingerMid.x,
              m.midY - lastTwoFingerMid.y
            );
          }
          // 3) 2本指ひねり（ロール回転）
          if (lastTwoFingerAngle !== null) {
            const dAngle = shortestAngleDiff(lastTwoFingerAngle, m.angle);
            if (Math.abs(dAngle) < 0.45) {
              anim.current.roll += dAngle;
            }
          }
          anim.from = { ...anim.current };
        }
        lastPinchDist = m ? m.dist : null;
        lastTwoFingerMid = m ? { x: m.midX, y: m.midY } : null;
        lastTwoFingerAngle = m ? m.angle : null;
        return;
      }

      onCameraUserDrag();
      anim.active = false;

      // Alt/Option + ドラッグでロール回転（カメラ光軸周りの傾き）
      if (ev.altKey) {
        anim.current.roll += dx * 0.0065;
        anim.from = { ...anim.current };
        return;
      }

      // 右ドラッグ・中ボタンドラッグ・Shift+ドラッグで 6DOF 平行移動（Pan X/Y）
      const isPanGesture =
        prevPt.button === 2 ||
        prevPt.button === 1 ||
        (ev.buttons & 2) !== 0 ||
        (ev.buttons & 4) !== 0 ||
        ev.shiftKey;
      if (
        isPanGesture &&
        anim.current.groundBlend < 0.5 &&
        anim.current.eclipticViewBlend < 0.5
      ) {
        applyCameraSpacePan(dx, dy);
        anim.from = { ...anim.current };
        return;
      }

      if (anim.current.eclipticViewBlend > 0.5) {
        // 地球中心の黄道・13星座ビューでは、ドラッグで全周360°の黄道帯を自由に見渡せます。
        if (anim.current.eclipticFollowSun > 0.5) {
          anim.current.eclipticYawOffset += dx * 0.0055;
        } else {
          anim.current.eclipticFixedLon += dx * 0.0055;
        }
        anim.current.eclipticViewLatRad = Math.max(
          degToRad(-68),
          Math.min(degToRad(68), anim.current.eclipticViewLatRad + dy * 0.0055)
        );
      } else if (anim.current.groundBlend > 0.5) {
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
      activePointers.delete(ev.pointerId);
      const m = getTwoFingerMetrics();
      lastPinchDist = m ? m.dist : null;
      lastTwoFingerMid = m ? { x: m.midX, y: m.midY } : null;
      lastTwoFingerAngle = m ? m.angle : null;
      if (renderer.domElement.hasPointerCapture(ev.pointerId)) {
        renderer.domElement.releasePointerCapture(ev.pointerId);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const anim = cameraAnimRef.current;
      if (anim.current.eclipticViewBlend > 0.5) {
        eclipticFovOffset = Math.max(
          -30,
          Math.min(28, eclipticFovOffset + ev.deltaY * 0.025)
        );
        return;
      }
      if (anim.current.groundBlend > 0.5) {
        // 地上視点ではホイールで望遠・広角（視野角 FOV）を滑らかに調整できます。
        groundFovOffset = Math.max(
          -36,
          Math.min(12, groundFovOffset + ev.deltaY * 0.025)
        );
        return;
      }
      const maxZoomDist = anim.current.solarSystemBlend > 0.25 ? 2400 : 120;
      const nextDist = Math.max(
        1.5,
        Math.min(maxZoomDist, anim.current.distance * Math.exp(ev.deltaY * 0.001))
      );
      anim.current.distance = nextDist;
      anim.to.distance = nextDist;
      anim.from.distance = nextDist;
    };

    const isEditableElement = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || isEditableElement(ev.target)) return;
      const code = ev.code;
      if (
        code === "KeyW" ||
        code === "KeyA" ||
        code === "KeyS" ||
        code === "KeyD" ||
        code === "KeyQ" ||
        code === "KeyE" ||
        code === "KeyR" ||
        code === "KeyF" ||
        code === "ArrowUp" ||
        code === "ArrowDown" ||
        code === "ArrowLeft" ||
        code === "ArrowRight"
      ) {
        pressedKeys.add(code);
      }
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      pressedKeys.delete(ev.code);
    };

    const onWindowBlur = () => {
      pressedKeys.clear();
    };

    renderer.domElement.addEventListener("contextmenu", onContextMenu);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);

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
    const realEarthPos = new THREE.Vector3();
    const realVenusPos = new THREE.Vector3();
    const jupiterWorldPos = new THREE.Vector3();
    const sunDirWorld = new THREE.Vector3();
    const moonDirWorld = new THREE.Vector3();
    const moonSpaceLocalPos = new THREE.Vector3();
    const moonGroundLocalPos = new THREE.Vector3();
    const venusSpacePos = new THREE.Vector3();
    const venusGeoDirWorld = new THREE.Vector3();
    const venusGroundPos = new THREE.Vector3();
    const venusSunDirWorld = new THREE.Vector3();
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
    const eclipticLookDir = new THREE.Vector3();
    const eclipticLookTarget = new THREE.Vector3();
    const eclipticLookMat = new THREE.Matrix4();
    const eclipticCamQuat = new THREE.Quaternion();
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
    const rollQuat = new THREE.Quaternion();
    let lastMoonBadgeText = "";

    const renderFrame = (now: number) => {
      animFrameId = requestAnimationFrame(renderFrame);
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      totalTimeSec += dt;

      const {
        solarState: curSolar,
        moonState: curMoon,
        venusState: curVenus,
        solarSystemBodies: curBodies,
        galileanMoons: curGalilean,
        cities: curCities,
        selectedCityId: curSelectedId,
        referenceFrame: curFrame,
        layers: curLayers,
        isInspectorOpen: curInspectorOpen,
      } = latestPropsRef.current;

      const hostW = host.clientWidth || window.innerWidth;
      const hostH = host.clientHeight || window.innerHeight;

      // 太陽のプラズマアニメーション更新
      sunBundle.uniforms.uTime.value = totalTimeSec;

      // 連続カメラアニメーションの現在値を先に進行させ、モードブレンド率 (g, s, j) を確定します。
      const eclipticLonRad = degToRad(curSolar.sunEclipticLongitudeDeg);
      const anim = cameraAnimRef.current;
      const desiredEarthRightAngle = curFrame === "solar" ? eclipticLonRad : 0;
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
        anim.current.roll =
          anim.from.roll + shortestAngleDiff(anim.from.roll, 0) * ease;
        anim.current.panX = anim.from.panX * (1 - ease);
        anim.current.panY = anim.from.panY * (1 - ease);
        anim.current.panZ = anim.from.panZ * (1 - ease);
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
        anim.current.solarSystemBlend =
          anim.from.solarSystemBlend +
          (anim.to.solarSystemBlend - anim.from.solarSystemBlend) * ease;
        anim.current.jupiterFocusBlend =
          anim.from.jupiterFocusBlend +
          (anim.to.jupiterFocusBlend - anim.from.jupiterFocusBlend) * ease;
        anim.current.eclipticViewBlend =
          anim.from.eclipticViewBlend +
          (anim.to.eclipticViewBlend - anim.from.eclipticViewBlend) * ease;
        anim.current.eclipticFollowSun =
          anim.from.eclipticFollowSun +
          (anim.to.eclipticFollowSun - anim.from.eclipticFollowSun) * ease;
        anim.current.eclipticYawOffset =
          anim.from.eclipticYawOffset +
          shortestAngleDiff(
            anim.from.eclipticYawOffset,
            anim.to.eclipticYawOffset
          ) *
            ease;
        anim.current.eclipticFixedLon =
          anim.from.eclipticFixedLon +
          shortestAngleDiff(
            anim.from.eclipticFixedLon,
            anim.to.eclipticFixedLon
          ) *
            ease;
        anim.current.eclipticViewLatRad =
          anim.from.eclipticViewLatRad +
          (anim.to.eclipticViewLatRad - anim.from.eclipticViewLatRad) * ease;
        anim.current.rightAngle =
          anim.from.rightAngle +
          shortestAngleDiff(anim.from.rightAngle, desiredTargetRightAngle) *
            ease;

        if (rawT >= 1) {
          anim.active = false;
        }
      } else {
        anim.current.rightAngle =
          anim.current.sunCenterBlend > 0.5
            ? desiredSunRightAngle
            : desiredEarthRightAngle;
      }

      const curPose = anim.current;
      const g = THREE.MathUtils.clamp(curPose.groundBlend, 0, 1);
      const s = THREE.MathUtils.clamp(curPose.solarSystemBlend, 0, 1);
      const jFocus = THREE.MathUtils.clamp(curPose.jupiterFocusBlend, 0, 1);
      const eBlend = THREE.MathUtils.clamp(curPose.eclipticViewBlend, 0, 1);

      // 6DOF キーボード連続移動（W/S: 前後, A/D: 左右, R/F: 上下, Q/E: ロール, 矢印: 回転）
      if (pressedKeys.size > 0) {
        onCameraUserDrag();
        anim.active = false;
        const rotSpeed = 1.15 * dt;
        const moveSpeed = Math.max(1.2, curPose.distance * 0.55) * dt;

        if (pressedKeys.has("KeyQ")) curPose.roll -= rotSpeed;
        if (pressedKeys.has("KeyE")) curPose.roll += rotSpeed;

        const yawKey =
          (pressedKeys.has("ArrowRight") ? 1 : 0) -
          (pressedKeys.has("ArrowLeft") ? 1 : 0);
        const pitchKey =
          (pressedKeys.has("ArrowUp") ? 1 : 0) -
          (pressedKeys.has("ArrowDown") ? 1 : 0);

        if (eBlend > 0.5) {
          if (curPose.eclipticFollowSun > 0.5) {
            curPose.eclipticYawOffset -= yawKey * rotSpeed;
          } else {
            curPose.eclipticFixedLon -= yawKey * rotSpeed;
          }
          curPose.eclipticViewLatRad = Math.max(
            degToRad(-68),
            Math.min(degToRad(68), curPose.eclipticViewLatRad + pitchKey * rotSpeed)
          );
          if (pressedKeys.has("KeyW")) {
            eclipticFovOffset = Math.max(-30, eclipticFovOffset - 32 * dt);
          }
          if (pressedKeys.has("KeyS")) {
            eclipticFovOffset = Math.min(28, eclipticFovOffset + 32 * dt);
          }
        } else if (g > 0.5) {
          curPose.groundAzimuth += yawKey * rotSpeed;
          curPose.groundElevation = Math.max(
            degToRad(-2),
            Math.min(degToRad(84), curPose.groundElevation + pitchKey * rotSpeed)
          );
          if (pressedKeys.has("KeyW")) {
            groundFovOffset = Math.max(-36, groundFovOffset - 32 * dt);
          }
          if (pressedKeys.has("KeyS")) {
            groundFovOffset = Math.min(12, groundFovOffset + 32 * dt);
          }
        } else {
          curPose.yaw += yawKey * rotSpeed;
          curPose.pitch = Math.max(
            -Math.PI / 2 + 0.02,
            Math.min(Math.PI / 2, curPose.pitch + pitchKey * rotSpeed)
          );

          camRightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
          camUpVec.set(0, 1, 0).applyQuaternion(camera.quaternion);
          camForwardVec.set(0, 0, -1).applyQuaternion(camera.quaternion);

          const strafe =
            (pressedKeys.has("KeyD") ? 1 : 0) - (pressedKeys.has("KeyA") ? 1 : 0);
          const climb =
            (pressedKeys.has("KeyR") ? 1 : 0) - (pressedKeys.has("KeyF") ? 1 : 0);
          const thrust =
            (pressedKeys.has("KeyW") ? 1 : 0) - (pressedKeys.has("KeyS") ? 1 : 0);

          if (strafe !== 0 || climb !== 0 || thrust !== 0) {
            curPose.panX +=
              (camRightVec.x * strafe +
                camUpVec.x * climb +
                camForwardVec.x * thrust) *
              moveSpeed;
            curPose.panY +=
              (camRightVec.y * strafe +
                camUpVec.y * climb +
                camForwardVec.y * thrust) *
              moveSpeed;
            curPose.panZ +=
              (camRightVec.z * strafe +
                camUpVec.z * climb +
                camForwardVec.z * thrust) *
              moveSpeed;
          }
        }
        anim.from = { ...curPose };
      }

      // 宇宙視点へ戻るときは地上用・黄道ビュー用の FOV ズームオフセットを滑らかにリセットします。
      if (g < 0.05 && Math.abs(groundFovOffset) > 0.01) {
        groundFovOffset *= Math.exp(-8 * dt);
      }
      if (eBlend < 0.05 && Math.abs(eclipticFovOffset) > 0.01) {
        eclipticFovOffset *= Math.exp(-8 * dt);
      }

      // 1. 地球の公転位置（簡易モードの真円 13.5 ↔ リアル太陽系のケプラー楕円を滑らかにブレンド）を更新
      earthOrbitPos.set(
        -ORBIT_RADIUS * Math.cos(eclipticLonRad),
        0,
        ORBIT_RADIUS * Math.sin(eclipticLonRad)
      );
      const earthBodyState = curBodies.find((b) => b.id === "earth");
      if (earthBodyState && s > 0.001) {
        realEarthPos.set(
          earthBodyState.positionAu[0] * ORBIT_RADIUS,
          earthBodyState.positionAu[1] * ORBIT_RADIUS,
          earthBodyState.positionAu[2] * ORBIT_RADIUS
        );
        earthOrbitPos.lerp(realEarthPos, s);
      }
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

      // リアル太陽系モードでは月の公転軌道スケールを 0.56 倍（半径約1.93）へ滑らかに縮め、金星・火星軌道との干渉を防ぎます。
      const moonSystemScale = THREE.MathUtils.lerp(1.0, 0.56, s);
      moonSystemGroup.scale.setScalar(moonSystemScale);

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
      moonBundle.uniforms.uSunDirection.value.copy(sunDirWorld);

      // 2. 右側観察パネルが開いているとき、左側の広い空間の中央へ地球・軌道が収まるよう水平オフセットを補間
      const targetOffsetX = curInspectorOpen && hostW >= 1024 ? 154 : 0;
      currentOffsetX += (targetOffsetX - currentOffsetX) * (1 - Math.exp(-9 * dt));
      if (Math.abs(currentOffsetX) > 0.5) {
        camera.setViewOffset(hostW, hostH, currentOffsetX, 0, hostW, hostH);
      } else {
        camera.clearViewOffset();
      }

      // 3. リアル太陽系モードの距離補正と各惑星・木星4衛星の更新
      const outerZoomBoost =
        s > 0.01 && jFocus < 0.5
          ? 1.0 + THREE.MathUtils.clamp((curPose.distance - 180) / 210, 0, 5.4)
          : 1.0;

      // 太陽サイズ：地上視点では視差なし遠方へ、黄道ビューでは星座と重なりにくいシャープなサイズへ調整します。
      groundSunWorldPos
        .copy(tokyoEyeWorldPos)
        .addScaledVector(sunDirWorld, 75);
      sunMesh.position.set(0, 0, 0).lerp(groundSunWorldPos, g);
      const solarSunBoost =
        1.0 +
        s *
          (1 - jFocus) *
          THREE.MathUtils.clamp((curPose.distance - 180) / 145, 0, 6.8);
      const baseSunScale = THREE.MathUtils.lerp(solarSunBoost, 2.15, g);
      const sunScale = THREE.MathUtils.lerp(baseSunScale, 0.36, eBlend);
      sunMesh.scale.setScalar(sunScale);
      sunCoronaMesh.position.copy(sunMesh.position);
      sunCoronaMesh.scale.setScalar(sunScale);

      moonGroundLocalPos
        .copy(tokyoLocalOffset)
        .addScaledVector(moonDirWorld, 55);
      moonMesh.position.copy(moonSpaceLocalPos).lerp(moonGroundLocalPos, g);
      const orbitMoonBoost = 1.0 + 0.85 * curPose.sunCenterBlend * (1 - s);
      const baseMoonScale = THREE.MathUtils.lerp(orbitMoonBoost, 9.5, g);
      const moonScale = THREE.MathUtils.lerp(baseMoonScale, 0.42, eBlend);
      moonMesh.scale.setScalar(moonScale);
      moonMesh.updateMatrixWorld(true);

      // 金星の日心公転位置（簡易 8.9 ↔ リアル 0.723 AU = 9.765）と地上ビューを滑らかにブレンド
      const vHelioLonRad = degToRad(curVenus.heliocentricLongitudeDeg);
      const vHelioLatRad = degToRad(curVenus.heliocentricLatitudeDeg);
      const vCosLat = Math.cos(vHelioLatRad);
      venusSpacePos.set(
        VENUS_ORBIT_RADIUS * vCosLat * Math.cos(vHelioLonRad),
        VENUS_ORBIT_RADIUS * Math.sin(vHelioLatRad),
        -VENUS_ORBIT_RADIUS * vCosLat * Math.sin(vHelioLonRad)
      );
      const venusBodyState = curBodies.find((b) => b.id === "venus");
      if (venusBodyState && s > 0.001) {
        realVenusPos.set(
          venusBodyState.positionAu[0] * ORBIT_RADIUS,
          venusBodyState.positionAu[1] * ORBIT_RADIUS,
          venusBodyState.positionAu[2] * ORBIT_RADIUS
        );
        venusSpacePos.lerp(realVenusPos, s);
      }
      venusSunDirWorld.copy(venusSpacePos).negate().normalize();
      venusBundle.uniforms.uSunDirection.value.copy(venusSunDirWorld);

      const vGeoLonRad = degToRad(curVenus.geocentricLongitudeDeg);
      const vGeoLatRad = degToRad(curVenus.geocentricLatitudeDeg);
      const vGeoCosLat = Math.cos(vGeoLatRad);
      venusGeoDirWorld
        .set(
          vGeoCosLat * Math.cos(vGeoLonRad),
          Math.sin(vGeoLatRad),
          -vGeoCosLat * Math.sin(vGeoLonRad)
        )
        .normalize();
      venusGroundPos.copy(tokyoEyeWorldPos).addScaledVector(venusGeoDirWorld, 64);

      venusMesh.position.copy(venusSpacePos).lerp(venusGroundPos, g);
      const baseVenusScale = THREE.MathUtils.lerp(1.0, 0.55, g);
      venusMesh.scale.setScalar(THREE.MathUtils.lerp(baseVenusScale, 0.34, eBlend));
      venusMesh.rotation.y = -totalTimeSec * 0.08;
      venusMesh.updateMatrixWorld(true);

      venusGlowSprite.position.copy(venusMesh.position);
      venusGlowSprite.scale.setScalar(
        Math.max(3.6 * g, 1.45 * eBlend, 0.01)
      );

      // リアル太陽系モードの追加7天体（水星・火星・木星・土星・天王星・海王星・冥王星）と木星4衛星を更新
      realSolarSystemGroup.visible = s > 0.01 && g < 0.5;
      for (const body of curBodies) {
        const entry = extraPlanetMap.get(body.id as ExtraPlanetId);
        if (!entry) continue;
        const px = body.positionAu[0] * ORBIT_RADIUS;
        const py = body.positionAu[1] * ORBIT_RADIUS;
        const pz = body.positionAu[2] * ORBIT_RADIUS;
        entry.root.position.set(px, py, pz);

        if (body.id === "jupiter") {
          jupiterWorldPos.set(px, py, pz);
        }

        // 内惑星（水・火）は等倍のまま、外惑星（木〜冥）は遠方俯瞰時のみ見やすいよう滑らかに拡大します。
        const isInnerExtra = body.id === "mercury" || body.id === "mars";
        const visualRadius =
          entry.baseSize * (isInnerExtra ? 1.0 : outerZoomBoost);
        entry.root.scale.setScalar(visualRadius);
        entry.spinMesh.rotation.y = totalTimeSec * (body.id === "jupiter" ? 0.45 : 0.2);

        entry.uniforms.uSunDirection.value
          .set(-px, -py, -pz)
          .normalize();
      }

      // 木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）の公転位置を更新
      if (jupiterMoonsGroup) {
        // 遠方全体俯瞰時（distance >= 320）は木星の周囲がごちゃつかないよう4衛星リングを控えめに隠します。
        jupiterMoonsGroup.visible =
          s > 0.01 && (jFocus > 0.1 || curPose.distance < 320);
        for (const gm of curGalilean) {
          const mEntry = jupiterGalileanMeshes.get(gm.id);
          if (!mEntry) continue;
          const aRad = degToRad(gm.angleDeg);
          mEntry.mesh.position.set(
            Math.cos(aRad) * mEntry.orbitFactor,
            0,
            -Math.sin(aRad) * mEntry.orbitFactor
          );
        }
      }
      realSolarSystemGroup.updateMatrixWorld(true);

      // 遠方星空・黄道13星座天球・カシオペア座の位置を更新します（地球中心ビュー・地上視点では視差ゼロの地球中心へ配置）。
      const starExpansion = 1.0 + 21.0 * s;
      starsGroup.scale.setScalar(starExpansion);
      starMat.size = 1.55 * (1.0 + 20.0 * s);
      if (eBlend >= g) {
        starsGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        zodiacGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        cassiopeiaGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
      } else {
        starsGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        zodiacGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        cassiopeiaGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
      }
      tokyoSkyMesh.position.copy(tokyoEyeWorldPos);

      // 宇宙視点カメラの注視点（地球 ↔ 太陽 ↔ 木星）＋ 6DOF 平行移動オフセットを計算
      lookAtPos
        .copy(earthOrbitPos)
        .multiplyScalar(1 - curPose.sunCenterBlend);
      if (jFocus > 0.001) {
        lookAtPos.lerp(jupiterWorldPos, jFocus);
      }
      lookAtPos.x += curPose.panX;
      lookAtPos.y += curPose.panY;
      lookAtPos.z += curPose.panZ;

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

      // 地球中心の黄道・13星座ビューカメラの姿勢を計算（太陽追尾 ↔ 星座固定を最短角で補間）
      const followLonRad = eclipticLonRad + curPose.eclipticYawOffset;
      const eclipticLookLonRad =
        curPose.eclipticFixedLon +
        shortestAngleDiff(curPose.eclipticFixedLon, followLonRad) *
          curPose.eclipticFollowSun;
      const cosELat = Math.cos(curPose.eclipticViewLatRad);
      const sinELat = Math.sin(curPose.eclipticViewLatRad);
      eclipticLookDir
        .set(
          cosELat * Math.cos(eclipticLookLonRad),
          sinELat,
          -cosELat * Math.sin(eclipticLookLonRad)
        )
        .normalize();
      eclipticLookTarget.copy(earthOrbitPos).add(eclipticLookDir);
      eclipticLookMat.lookAt(earthOrbitPos, eclipticLookTarget, Y_AXIS);
      eclipticCamQuat.setFromRotationMatrix(eclipticLookMat);

      blendedCamPos.lerp(earthOrbitPos, eBlend);
      camera.position.copy(blendedCamPos);
      camera.quaternion
        .copy(spaceCamQuat)
        .slerp(groundCamQuat, g)
        .slerp(eclipticCamQuat, eBlend);
      // 6DOF ロール回転（光軸 Z 周り）を適用します。
      if (Math.abs(curPose.roll) > 1e-4) {
        rollQuat.setFromAxisAngle(Z_AXIS, curPose.roll);
        camera.quaternion.multiply(rollQuat);
      }
      camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camForward.set(0, 0, -1).applyQuaternion(camera.quaternion);

      // 地上視点では広角 76°、黄道ビューではパノラマ 64°、リアル太陽系の遠方俯瞰では far を 6800 まで広げます。
      const baseFov = THREE.MathUtils.lerp(40, 76 + groundFovOffset, g);
      const targetFov = THREE.MathUtils.lerp(
        baseFov,
        64 + eclipticFovOffset,
        eBlend
      );
      const farDistFactor =
        g < 0.1 && eBlend < 0.1
          ? THREE.MathUtils.clamp((curPose.distance - 140) / 360, 0, 1)
          : 0;
      const targetNear =
        g > 0.01
          ? THREE.MathUtils.lerp(0.1, 0.005, g)
          : THREE.MathUtils.lerp(0.1, 1.2, farDistFactor);
      const targetFar =
        g > 0.01 || eBlend > 0.01
          ? THREE.MathUtils.lerp(420, 360, Math.max(g, eBlend))
          : THREE.MathUtils.lerp(420, 6800, s);
      if (
        Math.abs(camera.fov - targetFov) > 0.01 ||
        Math.abs(camera.near - targetNear) > 0.0005 ||
        Math.abs(camera.far - targetFar) > 0.5
      ) {
        camera.fov = targetFov;
        camera.near = targetNear;
        camera.far = targetFar;
        camera.updateProjectionMatrix();
      }
      camera.updateMatrixWorld(true);

      // 4. 補助レイヤー表示設定を適用（宇宙リアル固定）
      earthBundle.uniforms.uShowTerminatorHighlight.value =
        curLayers.terminatorGuide ? 1.0 : 0.0;

      const isGroundView = g >= 0.55;
      const isEclipticSkyView = eBlend >= 0.55;
      const isRealSolarSystem = !isGroundView && !isEclipticSkyView && s >= 0.45;
      const isJupiterFocus = isRealSolarSystem && jFocus >= 0.45;
      const isOrbitOverview =
        !isGroundView && !isEclipticSkyView && curPose.sunCenterBlend >= 0.45;
      const isSimpleOrbitOverview = isOrbitOverview && !isRealSolarSystem;
      const isEarthCloseup =
        !isGroundView &&
        !isEclipticSkyView &&
        !isOrbitOverview &&
        curPose.distance < 7.5;
      const isMoonView =
        !isGroundView &&
        !isEclipticSkyView &&
        !isOrbitOverview &&
        curPose.distance >= 7.5;

      // 東京の大気スカイドーム・地平線ディスク・方位ガイドの滑らかなフェード制御
      const skyOpacity = Math.pow(g, 1.8);
      const groundOpacity = THREE.MathUtils.clamp((g - 0.28) / 0.52, 0, 1);
      const tokyoSunElev = sunDirWorld.dot(tokyoUpWorld);

      tokyoSkyMesh.visible = skyOpacity > 0.01;
      tokyoSkyBundle.uniforms.uUpWorld.value.copy(tokyoUpWorld);
      tokyoSkyBundle.uniforms.uSunDirWorld.value.copy(sunDirWorld);
      tokyoSkyBundle.uniforms.uOpacity.value = skyOpacity;

      tokyoGroundGroup.visible = groundOpacity > 0.01;
      tokyoGroundBundle.uniforms.uSunElevation.value = tokyoSunElev;
      tokyoGroundBundle.uniforms.uOpacity.value = groundOpacity;
      skylineMat.opacity = 0.96 * groundOpacity;
      tokyoSkyGuidesGroup.visible = groundOpacity > 0.35 && curLayers.graticule;

      // 地上・黄道ビューへ降りきった後は地球本体の球面メッシュを隠して、内側が映り込むのを防ぎます。
      earthMesh.visible = g < 0.78 && eBlend < 0.52;
      atmosphereMesh.visible = g < 0.48 && eBlend < 0.35;

      // 月の観察距離では、太陽光線矢印と「☀ 太陽」バッジが白道リングの外側に来るよう滑らかに押し出します。
      const moonBeamFactor = THREE.MathUtils.clamp(
        (curPose.distance - 5.5) / 5.5,
        0,
        1
      );
      sunBeamRoot.position.copy(sunDirWorld).multiplyScalar(2.45 * moonBeamFactor);
      sunBeamRoot.updateMatrixWorld(true);

      graticuleGroup.visible =
        curLayers.graticule && g < 0.45 && eBlend < 0.45 && !isRealSolarSystem;
      celestialCompassGroup.visible =
        curLayers.celestialCompass && isEarthCloseup;
      eclipticLocalGroup.visible =
        curLayers.eclipticPlane &&
        !isOrbitOverview &&
        !isGroundView &&
        !isEclipticSkyView;
      orbitGuideGroup.visible =
        curLayers.eclipticPlane && isSimpleOrbitOverview;
      sunEarthLine.visible =
        (curLayers.eclipticPlane || curLayers.terminatorGuide) &&
        isSimpleOrbitOverview;
      sunGuideGroup.visible =
        curLayers.terminatorGuide &&
        !isOrbitOverview &&
        !isGroundView &&
        !isEclipticSkyView;
      citiesGroup.visible = curLayers.cities && isEarthCloseup;
      equinoxGroup.visible = curLayers.starsAndEquinox && isEarthCloseup;
      starsGroup.visible =
        curLayers.starsAndEquinox || isGroundView || isEclipticSkyView;
      // リアル太陽系モードでも地球の衛星（月）を保持し、遠方全体俯瞰時だけ小さなリングが潰れないよう整理します。
      moonSystemGroup.visible =
        curLayers.moonAndOrbit && (!isRealSolarSystem || curPose.distance < 260);
      moonNodeGroup.visible = !isGroundView && !isEclipticSkyView;
      earthMoonLine.visible =
        !isGroundView && !isEclipticSkyView && !isRealSolarSystem;
      moonEclipticRefRing.visible =
        curLayers.moonAndOrbit && curLayers.eclipticPlane && isMoonView;
      venusOrbitGroup.visible =
        curLayers.venusAndOrbit && isSimpleOrbitOverview;
      venusMesh.visible =
        (curLayers.venusAndOrbit || isRealSolarSystem) &&
        (isOrbitOverview || isGroundView || isEclipticSkyView);
      venusGlowSprite.visible =
        curLayers.venusAndOrbit &&
        ((isGroundView && g > 0.45) || (isEclipticSkyView && eBlend > 0.45));

      // 黄道13星座（天球）と太陽の黄道軌跡の表示・ハイライト更新
      const activeSunZodiac = getZodiacConstellationAtLongitude(
        curSolar.sunEclipticLongitudeDeg
      );
      const groundNightZodiacFactor = isGroundView
        ? THREE.MathUtils.clamp((-tokyoSunElev + 0.08) * 3.5, 0, 1) * 0.72
        : 0;
      const zodiacVisibilityFactor = curLayers.zodiacConstellations
        ? Math.max(eBlend, groundNightZodiacFactor)
        : 0;

      zodiacGroup.visible = zodiacVisibilityFactor > 0.03;
      if (zodiacGroup.visible) {
        eclipticCircleLine.visible = eBlend > 0.15 || curLayers.eclipticPlane;
        eclipticCircleMat.opacity = THREE.MathUtils.lerp(0.32, 0.88, eBlend) * zodiacVisibilityFactor;
        eclipticTicksLines.visible = eBlend > 0.25;
        eclipticTicksMat.opacity = 0.65 * eBlend;
        celEqLine.visible = eBlend > 0.25 && curLayers.graticule;
        celEqMat.opacity = 0.48 * eBlend;
        sunEclipticTrailLine.visible = eBlend > 0.25;
        zodiacStarsMat.opacity = 0.96 * zodiacVisibilityFactor;

        // 太陽が現在通過している星座の線を金色にハイライトします。
        for (const [zId, zEntry] of zodiacConstellationEntries.entries()) {
          const isHost = zId === activeSunZodiac.id && eBlend > 0.25;
          if (isHost) {
            zEntry.lineMat.color.setHex(0xfde68a);
            zEntry.lineMat.opacity = 0.96 * zodiacVisibilityFactor;
          } else if (zEntry.isThirteenth) {
            zEntry.lineMat.color.setHex(0xd8b4fe);
            zEntry.lineMat.opacity = 0.72 * zodiacVisibilityFactor;
          } else {
            zEntry.lineMat.color.setHex(0x7dd3fc);
            zEntry.lineMat.opacity = 0.56 * zodiacVisibilityFactor;
          }
        }

        // 太陽の直近32°の黄道軌跡を更新します。
        if (sunEclipticTrailLine.visible) {
          const trailAttr = sunEclipticTrailGeo.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          const trailRadius = ZODIAC_RADIUS - 0.35;
          for (let i = 0; i <= TRAIL_SEGMENTS; i++) {
            const lonDeg =
              curSolar.sunEclipticLongitudeDeg - (TRAIL_SEGMENTS - i);
            const a = degToRad(lonDeg);
            trailAttr.setXYZ(
              i,
              Math.cos(a) * trailRadius,
              0,
              -Math.sin(a) * trailRadius
            );
          }
          trailAttr.needsUpdate = true;
        }

        // 黄道ビューの天球背景イラストを現在通過中の星座だけ少し明るくします。
        zodiacSkyArtGroup.visible = eBlend > 0.25;
        if (zodiacSkyArtGroup.visible) {
          for (const [zId, art] of zodiacSkyArtMap.entries()) {
            const isHost = zId === activeSunZodiac.id;
            art.mat.opacity = (isHost ? 0.42 : 0.2) * eBlend;
            const sSize = isHost ? 25 : 21;
            art.sprite.scale.set(sSize, sSize, 1);
          }
        }
      } else {
        zodiacSkyArtGroup.visible = false;
      }

      // 東京の地上視点で見えるカシオペア座（W字形・夜空でくっきり表示、昼間も淡く星図確認可能）
      const cassiopeiaNightFactor = isGroundView
        ? THREE.MathUtils.clamp((-tokyoSunElev + 0.14) * 3.2, 0.12, 1.0)
        : 0;
      cassiopeiaGroup.visible = isGroundView && curLayers.starsAndEquinox;
      if (cassiopeiaGroup.visible) {
        cassiopeiaLineMat.opacity = 0.88 * cassiopeiaNightFactor;
        cassiopeiaStarsMat.opacity = 0.98 * cassiopeiaNightFactor;
      }

      // 簡易版「太陽の真上・公転面やや上」視点のとき、外周の黄道13星座イラストメダリオンと「地球 → 太陽 → 星座」視線ガイドを表示します。
      const showSunOverheadZodiac =
        isSimpleOrbitOverview && curLayers.zodiacConstellations;
      sunOverheadZodiacRing.visible = showSunOverheadZodiac;
      sunOverheadZodiacArtGroup.visible = showSunOverheadZodiac;
      earthSunZodiacSightLine.visible = showSunOverheadZodiac;
      if (showSunOverheadZodiac) {
        const sightAttr = earthSunZodiacSightGeo.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        sightAttr.setXYZ(0, earthOrbitPos.x, 0.06, earthOrbitPos.z);
        sightAttr.setXYZ(
          1,
          sunDirWorld.x * 21.4,
          0.06,
          sunDirWorld.z * 21.4
        );
        sightAttr.needsUpdate = true;
        earthSunZodiacSightLine.computeLineDistances();

        for (const [zId, art] of sunOverheadZodiacArtMap.entries()) {
          const isHost = zId === activeSunZodiac.id;
          art.mat.opacity = isHost ? 1.0 : 0.82;
          const sz = isHost ? 6.6 : 5.2;
          art.sprite.scale.set(sz, sz, 1);
        }
      }

      // 簡易版「太陽の真上」視点のとき、月と金星に地球と平行な補助線を表示します。
      const isSunOverhead =
        isSimpleOrbitOverview && curPose.pitch > degToRad(65);

      const showMoonParallel = isSunOverhead && curLayers.moonAndOrbit;
      moonEarthParallel.line.visible = showMoonParallel;
      if (showMoonParallel) {
        const emLen = Math.hypot(moonSpaceLocalPos.x, moonSpaceLocalPos.z) || 1;
        // 地球→月ベクトルに直交（＝地球に対して平行）する水平単位ベクトル
        const px = -moonSpaceLocalPos.z / emLen;
        const pz = moonSpaceLocalPos.x / emLen;
        const halfLen = MOON_RADIUS * moonScale * 2.6;
        const cx = earthOrbitPos.x + moonSpaceLocalPos.x;
        const cy = moonSpaceLocalPos.y + MOON_RADIUS * moonScale + 0.08;
        const cz = earthOrbitPos.z + moonSpaceLocalPos.z;
        const attr = moonEarthParallel.line.geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        attr.setXYZ(0, cx - px * halfLen, cy, cz - pz * halfLen);
        attr.setXYZ(1, cx + px * halfLen, cy, cz + pz * halfLen);
        attr.needsUpdate = true;
      }

      const showVenusParallel = isSunOverhead && curLayers.venusAndOrbit;
      venusEarthParallel.line.visible = showVenusParallel;
      earthVenusSight.line.visible = showVenusParallel;
      if (showVenusParallel) {
        const evX = venusSpacePos.x - earthOrbitPos.x;
        const evZ = venusSpacePos.z - earthOrbitPos.z;
        const evLen = Math.hypot(evX, evZ) || 1;
        // 地球→金星ベクトルに直交（＝地球に対して平行）する水平単位ベクトル
        const px = -evZ / evLen;
        const pz = evX / evLen;
        const halfLen = VENUS_RADIUS * 2.25;
        const cy = venusSpacePos.y + VENUS_RADIUS + 0.08;

        const pAttr = venusEarthParallel.line.geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        pAttr.setXYZ(
          0,
          venusSpacePos.x - px * halfLen,
          cy,
          venusSpacePos.z - pz * halfLen
        );
        pAttr.setXYZ(
          1,
          venusSpacePos.x + px * halfLen,
          cy,
          venusSpacePos.z + pz * halfLen
        );
        pAttr.needsUpdate = true;

        const sAttr = earthVenusSight.line.geometry.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        sAttr.setXYZ(0, earthOrbitPos.x, 0.04, earthOrbitPos.z);
        sAttr.setXYZ(1, venusSpacePos.x, venusSpacePos.y + 0.04, venusSpacePos.z);
        sAttr.needsUpdate = true;
        earthVenusSight.line.computeLineDistances();
      }

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

      // 太陽・地球・月・金星・リアル太陽系の惑星/木星4衛星・春分点・季節・方位ラベルを更新
      const isInnerSolarLabelsVisible =
        !isRealSolarSystem || (!isJupiterFocus && curPose.distance < 260);

      if (isEclipticSkyView) {
        const sunInFront = sunDirWorld.dot(camForward) > 0.12;
        tmpWorldPos
          .copy(sunMesh.position)
          .addScaledVector(camera.up, SUN_RADIUS * sunScale + 0.55);
        updateFloatingBadgeAtPosition(
          sunBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          sunInFront,
          curInspectorOpen,
          false
        );
      } else if (isGroundView) {
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
        tmpWorldPos.copy(camera.up).multiplyScalar(SUN_RADIUS * sunScale + 0.4);
        tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
        updateFloatingBadgeAtPosition(
          sunBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          !isJupiterFocus && tmpToCam.dot(camForward) > 0.1,
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
        (isOrbitOverview && isInnerSolarLabelsVisible) || isMoonView,
        curInspectorOpen,
        false
      );

      if (moonBadgeRef.current) {
        const nextMoonText = isRealSolarSystem
          ? "☾ 月"
          : `☾ 月 (${curMoon.phaseLabelJa})`;
        if (lastMoonBadgeText !== nextMoonText) {
          moonBadgeRef.current.textContent = nextMoonText;
          lastMoonBadgeText = nextMoonText;
        }
      }
      moonMesh.getWorldPosition(tmpWorldPos);
      if (isEclipticSkyView) {
        const moonInFront = moonDirWorld.dot(camForward) > 0.15;
        tmpWorldPos.addScaledVector(camera.up, MOON_RADIUS * moonScale + 0.2);
        updateFloatingBadgeAtPosition(
          moonBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.moonAndOrbit && moonInFront,
          curInspectorOpen,
          false
        );
      } else if (isGroundView) {
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
        tmpWorldPos.addScaledVector(camera.up, MOON_RADIUS + 0.18);
        updateFloatingBadgeAtPosition(
          moonBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.moonAndOrbit &&
            (isMoonView || (isRealSolarSystem && !isJupiterFocus && curPose.distance < 110)),
          curInspectorOpen,
          !isRealSolarSystem
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

      // 金星ラベル（太陽中心の公転ビュー・リアル太陽系内惑星ビュー・東京地上視点・地球から黄道ビュー）
      if (isEclipticSkyView) {
        const venusInFront = venusGeoDirWorld.dot(camForward) > 0.15;
        tmpWorldPos
          .copy(venusMesh.position)
          .addScaledVector(camera.up, 0.6);
        updateFloatingBadgeAtPosition(
          venusBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.venusAndOrbit && venusInFront,
          curInspectorOpen,
          false
        );
      } else if (isGroundView) {
        const venusInFront = venusGeoDirWorld.dot(camForward) > 0.14;
        const venusAboveHorizon = venusGeoDirWorld.dot(tokyoUpWorld) > -0.02;
        tmpWorldPos
          .copy(venusMesh.position)
          .addScaledVector(camera.up, 1.45);
        updateFloatingBadgeAtPosition(
          venusBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          curLayers.venusAndOrbit && venusInFront && venusAboveHorizon,
          curInspectorOpen,
          false
        );
      } else {
        tmpWorldPos
          .copy(venusMesh.position)
          .addScaledVector(camera.up, VENUS_RADIUS + 0.25);
        updateFloatingBadgeAtPosition(
          venusBadgeRef.current,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          (curLayers.venusAndOrbit || isRealSolarSystem) &&
            isOrbitOverview &&
            isInnerSolarLabelsVisible,
          curInspectorOpen,
          false
        );
      }

      // リアル太陽系モードの追加7惑星（水星・火星・木星・土星・天王星・海王星・冥王星）ラベル
      for (const id of extraPlanetIds) {
        const el = planetBadgeRefs.current.get(id) ?? null;
        const entry = extraPlanetMap.get(id);
        if (!el || !entry) continue;

        const isInner = id === "mercury" || id === "mars";
        const shouldShow =
          isRealSolarSystem &&
          (isJupiterFocus
            ? id === "jupiter"
            : isInner
            ? curPose.distance < 260
            : true);

        entry.root.getWorldPosition(tmpWorldPos);
        tmpWorldPos.addScaledVector(
          camera.up,
          entry.root.scale.x * (id === "saturn" ? 1.55 : 1.15) + 0.4
        );
        tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
        updateFloatingBadgeAtPosition(
          el,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          shouldShow && tmpToCam.dot(camForward) > 0.1,
          curInspectorOpen,
          false
        );
      }

      // 木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）ラベル
      const showGalileanBadges =
        isRealSolarSystem && (isJupiterFocus || curPose.distance < 120);
      for (const gm of GALILEAN_MOONS) {
        const el = galileanBadgeRefs.current.get(gm.id) ?? null;
        const mEntry = jupiterGalileanMeshes.get(gm.id);
        if (!el || !mEntry) continue;
        mEntry.mesh.getWorldPosition(tmpWorldPos);
        tmpWorldPos.addScaledVector(camera.up, 0.55);
        tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
        updateFloatingBadgeAtPosition(
          el,
          tmpWorldPos,
          camera,
          hostW,
          hostH,
          showGalileanBadges && tmpToCam.dot(camForward) > 0.12,
          curInspectorOpen,
          false
        );
      }

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
            isSimpleOrbitOverview && curLayers.eclipticPlane,
            curInspectorOpen,
            false
          );
        }
      }

      // 東京地上視点時のカシオペア座（W字形）ラベル
      tmpWorldPos
        .copy(cassiopeiaGroup.position)
        .addScaledVector(cassiopeiaLabelUnitDir, ZODIAC_RADIUS);
      const casInFront = cassiopeiaLabelUnitDir.dot(camForward) > 0.16;
      const casAboveHorizon = cassiopeiaLabelUnitDir.dot(tokyoUpWorld) > 0.02;
      updateFloatingBadgeAtPosition(
        cassiopeiaBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        isGroundView &&
          curLayers.starsAndEquinox &&
          casInFront &&
          casAboveHorizon,
        curInspectorOpen,
        false
      );

      // 黄道13星座（黄道12星座＋へびつかい座）ラベルを更新（地球から黄道ビュー＆東京の夜空・年周運動観察）
      // ※ 太陽の真上・公転面やや上では外周にイラストメダリオン（星座名入り）を配置するためテキストバッジは重ねません。
      const showGroundNightZodiacBadges =
        isGroundView && curLayers.zodiacConstellations && tokyoSunElev < 0.04;
      for (const c of ZODIAC_CONSTELLATIONS) {
        const el = zodiacBadgeRefs.current.get(c.id) ?? null;
        const entry = zodiacConstellationEntries.get(c.id);
        if (!el || !entry) continue;

        const isHost = c.id === activeSunZodiac.id && !isGroundView;
        el.classList.toggle("is-sun-host", isHost);

        if (isEclipticSkyView && curLayers.zodiacConstellations) {
          tmpWorldPos
            .copy(zodiacGroup.position)
            .addScaledVector(entry.labelUnitDir, ZODIAC_RADIUS);
          const inFront = entry.labelUnitDir.dot(camForward) > 0.14;
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            inFront,
            curInspectorOpen,
            false
          );
        } else if (showGroundNightZodiacBadges) {
          tmpWorldPos
            .copy(zodiacGroup.position)
            .addScaledVector(entry.labelUnitDir, ZODIAC_RADIUS);
          const inFront = entry.labelUnitDir.dot(camForward) > 0.18;
          const aboveHorizon = entry.labelUnitDir.dot(tokyoUpWorld) > 0.04;
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            inFront && aboveHorizon,
            curInspectorOpen,
            false
          );
        } else {
          el.style.display = "none";
        }
      }

      // 黄道上の4つの季節点（春分点 0° / 夏至点 90° / 秋分点 180° / 冬至点 270°）ラベル
      for (const cp of ECLIPTIC_CARDINAL_POINTS) {
        const el = eclipticCardinalBadgeRefs.current.get(cp.id) ?? null;
        if (!el) continue;
        if (isEclipticSkyView && curLayers.zodiacConstellations) {
          const [ux, uy, uz] = eclipticToWorldUnitVector(cp.lonDeg, -4.8);
          tmpWorldPos
            .copy(zodiacGroup.position)
            .add(tmpToCam.set(ux, uy, uz).multiplyScalar(ZODIAC_RADIUS));
          const dirDot = ux * camForward.x + uy * camForward.y + uz * camForward.z;
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            dirDot > 0.16,
            curInspectorOpen,
            false
          );
        } else {
          el.style.display = "none";
        }
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("contextmenu", onContextMenu);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      textures.dispose();
      moonTexture.dispose();
      venusTexture.dispose();
      planetTextures.dispose();
      zodiacArtBundle.dispose();
      starTexture.dispose();
      earthBundle.material.dispose();
      atmosphereBundle.material.dispose();
      moonBundle.material.dispose();
      venusBundle.material.dispose();
      venusGlowMat.dispose();
      moonEarthParallel.line.geometry.dispose();
      moonEarthParallel.mat.dispose();
      venusEarthParallel.line.geometry.dispose();
      venusEarthParallel.mat.dispose();
      earthVenusSight.line.geometry.dispose();
      earthVenusSight.mat.dispose();
      for (const mat of realOrbitMaterials) mat.dispose();
      for (const entry of extraPlanetMap.values()) entry.material.dispose();
      for (const mat of extraDisposableMaterials) mat.dispose();
      for (const geo of zodiacDisposableGeos) geo.dispose();
      for (const mat of zodiacDisposableMats) mat.dispose();
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
          ref={venusBadgeRef}
          className="space-badge is-venus"
          style={{ display: "none" }}
        >
          ♀ 金星
        </span>

        {SOLAR_SYSTEM_ELEMENTS.filter(
          (el) => el.id !== "earth" && el.id !== "venus"
        ).map((el) => (
          <span
            key={el.id}
            ref={(node) => {
              if (node) {
                planetBadgeRefs.current.set(el.id, node);
              } else {
                planetBadgeRefs.current.delete(el.id);
              }
            }}
            className="space-badge is-planet"
            style={{
              display: "none",
              borderColor: `${el.accentColor}99`,
              color: el.accentColor,
            }}
          >
            {el.symbol} {el.nameJa}
          </span>
        ))}

        {GALILEAN_MOONS.map((gm) => (
          <span
            key={gm.id}
            ref={(node) => {
              if (node) {
                galileanBadgeRefs.current.set(gm.id, node);
              } else {
                galileanBadgeRefs.current.delete(gm.id);
              }
            }}
            className="space-badge is-satellite"
            style={{
              display: "none",
              borderColor: `${gm.color}88`,
              color: gm.color,
            }}
          >
            ◦ {gm.nameJa}
          </span>
        ))}

        <span
          ref={polarisBadgeRef}
          className="space-badge is-polaris"
          style={{ display: "none" }}
        >
          ★ 北極星 (高度 35.7°)
        </span>

        <span
          ref={cassiopeiaBadgeRef}
          className="space-badge is-polaris"
          style={{ display: "none" }}
        >
          ★ カシオペア座 (W字)
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

        {ZODIAC_CONSTELLATIONS.map((c) => (
          <span
            key={c.id}
            ref={(el) => {
              if (el) {
                zodiacBadgeRefs.current.set(c.id, el);
              } else {
                zodiacBadgeRefs.current.delete(c.id);
              }
            }}
            className={`space-badge is-zodiac ${
              c.isThirteenth ? "is-thirteenth" : ""
            }`}
            style={{ display: "none" }}
          >
            {c.symbol} {c.nameJa}
            {c.isThirteenth ? " (13)" : ""}
          </span>
        ))}

        {ECLIPTIC_CARDINAL_POINTS.map((cp) => (
          <span
            key={cp.id}
            ref={(el) => {
              if (el) {
                eclipticCardinalBadgeRefs.current.set(cp.id, el);
              } else {
                eclipticCardinalBadgeRefs.current.delete(cp.id);
              }
            }}
            className="space-badge is-ecliptic-cardinal"
            style={{ display: "none" }}
          >
            {cp.labelJa}
          </span>
        ))}
      </div>
    </div>
  );
};
