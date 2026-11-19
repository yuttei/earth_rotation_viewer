import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  City,
  DisplayLayers,
  GalileanMoonState,
  MoonState,
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
  SOUTHERN_CROSS_CONSTELLATION,
  ZODIAC_CONSTELLATIONS,
  ZodiacConstellationId,
  eclipticToWorldUnitVector,
  getZodiacConstellationAtLongitude,
} from "../astronomy/zodiac";
import { CelestialBodyId } from "../data/celestialBodies";
import {
  FEATURED_BRIGHT_STARS,
  FEATURED_STAR_MAP,
  FeaturedStarId,
  SEASONAL_ASTERISMS,
  SEASONAL_CONSTELLATIONS,
} from "../astronomy/seasonalStars";
import {
  COSMIC_BADGE_SPECS,
  CosmicBadgeId,
  createCosmicScaleRig,
} from "./cosmicScale";
import {
  IMPACTOR_MAP,
  ImpactorId,
  SOLAR_TARGET_SPECS,
  SolarImpactTargetId,
} from "../astronomy/impactPhysics";
import {
  ImpactFrameOutput,
  ImpactSimPhase,
  ImpactSystemRig,
  SolarBaselineBodyInput,
  createImpactSystemRig,
} from "./impactSystem";
import { createEarthTextures, EarthTextures } from "./earthTexture";
import { createMoonTexture } from "./moonTexture";
import { createVenusTexture } from "./venusTexture";
import { createSolarPlanetTextures } from "./planetTextures";
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
  /** 銀河・大規模構造スケール段階（0 = 太陽系まで, 1 = 近傍恒星, 2 = 天の川銀河, 3 = 天の川＆アンドロメダ, 4 = 局部銀河群, 5 = おとめ座銀河団, 6 = ラニアケア超銀河団, 7 = 観測可能な宇宙） */
  cosmicLevel: number;
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
  /** 目標カメラ姿勢（プリセット・連続スライダーから渡されます） */
  cameraPoseTarget: CameraPoseTarget;
  /** 手動ドラッグ時にプリセット選択表示を解除するための通知 */
  onCameraUserDrag: () => void;
  /** 3D補助レイヤーのON/OFF設定 */
  layers: DisplayLayers;
  /** 右側の観察パネルが開いているか（地球・軌道の水平センタリングを補正するため） */
  isInspectorOpen: boolean;
  /** タップしてクローズアップ表示中の天体ID（未選択なら null） */
  focusedBodyId: CelestialBodyId | null;
  /** 3D空間上の天体または天体ラベルをタップしたときのコールバック */
  onSelectCelestialBody: (bodyId: CelestialBodyId) => void;
  /** 天体衝突シミュレーターで選択中の天体（未選択なら null ＝ 通常のカメラ操作） */
  activeImpactorId: ImpactorId | null;
  /** 「すぐ復活」ボタンが押されるたびに増える連番（0 は未操作） */
  restoreImpactSeq: number;
  /** 衝突シミュレーターの状態（飛行中・爆発中・復活中など）が変わったときの通知 */
  onImpactStatusChange?: (status: ImpactStatus) => void;
}

/**
 * カメラの視点がリアル太陽系モード（太陽系の俯瞰。地上・地球中心の黄道ビュー・宇宙スケールではない）かを判定します。
 * 天体衝突シミュレーターはこのモード専用なので、App（狙うモードの ON/OFF）とキャンバス（狙いの開始・リセット）の両方がこの1つの判定を使います。
 */
export function isRealSolarSystemPose(pose: {
  solarSystemBlend: number;
  groundBlend: number;
  eclipticViewBlend: number;
  cosmicLevel: number;
}): boolean {
  return (
    pose.solarSystemBlend > 0.5 &&
    pose.groundBlend < 0.5 &&
    pose.eclipticViewBlend < 0.5 &&
    pose.cosmicLevel < 0.5
  );
}

/** 画面上部の発射モード表示に使う、衝突シミュレーターの現在状態 */
export interface ImpactStatus {
  phase: ImpactSimPhase;
  labelJa: string;
  canRestore: boolean;
  /** 今置かれている投入天体の数 */
  liveImpactorCount: number;
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
  cosmicLevel: number;
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
  badgeEl: HTMLElement | null,
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
  cameraPoseTarget,
  onCameraUserDrag,
  layers,
  isInspectorOpen,
  focusedBodyId,
  onSelectCelestialBody,
  activeImpactorId,
  restoreImpactSeq,
  onImpactStatusChange,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // 衝突の瞬間に画面全体を光らせるフラッシュ用の要素（React の再描画なしで直接 style を更新します）
  const impactFlashRef = useRef<HTMLDivElement | null>(null);
  // 衝突シミュレーターの 3D 演出リグ（Three.js のセットアップ内で生成して保持します）
  const impactRigRef = useRef<ImpactSystemRig | null>(null);
  const labelButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const seasonBadgeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const compassBadgeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());
  const planetBadgeRefs = useRef<Map<SolarBodyId, HTMLButtonElement>>(
    new Map()
  );
  const galileanBadgeRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const zodiacBadgeRefs = useRef<Map<ZodiacConstellationId, HTMLSpanElement>>(
    new Map()
  );
  const eclipticCardinalBadgeRefs = useRef<Map<string, HTMLSpanElement>>(
    new Map()
  );
  const cosmicBadgeRefs = useRef<Map<CosmicBadgeId, HTMLElement>>(new Map());
  const seasonalConstellationBadgeRefs = useRef<Map<string, HTMLSpanElement>>(
    new Map()
  );
  const seasonalAsterismBadgeRefs = useRef<Map<string, HTMLSpanElement>>(
    new Map()
  );
  const featuredStarBadgeRefs = useRef<Map<FeaturedStarId, HTMLButtonElement>>(
    new Map()
  );
  const sunBadgeRef = useRef<HTMLButtonElement | null>(null);
  const earthBadgeRef = useRef<HTMLButtonElement | null>(null);
  const moonBadgeRef = useRef<HTMLButtonElement | null>(null);
  const venusBadgeRef = useRef<HTMLButtonElement | null>(null);
  const polarisBadgeRef = useRef<HTMLSpanElement | null>(null);
  const cassiopeiaBadgeRef = useRef<HTMLSpanElement | null>(null);
  const southernCrossBadgeRef = useRef<HTMLSpanElement | null>(null);

  const latestPropsRef = useRef({
    solarState,
    moonState,
    venusState,
    solarSystemBodies,
    galileanMoons,
    cities,
    selectedCityId,
    layers,
    isInspectorOpen,
    focusedBodyId,
    onSelectCelestialBody,
    activeImpactorId,
    onImpactStatusChange,
  });
  latestPropsRef.current = {
    solarState,
    moonState,
    venusState,
    solarSystemBodies,
    galileanMoons,
    cities,
    selectedCityId,
    layers,
    isInspectorOpen,
    focusedBodyId,
    onSelectCelestialBody,
    activeImpactorId,
    onImpactStatusChange,
  };

  // 「すぐ復活」ボタンが押されたら、置いた天体をすべて消し、太陽系の全天体をぬるっと元通りにする演出を始めます。
  useEffect(() => {
    if (restoreImpactSeq > 0) {
      impactRigRef.current?.triggerSmoothRestore();
    }
  }, [restoreImpactSeq]);

  // 「視点移動」モードに切り替えたら、ドラッグ途中の予測軌道プレビューのみ消します（飛行・爆発演出はそのまま継続）。
  useEffect(() => {
    if (activeImpactorId === null) {
      impactRigRef.current?.cancelAimPreview();
    }
  }, [activeImpactorId]);

  // 天体タップ時の滑らかなズームイン／ズームアウト（および閉じたときの元の視点への復帰）を管理します。
  const bodyFocusRef = useRef<{
    activeId: CelestialBodyId | null;
    blend: number;
    fromBlend: number;
    targetBlend: number;
    elapsed: number;
    duration: number;
    transitioning: boolean;
    orbitYaw: number;
    orbitPitch: number;
    zoomFactor: number;
    switchElapsed: number;
    switchDuration: number;
    switching: boolean;
    switchFromPos: THREE.Vector3;
    switchFromRadius: number;
    lastFocusPos: THREE.Vector3;
    lastFocusRadius: number;
  }>({
    activeId: null,
    blend: 0,
    fromBlend: 0,
    targetBlend: 0,
    elapsed: 0,
    duration: 1.3,
    transitioning: false,
    orbitYaw: 0.45,
    orbitPitch: 0.24,
    zoomFactor: 1.0,
    switchElapsed: 0,
    switchDuration: 1.1,
    switching: false,
    switchFromPos: new THREE.Vector3(),
    switchFromRadius: 1,
    lastFocusPos: new THREE.Vector3(),
    lastFocusRadius: 1,
  });

  useEffect(() => {
    const f = bodyFocusRef.current;
    if (focusedBodyId) {
      if (f.blend > 0.05 && f.activeId && f.activeId !== focusedBodyId) {
        // 別の天体へ直接切り替えたときは、現在のフォーカス位置から次の天体へ滑らかに移動します。
        f.switchFromPos.copy(f.lastFocusPos);
        f.switchFromRadius = f.lastFocusRadius;
        f.switchElapsed = 0;
        f.switchDuration = 1.1;
        f.switching = true;
      } else {
        f.switching = false;
      }
      f.activeId = focusedBodyId;
      f.fromBlend = f.blend;
      f.targetBlend = 1;
      f.elapsed = 0;
      f.duration = 1.3;
      f.transitioning = true;
      const isCosmicFocus =
        focusedBodyId === "milkyWay" ||
        focusedBodyId === "andromeda" ||
        focusedBodyId === "triangulum" ||
        focusedBodyId === "magellanicClouds" ||
        focusedBodyId === "localGroup" ||
        focusedBodyId === "virgoCluster" ||
        focusedBodyId === "fornaxCluster" ||
        focusedBodyId === "comaCluster" ||
        focusedBodyId === "greatAttractor" ||
        focusedBodyId === "laniakea" ||
        focusedBodyId === "observableUniverse";
      f.orbitYaw = isCosmicFocus ? 0.36 : 0.48;
      f.orbitPitch = isCosmicFocus ? 0.48 : 0.24;
      f.zoomFactor = 1.0;
    } else if (f.activeId !== null) {
      // 詳細カードを閉じたときは、直前の元のカメラ視点へ滑らかに戻します。
      f.fromBlend = f.blend;
      f.targetBlend = 0;
      f.elapsed = 0;
      f.duration = 1.2;
      f.transitioning = true;
      f.switching = false;
    }
  }, [focusedBodyId]);

  // カメラの現在値とアニメーション遷移管理を保持します。
  const cameraAnimRef = useRef<{
    current: CameraSnapshot;
    from: CameraSnapshot;
    to: CameraPoseTarget;
    elapsed: number;
    duration: number;
    active: boolean;
    /** 太陽系（cosmicLevel = 0）側の基準距離。太陽系⇄宇宙階層遷移時の距離変化を相殺して純粋なズームアウト／ズームインにします */
    solarRefDist: number;
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
      cosmicLevel: cameraPoseTarget.cosmicLevel,
      rightAngle: degToRad(solarState.sunEclipticLongitudeDeg),
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
      cosmicLevel: cameraPoseTarget.cosmicLevel,
      rightAngle: degToRad(solarState.sunEclipticLongitudeDeg),
    },
    to: { ...cameraPoseTarget },
    elapsed: 0,
    duration: cameraPoseTarget.durationSec,
    active: false,
    solarRefDist: cameraPoseTarget.distance,
  });

  // 目標姿勢が更新されたら、現在位置を始点として新しい連続補間を開始します。
  useEffect(() => {
    const anim = cameraAnimRef.current;
    anim.from = { ...anim.current };
    anim.to = { ...cameraPoseTarget };
    if (anim.from.cosmicLevel < 0.05 && anim.to.cosmicLevel >= 0.5) {
      anim.solarRefDist = Math.max(1.5, anim.from.distance);
    } else if (anim.from.cosmicLevel >= 0.5 && anim.to.cosmicLevel < 0.05) {
      anim.solarRefDist = Math.max(1.5, anim.to.distance);
    } else if (anim.to.cosmicLevel < 0.05) {
      anim.solarRefDist = Math.max(1.5, anim.to.distance);
    }
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
    cameraPoseTarget.cosmicLevel,
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

    // 2b. 近傍恒星・銀河・局部銀河群・おとめ座銀河団・ラニアケア・観測可能な宇宙の 7 段階コズミック・スケール構築
    const cosmicRig = createCosmicScaleRig(starTexture);
    scene.add(cosmicRig.root);

    // 2c. 太陽系全体を束ねるルートグループ（太陽系→近傍恒星・銀河へ遷移するとき、太陽系全体を滑らかに縮小ズームアウトさせます）
    const solarWorldGroup = new THREE.Group();
    scene.add(solarWorldGroup);

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

    // 太陽の真上・公転面（やや上）視点用：公転軌道の外周（3D天球面・半径 24.5）に黄道13星座の「星とその点を結ぶ星座線」を実配置
    const SUN_ORBIT_ZODIAC_RADIUS = 24.5;
    const sunOverheadZodiacRing = createHorizontalRing(
      SUN_ORBIT_ZODIAC_RADIUS,
      0x94a3b8,
      0.28,
      128
    );
    solarWorldGroup.add(sunOverheadZodiacRing);
    zodiacDisposableGeos.push(sunOverheadZodiacRing.geometry);
    zodiacDisposableMats.push(sunOverheadZodiacRing.material as THREE.Material);

    const sunOverheadZodiacGroup = new THREE.Group();
    solarWorldGroup.add(sunOverheadZodiacGroup);
    const sunOverheadZodiacLineMap = new Map<
      ZodiacConstellationId,
      {
        lineMat: THREE.LineBasicMaterial;
        isThirteenth: boolean;
      }
    >();

    const orbitZodiacStarCoords: number[] = [];
    const orbitZodiacStarCols: number[] = [];
    const starDotGeo = new THREE.SphereGeometry(0.16, 10, 10);
    zodiacDisposableGeos.push(starDotGeo);

    for (const c of ZODIAC_CONSTELLATIONS) {
      const orbitStarVecs: THREE.Vector3[] = [];
      for (const st of c.stars) {
        const [ux, uy, uz] = eclipticToWorldUnitVector(st.lonDeg, st.latDeg);
        const v = new THREE.Vector3(
          ux * SUN_ORBIT_ZODIAC_RADIUS,
          uy * SUN_ORBIT_ZODIAC_RADIUS,
          uz * SUN_ORBIT_ZODIAC_RADIUS
        );
        orbitStarVecs.push(v);
        orbitZodiacStarCoords.push(v.x, v.y, v.z);

        const lum = THREE.MathUtils.clamp(1.18 - st.mag * 0.14, 0.58, 1.0);
        let starHex = 0xe0f2fe;
        if (c.isThirteenth) {
          orbitZodiacStarCols.push(0.95 * lum, 0.78 * lum, 1.0 * lum);
          starHex = 0xf3e8ff;
        } else if (st.nameJa === "アンタレス" || st.nameJa === "アルデバラン") {
          orbitZodiacStarCols.push(1.0 * lum, 0.68 * lum, 0.45 * lum);
          starHex = 0xfdba74;
        } else {
          orbitZodiacStarCols.push(0.9 * lum, 0.96 * lum, 1.0 * lum);
        }

        // 3D空間上の「星（点）」としてどの角度からも位置が分かる小さな発光球を配置
        const dotMat = new THREE.MeshBasicMaterial({ color: starHex });
        zodiacDisposableMats.push(dotMat);
        const dotMesh = new THREE.Mesh(starDotGeo, dotMat);
        dotMesh.position.copy(v);
        const dotScale = THREE.MathUtils.clamp(1.38 - st.mag * 0.16, 0.72, 1.35);
        dotMesh.scale.setScalar(dotScale);
        sunOverheadZodiacGroup.add(dotMesh);
      }

      const orbitEdgePts: THREE.Vector3[] = [];
      for (const [aIdx, bIdx] of c.edges) {
        if (orbitStarVecs[aIdx] && orbitStarVecs[bIdx]) {
          orbitEdgePts.push(orbitStarVecs[aIdx], orbitStarVecs[bIdx]);
        }
      }
      const orbitLineGeo = new THREE.BufferGeometry().setFromPoints(
        orbitEdgePts
      );
      const orbitLineMat = new THREE.LineBasicMaterial({
        color: c.isThirteenth ? 0xd8b4fe : 0x7dd3fc,
        transparent: true,
        opacity: c.isThirteenth ? 0.85 : 0.75,
      });
      const orbitSegs = new THREE.LineSegments(orbitLineGeo, orbitLineMat);
      sunOverheadZodiacGroup.add(orbitSegs);
      zodiacDisposableGeos.push(orbitLineGeo);
      zodiacDisposableMats.push(orbitLineMat);

      sunOverheadZodiacLineMap.set(c.id, {
        lineMat: orbitLineMat,
        isThirteenth: c.isThirteenth,
      });
    }

    const orbitZodiacStarsGeo = new THREE.BufferGeometry();
    orbitZodiacStarsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(orbitZodiacStarCoords, 3)
    );
    orbitZodiacStarsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(orbitZodiacStarCols, 3)
    );
    const orbitZodiacStarsMat = new THREE.PointsMaterial({
      size: 1.85,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const orbitZodiacStarsPoints = new THREE.Points(
      orbitZodiacStarsGeo,
      orbitZodiacStarsMat
    );
    sunOverheadZodiacGroup.add(orbitZodiacStarsPoints);
    zodiacDisposableGeos.push(orbitZodiacStarsGeo);
    zodiacDisposableMats.push(orbitZodiacStarsMat);

    const earthSunZodiacSightGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.06, 0),
      new THREE.Vector3(SUN_ORBIT_ZODIAC_RADIUS, 0.06, 0),
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
    solarWorldGroup.add(earthSunZodiacSightLine);
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

    // 2.7 南半球（シドニー・南極点）の南の空で見える「南十字星（みなみじゅうじ座 / Crux）」（十字形・J2000.0 実座標）
    const southernCrossGroup = new THREE.Group();
    scene.add(southernCrossGroup);
    const scStarVecs: THREE.Vector3[] = [];
    const scStarCoords: number[] = [];
    const scStarCols: number[] = [];
    for (const st of SOUTHERN_CROSS_CONSTELLATION.stars) {
      const [ux, uy, uz] = eclipticToWorldUnitVector(st.lonDeg, st.latDeg);
      const v = new THREE.Vector3(
        ux * ZODIAC_RADIUS,
        uy * ZODIAC_RADIUS,
        uz * ZODIAC_RADIUS
      );
      scStarVecs.push(v);
      scStarCoords.push(v.x, v.y, v.z);
      // 上端のガクルックス（γ Cru）は赤色巨星のため暖かなオレンジ色、他は青白色で描画します。
      if (st.nameJa === "ガクルックス") {
        scStarCols.push(1.0, 0.72, 0.44);
      } else {
        scStarCols.push(0.9, 0.96, 1.0);
      }
    }
    const scEdgePts: THREE.Vector3[] = [];
    for (const [a, b] of SOUTHERN_CROSS_CONSTELLATION.edges) {
      if (scStarVecs[a] && scStarVecs[b]) {
        scEdgePts.push(scStarVecs[a], scStarVecs[b]);
      }
    }
    const scLineGeo = new THREE.BufferGeometry().setFromPoints(scEdgePts);
    const scLineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.92,
    });
    const scLines = new THREE.LineSegments(scLineGeo, scLineMat);
    scLines.renderOrder = 2;
    southernCrossGroup.add(scLines);
    zodiacDisposableGeos.push(scLineGeo);
    zodiacDisposableMats.push(scLineMat);

    const scStarsGeo = new THREE.BufferGeometry();
    scStarsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(scStarCoords, 3)
    );
    scStarsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(scStarCols, 3)
    );
    const scStarsMat = new THREE.PointsMaterial({
      size: 5.2,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const scStarsPoints = new THREE.Points(scStarsGeo, scStarsMat);
    scStarsPoints.renderOrder = 2;
    southernCrossGroup.add(scStarsPoints);
    zodiacDisposableGeos.push(scStarsGeo);
    zodiacDisposableMats.push(scStarsMat);

    const [sclx, scly, sclz] = eclipticToWorldUnitVector(
      SOUTHERN_CROSS_CONSTELLATION.labelPoint.lonDeg,
      SOUTHERN_CROSS_CONSTELLATION.labelPoint.latDeg
    );
    const southernCrossLabelUnitDir = new THREE.Vector3(
      sclx,
      scly,
      sclz
    ).normalize();

    // 2.8 四季の星座（北斗七星・オリオン座・おおいぬ座・はくちょう座・ペガスス座等）・大三角／四辺形・主要15恒星（J2000.0実座標）
    const seasonalSkyGroup = new THREE.Group();
    scene.add(seasonalSkyGroup);
    const seasonalFadeMats: Array<{ mat: THREE.Material; baseOpacity: number }> =
      [];
    const seasonalConstellationLabelDirs = new Map<string, THREE.Vector3>();
    const seasonalAsterismLabelDirs = new Map<string, THREE.Vector3>();
    const seasonalBrightStarMeshes = new Map<FeaturedStarId, THREE.Mesh>();

    // 四季の12星座の星と星座線
    const seasonalConstStarCoords: number[] = [];
    const seasonalConstStarCols: number[] = [];
    const seasonalConstEdgePts: THREE.Vector3[] = [];
    const tmpStarColor = new THREE.Color();

    for (const sc of SEASONAL_CONSTELLATIONS) {
      const vecs: THREE.Vector3[] = [];
      for (const st of sc.stars) {
        const [ux, uy, uz] = eclipticToWorldUnitVector(st.lonDeg, st.latDeg);
        const v = new THREE.Vector3(
          ux * ZODIAC_RADIUS,
          uy * ZODIAC_RADIUS,
          uz * ZODIAC_RADIUS
        );
        vecs.push(v);
        seasonalConstStarCoords.push(v.x, v.y, v.z);
        tmpStarColor.set(st.colorHex ?? "#e2e8f0");
        seasonalConstStarCols.push(
          tmpStarColor.r,
          tmpStarColor.g,
          tmpStarColor.b
        );
      }
      for (const [a, b] of sc.edges) {
        if (vecs[a] && vecs[b]) {
          seasonalConstEdgePts.push(vecs[a], vecs[b]);
        }
      }
      const [lx, ly, lz] = eclipticToWorldUnitVector(
        sc.labelPoint.lonDeg,
        sc.labelPoint.latDeg
      );
      seasonalConstellationLabelDirs.set(
        sc.id,
        new THREE.Vector3(lx, ly, lz).normalize()
      );
    }

    const seasonalConstLineGeo = new THREE.BufferGeometry().setFromPoints(
      seasonalConstEdgePts
    );
    const seasonalConstLineMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    });
    const seasonalConstLines = new THREE.LineSegments(
      seasonalConstLineGeo,
      seasonalConstLineMat
    );
    seasonalConstLines.renderOrder = 2;
    seasonalSkyGroup.add(seasonalConstLines);
    zodiacDisposableGeos.push(seasonalConstLineGeo);
    zodiacDisposableMats.push(seasonalConstLineMat);
    seasonalFadeMats.push({ mat: seasonalConstLineMat, baseOpacity: 0.44 });

    const seasonalConstStarsGeo = new THREE.BufferGeometry();
    seasonalConstStarsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(seasonalConstStarCoords, 3)
    );
    seasonalConstStarsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(seasonalConstStarCols, 3)
    );
    const seasonalConstStarsMat = new THREE.PointsMaterial({
      size: 4.1,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const seasonalConstStarsPoints = new THREE.Points(
      seasonalConstStarsGeo,
      seasonalConstStarsMat
    );
    seasonalConstStarsPoints.renderOrder = 2;
    seasonalSkyGroup.add(seasonalConstStarsPoints);
    zodiacDisposableGeos.push(seasonalConstStarsGeo);
    zodiacDisposableMats.push(seasonalConstStarsMat);
    seasonalFadeMats.push({ mat: seasonalConstStarsMat, baseOpacity: 0.92 });

    // 春夏秋冬の大三角・四辺形・春の大曲線・冬のダイヤモンドの強調ライン
    const ASTERISM_RADIUS = ZODIAC_RADIUS - 0.35;
    for (const ast of SEASONAL_ASTERISMS) {
      const verts = ast.vertices.map((v) => {
        const [ux, uy, uz] = eclipticToWorldUnitVector(v.lonDeg, v.latDeg);
        return new THREE.Vector3(
          ux * ASTERISM_RADIUS,
          uy * ASTERISM_RADIUS,
          uz * ASTERISM_RADIUS
        );
      });
      const segPts: THREE.Vector3[] = [];
      for (const [a, b] of ast.edges) {
        if (verts[a] && verts[b]) {
          segPts.push(verts[a], verts[b]);
        }
      }
      const astGeo = new THREE.BufferGeometry().setFromPoints(segPts);
      const baseOp = ast.dashed ? 0.54 : 0.78;
      const astMat = ast.dashed
        ? new THREE.LineDashedMaterial({
            color: new THREE.Color(ast.colorHex),
            dashSize: 2.2,
            gapSize: 1.5,
            transparent: true,
            opacity: baseOp,
            depthWrite: false,
          })
        : new THREE.LineBasicMaterial({
            color: new THREE.Color(ast.colorHex),
            transparent: true,
            opacity: baseOp,
            depthWrite: false,
          });
      const astLine = new THREE.LineSegments(astGeo, astMat);
      if (ast.dashed) {
        astLine.computeLineDistances();
      }
      astLine.renderOrder = 2;
      seasonalSkyGroup.add(astLine);
      zodiacDisposableGeos.push(astGeo);
      zodiacDisposableMats.push(astMat);
      seasonalFadeMats.push({ mat: astMat, baseOpacity: baseOp });

      const [alx, aly, alz] = eclipticToWorldUnitVector(
        ast.labelPoint.lonDeg,
        ast.labelPoint.latDeg
      );
      seasonalAsterismLabelDirs.set(
        ast.id,
        new THREE.Vector3(alx, aly, alz).normalize()
      );
    }

    // 代表15恒星（シリウス・ベテルギウス・ベガ等）の3D発光球＋コロナスプライト（実等級＆スペクトル色・タップ選択対応）
    const BRIGHT_STAR_RADIUS = ZODIAC_RADIUS - 0.85;
    const brightStarCoreGeo = new THREE.SphereGeometry(1.0, 32, 24);
    zodiacDisposableGeos.push(brightStarCoreGeo);

    for (const star of FEATURED_BRIGHT_STARS) {
      const [ux, uy, uz] = star.unitDir;
      const pos = new THREE.Vector3(
        ux * BRIGHT_STAR_RADIUS,
        uy * BRIGHT_STAR_RADIUS,
        uz * BRIGHT_STAR_RADIUS
      );
      const starCol = new THREE.Color(star.colorHex);
      const magBoost = THREE.MathUtils.clamp((2.4 - star.mag) / 3.8, 0.28, 1.0);
      const coreScale = 0.52 + magBoost * 0.65;
      const haloScale = 4.2 + magBoost * 5.8;

      const coreMat = new THREE.MeshBasicMaterial({
        color: starCol,
        transparent: true,
        opacity: 0.98,
      });
      const coreMesh = new THREE.Mesh(brightStarCoreGeo, coreMat);
      coreMesh.position.copy(pos);
      coreMesh.scale.setScalar(coreScale);
      coreMesh.renderOrder = 2;
      seasonalSkyGroup.add(coreMesh);
      seasonalBrightStarMeshes.set(star.id, coreMesh);
      zodiacDisposableMats.push(coreMat);
      seasonalFadeMats.push({ mat: coreMat, baseOpacity: 0.98 });

      const haloMat = new THREE.SpriteMaterial({
        map: starTexture,
        color: starCol,
        transparent: true,
        opacity: 0.94,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const haloSprite = new THREE.Sprite(haloMat);
      haloSprite.position.copy(pos);
      haloSprite.scale.setScalar(haloScale);
      haloSprite.renderOrder = 2;
      seasonalSkyGroup.add(haloSprite);
      zodiacDisposableMats.push(haloMat);
      seasonalFadeMats.push({ mat: haloMat, baseOpacity: 0.94 });
    }

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
    solarWorldGroup.add(sunMesh);

    const sunCoronaMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_RADIUS * 1.48, 48, 32),
      sunCoronaMaterial
    );
    sunCoronaMesh.renderOrder = 2;
    solarWorldGroup.add(sunCoronaMesh);

    const orbitGuideGroup = new THREE.Group();
    solarWorldGroup.add(orbitGuideGroup);
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
    solarWorldGroup.add(sunEarthLine);

    // 3.5 金星（太陽の内側を約224.7日で公転する内惑星：軌道傾斜角 約3.395°）
    const venusOrbitGroup = new THREE.Group();
    venusOrbitGroup.rotation.y = degToRad(VENUS_ASCENDING_NODE_DEG);
    solarWorldGroup.add(venusOrbitGroup);

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
    solarWorldGroup.add(venusMesh);

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
    solarWorldGroup.add(venusGlowSprite);

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
      solarWorldGroup.add(line);
      return { line, mat };
    };

    // 月・金星それぞれに地球と平行な断面補助線（地球から見える面と裏側を分ける線）と、地球-金星の視線ガイド線
    const moonEarthParallel = makeDynamicLine(0x38bdf8, 0.96, false);
    const venusEarthParallel = makeDynamicLine(0x38bdf8, 0.96, false);
    const earthVenusSight = makeDynamicLine(0x7dd3fc, 0.36, true);

    // 3.8 リアル太陽系モード（1 AU = ORBIT_RADIUS = 13.5 基準の忠実な 3D ケプラー楕円軌道＋水金地火木土天海冥＋木星主要4衛星）
    const realSolarSystemGroup = new THREE.Group();
    realSolarSystemGroup.visible = false;
    solarWorldGroup.add(realSolarSystemGroup);

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
        uniforms: {
          uSunDirection: { value: THREE.Vector3 };
          uImpactDir: { value: THREE.Vector3 };
          uImpactParams: { value: THREE.Vector4 };
          uImpactColor: { value: THREE.Vector3 };
        };
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
    // 木星の主要4衛星の軌道リング（木星が衝突で消えたときに隠すため保持します）
    const jupiterMoonOrbitLines: THREE.Object3D[] = [];

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
          jupiterMoonOrbitLines.push(ringLine);

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
    solarWorldGroup.add(earthSystemGroup);

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

    // 6b. リアル太陽系・N体万有引力＆天体衝突シミュレーター
    // solarWorldGroup の子にすることで、太陽＋水金地火木土天海冥＋月＋木星4衛星すべてと同じ太陽中心座標系で動作します。
    const impactRig = createImpactSystemRig(
      starTexture,
      moonTexture,
      planetTextures.mars,
      planetTextures.jupiter
    );
    solarWorldGroup.add(impactRig.root);
    impactRigRef.current = impactRig;

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

    // 7.5 観察地点の地上観測ドーム（選択した地点の地表接平面：地平線ディスク・方位リング・高度線・北極星/天の南極目印）
    const initialGroundCity =
      cities.find((c) => c.id === latestPropsRef.current.selectedCityId) ??
      cities[0];
    let curGroundLatDeg = initialGroundCity ? initialGroundCity.latDeg : TOKYO_LAT_DEG;
    let curGroundLonDeg = initialGroundCity ? initialGroundCity.lonDeg : TOKYO_LON_DEG;

    const tokyoLocalCompass = getLocalCompassVectors(
      curGroundLatDeg,
      curGroundLonDeg
    );
    const tokyoEastLocal = new THREE.Vector3(...tokyoLocalCompass.east);
    const tokyoNorthLocal = new THREE.Vector3(...tokyoLocalCompass.north);
    const tokyoUpLocal = new THREE.Vector3(...tokyoLocalCompass.up);
    const tokyoSouthLocal = tokyoNorthLocal.clone().negate();

    // ローカル +X = 東, +Y = 天頂, +Z = 南（-Z = 北）となる右手直交基底を構築します。
    const tokyoBasisMat = new THREE.Matrix4().makeBasis(
      tokyoEastLocal,
      tokyoUpLocal,
      tokyoSouthLocal
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

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerMovedDist = 0;
    let pointerDownButton = 0;
    let pointerHadMultiTouch = false;

    const pickCelestialBodyAtClientPos = (
      clientX: number,
      clientY: number
    ): CelestialBodyId | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointerNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);

      const curCosmicLevel = cameraAnimRef.current.current.cosmicLevel;
      if (curCosmicLevel >= 0.55) {
        const cosmicCandidates = cosmicRig.getPickCandidates(curCosmicLevel);
        const cosmicMeshes = cosmicCandidates.map((c) => c.mesh);
        const cosmicHits = raycaster.intersectObjects(cosmicMeshes, false);
        if (cosmicHits.length === 0) return null;
        const hitObj = cosmicHits[0].object;
        const matched = cosmicCandidates.find((c) => c.mesh === hitObj);
        return matched ? matched.id : null;
      }

      const candidates: Array<{ id: CelestialBodyId; mesh: THREE.Object3D }> =
        [];
      if (sunMesh.visible) candidates.push({ id: "sun", mesh: sunMesh });
      if (earthMesh.visible) candidates.push({ id: "earth", mesh: earthMesh });
      if (moonSystemGroup.visible && moonMesh.visible) {
        candidates.push({ id: "moon", mesh: moonMesh });
      }
      if (venusMesh.visible) candidates.push({ id: "venus", mesh: venusMesh });
      if (seasonalSkyGroup.visible) {
        for (const [starId, sMesh] of seasonalBrightStarMeshes.entries()) {
          candidates.push({ id: starId, mesh: sMesh });
        }
      }
      if (realSolarSystemGroup.visible) {
        for (const [pId, entry] of extraPlanetMap.entries()) {
          candidates.push({ id: pId, mesh: entry.spinMesh });
        }
        if (jupiterMoonsGroup && jupiterMoonsGroup.visible) {
          for (const [gmId, mEntry] of jupiterGalileanMeshes.entries()) {
            candidates.push({
              id: gmId as CelestialBodyId,
              mesh: mEntry.mesh,
            });
          }
        }
      }

      const meshes = candidates.map((c) => c.mesh);
      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) return null;
      const hitObj = hits[0].object;
      const matched = candidates.find((c) => c.mesh === hitObj);
      return matched ? matched.id : null;
    };

    // ---------------------------------------------------------------------
    // リアル太陽系・N体万有引力＆天体衝突シミュレーターの「タップで落下／ドラッグで投げ込み」操作
    // ---------------------------------------------------------------------
    // 太陽系全15天体の毎フレームの基準位置・表示半径スナップショット（solarWorldGroup 座標）
    const solarBaselineList: SolarBaselineBodyInput[] = SOLAR_TARGET_SPECS.map(
      (s) => ({
        id: s.id,
        pos: new THREE.Vector3(),
        radius: s.baseRadius,
      })
    );
    const solarBaselineMap = new Map<
      SolarImpactTargetId,
      SolarBaselineBodyInput
    >();
    for (const item of solarBaselineList) {
      solarBaselineMap.set(item.id, item);
    }

    // 画面に今描かれている太陽系天体の位置と大きさです（天体を押したかどうかの判定に使います）。
    // N体計算で軌道が乱れた後は、本来の公転位置（solarBaselineList）と描かれている位置がずれるため、別に持ちます。
    const displayedSolarTargets: SolarBaselineBodyInput[] = SOLAR_TARGET_SPECS.map(
      (s) => ({
        id: s.id,
        pos: new THREE.Vector3(),
        radius: s.baseRadius,
      })
    );

    // 各太陽系天体を画面に描いている 3D オブジェクトです。
    // 押下判定では、このオブジェクトと親がすべて表示中か（＝実際に描かれているか）を調べ、見えない天体は押せないようにします。
    const solarTargetRenderObjects = new Map<SolarImpactTargetId, THREE.Object3D>();
    solarTargetRenderObjects.set("sun", sunMesh);
    solarTargetRenderObjects.set("earth", earthMesh);
    solarTargetRenderObjects.set("moon", moonMesh);
    solarTargetRenderObjects.set("venus", venusMesh);
    for (const [pId, entry] of extraPlanetMap.entries()) {
      solarTargetRenderObjects.set(pId, entry.spinMesh);
    }
    for (const [gmId, mEntry] of jupiterGalileanMeshes.entries()) {
      solarTargetRenderObjects.set(gmId as SolarImpactTargetId, mEntry.mesh);
    }

    /** オブジェクト自身と、その親をたどったすべてが表示中なら true を返します。 */
    const isRenderedVisible = (obj: THREE.Object3D | undefined): boolean => {
      let current: THREE.Object3D | null = obj ?? null;
      if (!current) return false;
      while (current) {
        if (!current.visible) return false;
        current = current.parent;
      }
      return true;
    };

    /**
     * 今、1本指の操作で天体を狙ってよいなら選択中の天体の種類を、そうでなければ null を返します。
     * 移動先の視点がリアル太陽系の外なら、App 側の状態にかかわらず通常のカメラ操作にします。
     */
    const getAimableImpactorId = (): ImpactorId | null => {
      const id = latestPropsRef.current.activeImpactorId;
      if (id === null) return null;
      return isRealSolarSystemPose(cameraAnimRef.current.to) ? id : null;
    };

    // 狙いの状態をまとめて保持します（すべて solarWorldGroup 太陽中心のワールド座標）。
    const impactAim = {
      active: false,
      targetBodyId: null as SolarImpactTargetId | null,
      targetBodyPos: new THREE.Vector3(),
      planeY: 0,
      spawnWorld: new THREE.Vector3(),
      downPlaneWorld: new THREE.Vector3(),
      aimVel: new THREE.Vector3(),
      tapVel: new THREE.Vector3(),
    };
    const aimPlane = new THREE.Plane();
    const aimPlaneNormal = new THREE.Vector3();
    const aimPlaneCenter = new THREE.Vector3();
    const aimCamForward = new THREE.Vector3();
    const aimTmpWorld = new THREE.Vector3();

    /** 画面上の位置からレイ（視線）を作ります。 */
    const setRayFromClient = (clientX: number, clientY: number): boolean => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      pointerNdc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointerNdc, camera);
      return true;
    };

    /**
     * 画面レイが太陽系全15天体のいずれかを指しているか（またはすぐ近くを通っているか）を判定します。
     */
    const findClosestSolarTargetAtRay = (): SolarBaselineBodyInput | null => {
      let best: SolarBaselineBodyInput | null = null;
      let bestDistAlongRay = Infinity;
      const ray = raycaster.ray;
      for (const b of displayedSolarTargets) {
        // 画面に描かれていない天体（衝突で消えた天体、遠景で隠した衛星など）は狙えません
        if (!isRenderedVisible(solarTargetRenderObjects.get(b.id))) continue;
        const toBody = aimTmpWorld.copy(b.pos).sub(ray.origin);
        const proj = toBody.dot(ray.direction);
        if (proj <= 0.1) continue;
        const perpSq = Math.max(0, toBody.lengthSq() - proj * proj);
        const pickR = Math.max(1.15, b.radius * 1.75);
        if (perpSq <= pickR * pickR && proj < bestDistAlongRay) {
          bestDistAlongRay = proj;
          best = b;
        }
      }
      return best;
    };

    /**
     * 太陽系の公転面（高さ Y = planeY の水平面）と画面レイの交点を
     * solarWorldGroup 座標で求めます。
     */
    const projectToAimPlaneWorld = (
      clientX: number,
      clientY: number,
      planeY: number,
      out: THREE.Vector3
    ): boolean => {
      if (!setRayFromClient(clientX, clientY)) return false;
      camera.getWorldDirection(aimCamForward);
      aimPlaneCenter.set(0, planeY, 0);
      if (Math.abs(raycaster.ray.direction.y) >= 0.12) {
        aimPlaneNormal.set(0, 1, 0);
      } else {
        aimPlaneNormal
          .set(0, 1, 0)
          .lerp(aimCamForward.clone().negate(), 0.35)
          .normalize();
      }
      aimPlane.setFromNormalAndCoplanarPoint(aimPlaneNormal, aimPlaneCenter);
      const hit = raycaster.ray.intersectPlane(aimPlane, aimTmpWorld);
      if (!hit) return false;
      out.copy(aimTmpWorld);
      out.y = planeY;
      return true;
    };

    /** ドラッグ距離 d から初速度の大きさを滑らかに算出します。 */
    const computeThrowSpeedFromDragDist = (dragDist: number): number => {
      return Math.min(
        48.0,
        0.52 * dragDist + 1.85 * Math.sqrt(Math.max(0, dragDist))
      );
    };

    /**
     * 狙いを開始します。
     * 太陽系15天体のいずれかの上を押した場合はその天体のすぐ外側に出現させ、
     * 宇宙空間を押した場合はその座標にそのまま出現させます（タップ時は初速ゼロでN体万有引力のみ）。
     */
    const beginImpactAim = (
      impactorId: ImpactorId,
      clientX: number,
      clientY: number
    ): boolean => {
      const spec = IMPACTOR_MAP[impactorId];
      if (!setRayFromClient(clientX, clientY)) return false;

      const hitBody = findClosestSolarTargetAtRay();
      if (hitBody) {
        impactAim.targetBodyId = hitBody.id;
        impactAim.targetBodyPos.copy(hitBody.pos);
        impactAim.planeY = hitBody.pos.y;
        projectToAimPlaneWorld(
          clientX,
          clientY,
          impactAim.planeY,
          impactAim.downPlaneWorld
        );
        const offsetDir = impactAim.downPlaneWorld
          .clone()
          .sub(hitBody.pos);
        offsetDir.y = 0;
        if (offsetDir.lengthSq() < 1e-4) {
          offsetDir.set(1, 0, 0.4).normalize();
        } else {
          offsetDir.normalize();
        }
        const clearance =
          hitBody.radius * 1.9 + spec.visualRadius * 1.45 + 1.4;
        impactAim.spawnWorld
          .copy(hitBody.pos)
          .addScaledVector(offsetDir, clearance);
      } else {
        impactAim.targetBodyId = null;
        impactAim.planeY = 0;
        if (
          !projectToAimPlaneWorld(
            clientX,
            clientY,
            0,
            impactAim.downPlaneWorld
          )
        ) {
          return false;
        }
        impactAim.spawnWorld.copy(impactAim.downPlaneWorld);
      }

      impactAim.tapVel.set(0, 0, 0);
      impactAim.aimVel.set(0, 0, 0);
      impactAim.active = true;

      impactRig.updateAimPreview(
        impactorId,
        impactAim.spawnWorld,
        impactAim.tapVel,
        solarBaselineList
      );
      return true;
    };

    /** ドラッグ中：引っぱった向きと長さ（またはドラッグ先の太陽系天体）から初速度を決め、N体予測軌道を更新します。 */
    const updateImpactAim = (
      impactorId: ImpactorId,
      clientX: number,
      clientY: number
    ) => {
      if (!setRayFromClient(clientX, clientY)) return;
      const spec = IMPACTOR_MAP[impactorId];
      const hoverBody = findClosestSolarTargetAtRay();

      if (!projectToAimPlaneWorld(clientX, clientY, impactAim.planeY, aimTmpWorld)) {
        return;
      }

      if (
        impactAim.targetBodyId !== null &&
        aimTmpWorld.distanceTo(impactAim.targetBodyPos) >
          (solarBaselineMap.get(impactAim.targetBodyId)?.radius ?? 1.0) * 1.5 +
            spec.visualRadius
      ) {
        // 天体の上から外側へ引っ張った場合：その天体へ向けたスリングショット投げ込み
        impactAim.spawnWorld.copy(aimTmpWorld);
        const pullVec = impactAim.targetBodyPos.clone().sub(aimTmpWorld);
        const pullDist = pullVec.length();
        const speed = computeThrowSpeedFromDragDist(pullDist);
        impactAim.aimVel
          .copy(pullVec)
          .divideScalar(Math.max(1e-4, pullDist))
          .multiplyScalar(speed);
      } else if (
        hoverBody &&
        hoverBody.pos.distanceTo(impactAim.spawnWorld) >
          hoverBody.radius + spec.visualRadius
      ) {
        // 宇宙空間から特定の太陽系天体（冥王星など黄道面から傾いた天体も含む）の上へドラッグした場合：その天体の3D座標方向へ狙いを合わせます
        const toTarget = hoverBody.pos.clone().sub(impactAim.spawnWorld);
        const dist = toTarget.length();
        const speed = computeThrowSpeedFromDragDist(dist);
        impactAim.aimVel
          .copy(toTarget)
          .divideScalar(Math.max(1e-4, dist))
          .multiplyScalar(speed);
      } else {
        // 宇宙空間で自由にドラッグした場合：ドラッグ方向へ初速度を与えます
        const dragVec = aimTmpWorld.clone().sub(impactAim.spawnWorld);
        const dragDist = dragVec.length();
        if (dragDist < 0.08) {
          impactAim.aimVel.set(0, 0, 0);
        } else {
          const speed = computeThrowSpeedFromDragDist(dragDist);
          impactAim.aimVel
            .copy(dragVec)
            .divideScalar(dragDist)
            .multiplyScalar(speed);
        }
      }

      impactRig.updateAimPreview(
        impactorId,
        impactAim.spawnWorld,
        impactAim.aimVel,
        solarBaselineList
      );
    };

    /** 狙いを取り消します（2本指操作に切り替わったときなど）。 */
    const cancelImpactAim = () => {
      if (!impactAim.active) return;
      impactAim.active = false;
      impactRig.cancelAimPreview();
    };

    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
    };

    const onPointerDown = (ev: PointerEvent) => {
      if (activePointers.size === 0) {
        pointerMovedDist = 0;
        pointerDownButton = ev.button;
        pointerHadMultiTouch = false;
      } else {
        pointerHadMultiTouch = true;
      }
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

      // 発射モード中：1本指（左クリック）で押したら狙いを開始し、2本目の指が来たら取り消します。
      const curImpactorId = getAimableImpactorId();
      if (curImpactorId !== null) {
        if (activePointers.size >= 2) {
          cancelImpactAim();
        } else if (
          ev.button === 0 &&
          !ev.shiftKey &&
          !ev.altKey &&
          bodyFocusRef.current.targetBlend <= 0.5
        ) {
          beginImpactAim(curImpactorId, ev.clientX, ev.clientY);
        }
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      const prevPt = activePointers.get(ev.pointerId);
      if (!prevPt) return;

      const dx = ev.clientX - prevPt.x;
      const dy = ev.clientY - prevPt.y;
      pointerMovedDist += Math.hypot(dx, dy);
      prevPt.x = ev.clientX;
      prevPt.y = ev.clientY;

      // 発射モードで狙い中のドラッグは、カメラを回さずに投げる向きと強さを決めます。
      if (impactAim.active) {
        const curImpactorId = getAimableImpactorId();
        if (curImpactorId === null) {
          cancelImpactAim();
        } else if (pointerMovedDist >= 8) {
          updateImpactAim(curImpactorId, ev.clientX, ev.clientY);
        }
        return;
      }

      const anim = cameraAnimRef.current;
      const focus = bodyFocusRef.current;

      // 天体クローズアップ表示中のドラッグ／ピンチ操作：タップした天体の周囲を360°回転・ズームできます。
      if (focus.targetBlend > 0.5) {
        if (activePointers.size >= 2) {
          const m = getTwoFingerMetrics();
          if (m && lastPinchDist !== null && lastPinchDist > 4) {
            const ratio = lastPinchDist / Math.max(4, m.dist);
            focus.zoomFactor = Math.max(
              0.55,
              Math.min(2.6, focus.zoomFactor * ratio)
            );
          }
          lastPinchDist = m ? m.dist : null;
          lastTwoFingerMid = m ? { x: m.midX, y: m.midY } : null;
          lastTwoFingerAngle = m ? m.angle : null;
          return;
        }
        focus.orbitYaw -= dx * 0.0075;
        focus.orbitPitch = Math.max(
          -Math.PI / 2 + 0.08,
          Math.min(Math.PI / 2 - 0.08, focus.orbitPitch + dy * 0.0075)
        );
        return;
      }

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
                anim.current.cosmicLevel > 0.35
                  ? 260
                  : anim.current.solarSystemBlend > 0.25
                  ? 2400
                  : 120;
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

      // 発射モードで狙い中に指を離したら、天体を発射します。
      if (impactAim.active) {
        const curImpactorId = getAimableImpactorId();
        const canLaunch =
          ev.type === "pointerup" &&
          activePointers.size === 0 &&
          !pointerHadMultiTouch &&
          curImpactorId !== null;
        impactAim.active = false;
        if (!canLaunch || curImpactorId === null) {
          impactRig.cancelAimPreview();
          return;
        }
        // ほとんど動かさなかった場合は「タップ」として、タップした場所へ落とします。
        const launchVel =
          pointerMovedDist < 10 ? impactAim.tapVel : impactAim.aimVel;
        impactRig.launchImpactor(
          curImpactorId,
          impactAim.spawnWorld,
          launchVel,
          solarBaselineList
        );
        return;
      }
      // 発射モード中は、左クリックのタップで天体の詳細カードを開かないようにします。
      if (getAimableImpactorId() !== null) {
        return;
      }
      // ドラッグせずに天体を短くタップ／クリックした場合は、その天体にズームして詳細カードを開きます。
      if (
        ev.type === "pointerup" &&
        activePointers.size === 0 &&
        !pointerHadMultiTouch &&
        pointerDownButton === 0 &&
        pointerMovedDist < 8
      ) {
        const hitBody = pickCelestialBodyAtClientPos(ev.clientX, ev.clientY);
        if (hitBody) {
          latestPropsRef.current.onSelectCelestialBody(hitBody);
        }
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const focus = bodyFocusRef.current;
      if (focus.targetBlend > 0.5) {
        focus.zoomFactor = Math.max(
          0.55,
          Math.min(2.6, focus.zoomFactor * Math.exp(ev.deltaY * 0.0012))
        );
        return;
      }
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
      const maxZoomDist =
        anim.current.cosmicLevel > 0.35
          ? 260
          : anim.current.solarSystemBlend > 0.25
          ? 2400
          : 120;
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
    let currentOffsetY = 0;
    const focusTargetPos = new THREE.Vector3();
    const focusRawPos = new THREE.Vector3();
    const focusCamPos = new THREE.Vector3();
    const focusDirFromSun = new THREE.Vector3();
    const focusBasisRight = new THREE.Vector3();
    const focusBasisUp = new THREE.Vector3();
    const focusLookMat = new THREE.Matrix4();
    const focusCamQuat = new THREE.Quaternion();

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
    let lastPolarisBadgeText = "";

    /** 衝突シミュレーターの結果を、地球・大気・月・金星・リアル太陽系全惑星のシェーダーへ渡します。 */
    const applyImpactToEarthAndMoonShaders = (impOut: ImpactFrameOutput) => {
      const eu = earthBundle.uniforms;
      eu.uImpactDir.value.copy(impOut.earthImpactLocalDir);
      eu.uImpactParams.value.set(
        impOut.earthCraterRadius,
        impOut.earthDamageHeat,
        impOut.earthCrackIntensity,
        impOut.earthShockAngleRad
      );
      eu.uImpactColor.value.copy(impOut.earthImpactColor);
      eu.uImpactTime.value = totalTimeSec;

      atmosphereBundle.uniforms.uImpactHeat.value = impOut.atmosphereHeat;
      atmosphereBundle.uniforms.uImpactColor.value.copy(impOut.earthImpactColor);

      const mu = moonBundle.uniforms;
      mu.uMoonImpactDir.value.copy(impOut.moonImpactLocalDir);
      mu.uMoonImpactParams.value.set(
        impOut.moonCraterRadius,
        impOut.moonDamageHeat,
        impOut.moonCrackIntensity,
        impOut.moonEarthMagmaGlow
      );
      mu.uMoonImpactColor.value.copy(impOut.bodyStates.moon.impactColor);

      const vSt = impOut.bodyStates.venus;
      const vu = venusBundle.uniforms;
      vu.uImpactDir.value.copy(vSt.impactDir);
      vu.uImpactParams.value.set(
        vSt.craterRadius,
        vSt.damageHeat,
        vSt.crackIntensity,
        0
      );
      vu.uImpactColor.value.copy(vSt.impactColor);

      for (const [pId, entry] of extraPlanetMap.entries()) {
        const pSt = impOut.bodyStates[pId];
        if (!pSt) continue;
        entry.uniforms.uImpactDir.value.copy(pSt.impactDir);
        entry.uniforms.uImpactParams.value.set(
          pSt.craterRadius,
          pSt.damageHeat,
          pSt.crackIntensity,
          0
        );
        entry.uniforms.uImpactColor.value.copy(pSt.impactColor);
      }

      // 地球が粉砕・吸い込まれるときは、本体と大気を小さくしていきます。
      const earthScale = Math.max(0.001, impOut.earthScaleFactor);
      earthMesh.scale.setScalar(earthScale);
      atmosphereMesh.scale.setScalar(earthScale);
    };

    // 状態通知は値が変わったときだけ React 側へ送ります（毎フレームの再描画を防ぐため）。
    let lastImpactPhase: ImpactSimPhase = "idle";
    let lastImpactLabel = "";
    let lastImpactCanRestore = false;
    let lastImpactorCount = 0;
    let lastFlashOpacity = -1;

    /** 画面フラッシュの明るさ・色と、上部 HUD へのステータス通知を更新します。 */
    const updateImpactFlashAndStatus = (impOut: ImpactFrameOutput) => {
      const flashEl = impactFlashRef.current;
      const opacity = Math.round(impOut.screenFlashOpacity * 100) / 100;
      if (flashEl && opacity !== lastFlashOpacity) {
        flashEl.style.opacity = opacity.toFixed(2);
        if (opacity > 0) {
          const c = impOut.screenFlashColorCss;
          flashEl.style.background = `radial-gradient(circle at 50% 50%, rgba(${c}, 0.95) 0%, rgba(${c}, 0.55) 38%, rgba(${c}, 0.12) 78%, rgba(${c}, 0) 100%)`;
        }
        lastFlashOpacity = opacity;
      }

      if (
        impOut.phase !== lastImpactPhase ||
        impOut.statusLabelJa !== lastImpactLabel ||
        impOut.canTriggerRestore !== lastImpactCanRestore ||
        impOut.liveImpactorCount !== lastImpactorCount
      ) {
        lastImpactPhase = impOut.phase;
        lastImpactLabel = impOut.statusLabelJa;
        lastImpactCanRestore = impOut.canTriggerRestore;
        lastImpactorCount = impOut.liveImpactorCount;
        latestPropsRef.current.onImpactStatusChange?.({
          phase: impOut.phase,
          labelJa: impOut.statusLabelJa,
          canRestore: impOut.canTriggerRestore,
          liveImpactorCount: impOut.liveImpactorCount,
        });
      }
    };

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
        layers: curLayers,
        isInspectorOpen: curInspectorOpen,
        focusedBodyId: curFocusedBodyId,
      } = latestPropsRef.current;

      const hostW = host.clientWidth || window.innerWidth;
      const hostH = host.clientHeight || window.innerHeight;

      // 太陽のプラズマアニメーション更新
      sunBundle.uniforms.uTime.value = totalTimeSec;

      // 連続カメラアニメーションの現在値を先に進行させ、モードブレンド率 (g, s, j) を確定します。
      const eclipticLonRad = degToRad(curSolar.sunEclipticLongitudeDeg);
      const anim = cameraAnimRef.current;
      const desiredEarthRightAngle = eclipticLonRad;
      // 太陽と地球の公転視点では、上＝春分・左＝夏至・下＝秋分・右＝冬至（地軸が右傾き）になるよう基準角を +π/2 に設定します。
      const desiredSunRightAngle = Math.PI / 2;
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
        anim.current.cosmicLevel =
          anim.from.cosmicLevel +
          (anim.to.cosmicLevel - anim.from.cosmicLevel) * ease;
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
      const cLevel = THREE.MathUtils.clamp(curPose.cosmicLevel, 0, 7);
      const cBlend = THREE.MathUtils.clamp(cLevel, 0, 1);
      const hideSolarForCosmic = cLevel >= 0.9;
      const hideSolarBadgesForCosmic = cLevel >= 0.3;

      // 異なる宇宙階層（cosmicLevel）を跨ぐトランジション中のみカメラ距離変化を光学的に補償します。
      // 同一階層内でのプリセット再選択時は補償を無効にし、遷移完了時のスケール瞬間ジャンプを防ぎます。
      const isCosmicStageTransition =
        anim.active &&
        Math.abs(anim.from.cosmicLevel - anim.to.cosmicLevel) > 0.01;

      // 太陽系→近傍恒星・銀河へズームアウトする際、カメラ距離変化を相殺しつつ太陽系全体を原点 (0,0,0) へ指数関数的に縮小します。
      let solarWorldScale = 1.0;
      if (!hideSolarForCosmic && cLevel > 0.001) {
        const exitT = THREE.MathUtils.clamp(cLevel / 0.9, 0, 1);
        const distComp = isCosmicStageTransition
          ? curPose.distance / Math.max(1.5, anim.solarRefDist)
          : 1.0;
        solarWorldScale = Math.max(
          0.0004,
          distComp * Math.pow(0.004, exitT)
        );
      }
      solarWorldGroup.visible = !hideSolarForCosmic;
      solarWorldGroup.scale.setScalar(solarWorldScale);

      // 近傍恒星〜観測可能な宇宙の 7 段階コズミック・スケールを更新します。
      cosmicRig.update(
        cLevel,
        totalTimeSec,
        curPose.distance,
        isCosmicStageTransition,
        Math.round(anim.from.cosmicLevel),
        anim.from.distance
      );

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

      // 現在選択されている観察地点（東京・ロンドン・ニューヨーク・トロムソ・シドニー・北極点・南極点）へ地上ドームを滑らかに追従させます。
      const activeGroundCity =
        curCities.find((c) => c.id === curSelectedId) ?? curCities[0];
      if (activeGroundCity) {
        const cityLerp = 1 - Math.exp(-7.5 * dt);
        curGroundLatDeg += (activeGroundCity.latDeg - curGroundLatDeg) * cityLerp;
        const lonDiffDeg =
          ((((activeGroundCity.lonDeg - curGroundLonDeg) % 360) + 540) % 360) -
          180;
        curGroundLonDeg += lonDiffDeg * cityLerp;

        const dynCompass = getLocalCompassVectors(
          curGroundLatDeg,
          curGroundLonDeg
        );
        tokyoEastLocal.set(...dynCompass.east);
        tokyoNorthLocal.set(...dynCompass.north);
        tokyoUpLocal.set(...dynCompass.up);
        tokyoSouthLocal.copy(tokyoNorthLocal).negate();

        tokyoBasisMat.makeBasis(tokyoEastLocal, tokyoUpLocal, tokyoSouthLocal);
        tokyoGroundGroup.quaternion.setFromRotationMatrix(tokyoBasisMat);
        tokyoGroundGroup.position
          .copy(tokyoUpLocal)
          .multiplyScalar(1.0 + GROUND_EYE_ALTITUDE - 0.002);

        // 北半球では北の空（-Z）に北極星、南半球では南の空（+Z）に天の南極リングを高度 |緯度| で配置します。
        const poleAltRad = degToRad(Math.abs(curGroundLatDeg));
        const isNorthHemisphere = curGroundLatDeg >= 0;
        polarisAnchor.position.set(
          0,
          guideRadius * Math.sin(poleAltRad),
          (isNorthHemisphere ? -1 : 1) * guideRadius * Math.cos(poleAltRad)
        );
        polarisRing.position.copy(polarisAnchor.position);
        polarisRing.lookAt(0, 0, 0);
        polarisRing.visible = Math.abs(curGroundLatDeg) > 0.5;
      }

      // 選択地点の地表における現在の天頂・北・東のワールド単位ベクトルと視点座標を算出します。
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

      // 日食・月食シェーダーユニフォームの更新
      const deltaNewLonDeg =
        ((((curMoon.phaseAngleDeg) % 360) + 540) % 360) - 180;
      const solarSepDeg = Math.hypot(
        deltaNewLonDeg,
        curMoon.eclipticLatitudeDeg
      );
      const deltaFullLonDeg =
        ((((curMoon.phaseAngleDeg - 180) % 360) + 540) % 360) - 180;
      const isNearFullMoon = Math.abs(deltaFullLonDeg) < 10 ? 1.0 : 0.0;
      moonBundle.uniforms.uLunarEclipse.value.set(
        deltaFullLonDeg,
        curMoon.eclipticLatitudeDeg,
        isNearFullMoon
      );

      if (solarSepDeg <= 1.65) {
        const spotLonRad = eclipticLonRad + degToRad(deltaNewLonDeg * 18.0);
        const spotLatRad = degToRad(curMoon.eclipticLatitudeDeg * 22.0);
        const cosSpotLat = Math.cos(spotLatRad);
        const spotStrength = THREE.MathUtils.clamp(
          1.0 - (solarSepDeg / 1.75) * 0.5,
          0.28,
          1.0
        );
        earthBundle.uniforms.uSolarEclipseSpot.value.set(
          cosSpotLat * Math.cos(spotLonRad),
          Math.sin(spotLatRad),
          -cosSpotLat * Math.sin(spotLonRad),
          spotStrength
        );
      } else {
        earthBundle.uniforms.uSolarEclipseSpot.value.set(1, 0, 0, 0);
      }

      const isSolarEclipseGround =
        g > 0.15 && Math.abs(deltaNewLonDeg) < 3.5 && Math.abs(curMoon.eclipticLatitudeDeg) < 2.2;
      moonBundle.uniforms.uSolarEclipseSilhouette.value = isSolarEclipseGround
        ? g * THREE.MathUtils.clamp(1.0 - solarSepDeg / 2.2, 0, 1)
        : 0;

      // 2. 天体クローズアップ時は左（スマホ縦では上）に天体を配置し、通常時は右側観察パネルの分だけ水平オフセットを補間します。
      let targetOffsetX = curInspectorOpen && hostW >= 1024 ? 154 : 0;
      let targetOffsetY = 0;
      if (curFocusedBodyId !== null) {
        if (hostW <= 600) {
          targetOffsetX = 0;
          targetOffsetY = Math.round(hostH * 0.21);
        } else {
          const detailCardW = Math.min(430, Math.max(320, hostW * 0.38));
          targetOffsetX = Math.round(detailCardW * 0.5);
          targetOffsetY = 0;
        }
      }
      const offsetLerp = 1 - Math.exp(-9 * dt);
      currentOffsetX += (targetOffsetX - currentOffsetX) * offsetLerp;
      currentOffsetY += (targetOffsetY - currentOffsetY) * offsetLerp;
      if (Math.abs(currentOffsetX) > 0.5 || Math.abs(currentOffsetY) > 0.5) {
        camera.setViewOffset(
          hostW,
          hostH,
          currentOffsetX,
          currentOffsetY,
          hostW,
          hostH
        );
      } else {
        camera.clearViewOffset();
      }

      // 3. リアル太陽系モードの距離補正と各惑星・木星4衛星の更新
      const solarBoostDist =
        cLevel > 0.001 && anim.active ? anim.solarRefDist : curPose.distance;
      const solarBlendEffective =
        cLevel > 0.001 &&
        (anim.from.solarSystemBlend > 0.5 || anim.to.solarSystemBlend > 0.5)
          ? 1.0
          : s;
      const outerZoomBoost =
        solarBlendEffective > 0.01 && jFocus < 0.5
          ? 1.0 + THREE.MathUtils.clamp((solarBoostDist - 180) / 210, 0, 5.4)
          : 1.0;

      // 太陽サイズ：地上視点では視差なし遠方へ、黄道ビューでは星座と重なりにくいシャープなサイズへ調整します。
      groundSunWorldPos
        .copy(tokyoEyeWorldPos)
        .addScaledVector(sunDirWorld, 75);
      sunMesh.position.set(0, 0, 0).lerp(groundSunWorldPos, g);
      const solarSunBoost =
        1.0 +
        solarBlendEffective *
          (1 - jFocus) *
          THREE.MathUtils.clamp((solarBoostDist - 180) / 145, 0, 6.8);
      const baseSunScale = THREE.MathUtils.lerp(solarSunBoost, 2.15, g);
      const sunScale = THREE.MathUtils.lerp(baseSunScale, 0.36, eBlend);
      sunMesh.scale.setScalar(sunScale);
      sunCoronaMesh.position.copy(sunMesh.position);
      const totalEclipseCoronaBoost =
        curMoon.solarEclipseType === "total"
          ? 1.0 + 0.52 * g * curMoon.eclipseObscuration
          : 1.0;
      sunCoronaMesh.scale.setScalar(sunScale * totalEclipseCoronaBoost);

      // 地上視点での月の方向と視直径（日食時に太陽視直径 約3.04° に対して皆既・金環・部分日食が正確に重なるよう補正）
      let groundMoonLonRad = moonLonRad;
      let groundMoonLatRad = moonLatRad;
      if (g > 0.05 && Math.abs(deltaNewLonDeg) < 8.0) {
        const eclipseWindow = THREE.MathUtils.clamp(
          1.0 - Math.abs(deltaNewLonDeg) / 8.0,
          0,
          1
        );
        const visualLatDeg =
          Math.abs(curMoon.eclipticLatitudeDeg) <= 0.48
            ? curMoon.eclipticLatitudeDeg * 0.08
            : curMoon.eclipticLatitudeDeg * 1.82;
        const visualLonDeg =
          curSolar.sunEclipticLongitudeDeg + deltaNewLonDeg * 2.6;
        groundMoonLonRad = degToRad(
          THREE.MathUtils.lerp(
            curMoon.eclipticLongitudeDeg,
            visualLonDeg,
            eclipseWindow
          )
        );
        groundMoonLatRad = degToRad(
          THREE.MathUtils.lerp(
            curMoon.eclipticLatitudeDeg,
            visualLatDeg,
            eclipseWindow
          )
        );
      }
      const gMoonCosLat = Math.cos(groundMoonLatRad);
      tmpWorldNormal
        .set(
          gMoonCosLat * Math.cos(groundMoonLonRad),
          Math.sin(groundMoonLatRad),
          -gMoonCosLat * Math.sin(groundMoonLonRad)
        )
        .normalize();

      moonGroundLocalPos
        .copy(tokyoLocalOffset)
        .addScaledVector(tmpWorldNormal, 55);
      moonMesh.position.copy(moonSpaceLocalPos).lerp(moonGroundLocalPos, g);
      const orbitMoonBoost = 1.0 + 0.85 * curPose.sunCenterBlend * (1 - s);
      // 太陽の地上視半径（3.9775 / 75）と距離 55 で一致する基準スケール 10.803 に、近地点（皆既: >1）・遠地点（金環: <1）比を掛けます。
      const groundApparentFactor =
        curMoon.apparentSizeRatio >= 1.0
          ? 1.07
          : 0.86;
      const groundMoonScale = 10.803 * groundApparentFactor;
      const baseMoonScale = THREE.MathUtils.lerp(
        orbitMoonBoost,
        groundMoonScale,
        g
      );
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
      const showRealSolarDuringExit =
        cLevel > 0.001 &&
        (anim.from.solarSystemBlend > 0.5 || anim.to.solarSystemBlend > 0.5);
      realSolarSystemGroup.visible =
        !hideSolarForCosmic && (s > 0.01 || showRealSolarDuringExit) && g < 0.5;
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

      // 3b. 太陽系全15天体の本来の座標・表示半径スナップショットを更新し、N体万有引力・衝突シミュレーターを1フレーム進めます
      const setBaseline = (
        id: SolarImpactTargetId,
        x: number,
        y: number,
        z: number,
        r: number
      ) => {
        const entry = solarBaselineMap.get(id);
        if (entry) {
          entry.pos.set(x, y, z);
          entry.radius = r;
        }
      };
      setBaseline("sun", 0, 0, 0, SUN_RADIUS * sunScale);
      setBaseline(
        "earth",
        earthOrbitPos.x,
        earthOrbitPos.y,
        earthOrbitPos.z,
        1.0
      );
      setBaseline(
        "moon",
        earthOrbitPos.x + moonSpaceLocalPos.x * moonSystemScale,
        earthOrbitPos.y + moonSpaceLocalPos.y * moonSystemScale,
        earthOrbitPos.z + moonSpaceLocalPos.z * moonSystemScale,
        Math.max(0.22, MOON_RADIUS * moonSystemScale * moonScale)
      );
      setBaseline(
        "venus",
        venusSpacePos.x,
        venusSpacePos.y,
        venusSpacePos.z,
        VENUS_RADIUS
      );
      for (const [pId, entry] of extraPlanetMap.entries()) {
        setBaseline(
          pId,
          entry.root.position.x,
          entry.root.position.y,
          entry.root.position.z,
          entry.root.scale.x
        );
      }
      const jupScale = extraPlanetMap.get("jupiter")?.root.scale.x ?? 3.1;
      for (const gm of GALILEAN_MOONS) {
        const mEntry = jupiterGalileanMeshes.get(gm.id);
        if (!mEntry) continue;
        mEntry.mesh.getWorldPosition(tmpWorldPos);
        if (solarWorldScale > 1e-4) {
          tmpWorldPos.divideScalar(solarWorldScale);
        }
        setBaseline(
          gm.id,
          tmpWorldPos.x,
          tmpWorldPos.y,
          tmpWorldPos.z,
          Math.max(0.2, gm.visualRadiusFactor * jupScale)
        );
      }

      // 天体衝突シミュレーターはリアル太陽系モード専用です。
      // 移動先の視点（anim.to）がリアル太陽系の外なら、置いた天体と軌道の乱れをすべて消して元に戻します。
      // こうしないと、簡易視点や地上視点でも N体計算の結果で地球・月・金星の位置や消滅が上書きされ続けます。
      if (!isRealSolarSystemPose(anim.to) && lastImpactPhase !== "idle") {
        impactRig.resetImmediate();
      }

      const impOut = impactRig.update(
        dt,
        totalTimeSec,
        solarBaselineList,
        earthQuat,
        moonMesh.rotation.y
      );
      applyImpactToEarthAndMoonShaders(impOut);
      earthTiltGroup.rotation.z = impOut.earthAxisWobbleRad;
      impactRig.root.visible = !hideSolarForCosmic && g < 0.5;
      updateImpactFlashAndStatus(impOut);

      // 天体を押したかどうかの判定用に、今描かれている位置（N体計算中はその結果）を記録します
      for (const target of displayedSolarTargets) {
        const base = solarBaselineMap.get(target.id);
        const st = impOut.bodyStates[target.id];
        if (!base) continue;
        target.pos.copy(impOut.isNBodyActive ? st.worldPos : base.pos);
        target.radius = base.radius;
      }

      // N体シミュレーション中（または「ぬるっと復活」復元中）は全15天体の座標と消滅/復元スケールをN体計算結果で更新します
      if (impOut.isNBodyActive && g < 0.5) {
        const sunSt = impOut.bodyStates.sun;
        sunMesh.position.copy(sunSt.worldPos);
        sunMesh.scale.multiplyScalar(Math.max(0.001, sunSt.scaleFactor));
        sunCoronaMesh.position.copy(sunSt.worldPos);
        sunCoronaMesh.scale.multiplyScalar(Math.max(0.001, sunSt.scaleFactor));

        const earthSt = impOut.bodyStates.earth;
        earthOrbitPos.copy(earthSt.worldPos);
        earthSystemGroup.position.copy(earthOrbitPos);

        const moonSt = impOut.bodyStates.moon;
        moonMesh.position
          .copy(moonSt.worldPos)
          .sub(earthOrbitPos)
          .divideScalar(Math.max(0.01, moonSystemScale));
        moonMesh.scale.setScalar(
          moonScale * Math.max(0.001, moonSt.scaleFactor)
        );
        moonMesh.visible = moonSt.scaleFactor > 0.01;

        const venusSt = impOut.bodyStates.venus;
        venusSpacePos.copy(venusSt.worldPos);
        venusMesh.position.copy(venusSpacePos);
        venusMesh.scale.multiplyScalar(Math.max(0.001, venusSt.scaleFactor));
        venusGlowSprite.position.copy(venusSpacePos);

        for (const [pId, entry] of extraPlanetMap.entries()) {
          const pSt = impOut.bodyStates[pId];
          if (!pSt) continue;
          entry.root.position.copy(pSt.worldPos);
          const planetAlive = pSt.scaleFactor > 0.01;
          if (pId === "jupiter") {
            // 木星の4衛星は木星の子として描いているため、木星全体（root）を隠すと物理上は残っている衛星まで消えてしまいます。
            // そこで木星本体の球（spinMesh）だけを縮めて隠し、衛星は N体計算の位置に描き続けます。
            entry.spinMesh.scale.setScalar(Math.max(0.001, pSt.scaleFactor));
            entry.spinMesh.visible = planetAlive;
            entry.root.visible = true;
            for (const line of jupiterMoonOrbitLines) {
              line.visible = planetAlive;
            }
            jupiterWorldPos.copy(pSt.worldPos);
          } else {
            entry.root.scale.multiplyScalar(Math.max(0.001, pSt.scaleFactor));
            entry.root.visible = planetAlive;
          }
          // 太陽自身が動いた場合も各惑星の昼夜向きが太陽を向くよう更新
          entry.uniforms.uSunDirection.value
            .copy(sunSt.worldPos)
            .sub(pSt.worldPos)
            .normalize();
        }
        earthSystemGroup.updateMatrixWorld(true);
        realSolarSystemGroup.updateMatrixWorld(true);

        if (jupiterMoonsGroup) {
          for (const gm of GALILEAN_MOONS) {
            const mEntry = jupiterGalileanMeshes.get(gm.id);
            const gSt = impOut.bodyStates[gm.id];
            if (!mEntry || !gSt) continue;
            tmpWorldPos.copy(gSt.worldPos).multiplyScalar(solarWorldScale);
            jupiterMoonsGroup.worldToLocal(tmpWorldPos);
            mEntry.mesh.position.copy(tmpWorldPos);
            mEntry.mesh.scale.setScalar(Math.max(0.001, gSt.scaleFactor));
            mEntry.mesh.visible = gSt.scaleFactor > 0.01;
          }
          realSolarSystemGroup.updateMatrixWorld(true);
        }
      } else {
        moonMesh.visible = true;
        for (const entry of extraPlanetMap.values()) {
          entry.root.visible = true;
          entry.spinMesh.scale.setScalar(1);
          entry.spinMesh.visible = true;
        }
        for (const line of jupiterMoonOrbitLines) {
          line.visible = true;
        }
        for (const mEntry of jupiterGalileanMeshes.values()) {
          mEntry.mesh.scale.setScalar(1);
          mEntry.mesh.visible = true;
        }
      }

      // 遠方星空・黄道13星座天球・カシオペア座の位置を更新します（地球中心ビュー・地上視点では視差ゼロの地球中心へ配置）。
      const starExpansion = Math.max(
        1.0 + 21.0 * Math.max(s, cBlend * 0.45),
        cBlend > 0.01 ? curPose.distance / 70 + 3.0 : 1.0
      );
      starsGroup.scale.setScalar(starExpansion);
      starMat.size = 1.55 * (1.0 + 20.0 * s + 2.2 * cBlend);
      if (eBlend >= g) {
        starsGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        zodiacGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        cassiopeiaGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        southernCrossGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
        seasonalSkyGroup.position.copy(earthOrbitPos).multiplyScalar(eBlend);
      } else {
        starsGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        zodiacGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        cassiopeiaGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        southernCrossGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
        seasonalSkyGroup.position.copy(tokyoEyeWorldPos).multiplyScalar(g);
      }
      tokyoSkyMesh.position.copy(tokyoEyeWorldPos);

      // 宇宙視点カメラの注視点（地球 ↔ 太陽 ↔ 木星 ↔ 銀河中心原点）＋ 6DOF 平行移動オフセットを計算
      lookAtPos
        .copy(earthOrbitPos)
        .multiplyScalar((1 - curPose.sunCenterBlend) * solarWorldScale);
      if (jFocus > 0.001) {
        lookAtPos.lerp(
          tmpWorldPos.copy(jupiterWorldPos).multiplyScalar(solarWorldScale),
          jFocus
        );
      }
      if (cBlend > 0.001) {
        lookAtPos.multiplyScalar(1 - cBlend);
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

      // 天体タップによるクローズアップ・フォーカス（ズームイン／ズームアウト・元の視点への復帰）を計算します。
      const focus = bodyFocusRef.current;
      if (focus.transitioning) {
        focus.elapsed += dt;
        const rawT = Math.min(1, focus.elapsed / focus.duration);
        const ease = easeInOutCubic(rawT);
        focus.blend = focus.fromBlend + (focus.targetBlend - focus.fromBlend) * ease;
        if (rawT >= 1) {
          focus.transitioning = false;
          if (focus.targetBlend <= 0.001) {
            focus.activeId = null;
          }
        }
      }
      const fBlend = THREE.MathUtils.clamp(focus.blend, 0, 1);
      let focusIdealDist = 4.0;

      if (fBlend > 0.001 && focus.activeId) {
        let rawRadius = 1.0;
        const fId = focus.activeId;
        const cosmicFocusRadius =
          cLevel >= 0.45
            ? cosmicRig.getFocusWorldPosAndRadius(fId, cLevel, focusRawPos)
            : null;
        if (cosmicFocusRadius !== null) {
          rawRadius = cosmicFocusRadius;
        } else if (FEATURED_STAR_MAP[fId as FeaturedStarId]) {
          const starMesh = seasonalBrightStarMeshes.get(fId as FeaturedStarId);
          if (starMesh) {
            starMesh.getWorldPosition(focusRawPos);
            rawRadius = 2.4;
          } else {
            focusRawPos.copy(earthOrbitPos);
            rawRadius = 1.0;
          }
        } else if (fId === "sun") {
          sunMesh.getWorldPosition(focusRawPos);
          rawRadius = SUN_RADIUS * sunMesh.scale.x;
        } else if (fId === "earth") {
          focusRawPos.copy(earthOrbitPos);
          rawRadius = 1.0;
        } else if (fId === "moon") {
          moonMesh.getWorldPosition(focusRawPos);
          rawRadius = MOON_RADIUS * moonMesh.scale.x * moonSystemGroup.scale.x;
        } else if (fId === "venus") {
          venusMesh.getWorldPosition(focusRawPos);
          rawRadius = VENUS_RADIUS * venusMesh.scale.x;
        } else if (
          fId === "io" ||
          fId === "europa" ||
          fId === "ganymede" ||
          fId === "callisto"
        ) {
          const mEntry = jupiterGalileanMeshes.get(fId);
          const jEntry = extraPlanetMap.get("jupiter");
          const gmSpec = GALILEAN_MOONS.find((gm) => gm.id === fId);
          if (mEntry && jEntry && gmSpec) {
            mEntry.mesh.getWorldPosition(focusRawPos);
            rawRadius = gmSpec.visualRadiusFactor * jEntry.root.scale.x;
          } else {
            focusRawPos.copy(jupiterWorldPos);
            rawRadius = 1.0;
          }
        } else {
          const pEntry = extraPlanetMap.get(fId as ExtraPlanetId);
          if (pEntry) {
            pEntry.root.getWorldPosition(focusRawPos);
            const ringFactor =
              fId === "saturn" ? 1.85 : fId === "uranus" ? 1.32 : 1.0;
            rawRadius = pEntry.root.scale.x * ringFactor;
          } else {
            focusRawPos.copy(earthOrbitPos);
            rawRadius = 1.0;
          }
        }

        if (focus.switching) {
          focus.switchElapsed += dt;
          const swRaw = Math.min(1, focus.switchElapsed / focus.switchDuration);
          const swEase = easeInOutCubic(swRaw);
          focusTargetPos.copy(focus.switchFromPos).lerp(focusRawPos, swEase);
          rawRadius = THREE.MathUtils.lerp(
            focus.switchFromRadius,
            rawRadius,
            swEase
          );
          if (swRaw >= 1) {
            focus.switching = false;
          }
        } else {
          focusTargetPos.copy(focusRawPos);
        }
        focus.lastFocusPos.copy(focusTargetPos);
        focus.lastFocusRadius = rawRadius;

        // 太陽側（昼面）が見やすく立体的に映える 3/4 角度を基準に orbitYaw / orbitPitch で周回配置します。
        if (focusTargetPos.lengthSq() > 0.01) {
          focusDirFromSun.copy(focusTargetPos).negate().normalize();
        } else {
          focusDirFromSun.set(0, 0, 1);
        }
        focusBasisRight.crossVectors(Y_AXIS, focusDirFromSun);
        if (focusBasisRight.lengthSq() < 1e-5) {
          focusBasisRight.copy(X_AXIS);
        }
        focusBasisRight.normalize();
        focusBasisUp
          .crossVectors(focusDirFromSun, focusBasisRight)
          .normalize();

        const cosFYaw = Math.cos(focus.orbitYaw);
        const sinFYaw = Math.sin(focus.orbitYaw);
        const cosFPitch = Math.cos(focus.orbitPitch);
        const sinFPitch = Math.sin(focus.orbitPitch);

        tmpHorizBack
          .copy(focusDirFromSun)
          .multiplyScalar(cosFYaw)
          .addScaledVector(focusBasisRight, sinFYaw)
          .normalize();
        tmpCamDir
          .copy(tmpHorizBack)
          .multiplyScalar(cosFPitch)
          .addScaledVector(focusBasisUp, sinFPitch)
          .normalize();

        // モバイル縦画面では少し余裕をもたせた距離、PC/タブレットでは画面左に迫力あるサイズで収めます。
        const fitMultiplier = hostW <= 600 ? 4.35 : 3.75;
        focusIdealDist =
          Math.max(rawRadius * fitMultiplier, 0.28) * focus.zoomFactor;
        focusCamPos
          .copy(focusTargetPos)
          .addScaledVector(tmpCamDir, focusIdealDist);
        focusLookMat.lookAt(focusCamPos, focusTargetPos, Y_AXIS);
        focusCamQuat.setFromRotationMatrix(focusLookMat);

        camera.position.lerp(focusCamPos, fBlend);
        camera.quaternion.slerp(focusCamQuat, fBlend);
      }

      // 衝突の規模に応じたカメラシェイク（複数の sin 波を重ねて不規則に揺らします）
      if (impOut.cameraShake > 0.002) {
        const shakeAmp =
          impOut.cameraShake *
          0.028 *
          Math.max(2.0, camera.position.distanceTo(earthOrbitPos));
        const t = totalTimeSec;
        const jx = Math.sin(t * 61.0) * 0.6 + Math.sin(t * 37.3 + 1.7) * 0.4;
        const jy = Math.sin(t * 53.0 + 0.9) * 0.6 + Math.sin(t * 29.1 + 2.3) * 0.4;
        camRightVec.set(1, 0, 0).applyQuaternion(camera.quaternion);
        camUpVec.set(0, 1, 0).applyQuaternion(camera.quaternion);
        camera.position
          .addScaledVector(camRightVec, jx * shakeAmp)
          .addScaledVector(camUpVec, jy * shakeAmp);
      }

      camera.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      camForward.set(0, 0, -1).applyQuaternion(camera.quaternion);

      // 地上視点では広角 76°、黄道ビューではパノラマ 64°、天体フォーカス時は自然な 40° へ補間します。
      const baseFov = THREE.MathUtils.lerp(40, 76 + groundFovOffset, g);
      const preFocusFov = THREE.MathUtils.lerp(
        baseFov,
        64 + eclipticFovOffset,
        eBlend
      );
      const targetFov = THREE.MathUtils.lerp(preFocusFov, 40, fBlend);
      const farDistFactor =
        g < 0.1 && eBlend < 0.1
          ? THREE.MathUtils.clamp((curPose.distance - 140) / 360, 0, 1)
          : 0;
      const baseNear =
        g > 0.01
          ? THREE.MathUtils.lerp(0.1, 0.005, g)
          : THREE.MathUtils.lerp(0.1, 1.2, farDistFactor);
      const focusNear = Math.max(0.002, Math.min(0.1, focusIdealDist * 0.025));
      const targetNear = THREE.MathUtils.lerp(baseNear, focusNear, fBlend);
      const baseFar =
        g > 0.01 || eBlend > 0.01
          ? THREE.MathUtils.lerp(420, 360, Math.max(g, eBlend))
          : Math.max(
              THREE.MathUtils.lerp(420, 6800, Math.max(s, cBlend * 0.55)),
              anim.active && cLevel > 0.01
                ? curPose.distance * 14 + 4500
                : cBlend > 0.01
                ? 4500
                : 420
            );
      const targetFar = Math.max(baseFar, fBlend > 0.01 ? 6800 : baseFar);
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

      const isCosmicView = cLevel >= 0.85;
      const isGroundView = !isCosmicView && g >= 0.55;
      const isEclipticSkyView = !isCosmicView && eBlend >= 0.55;
      const isRealSolarSystem =
        !isCosmicView &&
        !isGroundView &&
        !isEclipticSkyView &&
        (s >= 0.45 || showRealSolarDuringExit);
      const isJupiterFocus = isRealSolarSystem && jFocus >= 0.45;
      const isOrbitOverview =
        !isCosmicView &&
        !isGroundView &&
        !isEclipticSkyView &&
        curPose.sunCenterBlend >= 0.45;
      const isSimpleOrbitOverview = isOrbitOverview && !isRealSolarSystem;
      const isEarthCloseup =
        !isCosmicView &&
        !isGroundView &&
        !isEclipticSkyView &&
        !isOrbitOverview &&
        curPose.distance < 7.5;
      const isMoonView =
        !isCosmicView &&
        !isGroundView &&
        !isEclipticSkyView &&
        !isOrbitOverview &&
        curPose.distance >= 7.5;

      // 東京の大気スカイドーム・地平線ディスク・方位ガイドの滑らかなフェード制御（天体フォーカス時は自然に退避）
      const skyOpacity = Math.pow(g, 1.8) * (1 - fBlend) * (1 - cBlend);
      const groundOpacity =
        THREE.MathUtils.clamp((g - 0.28) / 0.52, 0, 1) *
        (1 - fBlend) *
        (1 - cBlend);
      const tokyoSunElev = sunDirWorld.dot(tokyoUpWorld);

      tokyoSkyMesh.visible = skyOpacity > 0.01;
      tokyoSkyBundle.uniforms.uUpWorld.value.copy(tokyoUpWorld);
      tokyoSkyBundle.uniforms.uSunDirWorld.value.copy(sunDirWorld);
      tokyoSkyBundle.uniforms.uOpacity.value = skyOpacity;
      tokyoSkyBundle.uniforms.uEclipseDimming.value =
        curMoon.solarEclipseType === "total"
          ? g * curMoon.eclipseObscuration
          : curMoon.solarEclipseType === "annular"
          ? g * 0.45 * curMoon.eclipseObscuration
          : 0;

      tokyoGroundGroup.visible = groundOpacity > 0.01;
      tokyoGroundBundle.uniforms.uSunElevation.value = tokyoSunElev;
      tokyoGroundBundle.uniforms.uOpacity.value = groundOpacity;
      skylineMat.opacity = 0.96 * groundOpacity;
      tokyoSkyGuidesGroup.visible = groundOpacity > 0.35 && curLayers.graticule;

      // 地上・黄道ビューへ降りきった後は地球本体の球面メッシュを隠して、内側が映り込むのを防ぎます（地球フォーカス時は必ず表示）。
      const focusingEarth = fBlend > 0.05 && focus.activeId === "earth";
      const sunImpactAlive = impOut.bodyStates.sun.scaleFactor > 0.01;
      sunMesh.visible = sunImpactAlive && !hideSolarForCosmic;
      sunCoronaMesh.visible = sunImpactAlive && !hideSolarForCosmic;
      // 天体衝突で地球が消滅している間は、地球本体・大気・経緯線・都市を隠します。
      const earthImpactAlive = impOut.earthScaleFactor > 0.01;
      const earthImpactIntact = impOut.earthScaleFactor > 0.3;
      earthMesh.visible =
        earthImpactAlive &&
        !hideSolarForCosmic &&
        (focusingEarth || (g < 0.78 && eBlend < 0.52));
      atmosphereMesh.visible =
        earthImpactAlive &&
        !hideSolarForCosmic &&
        (focusingEarth || (g < 0.48 && eBlend < 0.35));

      // 月の観察距離では、太陽光線矢印と「☀ 太陽」バッジが白道リングの外側に来るよう滑らかに押し出します。
      const moonBeamFactor = THREE.MathUtils.clamp(
        (curPose.distance - 5.5) / 5.5,
        0,
        1
      );
      sunBeamRoot.position.copy(sunDirWorld).multiplyScalar(2.45 * moonBeamFactor);
      sunBeamRoot.updateMatrixWorld(true);

      graticuleGroup.visible =
        earthImpactIntact &&
        !hideSolarForCosmic &&
        curLayers.graticule &&
        g < 0.45 &&
        eBlend < 0.45 &&
        !isRealSolarSystem;
      celestialCompassGroup.visible =
        !hideSolarForCosmic && curLayers.celestialCompass && isEarthCloseup;
      eclipticLocalGroup.visible =
        !hideSolarForCosmic &&
        curLayers.eclipticPlane &&
        !isOrbitOverview &&
        !isGroundView &&
        !isEclipticSkyView;
      orbitGuideGroup.visible =
        !hideSolarForCosmic && curLayers.eclipticPlane && isSimpleOrbitOverview;
      sunEarthLine.visible =
        !hideSolarForCosmic &&
        (curLayers.eclipticPlane || curLayers.terminatorGuide) &&
        isSimpleOrbitOverview;
      sunGuideGroup.visible =
        !hideSolarForCosmic &&
        curLayers.terminatorGuide &&
        !isOrbitOverview &&
        !isGroundView &&
        !isEclipticSkyView;
      citiesGroup.visible =
        earthImpactIntact &&
        !hideSolarForCosmic &&
        curLayers.cities &&
        isEarthCloseup;
      starsGroup.visible = true;
      // リアル太陽系モードでも地球の衛星（月）を保持し、遠方全体俯瞰時だけ小さなリングが潰れないよう整理します。
      moonSystemGroup.visible =
        !hideSolarForCosmic &&
        curLayers.moonAndOrbit &&
        (!isRealSolarSystem || curPose.distance < 260);
      moonNodeGroup.visible = !hideSolarForCosmic && !isGroundView && !isEclipticSkyView;
      earthMoonLine.visible =
        !hideSolarForCosmic &&
        !isGroundView &&
        !isEclipticSkyView &&
        !isRealSolarSystem;
      moonEclipticRefRing.visible =
        !hideSolarForCosmic &&
        curLayers.moonAndOrbit &&
        curLayers.eclipticPlane &&
        isMoonView;
      venusOrbitGroup.visible =
        !hideSolarForCosmic && curLayers.venusAndOrbit && isSimpleOrbitOverview;
      const venusImpactAlive = impOut.bodyStates.venus.scaleFactor > 0.01;
      venusMesh.visible =
        venusImpactAlive &&
        !hideSolarForCosmic &&
        (curLayers.venusAndOrbit || isRealSolarSystem) &&
        (isOrbitOverview || isGroundView || isEclipticSkyView);
      venusGlowSprite.visible =
        !hideSolarForCosmic &&
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
      }

      // 地上視点で見えるカシオペア座（北天・W字）と南十字星（南天・十字）の明るさ制御
      const cassiopeiaNightFactor = isGroundView
        ? THREE.MathUtils.clamp((-tokyoSunElev + 0.14) * 3.2, 0.12, 1.0)
        : 0;
      cassiopeiaGroup.visible = isGroundView && curGroundLatDeg > -15;
      if (cassiopeiaGroup.visible) {
        cassiopeiaLineMat.opacity = 0.88 * cassiopeiaNightFactor;
        cassiopeiaStarsMat.opacity = 0.98 * cassiopeiaNightFactor;
      }

      southernCrossGroup.visible = isGroundView && curGroundLatDeg < 25;
      if (southernCrossGroup.visible) {
        scLineMat.opacity = 0.9 * cassiopeiaNightFactor;
        scStarsMat.opacity = 0.98 * cassiopeiaNightFactor;
      }

      // 四季の星座・大三角／四辺形・主要15恒星（地上視点の夜空＋黄道ビュー）の表示とフェード制御
      const seasonalSkyFactor = curLayers.seasonalAsterisms
        ? Math.max(
            isGroundView ? cassiopeiaNightFactor : 0,
            isEclipticSkyView ? eBlend * 0.85 : 0
          )
        : 0;
      seasonalSkyGroup.visible = !hideSolarForCosmic && seasonalSkyFactor > 0.04;
      if (seasonalSkyGroup.visible) {
        for (const item of seasonalFadeMats) {
          (item.mat as THREE.Material & { opacity: number }).opacity =
            item.baseOpacity * seasonalSkyFactor;
        }
      }

      // 簡易版「太陽の真上・公転面やや上」視点のとき、外周の3D黄道13星座（星と星座線）と「地球 → 太陽 → 星座」視線ガイドを表示します。
      const showSunOverheadZodiac =
        isSimpleOrbitOverview && curLayers.zodiacConstellations;
      sunOverheadZodiacRing.visible = showSunOverheadZodiac;
      sunOverheadZodiacGroup.visible = showSunOverheadZodiac;
      earthSunZodiacSightLine.visible = showSunOverheadZodiac;
      if (showSunOverheadZodiac) {
        const sightAttr = earthSunZodiacSightGeo.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        sightAttr.setXYZ(0, earthOrbitPos.x, 0.06, earthOrbitPos.z);
        sightAttr.setXYZ(
          1,
          sunDirWorld.x * SUN_ORBIT_ZODIAC_RADIUS,
          0.06,
          sunDirWorld.z * SUN_ORBIT_ZODIAC_RADIUS
        );
        sightAttr.needsUpdate = true;
        earthSunZodiacSightLine.computeLineDistances();

        for (const [zId, zLine] of sunOverheadZodiacLineMap.entries()) {
          const isHost = zId === activeSunZodiac.id;
          if (isHost) {
            zLine.lineMat.color.setHex(0xfde68a);
            zLine.lineMat.opacity = 1.0;
          } else if (zLine.isThirteenth) {
            zLine.lineMat.color.setHex(0xd8b4fe);
            zLine.lineMat.opacity = 0.85;
          } else {
            zLine.lineMat.color.setHex(0x7dd3fc);
            zLine.lineMat.opacity = 0.75;
          }
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

        if (!curLayers.cities || !isEarthCloseup || !earthImpactIntact) {
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

      // 太陽・地球・月・金星・リアル太陽系の惑星/木星4衛星・季節・方位ラベルを更新
      const isInnerSolarLabelsVisible =
        !hideSolarBadgesForCosmic &&
        (!isRealSolarSystem || (!isJupiterFocus && curPose.distance < 260));

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
          !hideSolarBadgesForCosmic &&
            !isJupiterFocus &&
            tmpToCam.dot(camForward) > 0.1,
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
          curLayers.terminatorGuide && !hideSolarBadgesForCosmic && !isCosmicView,
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

      // 地上視点時の北極星（北半球）または天の南極（南半球）ラベル
      if (polarisBadgeRef.current) {
        const nextPolarisText =
          curGroundLatDeg >= 0
            ? `★ 北極星 (高度 ${curGroundLatDeg.toFixed(1)}°)`
            : `◎ 天の南極 (高度 ${Math.abs(curGroundLatDeg).toFixed(1)}°)`;
        if (lastPolarisBadgeText !== nextPolarisText) {
          polarisBadgeRef.current.textContent = nextPolarisText;
          lastPolarisBadgeText = nextPolarisText;
        }
      }
      polarisAnchor.getWorldPosition(tmpWorldPos);
      tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
      updateFloatingBadgeAtPosition(
        polarisBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        isGroundView &&
          Math.abs(curGroundLatDeg) > 0.5 &&
          tmpToCam.dot(camForward) > 0.18,
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
          !hideSolarBadgesForCosmic &&
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
            isSimpleOrbitOverview &&
              !hideSolarBadgesForCosmic &&
              curLayers.eclipticPlane,
            curInspectorOpen,
            false
          );
        }
      }

      // 地上視点時のカシオペア座（W字形）ラベル
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
        isGroundView && casInFront && casAboveHorizon,
        curInspectorOpen,
        false
      );

      // 地上視点時の南十字星（みなみじゅうじ座）ラベル
      tmpWorldPos
        .copy(southernCrossGroup.position)
        .addScaledVector(southernCrossLabelUnitDir, ZODIAC_RADIUS);
      const scInFront = southernCrossLabelUnitDir.dot(camForward) > 0.16;
      const scAboveHorizon =
        southernCrossLabelUnitDir.dot(tokyoUpWorld) > 0.02;
      updateFloatingBadgeAtPosition(
        southernCrossBadgeRef.current,
        tmpWorldPos,
        camera,
        hostW,
        hostH,
        isGroundView && scInFront && scAboveHorizon,
        curInspectorOpen,
        false
      );

      // 黄道13星座（黄道12星座＋へびつかい座）ラベルを更新（太陽公転ビュー・地球から黄道ビュー・地上夜空）
      const showGroundNightZodiacBadges =
        isGroundView && curLayers.zodiacConstellations && tokyoSunElev < 0.04;
      for (const c of ZODIAC_CONSTELLATIONS) {
        const el = zodiacBadgeRefs.current.get(c.id) ?? null;
        const entry = zodiacConstellationEntries.get(c.id);
        if (!el || !entry) continue;

        const isHost = c.id === activeSunZodiac.id && !isGroundView;
        el.classList.toggle("is-sun-host", isHost);

        if (showSunOverheadZodiac) {
          tmpWorldPos
            .copy(entry.labelUnitDir)
            .multiplyScalar(SUN_ORBIT_ZODIAC_RADIUS + 1.4);
          tmpToCam.copy(tmpWorldPos).sub(camera.position).normalize();
          updateFloatingBadgeAtPosition(
            el,
            tmpWorldPos,
            camera,
            hostW,
            hostH,
            tmpToCam.dot(camForward) > 0.1,
            curInspectorOpen,
            false
          );
        } else if (isEclipticSkyView && curLayers.zodiacConstellations) {
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

      // 銀河・局部銀河群・おとめ座銀河団・近傍恒星のコズミック・スケールラベルを更新します。
      const cosmicBadges = cosmicRig.getBadgeWorldPositions(cLevel);
      const visibleCosmicIds = new Set<CosmicBadgeId>();
      for (const item of cosmicBadges) {
        const el = cosmicBadgeRefs.current.get(item.id) ?? null;
        if (!el) continue;
        visibleCosmicIds.add(item.id);
        tmpToCam.copy(item.position).sub(camera.position).normalize();
        updateFloatingBadgeAtPosition(
          el,
          item.position,
          camera,
          hostW,
          hostH,
          item.visible && tmpToCam.dot(camForward) > 0.1,
          curInspectorOpen,
          false
        );
      }
      for (const spec of COSMIC_BADGE_SPECS) {
        if (!visibleCosmicIds.has(spec.id)) {
          const el = cosmicBadgeRefs.current.get(spec.id);
          if (el) el.style.display = "none";
        }
      }

      // 地上夜空・黄道ビューでの四季の星座・大三角／四辺形・主要15恒星ラベルを更新します。
      const showSeasonalGroundLabels =
        seasonalSkyGroup.visible &&
        ((isGroundView && tokyoSunElev < 0.08) || isEclipticSkyView);

      for (const ast of SEASONAL_ASTERISMS) {
        const el = seasonalAsterismBadgeRefs.current.get(ast.id) ?? null;
        const unitDir = seasonalAsterismLabelDirs.get(ast.id);
        if (!el || !unitDir) continue;
        if (!showSeasonalGroundLabels) {
          el.style.display = "none";
          continue;
        }
        tmpWorldPos
          .copy(seasonalSkyGroup.position)
          .addScaledVector(unitDir, ASTERISM_RADIUS);
        const inFront = unitDir.dot(camForward) > 0.18;
        const aboveHorizon = !isGroundView || unitDir.dot(tokyoUpWorld) > 0.04;
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
      }

      for (const sc of SEASONAL_CONSTELLATIONS) {
        const el = seasonalConstellationBadgeRefs.current.get(sc.id) ?? null;
        const unitDir = seasonalConstellationLabelDirs.get(sc.id);
        if (!el || !unitDir) continue;
        if (!showSeasonalGroundLabels || !isGroundView) {
          el.style.display = "none";
          continue;
        }
        tmpWorldPos
          .copy(seasonalSkyGroup.position)
          .addScaledVector(unitDir, ZODIAC_RADIUS);
        const inFront = unitDir.dot(camForward) > 0.2;
        const aboveHorizon = unitDir.dot(tokyoUpWorld) > 0.06;
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
      }

      for (const star of FEATURED_BRIGHT_STARS) {
        const el = featuredStarBadgeRefs.current.get(star.id) ?? null;
        const mesh = seasonalBrightStarMeshes.get(star.id);
        if (!el || !mesh) continue;
        if (!showSeasonalGroundLabels) {
          el.style.display = "none";
          continue;
        }
        mesh.getWorldPosition(tmpWorldPos);
        tmpToCam.set(star.unitDir[0], star.unitDir[1], star.unitDir[2]);
        const inFront = tmpToCam.dot(camForward) > 0.2;
        const aboveHorizon = !isGroundView || tmpToCam.dot(tokyoUpWorld) > 0.03;
        tmpWorldPos.addScaledVector(camera.up, 2.3);
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
      cosmicRig.dispose();
      impactRig.dispose();
      impactRigRef.current = null;
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [cities, onCameraUserDrag]);

  return (
    <div className="viewport-stage">
      <div
        ref={hostRef}
        className={`three-canvas-host ${
          activeImpactorId !== null ? "is-impact-aim" : ""
        }`}
      />
      <div
        ref={impactFlashRef}
        className="impact-flash-overlay"
        aria-hidden="true"
      />
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

        <button
          ref={sunBadgeRef}
          type="button"
          className="space-badge is-sun is-clickable"
          style={{ display: "none" }}
          onClick={() => onSelectCelestialBody("sun")}
          title="太陽をタップして詳細を表示"
        >
          ☀ 太陽
        </button>

        <button
          ref={earthBadgeRef}
          type="button"
          className="space-badge is-earth is-clickable"
          style={{ display: "none" }}
          onClick={() => onSelectCelestialBody("earth")}
          title="地球をタップして詳細を表示"
        >
          ● 地球
        </button>

        <button
          ref={moonBadgeRef}
          type="button"
          className="space-badge is-moon is-clickable"
          style={{ display: "none" }}
          onClick={() => onSelectCelestialBody("moon")}
          title="月をタップして詳細を表示"
        >
          ☾ 月
        </button>

        <button
          ref={venusBadgeRef}
          type="button"
          className="space-badge is-venus is-clickable"
          style={{ display: "none" }}
          onClick={() => onSelectCelestialBody("venus")}
          title="金星をタップして詳細を表示"
        >
          ♀ 金星
        </button>

        {SOLAR_SYSTEM_ELEMENTS.filter(
          (el) => el.id !== "earth" && el.id !== "venus"
        ).map((el) => (
          <button
            key={el.id}
            type="button"
            ref={(node) => {
              if (node) {
                planetBadgeRefs.current.set(el.id, node);
              } else {
                planetBadgeRefs.current.delete(el.id);
              }
            }}
            className="space-badge is-planet is-clickable"
            style={{
              display: "none",
              borderColor: `${el.accentColor}99`,
              color: el.accentColor,
            }}
            onClick={() => onSelectCelestialBody(el.id)}
            title={`${el.nameJa}をタップして詳細を表示`}
          >
            {el.symbol} {el.nameJa}
          </button>
        ))}

        {GALILEAN_MOONS.map((gm) => (
          <button
            key={gm.id}
            type="button"
            ref={(node) => {
              if (node) {
                galileanBadgeRefs.current.set(gm.id, node);
              } else {
                galileanBadgeRefs.current.delete(gm.id);
              }
            }}
            className="space-badge is-satellite is-clickable"
            style={{
              display: "none",
              borderColor: `${gm.color}88`,
              color: gm.color,
            }}
            onClick={() => onSelectCelestialBody(gm.id)}
            title={`${gm.nameJa}をタップして詳細を表示`}
          >
            ◦ {gm.nameJa}
          </button>
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
          ref={southernCrossBadgeRef}
          className="space-badge is-polaris"
          style={{ display: "none" }}
        >
          ✦ 南十字星 (みなみじゅうじ座)
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

        {COSMIC_BADGE_SPECS.map((spec) =>
          spec.clickableBodyId !== null ? (
            <button
              key={spec.id}
              type="button"
              ref={(el) => {
                if (el) {
                  cosmicBadgeRefs.current.set(spec.id, el);
                } else {
                  cosmicBadgeRefs.current.delete(spec.id);
                }
              }}
              className="space-badge is-cosmic is-clickable"
              style={{
                display: "none",
                borderColor: `${spec.accentColor}99`,
                color: spec.accentColor,
              }}
              onClick={() => onSelectCelestialBody(spec.clickableBodyId!)}
              title={`${spec.label}をタップして詳細を表示`}
            >
              {spec.label}
            </button>
          ) : (
            <span
              key={spec.id}
              ref={(el) => {
                if (el) {
                  cosmicBadgeRefs.current.set(spec.id, el);
                } else {
                  cosmicBadgeRefs.current.delete(spec.id);
                }
              }}
              className="space-badge is-cosmic is-cosmic-info"
              style={{
                display: "none",
                borderColor: `${spec.accentColor}66`,
                color: spec.accentColor,
              }}
            >
              {spec.label}
            </span>
          )
        )}

        {SEASONAL_ASTERISMS.map((ast) => (
          <span
            key={ast.id}
            ref={(el) => {
              if (el) {
                seasonalAsterismBadgeRefs.current.set(ast.id, el);
              } else {
                seasonalAsterismBadgeRefs.current.delete(ast.id);
              }
            }}
            className="space-badge is-asterism"
            style={{
              display: "none",
              borderColor: `${ast.colorHex}aa`,
              color: ast.colorHex,
            }}
          >
            {ast.nameJa}
          </span>
        ))}

        {SEASONAL_CONSTELLATIONS.map((sc) => (
          <span
            key={sc.id}
            ref={(el) => {
              if (el) {
                seasonalConstellationBadgeRefs.current.set(sc.id, el);
              } else {
                seasonalConstellationBadgeRefs.current.delete(sc.id);
              }
            }}
            className="space-badge is-seasonal-constellation"
            style={{ display: "none" }}
          >
            {sc.nameJa}
          </span>
        ))}

        {FEATURED_BRIGHT_STARS.map((star) => (
          <button
            key={star.id}
            type="button"
            ref={(el) => {
              if (el) {
                featuredStarBadgeRefs.current.set(star.id, el);
              } else {
                featuredStarBadgeRefs.current.delete(star.id);
              }
            }}
            className="space-badge is-bright-star is-clickable"
            style={{
              display: "none",
              borderColor: `${star.colorHex}aa`,
              color: star.colorHex,
            }}
            onClick={() => onSelectCelestialBody(star.bodyId)}
            title={`${star.nameJa}（${star.constellationJa}・約${star.distanceLy}光年）をタップして詳細を表示`}
          >
            ★ {star.nameJa}
          </button>
        ))}
      </div>
    </div>
  );
};
