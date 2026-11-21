/**
 * リアル太陽系・N体相互万有引力＆天体衝突シミュレーターの物理計算と天体プリセット定義です。
 *
 * 考え方：重力は実寸、当たりは描いた絵で判定
 * - 重力と予測の計算は、太陽系の15天体（太陽＋水金地火木土天海冥＋月＋木星4衛星）も、
 *   投入できる10種類の天体（それぞれ実在の天体がモデル）も、実際の質量・距離で行います。
 * - 天体は見える大きさに拡大し（bodySizes.ts）、衛星は母惑星から広げた位置に描きます（displayWarp.ts）。
 * - 衝突は、画面に描いている位置と大きさで判定します。描いた絵どうしが触れたら当たります。
 *
 * 長さの単位は「1 天文単位 = 13.5」のシーン単位、時間の単位は「地球の1年 ≒ 9.0」のシミュレーション時間です
 * （realBodyData.ts を参照）。
 */

import {
  EARTH_SYSTEM_DISPLAY_FACTOR,
  JUPITER_SYSTEM_DISPLAY_FACTOR,
  REAL_SOLAR_SUN_RADIUS,
  orderedDisplayRadiusFromKm,
  realSolarDisplayRadius,
} from "./bodySizes";
import type { DisplayWarpHost, Vec3Like } from "./displayWarp";
import { warpDisplayToPhysics, warpPhysicsToDisplay } from "./displayWarp";
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
  /** 質量についての補足（例：リゲルは「生まれたときの質量」）。画面の質量の表示の後ろに付けます */
  massNoteJa?: string;
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
  /** 実際の半径（シーン単位。model.radiusKm から計算）。置く位置と触れた点の計算に使います（当たり判定は描く半径 visualRadius で行います） */
  physicalRadius: number;
  /**
   * 画面に描く半径（シーン単位）。
   * 実際の半径から、太陽系の天体と同じ1本の物差し（bodySizes.ts の orderedDisplayRadiusFromKm）で決めます。
   * 実際に大きい天体ほど大きく描く順番を保ちます。当たり判定にもこの半径を使います（描いた絵どうしが触れたら当たり）。
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

/**
 * 描く半径がこれより大きい投入天体（リゲル）を「巨大な恒星」として扱います。
 * 天体の上を押して置く距離の計算では、この大きさを超える描く半径は使いません（足すと数百も離れてしまうため）。
 */
export const HUGE_STAR_DISPLAY_RADIUS = 20;

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

/** モデルの値から、実際の半径・描く半径（当たり判定にも使う）・重力の強さを計算して ImpactorSpec を完成させます */
function completeImpactorSpec(def: ImpactorDefinition): ImpactorSpec {
  const visualRadius = orderedDisplayRadiusFromKm(def.model.radiusKm);
  const physicalRadius = kmToScene(def.model.radiusKm);
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
      // 直径 約10 km（Alvarez ほか 1980, Science 208, 1095 の推定）。
      // 質量は岩石の密度 2,600 kg/m³ を仮定して、この大きさの球から計算した推定値
      radiusKm: 5,
      massKg: sphereMassKg(5, 2600),
      radiusUnit: "km",
      massUnit: "kg",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
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
      // 核の大きさ 約16 × 8 × 8 km（NASA NSSDC Photo Gallery「Halley - Giotto」）の楕円体と同じ体積の球の半径：
      // (16 × 8 × 8)^(1/3) ÷ 2 ≒ 5.0 km。
      // 質量 約2.2 × 10¹⁴ kg は Hughes（1985, MNRAS 213, 103–109）の探査前の推定（密度 0.5 g/cm³・直径 9.4 km を仮定）
      radiusKm: Math.cbrt(16 * 8 * 8) / 2,
      massKg: 2.2e14,
      radiusUnit: "km",
      massUnit: "kg",
      radiusLabelJa: "半径",
      isEstimate: true,
    },
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
      // 半径 78.9 R☉（Moravveji ほか 2012, ApJ 747, 108 の Table 1）。
      // 質量 23 M☉ は Przybilla ほか（2010, A&A 517, A38）の Table 1 の値で、生まれたとき（ゼロ歳主系列）の質量です。
      // 今の質量は、恒星風で失ったぶんこれより少し小さいと考えられますが、確かめられる推定値がないためこの値を使います。
      radiusKm: 78.9 * SUN_RADIUS_KM,
      massKg: 23 * SUN_MASS_KG,
      radiusUnit: "solarRadius",
      massUnit: "solarMass",
      radiusLabelJa: "半径",
      isEstimate: true,
      massNoteJa: "生まれたときの質量",
    },
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
  const note = m.massNoteJa ? `（${m.massNoteJa}）` : "";
  if (m.massUnit === "solarMass") {
    return `質量 ${approx}${formatNumberJa(m.massKg / SUN_MASS_KG)} M☉${note}`;
  }
  if (m.massUnit === "earthMass") {
    return `質量 ${approx}${formatNumberJa(m.massKg / EARTH_MASS_KG)} M⊕${note}`;
  }
  return `質量 ${approx}${formatScientificJa(m.massKg)} kg${note}`;
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
 * 重力の強さ・実際の半径・衛星の公転距離は実際の値（realBodyData.ts）から計算します。
 * 当たり判定には、画面に描く半径（displayRadius）を使います。
 */
export interface SolarTargetPhysicsSpec {
  id: SolarImpactTargetId;
  nameJa: string;
  symbol: string;
  /** 質量（kg） */
  massKg: number;
  /** シーン空間での重力の強さ GM（太陽 = 1200 に対する実際の質量の比） */
  gravityGM: number;
  /** 実際の半径（シーン単位。例：地球 約0.00058）。置く位置と触れた点の計算に使います（当たり判定には使いません） */
  physicalRadius: number;
  /** リアル太陽系モードで描く半径（シーン単位。例：地球 約0.277）。当たり判定にもこの半径を使います */
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
// 3. 衛星の位置の誇張（描く位置。当たり判定もこの位置で行います）
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

/**
 * ある時点での、衛星を広げて描く変換の中心と、変換を使うかの記録です。
 * 当たり判定（物理）と画面の描く位置の両方が、この記録から同じ変換を作ります（予測の各時点の見せ方にも使います）。
 */
export interface SatelliteHostSnapshot {
  hostId: SatelliteHostId;
  /**
   * 変換の中心（物理上の位置）。
   * 母惑星が生きている間は母惑星の中心です。母惑星が消えたあとは、生き残っている衛星たちの重心
   * （GM で重み付けした位置）と一緒に動く点、衛星もすべて消えたあとは止めた点です（resolveSatelliteHost を参照）。
   */
  center: Vec3Tuple;
  /** 変換を使うか（false になるのは、母惑星も衛星も消え、中心のまわりに生きている天体もいなくなったあと） */
  active: boolean;
}

/**
 * 母惑星が消えたあとの、衛星を広げて描く変換の状態です（母惑星の SolarNBodyEntry が持ちます）。
 * 母惑星が生きている間は使いません。
 */
export interface SatelliteWarpState {
  /** 母惑星が消えたあと、変換の中心を「生き残っている衛星たちの重心 ＋ このずれ」にします */
  offset: Vec3Tuple;
  /** 衛星もすべて消えたあとの、止めた中心（衛星が残っている間は null） */
  frozenCenter: Vec3Tuple | null;
  /** 変換を外し終えたか（止めた中心から outerRadius の内側に、生きている天体が1つもいなくなったら true） */
  ended: boolean;
}

/** 母惑星が生きている間の状態（ずれ 0・中心を止めていない・変換を外していない） */
function initialSatelliteWarpState(): SatelliteWarpState {
  return { offset: { x: 0, y: 0, z: 0 }, frozenCenter: null, ended: false };
}

/** 状態を複製します（予測で本物の状態を書き換えないため） */
function cloneSatelliteWarpState(state: SatelliteWarpState): SatelliteWarpState {
  return {
    offset: { ...state.offset },
    frozenCenter: state.frozenCenter ? { ...state.frozenCenter } : null,
    ended: state.ended,
  };
}

/** 重さ GM と位置の組（重心の計算に使います） */
interface WeightedPoint {
  gm: number;
  x: number;
  y: number;
  z: number;
}

/**
 * 衛星を広げて描く変換の中心を決めます（物理の当たり判定と画面の描く位置で、同じこの関数を使います）。
 *
 * - 母惑星が生きている：母惑星の中心
 * - 母惑星が消えた：生き残っている衛星たちの重心（GM で重み付け）に state.offset を足した点。
 *   offset は、母惑星が消えた瞬間や衛星が合体・消滅した瞬間に「中心が動かない」ように決め直すずれです
 *   （FlatNBodySystem.keepWarpCentersFixed）。これで、消えた瞬間に衛星の描く位置が飛ばず、
 *   そのあとは衛星たちの重心と一緒に動きます。
 * - 衛星もすべて消えた：最後の中心（state.frozenCenter）で止めたまま、変換を残します。
 *   中心から outerRadius の内側に生きている天体が1つもいなくなったら、変換を外します（state.ended）。
 *   outerRadius より外では変換しても位置が変わらないので、外したときに何も飛びません。
 *
 * 母惑星が消えても変換を残すのは、衛星どうしを広げて描いたままにするためです。
 * 変換をなくすと衛星が実際の距離に戻り、描く半径の和のほうが距離より大きくなって、すぐにぶつかってしまいます。
 *
 * @param satellites 生き残っている衛星（母惑星が生きているときは使わないので、空でかまいません）
 */
function resolveSatelliteHost(
  hostId: SatelliteHostId,
  hostAlive: boolean,
  hostPos: Vec3Tuple,
  state: SatelliteWarpState,
  satellites: ReadonlyArray<WeightedPoint>
): SatelliteHostSnapshot {
  if (hostAlive) {
    return { hostId, center: { ...hostPos }, active: true };
  }
  // 生き残っている衛星たちの重心（重い衛星ほど強く効くよう、GM で重み付けした平均の位置）
  let gmSum = 0;
  let x = 0;
  let y = 0;
  let z = 0;
  for (const s of satellites) {
    gmSum += s.gm;
    x += s.gm * s.x;
    y += s.gm * s.y;
    z += s.gm * s.z;
  }
  if (satellites.length > 0 && gmSum > 0) {
    return {
      hostId,
      center: {
        x: x / gmSum + state.offset.x,
        y: y / gmSum + state.offset.y,
        z: z / gmSum + state.offset.z,
      },
      active: true,
    };
  }
  // 衛星もすべて消えた：止めた中心があれば、外し終えるまで変換を残します
  if (state.frozenCenter) {
    return { hostId, center: { ...state.frozenCenter }, active: !state.ended };
  }
  return { hostId, center: { ...hostPos }, active: false };
}

/** 位置が決まっていないときに使う原点 */
const ORIGIN: Vec3Tuple = { x: 0, y: 0, z: 0 };

/** 太陽系天体の状態から、各系の変換の中心と、変換を使うかを記録します */
export function snapshotSatelliteHosts(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>
): SatelliteHostSnapshot[] {
  return SATELLITE_DISPLAY_SYSTEMS.map((sys) => {
    const host = bodies[sys.hostId];
    const hostAlive = host ? host.alive : false;
    // 母惑星が生きている間は衛星の位置を使わないので、消えたときだけ集めます（計算を軽くするため）
    const satellites: WeightedPoint[] = [];
    if (!hostAlive) {
      for (const spec of SOLAR_TARGET_SPECS) {
        if (spec.parentId !== sys.hostId) continue;
        const sat = bodies[spec.id];
        if (!sat || !sat.alive) continue;
        satellites.push({ gm: sat.gravityGM, x: sat.pos.x, y: sat.pos.y, z: sat.pos.z });
      }
    }
    return resolveSatelliteHost(
      sys.hostId,
      hostAlive,
      host ? host.pos : ORIGIN,
      host?.satelliteWarp ?? initialSatelliteWarpState(),
      satellites
    );
  });
}

/**
 * 変換の中心の記録から、displayWarp.ts の変換に渡す設定を作ります。
 * 変換を使う系（active）は効き具合 1、使わない系は 0 です（少しずつ弱める処理はしません）。
 */
export function buildDisplayWarpHosts(
  hosts: ReadonlyArray<SatelliteHostSnapshot>
): DisplayWarpHost[] {
  const result: DisplayWarpHost[] = [];
  for (const h of hosts) {
    const sys = SATELLITE_DISPLAY_SYSTEMS.find((s) => s.hostId === h.hostId);
    if (!sys) continue;
    result.push({
      center: h.center,
      factor: sys.factor,
      innerRadius: sys.innerRadius,
      outerRadius: sys.outerRadius,
      weight: h.active ? 1 : 0,
    });
  }
  return result;
}

/**
 * 太陽系天体の上を押して投入天体を置くとき、「すぐ近く」としてその天体の中心から離す距離（描く空間）を求めます。
 * 次の2つのうち遠いほうです。
 * (a) 描いた絵が重ならない距離：天体の今の描く半径 × 1.9 ＋ 投入天体の描く半径 × 1.45 ＋ 1.4。
 *     天体の描く半径は、画面で今描いている値を使います（太陽はどの距離でも 3.4 です）。
 *     ただし巨大な恒星（リゲル、描く半径 268）の描く半径は足しません（足すと数百も離れてしまうため）
 * (b) 実際の大きさが重ならない距離：2天体の実際の半径の和 × 1.5 だけ離れた物理上の点を、描く位置に直した距離。
 *     当たりは描く大きさで判定するので、(b) は当たりを避けるためのものではありません。
 *     N体計算は天体を点として扱うため、実際の大きさより近くに置くと、実際にはありえない強い重力がはたらきます。
 *     そうした状態から計算を始めないためのものです（今の天体では、(b) で決まるのはリゲルだけです）
 *
 * @param targetPhys 天体の物理上の中心
 * @param targetDrawn 天体を描いている中心
 * @param targetDrawnRadius 天体を今描いている半径（シーン単位）
 * @param direction 置く向き（長さ1）
 * @param warpHosts 物理上の位置を描く位置に直す変換の設定
 */
export function nearBodySpawnClearance(
  impactorId: ImpactorId,
  targetId: SolarImpactTargetId,
  targetPhys: Vec3Like,
  targetDrawn: Vec3Like,
  targetDrawnRadius: number,
  direction: Vec3Like,
  warpHosts: ReadonlyArray<DisplayWarpHost>
): number {
  const spec = IMPACTOR_MAP[impactorId];
  const target = SOLAR_TARGET_MAP[targetId];
  const impactorDrawn =
    spec.visualRadius <= HUGE_STAR_DISPLAY_RADIUS ? spec.visualRadius : 0;
  const drawnClearance = targetDrawnRadius * 1.9 + impactorDrawn * 1.45 + 1.4;
  const gap = (target.physicalRadius + spec.physicalRadius) * 1.5;
  const drawnPoint = warpPhysicsToDisplay(
    {
      x: targetPhys.x + direction.x * gap,
      y: targetPhys.y + direction.y * gap,
      z: targetPhys.z + direction.z * gap,
    },
    warpHosts,
    { x: 0, y: 0, z: 0 }
  );
  const physClearance = Math.hypot(
    drawnPoint.x - targetDrawn.x,
    drawnPoint.y - targetDrawn.y,
    drawnPoint.z - targetDrawn.z
  );
  return Math.max(drawnClearance, physClearance);
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
  /** 実際の半径（触れた点の位置の計算に使います。当たり判定は描く半径で行います） */
  radius: number;
  parentId: SolarImpactTargetId | null;
  alive: boolean;
  /**
   * 衛星を持つ母惑星（地球・木星）だけが使う値です。母惑星が消えたあとの、衛星を広げて描く変換の状態
   * （中心のずれ・止めた中心・変換を外し終えたか）を持ちます。未設定は、母惑星が生きている間の状態と同じです。
   */
  satelliteWarp?: SatelliteWarpState;
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
  /** 実際の半径（触れた点の位置の計算に使います。当たり判定は描く半径で行います） */
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
  /**
   * 触れた瞬間の、衛星を広げて描く変換の中心と、変換を使うかの記録です（地球と月の系・木星と4衛星の系）。
   * 衝突の位置を「描く位置」に直すときは、フレームの終わりではなくこの瞬間の記録を使います。
   */
  hostsAtContact: SatelliteHostSnapshot[];
  /** 主側天体が消滅したか（取り込みでは残るので false、対消滅では true） */
  primaryDestroyed: boolean;
  /** 副側天体が消滅したか（取り込まれても対消滅しても true） */
  secondaryDestroyed: boolean;
  /** 同じ天体どうしがぶつかって、両方とも消えた（対消滅）か */
  annihilation: boolean;
}

/**
 * 投入天体のうち、太陽系の天体をモデルにしたもの（この天体とぶつかると対消滅します）。
 * 例：月サイズは月と、太陽クラス恒星は太陽と「同じ天体」として扱います。
 */
const IMPACTOR_SAME_AS_SOLAR_BODY: Partial<Record<ImpactorId, SolarImpactTargetId>> = {
  moonSize: "moon",
  marsSize: "mars",
  jupiterSize: "jupiter",
  sunStar: "sun",
};

/** 対消滅の判定に使う「天体の種類」の名前（同じ名前どうしがぶつかると両方消えます） */
function annihilationKindOfImpactor(specId: ImpactorId): string {
  return IMPACTOR_SAME_AS_SOLAR_BODY[specId] ?? specId;
}

/**
 * 物理上の位置のスナップショットから、ケプラー公転速度を備えた
 * N体万有引力シミュレーションの初期状態を生成します。
 * 実際の半径（radius）・重力の強さは SOLAR_TARGET_SPECS の実際の値です（当たり判定は描く半径で行います）。
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
        active: Boolean(item),
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
    copied[spec.id] = {
      ...b,
      pos: { ...b.pos },
      vel: { ...b.vel },
      satelliteWarp: b.satelliteWarp ? cloneSatelliteWarpState(b.satelliteWarp) : undefined,
    };
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
  /** 実際の半径（触れた点の位置の計算に使います） */
  readonly radius: Float64Array;
  /**
   * 当たり判定の半径＝画面に描いている半径です（太陽系天体は SOLAR_TARGET_MAP の displayRadius、投入天体は visualRadius）。
   * 当たりは「描く位置」どうしの距離で判定するので、描いた絵が触れたときに当たります。
   */
  readonly hitRadius: Float64Array;
  /** 当たり判定用：ステップの始めと終わりの「描く位置」（作業用） */
  private readonly dsx: Float64Array;
  private readonly dsy: Float64Array;
  private readonly dsz: Float64Array;
  private readonly dex: Float64Array;
  private readonly dey: Float64Array;
  private readonly dez: Float64Array;
  readonly alive: Uint8Array;
  readonly isBlackHole: Uint8Array;
  /** 対消滅の判定に使う天体の種類（同じ種類どうしがぶつかると、両方とも消えます） */
  readonly kind: string[];
  /** 配列の番号 → 太陽系天体（投入天体なら null） */
  readonly bodyRefs: Array<SolarNBodyEntry | null>;
  /** 配列の番号 → 投入天体（太陽系天体なら null） */
  readonly impactorRefs: Array<SolarImpactorEntry | null>;
  /** 衛星を持つ母惑星（地球・木星）の配列の番号（見つからなければ -1） */
  readonly hostIndex: Record<SatelliteHostId, number>;
  /** 系ごとの衛星の配列の番号（地球の系なら月、木星の系なら4衛星） */
  readonly satelliteIndices: Record<SatelliteHostId, number[]>;
  /** 系ごとの、母惑星が消えたあとの変換の状態（SolarNBodyEntry.satelliteWarp と同じ意味） */
  readonly satelliteWarp: Record<SatelliteHostId, SatelliteWarpState>;
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
    this.hitRadius = new Float64Array(n);
    this.dsx = new Float64Array(n);
    this.dsy = new Float64Array(n);
    this.dsz = new Float64Array(n);
    this.dex = new Float64Array(n);
    this.dey = new Float64Array(n);
    this.dez = new Float64Array(n);
    this.alive = new Uint8Array(n);
    this.isBlackHole = new Uint8Array(n);
    this.kind = [];
    this.bodyRefs = [];
    this.impactorRefs = [];

    let i = 0;
    for (const b of bodyList) {
      this.load(i, b.pos, b.vel, b.gravityGM, b.radius, b.alive, false);
      this.hitRadius[i] = SOLAR_TARGET_MAP[b.id].displayRadius;
      this.kind.push(b.id);
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
      this.hitRadius[i] = IMPACTOR_MAP[imp.specId].visualRadius;
      this.kind.push(annihilationKindOfImpactor(imp.specId));
      this.bodyRefs.push(null);
      this.impactorRefs.push(imp);
      i++;
    }
    this.hostIndex = { earth: -1, jupiter: -1 };
    this.satelliteIndices = { earth: [], jupiter: [] };
    this.satelliteWarp = {
      earth: initialSatelliteWarpState(),
      jupiter: initialSatelliteWarpState(),
    };
    for (const sys of SATELLITE_DISPLAY_SYSTEMS) {
      const hostI = this.bodyRefs.findIndex(
        (b) => b !== null && b.id === sys.hostId
      );
      this.hostIndex[sys.hostId] = hostI;
      const hostBody = hostI >= 0 ? this.bodyRefs[hostI] : null;
      if (hostBody?.satelliteWarp) {
        this.satelliteWarp[sys.hostId] = cloneSatelliteWarpState(hostBody.satelliteWarp);
      }
      this.bodyRefs.forEach((b, index) => {
        if (b !== null && b.parentId === sys.hostId) {
          this.satelliteIndices[sys.hostId].push(index);
        }
      });
    }
    this.computeAccelerations();
  }

  /** 番号 i の天体の、ステップ中の時点 t（0 = 始め、1 = 終わり）での位置（始めと終わりをまっすぐつないだ位置） */
  private positionAt(i: number, t: number): Vec3Tuple {
    return {
      x: this.sx[i] + (this.px[i] - this.sx[i]) * t,
      y: this.sy[i] + (this.py[i] - this.sy[i]) * t,
      z: this.sz[i] + (this.pz[i] - this.sz[i]) * t,
    };
  }

  /**
   * ステップ中の時点 t（0 = 始め、1 = 終わり）での、各系の変換の中心と、変換を使うかを記録します。
   * 当たり判定の「描く位置」の計算と、衝突した瞬間の記録（爆発の位置・予測のリング）に使います。
   * 中心の決め方は snapshotSatelliteHosts と同じ resolveSatelliteHost です。
   */
  hostsAt(t: number): SatelliteHostSnapshot[] {
    return SATELLITE_DISPLAY_SYSTEMS.map((sys) => {
      const i = this.hostIndex[sys.hostId];
      const hostAlive = i >= 0 && this.alive[i] === 1;
      // 母惑星が生きている間は衛星の位置を使わないので、消えたときだけ集めます（計算を軽くするため）
      const satellites: WeightedPoint[] = [];
      if (!hostAlive) {
        for (const s of this.satelliteIndices[sys.hostId]) {
          if (!this.alive[s]) continue;
          satellites.push({ gm: this.gm[s], ...this.positionAt(s, t) });
        }
      }
      return resolveSatelliteHost(
        sys.hostId,
        hostAlive,
        i >= 0 ? this.positionAt(i, t) : ORIGIN,
        this.satelliteWarp[sys.hostId],
        satellites
      );
    });
  }

  /** 母惑星が生きているか（母惑星が見つからなければ false） */
  private isHostAlive(hostId: SatelliteHostId): boolean {
    const i = this.hostIndex[hostId];
    return i >= 0 && this.alive[i] === 1;
  }

  /** その系の衛星が1つでも生きているか */
  private hasLivingSatellite(hostId: SatelliteHostId): boolean {
    for (const s of this.satelliteIndices[hostId]) {
      if (this.alive[s]) return true;
    }
    return false;
  }

  /**
   * 天体の合体・消滅のあとに呼び、母惑星が消えている系の変換の中心が、合体・消滅の前と同じ位置になるようにします。
   * - 衛星が残っている：ずれ（offset）を直します。
   *   例：木星が消えた瞬間、中心は「木星の位置」から「衛星たちの重心」に変わりますが、ずれを足して木星の位置のままにします。
   * - 最後の衛星が消えた：その直前の中心で止めます（frozenCenter）。
   * こうすると、衛星や系の中にいる天体の描く位置が急に飛びません（当たり判定でも画面でも同じ）。
   * @param t 合体・消滅が起きた、ステップ中の時点
   * @param before 合体・消滅の前に hostsAt(t) で記録した中心
   */
  private keepWarpCentersFixed(t: number, before: SatelliteHostSnapshot[]): void {
    const after = this.hostsAt(t);
    for (let k = 0; k < after.length; k++) {
      const b = before[k];
      const a = after[k];
      // 母惑星が生きている系は、中心が母惑星の位置のままなので直す必要はありません。
      // 合体・消滅の前から変換を使っていない系も、直すものがありません
      if (this.isHostAlive(a.hostId) || !b.active) continue;
      const state = this.satelliteWarp[a.hostId];
      if (this.hasLivingSatellite(a.hostId)) {
        state.offset.x += b.center.x - a.center.x;
        state.offset.y += b.center.y - a.center.y;
        state.offset.z += b.center.z - a.center.z;
      } else if (!state.frozenCenter) {
        state.frozenCenter = { ...b.center };
      }
    }
  }

  /**
   * ステップの終わりに呼び、衛星がすべて消えて中心を止めた系のうち、中心から outerRadius の内側に
   * 生きている天体（投入天体も含む）が1つもいなくなった系の変換を外します。
   * outerRadius より外の天体は、変換があってもなくても同じ位置に描くので、外したときに何も飛びません。
   */
  private endEmptyWarps(): void {
    const { n, px, py, pz, alive } = this;
    for (const sys of SATELLITE_DISPLAY_SYSTEMS) {
      const state = this.satelliteWarp[sys.hostId];
      if (!state.frozenCenter || state.ended || this.isHostAlive(sys.hostId)) continue;
      const c = state.frozenCenter;
      let someoneInside = false;
      for (let i = 0; i < n; i++) {
        if (!alive[i]) continue;
        const d = Math.hypot(px[i] - c.x, py[i] - c.y, pz[i] - c.z);
        if (d < sys.outerRadius) {
          someoneInside = true;
          break;
        }
      }
      if (!someoneInside) state.ended = true;
    }
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
    // 中心を止めた系の中に誰もいなくなっていたら、変換を外します（次のステップから使いません）
    this.endEmptyWarps();
  }

  /**
   * 各天体の、ステップの始めと終わりの「描く位置」を求めます。
   * 物理上の位置を、衛星のまわりを広げて描く変換（displayWarp.ts）で、画面に描いている位置に直します。
   */
  private computeDrawnPositions(): void {
    const { n, px, py, pz, sx, sy, sz, dsx, dsy, dsz, dex, dey, dez } = this;
    const startHosts = buildDisplayWarpHosts(this.hostsAt(0));
    const endHosts = buildDisplayWarpHosts(this.hostsAt(1));
    const pIn = { x: 0, y: 0, z: 0 };
    const pOut = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < n; i++) {
      pIn.x = sx[i];
      pIn.y = sy[i];
      pIn.z = sz[i];
      warpPhysicsToDisplay(pIn, startHosts, pOut);
      dsx[i] = pOut.x;
      dsy[i] = pOut.y;
      dsz[i] = pOut.z;
      pIn.x = px[i];
      pIn.y = py[i];
      pIn.z = pz[i];
      warpPhysicsToDisplay(pIn, endHosts, pOut);
      dex[i] = pOut.x;
      dey[i] = pOut.y;
      dez[i] = pOut.z;
    }
  }

  /**
   * このステップの間に触れた天体の組を探し、重いほうが軽いほうを取り込む形で解決します。
   * 当たりは、画面に描いている位置と大きさで判定します（描いた絵どうしが触れたら当たり）。
   * ステップの間、各天体の描く位置は始めから終わりへまっすぐ動いたとみなし、2天体の距離が
   * 描く半径の和以下になった時点があるかを調べます（スイープ判定）。速く動く小さな天体もすり抜けません。
   * @returns 衝突が1件でもあれば true
   */
  private resolveCollisions(events: SolarCollisionEvent[]): boolean {
    const { n, hitRadius, alive, dsx, dsy, dsz, dex, dey, dez } = this;
    this.computeDrawnPositions();
    let collided = false;
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (!alive[j]) continue;
        const hitR = hitRadius[i] + hitRadius[j];
        // ステップの始めの相対位置 d0 と、ステップの間の相対移動 dv（どちらも描く位置で測ります）
        const d0x = dsx[j] - dsx[i];
        const d0y = dsy[j] - dsy[i];
        const d0z = dsz[j] - dsz[i];
        const dvx = dex[j] - dsx[j] - (dex[i] - dsx[i]);
        const dvy = dey[j] - dsy[j] - (dey[i] - dsy[i]);
        const dvz = dez[j] - dsz[j] - (dez[i] - dsz[i]);
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
    const { px, py, pz, sx, sy, sz, vx, vy, vz, gm, radius, alive, isBlackHole, kind } =
      this;
    // 同じ天体どうし（例：リゲルとリゲル、月サイズと月）は、どちらも残らず消えます（対消滅）
    const annihilation = kind[i] === kind[j];
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

    // 触れた瞬間の変換の中心（取り込まれるのが母惑星でも、この瞬間はまだ生きています）
    const hostsAtContact = this.hostsAt(t);

    if (annihilation) {
      // 対消滅：両方とも消え、重さも残りません
      alive[winner] = 0;
      alive[loser] = 0;
    } else {
      // 運動量を保存して合体（速度を GM の比で混ぜ、GM を足し合わせます）
      const total = gm[winner] + gm[loser];
      if (total > 0) {
        vx[winner] = (vx[winner] * gm[winner] + vx[loser] * gm[loser]) / total;
        vy[winner] = (vy[winner] * gm[winner] + vy[loser] * gm[loser]) / total;
        vz[winner] = (vz[winner] * gm[winner] + vz[loser] * gm[loser]) / total;
      }
      gm[winner] = total;
      alive[loser] = 0;
    }
    // 母惑星や衛星が消えたり重さが変わったりしても、変換の中心がこの瞬間に飛ばないようにします
    this.keepWarpCentersFixed(t, hostsAtContact);

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
      hostsAtContact,
      primaryDestroyed: annihilation,
      secondaryDestroyed: true,
      annihilation,
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
    // 母惑星が消えたあとの変換の状態も、母惑星の天体に書き戻します（次のフレームや予測で使うため）
    for (const sys of SATELLITE_DISPLAY_SYSTEMS) {
      const hostI = this.hostIndex[sys.hostId];
      const hostBody = hostI >= 0 ? this.bodyRefs[hostI] : null;
      if (hostBody) {
        hostBody.satelliteWarp = cloneSatelliteWarpState(this.satelliteWarp[sys.hostId]);
      }
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
  /** impactorPath の各点の時点での、衛星を広げて描く変換の中心（ふつうは母惑星の位置）の記録（描く位置に直すときに使います） */
  impactorPathHosts: SatelliteHostSnapshot[][];
  /** 軌道が大きく乱れる太陽・惑星の予測軌跡マップ（物理上の位置） */
  perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>>;
  /** 予測中に衝突する太陽系天体と、そのときの中心（物理上の位置）・法線・変換の中心（ふつうは母惑星の位置）のリスト */
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

/** 予測を少しずつ進めるときの、1回あたりのステップ数（この回数ごとに「中断するか」を確かめます） */
const PREDICTION_STEPS_PER_CHUNK = 64;

/**
 * 先読み予測を「少しずつ」計算するための入れ物です。
 *
 * 予測は数千ステップの計算になり、置いた天体が多いほど重くなります。狙っている間に毎回最後まで計算すると
 * 画面がカクつくため、run() に「そろそろ止めるか」を判定する関数を渡し、決めた時間を使い切ったら途中で止め、
 * 次のフレームで続きを計算できるようにしています。途中までの結果も result() で取り出せます。
 *
 * startBodies と existingImpactors は「今この瞬間の状態」（物理上の値）です。
 * 中で複製してから計算するので、渡した本物の状態は書き換わりません。
 * 実際の進行（advanceSolarNBody）とまったく同じ計算（ステップの決め方・衝突の判定）を使います。
 */
export class SolarNBodyPredictor {
  private readonly spec: ImpactorSpec;
  private readonly system: FlatNBodySystem;
  private readonly newIndex: number;
  private readonly planetIndices: Array<{ id: SolarImpactTargetId; index: number }> = [];
  private readonly showPerturbation: boolean;
  private readonly interval: number;
  private readonly sampleCount: number;
  private readonly impactorPath: Vec3Tuple[];
  private readonly impactorPathHosts: SatelliteHostSnapshot[][];
  private readonly allPlanetPaths = {} as Record<SolarImpactTargetId, Vec3Tuple[]>;
  private readonly hitMap = new Map<
    SolarImpactTargetId,
    SolarNBodyPredictionResult["hitTargets"][number]
  >();
  /** 次に記録する点の番号 */
  private sample = 1;
  /** 今の点の区間のうち、すでに進めた時間 */
  private sampleElapsed = 0;
  private totalSteps = 0;
  private finished = false;
  private completed = true;

  constructor(
    startBodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
    existingImpactors: ReadonlyArray<SolarImpactorEntry>,
    impactorId: ImpactorId,
    spawnPos: Vec3Tuple,
    launchVel: Vec3Tuple,
    horizon = PREDICTION_HORIZON_SIM_TIME,
    sampleCount = PREDICTION_SAMPLE_COUNT
  ) {
    this.spec = IMPACTOR_MAP[impactorId];
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
      gravityGM: this.spec.gravityGM,
      radius: this.spec.physicalRadius,
      alive: true,
    });

    this.system = new FlatNBodySystem(bodies, impactors);
    this.newIndex = this.system.n - 1;
    this.system.bodyRefs.forEach((b, index) => {
      if (b && b.parentId === null) this.planetIndices.push({ id: b.id, index });
    });
    this.sampleCount = sampleCount;
    this.interval = horizon / Math.max(1, sampleCount - 1);
    this.impactorPath = [this.system.positionOf(this.newIndex)];
    this.impactorPathHosts = [this.system.hostsAt(1)];
    this.showPerturbation = this.spec.gravityGM >= PERTURBATION_PREVIEW_MIN_GM;
    if (this.showPerturbation) {
      for (const { id, index } of this.planetIndices) {
        if (this.system.alive[index]) {
          this.allPlanetPaths[id] = [this.system.positionOf(index)];
        }
      }
    }
  }

  /** 予測を最後まで計算し終えたか */
  get isFinished(): boolean {
    return this.finished;
  }

  /**
   * 予測の続きを計算します。PREDICTION_STEPS_PER_CHUNK ステップごとに shouldStop() を呼び、
   * true が返ったらそこで止めます（次に run() を呼ぶと続きから計算します）。
   * @returns 最後まで計算し終えたら true
   */
  run(shouldStop: () => boolean): boolean {
    const { system, newIndex } = this;
    while (!this.finished) {
      if (shouldStop()) return false;

      const events: SolarCollisionEvent[] = [];
      const { advancedTime, steps } = system.advance(
        this.interval - this.sampleElapsed,
        Math.min(PREDICTION_STEPS_PER_CHUNK, PREDICTION_MAX_STEPS - this.totalSteps),
        events
      );
      this.sampleElapsed += advancedTime;
      this.totalSteps += steps;
      this.recordHits(events);

      // 点の区間を進め終えたら、その時点の位置を記録します
      if (this.sampleElapsed >= this.interval * (1 - 1e-9)) {
        this.sampleElapsed = 0;
        const hostsNow = system.hostsAt(1);
        if (system.alive[newIndex]) {
          this.impactorPath.push(system.positionOf(newIndex));
          this.impactorPathHosts.push(hostsNow);
        }
        if (this.showPerturbation) {
          for (const { id, index } of this.planetIndices) {
            if (system.alive[index] && this.allPlanetPaths[id]) {
              this.allPlanetPaths[id].push(system.positionOf(index));
            }
          }
        }
        this.sample++;
        if (this.sample >= this.sampleCount) this.finished = true;
        // 小天体・惑星級は、これから投げる天体が消えた時点で予測を打ち切ります
        if (!system.alive[newIndex] && this.spec.tier <= 2) this.finished = true;
      }

      if (!this.finished && this.totalSteps >= PREDICTION_MAX_STEPS) {
        this.completed = false;
        this.finished = true;
      }
      if (steps === 0 && advancedTime === 0 && !this.finished) {
        // 進められなかった（念のための安全策）
        this.finished = true;
      }
    }
    return true;
  }

  /** 衝突した太陽系天体を、触れた瞬間の中心・法線・変換の中心（ふつうは母惑星の位置）と一緒に記録します */
  private recordHits(events: SolarCollisionEvent[]): void {
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
        if (party.id === "impactor" || this.hitMap.has(party.id)) continue;
        this.hitMap.set(party.id, {
          id: party.id,
          center: { ...party.center },
          normal: {
            x: ev.contactNormalOnPrimary.x * party.normalSign,
            y: ev.contactNormalOnPrimary.y * party.normalSign,
            z: ev.contactNormalOnPrimary.z * party.normalSign,
          },
          hosts: ev.hostsAtContact,
        });
      }
    }
  }

  /** ここまでに計算できた予測の結果（途中でも取り出せます） */
  result(): SolarNBodyPredictionResult {
    const perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>> = {};
    if (this.showPerturbation) {
      for (const { id } of this.planetIndices) {
        const path = this.allPlanetPaths[id];
        if (path && path.length >= 6) perturbedPaths[id] = path;
      }
    }
    return {
      impactorPath: this.impactorPath,
      impactorPathHosts: this.impactorPathHosts,
      perturbedPaths,
      hitTargets: Array.from(this.hitMap.values()),
      completed: this.completed && this.finished,
    };
  }
}

/**
 * 先読み予測を最後まで一度に計算します（テストや、時間を気にしない計算用）。
 * 画面で狙っている間は、SolarNBodyPredictor を使って複数フレームに分けて計算します。
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
  const predictor = new SolarNBodyPredictor(
    startBodies,
    existingImpactors,
    impactorId,
    spawnPos,
    launchVel,
    horizon,
    sampleCount
  );
  predictor.run(() => false);
  return predictor.result();
}
