import * as THREE from "three";
import {
  IMPACTOR_MAP,
  ImpactorId,
  ImpactorSpec,
  SATELLITE_DISPLAY_SYSTEMS,
  SOLAR_TARGET_MAP,
  SOLAR_TARGET_SPECS,
  SatelliteHostId,
  SatelliteHostSnapshot,
  SolarCollisionEvent,
  SolarImpactTargetId,
  SolarImpactorEntry,
  SolarNBodyEntry,
  advanceSolarNBody,
  buildDisplayWarpHosts,
  createSolarNBodyEntriesFromSnapshot,
  displaySnapshotToPhysics,
  predictSolarNBodyTrajectory,
  snapshotSatelliteHosts,
} from "../astronomy/impactPhysics";
import {
  DisplayWarpHost,
  Vec3Like,
  warpDisplayToPhysics,
  warpPhysicsToDisplay,
} from "../astronomy/displayWarp";
import { ASTRO_SECONDS_PER_SIM_TIME } from "../astronomy/realBodyData";

/**
 * リアル太陽系・N体相互万有引力＆天体衝突シミュレーターの 3D 演出・パーティクル・シェーダー統合リグです。
 * solarWorldGroup（太陽中心のワールド座標）内に配置され、
 * 太陽＋水金地火木土天海冥＋月＋木星4衛星（全15天体）と投入天体（全10種・恒星／中性子星／BH含む）が
 * 互いの万有引力で軌道を変え、互いに衝突・吸収・崩壊する様子と、復活ボタンでの「ぬるっと復活」を描画します。
 * 投入天体は種類を混ぜて何個でも続けて置けます（同時に置ける数は MAX_LIVE_IMPACTORS 個まで）。
 *
 * 物理計算（impactPhysics.ts）は実際の質量・半径・距離で行い、このリグは「見せ方」だけを受け持ちます。
 * - 物理上の位置 → 描く位置：衛星を持つ母惑星（地球・木星）のまわりだけ広げて描きます（displayWarp.ts）
 * - 描く位置 → 物理上の位置：画面で狙った位置や向きを、物理計算で天体を置く位置・速度に直します
 * - 時間：アプリの時間の進み方（倍速）に合わせて物理の時間を進めます（一時停止中は止まります）
 */

export type ImpactSimPhase =
  | "idle"
  | "aiming"
  | "flying"
  | "impacting"
  | "aftermath"
  | "restoring";

/** 毎フレーム EarthGlobeCanvas から渡される、各太陽系天体の本来の天文位置と表示半径 */
export interface SolarBaselineBodyInput {
  id: SolarImpactTargetId;
  pos: THREE.Vector3;
  radius: number;
}

/** 各太陽系天体へ反映する N体シミュレーション後の位置・スケール・ダメージ情報 */
export interface SolarBodySimRenderState {
  /** N体物理が有効な間のワールド座標（solarWorldGroup 座標） */
  worldPos: THREE.Vector3;
  /** 本来の位置からの変位ベクトル（worldPos - baselinePos） */
  offsetWorld: THREE.Vector3;
  /** 消滅・復元時のスケール倍率（1 = 通常, 0 = 消滅） */
  scaleFactor: number;
  /** 衝突クレーター・赤熱ダメージの向き（ワールド法線またはローカル法線） */
  impactDir: THREE.Vector3;
  /** クレーター角半径（ラジアン） */
  craterRadius: number;
  /** 衝突熱・発光強度（0〜1） */
  damageHeat: number;
  /** 地殻のマグマ亀裂強度（0〜1） */
  crackIntensity: number;
  /** 衝突発光カラー */
  impactColor: THREE.Vector3;
}

export interface ImpactFrameOutput {
  phase: ImpactSimPhase;
  statusLabelJa: string;
  /** N体シミュレーションが進行中か（true の間は各天体の位置を bodyStates.worldPos で上書きします） */
  isNBodyActive: boolean;
  /** 太陽系全15天体それぞれの現在位置・スケール・ダメージ状態 */
  bodyStates: Record<SolarImpactTargetId, SolarBodySimRenderState>;
  /** 地球用の追加シェーダーパラメータ（自転追従ローカル法線・衝撃波リング・地軸ぐらつき・大気加熱） */
  earthImpactLocalDir: THREE.Vector3;
  earthCraterRadius: number;
  earthDamageHeat: number;
  earthCrackIntensity: number;
  earthShockAngleRad: number;
  earthImpactColor: THREE.Vector3;
  earthOffsetLocal: THREE.Vector3;
  earthScaleFactor: number;
  earthAxisWobbleRad: number;
  atmosphereHeat: number;
  /** 月用の追加シェーダーパラメータ */
  moonImpactLocalDir: THREE.Vector3;
  moonCraterRadius: number;
  moonDamageHeat: number;
  moonCrackIntensity: number;
  moonEarthMagmaGlow: number;
  moonOffsetLocal: THREE.Vector3;
  moonScaleFactor: number;
  /** カメラシェイク強度（0〜1）と画面フラッシュ */
  cameraShake: number;
  screenFlashOpacity: number;
  screenFlashColorCss: string;
  /** 軌道変化や衝突が進行中で「復活」ボタンを表示すべきか */
  canTriggerRestore: boolean;
  /** 今置かれている投入天体の数 */
  liveImpactorCount: number;
}

export interface ImpactSystemRig {
  root: THREE.Group;
  /** ドラッグ開始／更新時のN体予測軌道プレビュー更新 */
  updateAimPreview: (
    impactorId: ImpactorId,
    spawnWorldPos: THREE.Vector3,
    launchVel: THREE.Vector3,
    baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
  ) => void;
  /** ドラッグキャンセル時にプレビューを消す */
  cancelAimPreview: () => void;
  /** 天体をリアル太陽系へ発射します。すでに置いた天体は消えずに残り、何個でも続けて追加できます。 */
  launchImpactor: (
    impactorId: ImpactorId,
    spawnWorldPos: THREE.Vector3,
    launchVel: THREE.Vector3,
    baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
  ) => void;
  /** 「復活」ボタンが押されたときに3.2秒かけて全天体を元の公転軌道へ「ぬるっと復活」させる */
  triggerSmoothRestore: () => void;
  /** 即座に完全リセット */
  resetImmediate: () => void;
  /** 毎フレーム更新し、全15天体・大気・カメラ演出パラメータを返す */
  update: (
    dt: number,
    totalTimeSec: number,
    baselineBodies: ReadonlyArray<SolarBaselineBodyInput>,
    earthWorldQuat: THREE.Quaternion,
    moonRotationY: number,
    astroSecondsPerSecond: number
  ) => ImpactFrameOutput;
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// 爆発火球用カスタム GLSL シェーダー（3D 乱流プラズマ＋黒体温度冷却）
// ---------------------------------------------------------------------------
const FIREBALL_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uTurbulence;
  varying vec3 vNormalDir;
  varying vec3 vLocalDir;
  varying float vDisp;

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec3(1.0, 0.0, 0.0));
    float c = hash(i + vec3(0.0, 1.0, 0.0));
    float d = hash(i + vec3(1.0, 1.0, 0.0));
    float e = hash(i + vec3(0.0, 0.0, 1.0));
    float f1 = hash(i + vec3(1.0, 0.0, 1.0));
    float g = hash(i + vec3(0.0, 1.0, 1.0));
    float h = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
               mix(mix(e, f1, f.x), mix(g, h, f.x), f.y), f.z);
  }

  void main() {
    vec3 dir = normalize(position);
    vLocalDir = dir;
    float n1 = noise(dir * 3.8 + vec3(uTime * 1.9));
    float n2 = noise(dir * 8.2 - vec3(uTime * 2.8));
    float disp = (n1 * 0.65 + n2 * 0.35 - 0.3) * uTurbulence;
    vDisp = disp;
    vec3 displaced = position * (1.0 + disp);
    vNormalDir = normalize(normalMatrix * dir);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const FIREBALL_FRAG = /* glsl */ `
  uniform vec3 uColorHot;
  uniform vec3 uColorCool;
  uniform float uOpacity;
  uniform float uHeat;
  varying vec3 vNormalDir;
  varying vec3 vLocalDir;
  varying float vDisp;

  void main() {
    float rim = 1.0 - abs(vNormalDir.z);
    float core = clamp(1.0 - rim * 0.82 + vDisp * 0.9, 0.0, 1.0);
    vec3 whiteHot = vec3(1.0, 0.98, 0.92);
    vec3 midCol = mix(uColorCool, uColorHot, clamp(core * 1.25, 0.0, 1.0));
    vec3 col = mix(midCol, whiteHot, pow(core * uHeat, 1.55));
    float alpha = uOpacity * smoothstep(0.0, 0.28, 1.0 - rim * 0.85);
    gl_FragColor = vec4(col * 1.35, clamp(alpha, 0.0, 1.0));
  }
`;

const SHOCKRING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHOCKRING_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float outerRing = exp(-pow((r - 0.82) / 0.11, 2.0));
    float innerGlow = exp(-pow((r - 0.56) / 0.18, 2.0)) * 0.45;
    float alpha = (outerRing + innerGlow) * uOpacity * smoothstep(1.0, 0.9, r);
    vec3 col = mix(uColor, vec3(1.0, 0.98, 0.9), outerRing * 0.68);
    gl_FragColor = vec4(col * 1.4, clamp(alpha, 0.0, 1.0));
  }
`;

const ACCRETION_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ACCRETION_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float spiral = sin(angle * 4.0 - r * 14.0 + uTime * 7.5) * 0.5 + 0.5;
    float spiral2 = sin(angle * 7.0 - r * 22.0 + uTime * 11.0) * 0.5 + 0.5;
    float band = smoothstep(0.32, 0.46, r) * (1.0 - smoothstep(0.68, 0.98, r));
    float innerPhoton = exp(-pow((r - 0.36) / 0.055, 2.0)) * 1.45;
    vec3 c1 = vec3(0.58, 0.22, 0.98);
    vec3 c2 = vec3(1.0, 0.52, 0.18);
    vec3 c3 = vec3(1.0, 0.96, 0.88);
    vec3 col = mix(c1, c2, spiral * 0.75 + spiral2 * 0.25);
    col = mix(col, c3, clamp(innerPhoton + uBurst * 0.65, 0.0, 1.0));
    float alpha = (band * (0.58 + 0.42 * spiral) + innerPhoton) * uOpacity;
    gl_FragColor = vec4(col * (1.25 + uBurst * 0.9), clamp(alpha, 0.0, 1.0));
  }
`;

function createDisplacedRockGeometry(
  radius: number,
  seed: number
): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(radius, 3);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    const w1 =
      Math.sin(n.x * 4.3 + seed) *
      Math.cos(n.y * 3.9 - seed * 0.7) *
      Math.sin(n.z * 4.7 + seed * 1.3);
    const w2 =
      Math.sin(n.x * 9.5 - seed * 1.8) * Math.cos(n.z * 8.7 + seed * 0.5);
    const scale = 1.0 + w1 * 0.24 + w2 * 0.09;
    v.multiplyScalar(scale);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

const MAX_DEBRIS = 280;
const MAX_SPARKS = 480;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** 同時に置いておける投入天体の最大数（これを超えると、いちばん古い天体から消えます） */
export const MAX_LIVE_IMPACTORS = 16;
/** 描く半径がこれより大きい恒星（リゲル）は、画面を覆わないよう半透明で描きます */
const HUGE_STAR_DISPLAY_RADIUS = 20;
/** 狙い中に予測する長さ（シミュレーション時間。約 3.0 ≒ 4か月ぶん） */
const PREVIEW_HORIZON_SIM_TIME = 3.0;
/** 母惑星が消えたあと、衛星を広げて描く効果を何秒かけて弱めるか */
const WARP_FADE_SECONDS = 1.2;
/** 狙いの向きを物理上の向きに直すときに使う、描く位置での小さな移動量（シーン単位） */
const AIM_DIRECTION_PROBE = 0.02;
/** 同時に描画できる爆発（火球・衝撃波・閃光）の最大数 */
const MAX_EXPLOSIONS = 6;
/** 破片・火花が「どの天体にも吸い込まれない」ことを表す番号 */
const NO_SWALLOW_UID = -1;
/** 太陽系天体同士がぶつかったときの爆発の見た目（岩石惑星どうしの衝突として描きます） */
const BODY_COLLISION_EFFECT_SPEC: ImpactorSpec = IMPACTOR_MAP.marsSize;
/** 中性子星の模型の中で、パルサービームの回転軸に付ける名前 */
const PULSAR_PIVOT_NAME = "pulsarBeamPivot";


function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function createImpactSystemRig(
  starTexture: THREE.Texture,
  moonTexture: THREE.Texture,
  marsTexture: THREE.Texture,
  jupiterTexture: THREE.Texture
): ImpactSystemRig {
  const root = new THREE.Group();
  const allGeos: THREE.BufferGeometry[] = [];
  const allMats: THREE.Material[] = [];

  // -------------------------------------------------------------------------
  // 1. 予測軌道ライン・惑星摂動プレビューライン・全15天体用ターゲットレティクル
  // -------------------------------------------------------------------------
  const maxPreviewPts = 180;
  const previewPositions = new Float32Array(maxPreviewPts * 3);
  const previewGeo = new THREE.BufferGeometry();
  previewGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(previewPositions, 3)
  );
  previewGeo.setDrawRange(0, 0);
  const previewMat = new THREE.LineDashedMaterial({
    color: 0xfbbf24,
    dashSize: 0.9,
    gapSize: 0.45,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  });
  const previewLine = new THREE.Line(previewGeo, previewMat);
  previewLine.visible = false;
  previewLine.renderOrder = 5;
  root.add(previewLine);
  allGeos.push(previewGeo);
  allMats.push(previewMat);

  // 太陽系天体ごとのターゲットレティクル＆予測摂動ライン＆リアルタイム軌道乱れトレイル
  const reticleGeo = new THREE.RingGeometry(0.85, 1.35, 32);
  allGeos.push(reticleGeo);
  const targetReticles = new Map<
    SolarImpactTargetId,
    { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }
  >();
  const perturbedPreviewLines = new Map<
    SolarImpactTargetId,
    { line: THREE.Line; geo: THREE.BufferGeometry }
  >();
  const liveOrbitTrailLines = new Map<
    SolarImpactTargetId,
    {
      line: THREE.Line;
      geo: THREE.BufferGeometry;
      history: THREE.Vector3[];
    }
  >();
  const liveTrailLen = 72;

  for (const spec of SOLAR_TARGET_SPECS) {
    const rMat = new THREE.MeshBasicMaterial({
      color: spec.accentHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(reticleGeo, rMat);
    rMesh.visible = false;
    rMesh.renderOrder = 6;
    root.add(rMesh);
    allMats.push(rMat);
    targetReticles.set(spec.id, { mesh: rMesh, mat: rMat });

    // 予測摂動ライン（太陽と主要惑星のみ）
    if (spec.parentId === null) {
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(maxPreviewPts * 3), 3)
      );
      pGeo.setDrawRange(0, 0);
      const pMat = new THREE.LineDashedMaterial({
        color: spec.accentHex,
        dashSize: 0.65,
        gapSize: 0.35,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      });
      const pLine = new THREE.Line(pGeo, pMat);
      pLine.visible = false;
      pLine.renderOrder = 4;
      root.add(pLine);
      allGeos.push(pGeo);
      allMats.push(pMat);
      perturbedPreviewLines.set(spec.id, { line: pLine, geo: pGeo });

      // N体運動中のリアルタイム軌道乱れトレイル
      const tGeo = new THREE.BufferGeometry();
      tGeo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(liveTrailLen * 3), 3)
      );
      tGeo.setDrawRange(0, 0);
      const tMat = new THREE.LineBasicMaterial({
        color: spec.accentHex,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      });
      const tLine = new THREE.Line(tGeo, tMat);
      tLine.visible = false;
      tLine.renderOrder = 3;
      root.add(tLine);
      allGeos.push(tGeo);
      allMats.push(tMat);
      liveOrbitTrailLines.set(spec.id, {
        line: tLine,
        geo: tGeo,
        history: [],
      });
    }
  }

  // -------------------------------------------------------------------------
  // 2. 全10種類の投入天体の「ひな形」3Dモデル群（小天体・惑星・恒星3種・中性子星・ブラックホール）
  //    ひな形そのものは画面に出しません。天体を置くたびに clone() で複製して1個ずつ表示します。
  //    clone() した模型は形（ジオメトリ）と材質（マテリアル）をひな形と共有するので、何個置いても軽量です。
  // -------------------------------------------------------------------------
  const impactorTemplates = new Map<ImpactorId, THREE.Group>();

  // 実際に置いた天体（と狙い中のプレビュー）をまとめて入れるグループ
  const liveImpactorsRoot = new THREE.Group();
  root.add(liveImpactorsRoot);

  // 投入天体を照らす補助ライト（1個だけ用意して、狙い中の天体または最後に置いた天体に付いていきます）。
  // ライトの数が変わると全マテリアルのシェーダーが作り直されて画面がカクつくため、数は常に1個のまま、
  // 使わないときは明るさ（intensity）を 0 にします。
  const IMPACTOR_LIGHT_INTENSITY = 2.2;
  const impactorLight = new THREE.PointLight(0xffedd5, 0, 65);
  root.add(impactorLight);

  // (a) 小惑星
  const asteroidGroup = new THREE.Group();
  const asteroidGeo = createDisplacedRockGeometry(
    IMPACTOR_MAP.asteroid.visualRadius,
    1.7
  );
  const asteroidMat = new THREE.MeshStandardMaterial({
    color: 0x8d7768,
    roughness: 0.86,
    metalness: 0.14,
    emissive: 0xff5500,
    emissiveIntensity: 0.25,
  });
  asteroidGroup.add(new THREE.Mesh(asteroidGeo, asteroidMat));
  impactorTemplates.set("asteroid", asteroidGroup);
  allGeos.push(asteroidGeo);
  allMats.push(asteroidMat);

  // (b) 氷彗星
  const cometGroup = new THREE.Group();
  const cometGeo = createDisplacedRockGeometry(
    IMPACTOR_MAP.comet.visualRadius,
    4.2
  );
  const cometMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.35,
    metalness: 0.1,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.6,
  });
  cometGroup.add(new THREE.Mesh(cometGeo, cometMat));
  const comaSpriteMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const comaSprite = new THREE.Sprite(comaSpriteMat);
  comaSprite.scale.setScalar(1.3);
  cometGroup.add(comaSprite);
  impactorTemplates.set("comet", cometGroup);
  allGeos.push(cometGeo);
  allMats.push(cometMat, comaSpriteMat);

  // (c) 月サイズ
  const moonSizeGroup = new THREE.Group();
  const moonSizeGeo = new THREE.SphereGeometry(
    IMPACTOR_MAP.moonSize.visualRadius,
    36,
    24
  );
  const moonSizeMat = new THREE.MeshStandardMaterial({
    map: moonTexture,
    roughness: 0.88,
    emissive: 0xff4500,
    emissiveIntensity: 0.08,
  });
  moonSizeGroup.add(new THREE.Mesh(moonSizeGeo, moonSizeMat));
  impactorTemplates.set("moonSize", moonSizeGroup);
  allGeos.push(moonSizeGeo);
  allMats.push(moonSizeMat);

  // (d) 火星サイズ
  const marsSizeGroup = new THREE.Group();
  const marsSizeGeo = new THREE.SphereGeometry(
    IMPACTOR_MAP.marsSize.visualRadius,
    40,
    28
  );
  const marsSizeMat = new THREE.MeshStandardMaterial({
    map: marsTexture,
    roughness: 0.78,
    emissive: 0xff3300,
    emissiveIntensity: 0.12,
  });
  marsSizeGroup.add(new THREE.Mesh(marsSizeGeo, marsSizeMat));
  impactorTemplates.set("marsSize", marsSizeGroup);
  allGeos.push(marsSizeGeo);
  allMats.push(marsSizeMat);

  // (e) 木星サイズ
  const jupiterGroup = new THREE.Group();
  const jupiterGeo = new THREE.SphereGeometry(
    IMPACTOR_MAP.jupiterSize.visualRadius,
    48,
    32
  );
  const jupiterMat = new THREE.MeshStandardMaterial({
    map: jupiterTexture,
    roughness: 0.65,
    emissive: 0xff7b00,
    emissiveIntensity: 0.12,
    transparent: true,
    opacity: 1,
  });
  jupiterGroup.add(new THREE.Mesh(jupiterGeo, jupiterMat));
  const jupiterHotspotMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0xffaa00,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const jupiterHotspot = new THREE.Sprite(jupiterHotspotMat);
  jupiterHotspot.scale.setScalar(2.6);
  jupiterGroup.add(jupiterHotspot);
  impactorTemplates.set("jupiterSize", jupiterGroup);
  allGeos.push(jupiterGeo);
  allMats.push(jupiterMat, jupiterHotspotMat);

  // 恒星モデル生成ヘルパー（赤色矮星・太陽クラス恒星・青色超巨星）
  const createStarImpactorGroup = (
    radius: number,
    coreHex: number,
    coronaHex: number,
    haloScale: number
  ) => {
    // リゲル（青色超巨星）は実際の比率で描くと半径が土星の軌道を超えるほど大きくなります。
    // 不透明のまま描くと画面全体が覆われて惑星も操作も見えなくなるため、本体を半透明にし、
    // まわりの光（コロナ・ハロー）も薄く小さくして、中にある惑星が透けて見えるようにします。
    const isHuge = radius > HUGE_STAR_DISPLAY_RADIUS;
    const grp = new THREE.Group();
    const sGeo = new THREE.SphereGeometry(radius, 44, 28);
    const sMat = new THREE.MeshBasicMaterial({
      color: coreHex,
      transparent: true,
      opacity: isHuge ? 0.16 : 1,
      depthWrite: !isHuge,
      side: isHuge ? THREE.DoubleSide : THREE.FrontSide,
    });
    grp.add(new THREE.Mesh(sGeo, sMat));

    const cGeo = new THREE.SphereGeometry(radius * (isHuge ? 1.04 : 1.22), 36, 24);
    const cMat = new THREE.MeshBasicMaterial({
      color: coronaHex,
      transparent: true,
      opacity: isHuge ? 0.08 : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    grp.add(new THREE.Mesh(cGeo, cMat));

    const hMat = new THREE.SpriteMaterial({
      map: starTexture,
      color: coronaHex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hSprite = new THREE.Sprite(hMat);
    hSprite.scale.setScalar(radius * haloScale);
    // 半透明の巨大な恒星では、まわりの光（ハロー）は画面の大部分を白く覆ってしまうので描きません
    hSprite.visible = !isHuge;
    grp.add(hSprite);

    allGeos.push(sGeo, cGeo);
    allMats.push(sMat, cMat, hMat);
    return { grp, sMat, cMat, hMat };
  };

  // (f) 赤色矮星
  const redDwarfBundle = createStarImpactorGroup(
    IMPACTOR_MAP.redDwarf.visualRadius,
    0xff5c77,
    0xfb7185,
    4.2
  );
  impactorTemplates.set("redDwarf", redDwarfBundle.grp);

  // (g) 太陽クラス恒星
  const sunStarBundle = createStarImpactorGroup(
    IMPACTOR_MAP.sunStar.visualRadius,
    0xfff3b0,
    0xfbbf24,
    4.6
  );
  impactorTemplates.set("sunStar", sunStarBundle.grp);

  // (h) 青色超巨星
  const blueSupergiantBundle = createStarImpactorGroup(
    IMPACTOR_MAP.blueSupergiant.visualRadius,
    0xe0f2fe,
    0x38bdf8,
    5.2
  );
  impactorTemplates.set("blueSupergiant", blueSupergiantBundle.grp);

  // (i) 中性子星（高速回転パルサー：高輝度シアン白色コア＋磁気圏リング＋傾いた双極パルサービーム！）
  const neutronGroup = new THREE.Group();
  const nsRadius = IMPACTOR_MAP.neutronStar.visualRadius;
  const nsCoreGeo = new THREE.SphereGeometry(nsRadius * 0.55, 32, 24);
  const nsCoreMat = new THREE.MeshBasicMaterial({
    color: 0xecfeff,
    transparent: true,
    opacity: 1,
  });
  neutronGroup.add(new THREE.Mesh(nsCoreGeo, nsCoreMat));

  const nsHaloMat = new THREE.SpriteMaterial({
    map: starTexture,
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nsHalo = new THREE.Sprite(nsHaloMat);
  nsHalo.scale.setScalar(nsRadius * 5.8);
  neutronGroup.add(nsHalo);

  // パルサービームの回転軸。複製した模型からも名前で探して回せるように名前を付けます。
  const nsBeamPivot = new THREE.Group();
  nsBeamPivot.name = PULSAR_PIVOT_NAME;
  nsBeamPivot.rotation.z = 0.46;
  const nsBeamGeo = new THREE.ConeGeometry(nsRadius * 0.65, nsRadius * 9.5, 24, 1, true);
  const nsBeamMat = new THREE.MeshBasicMaterial({
    color: 0x67e8f9,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.62,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nsBeamTop = new THREE.Mesh(nsBeamGeo, nsBeamMat);
  nsBeamTop.position.y = nsRadius * 4.8;
  nsBeamTop.rotation.x = Math.PI;
  const nsBeamBot = new THREE.Mesh(nsBeamGeo, nsBeamMat);
  nsBeamBot.position.y = -nsRadius * 4.8;
  nsBeamPivot.add(nsBeamTop, nsBeamBot);
  neutronGroup.add(nsBeamPivot);
  impactorTemplates.set("neutronStar", neutronGroup);
  allGeos.push(nsCoreGeo, nsBeamGeo);
  allMats.push(nsCoreMat, nsHaloMat, nsBeamMat);

  // (j) ブラックホール（事象の地平線＋回転する降着円盤＋光子リング＋双極ジェット）
  const bhGroup = new THREE.Group();
  const bhCoreGeo = new THREE.SphereGeometry(
    IMPACTOR_MAP.blackHole.visualRadius * 0.55,
    40,
    28
  );
  const bhCoreMat = new THREE.MeshBasicMaterial({
    color: 0x020106,
    transparent: true,
    opacity: 1,
  });
  bhGroup.add(new THREE.Mesh(bhCoreGeo, bhCoreMat));

  const bhAccretionUniforms = {
    uTime: { value: 0 },
    uBurst: { value: 0 },
    uOpacity: { value: 1 },
  };
  const bhDiskGeo = new THREE.PlaneGeometry(
    IMPACTOR_MAP.blackHole.visualRadius * 4.6,
    IMPACTOR_MAP.blackHole.visualRadius * 4.6
  );
  const bhDiskMat = new THREE.ShaderMaterial({
    uniforms: bhAccretionUniforms,
    vertexShader: ACCRETION_VERT,
    fragmentShader: ACCRETION_FRAG,
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bhDiskMesh = new THREE.Mesh(bhDiskGeo, bhDiskMat);
  bhDiskMesh.rotation.x = Math.PI * 0.37;
  bhGroup.add(bhDiskMesh);

  const bhPhotonGeo = new THREE.RingGeometry(
    IMPACTOR_MAP.blackHole.visualRadius * 0.56,
    IMPACTOR_MAP.blackHole.visualRadius * 0.86,
    48
  );
  const bhPhotonMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bhPhotonRing = new THREE.Mesh(bhPhotonGeo, bhPhotonMat);
  bhPhotonRing.rotation.y = Math.PI * 0.15;
  bhGroup.add(bhPhotonRing);

  const bhJetGeo = new THREE.ConeGeometry(0.32, 4.8, 24, 1, true);
  const bhJetMat = new THREE.MeshBasicMaterial({
    color: 0xd8b4fe,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bhJetTop = new THREE.Mesh(bhJetGeo, bhJetMat);
  bhJetTop.position.y = 2.4;
  bhJetTop.rotation.x = Math.PI;
  const bhJetBottom = new THREE.Mesh(bhJetGeo, bhJetMat);
  bhJetBottom.position.y = -2.4;
  bhGroup.add(bhJetTop, bhJetBottom);
  impactorTemplates.set("blackHole", bhGroup);
  allGeos.push(bhCoreGeo, bhDiskGeo, bhPhotonGeo, bhJetGeo);
  allMats.push(bhCoreMat, bhDiskMat, bhPhotonMat, bhJetMat);


  // -------------------------------------------------------------------------
  // 3. 置いた天体1個ぶんの表示（模型＋飛行軌跡トレイル）の作成・破棄
  // -------------------------------------------------------------------------
  const trailLen = 36;

  /** ひな形を複製して、1個ぶんの投入天体の模型を作ります。 */
  const createImpactorModel = (
    impactorId: ImpactorId
  ): { group: THREE.Group; pulsarPivot: THREE.Object3D | null } => {
    const template = impactorTemplates.get(impactorId);
    const group = template ? template.clone(true) : new THREE.Group();
    const pulsarPivot = group.getObjectByName(PULSAR_PIVOT_NAME) ?? null;
    return { group, pulsarPivot };
  };

  /** 置いた天体1個ぶんの、物理状態と表示物のまとまり */
  interface LiveImpactorVisual {
    entry: SolarImpactorEntry;
    spec: ImpactorSpec;
    group: THREE.Group;
    pulsarPivot: THREE.Object3D | null;
    trailHistory: THREE.Vector3[];
    trailGeo: THREE.BufferGeometry;
    trailMat: THREE.PointsMaterial;
    trailPoints: THREE.Points;
  }

  const createLiveImpactorVisual = (
    entry: SolarImpactorEntry
  ): LiveImpactorVisual => {
    const spec = IMPACTOR_MAP[entry.specId];
    const { group, pulsarPivot } = createImpactorModel(entry.specId);
    // 物理上の位置を、描く位置（衛星のまわりは広げた位置）に直して置きます
    physicsToDisplay(entry.pos, group.position);
    // 模型は visualRadius（描く半径）どおりの大きさで描きます（倍率 1）
    group.scale.setScalar(1);
    liveImpactorsRoot.add(group);

    // 飛行軌跡トレイル（天体ごとに色と太さが違うので、ジオメトリと材質は1個ずつ作ります）
    const trailHistory: THREE.Vector3[] = [];
    for (let i = 0; i < trailLen; i++) {
      trailHistory.push(group.position.clone());
    }
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(trailLen * 3), 3)
    );
    trailGeo.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(trailLen * 3), 3)
    );
    const trailMat = new THREE.PointsMaterial({
      // 軌跡の点の大きさは描く半径に合わせますが、リゲルのように巨大な天体で画面が白く覆われないよう上限を設けます
      size: Math.min(spec.visualRadius * 2.5 + 0.55, 6),
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    root.add(trailPoints);

    return {
      entry,
      spec,
      group,
      pulsarPivot,
      trailHistory,
      trailGeo,
      trailMat,
      trailPoints,
    };
  };

  /** 置いた天体1個ぶんの表示物を画面から外し、トレイル用に作ったメモリを解放します。 */
  const disposeLiveImpactorVisual = (visual: LiveImpactorVisual) => {
    liveImpactorsRoot.remove(visual.group);
    root.remove(visual.trailPoints);
    visual.trailGeo.dispose();
    visual.trailMat.dispose();
  };

  // -------------------------------------------------------------------------
  // 4. 爆発エフェクト（火球・二重衝撃波リング・閃光）を複数同時に出せるようにした「爆発スロット」
  //    天体をいくつも置くと別々の場所で同時に衝突が起こるため、爆発を MAX_EXPLOSIONS 個まで並行して描画します。
  // -------------------------------------------------------------------------
  const fireballGeo = new THREE.IcosahedronGeometry(1, 4);
  const shockGeo = new THREE.PlaneGeometry(2, 2);
  allGeos.push(fireballGeo, shockGeo);

  interface ExplosionSlot {
    /** 演出中か */
    active: boolean;
    /** 衝突してからの経過秒数 */
    elapsed: number;
    /** 爆発の見た目を決める投入天体の種類 */
    spec: ImpactorSpec;
    /** 爆発の大きさの倍率 */
    scale: number;
    fireballMesh: THREE.Mesh;
    fireballUniforms: {
      uTime: { value: number };
      uTurbulence: { value: number };
      uColorHot: { value: THREE.Color };
      uColorCool: { value: THREE.Color };
      uOpacity: { value: number };
      uHeat: { value: number };
    };
    shockMesh1: THREE.Mesh;
    shockUniforms1: { uColor: { value: THREE.Color }; uOpacity: { value: number } };
    shockMesh2: THREE.Mesh;
    shockUniforms2: { uColor: { value: THREE.Color }; uOpacity: { value: number } };
    blastFlare: THREE.Sprite;
    blastFlareMat: THREE.SpriteMaterial;
  }

  const createExplosionSlot = (): ExplosionSlot => {
    const fireballUniforms = {
      uTime: { value: 0 },
      uTurbulence: { value: 0.32 },
      uColorHot: { value: new THREE.Color(0xffaa00) },
      uColorCool: { value: new THREE.Color(0xd93800) },
      uOpacity: { value: 0 },
      uHeat: { value: 1 },
    };
    const fireballMat = new THREE.ShaderMaterial({
      uniforms: fireballUniforms,
      vertexShader: FIREBALL_VERT,
      fragmentShader: FIREBALL_FRAG,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireballMesh = new THREE.Mesh(fireballGeo, fireballMat);
    fireballMesh.visible = false;
    fireballMesh.renderOrder = 6;
    root.add(fireballMesh);

    const makeShock = (hex: number) => {
      const uniforms = {
        uColor: { value: new THREE.Color(hex) },
        uOpacity: { value: 0 },
      };
      const mat = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: SHOCKRING_VERT,
        fragmentShader: SHOCKRING_FRAG,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(shockGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 7;
      root.add(mesh);
      allMats.push(mat);
      return { mesh, uniforms };
    };
    const shock1 = makeShock(0xff8800);
    const shock2 = makeShock(0xfef08a);

    const blastFlareMat = new THREE.SpriteMaterial({
      map: starTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const blastFlare = new THREE.Sprite(blastFlareMat);
    blastFlare.visible = false;
    blastFlare.renderOrder = 8;
    root.add(blastFlare);
    allMats.push(fireballMat, blastFlareMat);

    return {
      active: false,
      elapsed: 0,
      spec: IMPACTOR_MAP.asteroid,
      scale: 1,
      fireballMesh,
      fireballUniforms,
      shockMesh1: shock1.mesh,
      shockUniforms1: shock1.uniforms,
      shockMesh2: shock2.mesh,
      shockUniforms2: shock2.uniforms,
      blastFlare,
      blastFlareMat,
    };
  };

  const explosionSlots: ExplosionSlot[] = [];
  for (let i = 0; i < MAX_EXPLOSIONS; i++) {
    explosionSlots.push(createExplosionSlot());
  }

  /** 爆発スロットの表示物をすべて隠します。 */
  const hideExplosionSlot = (slot: ExplosionSlot) => {
    slot.active = false;
    slot.fireballMesh.visible = false;
    slot.shockMesh1.visible = false;
    slot.shockMesh2.visible = false;
    slot.blastFlare.visible = false;
  };

  /** 空いている爆発スロットを返します。空きがなければ、いちばん古い爆発のスロットを使い回します。 */
  const acquireExplosionSlot = (): ExplosionSlot => {
    let oldest = explosionSlots[0];
    for (const slot of explosionSlots) {
      if (!slot.active) return slot;
      if (slot.elapsed > oldest.elapsed) oldest = slot;
    }
    return oldest;
  };

  // -------------------------------------------------------------------------
  // 5. 破片（3D岩石）とプラズマ火花（リングバッファ方式で、連続衝突でも前の破片を消さずに追加）
  // -------------------------------------------------------------------------
  const debrisBaseGeo = createDisplacedRockGeometry(0.08, 9.1);
  const debrisMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.12,
    emissive: 0xff6b00,
    emissiveIntensity: 0.85,
  });
  const debrisMesh = new THREE.InstancedMesh(
    debrisBaseGeo,
    debrisMat,
    MAX_DEBRIS
  );
  debrisMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  debrisMesh.visible = false;
  debrisMesh.renderOrder = 5;
  root.add(debrisMesh);
  allGeos.push(debrisBaseGeo);
  allMats.push(debrisMat);

  interface DebrisParticle {
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    rotAxis: THREE.Vector3;
    rotAngle: number;
    rotSpeed: number;
    scale: number;
    life: number;
    maxLife: number;
    /** 吸い込み先の投入天体の uid（吸い込まれない破片は NO_SWALLOW_UID） */
    swallowUid: number;
    color: THREE.Color;
    /** 爆発の中心（吸い込み先が消えたときや「復活」時に戻る場所） */
    homePos: THREE.Vector3;
  }
  const debrisPool: DebrisParticle[] = [];
  for (let i = 0; i < MAX_DEBRIS; i++) {
    debrisPool.push({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      rotAxis: new THREE.Vector3(0, 1, 0),
      rotAngle: 0,
      rotSpeed: 1,
      scale: 0,
      life: 0,
      maxLife: 1,
      swallowUid: NO_SWALLOW_UID,
      color: new THREE.Color(1, 0.6, 0.2),
      homePos: new THREE.Vector3(),
    });
  }
  let debrisWriteCursor = 0;

  const sparkPosArr = new Float32Array(MAX_SPARKS * 3);
  const sparkColArr = new Float32Array(MAX_SPARKS * 3);
  const sparkHomeArr = new Float32Array(MAX_SPARKS * 3);
  const sparkVelList: THREE.Vector3[] = [];
  const sparkLifeList = new Float32Array(MAX_SPARKS);
  const sparkSwallowUids = new Int32Array(MAX_SPARKS).fill(NO_SWALLOW_UID);
  for (let i = 0; i < MAX_SPARKS; i++) {
    sparkVelList.push(new THREE.Vector3());
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPosArr, 3));
  sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkColArr, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.48,
    map: starTexture,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
  sparkPoints.visible = false;
  sparkPoints.renderOrder = 7;
  root.add(sparkPoints);
  allGeos.push(sparkGeo);
  allMats.push(sparkMat);
  let sparkWriteCursor = 0;

  // -------------------------------------------------------------------------
  // 6. N体シミュレーション内部状態
  // -------------------------------------------------------------------------
  /** 「復活」アニメーション中か */
  let isRestoring = false;
  let restoreTimer = 0;
  /** 最後に起きた爆発の画面フラッシュ色 */
  let latestFlashColorCss = IMPACTOR_MAP.asteroid.flashColorCss;
  /** 地球に衝撃波が広がり始めてからの秒数（地球に当たっていなければ十分大きな値） */
  let earthShockTimer = Number.POSITIVE_INFINITY;

  /** N体計算の太陽系天体の状態（物理上の位置・速度。描く位置は bodyStates.worldPos） */
  let liveBodies = {} as Record<SolarImpactTargetId, SolarNBodyEntry>;
  let nBodyInitialized = false;

  /**
   * 衛星を広げて描く効き具合（1 = 効く、0 = 効かない）。
   * 母惑星が衝突で消えたら少しずつ 0 にして、衛星の描く位置が急に飛ばないようにします。
   */
  const warpWeights: Record<SatelliteHostId, number> = { earth: 1, jupiter: 1 };
  /** 今のフレームで使う「物理上の位置 ↔ 描く位置」の変換の設定 */
  let currentWarpHosts: DisplayWarpHost[] = [];

  /** 物理上の位置を、描く位置に直して out に入れます */
  const physicsToDisplay = (p: Vec3Like, out: THREE.Vector3): THREE.Vector3 => {
    warpPhysicsToDisplay(p, currentWarpHosts, out);
    return out;
  };

  /** 描く位置を、物理上の位置に直して返します */
  const displayToPhysics = (p: Vec3Like): Vec3Like =>
    warpDisplayToPhysics(p, currentWarpHosts, { x: 0, y: 0, z: 0 });

  /** まだN体計算を始めていないとき：画面の本来の天体の位置（＝母惑星の位置）から変換の設定を作ります */
  const refreshWarpHostsFromBaseline = (
    baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
  ) => {
    const hosts: SatelliteHostSnapshot[] = SATELLITE_DISPLAY_SYSTEMS.map((sys) => {
      const b = baselineBodies.find((item) => item.id === sys.hostId);
      return {
        hostId: sys.hostId,
        center: b ? { x: b.pos.x, y: b.pos.y, z: b.pos.z } : { x: 0, y: 0, z: 0 },
        alive: Boolean(b),
      };
    });
    warpWeights.earth = 1;
    warpWeights.jupiter = 1;
    currentWarpHosts = buildDisplayWarpHosts(hosts, warpWeights);
  };

  /** N体計算中：物理上の母惑星の位置から変換の設定を作り、消えた母惑星の効き具合を少しずつ弱めます */
  const refreshWarpHostsFromLive = (realDt: number) => {
    for (const sys of SATELLITE_DISPLAY_SYSTEMS) {
      const host = liveBodies[sys.hostId];
      if (host && host.alive) {
        warpWeights[sys.hostId] = 1;
      } else {
        warpWeights[sys.hostId] = Math.max(
          0,
          warpWeights[sys.hostId] - realDt / WARP_FADE_SECONDS
        );
      }
    }
    currentWarpHosts = buildDisplayWarpHosts(
      snapshotSatelliteHosts(liveBodies),
      warpWeights
    );
  };

  /**
   * 画面で狙った「描く位置」と「速度（向きと速さ）」を、物理計算で使う位置と速度に直します。
   * 位置は変換の逆で戻し、向きは「少し進んだ点」も物理上の位置に直して求めます（速さはそのまま）。
   */
  const aimToPhysics = (
    spawnDisplay: THREE.Vector3,
    velDisplay: THREE.Vector3
  ): { pos: Vec3Like; vel: Vec3Like } => {
    const pos = displayToPhysics(spawnDisplay);
    const speed = velDisplay.length();
    if (speed < 1e-9) {
      return { pos, vel: { x: 0, y: 0, z: 0 } };
    }
    const probe = spawnDisplay
      .clone()
      .addScaledVector(velDisplay, AIM_DIRECTION_PROBE / speed);
    const probePhys = displayToPhysics(probe);
    let dx = probePhys.x - pos.x;
    let dy = probePhys.y - pos.y;
    let dz = probePhys.z - pos.z;
    let len = Math.hypot(dx, dy, dz);
    if (len < 1e-15) {
      dx = velDisplay.x;
      dy = velDisplay.y;
      dz = velDisplay.z;
      len = speed;
    }
    return {
      pos,
      vel: { x: (dx / len) * speed, y: (dy / len) * speed, z: (dz / len) * speed },
    };
  };

  /** 画面の本来の天体の位置（描く位置）から、物理計算の初期状態を作ります */
  const createPhysicsBodiesFromBaseline = (
    baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
  ) =>
    createSolarNBodyEntriesFromSnapshot(
      displaySnapshotToPhysics(
        baselineBodies.map((b) => ({ id: b.id, pos: b.pos }))
      )
    );

  /** 衝突の当事者を画面に描く半径（シーン単位） */
  const displayRadiusOf = (
    id: SolarCollisionEvent["primaryId"],
    uid: number | null
  ): number => {
    if (id === "impactor") {
      for (const visual of liveImpactors) {
        if (visual.entry.uid === uid) return visual.spec.visualRadius;
      }
      return 0.2;
    }
    return SOLAR_TARGET_MAP[id].displayRadius;
  };

  /** 現在置かれている投入天体（古い順）。何個でも追加でき、MAX_LIVE_IMPACTORS を超えると古いものから消えます。 */
  const liveImpactors: LiveImpactorVisual[] = [];
  /** 次に置く天体に付ける uid */
  let nextImpactorUid = 0;

  /** 狙い中（ドラッグ中）に、発射位置に表示する天体の模型 */
  let aimPreview: {
    impactorId: ImpactorId;
    group: THREE.Group;
    pulsarPivot: THREE.Object3D | null;
  } | null = null;

  // 復元開始時の各天体スナップショット
  const restoreStartPos = {} as Record<SolarImpactTargetId, THREE.Vector3>;
  const restoreStartScale = {} as Record<SolarImpactTargetId, number>;
  const restoreStartHeat = {} as Record<SolarImpactTargetId, number>;
  const restoreStartCrack = {} as Record<SolarImpactTargetId, number>;
  const vanishTimers = {} as Record<SolarImpactTargetId, number>;

  const bodyStates = {} as Record<
    SolarImpactTargetId,
    SolarBodySimRenderState
  >;
  for (const s of SOLAR_TARGET_SPECS) {
    restoreStartPos[s.id] = new THREE.Vector3();
    restoreStartScale[s.id] = 1;
    restoreStartHeat[s.id] = 0;
    restoreStartCrack[s.id] = 0;
    vanishTimers[s.id] = 0;
    bodyStates[s.id] = {
      worldPos: new THREE.Vector3(),
      offsetWorld: new THREE.Vector3(),
      scaleFactor: 1,
      impactDir: new THREE.Vector3(1, 0, 0),
      craterRadius: 0.4,
      damageHeat: 0,
      crackIntensity: 0,
      impactColor: new THREE.Vector3(1.0, 0.45, 0.1),
    };
  }

  const tmpMatrix = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const tmpScaleVec = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  const tmpVec = new THREE.Vector3();
  const tmpTangentA = new THREE.Vector3();
  const tmpTangentB = new THREE.Vector3();
  const tmpSwallowTarget = new THREE.Vector3();
  const invRotQuat = new THREE.Quaternion();
  const IMPACTOR_LIGHT_OFFSET = new THREE.Vector3(1.2, 0.8, 1.5);

  const output: ImpactFrameOutput = {
    phase: "idle",
    statusLabelJa: "",
    isNBodyActive: false,
    bodyStates,
    earthImpactLocalDir: new THREE.Vector3(0, 0, 1),
    earthCraterRadius: 0.35,
    earthDamageHeat: 0,
    earthCrackIntensity: 0,
    earthShockAngleRad: 0,
    earthImpactColor: new THREE.Vector3(1.0, 0.45, 0.1),
    earthOffsetLocal: new THREE.Vector3(),
    earthScaleFactor: 1,
    earthAxisWobbleRad: 0,
    atmosphereHeat: 0,
    moonImpactLocalDir: new THREE.Vector3(1, 0, 0),
    moonCraterRadius: 0.4,
    moonDamageHeat: 0,
    moonCrackIntensity: 0,
    moonEarthMagmaGlow: 0,
    moonOffsetLocal: new THREE.Vector3(),
    moonScaleFactor: 1,
    cameraShake: 0,
    screenFlashOpacity: 0,
    screenFlashColorCss: "255, 224, 178",
    canTriggerRestore: false,
    liveImpactorCount: 0,
  };

  /** 物理計算に渡すための、置いた天体の状態の配列を作ります。 */
  const collectImpactorEntries = (): SolarImpactorEntry[] => {
    const entries: SolarImpactorEntry[] = [];
    for (const visual of liveImpactors) {
      entries.push(visual.entry);
    }
    return entries;
  };

  /** uid から、まだ存在している投入天体を探し、その描く位置を返します（見つからなければ null）。 */
  const findAliveImpactorDisplayPos = (uid: number): THREE.Vector3 | null => {
    if (uid === NO_SWALLOW_UID) return null;
    for (const visual of liveImpactors) {
      if (visual.entry.uid === uid && visual.entry.alive) return visual.group.position;
    }
    return null;
  };

  /** 消滅した投入天体の表示物を片付けて、一覧から取り除きます。 */
  const removeDeadImpactors = () => {
    for (let i = liveImpactors.length - 1; i >= 0; i--) {
      if (!liveImpactors[i].entry.alive) {
        disposeLiveImpactorVisual(liveImpactors[i]);
        liveImpactors.splice(i, 1);
      }
    }
  };

  /** 狙い中のプレビュー模型を片付けます。 */
  const removeAimPreview = () => {
    if (aimPreview) {
      liveImpactorsRoot.remove(aimPreview.group);
      aimPreview = null;
    }
  };

  const hideAllPreviewGuides = () => {
    previewLine.visible = false;
    for (const entry of targetReticles.values()) {
      entry.mesh.visible = false;
    }
    for (const entry of perturbedPreviewLines.values()) {
      entry.line.visible = false;
    }
  };

  /** 今の状態から、画面上部へ知らせる進行段階を決めます。 */
  const computePhase = (): ImpactSimPhase => {
    if (isRestoring) return "restoring";
    if (!nBodyInitialized) return aimPreview ? "aiming" : "idle";
    for (const slot of explosionSlots) {
      if (slot.active) return "impacting";
    }
    if (liveImpactors.length > 0) return "flying";
    return "aftermath";
  };

  const spawnCollisionExplosion = (
    ev: SolarCollisionEvent,
    earthWorldQuat: THREE.Quaternion,
    moonRotationY: number
  ) => {
    // 投入天体が関わる衝突はその天体の種類で爆発を描きます。
    // 太陽系天体同士の衝突は、どの天体を置いたかに関係なく岩石惑星どうしの衝突（火星サイズ）の見た目にそろえます。
    const spec = ev.effectSpecId
      ? IMPACTOR_MAP[ev.effectSpecId]
      : BODY_COLLISION_EFFECT_SPEC;
    const slot = acquireExplosionSlot();
    slot.active = true;
    slot.elapsed = 0;
    slot.spec = spec;

    const hitColor = new THREE.Color(spec.explosionColorHex);
    latestFlashColorCss = spec.flashColorCss;

    // 見た目の大きさは、画面に描いている半径を使います（物理上の半径は小さすぎて爆発が見えないため）
    const primaryRadius = displayRadiusOf(ev.primaryId, ev.primaryImpactorUid);
    const secondaryRadius = displayRadiusOf(
      ev.secondaryId,
      ev.secondaryImpactorUid
    );

    // 爆発は「描いた主側の天体の表面」に出します。物理上の接点は描いた天体の内側（実際の半径の位置）にあるため、
    // 主側の中心を描く位置に直し、そこから衝突の向きへ描く半径ぶん進んだ点を爆発の中心にします。
    const centerNormal = new THREE.Vector3(
      ev.contactNormalOnPrimary.x,
      ev.contactNormalOnPrimary.y,
      ev.contactNormalOnPrimary.z
    );
    if (centerNormal.lengthSq() < 1e-8) centerNormal.set(0, 1, 0);
    centerNormal.normalize();
    const center = physicsToDisplay(ev.primaryCenterAt, new THREE.Vector3())
      .addScaledVector(centerNormal, primaryRadius);
    // 爆発の大きさはぶつかった2天体の半径に比例させます。
    // 惑星を実比率で小さく描くため、最小値も小さく（0.2）して、地球と月サイズの衝突が内惑星全体を覆わないようにします。
    const explosionScale = Math.max(
      0.2,
      Math.min(5.5, (primaryRadius + secondaryRadius) * 0.85)
    );
    slot.scale = explosionScale;

    // 太陽系天体側へのダメージ・クレーター・消滅設定
    const applyBodyDamage = (
      targetId: SolarImpactTargetId,
      normalVec: THREE.Vector3,
      destroyed: boolean
    ) => {
      const st = bodyStates[targetId];
      st.impactColor.set(hitColor.r, hitColor.g, hitColor.b);
      st.craterRadius = Math.max(st.craterRadius, spec.craterAngleRad);
      st.damageHeat = 1.0;
      st.crackIntensity = Math.max(
        st.crackIntensity,
        destroyed ? 1.0 : spec.crackIntensity
      );

      if (targetId === "earth") {
        invRotQuat.copy(earthWorldQuat).invert();
        st.impactDir.copy(normalVec).applyQuaternion(invRotQuat).normalize();
        output.earthImpactLocalDir.copy(st.impactDir);
        output.earthCraterRadius = st.craterRadius;
        output.earthDamageHeat = 1.0;
        output.earthCrackIntensity = st.crackIntensity;
        output.earthImpactColor.copy(st.impactColor);
        output.atmosphereHeat = Math.max(
          output.atmosphereHeat,
          spec.tier === 1 ? 0.35 : 0.95
        );
        earthShockTimer = 0;
      } else if (targetId === "moon") {
        invRotQuat.setFromAxisAngle(Y_AXIS, -moonRotationY);
        st.impactDir.copy(normalVec).applyQuaternion(invRotQuat).normalize();
        output.moonImpactLocalDir.copy(st.impactDir);
        output.moonCraterRadius = st.craterRadius;
        output.moonDamageHeat = 1.0;
        output.moonCrackIntensity = st.crackIntensity;
      } else {
        st.impactDir.copy(normalVec).normalize();
      }
    };

    const normalVec = new THREE.Vector3(
      ev.contactNormalOnPrimary.x,
      ev.contactNormalOnPrimary.y,
      ev.contactNormalOnPrimary.z
    ).normalize();
    if (normalVec.lengthSq() < 1e-4) normalVec.set(0, 1, 0);

    if (ev.primaryId !== "impactor") {
      applyBodyDamage(ev.primaryId, normalVec, ev.primaryDestroyed);
    }
    if (ev.secondaryId !== "impactor") {
      applyBodyDamage(
        ev.secondaryId,
        normalVec.clone().negate(),
        ev.secondaryDestroyed
      );
    }

    // 火球＆二重衝撃波リング配置
    const isBlueBlast =
      spec.isIcyComet || spec.id === "blueSupergiant" || spec.isNeutronStar;
    slot.fireballUniforms.uColorHot.value.setHex(
      isBlueBlast ? 0x7dd3fc : spec.isBlackHole ? 0xe879f9 : 0xffb703
    );
    slot.fireballUniforms.uColorCool.value.setHex(
      isBlueBlast ? 0x0284c7 : spec.isBlackHole ? 0x581c87 : 0xc2410c
    );
    slot.fireballMesh.position.copy(center);
    slot.fireballMesh.visible = true;

    slot.shockUniforms1.uColor.value.copy(hitColor);
    slot.shockUniforms2.uColor.value.setHex(
      spec.isIcyComet ? 0xbae6fd : 0xfef08a
    );
    slot.shockMesh1.position.copy(center);
    slot.shockMesh1.quaternion.setFromUnitVectors(Y_AXIS, normalVec);
    slot.shockMesh1.visible = true;

    slot.shockMesh2.position.copy(center);
    slot.shockMesh2.quaternion
      .setFromUnitVectors(Y_AXIS, normalVec)
      .multiply(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          Math.PI * 0.38
        )
      );
    slot.shockMesh2.visible = spec.tier >= 2;

    slot.blastFlare.position.copy(center);
    slot.blastFlareMat.color.setHex(
      spec.isIcyComet || spec.isNeutronStar
        ? 0xe0f2fe
        : spec.isBlackHole
        ? 0xf5d0fe
        : 0xfffbeb
    );
    slot.blastFlare.visible = true;

    // 接平面基底ベクトル
    if (Math.abs(normalVec.y) < 0.9) {
      tmpTangentA.crossVectors(Y_AXIS, normalVec).normalize();
    } else {
      tmpTangentA.set(1, 0, 0).cross(normalVec).normalize();
    }
    tmpTangentB.crossVectors(normalVec, tmpTangentA).normalize();

    const hotColor =
      spec.isIcyComet || spec.isNeutronStar
        ? new THREE.Color(0xe0f2fe)
        : spec.isBlackHole
        ? new THREE.Color(0xf5d0fe)
        : new THREE.Color(0xfff7ed);
    // ブラックホール・中性子星の爆発では、破片と火花がその天体へ吸い込まれていきます
    const isSwallow = spec.isBlackHole || spec.isNeutronStar;
    const swallowUid = isSwallow
      ? ev.primaryImpactorUid ?? ev.secondaryImpactorUid ?? NO_SWALLOW_UID
      : NO_SWALLOW_UID;

    // リングバッファ方式で既存の破片を消さずに新しい衝突破片を追加（連続衝突でも両方残る）
    const spawnDebrisBatch = spec.tier === 1 ? 75 : spec.tier === 2 ? 120 : 160;
    for (let k = 0; k < spawnDebrisBatch; k++) {
      const idx = (debrisWriteCursor + k) % MAX_DEBRIS;
      const p = debrisPool[idx];
      const az = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      p.rotAxis
        .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize();
      p.rotAngle = Math.random() * Math.PI * 2;
      p.rotSpeed = 2.5 + Math.random() * 6.0;
      p.swallowUid = swallowUid;
      p.homePos.copy(center);

      if (isSwallow) {
        const sr = (0.8 + Math.random() * 1.4) * explosionScale;
        p.pos.set(
          center.x + s * Math.cos(az) * sr,
          center.y + u * sr,
          center.z + s * Math.sin(az) * sr
        );
        p.vel
          .set(-Math.sin(az), (Math.random() - 0.5) * 0.4, Math.cos(az))
          .multiplyScalar(3.5 + Math.random() * 3.0);
        p.scale = (0.7 + Math.random() * 1.5) * explosionScale;
        p.maxLife = 7.5;
        p.life = p.maxLife;
      } else {
        p.pos.copy(center);
        const spd = (2.2 + Math.random() * 5.2) * Math.sqrt(explosionScale);
        p.vel.set(
          s * Math.cos(az) * spd,
          u * spd,
          s * Math.sin(az) * spd
        );
        p.scale = (0.55 + Math.random() * 1.35) * explosionScale;
        p.maxLife = 6.5 + Math.random() * 3.0;
        p.life = p.maxLife;
      }
      p.color.copy(hitColor).lerp(hotColor, Math.random() * 0.7);
    }
    debrisWriteCursor = (debrisWriteCursor + spawnDebrisBatch) % MAX_DEBRIS;

    const spawnSparkBatch = spec.tier === 1 ? 140 : 220;
    for (let k = 0; k < spawnSparkBatch; k++) {
      const idx = (sparkWriteCursor + k) % MAX_SPARKS;
      const az = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const s = Math.sqrt(1 - u * u);
      sparkSwallowUids[idx] = swallowUid;
      sparkPosArr[idx * 3] = center.x;
      sparkPosArr[idx * 3 + 1] = center.y;
      sparkPosArr[idx * 3 + 2] = center.z;
      sparkHomeArr[idx * 3] = center.x;
      sparkHomeArr[idx * 3 + 1] = center.y;
      sparkHomeArr[idx * 3 + 2] = center.z;
      const spd = (3.5 + Math.random() * 7.5) * Math.sqrt(explosionScale);
      sparkVelList[idx].set(
        s * Math.cos(az) * spd,
        u * spd,
        s * Math.sin(az) * spd
      );
      sparkLifeList[idx] = 2.6 + Math.random() * 3.2;
      tmpColor.copy(hitColor).lerp(hotColor, 0.35 + Math.random() * 0.65);
      sparkColArr[idx * 3] = tmpColor.r;
      sparkColArr[idx * 3 + 1] = tmpColor.g;
      sparkColArr[idx * 3 + 2] = tmpColor.b;
    }
    sparkWriteCursor = (sparkWriteCursor + spawnSparkBatch) % MAX_SPARKS;

    (sparkGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate =
      true;
    (sparkGeo.getAttribute("color") as THREE.BufferAttribute).needsUpdate =
      true;
    debrisMesh.visible = true;
    sparkPoints.visible = true;
  };

  /** 1つの爆発スロットを1フレーム進め、画面フラッシュとカメラの揺れの強さを返します。 */
  const updateExplosionSlot = (
    slot: ExplosionSlot,
    dt: number
  ): { flash: number; shake: number } => {
    slot.elapsed += dt;
    const t = slot.elapsed;
    const spec = slot.spec;
    let flash = 0;
    let shake = 0;

    if (t < 1.35) {
      const flashDecay = Math.exp(-t * (spec.tier >= 3 ? 2.2 : 4.0));
      flash =
        flashDecay * (spec.tier === 1 ? 0.52 : spec.tier === 2 ? 0.8 : 0.96);
    }
    if (t < 2.8) {
      const shakeDecay = Math.exp(-t * (spec.tier >= 3 ? 1.3 : 2.0));
      shake = spec.shakeStrength * shakeDecay;
    }

    const fireballDuration =
      spec.tier === 1 ? 2.0 : spec.tier === 2 ? 3.0 : 4.2;
    if (t < fireballDuration) {
      const ft = t / fireballDuration;
      const maxR =
        (spec.tier === 1 ? 1.35 : spec.tier === 2 ? 2.8 : 6.2) * slot.scale;
      const curR = maxR * Math.pow(ft, 0.36);
      slot.fireballMesh.scale.setScalar(Math.max(0.08, curR));
      slot.fireballUniforms.uOpacity.value =
        Math.sin(Math.min(1, ft * 1.15) * Math.PI) * 0.95;
      slot.fireballUniforms.uHeat.value = Math.max(0, 1.0 - ft * 1.1);
      slot.fireballUniforms.uTurbulence.value = 0.25 + ft * 0.38;
      slot.fireballMesh.visible = true;
    } else {
      slot.fireballMesh.visible = false;
    }

    const shockDuration = spec.tier === 1 ? 1.5 : spec.tier === 2 ? 2.4 : 3.4;
    if (t < shockDuration) {
      const st = t / shockDuration;
      const maxShock =
        (spec.tier === 1 ? 3.2 : spec.tier === 2 ? 6.8 : 14.5) * slot.scale;
      slot.shockMesh1.scale.setScalar(0.2 + maxShock * Math.pow(st, 0.52));
      slot.shockUniforms1.uOpacity.value = (1 - st) * (1 - st) * 0.95;
      slot.shockMesh1.visible = true;
      if (spec.tier >= 2) {
        slot.shockMesh2.scale.setScalar(
          0.2 + maxShock * 0.85 * Math.pow(st, 0.58)
        );
        slot.shockUniforms2.uOpacity.value = (1 - st) * (1 - st) * 0.75;
        slot.shockMesh2.visible = true;
      }
    } else {
      slot.shockMesh1.visible = false;
      slot.shockMesh2.visible = false;
    }

    if (t < 1.1) {
      const flt = t / 1.1;
      slot.blastFlare.scale.setScalar(
        (spec.tier === 1 ? 3.2 : spec.tier === 2 ? 6.5 : 13.5) *
          slot.scale *
          (1 - flt * 0.35)
      );
      slot.blastFlareMat.opacity = Math.pow(1 - flt, 1.8);
      slot.blastFlare.visible = true;
    } else {
      slot.blastFlare.visible = false;
    }

    // すべての演出が終わったらスロットを空けます
    if (t >= Math.max(fireballDuration, shockDuration, 2.8)) {
      hideExplosionSlot(slot);
    }
    return { flash, shake };
  };

  /** 補助ライトを、狙い中の天体または最後に置いた天体の近くへ動かします（どちらもなければ消灯）。 */
  const updateImpactorLight = () => {
    let target: THREE.Group | null = null;
    if (aimPreview) {
      target = aimPreview.group;
    } else if (liveImpactors.length > 0) {
      target = liveImpactors[liveImpactors.length - 1].group;
    }
    if (target) {
      impactorLight.position
        .copy(target.position)
        .addScaledVector(IMPACTOR_LIGHT_OFFSET, target.scale.x);
      impactorLight.intensity = IMPACTOR_LIGHT_INTENSITY;
    } else {
      impactorLight.intensity = 0;
    }
  };

  const beginRestore = () => {
    if (!nBodyInitialized || isRestoring) return;
    isRestoring = true;
    restoreTimer = 0;
    hideAllPreviewGuides();
    removeAimPreview();
    for (const visual of liveImpactors) {
      visual.trailPoints.visible = false;
    }

    for (const s of SOLAR_TARGET_SPECS) {
      const st = bodyStates[s.id];
      restoreStartPos[s.id].copy(st.worldPos);
      restoreStartScale[s.id] = st.scaleFactor;
      restoreStartHeat[s.id] = st.damageHeat;
      restoreStartCrack[s.id] = st.crackIntensity;
    }
  };

  const resetAll = () => {
    isRestoring = false;
    restoreTimer = 0;
    nBodyInitialized = false;
    earthShockTimer = Number.POSITIVE_INFINITY;
    for (const visual of liveImpactors) {
      disposeLiveImpactorVisual(visual);
    }
    liveImpactors.length = 0;
    removeAimPreview();
    hideAllPreviewGuides();
    impactorLight.intensity = 0;
    for (const slot of explosionSlots) {
      hideExplosionSlot(slot);
    }
    debrisMesh.visible = false;
    sparkPoints.visible = false;

    for (const entry of liveOrbitTrailLines.values()) {
      entry.line.visible = false;
      entry.history.length = 0;
      (entry.line.material as THREE.LineBasicMaterial).opacity = 0.82;
    }

    for (const s of SOLAR_TARGET_SPECS) {
      vanishTimers[s.id] = 0;
      const st = bodyStates[s.id];
      st.offsetWorld.set(0, 0, 0);
      st.scaleFactor = 1;
      st.damageHeat = 0;
      st.crackIntensity = 0;
    }
    for (let i = 0; i < MAX_DEBRIS; i++) {
      debrisPool[i].life = 0;
      debrisPool[i].scale = 0;
    }
    for (let i = 0; i < MAX_SPARKS; i++) {
      sparkLifeList[i] = 0;
    }

    output.phase = "idle";
    output.statusLabelJa = "";
    output.isNBodyActive = false;
    output.earthDamageHeat = 0;
    output.earthCrackIntensity = 0;
    output.earthShockAngleRad = 0;
    output.earthOffsetLocal.set(0, 0, 0);
    output.earthScaleFactor = 1;
    output.earthAxisWobbleRad = 0;
    output.atmosphereHeat = 0;
    output.moonDamageHeat = 0;
    output.moonCrackIntensity = 0;
    output.moonEarthMagmaGlow = 0;
    output.moonOffsetLocal.set(0, 0, 0);
    output.moonScaleFactor = 1;
    output.cameraShake = 0;
    output.screenFlashOpacity = 0;
    output.canTriggerRestore = false;
    output.liveImpactorCount = 0;
  };

  return {
    root,

    updateAimPreview(
      impactorId: ImpactorId,
      spawnWorldPos: THREE.Vector3,
      launchVel: THREE.Vector3,
      baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
    ) {
      if (isRestoring) {
        resetAll();
      }

      // 狙い中の天体の種類が変わったら、プレビュー模型を作り直します
      if (!aimPreview || aimPreview.impactorId !== impactorId) {
        removeAimPreview();
        const model = createImpactorModel(impactorId);
        liveImpactorsRoot.add(model.group);
        aimPreview = { impactorId, ...model };
      }
      aimPreview.group.position.copy(spawnWorldPos);
      aimPreview.group.scale.setScalar(1);

      // すでにN体運動中なら現在の動的状態（ほかに置いた天体も含む）を、未開始なら本来の天文座標を基準に先読み予測します
      if (!nBodyInitialized) {
        refreshWarpHostsFromBaseline(baselineBodies);
      }
      const startBodies = nBodyInitialized
        ? liveBodies
        : createPhysicsBodiesFromBaseline(baselineBodies);
      // 画面で狙った位置・速度を、物理計算の位置・速度に直します
      const aim = aimToPhysics(spawnWorldPos, launchVel);
      const predicted = predictSolarNBodyTrajectory(
        startBodies,
        nBodyInitialized ? collectImpactorEntries() : [],
        impactorId,
        aim.pos,
        aim.vel,
        PREVIEW_HORIZON_SIM_TIME,
        maxPreviewPts
      );

      /** 予測のある時点の母惑星の位置で、物理上の点を描く位置に直します */
      const predictedToDisplay = (
        pt: Vec3Like,
        hosts: SatelliteHostSnapshot[],
        out: THREE.Vector3
      ): THREE.Vector3 => {
        warpPhysicsToDisplay(pt, buildDisplayWarpHosts(hosts, warpWeights), out);
        return out;
      };

      // 1) 投入天体の予測軌道ライン（描く位置に直して表示）
      const count = Math.min(predicted.impactorPath.length, maxPreviewPts);
      const attr = previewGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < count; i++) {
        predictedToDisplay(
          predicted.impactorPath[i],
          predicted.impactorPathHosts[i],
          tmpVec
        );
        attr.setXYZ(i, tmpVec.x, tmpVec.y, tmpVec.z);
      }
      attr.needsUpdate = true;
      previewGeo.setDrawRange(0, count);
      previewLine.computeLineDistances();
      previewLine.visible = count >= 2;

      // 2) 重い天体によって軌道が乱れる惑星たちの予測ライン
      for (const [id, entry] of perturbedPreviewLines.entries()) {
        const path = predicted.perturbedPaths[id];
        if (path && path.length >= 2) {
          const pCount = Math.min(path.length, maxPreviewPts);
          const pAttr = entry.geo.getAttribute(
            "position"
          ) as THREE.BufferAttribute;
          for (let i = 0; i < pCount; i++) {
            pAttr.setXYZ(i, path[i].x, path[i].y, path[i].z);
          }
          pAttr.needsUpdate = true;
          entry.geo.setDrawRange(0, pCount);
          entry.line.computeLineDistances();
          entry.line.visible = true;
        } else {
          entry.line.visible = false;
        }
      }

      // 3) 衝突が予測されるすべての太陽系天体にターゲットリングを表示
      for (const entry of targetReticles.values()) {
        entry.mesh.visible = false;
      }
      for (const hit of predicted.hitTargets) {
        const rEntry = targetReticles.get(hit.id);
        if (!rEntry) continue;
        // 当たる天体の「描く位置」の表面のすぐ外に、描く半径に合わせた大きさのリングを置きます
        const displayRadius = SOLAR_TARGET_MAP[hit.id].displayRadius;
        tmpVec.set(hit.normal.x, hit.normal.y, hit.normal.z).normalize();
        if (tmpVec.lengthSq() < 1e-4) tmpVec.set(0, 1, 0);
        predictedToDisplay(hit.center, hit.hosts, rEntry.mesh.position);
        rEntry.mesh.position.addScaledVector(tmpVec, displayRadius * 1.08 + 0.12);
        rEntry.mesh.lookAt(
          rEntry.mesh.position.clone().addScaledVector(tmpVec, 1.0)
        );
        rEntry.mesh.scale.setScalar(Math.max(0.45, displayRadius * 0.95));
        rEntry.mesh.visible = true;
      }

      if (predicted.hitTargets.length >= 2) {
        previewMat.color.setHex(0xf472b6);
      } else if (predicted.hitTargets.length === 1) {
        previewMat.color.setHex(0xfbbf24);
      } else {
        previewMat.color.setHex(0x38bdf8);
      }
    },

    cancelAimPreview() {
      hideAllPreviewGuides();
      removeAimPreview();
    },

    launchImpactor(
      impactorId: ImpactorId,
      spawnWorldPos: THREE.Vector3,
      launchVel: THREE.Vector3,
      baselineBodies: ReadonlyArray<SolarBaselineBodyInput>
    ) {
      if (isRestoring) {
        resetAll();
      }
      hideAllPreviewGuides();
      removeAimPreview();

      if (!nBodyInitialized) {
        // 初回投入時：現在のリアル太陽系全15天体の位置（衛星は物理上の距離に戻した位置）と
        // ケプラー公転速度でN体空間を初期化します
        refreshWarpHostsFromBaseline(baselineBodies);
        liveBodies = createPhysicsBodiesFromBaseline(baselineBodies);
        for (const b of baselineBodies) {
          bodyStates[b.id].worldPos.copy(b.pos);
          bodyStates[b.id].offsetWorld.set(0, 0, 0);
          bodyStates[b.id].scaleFactor = 1;
          vanishTimers[b.id] = 0;
        }
        nBodyInitialized = true;
      }

      // 置ける数の上限を超える場合は、いちばん古い天体から消して場所を空けます
      while (liveImpactors.length >= MAX_LIVE_IMPACTORS) {
        const oldest = liveImpactors.shift();
        if (oldest) {
          oldest.entry.alive = false;
          disposeLiveImpactorVisual(oldest);
        }
      }

      const spec = IMPACTOR_MAP[impactorId];
      // 画面で狙った位置・速度を、物理計算の位置・速度に直して置きます（衝突判定は実際の半径）
      const aim = aimToPhysics(spawnWorldPos, launchVel);
      const entry: SolarImpactorEntry = {
        uid: nextImpactorUid,
        specId: impactorId,
        pos: { x: aim.pos.x, y: aim.pos.y, z: aim.pos.z },
        vel: { x: aim.vel.x, y: aim.vel.y, z: aim.vel.z },
        gravityGM: spec.gravityGM,
        radius: spec.physicalRadius,
        alive: true,
      };
      nextImpactorUid += 1;
      liveImpactors.push(createLiveImpactorVisual(entry));
    },

    triggerSmoothRestore() {
      beginRestore();
    },

    resetImmediate() {
      resetAll();
    },

    update(
      dt: number,
      totalTimeSec: number,
      baselineBodies: ReadonlyArray<SolarBaselineBodyInput>,
      earthWorldQuat: THREE.Quaternion,
      moonRotationY: number,
      astroSecondsPerSecond: number
    ): ImpactFrameOutput {
      const safeDt = Math.min(0.05, Math.max(0.001, dt));
      bhAccretionUniforms.uTime.value = totalTimeSec;
      for (const slot of explosionSlots) {
        slot.fireballUniforms.uTime.value = totalTimeSec;
      }

      // パルサー（中性子星）のビームを回転させます
      const pulsarAngle = totalTimeSec * 14.0;
      if (aimPreview?.pulsarPivot) {
        aimPreview.pulsarPivot.rotation.y = pulsarAngle;
      }
      for (const visual of liveImpactors) {
        if (visual.pulsarPivot) visual.pulsarPivot.rotation.y = pulsarAngle;
      }

      // baseline マップ作成
      const baselineMap = {} as Record<
        SolarImpactTargetId,
        SolarBaselineBodyInput
      >;
      for (const b of baselineBodies) {
        baselineMap[b.id] = b;
      }

      output.isNBodyActive = nBodyInitialized;
      output.cameraShake = 0;
      output.screenFlashOpacity = 0;
      output.canTriggerRestore = nBodyInitialized && !isRestoring;

      if (!nBodyInitialized) {
        refreshWarpHostsFromBaseline(baselineBodies);
        for (const b of baselineBodies) {
          bodyStates[b.id].worldPos.copy(b.pos);
          bodyStates[b.id].offsetWorld.set(0, 0, 0);
          bodyStates[b.id].scaleFactor = 1;
        }
        if (aimPreview) {
          aimPreview.group.rotation.y += safeDt * 0.9;
        }
        updateImpactorLight();
        output.phase = computePhase();
        output.statusLabelJa = "";
        output.liveImpactorCount = 0;
        return output;
      }

      // ---------------------------------------------------------------------
      // 「ぬるっと復活」フェーズ（「復活」ボタンが押されたときだけ3.2秒かけて全15天体を元の公転位置へ復元）
      // ---------------------------------------------------------------------
      if (isRestoring) {
        restoreTimer += safeDt;
        const restoreDuration = 3.2;
        const rawT = Math.min(1, restoreTimer / restoreDuration);
        const ease = easeInOutCubic(rawT);
        const remain = 1 - ease;

        output.phase = "restoring";
        output.statusLabelJa = "✦ 太陽系の全天体を元の公転軌道へ滑らかに復元中…";

        for (const s of SOLAR_TARGET_SPECS) {
          const base = baselineMap[s.id];
          const st = bodyStates[s.id];
          if (base) {
            st.worldPos.lerpVectors(restoreStartPos[s.id], base.pos, ease);
            st.offsetWorld.copy(st.worldPos).sub(base.pos);
          }
          st.scaleFactor = THREE.MathUtils.lerp(
            restoreStartScale[s.id],
            1.0,
            ease
          );
          st.damageHeat = restoreStartHeat[s.id] * remain;
          st.crackIntensity = restoreStartCrack[s.id] * remain;
        }

        output.earthDamageHeat = bodyStates.earth.damageHeat;
        output.earthCrackIntensity = bodyStates.earth.crackIntensity;
        output.earthScaleFactor = bodyStates.earth.scaleFactor;
        output.atmosphereHeat = output.earthCrackIntensity * 0.6;
        output.earthAxisWobbleRad = 0;
        output.earthShockAngleRad = 0;

        output.moonDamageHeat = bodyStates.moon.damageHeat;
        output.moonCrackIntensity = bodyStates.moon.crackIntensity;
        output.moonScaleFactor = bodyStates.moon.scaleFactor;
        output.moonEarthMagmaGlow = 0;

        // 置いた天体はすべて小さくなって消えていきます
        for (const visual of liveImpactors) {
          visual.group.scale.setScalar(
            Math.max(0.01, remain)
          );
        }
        impactorLight.intensity = IMPACTOR_LIGHT_INTENSITY * remain;

        // 飛び散った破片がそれぞれの爆発中心へ逆再生のように集まって消える
        for (let i = 0; i < MAX_DEBRIS; i++) {
          const p = debrisPool[i];
          if (p.scale <= 0.001) {
            tmpMatrix.makeScale(0, 0, 0);
            debrisMesh.setMatrixAt(i, tmpMatrix);
            continue;
          }
          p.pos.lerp(p.homePos, 1 - Math.exp(-2.8 * safeDt));
          p.rotAngle -= p.rotSpeed * safeDt;
          const fadeScale = p.scale * remain;
          tmpQuat.setFromAxisAngle(p.rotAxis, p.rotAngle);
          tmpScaleVec.setScalar(fadeScale);
          tmpMatrix.compose(p.pos, tmpQuat, tmpScaleVec);
          debrisMesh.setMatrixAt(i, tmpMatrix);
        }
        debrisMesh.instanceMatrix.needsUpdate = true;

        for (const entry of liveOrbitTrailLines.values()) {
          (entry.line.material as THREE.LineBasicMaterial).opacity =
            0.82 * remain;
        }

        for (const slot of explosionSlots) {
          hideExplosionSlot(slot);
        }
        sparkPoints.visible = false;

        if (rawT >= 1) {
          resetAll();
        }
        output.liveImpactorCount = liveImpactors.length;
        return output;
      }

      // ---------------------------------------------------------------------
      // N体相互万有引力＆天体間連鎖衝突のリアルタイム進行（自動復活せず、カオスな軌道をずっと観察可能）
      // ---------------------------------------------------------------------
      // 物理の時間は、アプリの時間の進み方（倍速）に合わせて進めます。
      // 例：「1日/s」なら 1 秒で 86,400 秒ぶん（約 0.025 シミュレーション時間）進み、一時停止中は止まります。
      // 衝突半径は実際の半径（固定値）なので、画面のズームには左右されません。
      const simDuration =
        (safeDt * Math.max(0, astroSecondsPerSecond)) / ASTRO_SECONDS_PER_SIM_TIME;
      const impactorEntries = collectImpactorEntries();
      const { events } = advanceSolarNBody(
        liveBodies,
        impactorEntries,
        simDuration
      );
      // 進めたあとの母惑星の位置で、描く位置への変換を作り直してから爆発を出します
      refreshWarpHostsFromLive(safeDt);
      for (const ev of events) {
        spawnCollisionExplosion(ev, earthWorldQuat, moonRotationY);
      }
      // 衝突で消えた投入天体の表示を片付けます
      removeDeadImpactors();

      // 1) 置いた天体それぞれの3D表示とトレイル更新
      for (const visual of liveImpactors) {
        const { entry, spec, group } = visual;
        physicsToDisplay(entry.pos, group.position);
        group.rotation.y += safeDt * (spec.isBlackHole ? 0.6 : 1.8);

        const hist = visual.trailHistory;
        for (let i = trailLen - 1; i > 0; i--) {
          hist[i].copy(hist[i - 1]);
        }
        hist[0].copy(group.position);
        const tPosAttr = visual.trailGeo.getAttribute(
          "position"
        ) as THREE.BufferAttribute;
        const tColAttr = visual.trailGeo.getAttribute(
          "color"
        ) as THREE.BufferAttribute;
        tmpColor.set(spec.explosionColorHex);
        for (let i = 0; i < trailLen; i++) {
          const fade = 1 - i / trailLen;
          tPosAttr.setXYZ(i, hist[i].x, hist[i].y, hist[i].z);
          tColAttr.setXYZ(
            i,
            tmpColor.r * fade,
            tmpColor.g * fade,
            tmpColor.b * fade
          );
        }
        tPosAttr.needsUpdate = true;
        tColAttr.needsUpdate = true;
        visual.trailPoints.visible = true;
      }
      if (aimPreview) {
        aimPreview.group.rotation.y += safeDt * 0.9;
      }
      updateImpactorLight();

      // 2) 太陽系全15天体の位置・消滅アニメーション・軌道乱れトレイル更新
      for (const s of SOLAR_TARGET_SPECS) {
        const live = liveBodies[s.id];
        const base = baselineMap[s.id];
        const st = bodyStates[s.id];
        if (!live || !base) continue;

        // 物理上の位置を描く位置に直します（衛星は母惑星のまわりに広げた位置）
        physicsToDisplay(live.pos, st.worldPos);
        st.offsetWorld.copy(st.worldPos).sub(base.pos);

        if (!live.alive) {
          vanishTimers[s.id] = Math.min(1, vanishTimers[s.id] + safeDt / 0.52);
          st.scaleFactor = Math.max(
            0,
            1.0 - easeInOutCubic(vanishTimers[s.id])
          );
        } else {
          st.scaleFactor = 1.0;
        }

        // 乱れた公転軌道のリアルタイムトレイルを更新
        const trailEntry = liveOrbitTrailLines.get(s.id);
        if (trailEntry && live.alive) {
          const hist = trailEntry.history;
          const lastPt = hist[hist.length - 1];
          if (!lastPt || lastPt.distanceToSquared(st.worldPos) > 0.18) {
            hist.push(st.worldPos.clone());
            if (hist.length > liveTrailLen) {
              hist.shift();
            }
            const attr = trailEntry.geo.getAttribute(
              "position"
            ) as THREE.BufferAttribute;
            for (let i = 0; i < hist.length; i++) {
              attr.setXYZ(i, hist[i].x, hist[i].y, hist[i].z);
            }
            attr.needsUpdate = true;
            trailEntry.geo.setDrawRange(0, hist.length);
            trailEntry.line.visible = hist.length >= 2;
          }
        }
      }

      output.earthScaleFactor = bodyStates.earth.scaleFactor;
      output.moonScaleFactor = bodyStates.moon.scaleFactor;

      // 3) 爆発火球・衝撃波・フラッシュ・シェイクの進行（同時に起きた爆発のうち、いちばん強いものを画面に反映）
      let maxFlash = 0;
      let maxShake = 0;
      for (const slot of explosionSlots) {
        if (!slot.active) continue;
        const { flash, shake } = updateExplosionSlot(slot, safeDt);
        maxFlash = Math.max(maxFlash, flash);
        maxShake = Math.max(maxShake, shake);
      }
      output.screenFlashOpacity = maxFlash;
      output.cameraShake = maxShake;
      output.screenFlashColorCss = latestFlashColorCss;

      earthShockTimer += safeDt;
      output.earthShockAngleRad =
        earthShockTimer < 2.2 ? (earthShockTimer / 2.2) * 3.3 : 0;

      // 4) 破片とプラズマ火花の更新
      for (let i = 0; i < MAX_DEBRIS; i++) {
        const p = debrisPool[i];
        if (p.life <= 0 || p.scale <= 0.001) {
          tmpMatrix.makeScale(0, 0, 0);
          debrisMesh.setMatrixAt(i, tmpMatrix);
          continue;
        }
        p.life = Math.max(0, p.life - safeDt);
        p.rotAngle += p.rotSpeed * safeDt;

        if (p.swallowUid !== NO_SWALLOW_UID) {
          // 吸い込み先の天体がまだあればその天体へ、消えていれば爆発の中心へ引き寄せます
          const swallower = findAliveImpactorDisplayPos(p.swallowUid);
          if (swallower) {
            tmpSwallowTarget.copy(swallower);
          } else {
            tmpSwallowTarget.copy(p.homePos);
          }
          const toCenter = tmpVec.copy(tmpSwallowTarget).sub(p.pos);
          const dist = Math.max(0.25, toCenter.length());
          toCenter.normalize();
          p.vel.addScaledVector(
            toCenter,
            (28.0 / (dist * dist + 0.45)) * safeDt
          );
          p.vel.multiplyScalar(Math.exp(-0.55 * safeDt));
          p.pos.addScaledVector(p.vel, safeDt);
          if (dist < 0.75) {
            p.scale *= Math.exp(-4.5 * safeDt);
          }
        } else {
          p.pos.addScaledVector(p.vel, safeDt);
        }

        const fadeScale = p.scale * THREE.MathUtils.clamp(p.life / 1.2, 0, 1);
        tmpQuat.setFromAxisAngle(p.rotAxis, p.rotAngle);
        tmpScaleVec.setScalar(fadeScale);
        tmpMatrix.compose(p.pos, tmpQuat, tmpScaleVec);
        debrisMesh.setMatrixAt(i, tmpMatrix);
        debrisMesh.setColorAt(i, p.color);
      }
      debrisMesh.instanceMatrix.needsUpdate = true;
      if (debrisMesh.instanceColor) debrisMesh.instanceColor.needsUpdate = true;

      const spPosAttr = sparkGeo.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      for (let i = 0; i < MAX_SPARKS; i++) {
        if (sparkLifeList[i] <= 0) {
          spPosAttr.setXYZ(i, 9999, 9999, 9999);
          continue;
        }
        sparkLifeList[i] -= safeDt;
        let sx = spPosAttr.getX(i);
        let sy = spPosAttr.getY(i);
        let sz = spPosAttr.getZ(i);
        const v = sparkVelList[i];
        if (sparkSwallowUids[i] !== NO_SWALLOW_UID) {
          const swallower = findAliveImpactorDisplayPos(sparkSwallowUids[i]);
          if (swallower) {
            tmpSwallowTarget.copy(swallower);
          } else {
            tmpSwallowTarget.set(
              sparkHomeArr[i * 3],
              sparkHomeArr[i * 3 + 1],
              sparkHomeArr[i * 3 + 2]
            );
          }
          tmpVec.set(
            tmpSwallowTarget.x - sx,
            tmpSwallowTarget.y - sy,
            tmpSwallowTarget.z - sz
          );
          const d = Math.max(0.25, tmpVec.length());
          tmpVec.normalize();
          v.addScaledVector(tmpVec, (28.0 / (d * d + 0.45)) * safeDt);
          v.multiplyScalar(Math.exp(-0.5 * safeDt));
        } else {
          v.multiplyScalar(Math.exp(-0.4 * safeDt));
        }
        sx += v.x * safeDt;
        sy += v.y * safeDt;
        sz += v.z * safeDt;
        spPosAttr.setXYZ(i, sx, sy, sz);
      }
      spPosAttr.needsUpdate = true;

      output.phase = computePhase();
      output.liveImpactorCount = liveImpactors.length;
      output.statusLabelJa =
        liveImpactors.length > 0
          ? `投入中の天体：${liveImpactors.length}個`
          : "";
      return output;
    },

    dispose() {
      resetAll();
      for (const g of allGeos) g.dispose();
      for (const m of allMats) m.dispose();
    },
  };
}
