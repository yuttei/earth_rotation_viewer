import type {
  GalileanMoonId,
  GalileanMoonState,
  SolarBodyId,
  SolarSystemBodyState,
} from "../types/astronomy";
import { BODY_RADIUS_EARTH } from "./bodySizes";
import { dateToJulianDay, degToRad, radToDeg } from "./calculations";

/** J2000.0 エポック（2000-01-01T12:00:00Z）のユリウス日 */
const J2000_JD = 2451545.0;

/**
 * NASA JPL J2000.0 平均軌道要素に基づく各天体の定義です。
 * 水星・金星・地球・火星・木星・土星・天王星・海王星・冥王星の9天体を統一的に扱います。
 */
export interface KeplerianBodyElements {
  id: SolarBodyId;
  nameJa: string;
  symbol: string;
  /** 軌道長半径 a (AU) */
  a: number;
  /** 離心率 e */
  e: number;
  /** 軌道傾斜角 i (度) */
  iDeg: number;
  /** 昇交点黄経 Ω (度) */
  omegaNodeDeg: number;
  /** 近日点黄経 ϖ (度) */
  perihelionLonDeg: number;
  /** J2000.0 時点の平均黄経 L0 (度) */
  meanLonJ2000Deg: number;
  /** 平均日運動 n (度/日) */
  meanMotionDegPerDay: number;
  /** 恒星公転周期（年） */
  orbitalPeriodYears: number;
  /**
   * 実際の半径（地球の半径 = 1.0）。
   * リアル太陽系モードでは、この値に REAL_SOLAR_PLANET_SCALE（bodySizes.ts）を掛けた大きさで描きます。
   */
  relativeSizeWeight: number;
  /** 自転軸の傾き（度：土星・天王星の環の傾き表現にも使用） */
  axialTiltDeg: number;
  /** 軌道リング・バッジ用の代表色 */
  accentColor: string;
  /** 軌道リング用の 16 進カラー値 */
  orbitHex: number;
}

export const SOLAR_SYSTEM_ELEMENTS: KeplerianBodyElements[] = [
  {
    id: "mercury",
    nameJa: "水星",
    symbol: "☿",
    a: 0.387099,
    e: 0.205636,
    iDeg: 7.004979,
    omegaNodeDeg: 48.330766,
    perihelionLonDeg: 77.457796,
    meanLonJ2000Deg: 252.250324,
    meanMotionDegPerDay: 4.09233445,
    orbitalPeriodYears: 0.2408,
    relativeSizeWeight: BODY_RADIUS_EARTH.mercury,
    axialTiltDeg: 0.03,
    accentColor: "#cbd5e1",
    orbitHex: 0x94a3b8,
  },
  {
    id: "venus",
    nameJa: "金星",
    symbol: "♀",
    a: 0.723332,
    e: 0.006773,
    iDeg: 3.394676,
    omegaNodeDeg: 76.679843,
    perihelionLonDeg: 131.563703,
    meanLonJ2000Deg: 181.979801,
    meanMotionDegPerDay: 1.60213034,
    orbitalPeriodYears: 0.6152,
    relativeSizeWeight: BODY_RADIUS_EARTH.venus,
    axialTiltDeg: 177.36,
    accentColor: "#fde68a",
    orbitHex: 0xfde68a,
  },
  {
    id: "earth",
    nameJa: "地球",
    symbol: "●",
    a: 1.000001,
    e: 0.01671,
    iDeg: 0.0,
    omegaNodeDeg: 0.0,
    perihelionLonDeg: 102.937682,
    meanLonJ2000Deg: 100.464572,
    meanMotionDegPerDay: 0.98560912,
    orbitalPeriodYears: 1.0,
    relativeSizeWeight: BODY_RADIUS_EARTH.earth,
    axialTiltDeg: 23.439,
    accentColor: "#38bdf8",
    orbitHex: 0xf59e0b,
  },
  {
    id: "mars",
    nameJa: "火星",
    symbol: "♂",
    a: 1.523679,
    e: 0.093405,
    iDeg: 1.849691,
    omegaNodeDeg: 49.559539,
    perihelionLonDeg: 336.05637,
    meanLonJ2000Deg: 355.433,
    meanMotionDegPerDay: 0.52403295,
    orbitalPeriodYears: 1.8808,
    relativeSizeWeight: BODY_RADIUS_EARTH.mars,
    axialTiltDeg: 25.19,
    accentColor: "#fb923c",
    orbitHex: 0xf97316,
  },
  {
    id: "jupiter",
    nameJa: "木星",
    symbol: "♃",
    a: 5.2044,
    e: 0.0489,
    iDeg: 1.303,
    omegaNodeDeg: 100.464,
    perihelionLonDeg: 14.331,
    meanLonJ2000Deg: 34.351,
    meanMotionDegPerDay: 0.08309121,
    orbitalPeriodYears: 11.862,
    relativeSizeWeight: BODY_RADIUS_EARTH.jupiter,
    axialTiltDeg: 3.13,
    accentColor: "#fdba74",
    orbitHex: 0xf59e0b,
  },
  {
    id: "saturn",
    nameJa: "土星",
    symbol: "♄",
    a: 9.5826,
    e: 0.0565,
    iDeg: 2.485,
    omegaNodeDeg: 113.665,
    perihelionLonDeg: 93.057,
    meanLonJ2000Deg: 50.077,
    meanMotionDegPerDay: 0.03345965,
    orbitalPeriodYears: 29.457,
    relativeSizeWeight: BODY_RADIUS_EARTH.saturn,
    axialTiltDeg: 26.73,
    accentColor: "#fcd34d",
    orbitHex: 0xeab308,
  },
  {
    id: "uranus",
    nameJa: "天王星",
    symbol: "♅",
    a: 19.2184,
    e: 0.0472,
    iDeg: 0.773,
    omegaNodeDeg: 74.006,
    perihelionLonDeg: 173.005,
    meanLonJ2000Deg: 314.055,
    meanMotionDegPerDay: 0.01173129,
    orbitalPeriodYears: 84.02,
    relativeSizeWeight: BODY_RADIUS_EARTH.uranus,
    axialTiltDeg: 97.77,
    accentColor: "#67e8f9",
    orbitHex: 0x22d3ee,
  },
  {
    id: "neptune",
    nameJa: "海王星",
    symbol: "♆",
    a: 30.1104,
    e: 0.0086,
    iDeg: 1.77,
    omegaNodeDeg: 131.784,
    perihelionLonDeg: 48.124,
    meanLonJ2000Deg: 304.349,
    meanMotionDegPerDay: 0.00598106,
    orbitalPeriodYears: 164.79,
    relativeSizeWeight: BODY_RADIUS_EARTH.neptune,
    axialTiltDeg: 28.32,
    accentColor: "#60a5fa",
    orbitHex: 0x3b82f6,
  },
  {
    id: "pluto",
    nameJa: "冥王星",
    symbol: "♇",
    a: 39.482,
    e: 0.2488,
    iDeg: 17.16,
    omegaNodeDeg: 110.299,
    perihelionLonDeg: 224.067,
    meanLonJ2000Deg: 238.929,
    meanMotionDegPerDay: 0.00397557,
    orbitalPeriodYears: 247.94,
    relativeSizeWeight: BODY_RADIUS_EARTH.pluto,
    axialTiltDeg: 122.53,
    accentColor: "#d8b4fe",
    orbitHex: 0xc084fc,
  },
];

/** 角度（度）を [0, 360) へ正規化します */
function wrapDeg360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * ケプラー方程式 M = E - e * sin(E) をニュートン法で解き、離心近点角 E（ラジアン）を求めます。
 */
function solveKeplerEquation(meanAnomalyRad: number, e: number): number {
  let E = meanAnomalyRad + e * Math.sin(meanAnomalyRad);
  for (let iter = 0; iter < 6; iter++) {
    const f = E - e * Math.sin(E) - meanAnomalyRad;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-8) {
      break;
    }
  }
  return E;
}

/**
 * 離心近点角 E から、Three.js 右手黄道座標（+X=春分点, +Y=黄道北極, -Z=黄経90°）上の
 * 3D 日心位置ベクトル [x, y, z] (AU) を計算します。
 */
function keplerPositionAtEccentricAnomaly(
  el: KeplerianBodyElements,
  E: number
): [number, number, number] {
  // 軌道面上の2次元座標 (xOrb: 近日点方向, yOrb: 公転進行方向)
  const xOrb = el.a * (Math.cos(E) - el.e);
  const yOrb = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);

  const omegaArgRad = degToRad(el.perihelionLonDeg - el.omegaNodeDeg);
  const nodeRad = degToRad(el.omegaNodeDeg);
  const inclRad = degToRad(el.iDeg);

  const cosW = Math.cos(omegaArgRad);
  const sinW = Math.sin(omegaArgRad);
  const cosO = Math.cos(nodeRad);
  const sinO = Math.sin(nodeRad);
  const cosI = Math.cos(inclRad);
  const sinI = Math.sin(inclRad);

  // 標準黄道座標 (X_ecl = 春分点, Y_ecl = 黄経90°, Z_ecl = 黄道北極)
  const xEcl =
    (cosO * cosW - sinO * sinW * cosI) * xOrb +
    (-cosO * sinW - sinO * cosW * cosI) * yOrb;
  const yEcl =
    (sinO * cosW + cosO * sinW * cosI) * xOrb +
    (-sinO * sinW + cosO * cosW * cosI) * yOrb;
  const zEcl = sinW * sinI * xOrb + cosW * sinI * yOrb;

  // 本アプリの Three.js 右手黄道座標へ変換：x = X_ecl, y = +Z_ecl（北極）, z = -Y_ecl
  return [xEcl, zEcl, -yEcl];
}

/**
 * 指定された天体の完全な 3D 楕円軌道リングの頂点列（AU 座標）を生成します。
 * 離心率や 17.16°（冥王星）などの軌道傾斜角をそのまま忠実に再現します。
 */
export function sampleKeplerOrbitPointsAu(
  el: KeplerianBodyElements,
  segments = 192
): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * Math.PI * 2;
    points.push(keplerPositionAtEccentricAnomaly(el, E));
  }
  return points;
}

/**
 * 指定された UTC 日時における太陽系9天体（水金地火木土天海冥）の
 * 正確な 3D 日心黄道位置・太陽距離・黄経・黄緯をまとめて算出します。
 */
export function calculateFullSolarSystemState(
  date: Date
): SolarSystemBodyState[] {
  const jd = dateToJulianDay(date);
  const d = jd - J2000_JD;

  return SOLAR_SYSTEM_ELEMENTS.map((el) => {
    const meanLonDeg = wrapDeg360(el.meanLonJ2000Deg + el.meanMotionDegPerDay * d);
    const meanAnomalyDeg = wrapDeg360(meanLonDeg - el.perihelionLonDeg);
    const meanAnomalyRad = degToRad(meanAnomalyDeg);

    const E = solveKeplerEquation(meanAnomalyRad, el.e);
    const [x, y, z] = keplerPositionAtEccentricAnomaly(el, E);
    const rAu = Math.hypot(x, y, z);

    const helioLonDeg = wrapDeg360(radToDeg(Math.atan2(-z, x)));
    const helioLatDeg = radToDeg(
      Math.asin(Math.max(-1, Math.min(1, y / Math.max(1e-9, rAu))))
    );

    return {
      id: el.id,
      nameJa: el.nameJa,
      symbol: el.symbol,
      semiMajorAxisAu: el.a,
      eccentricity: el.e,
      inclinationDeg: el.iDeg,
      orbitalPeriodYears: el.orbitalPeriodYears,
      distanceFromSunAu: rAu,
      heliocentricLongitudeDeg: helioLonDeg,
      heliocentricLatitudeDeg: helioLatDeg,
      positionAu: [x, y, z],
      accentColor: el.accentColor,
    };
  });
}

/**
 * 木星の主要4衛星（ガリレオ衛星：イオ・エウロパ・ガニメデ・カリスト）の軌道定義です。
 * 周期比はイオ：エウロパ：ガニメデ = 1 : 2 : 4 のラプラス共鳴を忠実に再現しています。
 */
export interface GalileanMoonDef {
  id: GalileanMoonId;
  nameJa: string;
  /** 恒星公転周期（日） */
  periodDays: number;
  /** 実際の木星半径 R_J 単位の軌道半径 */
  orbitRadiusRj: number;
  /** 3D シーン上で木星本体（半径 1.0 基準）の周囲に配置する視覚的軌道倍率 */
  visualOrbitFactor: number;
  /** 木星の半径に対する衛星の半径の比（実際の比率。木星の模型の中で、この半径の球として描きます） */
  visualRadiusFactor: number;
  /** J2000.0 時点の基準位相角（度） */
  epochAngleDeg: number;
  /** UI・衛星メッシュ用の代表カラー */
  color: string;
  hex: number;
}

export const GALILEAN_MOONS: GalileanMoonDef[] = [
  {
    id: "io",
    nameJa: "イオ",
    periodDays: 1.769138,
    orbitRadiusRj: 5.9,
    visualOrbitFactor: 1.65,
    visualRadiusFactor: BODY_RADIUS_EARTH.io / BODY_RADIUS_EARTH.jupiter,
    epochAngleDeg: 106.0,
    color: "#facc15",
    hex: 0xfacc15,
  },
  {
    id: "europa",
    nameJa: "エウロパ",
    periodDays: 3.551181,
    orbitRadiusRj: 9.39,
    visualOrbitFactor: 2.3,
    visualRadiusFactor: BODY_RADIUS_EARTH.europa / BODY_RADIUS_EARTH.jupiter,
    epochAngleDeg: 175.8,
    color: "#e0f2fe",
    hex: 0xe0f2fe,
  },
  {
    id: "ganymede",
    nameJa: "ガニメデ",
    periodDays: 7.154553,
    orbitRadiusRj: 14.97,
    visualOrbitFactor: 3.15,
    visualRadiusFactor: BODY_RADIUS_EARTH.ganymede / BODY_RADIUS_EARTH.jupiter,
    epochAngleDeg: 120.5,
    color: "#d6c7b2",
    hex: 0xd6c7b2,
  },
  {
    id: "callisto",
    nameJa: "カリスト",
    periodDays: 16.689018,
    orbitRadiusRj: 26.33,
    visualOrbitFactor: 4.35,
    visualRadiusFactor: BODY_RADIUS_EARTH.callisto / BODY_RADIUS_EARTH.jupiter,
    epochAngleDeg: 84.4,
    color: "#a8a29e",
    hex: 0xa8a29e,
  },
];

/**
 * 指定された UTC 日時における木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）の公転位相を算出します。
 */
export function calculateGalileanMoonsState(date: Date): GalileanMoonState[] {
  const d = dateToJulianDay(date) - J2000_JD;
  return GALILEAN_MOONS.map((m) => ({
    id: m.id,
    nameJa: m.nameJa,
    periodDays: m.periodDays,
    orbitRadiusRj: m.orbitRadiusRj,
    angleDeg: wrapDeg360(m.epochAngleDeg + (360 / m.periodDays) * d),
    color: m.color,
  }));
}
