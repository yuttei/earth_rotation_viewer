/**
 * リアル太陽系・N体相互万有引力＆天体衝突シミュレーターの物理計算と天体プリセット定義です。
 *
 * 考え方：計算は実寸、見せ方だけ誇張
 * - 物理計算（重力・衝突・予測）は、太陽系の15天体（太陽＋水金地火木土天海冥＋月＋木星4衛星）も、
 *   投入できる10種類の天体（それぞれ実在の天体がモデル）も、実際の質量・半径・距離で行います。
 * - 画面に描くときだけ、天体を見える大きさに拡大し（bodySizes.ts）、衛星を母惑星から広げた位置に描きます（displayWarp.ts）。
 * - 衝突は実際の大きさで判定します。絵が重なって見えても、実際の天体どうしが触れていなければ当たりません。
 *
 * 長さの単位は「1 天文単位 = 13.5」のシーン単位、時間の単位は「地球の1年 ≒ 9.0」のシミュレーション時間です
 * （realBodyData.ts を参照）。
 */

import {
  EARTH_SYSTEM_DISPLAY_FACTOR,
  JUPITER_SYSTEM_DISPLAY_FACTOR,
  REAL_SOLAR_SUN_RADIUS,
  planetScaleDisplayRadiusFromKm,
  realSolarDisplayRadius,
  starScaleDisplayRadiusFromKm,
} from "./bodySizes";
import type { DisplayWarpHost, Vec3Like } from "./displayWarp";
import { warpDisplayToPhysics } from "./displayWarp";
import {
  BODY_MASS_KG,
  BODY_RADIUS_KM,
  EARTH_MASS_KG,
  SATELLITE_ORBIT_KM,
  SCENE_UNITS_PER_AU,
  SUN_MASS_KG,
  SUN_RADIUS_KM,
  kmToScene,
  massKgToGmScene,
} from "./realBodyData";

export type ImpactorId =
  | "asteroid"
  | "comet"
  | "moonSize"
  | "marsSize"
  | "jupiterSize"
  | "redDwarf"
  | "sunStar"
  | "blueSupergiant"
  | "neutronStar"
  | "blackHole";

/**
 * 衝突の見た目（爆発の大きさ・色など）の規模ティア
 * 1: 小天体（クレーター傷・局所爆発）
 * 2: 惑星級（地殻崩壊・マグマ化・軌道摂動）
 * 3: 恒星級（連星カオス軌道・恒星合体・超新星級フレア爆発）
 * 4: 極限高密度天体（強重力潮汐破壊・パルサービーム・事象の地平線吸引）
 */
export type ImpactTier = 1 | 2 | 3 | 4;

/** リアル太陽系でN体万有引力と相互衝突の対象となる全15天体のID */
export type SolarImpactTargetId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "io"
  | "europa"
  | "ganymede"
  | "callisto"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

// ---------------------------------------------------------------------------
// 1. 投入天体（10種類・実在の天体がモデル）
// ---------------------------------------------------------------------------

/**
 * 画面に描く大きさの決め方
 * - planet：惑星と同じ縮尺（月サイズ・火星サイズ・木星サイズ、小惑星・彗星）
 * - star：太陽と同じ別縮尺（赤色矮星・太陽クラス恒星・青色超巨星）
 * - compact：実際の大きさでは小さすぎて見えない天体（中性子星・ブラックホール）
 */
export type ImpactorDisplayScale = "planet" | "star" | "compact";

/** モデルにした実在の天体の値 */
export interface ImpactorModel {
  /** モデルにした天体の名前（例：プロキシマ・ケンタウリ） */
  nameJa: string;
  /** 半径（km）。ブラックホールは事象の地平線の半径 */
  radiusKm: number;
  /** 質量（kg） */
  massKg: number;
  /** 画面に出すときの半径の単位（km か、太陽の半径 R☉ か） */
  radiusUnit: "km" | "solarRadius";
  /** 画面に出すときの質量の単位（kg、地球の質量 M⊕、太陽の質量 M☉） */
  massUnit: "kg" | "earthMass" | "solarMass";
  /** 半径の呼び方（ふつうは「半径」。ブラックホールは「事象の地平線の半径」） */
  radiusLabelJa: string;
  /** 推定値（「約」を付けて表示する）か */
  isEstimate: boolean;
}

export interface ImpactorSpec {
  id: ImpactorId;
  /** 日本語名 */
  nameJa: string;
  /** サブ説明（規模・特徴の目安） */
  subtitleJa: string;
  /** 衝突の見た目の規模ティア（1〜4） */
  tier: ImpactTier;
  /** ティア表記ラベル */
  tierLabelJa: string;
  /** 記号 */
  symbol: string;
  /** UIアクセントカラー */
  accentColor: string;
  /** モデルにした実在の天体の値 */
  model: ImpactorModel;
  /** 画面に描く大きさの決め方 */
  displayScale: ImpactorDisplayScale;
  /** 衝突判定に使う実際の半径（シーン単位。model.radiusKm から計算） */
  physicalRadius: number;
  /**
   * 画面に描く半径（シーン単位）。
   * 実際の半径を、惑星または太陽と同じ縮尺で拡大した値です。それでも小さすぎて見えない天体は、
   * 見える最小の大きさ（MIN_IMPACTOR_DISPLAY_RADIUS など）で描きます。衝突判定には使いません。
   */
  visualRadius: number;
  /** この天体の重力の強さ GM（シーン単位。model.massKg から計算） */
  gravityGM: number;
  /** 爆発の基本カラー（HEX） */
  explosionColorHex: string;
  /** フラッシュカラー（CSS RGBAベース） */
  flashColorCss: string;
  /** カメラシェイク強度（0〜1） */
  shakeStrength: number;
  /** 衝突相手表面のクレーター角半径（ラジアン） */
  craterAngleRad: number;
  /** 地殻の溶岩ひび割れ強度（0〜1） */
  crackIntensity: number;
  /** 恒星（自ら発光・コロナを持つ天体）か */
  isStar: boolean;
  /** 中性子星（高速回転パルサービームを持つ超高密度天体）か */
  isNeutronStar: boolean;
  /** ブラックホール（事象の地平線と降着円盤・相対論的ジェットを持つ極限天体）か */
  isBlackHole: boolean;
  /** 氷彗星型の青白い蒸気・氷プラズマ爆発を使うか */
  isIcyComet: boolean;
}

/** 小惑星・彗星を描く最小の半径（シーン単位）。実際の大きさ（半径 約5 km）では画面に映らないため */
export const MIN_IMPACTOR_DISPLAY_RADIUS = 0.05;

/** 中性子星を描く半径（シーン単位）。実際の半径 約10 km では映らないため、パルサービームが見える大きさにします */
const NEUTRON_STAR_DISPLAY_RADIUS = 0.12;

/** ブラックホールを描く半径（シーン単位）。事象の地平線（約63 km）では映らないため、降着円盤が見える大きさにします */
const BLACK_HOLE_DISPLAY_RADIUS = 0.3;

/** 光の速さ（km/s）。ブラックホールの事象の地平線の半径（2GM/c²）の計算に使います */
const SPEED_OF_LIGHT_KM_S = 299_792.458;

/** 万有引力定数 G（km³ / (kg・s²)） */
const GRAVITATIONAL_CONSTANT_KM = 6.6743e-20;

/** 質量（kg）のブラックホールの事象の地平線の半径（シュワルツシルト半径・km）を求めます */
function schwarzschildRadiusKm(massKg: number): number {
  return (2 * GRAVITATIONAL_CONSTANT_KM * massKg) / SPEED_OF_LIGHT_KM_S ** 2;
}

/** 半径 radiusKm・密度 densityKgM3 の球の質量（kg）を求めます（小惑星の質量の推定に使います） */
function sphereMassKg(radiusKm: number, densityKgM3: number): number {
  const radiusM = radiusKm * 1000;
  return (4 / 3) * Math.PI * radiusM ** 3 * densityKgM3;
}

/** はくちょう座X-1 のブラックホールの質量（太陽の 21.2 倍） */
const CYGNUS_X1_MASS_KG = 21.2 * SUN_MASS_KG;

/** 投入天体の定義のうち、モデルの値から計算できない部分 */
type ImpactorDefinition = Omit<
  ImpactorSpec,
  "physicalRadius" | "visualRadius" | "gravityGM"
>;

/** モデルの値から、衝突判定の半径・描く半径・重力の強さを計算して ImpactorSpec を完成させます */
function completeImpactorSpec(def: ImpactorDefinition): ImpactorSpec {
  const physicalRadius = kmToScene(def.model.radiusKm);
  let visualRadius: number;
  if (def.displayScale === "star") {
    visualRadius = starScaleDisplayRadiusFromKm(def.model.radiusKm);
  } else if (def.displayScale === "planet") {
    visualRadius = Math.max(
      MIN_IMPACTOR_DISPLAY_RADIUS,
      planetScaleDisplayRadiusFromKm(def.model.radiusKm)
    );
  } else {
    visualRadius = def.isBlackHole
      ? BLACK_HOLE_DISPLAY_RADIUS
      : NEUTRON_STAR_DISPLAY_RADIUS;
  }
  return {
    ...def,
    physicalRadius,
    visualRadius,
    gravityGM: massKgToGmScene(def.model.massKg),
  };
}

const IMPACTOR_DEFINITIONS: ImpactorDefinition[] = [
  {
    id: "asteroid",
    nameJa: "小惑星",
    subtitleJa: "恐竜絶滅を起こしたチクシュルーブ衝突体がモデル",
    tier: 1,
    tierLabelJa: "小天体：クレーター傷・局所爆発",
    symbol: "☄",
    accentColor: "#fb923c",
    model: {
      nameJa: "チクシュルーブ衝突体",
      // 直径 約10 km（推定）。質量は岩石の密度 2,600 kg/m³ を仮定した推定値
      radiusKm: 5,
      massKg: sphereMassKg(5, 2600),
      radiusUnit: "km",
      massUnit: "kg",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
    displayScale: "planet",
    explosionColorHex: "#ff7a18",
    flashColorCss: "255, 224, 178",
    shakeStrength: 0.34,
    craterAngleRad: 0.42,
    crackIntensity: 0.2,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "comet",
    nameJa: "氷彗星",
    subtitleJa: "ハレー彗星の核がモデル",
    tier: 1,
    tierLabelJa: "小天体：氷蒸気クレーター",
    symbol: "❄",
    accentColor: "#38bdf8",
    model: {
      nameJa: "ハレー彗星",
      // 核の大きさ 約15 × 8 × 8 km（探査機ジオット）を、同じ体積の球の半径 約5.5 km にした値
      radiusKm: 5.5,
      massKg: 2.2e14,
      radiusUnit: "km",
      massUnit: "kg",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
    displayScale: "planet",
    explosionColorHex: "#38bdf8",
    flashColorCss: "186, 238, 255",
    shakeStrength: 0.3,
    craterAngleRad: 0.44,
    crackIntensity: 0.18,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: true,
  },
  {
    id: "moonSize",
    nameJa: "月サイズ",
    subtitleJa: "月と同じ大きさ・重さの天体",
    tier: 2,
    tierLabelJa: "惑星級：地殻崩壊・マグマ化",
    symbol: "🌑",
    accentColor: "#f59e0b",
    model: {
      nameJa: "月",
      radiusKm: BODY_RADIUS_KM.moon,
      massKg: BODY_MASS_KG.moon,
      radiusUnit: "km",
      massUnit: "earthMass",
      radiusLabelJa: "半径",
      isEstimate: false,
    },
    displayScale: "planet",
    explosionColorHex: "#ff5500",
    flashColorCss: "255, 210, 140",
    shakeStrength: 0.68,
    craterAngleRad: 1.05,
    crackIntensity: 0.78,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "marsSize",
    nameJa: "火星サイズ",
    subtitleJa: "火星と同じ大きさ・重さの天体",
    tier: 2,
    tierLabelJa: "惑星級：惑星崩壊・軌道乱れ",
    symbol: "♂",
    accentColor: "#f87171",
    model: {
      nameJa: "火星",
      radiusKm: BODY_RADIUS_KM.mars,
      massKg: BODY_MASS_KG.mars,
      radiusUnit: "km",
      massUnit: "earthMass",
      radiusLabelJa: "半径",
      isEstimate: false,
    },
    displayScale: "planet",
    explosionColorHex: "#ff3800",
    flashColorCss: "255, 195, 130",
    shakeStrength: 0.84,
    craterAngleRad: 1.55,
    crackIntensity: 0.98,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "jupiterSize",
    nameJa: "木星サイズ",
    subtitleJa: "木星と同じ大きさ・重さの天体",
    tier: 2,
    tierLabelJa: "惑星級：巨大ガス惑星・丸呑み",
    symbol: "♃",
    accentColor: "#fbbf24",
    model: {
      nameJa: "木星",
      radiusKm: BODY_RADIUS_KM.jupiter,
      massKg: BODY_MASS_KG.jupiter,
      radiusUnit: "km",
      massUnit: "earthMass",
      radiusLabelJa: "半径",
      isEstimate: false,
    },
    displayScale: "planet",
    explosionColorHex: "#ffaa22",
    flashColorCss: "255, 244, 214",
    shakeStrength: 0.92,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "redDwarf",
    nameJa: "赤色矮星",
    subtitleJa: "太陽にいちばん近い恒星プロキシマ・ケンタウリがモデル",
    tier: 3,
    tierLabelJa: "恒星級：連星カオス・恒星大爆発",
    symbol: "✦",
    accentColor: "#fb7185",
    model: {
      nameJa: "プロキシマ・ケンタウリ",
      // Kervella ほか（2017, A&A 598, L7）：半径 0.1542 R☉、質量 0.1221 M☉
      radiusKm: 0.1542 * SUN_RADIUS_KM,
      massKg: 0.1221 * SUN_MASS_KG,
      radiusUnit: "solarRadius",
      massUnit: "solarMass",
      radiusLabelJa: "半径",
      isEstimate: false,
    },
    displayScale: "star",
    explosionColorHex: "#ff4d6d",
    flashColorCss: "255, 205, 215",
    shakeStrength: 0.96,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "sunStar",
    nameJa: "太陽クラス恒星",
    subtitleJa: "太陽と同じ大きさ・重さの恒星",
    tier: 3,
    tierLabelJa: "恒星級：連星カオス・恒星合体",
    symbol: "☀",
    accentColor: "#fde047",
    model: {
      nameJa: "太陽",
      radiusKm: SUN_RADIUS_KM,
      massKg: SUN_MASS_KG,
      radiusUnit: "solarRadius",
      massUnit: "solarMass",
      radiusLabelJa: "半径",
      isEstimate: false,
    },
    displayScale: "star",
    explosionColorHex: "#ffb703",
    flashColorCss: "255, 248, 200",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "blueSupergiant",
    nameJa: "青色超巨星",
    subtitleJa: "オリオン座のリゲルがモデル",
    tier: 3,
    tierLabelJa: "恒星級：超巨大恒星・超新星爆発",
    symbol: "✸",
    accentColor: "#60a5fa",
    model: {
      nameJa: "リゲル",
      // 代表値（文献により幅あり）：半径 約79 R☉（Moravveji ほか 2012）、質量 約21 M☉
      radiusKm: 78.9 * SUN_RADIUS_KM,
      massKg: 21 * SUN_MASS_KG,
      radiusUnit: "solarRadius",
      massUnit: "solarMass",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
    displayScale: "star",
    explosionColorHex: "#38bdf8",
    flashColorCss: "200, 238, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "neutronStar",
    nameJa: "中性子星",
    subtitleJa: "かに星雲の中心にあるかにパルサーがモデル",
    tier: 4,
    tierLabelJa: "極限天体：強重力潮汐破壊・吸い込み",
    symbol: "✧",
    accentColor: "#22d3ee",
    model: {
      nameJa: "かにパルサー",
      // 中性子星の典型値：半径 約10 km、質量 約1.4 M☉（かにパルサー自身の質量は測られていません）
      radiusKm: 10,
      massKg: 1.4 * SUN_MASS_KG,
      radiusUnit: "km",
      massUnit: "solarMass",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
    displayScale: "compact",
    explosionColorHex: "#06b6d4",
    flashColorCss: "185, 250, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: false,
    isNeutronStar: true,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "blackHole",
    nameJa: "ブラックホール",
    subtitleJa: "はくちょう座X-1 のブラックホールがモデル",
    tier: 4,
    tierLabelJa: "極限天体：事象の地平線・完全吸収",
    symbol: "◉",
    accentColor: "#c084fc",
    model: {
      nameJa: "はくちょう座X-1",
      // Miller-Jones ほか（2021, Science 371, 1046）：質量 21.2 M☉。半径は事象の地平線（2GM/c² ≒ 63 km）
      radiusKm: schwarzschildRadiusKm(CYGNUS_X1_MASS_KG),
      massKg: CYGNUS_X1_MASS_KG,
      radiusUnit: "km",
      massUnit: "solarMass",
      radiusLabelJa: "事象の地平線の半径",
      isEstimate: false,
    },
    displayScale: "compact",
    explosionColorHex: "#a855f7",
    flashColorCss: "238, 214, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: true,
    isIcyComet: false,
  },
];

export const IMPACTOR_SPECS: ImpactorSpec[] =
  IMPACTOR_DEFINITIONS.map(completeImpactorSpec);

export const IMPACTOR_MAP: Record<ImpactorId, ImpactorSpec> =
  IMPACTOR_SPECS.reduce(
    (acc, spec) => {
      acc[spec.id] = spec;
      return acc;
    },
    {} as Record<ImpactorId, ImpactorSpec>
  );

/** 上付きの数字（10 の何乗かを表示するため） */
const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
};

/** 数値を「有効数字3けた」程度の見やすい文字列にします（例：0.15421 → "0.154"、71492 → "71,492"） */
function formatNumberJa(value: number): string {
  if (value >= 100) {
    return Math.round(value).toLocaleString("ja-JP");
  }
  return Number(value.toPrecision(3)).toString();
}

/** とても大きい数を「1.4×10¹⁵」の形にします */
function formatScientificJa(value: number): string {
  const exponent = Math.floor(Math.log10(value));
  const mantissa = value / 10 ** exponent;
  const exponentText = String(exponent)
    .split("")
    .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
    .join("");
  return `${Number(mantissa.toPrecision(2))}×10${exponentText}`;
}

/** 投入天体の半径の表示文（例：「半径 0.154 R☉」「半径 約5 km」） */
export function formatImpactorRadiusJa(spec: ImpactorSpec): string {
  const m = spec.model;
  const approx = m.isEstimate ? "約" : "";
  if (m.radiusUnit === "solarRadius") {
    return `${m.radiusLabelJa} ${approx}${formatNumberJa(m.radiusKm / SUN_RADIUS_KM)} R☉`;
  }
  return `${m.radiusLabelJa} ${approx}${formatNumberJa(m.radiusKm)} km`;
}

/** 投入天体の質量の表示文（例：「質量 0.122 M☉」「質量 約1.4×10¹⁵ kg」） */
export function formatImpactorMassJa(spec: ImpactorSpec): string {
  const m = spec.model;
  const approx = m.isEstimate ? "約" : "";
  if (m.massUnit === "solarMass") {
    return `質量 ${approx}${formatNumberJa(m.massKg / SUN_MASS_KG)} M☉`;
  }
  if (m.massUnit === "earthMass") {
    return `質量 ${approx}${formatNumberJa(m.massKg / EARTH_MASS_KG)} M⊕`;
  }
  return `質量 ${approx}${formatScientificJa(m.massKg)} kg`;
}

/** 投入天体の説明文（例：「赤色矮星（プロキシマ・ケンタウリ）半径 0.154 R☉・質量 0.122 M☉」） */
export function formatImpactorSummaryJa(spec: ImpactorSpec): string {
  return `${spec.nameJa}（${spec.model.nameJa}）${formatImpactorRadiusJa(spec)}・${formatImpactorMassJa(spec)}`;
}

// ---------------------------------------------------------------------------
// 2. 太陽系の15天体（実際の値）
// ---------------------------------------------------------------------------

/**
 * リアル太陽系の全15天体のN体万有引力パラメータ定義です。
 * 重力の強さ・衝突判定の半径・衛星の公転距離はすべて実際の値（realBodyData.ts）から計算します。
 */
export interface SolarTargetPhysicsSpec {
  id: SolarImpactTargetId;
  nameJa: string;
  symbol: string;
  /** 質量（kg） */
  massKg: number;
  /** シーン空間での重力の強さ GM（太陽 = 1200 に対する実際の質量の比） */
  gravityGM: number;
  /** 衝突判定に使う実際の半径（シーン単位。例：地球 約0.00058） */
  physicalRadius: number;
  /** リアル太陽系モードで描く半径（シーン単位。見せ方だけ。例：地球 約0.277） */
  displayRadius: number;
  /** 衛星の場合の母惑星ID（太陽を直接公転する天体は null） */
  parentId: SolarImpactTargetId | null;
  /** 軌道長半径（シーン単位の実際の値。惑星は太陽から、衛星は母惑星から。初期の公転速度の計算に使用） */
  orbitRadius: number;
  /** ターゲットリング・軌跡用の16進カラー */
  accentHex: number;
  /** ガス惑星または恒星か */
  isGasOrStar: boolean;
}

/** 惑星の軌道長半径（天文単位）。solarSystem.ts の軌道要素と同じ値です */
const PLANET_SEMI_MAJOR_AXIS_AU = {
  mercury: 0.387099,
  venus: 0.723332,
  earth: 1.0,
  mars: 1.523679,
  jupiter: 5.2044,
  saturn: 9.5826,
  uranus: 19.2184,
  neptune: 30.1104,
  pluto: 39.482,
} as const;

/** 太陽系天体1つぶんの定義を、実際の値から組み立てます */
function solarBody(
  id: Exclude<SolarImpactTargetId, "sun">,
  nameJa: string,
  symbol: string,
  accentHex: number,
  isGasOrStar: boolean
): SolarTargetPhysicsSpec {
  let parentId: SolarImpactTargetId | null = null;
  let orbitRadius: number;
  if (id === "moon") {
    parentId = "earth";
    orbitRadius = kmToScene(SATELLITE_ORBIT_KM.moon);
  } else if (id === "io" || id === "europa" || id === "ganymede" || id === "callisto") {
    parentId = "jupiter";
    orbitRadius = kmToScene(SATELLITE_ORBIT_KM[id]);
  } else {
    orbitRadius = PLANET_SEMI_MAJOR_AXIS_AU[id] * SCENE_UNITS_PER_AU;
  }
  return {
    id,
    nameJa,
    symbol,
    massKg: BODY_MASS_KG[id],
    gravityGM: massKgToGmScene(BODY_MASS_KG[id]),
    physicalRadius: kmToScene(BODY_RADIUS_KM[id]),
    displayRadius: realSolarDisplayRadius(id),
    parentId,
    orbitRadius,
    accentHex,
    isGasOrStar,
  };
}

export const SOLAR_TARGET_SPECS: SolarTargetPhysicsSpec[] = [
  {
    id: "sun",
    nameJa: "太陽",
    symbol: "☀",
    massKg: SUN_MASS_KG,
    gravityGM: massKgToGmScene(SUN_MASS_KG),
    physicalRadius: kmToScene(SUN_RADIUS_KM),
    displayRadius: REAL_SOLAR_SUN_RADIUS,
    parentId: null,
    orbitRadius: 0,
    accentHex: 0xfbbf24,
    isGasOrStar: true,
  },
  solarBody("mercury", "水星", "☿", 0xcbd5e1, false),
  solarBody("venus", "金星", "♀", 0xfde68a, false),
  solarBody("earth", "地球", "●", 0x38bdf8, false),
  solarBody("moon", "月", "☾", 0xe2e8f0, false),
  solarBody("mars", "火星", "♂", 0xfb923c, false),
  solarBody("jupiter", "木星", "♃", 0xfdba74, true),
  solarBody("io", "イオ", "◦", 0xfacc15, false),
  solarBody("europa", "エウロパ", "◦", 0xbae6fd, false),
  solarBody("ganymede", "ガニメデ", "◦", 0xcbd5e1, false),
  solarBody("callisto", "カリスト", "◦", 0x94a3b8, false),
  solarBody("saturn", "土星", "♄", 0xfcd34d, true),
  solarBody("uranus", "天王星", "♅", 0x67e8f9, true),
  solarBody("neptune", "海王星", "♆", 0x60a5fa, true),
  solarBody("pluto", "冥王星", "♇", 0xd8b4fe, false),
];

export const SOLAR_TARGET_MAP: Record<
  SolarImpactTargetId,
  SolarTargetPhysicsSpec
> = SOLAR_TARGET_SPECS.reduce(
  (acc, spec) => {
    acc[spec.id] = spec;
    return acc;
  },
  {} as Record<SolarImpactTargetId, SolarTargetPhysicsSpec>
);

// ---------------------------------------------------------------------------
// 3. 衛星の位置の誇張（見せ方だけ）
// ---------------------------------------------------------------------------

/** 衛星を持つ母惑星（衛星の位置を広げて描く系） */
export type SatelliteHostId = "earth" | "jupiter";

/** 衛星を広げて描く系1つぶんの定義 */
export interface SatelliteDisplaySystem {
  hostId: SatelliteHostId;
  /** 母惑星からのずれに掛ける倍率 */
  factor: number;
  /** 倍率どおりに広げる範囲（物理上の距離。いちばん外側の衛星の距離の 1.3 倍） */
  innerRadius: number;
  /** 変換しない外側の境目（物理上の距離 = 描く距離） */
  outerRadius: number;
}

/** 外側の衛星の距離から、広げて描く範囲を決めます */
function satelliteSystem(
  hostId: SatelliteHostId,
  factor: number,
  outermostOrbitKm: number
): SatelliteDisplaySystem {
  const innerRadius = kmToScene(outermostOrbitKm) * 1.3;
  return {
    hostId,
    factor,
    innerRadius,
    // 内側の端（innerRadius × factor）より少し外で、変換のない元の距離につなぎます
    outerRadius: innerRadius * factor * 1.25,
  };
}

/** 地球と月の系・木星と4衛星の系 */
export const SATELLITE_DISPLAY_SYSTEMS: SatelliteDisplaySystem[] = [
  satelliteSystem("earth", EARTH_SYSTEM_DISPLAY_FACTOR, SATELLITE_ORBIT_KM.moon),
  satelliteSystem(
    "jupiter",
    JUPITER_SYSTEM_DISPLAY_FACTOR,
    SATELLITE_ORBIT_KM.callisto
  ),
];

/** 母惑星の位置と、生きているかの記録（予測の各時点の見せ方の計算に使います） */
export interface SatelliteHostSnapshot {
  hostId: SatelliteHostId;
  center: Vec3Tuple;
  alive: boolean;
}

/** 太陽系天体の状態から、各母惑星の位置と生死を記録します */
export function snapshotSatelliteHosts(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>
): SatelliteHostSnapshot[] {
  return SATELLITE_DISPLAY_SYSTEMS.map((sys) => {
    const host = bodies[sys.hostId];
    return {
      hostId: sys.hostId,
      center: host ? { ...host.pos } : { x: 0, y: 0, z: 0 },
      alive: host ? host.alive : false,
    };
  });
}

/**
 * 母惑星の位置と効き具合から、displayWarp.ts の変換に渡す設定を作ります。
 * weights を省略すると、生きている母惑星は 1、消えた母惑星は 0 として扱います。
 */
export function buildDisplayWarpHosts(
  hosts: ReadonlyArray<SatelliteHostSnapshot>,
  weights?: Partial<Record<SatelliteHostId, number>>
): DisplayWarpHost[] {
  const result: DisplayWarpHost[] = [];
  for (const h of hosts) {
    const sys = SATELLITE_DISPLAY_SYSTEMS.find((s) => s.hostId === h.hostId);
    if (!sys) continue;
    const weight = weights?.[h.hostId] ?? (h.alive ? 1 : 0);
    result.push({
      center: h.center,
      factor: sys.factor,
      innerRadius: sys.innerRadius,
      outerRadius: sys.outerRadius,
      weight,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// 4. N体シミュレーションの状態
// ---------------------------------------------------------------------------

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

/** N体シミュレーション内の1つの太陽系天体の動的状態（物理上の値） */
export interface SolarNBodyEntry {
  id: SolarImpactTargetId;
  pos: Vec3Tuple;
  vel: Vec3Tuple;
  gravityGM: number;
  /** 衝突判定の半径（実際の半径） */
  radius: number;
  parentId: SolarImpactTargetId | null;
  alive: boolean;
}

/**
 * N体シミュレーション内の投入天体（インパクター）の動的状態です（物理上の値）。
 * 投入天体は何個でも同時に存在できるので、どの天体かを見分けるために一意の番号 uid を持たせます。
 */
export interface SolarImpactorEntry {
  /** 投入天体ごとの一意な番号（同じ種類を2個投げても別の番号になります） */
  uid: number;
  specId: ImpactorId;
  pos: Vec3Tuple;
  vel: Vec3Tuple;
  gravityGM: number;
  /** 衝突判定の半径（実際の半径） */
  radius: number;
  alive: boolean;
}

/** 衝突の当事者を表す ID（"impactor" は投入天体、それ以外は太陽系天体） */
export type SolarCollisionPartyId = SolarImpactTargetId | "impactor";

/** 1ステップの中で発生した天体間衝突イベント（位置はすべて物理上の値） */
export interface SolarCollisionEvent {
  /** 生き残って相手を取り込んだ側（重いほう）の ID（"impactor" または太陽系天体ID） */
  primaryId: SolarCollisionPartyId;
  /** 取り込まれて消えた側の ID（"impactor" または太陽系天体ID） */
  secondaryId: SolarCollisionPartyId;
  /** 主側が投入天体のときの uid（太陽系天体なら null） */
  primaryImpactorUid: number | null;
  /** 副側が投入天体のときの uid（太陽系天体なら null） */
  secondaryImpactorUid: number | null;
  /**
   * 爆発の見た目に使う投入天体の種類です。
   * 投入天体が関わる衝突ではその天体（投入天体同士なら主側）の種類、太陽系天体同士の衝突では null です。
   */
  effectSpecId: ImpactorId | null;
  /** 触れた点（主側の表面の点。物理上の位置） */
  contactPoint: Vec3Tuple;
  /** 触れた瞬間の主側の中心（物理上の位置） */
  primaryCenterAt: Vec3Tuple;
  /** 触れた瞬間の副側の中心（物理上の位置） */
  secondaryCenterAt: Vec3Tuple;
  /** 主側天体の中心から衝突点へ向かう法線単位ベクトル */
  contactNormalOnPrimary: Vec3Tuple;
  /** 主側天体が消滅したか（主側は相手を取り込んで残るので常に false） */
  primaryDestroyed: boolean;
  /** 副側天体が消滅したか（取り込まれるので常に true） */
  secondaryDestroyed: boolean;
}

/**
 * 物理上の位置のスナップショットから、ケプラー公転速度を備えた
 * N体万有引力シミュレーションの初期状態を生成します。
 * 衝突判定の半径・重力の強さは SOLAR_TARGET_SPECS の実際の値です。
 */
export function createSolarNBodyEntriesFromSnapshot(
  snapshot: ReadonlyArray<{
    id: SolarImpactTargetId;
    pos: Vec3Tuple;
  }>
): Record<SolarImpactTargetId, SolarNBodyEntry> {
  const entries = {} as Record<SolarImpactTargetId, SolarNBodyEntry>;
  const sunGM = SOLAR_TARGET_MAP.sun.gravityGM;
  const sunItem = snapshot.find((item) => item.id === "sun");
  const sunPos = sunItem ? sunItem.pos : { x: 0, y: 0, z: 0 };

  // 1) まず太陽と9惑星の位置と公転速度を設定
  for (const item of snapshot) {
    const spec = SOLAR_TARGET_MAP[item.id];
    if (spec.id === "sun") {
      entries.sun = {
        id: "sun",
        pos: { ...item.pos },
        vel: { x: 0, y: 0, z: 0 },
        gravityGM: spec.gravityGM,
        radius: spec.physicalRadius,
        parentId: null,
        alive: true,
      };
    } else if (spec.parentId === null) {
      const rx = item.pos.x - sunPos.x;
      const ry = item.pos.y - sunPos.y;
      const rz = item.pos.z - sunPos.z;
      const r = Math.hypot(rx, ry, rz);
      const a = spec.orbitRadius;
      // ビス・ビバの式 v = √(GM (2/r − 1/a)) で、今の位置での公転の速さを求めます。
      // （軌道の形から外れた位置にいても速さが 0 にならないよう、円軌道の速さの 1/4 を下限にします）
      const circular = Math.sqrt((sunGM + spec.gravityGM) / Math.max(r, 1e-6));
      const visViva = Math.sqrt(
        Math.max(0, (sunGM + spec.gravityGM) * (2 / Math.max(r, 1e-6) - 1 / a))
      );
      const speed = Math.max(visViva, circular * 0.25);
      // latLonToVector3Tuple / keplerPositionAtEccentricAnomaly では z = -r*sin(λ) のため、
      // 黄経 λ が増える（反時計回り）方向の接線ベクトルは (-sin λ, 0, -cos λ) = (z / r, 0, -x / r) です。
      const horizR = Math.hypot(rx, rz) || 1;
      const tx = rz / horizR;
      const tz = -rx / horizR;
      entries[spec.id] = {
        id: spec.id,
        pos: { ...item.pos },
        vel: { x: tx * speed, y: 0, z: tz * speed },
        gravityGM: spec.gravityGM,
        radius: spec.physicalRadius,
        parentId: null,
        alive: true,
      };
    }
  }

  // 2) 次に衛星（月・イオ・エウロパ・ガニメデ・カリスト）の速度を「母惑星の速度＋母惑星周りの円軌道の速さ」で設定
  for (const item of snapshot) {
    const spec = SOLAR_TARGET_MAP[item.id];
    if (spec.parentId === null) continue;
    const host = entries[spec.parentId];
    if (!host) {
      entries[spec.id] = {
        id: spec.id,
        pos: { ...item.pos },
        vel: { x: 0, y: 0, z: 0 },
        gravityGM: spec.gravityGM,
        radius: spec.physicalRadius,
        parentId: spec.parentId,
        alive: true,
      };
      continue;
    }
    const relX = item.pos.x - host.pos.x;
    const relY = item.pos.y - host.pos.y;
    const relZ = item.pos.z - host.pos.z;
    const relDist = Math.max(1e-9, Math.hypot(relX, relY, relZ));
    const satSpeed = Math.sqrt((host.gravityGM + spec.gravityGM) / relDist);
    const horizRel = Math.hypot(relX, relZ) || 1;
    const tx = relZ / horizRel;
    const tz = -relX / horizRel;
    entries[spec.id] = {
      id: spec.id,
      pos: { ...item.pos },
      vel: {
        x: host.vel.x + tx * satSpeed,
        y: host.vel.y,
        z: host.vel.z + tz * satSpeed,
      },
      gravityGM: spec.gravityGM,
      radius: spec.physicalRadius,
      parentId: spec.parentId,
      alive: true,
    };
  }

  // 3) 太陽も惑星に引かれて少し動きます。全体の重心が止まっているように、太陽に逆向きの速度を与えます（運動量の合計 = 0）
  if (entries.sun) {
    let px = 0;
    let py = 0;
    let pz = 0;
    for (const spec of SOLAR_TARGET_SPECS) {
      if (spec.id === "sun") continue;
      const e = entries[spec.id];
      if (!e) continue;
      px += e.vel.x * e.gravityGM;
      py += e.vel.y * e.gravityGM;
      pz += e.vel.z * e.gravityGM;
    }
    entries.sun.vel = {
      x: -px / entries.sun.gravityGM,
      y: -py / entries.sun.gravityGM,
      z: -pz / entries.sun.gravityGM,
    };
  }

  return entries;
}

/**
 * 画面に描いている位置のスナップショット（衛星は広げて描いた位置）を、物理上の位置に直します。
 * 惑星と太陽は位置を誇張していないのでそのまま、衛星は母惑星からのずれを倍率で割って元の距離に戻します。
 */
export function displaySnapshotToPhysics(
  snapshot: ReadonlyArray<{ id: SolarImpactTargetId; pos: Vec3Like }>
): Array<{ id: SolarImpactTargetId; pos: Vec3Tuple }> {
  const hostSnapshots: SatelliteHostSnapshot[] = SATELLITE_DISPLAY_SYSTEMS.map(
    (sys) => {
      const item = snapshot.find((s) => s.id === sys.hostId);
      return {
        hostId: sys.hostId,
        center: item
          ? { x: item.pos.x, y: item.pos.y, z: item.pos.z }
          : { x: 0, y: 0, z: 0 },
        alive: Boolean(item),
      };
    }
  );
  const warpHosts = buildDisplayWarpHosts(hostSnapshots);
  return snapshot.map((item) => {
    const spec = SOLAR_TARGET_MAP[item.id];
    const pos = { x: item.pos.x, y: item.pos.y, z: item.pos.z };
    if (spec.parentId === null) {
      return { id: item.id, pos };
    }
    return { id: item.id, pos: warpDisplayToPhysics(pos, warpHosts, { x: 0, y: 0, z: 0 }) };
  });
}

/**
 * 太陽系天体の状態を丸ごと複製します。
 * 先読み予測で本物の状態を書き換えてしまわないように、位置・速度のオブジェクトまで新しく作ります。
 */
export function cloneSolarNBodyEntries(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>
): Record<SolarImpactTargetId, SolarNBodyEntry> {
  const copied = {} as Record<SolarImpactTargetId, SolarNBodyEntry>;
  for (const spec of SOLAR_TARGET_SPECS) {
    const b = bodies[spec.id];
    if (!b) continue;
    copied[spec.id] = { ...b, pos: { ...b.pos }, vel: { ...b.vel } };
  }
  return copied;
}

/** 投入天体の状態を1つ複製します（予測計算用）。 */
function cloneImpactorEntry(impactor: SolarImpactorEntry): SolarImpactorEntry {
  return { ...impactor, pos: { ...impactor.pos }, vel: { ...impactor.vel } };
}

// ---------------------------------------------------------------------------
// 5. 時間を進める計算（重力と衝突）
// ---------------------------------------------------------------------------

/**
 * 1ステップの長さを決める係数です。
 * 天体の組ごとに「近づき方の速さ」から決まる時間（公転の時間の目安 √(r³/GM) と、すれ違う時間 r/v）のうち
 * いちばん短いものに、この係数を掛けた長さで進めます。
 * 例：イオは木星のまわりを約 0.044 シミュレーション時間で1周するので、1周を約 60 ステップで計算します。
 */
const STEP_ACCURACY = 0.1;
/** 1ステップの最大の長さ（シミュレーション時間） */
const MAX_STEP_SIM_TIME = 0.02;
/** 1ステップの最小の長さ（ブラックホールのすぐそばなどで、限りなく細かくなるのを防ぎます） */
const MIN_STEP_SIM_TIME = 1e-9;
/** ステップの長さの計算に入れる重力の強さの下限（小惑星どうしなど、引力がほぼない組は除きます） */
const STEP_GM_THRESHOLD = 1e-10;

/**
 * 時間を進める計算用に、天体を数値の配列（Float64Array）へまとめたものです。
 * 天体の数（太陽系15＋投入天体）ぶんの位置・速度・加速度を並べて持ち、ループを速く回します。
 */
class FlatNBodySystem {
  readonly n: number;
  readonly px: Float64Array;
  readonly py: Float64Array;
  readonly pz: Float64Array;
  readonly vx: Float64Array;
  readonly vy: Float64Array;
  readonly vz: Float64Array;
  readonly ax: Float64Array;
  readonly ay: Float64Array;
  readonly az: Float64Array;
  /** 1ステップを始めたときの位置（衝突の途中判定に使います） */
  readonly sx: Float64Array;
  readonly sy: Float64Array;
  readonly sz: Float64Array;
  readonly gm: Float64Array;
  readonly radius: Float64Array;
  readonly alive: Uint8Array;
  readonly isBlackHole: Uint8Array;
  /** 配列の番号 → 太陽系天体（投入天体なら null） */
  readonly bodyRefs: Array<SolarNBodyEntry | null>;
  /** 配列の番号 → 投入天体（太陽系天体なら null） */
  readonly impactorRefs: Array<SolarImpactorEntry | null>;
  /** 最後に加速度を計算したときに求めた、ステップの長さの目安（シミュレーション時間） */
  timescale = MAX_STEP_SIM_TIME;

  constructor(
    bodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
    impactors: ReadonlyArray<SolarImpactorEntry>
  ) {
    const bodyList: SolarNBodyEntry[] = [];
    for (const spec of SOLAR_TARGET_SPECS) {
      const b = bodies[spec.id];
      if (b) bodyList.push(b);
    }
    const n = bodyList.length + impactors.length;
    this.n = n;
    this.px = new Float64Array(n);
    this.py = new Float64Array(n);
    this.pz = new Float64Array(n);
    this.vx = new Float64Array(n);
    this.vy = new Float64Array(n);
    this.vz = new Float64Array(n);
    this.ax = new Float64Array(n);
    this.ay = new Float64Array(n);
    this.az = new Float64Array(n);
    this.sx = new Float64Array(n);
    this.sy = new Float64Array(n);
    this.sz = new Float64Array(n);
    this.gm = new Float64Array(n);
    this.radius = new Float64Array(n);
    this.alive = new Uint8Array(n);
    this.isBlackHole = new Uint8Array(n);
    this.bodyRefs = [];
    this.impactorRefs = [];

    let i = 0;
    for (const b of bodyList) {
      this.load(i, b.pos, b.vel, b.gravityGM, b.radius, b.alive, false);
      this.bodyRefs.push(b);
      this.impactorRefs.push(null);
      i++;
    }
    for (const imp of impactors) {
      this.load(
        i,
        imp.pos,
        imp.vel,
        imp.gravityGM,
        imp.radius,
        imp.alive,
        IMPACTOR_MAP[imp.specId].isBlackHole
      );
      this.bodyRefs.push(null);
      this.impactorRefs.push(imp);
      i++;
    }
    this.computeAccelerations();
  }

  private load(
    i: number,
    pos: Vec3Tuple,
    vel: Vec3Tuple,
    gm: number,
    radius: number,
    alive: boolean,
    isBlackHole: boolean
  ): void {
    this.px[i] = pos.x;
    this.py[i] = pos.y;
    this.pz[i] = pos.z;
    this.vx[i] = vel.x;
    this.vy[i] = vel.y;
    this.vz[i] = vel.z;
    this.gm[i] = gm;
    this.radius[i] = radius;
    this.alive[i] = alive ? 1 : 0;
    this.isBlackHole[i] = isBlackHole ? 1 : 0;
  }

  /**
   * すべての生きている天体の組について万有引力の加速度を足し合わせ、
   * あわせて次のステップの長さの目安（timescale）を求めます。
   */
  computeAccelerations(): void {
    const { n, px, py, pz, vx, vy, vz, ax, ay, az, gm, alive } = this;
    ax.fill(0);
    ay.fill(0);
    az.fill(0);
    // 「時間の目安の2乗」の最小値（平方根は最後に1回だけ取ります）
    let minTime2 = Infinity;
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (!alive[j]) continue;
        const dx = px[j] - px[i];
        const dy = py[j] - py[i];
        const dz = pz[j] - pz[i];
        const r2 = dx * dx + dy * dy + dz * dz + 1e-30;
        const r = Math.sqrt(r2);
        const invR3 = 1 / (r2 * r);
        // 万有引力：相手の GM ÷ 距離² の加速度で、相手の方向へ引かれます
        ax[i] += gm[j] * dx * invR3;
        ay[i] += gm[j] * dy * invR3;
        az[i] += gm[j] * dz * invR3;
        ax[j] -= gm[i] * dx * invR3;
        ay[j] -= gm[i] * dy * invR3;
        az[j] -= gm[i] * dz * invR3;

        const gmSum = gm[i] + gm[j];
        if (gmSum > STEP_GM_THRESHOLD) {
          // 公転の時間の目安の2乗 r³/GM
          const orbitTime2 = (r2 * r) / gmSum;
          if (orbitTime2 < minTime2) minTime2 = orbitTime2;
          // すれ違う時間の目安の2乗 r²/v²
          const dvx = vx[j] - vx[i];
          const dvy = vy[j] - vy[i];
          const dvz = vz[j] - vz[i];
          const v2 = dvx * dvx + dvy * dvy + dvz * dvz + 1e-30;
          const passTime2 = r2 / v2;
          if (passTime2 < minTime2) minTime2 = passTime2;
        }
      }
    }
    this.timescale = Math.sqrt(minTime2);
  }

  /** 次の1ステップの長さ（シミュレーション時間） */
  nextStepLength(): number {
    return Math.min(
      MAX_STEP_SIM_TIME,
      Math.max(MIN_STEP_SIM_TIME, this.timescale * STEP_ACCURACY)
    );
  }

  /**
   * 速度ベルレ法（キック・ドリフト・キック）で dt だけ進め、そのステップの間の衝突を解決します。
   * 「速度を半分進める → 位置を進める → 新しい位置で加速度を計算し直す → 速度を残り半分進める」の順です。
   */
  step(dt: number, events: SolarCollisionEvent[]): void {
    const { n, px, py, pz, vx, vy, vz, ax, ay, az, sx, sy, sz, alive } = this;
    const halfDt = 0.5 * dt;
    for (let i = 0; i < n; i++) {
      sx[i] = px[i];
      sy[i] = py[i];
      sz[i] = pz[i];
      if (!alive[i]) continue;
      vx[i] += ax[i] * halfDt;
      vy[i] += ay[i] * halfDt;
      vz[i] += az[i] * halfDt;
      px[i] += vx[i] * dt;
      py[i] += vy[i] * dt;
      pz[i] += vz[i] * dt;
    }
    this.computeAccelerations();
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      vx[i] += ax[i] * halfDt;
      vy[i] += ay[i] * halfDt;
      vz[i] += az[i] * halfDt;
    }
    if (this.resolveCollisions(events)) {
      // 天体が合体して重さや数が変わったので、加速度を計算し直します
      this.computeAccelerations();
    }
  }

  /**
   * このステップの間に触れた天体の組を探し、重いほうが軽いほうを取り込む形で解決します。
   * ステップの間、各天体は始めの位置から終わりの位置へまっすぐ動いたとみなし、2天体の距離が
   * 半径の和以下になった時点があるかを調べます（スイープ判定）。速く動く小さな天体もすり抜けません。
   * @returns 衝突が1件でもあれば true
   */
  private resolveCollisions(events: SolarCollisionEvent[]): boolean {
    const { n, px, py, pz, sx, sy, sz, radius, alive } = this;
    let collided = false;
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (!alive[j]) continue;
        const hitR = radius[i] + radius[j];
        // ステップの始めの相対位置 d0 と、ステップの間の相対移動 dv
        const d0x = sx[j] - sx[i];
        const d0y = sy[j] - sy[i];
        const d0z = sz[j] - sz[i];
        const dvx = px[j] - sx[j] - (px[i] - sx[i]);
        const dvy = py[j] - sy[j] - (py[i] - sy[i]);
        const dvz = pz[j] - sz[j] - (pz[i] - sz[i]);
        // 距離の2乗 |d0 + t・dv|² = A t² + 2B t + C（t は 0〜1）
        const A = dvx * dvx + dvy * dvy + dvz * dvz;
        const B = d0x * dvx + d0y * dvy + d0z * dvz;
        const C = d0x * d0x + d0y * d0y + d0z * d0z - hitR * hitR;
        let t: number;
        if (C <= 0) {
          // ステップの始めから、すでに触れていた
          t = 0;
        } else {
          if (A < 1e-30) continue;
          const tClosest = Math.min(1, Math.max(0, -B / A));
          if (A * tClosest * tClosest + 2 * B * tClosest + C > 0) continue;
          // 初めて距離が半径の和になる時点（2次方程式の小さいほうの解）
          const disc = Math.max(0, B * B - A * C);
          t = Math.min(1, Math.max(0, (-B - Math.sqrt(disc)) / A));
        }
        this.mergePair(i, j, t, events);
        collided = true;
        // i が取り込まれて消えたら、i とほかの天体の判定は不要です
        if (!alive[i]) break;
      }
    }
    return collided;
  }

  /** 番号 i と j の天体が、ステップ中の時点 t で触れたときの処理（重いほうが軽いほうを取り込む） */
  private mergePair(
    i: number,
    j: number,
    t: number,
    events: SolarCollisionEvent[]
  ): void {
    const { px, py, pz, sx, sy, sz, vx, vy, vz, gm, radius, alive, isBlackHole } =
      this;
    // どちらが残るか：ブラックホールは何でも飲み込みます。それ以外は重い（GM が大きい）ほうが残り、
    // 同じ重さなら配列の前のほう（太陽系天体）が残ります。
    let winner = i;
    if (isBlackHole[j] && !isBlackHole[i]) {
      winner = j;
    } else if (isBlackHole[i] === isBlackHole[j] && gm[j] > gm[i]) {
      winner = j;
    }
    const loser = winner === i ? j : i;

    // 触れた時点の2天体の中心
    const wx = sx[winner] + (px[winner] - sx[winner]) * t;
    const wy = sy[winner] + (py[winner] - sy[winner]) * t;
    const wz = sz[winner] + (pz[winner] - sz[winner]) * t;
    const lx = sx[loser] + (px[loser] - sx[loser]) * t;
    const ly = sy[loser] + (py[loser] - sy[loser]) * t;
    const lz = sz[loser] + (pz[loser] - sz[loser]) * t;
    const dist = Math.hypot(lx - wx, ly - wy, lz - wz);
    const inv = 1 / Math.max(1e-30, dist);
    const nx = dist > 0 ? (lx - wx) * inv : 0;
    const ny = dist > 0 ? (ly - wy) * inv : 1;
    const nz = dist > 0 ? (lz - wz) * inv : 0;

    // 運動量を保存して合体（速度を GM の比で混ぜ、GM を足し合わせます）
    const total = gm[winner] + gm[loser];
    if (total > 0) {
      vx[winner] = (vx[winner] * gm[winner] + vx[loser] * gm[loser]) / total;
      vy[winner] = (vy[winner] * gm[winner] + vy[loser] * gm[loser]) / total;
      vz[winner] = (vz[winner] * gm[winner] + vz[loser] * gm[loser]) / total;
    }
    gm[winner] = total;
    alive[loser] = 0;

    const winnerBody = this.bodyRefs[winner];
    const loserBody = this.bodyRefs[loser];
    const winnerImp = this.impactorRefs[winner];
    const loserImp = this.impactorRefs[loser];
    const effectSpecId = winnerImp
      ? winnerImp.specId
      : loserImp
        ? loserImp.specId
        : null;
    events.push({
      primaryId: winnerBody ? winnerBody.id : "impactor",
      secondaryId: loserBody ? loserBody.id : "impactor",
      primaryImpactorUid: winnerImp ? winnerImp.uid : null,
      secondaryImpactorUid: loserImp ? loserImp.uid : null,
      effectSpecId,
      contactPoint: {
        x: wx + nx * radius[winner],
        y: wy + ny * radius[winner],
        z: wz + nz * radius[winner],
      },
      primaryCenterAt: { x: wx, y: wy, z: wz },
      secondaryCenterAt: { x: lx, y: ly, z: lz },
      contactNormalOnPrimary: { x: nx, y: ny, z: nz },
      primaryDestroyed: false,
      secondaryDestroyed: true,
    });
  }

  /**
   * duration（シミュレーション時間）だけ進めます。最後のステップは duration ちょうどで終わるよう短くします。
   * @returns 実際に進めた時間と使ったステップ数（maxSteps に達したら、そこで止めます）
   */
  advance(
    duration: number,
    maxSteps: number,
    events: SolarCollisionEvent[]
  ): { advancedTime: number; steps: number } {
    let elapsed = 0;
    let steps = 0;
    while (elapsed < duration && steps < maxSteps) {
      const dt = Math.min(this.nextStepLength(), duration - elapsed);
      if (dt <= 0) break;
      this.step(dt, events);
      elapsed += dt;
      steps++;
    }
    return { advancedTime: elapsed, steps };
  }

  /** 番号 i の天体の今の位置 */
  positionOf(i: number): Vec3Tuple {
    return { x: this.px[i], y: this.py[i], z: this.pz[i] };
  }

  /** 計算結果を、もとの天体のオブジェクト（位置・速度・重さ・生死）へ書き戻します */
  writeBack(): void {
    for (let i = 0; i < this.n; i++) {
      const target = this.bodyRefs[i] ?? this.impactorRefs[i];
      if (!target) continue;
      target.pos = { x: this.px[i], y: this.py[i], z: this.pz[i] };
      target.vel = { x: this.vx[i], y: this.vy[i], z: this.vz[i] };
      target.gravityGM = this.gm[i];
      target.alive = this.alive[i] === 1;
    }
  }
}

/** 1回の advanceSolarNBody で使うステップ数の上限（これを超えたら、そのフレームではそこまでで止めます） */
export const MAX_STEPS_PER_ADVANCE = 4000;

/**
 * 太陽系全15天体と投入天体（何個でも）のN体運動を duration（シミュレーション時間）だけ進め、
 * その間に起きた衝突をすべて解決します。結果は渡したオブジェクトに書き戻します。
 * ステップの長さは天体の近づき方に合わせて自動で細かくするので、衛星の速い公転や接近通過も安定して計算できます。
 */
export function advanceSolarNBody(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  impactors: ReadonlyArray<SolarImpactorEntry>,
  duration: number,
  maxSteps = MAX_STEPS_PER_ADVANCE
): { events: SolarCollisionEvent[]; advancedTime: number; steps: number } {
  const events: SolarCollisionEvent[] = [];
  if (duration <= 0) return { events, advancedTime: 0, steps: 0 };
  const system = new FlatNBodySystem(bodies, impactors);
  const { advancedTime, steps } = system.advance(duration, maxSteps, events);
  system.writeBack();
  return { events, advancedTime, steps };
}

// ---------------------------------------------------------------------------
// 6. 先読み予測
// ---------------------------------------------------------------------------

export interface SolarNBodyPredictionResult {
  /** これから投げる投入天体の予測軌道点列（物理上の位置） */
  impactorPath: Vec3Tuple[];
  /** impactorPath の各点の時点での、衛星を持つ母惑星の位置（描く位置に直すときに使います） */
  impactorPathHosts: SatelliteHostSnapshot[][];
  /** 軌道が大きく乱れる太陽・惑星の予測軌跡マップ（物理上の位置） */
  perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>>;
  /** 予測中に衝突する太陽系天体と、そのときの中心（物理上の位置）・法線・母惑星の位置のリスト */
  hitTargets: Array<{
    id: SolarImpactTargetId;
    center: Vec3Tuple;
    normal: Vec3Tuple;
    hosts: SatelliteHostSnapshot[];
  }>;
  /** 予測を最後まで計算できたか（ステップ数の上限に達したら false） */
  completed: boolean;
}

/** 予測計算の中で「これから投げる天体」を見分けるための uid（実際の天体は 0 以上の番号を使います） */
const PREDICTION_IMPACTOR_UID = -1;

/** 予測する長さの標準値（シミュレーション時間。約 3.0 ≒ 4か月） */
export const PREDICTION_HORIZON_SIM_TIME = 3.0;
/** 予測線の点の数の標準値 */
export const PREDICTION_SAMPLE_COUNT = 180;
/** 予測1回で使うステップ数の上限（操作中に重くならないように） */
const PREDICTION_MAX_STEPS = 9000;

/** 惑星の軌道の乱れを予測線で見せる、投入天体の重さの下限（木星の質量の半分） */
const PERTURBATION_PREVIEW_MIN_GM = massKgToGmScene(BODY_MASS_KG.jupiter) * 0.5;

/** 配列の中の母惑星の位置と生死を記録します（予測の途中用） */
function snapshotHostsFromFlat(
  system: FlatNBodySystem,
  hostIndex: Record<SatelliteHostId, number>
): SatelliteHostSnapshot[] {
  return SATELLITE_DISPLAY_SYSTEMS.map((sys) => {
    const i = hostIndex[sys.hostId];
    if (i < 0) {
      return { hostId: sys.hostId, center: { x: 0, y: 0, z: 0 }, alive: false };
    }
    return {
      hostId: sys.hostId,
      center: system.positionOf(i),
      alive: system.alive[i] === 1,
    };
  });
}

/**
 * リアル太陽系全15天体＋投入天体のN体相互万有引力を先読み積分し、
 * これから投げる天体の軌道、引き寄せられて軌道が乱れる惑星たちの軌跡、および衝突するすべての太陽系天体を予測します。
 *
 * startBodies と existingImpactors は「今この瞬間の状態」（物理上の値）です。
 * 中で複製してから計算するので、渡した本物の状態は書き換わりません。
 * 実際の進行（advanceSolarNBody）とまったく同じ計算（ステップの決め方・衝突の判定）を使います。
 */
export function predictSolarNBodyTrajectory(
  startBodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  existingImpactors: ReadonlyArray<SolarImpactorEntry>,
  impactorId: ImpactorId,
  spawnPos: Vec3Tuple,
  launchVel: Vec3Tuple,
  horizon = PREDICTION_HORIZON_SIM_TIME,
  sampleCount = PREDICTION_SAMPLE_COUNT
): SolarNBodyPredictionResult {
  const spec = IMPACTOR_MAP[impactorId];
  const bodies = cloneSolarNBodyEntries(startBodies);
  const impactors: SolarImpactorEntry[] = [];
  for (const existing of existingImpactors) {
    if (existing.alive) impactors.push(cloneImpactorEntry(existing));
  }
  impactors.push({
    uid: PREDICTION_IMPACTOR_UID,
    specId: impactorId,
    pos: { ...spawnPos },
    vel: { ...launchVel },
    gravityGM: spec.gravityGM,
    radius: spec.physicalRadius,
    alive: true,
  });

  const system = new FlatNBodySystem(bodies, impactors);
  const newIndex = system.n - 1;
  const hostIndex = {} as Record<SatelliteHostId, number>;
  for (const sys of SATELLITE_DISPLAY_SYSTEMS) {
    hostIndex[sys.hostId] = system.bodyRefs.findIndex(
      (b) => b !== null && b.id === sys.hostId
    );
  }
  const planetIndices: Array<{ id: SolarImpactTargetId; index: number }> = [];
  system.bodyRefs.forEach((b, index) => {
    if (b && b.parentId === null) planetIndices.push({ id: b.id, index });
  });

  const impactorPath: Vec3Tuple[] = [system.positionOf(newIndex)];
  const impactorPathHosts: SatelliteHostSnapshot[][] = [
    snapshotHostsFromFlat(system, hostIndex),
  ];
  const showPerturbation = spec.gravityGM >= PERTURBATION_PREVIEW_MIN_GM;
  const allPlanetPaths = {} as Record<SolarImpactTargetId, Vec3Tuple[]>;
  if (showPerturbation) {
    for (const { id, index } of planetIndices) {
      if (system.alive[index]) allPlanetPaths[id] = [system.positionOf(index)];
    }
  }

  const hitMap = new Map<
    SolarImpactTargetId,
    SolarNBodyPredictionResult["hitTargets"][number]
  >();
  const interval = horizon / Math.max(1, sampleCount - 1);
  let totalSteps = 0;
  let completed = true;

  for (let sample = 1; sample < sampleCount; sample++) {
    const events: SolarCollisionEvent[] = [];
    const { steps } = system.advance(
      interval,
      PREDICTION_MAX_STEPS - totalSteps,
      events
    );
    totalSteps += steps;

    const hostsNow = snapshotHostsFromFlat(system, hostIndex);
    for (const ev of events) {
      const parties: Array<{
        id: SolarCollisionPartyId;
        center: Vec3Tuple;
        normalSign: number;
      }> = [
        { id: ev.primaryId, center: ev.primaryCenterAt, normalSign: 1 },
        { id: ev.secondaryId, center: ev.secondaryCenterAt, normalSign: -1 },
      ];
      for (const party of parties) {
        if (party.id === "impactor" || hitMap.has(party.id)) continue;
        hitMap.set(party.id, {
          id: party.id,
          center: { ...party.center },
          normal: {
            x: ev.contactNormalOnPrimary.x * party.normalSign,
            y: ev.contactNormalOnPrimary.y * party.normalSign,
            z: ev.contactNormalOnPrimary.z * party.normalSign,
          },
          hosts: hostsNow,
        });
      }
    }

    if (system.alive[newIndex]) {
      impactorPath.push(system.positionOf(newIndex));
      impactorPathHosts.push(hostsNow);
    }
    if (showPerturbation) {
      for (const { id, index } of planetIndices) {
        if (system.alive[index] && allPlanetPaths[id]) {
          allPlanetPaths[id].push(system.positionOf(index));
        }
      }
    }

    // 小天体・惑星級は、これから投げる天体が消えた時点で予測を打ち切ります
    if (!system.alive[newIndex] && spec.tier <= 2) break;
    if (totalSteps >= PREDICTION_MAX_STEPS) {
      completed = false;
      break;
    }
  }

  const perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>> = {};
  if (showPerturbation) {
    for (const { id } of planetIndices) {
      const path = allPlanetPaths[id];
      if (path && path.length >= 6) perturbedPaths[id] = path;
    }
  }

  return {
    impactorPath,
    impactorPathHosts,
    perturbedPaths,
    hitTargets: Array.from(hitMap.values()),
    completed,
  };
}
