/**
 * リアル太陽系・N体相互万有引力＆天体衝突シミュレーターの物理計算と天体プリセット定義です。
 * - 投入できる天体（全10種・4ティア：小惑星、氷彗星、月サイズ、火星サイズ、木星サイズ、
 *   赤色矮星、太陽クラス恒星、青色超巨星、中性子星、ブラックホール）
 * - 太陽系の全15天体（太陽＋水金地火木土天海冥＋月＋木星4衛星イオ・エウロパ・ガニメデ・カリスト）
 * すべてが互いの万有引力（N体問題）でリアルタイムに運動し、軌道の乱れや天体同士の連鎖衝突・吸収を計算します。
 * 投入天体は種類を問わず何個でも同時に置けて、投入天体同士も互いに引き合い、ぶつかると合体します。
 */

import {
  REAL_SOLAR_SUN_RADIUS,
  SIMPLE_MODE_MOON_ORBIT_RADIUS,
  realSolarDisplayRadius,
} from "./bodySizes";
import { GALILEAN_MOONS } from "./solarSystem";

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
 * 衝突破壊の規模ティア
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

export interface ImpactorSpec {
  id: ImpactorId;
  /** 日本語名 */
  nameJa: string;
  /** サブ説明（規模・特徴の目安） */
  subtitleJa: string;
  /** 破壊規模ティア（1〜4） */
  tier: ImpactTier;
  /** ティア表記ラベル */
  tierLabelJa: string;
  /** 記号 */
  symbol: string;
  /** UIアクセントカラー */
  accentColor: string;
  /**
   * 3D表示と衝突判定の半径（シーン単位。リアル太陽系モードの地球の半径は約 0.277）。
   * 月サイズ・火星サイズ・木星サイズは惑星と同じ実比率、恒星は太陽と同じ別縮尺、
   * 小惑星・氷彗星・中性子星・ブラックホールは実寸では見えないため、見える最小限の大きさにしています。
   */
  visualRadius: number;
  /** 衝突・重力演出上の相対質量（地球 = 1.0 基準） */
  relativeMass: number;
  /** この天体自身が持つ万有引力定数 GM（他の惑星・衛星・太陽の軌道を引き寄せる重力強度） */
  gravityGM: number;
  /** 月や小型天体に衝突したあとも消滅せず貫通・吸引を続けるか */
  survivesMoonImpact: boolean;
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
  /** 地球クラスの岩石惑星を一撃で粉砕・消滅させるか */
  destroysEarth: boolean;
  /** 恒星（自ら発光・コロナを持つ天体）か */
  isStar: boolean;
  /** 中性子星（高速回転パルサービームを持つ超高密度天体）か */
  isNeutronStar: boolean;
  /** ブラックホール（事象の地平線と降着円盤・相対論的ジェットを持つ極限天体）か */
  isBlackHole: boolean;
  /** 氷彗星型の青白い蒸気・氷プラズマ爆発を使うか */
  isIcyComet: boolean;
}

export const IMPACTOR_SPECS: ImpactorSpec[] = [
  {
    id: "asteroid",
    nameJa: "小惑星",
    subtitleJa: "チクシュルーブ級・岩石隕石",
    tier: 1,
    tierLabelJa: "小天体：クレーター傷・局所爆発",
    symbol: "☄",
    accentColor: "#fb923c",
    visualRadius: 0.05,
    relativeMass: 0.0008,
    gravityGM: 0.12,
    survivesMoonImpact: false,
    explosionColorHex: "#ff7a18",
    flashColorCss: "255, 224, 178",
    shakeStrength: 0.34,
    craterAngleRad: 0.42,
    crackIntensity: 0.2,
    destroysEarth: false,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "comet",
    nameJa: "氷彗星",
    subtitleJa: "ハレー級・青白い蒸気爆発",
    tier: 1,
    tierLabelJa: "小天体：氷蒸気クレーター",
    symbol: "❄",
    accentColor: "#38bdf8",
    visualRadius: 0.055,
    relativeMass: 0.0005,
    gravityGM: 0.08,
    survivesMoonImpact: false,
    explosionColorHex: "#38bdf8",
    flashColorCss: "186, 238, 255",
    shakeStrength: 0.3,
    craterAngleRad: 0.44,
    crackIntensity: 0.18,
    destroysEarth: false,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: true,
  },
  {
    id: "moonSize",
    nameJa: "月サイズ",
    subtitleJa: "テイア級・巨大衝突＆破片リング",
    tier: 2,
    tierLabelJa: "惑星級：地殻崩壊・マグマ化",
    symbol: "🌑",
    accentColor: "#f59e0b",
    visualRadius: realSolarDisplayRadius("moon"),
    relativeMass: 0.05,
    gravityGM: 8.5,
    survivesMoonImpact: true,
    explosionColorHex: "#ff5500",
    flashColorCss: "255, 210, 140",
    shakeStrength: 0.68,
    craterAngleRad: 1.05,
    crackIntensity: 0.78,
    destroysEarth: false,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "marsSize",
    nameJa: "火星サイズ",
    subtitleJa: "赤色惑星・全面溶岩＆軌道摂動",
    tier: 2,
    tierLabelJa: "惑星級：惑星崩壊・軌道乱れ",
    symbol: "♂",
    accentColor: "#f87171",
    visualRadius: realSolarDisplayRadius("mars"),
    relativeMass: 0.15,
    gravityGM: 22.0,
    survivesMoonImpact: true,
    explosionColorHex: "#ff3800",
    flashColorCss: "255, 195, 130",
    shakeStrength: 0.84,
    craterAngleRad: 1.55,
    crackIntensity: 0.98,
    destroysEarth: false,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "jupiterSize",
    nameJa: "木星サイズ",
    subtitleJa: "巨大ガス惑星・惑星軌道を掻き乱す",
    tier: 2,
    tierLabelJa: "惑星級：巨大ガス惑星・丸呑み",
    symbol: "♃",
    accentColor: "#fbbf24",
    visualRadius: realSolarDisplayRadius("jupiter"),
    relativeMass: 8.5,
    gravityGM: 190.0,
    survivesMoonImpact: true,
    explosionColorHex: "#ffaa22",
    flashColorCss: "255, 244, 214",
    shakeStrength: 0.92,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "redDwarf",
    nameJa: "赤色矮星",
    subtitleJa: "プロキシマ級小型恒星・軌道大乱れ",
    tier: 3,
    tierLabelJa: "恒星級：連星カオス・恒星大爆発",
    symbol: "✦",
    accentColor: "#fb7185",
    visualRadius: REAL_SOLAR_SUN_RADIUS * 0.6,
    relativeMass: 28.0,
    gravityGM: 540.0,
    survivesMoonImpact: true,
    explosionColorHex: "#ff4d6d",
    flashColorCss: "255, 205, 215",
    shakeStrength: 0.96,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "sunStar",
    nameJa: "太陽クラス恒星",
    subtitleJa: "G型主系列星・連星化＆恒星合体爆発",
    tier: 3,
    tierLabelJa: "恒星級：連星カオス・恒星合体",
    symbol: "☀",
    accentColor: "#fde047",
    visualRadius: REAL_SOLAR_SUN_RADIUS,
    relativeMass: 65.0,
    gravityGM: 1200.0,
    survivesMoonImpact: true,
    explosionColorHex: "#ffb703",
    flashColorCss: "255, 248, 200",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "blueSupergiant",
    nameJa: "青色超巨星",
    subtitleJa: "リゲル級超巨大恒星・超新星級大爆発",
    tier: 3,
    tierLabelJa: "恒星級：超巨大恒星・超新星爆発",
    symbol: "✸",
    accentColor: "#60a5fa",
    visualRadius: REAL_SOLAR_SUN_RADIUS * 1.6,
    relativeMass: 140.0,
    gravityGM: 2400.0,
    survivesMoonImpact: true,
    explosionColorHex: "#38bdf8",
    flashColorCss: "200, 238, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: true,
    isNeutronStar: false,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "neutronStar",
    nameJa: "中性子星",
    subtitleJa: "超高密度パルサー・磁気ビーム＆潮汐破壊",
    tier: 4,
    tierLabelJa: "極限天体：強重力潮汐破壊・吸い込み",
    symbol: "✧",
    accentColor: "#22d3ee",
    visualRadius: 0.12,
    relativeMass: 95.0,
    gravityGM: 1750.0,
    survivesMoonImpact: true,
    explosionColorHex: "#06b6d4",
    flashColorCss: "185, 250, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: false,
    isNeutronStar: true,
    isBlackHole: false,
    isIcyComet: false,
  },
  {
    id: "blackHole",
    nameJa: "ブラックホール",
    subtitleJa: "事象の地平線・太陽も惑星も完全吸収",
    tier: 4,
    tierLabelJa: "極限天体：事象の地平線・完全吸収",
    symbol: "◉",
    accentColor: "#c084fc",
    visualRadius: 0.3,
    relativeMass: 220.0,
    gravityGM: 3200.0,
    survivesMoonImpact: true,
    explosionColorHex: "#a855f7",
    flashColorCss: "238, 214, 255",
    shakeStrength: 1.0,
    craterAngleRad: 3.14,
    crackIntensity: 1.0,
    destroysEarth: true,
    isStar: false,
    isNeutronStar: false,
    isBlackHole: true,
    isIcyComet: false,
  },
];

export const IMPACTOR_MAP: Record<ImpactorId, ImpactorSpec> =
  IMPACTOR_SPECS.reduce(
    (acc, spec) => {
      acc[spec.id] = spec;
      return acc;
    },
    {} as Record<ImpactorId, ImpactorSpec>
  );

/**
 * リアル太陽系の全15天体のN体万有引力パラメータ定義です。
 * 1 AU = 13.5 シーン単位において、太陽 (GM = 1200) のまわりを各惑星がケプラー速度で公転し、
 * 衝突判定の半径（baseRadius）はリアル太陽系モードの表示半径（bodySizes.ts）と同じ値です。
 * 重い天体が近づくと軌道が乱れて惑星同士や太陽との衝突が発生します。
 */
export interface SolarTargetPhysicsSpec {
  id: SolarImpactTargetId;
  nameJa: string;
  symbol: string;
  /** シーン空間での万有引力定数 GM */
  gravityGM: number;
  /** 衝突判定の半径（シーン単位。リアル太陽系モードの表示半径と同じで、ズームでは変わりません） */
  baseRadius: number;
  /** 衛星の場合の母惑星ID（太陽を直接公転する天体は null） */
  parentId: SolarImpactTargetId | null;
  /** 軌道長半径（シーン単位：初期ケプラー速度の算出に使用） */
  semiMajorAxisScene: number;
  /** ターゲットリング・軌跡用の16進カラー */
  accentHex: number;
  /** ガス惑星または恒星か */
  isGasOrStar: boolean;
}

/** 木星4衛星の、木星の中心からの描画上の公転半径（シーン単位） */
function galileanOrbitScene(id: "io" | "europa" | "ganymede" | "callisto"): number {
  const moon = GALILEAN_MOONS.find((m) => m.id === id);
  const orbitFactor = moon ? moon.visualOrbitFactor : 2;
  return orbitFactor * realSolarDisplayRadius("jupiter");
}

export const SOLAR_TARGET_SPECS: SolarTargetPhysicsSpec[] = [
  {
    id: "sun",
    nameJa: "太陽",
    symbol: "☀",
    gravityGM: 1200.0,
    baseRadius: REAL_SOLAR_SUN_RADIUS,
    parentId: null,
    semiMajorAxisScene: 0,
    accentHex: 0xfbbf24,
    isGasOrStar: true,
  },
  {
    id: "mercury",
    nameJa: "水星",
    symbol: "☿",
    gravityGM: 5.5,
    baseRadius: realSolarDisplayRadius("mercury"),
    parentId: null,
    semiMajorAxisScene: 0.387099 * 13.5,
    accentHex: 0xcbd5e1,
    isGasOrStar: false,
  },
  {
    id: "venus",
    nameJa: "金星",
    symbol: "♀",
    gravityGM: 22.0,
    baseRadius: realSolarDisplayRadius("venus"),
    parentId: null,
    semiMajorAxisScene: 0.723332 * 13.5,
    accentHex: 0xfde68a,
    isGasOrStar: false,
  },
  {
    id: "earth",
    nameJa: "地球",
    symbol: "●",
    gravityGM: 28.0,
    baseRadius: realSolarDisplayRadius("earth"),
    parentId: null,
    semiMajorAxisScene: 1.0 * 13.5,
    accentHex: 0x38bdf8,
    isGasOrStar: false,
  },
  {
    id: "moon",
    nameJa: "月",
    symbol: "☾",
    gravityGM: 3.2,
    baseRadius: realSolarDisplayRadius("moon"),
    parentId: "earth",
    semiMajorAxisScene:
      SIMPLE_MODE_MOON_ORBIT_RADIUS * realSolarDisplayRadius("earth"),
    accentHex: 0xe2e8f0,
    isGasOrStar: false,
  },
  {
    id: "mars",
    nameJa: "火星",
    symbol: "♂",
    gravityGM: 11.0,
    baseRadius: realSolarDisplayRadius("mars"),
    parentId: null,
    semiMajorAxisScene: 1.523679 * 13.5,
    accentHex: 0xfb923c,
    isGasOrStar: false,
  },
  {
    id: "jupiter",
    nameJa: "木星",
    symbol: "♃",
    gravityGM: 165.0,
    baseRadius: realSolarDisplayRadius("jupiter"),
    parentId: null,
    semiMajorAxisScene: 5.2044 * 13.5,
    accentHex: 0xfdba74,
    isGasOrStar: true,
  },
  {
    id: "io",
    nameJa: "イオ",
    symbol: "◦",
    gravityGM: 2.4,
    baseRadius: realSolarDisplayRadius("io"),
    parentId: "jupiter",
    semiMajorAxisScene: galileanOrbitScene("io"),
    accentHex: 0xfacc15,
    isGasOrStar: false,
  },
  {
    id: "europa",
    nameJa: "エウロパ",
    symbol: "◦",
    gravityGM: 2.2,
    baseRadius: realSolarDisplayRadius("europa"),
    parentId: "jupiter",
    semiMajorAxisScene: galileanOrbitScene("europa"),
    accentHex: 0xbae6fd,
    isGasOrStar: false,
  },
  {
    id: "ganymede",
    nameJa: "ガニメデ",
    symbol: "◦",
    gravityGM: 3.0,
    baseRadius: realSolarDisplayRadius("ganymede"),
    parentId: "jupiter",
    semiMajorAxisScene: galileanOrbitScene("ganymede"),
    accentHex: 0xcbd5e1,
    isGasOrStar: false,
  },
  {
    id: "callisto",
    nameJa: "カリスト",
    symbol: "◦",
    gravityGM: 2.6,
    baseRadius: realSolarDisplayRadius("callisto"),
    parentId: "jupiter",
    semiMajorAxisScene: galileanOrbitScene("callisto"),
    accentHex: 0x94a3b8,
    isGasOrStar: false,
  },
  {
    id: "saturn",
    nameJa: "土星",
    symbol: "♄",
    gravityGM: 92.0,
    baseRadius: realSolarDisplayRadius("saturn"),
    parentId: null,
    semiMajorAxisScene: 9.5826 * 13.5,
    accentHex: 0xfcd34d,
    isGasOrStar: true,
  },
  {
    id: "uranus",
    nameJa: "天王星",
    symbol: "♅",
    gravityGM: 36.0,
    baseRadius: realSolarDisplayRadius("uranus"),
    parentId: null,
    semiMajorAxisScene: 19.2184 * 13.5,
    accentHex: 0x67e8f9,
    isGasOrStar: true,
  },
  {
    id: "neptune",
    nameJa: "海王星",
    symbol: "♆",
    gravityGM: 38.0,
    baseRadius: realSolarDisplayRadius("neptune"),
    parentId: null,
    semiMajorAxisScene: 30.1104 * 13.5,
    accentHex: 0x60a5fa,
    isGasOrStar: true,
  },
  {
    id: "pluto",
    nameJa: "冥王星",
    symbol: "♇",
    gravityGM: 4.5,
    baseRadius: realSolarDisplayRadius("pluto"),
    parentId: null,
    semiMajorAxisScene: 39.482 * 13.5,
    accentHex: 0xd8b4fe,
    isGasOrStar: false,
  },
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


export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

/** N体シミュレーション内の1つの太陽系天体の動的状態 */
export interface SolarNBodyEntry {
  id: SolarImpactTargetId;
  pos: Vec3Tuple;
  vel: Vec3Tuple;
  gravityGM: number;
  radius: number;
  parentId: SolarImpactTargetId | null;
  alive: boolean;
}

/**
 * N体シミュレーション内の投入天体（インパクター）の動的状態です。
 * 投入天体は何個でも同時に存在できるので、どの天体かを見分けるために一意の番号 uid を持たせます。
 */
export interface SolarImpactorEntry {
  /** 投入天体ごとの一意な番号（同じ種類を2個投げても別の番号になります） */
  uid: number;
  specId: ImpactorId;
  pos: Vec3Tuple;
  vel: Vec3Tuple;
  gravityGM: number;
  radius: number;
  alive: boolean;
}

/** 衝突の当事者を表す ID（"impactor" は投入天体、それ以外は太陽系天体） */
export type SolarCollisionPartyId = SolarImpactTargetId | "impactor";

/** 1フレームまたは予測ステップ内で発生した天体間衝突イベント */
export interface SolarCollisionEvent {
  /** 生き残った（またはより質量・密度の大きい主側）天体ID（"impactor" または太陽系天体ID） */
  primaryId: SolarCollisionPartyId;
  /** 衝突したもう一方の天体ID（"impactor" または太陽系天体ID） */
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
  /** 衝突が発生した3Dワールド座標（solarWorldGroup 座標） */
  contactPoint: Vec3Tuple;
  /** 主側天体の中心から衝突点へ向かう法線単位ベクトル */
  contactNormalOnPrimary: Vec3Tuple;
  /** 主側天体が消滅したか */
  primaryDestroyed: boolean;
  /** 副側天体が消滅したか */
  secondaryDestroyed: boolean;
}

/** 2つの天体の速度を、重さ（GM）の比で混ぜ合わせた「合体後の速度」を返します（運動量保存）。 */
function mergeVelocityByGM(
  velA: Vec3Tuple,
  gmA: number,
  velB: Vec3Tuple,
  gmB: number
): Vec3Tuple {
  const totalGM = Math.max(0.1, gmA + gmB);
  return {
    x: (velA.x * gmA + velB.x * gmB) / totalGM,
    y: (velA.y * gmA + velB.y * gmB) / totalGM,
    z: (velA.z * gmA + velB.z * gmB) / totalGM,
  };
}

/**
 * 現在のリアル太陽系15天体の位置スナップショットから、ケプラー公転速度を備えた
 * N体万有引力シミュレーションの初期状態を生成します。
 * 衝突半径は SOLAR_TARGET_SPECS の baseRadius（固定値）を使います。
 * 画面の表示半径はカメラのズームで変わるため、物理計算には持ち込みません。
 */
export function createSolarNBodyEntriesFromSnapshot(
  snapshot: ReadonlyArray<{
    id: SolarImpactTargetId;
    pos: Vec3Tuple;
  }>
): Record<SolarImpactTargetId, SolarNBodyEntry> {
  const entries = {} as Record<SolarImpactTargetId, SolarNBodyEntry>;
  const sunGM = SOLAR_TARGET_MAP.sun.gravityGM;

  // 1) まず太陽と9惑星の位置と公転速度を設定
  for (const item of snapshot) {
    const spec = SOLAR_TARGET_MAP[item.id];
    const radius = spec.baseRadius;
    if (spec.id === "sun") {
      entries.sun = {
        id: "sun",
        pos: { ...item.pos },
        vel: { x: 0, y: 0, z: 0 },
        gravityGM: spec.gravityGM,
        radius,
        parentId: null,
        alive: true,
      };
    } else if (spec.parentId === null) {
      const r = Math.hypot(item.pos.x, item.pos.y, item.pos.z);
      const a = Math.max(r * 0.6, spec.semiMajorAxisScene);
      // ビス・ビバの式 v = sqrt(GM * (2/r - 1/a)) で現在の楕円軌道上の公転速度を算出
      const speed =
        r > 0.2 ? Math.sqrt(Math.max(0.5, sunGM * (2 / r - 1 / a))) : 0;
      // latLonToVector3Tuple / keplerPositionAtEccentricAnomaly では z = -r*sin(λ) のため、
      // 黄経 λ が増える（反時計回り）方向の接線ベクトルは (-sin λ, 0, -cos λ) = (z / r, 0, -x / r) です。
      const horizR = Math.hypot(item.pos.x, item.pos.z) || 1;
      const tx = item.pos.z / horizR;
      const tz = -item.pos.x / horizR;
      entries[spec.id] = {
        id: spec.id,
        pos: { ...item.pos },
        vel: { x: tx * speed, y: 0, z: tz * speed },
        gravityGM: spec.gravityGM,
        radius,
        parentId: null,
        alive: true,
      };
    }
  }

  // 2) 次に衛星（月・イオ・エウロパ・ガニメデ・カリスト）の速度を「母惑星の速度＋母惑星周りの公転速度」で設定
  for (const item of snapshot) {
    const spec = SOLAR_TARGET_MAP[item.id];
    if (spec.parentId === null) continue;
    const host = entries[spec.parentId];
    const radius = spec.baseRadius;
    if (!host) {
      entries[spec.id] = {
        id: spec.id,
        pos: { ...item.pos },
        vel: { x: 0, y: 0, z: 0 },
        gravityGM: spec.gravityGM,
        radius,
        parentId: spec.parentId,
        alive: true,
      };
      continue;
    }
    const relX = item.pos.x - host.pos.x;
    const relY = item.pos.y - host.pos.y;
    const relZ = item.pos.z - host.pos.z;
    const relDist = Math.max(0.2, Math.hypot(relX, relY, relZ));
    const satSpeed = Math.sqrt(host.gravityGM / relDist);
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
      radius,
      parentId: spec.parentId,
      alive: true,
    };
  }

  return entries;
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

/**
 * 太陽系全15天体と投入天体（何個でも）の相互万有引力加速度を一括計算します。
 * 戻り値の impactorAcc は、引数 impactors と同じ順番に並んだ加速度の配列です。
 */
export function computeSolarNBodyAccelerations(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  impactors: ReadonlyArray<SolarImpactorEntry>
): {
  bodyAcc: Record<SolarImpactTargetId, Vec3Tuple>;
  impactorAcc: Vec3Tuple[];
} {
  const bodyAcc = {} as Record<SolarImpactTargetId, Vec3Tuple>;
  for (const spec of SOLAR_TARGET_SPECS) {
    bodyAcc[spec.id] = { x: 0, y: 0, z: 0 };
  }
  const impactorAcc: Vec3Tuple[] = [];
  for (let k = 0; k < impactors.length; k++) {
    impactorAcc.push({ x: 0, y: 0, z: 0 });
  }

  const ids = SOLAR_TARGET_SPECS.map((s) => s.id);
  const count = ids.length;

  // 1) 太陽系天体同士の相互万有引力
  for (let i = 0; i < count; i++) {
    const a = bodies[ids[i]];
    if (!a || !a.alive) continue;

    for (let j = i + 1; j < count; j++) {
      const b = bodies[ids[j]];
      if (!b || !b.alive) continue;

      // 衛星同士（イオとエウロパ等）は視覚的に拡大された軌道半径による過大な摂動を避け、重力は母惑星＋インパクターを主とします
      if (a.parentId !== null && b.parentId !== null && a.parentId === b.parentId) {
        continue;
      }

      // 衛星に対する太陽の引力は、母惑星のヒル球内にいる間は母惑星中心の加速度と揃えて拡大軌道の潮汐崩壊を防ぎます
      if (
        (a.id === "sun" && b.parentId !== null) ||
        (b.id === "sun" && a.parentId !== null)
      ) {
        const sat = a.id === "sun" ? b : a;
        const sun = a.id === "sun" ? a : b;
        const host = sat.parentId ? bodies[sat.parentId] : null;
        if (host && host.alive) {
          const dxSH = sun.pos.x - host.pos.x;
          const dySH = sun.pos.y - host.pos.y;
          const dzSH = sun.pos.z - host.pos.z;
          const r2SH = dxSH * dxSH + dySH * dySH + dzSH * dzSH + 0.5;
          const invR3SH = 1 / (r2SH * Math.sqrt(r2SH));
          bodyAcc[sat.id].x += sun.gravityGM * dxSH * invR3SH;
          bodyAcc[sat.id].y += sun.gravityGM * dySH * invR3SH;
          bodyAcc[sat.id].z += sun.gravityGM * dzSH * invR3SH;
          continue;
        }
      }

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - a.pos.z;
      const softening = a.parentId === b.id || b.parentId === a.id ? 0.08 : 0.35;
      const r2 = dx * dx + dy * dy + dz * dz + softening;
      const invR3 = 1 / (r2 * Math.sqrt(r2));

      bodyAcc[a.id].x += b.gravityGM * dx * invR3;
      bodyAcc[a.id].y += b.gravityGM * dy * invR3;
      bodyAcc[a.id].z += b.gravityGM * dz * invR3;

      bodyAcc[b.id].x -= a.gravityGM * dx * invR3;
      bodyAcc[b.id].y -= a.gravityGM * dy * invR3;
      bodyAcc[b.id].z -= a.gravityGM * dz * invR3;
    }
  }

  // 2) 投入天体と太陽系全15天体の相互万有引力
  for (let k = 0; k < impactors.length; k++) {
    const imp = impactors[k];
    if (!imp.alive) continue;
    for (let i = 0; i < count; i++) {
      const b = bodies[ids[i]];
      if (!b || !b.alive) continue;

      const dx = b.pos.x - imp.pos.x;
      const dy = b.pos.y - imp.pos.y;
      const dz = b.pos.z - imp.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz + 0.16;
      const invR3 = 1 / (r2 * Math.sqrt(r2));

      impactorAcc[k].x += b.gravityGM * dx * invR3;
      impactorAcc[k].y += b.gravityGM * dy * invR3;
      impactorAcc[k].z += b.gravityGM * dz * invR3;

      bodyAcc[b.id].x -= imp.gravityGM * dx * invR3;
      bodyAcc[b.id].y -= imp.gravityGM * dy * invR3;
      bodyAcc[b.id].z -= imp.gravityGM * dz * invR3;
    }
  }

  // 3) 投入天体同士の相互万有引力（2個目以降の天体も、先に置いた天体に引き寄せられます）
  for (let k = 0; k < impactors.length; k++) {
    const a = impactors[k];
    if (!a.alive) continue;
    for (let m = k + 1; m < impactors.length; m++) {
      const b = impactors[m];
      if (!b.alive) continue;

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - a.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz + 0.16;
      const invR3 = 1 / (r2 * Math.sqrt(r2));

      impactorAcc[k].x += b.gravityGM * dx * invR3;
      impactorAcc[k].y += b.gravityGM * dy * invR3;
      impactorAcc[k].z += b.gravityGM * dz * invR3;

      impactorAcc[m].x -= a.gravityGM * dx * invR3;
      impactorAcc[m].y -= a.gravityGM * dy * invR3;
      impactorAcc[m].z -= a.gravityGM * dz * invR3;
    }
  }

  return { bodyAcc, impactorAcc };
}

/**
 * 速度ベルレ（シンプレクティック）法で太陽系全15天体＋投入天体のN体運動を 1 ステップ進めます。
 * 「位置を進める → 新しい位置で加速度を計算し直す → 新旧の加速度の平均で速度を進める」の順に計算します。
 */
export function stepSolarNBodyGravity(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  impactors: ReadonlyArray<SolarImpactorEntry>,
  dt: number
): void {
  const a0 = computeSolarNBodyAccelerations(bodies, impactors);
  const halfDt2 = 0.5 * dt * dt;
  const halfDt = 0.5 * dt;

  for (const spec of SOLAR_TARGET_SPECS) {
    const b = bodies[spec.id];
    if (!b || !b.alive) continue;
    const acc = a0.bodyAcc[spec.id];
    b.pos.x += b.vel.x * dt + acc.x * halfDt2;
    b.pos.y += b.vel.y * dt + acc.y * halfDt2;
    b.pos.z += b.vel.z * dt + acc.z * halfDt2;
  }

  for (let k = 0; k < impactors.length; k++) {
    const imp = impactors[k];
    if (!imp.alive) continue;
    const acc = a0.impactorAcc[k];
    imp.pos.x += imp.vel.x * dt + acc.x * halfDt2;
    imp.pos.y += imp.vel.y * dt + acc.y * halfDt2;
    imp.pos.z += imp.vel.z * dt + acc.z * halfDt2;
  }

  const a1 = computeSolarNBodyAccelerations(bodies, impactors);

  for (const spec of SOLAR_TARGET_SPECS) {
    const b = bodies[spec.id];
    if (!b || !b.alive) continue;
    const acc0 = a0.bodyAcc[spec.id];
    const acc1 = a1.bodyAcc[spec.id];
    b.vel.x += (acc0.x + acc1.x) * halfDt;
    b.vel.y += (acc0.y + acc1.y) * halfDt;
    b.vel.z += (acc0.z + acc1.z) * halfDt;
  }

  for (let k = 0; k < impactors.length; k++) {
    const imp = impactors[k];
    if (!imp.alive) continue;
    const acc0 = a0.impactorAcc[k];
    const acc1 = a1.impactorAcc[k];
    imp.vel.x += (acc0.x + acc1.x) * halfDt;
    imp.vel.y += (acc0.y + acc1.y) * halfDt;
    imp.vel.z += (acc0.z + acc1.z) * halfDt;
  }
}

/**
 * 投入天体同士がぶつかったときに、どちらが生き残るかを決めるための「強さ」です。
 * ブラックホール ＞ 中性子星 ＞ その他 の順で、同じ強さなら重い（GM が大きい）ほうが勝ちます。
 */
function impactorDominanceRank(impactor: SolarImpactorEntry): number {
  const spec = IMPACTOR_MAP[impactor.specId];
  if (spec.isBlackHole) return 2;
  if (spec.isNeutronStar) return 1;
  return 0;
}

/**
 * すべての生存天体ペアの衝突を検出し、運動量保存と消滅・吸収・貫通を解決します。
 * 対象は次の3種類です。
 * 1. 投入天体 vs 太陽系天体
 * 2. 投入天体 vs 投入天体（同時にいくつも置いた天体同士）
 * 3. 太陽系天体 vs 太陽系天体（軌道が乱れてぶつかった場合）
 */
export function resolveSolarNBodyCollisions(
  bodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  impactors: ReadonlyArray<SolarImpactorEntry>
): SolarCollisionEvent[] {
  const events: SolarCollisionEvent[] = [];
  const ids = SOLAR_TARGET_SPECS.map((s) => s.id);

  // 1) 投入天体 vs 太陽系15天体
  for (const impactor of impactors) {
    if (!impactor.alive) continue;
    const impSpec = IMPACTOR_MAP[impactor.specId];

    for (const id of ids) {
      const target = bodies[id];
      if (!target || !target.alive) continue;

      const dx = impactor.pos.x - target.pos.x;
      const dy = impactor.pos.y - target.pos.y;
      const dz = impactor.pos.z - target.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      const hitR = target.radius + impactor.radius * 0.72;
      if (dist > hitR) continue;

      const inv = 1 / Math.max(1e-5, dist);
      const nx = dx * inv;
      const ny = dy * inv;
      const nz = dz * inv;

      // 極限天体（ブラックホール・中性子星）や、相手よりはるかに重い天体は相手を飲み込み／粉砕して進み続けます
      const impactorDominates =
        impSpec.isBlackHole ||
        impSpec.isNeutronStar ||
        impactor.gravityGM >= target.gravityGM * 1.15;

      const mergedVel = mergeVelocityByGM(
        impactor.vel,
        impactor.gravityGM,
        target.vel,
        target.gravityGM
      );

      if (impactorDominates) {
        // 太陽系天体側が粉砕・吸収されて消滅し、投入天体が運動量を合成して存続
        target.alive = false;
        impactor.vel = mergedVel;
        impactor.gravityGM += target.gravityGM * 0.35;
        events.push({
          primaryId: "impactor",
          secondaryId: id,
          primaryImpactorUid: impactor.uid,
          secondaryImpactorUid: null,
          effectSpecId: impactor.specId,
          contactPoint: { ...target.pos },
          contactNormalOnPrimary: { x: -nx, y: -ny, z: -nz },
          primaryDestroyed: false,
          secondaryDestroyed: true,
        });
        continue;
      }

      // 太陽系天体側が生き残る（ただし岩石惑星を粉砕できる天体なら相手も消滅）
      const destroysTargetToo =
        impSpec.destroysEarth &&
        !SOLAR_TARGET_MAP[id].isGasOrStar &&
        id !== "sun";
      target.vel = mergedVel;
      if (destroysTargetToo) {
        target.alive = false;
      }
      // 月などの小型天体に月サイズ以上が当たった場合は貫通
      const piercesSmallMoon =
        impSpec.survivesMoonImpact && target.gravityGM <= 6.0;
      if (!piercesSmallMoon) {
        impactor.alive = false;
      } else {
        target.alive = false;
        impactor.vel = mergedVel;
      }
      events.push({
        primaryId: id,
        secondaryId: "impactor",
        primaryImpactorUid: null,
        secondaryImpactorUid: impactor.uid,
        effectSpecId: impactor.specId,
        contactPoint: {
          x: target.pos.x + nx * target.radius,
          y: target.pos.y + ny * target.radius,
          z: target.pos.z + nz * target.radius,
        },
        contactNormalOnPrimary: { x: nx, y: ny, z: nz },
        primaryDestroyed: !target.alive,
        secondaryDestroyed: !impactor.alive,
      });
      // この投入天体が消えたら、ほかの太陽系天体との判定は不要です
      if (!impactor.alive) break;
    }
  }

  // 2) 投入天体 vs 投入天体（強いほうが弱いほうを吸収して合体します）
  for (let k = 0; k < impactors.length; k++) {
    const a = impactors[k];
    if (!a.alive) continue;
    for (let m = k + 1; m < impactors.length; m++) {
      const b = impactors[m];
      if (!b.alive) continue;

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - a.pos.z;
      const dist = Math.hypot(dx, dy, dz);
      const hitR = (a.radius + b.radius) * 0.8;
      if (dist > hitR) continue;

      const rankA = impactorDominanceRank(a);
      const rankB = impactorDominanceRank(b);
      let primary = a;
      if (rankB > rankA || (rankB === rankA && b.gravityGM > a.gravityGM)) {
        primary = b;
      }
      const secondary = primary === a ? b : a;

      const inv = 1 / Math.max(1e-5, dist);
      // 主側の中心から副側へ向かう向きを法線にします
      const sign = primary === a ? 1 : -1;
      const nx = dx * inv * sign;
      const ny = dy * inv * sign;
      const nz = dz * inv * sign;

      primary.vel = mergeVelocityByGM(
        primary.vel,
        primary.gravityGM,
        secondary.vel,
        secondary.gravityGM
      );
      primary.gravityGM += secondary.gravityGM * 0.35;
      secondary.alive = false;

      events.push({
        primaryId: "impactor",
        secondaryId: "impactor",
        primaryImpactorUid: primary.uid,
        secondaryImpactorUid: secondary.uid,
        effectSpecId: primary.specId,
        contactPoint: {
          x: primary.pos.x + nx * primary.radius,
          y: primary.pos.y + ny * primary.radius,
          z: primary.pos.z + nz * primary.radius,
        },
        contactNormalOnPrimary: { x: nx, y: ny, z: nz },
        primaryDestroyed: false,
        secondaryDestroyed: true,
      });

      // a が吸収されたら、a と残りの天体の判定は不要です
      if (!a.alive) break;
    }
  }

  // 3) 太陽系15天体同士の相互衝突（軌道が乱れて惑星同士・衛星と惑星・惑星と太陽がぶつかった場合）
  for (let i = 0; i < ids.length; i++) {
    const a = bodies[ids[i]];
    if (!a || !a.alive) continue;

    for (let j = i + 1; j < ids.length; j++) {
      const b = bodies[ids[j]];
      if (!b || !b.alive) continue;

      const dx = b.pos.x - a.pos.x;
      const dy = b.pos.y - a.pos.y;
      const dz = b.pos.z - a.pos.z;
      const dist = Math.hypot(dx, dy, dz);

      // 衛星と母惑星の間は、視覚拡大された公転半径と干渉しないよう母惑星半径の 0.88 倍を衝突閾値とします
      const isHostSatellitePair = a.parentId === b.id || b.parentId === a.id;
      const hitR = isHostSatellitePair
        ? Math.max(a.radius, b.radius) * 0.88
        : (a.radius + b.radius) * 0.85;
      if (dist > hitR) continue;

      const primary = a.gravityGM >= b.gravityGM ? a : b;
      const secondary = primary === a ? b : a;
      const pDx = secondary.pos.x - primary.pos.x;
      const pDy = secondary.pos.y - primary.pos.y;
      const pDz = secondary.pos.z - primary.pos.z;
      const inv = 1 / Math.max(1e-5, dist);
      const nx = pDx * inv;
      const ny = pDy * inv;
      const nz = pDz * inv;

      primary.vel = mergeVelocityByGM(
        primary.vel,
        primary.gravityGM,
        secondary.vel,
        secondary.gravityGM
      );
      primary.gravityGM += secondary.gravityGM * 0.45;
      secondary.alive = false;

      events.push({
        primaryId: primary.id,
        secondaryId: secondary.id,
        primaryImpactorUid: null,
        secondaryImpactorUid: null,
        effectSpecId: null,
        contactPoint: {
          x: primary.pos.x + nx * primary.radius,
          y: primary.pos.y + ny * primary.radius,
          z: primary.pos.z + nz * primary.radius,
        },
        contactNormalOnPrimary: { x: nx, y: ny, z: nz },
        primaryDestroyed: false,
        secondaryDestroyed: true,
      });

      // a が吸収されたら、a と残りの天体の判定は不要です
      if (!a.alive) break;
    }
  }

  return events;
}

export interface SolarNBodyPredictionResult {
  /** これから投げる投入天体の予測軌道点列 */
  impactorPath: Vec3Tuple[];
  /** 軌道が大きく乱れる太陽系天体の予測軌跡マップ */
  perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>>;
  /** 予測中に衝突が発生する太陽系天体と衝突座標・法線のリスト */
  hitTargets: Array<{
    id: SolarImpactTargetId;
    center: Vec3Tuple;
    normal: Vec3Tuple;
    radius: number;
  }>;
}

/** 予測計算の中で「これから投げる天体」を見分けるための uid（実際の天体は 0 以上の番号を使います） */
const PREDICTION_IMPACTOR_UID = -1;

/**
 * リアル太陽系全15天体＋投入天体のN体相互万有引力を先読み積分し、
 * これから投げる天体の軌道、引き寄せられて軌道が乱れる惑星たちの軌跡、および衝突するすべての太陽系天体を予測します。
 *
 * startBodies と existingImpactors は「今この瞬間の状態」です。
 * 中で複製してから計算するので、渡した本物の状態は書き換わりません。
 * existingImpactors にすでに飛んでいる天体を渡すと、それらの重力や衝突も予測に含まれます。
 */
export function predictSolarNBodyTrajectory(
  startBodies: Record<SolarImpactTargetId, SolarNBodyEntry>,
  existingImpactors: ReadonlyArray<SolarImpactorEntry>,
  impactorId: ImpactorId,
  spawnPos: Vec3Tuple,
  launchVel: Vec3Tuple,
  maxSteps = 160,
  stepDt = 0.036
): SolarNBodyPredictionResult {
  const spec = IMPACTOR_MAP[impactorId];
  const bodies = cloneSolarNBodyEntries(startBodies);

  const newImpactor: SolarImpactorEntry = {
    uid: PREDICTION_IMPACTOR_UID,
    specId: impactorId,
    pos: { ...spawnPos },
    vel: { ...launchVel },
    gravityGM: spec.gravityGM,
    radius: spec.visualRadius,
    alive: true,
  };
  const impactors: SolarImpactorEntry[] = [];
  for (const existing of existingImpactors) {
    if (existing.alive) {
      impactors.push(cloneImpactorEntry(existing));
    }
  }
  impactors.push(newImpactor);

  const impactorPath: Vec3Tuple[] = [{ ...newImpactor.pos }];
  const allBodyPaths = {} as Record<SolarImpactTargetId, Vec3Tuple[]>;
  for (const s of SOLAR_TARGET_SPECS) {
    const b = bodies[s.id];
    if (b && b.alive) {
      allBodyPaths[s.id] = [{ ...b.pos }];
    }
  }

  const hitMap = new Map<
    SolarImpactTargetId,
    {
      id: SolarImpactTargetId;
      center: Vec3Tuple;
      normal: Vec3Tuple;
      radius: number;
    }
  >();

  for (let step = 0; step < maxSteps; step++) {
    stepSolarNBodyGravity(bodies, impactors, stepDt);
    if (newImpactor.alive) {
      impactorPath.push({ ...newImpactor.pos });
    }
    for (const s of SOLAR_TARGET_SPECS) {
      const b = bodies[s.id];
      if (b && b.alive && allBodyPaths[s.id]) {
        allBodyPaths[s.id].push({ ...b.pos });
      }
    }

    const events = resolveSolarNBodyCollisions(bodies, impactors);
    for (const ev of events) {
      if (ev.primaryId !== "impactor" && !hitMap.has(ev.primaryId)) {
        const b = bodies[ev.primaryId];
        hitMap.set(ev.primaryId, {
          id: ev.primaryId,
          center: { ...b.pos },
          normal: { ...ev.contactNormalOnPrimary },
          radius: b.radius,
        });
      }
      if (ev.secondaryId !== "impactor" && !hitMap.has(ev.secondaryId)) {
        const b = bodies[ev.secondaryId];
        hitMap.set(ev.secondaryId, {
          id: ev.secondaryId,
          center: { ...b.pos },
          normal: {
            x: -ev.contactNormalOnPrimary.x,
            y: -ev.contactNormalOnPrimary.y,
            z: -ev.contactNormalOnPrimary.z,
          },
          radius: b.radius,
        });
      }
    }

    // 小天体・惑星級は、これから投げる天体が消えた時点で予測を打ち切ります
    if (!newImpactor.alive && spec.tier <= 2) {
      break;
    }
  }

  // 重い天体（木星・恒星・中性子星・ブラックホール）を投げ込むときに軌道が大きく曲がる天体の軌跡を抽出
  const perturbedPaths: Partial<Record<SolarImpactTargetId, Vec3Tuple[]>> = {};
  if (spec.gravityGM >= 15.0) {
    for (const s of SOLAR_TARGET_SPECS) {
      if (s.parentId !== null) continue;
      const path = allBodyPaths[s.id];
      if (path && path.length >= 6) {
        perturbedPaths[s.id] = path;
      }
    }
  }

  return {
    impactorPath,
    perturbedPaths,
    hitTargets: Array.from(hitMap.values()),
  };
}
