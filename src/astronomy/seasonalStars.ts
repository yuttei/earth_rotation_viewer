import { CelestialBodyId } from "../data/celestialBodies";
import { degToRad } from "./calculations";
import {
  ZodiacStarPoint,
  eclipticToWorldUnitVector,
  equatorialToEclipticDeg,
} from "./zodiac";

/**
 * 四季の代表的な星座・アステリズム（春の大三角・春の大曲線・夏の大三角・秋の四辺形・冬の大三角・冬のダイヤモンド）
 * および主要1等星（シリウス・ベテルギウス・ベガ・アルタイル・デネブ・アークトゥルス等）の
 * IAU J2000.0 実座標・等級・距離（光年）・表面温度カラーを定義するモジュールです。
 */

export type SeasonTag = "spring" | "summer" | "autumn" | "winter";

export type FeaturedStarId =
  | "sirius"
  | "betelgeuse"
  | "procyon"
  | "rigel"
  | "aldebaran"
  | "capella"
  | "pollux"
  | "arcturus"
  | "spica"
  | "denebola"
  | "vega"
  | "altair"
  | "deneb"
  | "fomalhaut"
  | "alphaCentauri";

export interface FeaturedBrightStar {
  id: FeaturedStarId;
  /** 詳細解説カード用ID */
  bodyId: CelestialBodyId;
  /** 日本語名 */
  nameJa: string;
  /** 英語名 */
  nameEn: string;
  /** 所属する星座名 */
  constellationJa: string;
  /** 季節カテゴリ */
  season: SeasonTag;
  /** 赤経（時間：J2000.0） */
  raHours: number;
  /** 赤緯（度：J2000.0） */
  decDeg: number;
  /** 黄経（度：J2000.0） */
  lonDeg: number;
  /** 黄緯（度：J2000.0） */
  latDeg: number;
  /** 見かけの等級（小さいほど明るい） */
  mag: number;
  /** 地球からの距離（光年） */
  distanceLy: number;
  /** スペクトル型に応じた恒星カラー（HEX） */
  colorHex: string;
  /** 天球上の単位方向ベクトル [x, y, z]（黄道座標系・Three.js ワールド基準） */
  unitDir: [number, number, number];
}

export interface SeasonalConstellation {
  id: string;
  nameJa: string;
  season: SeasonTag;
  labelPoint: { lonDeg: number; latDeg: number };
  stars: Array<ZodiacStarPoint & { colorHex?: string }>;
  edges: Array<[number, number]>;
}

export interface SeasonalAsterism {
  id:
    | "springTriangle"
    | "springCurve"
    | "summerTriangle"
    | "autumnSquare"
    | "winterTriangle"
    | "winterDiamond";
  nameJa: string;
  season: SeasonTag;
  colorHex: string;
  dashed: boolean;
  labelPoint: { lonDeg: number; latDeg: number };
  /** 頂点（J2000.0 黄道座標の配列） */
  vertices: Array<{ lonDeg: number; latDeg: number; starId?: FeaturedStarId }>;
  /** 頂点を結ぶ辺のインデックス対 */
  edges: Array<[number, number]>;
}

interface RawStarInput {
  raHours: number;
  decDeg: number;
  mag: number;
  nameJa?: string;
  colorHex?: string;
}

function buildSeasonalStars(
  raw: RawStarInput[]
): Array<ZodiacStarPoint & { colorHex?: string }> {
  return raw.map((s) => {
    const ec = equatorialToEclipticDeg(s.raHours, s.decDeg);
    return {
      lonDeg: ec.lonDeg,
      latDeg: ec.latDeg,
      mag: s.mag,
      nameJa: s.nameJa,
      colorHex: s.colorHex,
    };
  });
}

function makeFeaturedStar(spec: {
  id: FeaturedStarId;
  nameJa: string;
  nameEn: string;
  constellationJa: string;
  season: SeasonTag;
  raHours: number;
  decDeg: number;
  mag: number;
  distanceLy: number;
  colorHex: string;
}): FeaturedBrightStar {
  const ec = equatorialToEclipticDeg(spec.raHours, spec.decDeg);
  return {
    ...spec,
    bodyId: spec.id,
    lonDeg: ec.lonDeg,
    latDeg: ec.latDeg,
    unitDir: eclipticToWorldUnitVector(ec.lonDeg, ec.latDeg),
  };
}

/**
 * 地球の夜空を彩る代表的な1等星および最寄り恒星系（全15星・IAU J2000.0 実座標）です。
 */
export const FEATURED_BRIGHT_STARS: FeaturedBrightStar[] = [
  makeFeaturedStar({
    id: "sirius",
    nameJa: "シリウス",
    nameEn: "Sirius",
    constellationJa: "おおいぬ座",
    season: "winter",
    raHours: 6.7525,
    decDeg: -16.7161,
    mag: -1.46,
    distanceLy: 8.6,
    colorHex: "#bae6fd",
  }),
  makeFeaturedStar({
    id: "betelgeuse",
    nameJa: "ベテルギウス",
    nameEn: "Betelgeuse",
    constellationJa: "オリオン座",
    season: "winter",
    raHours: 5.9195,
    decDeg: 7.4071,
    mag: 0.5,
    distanceLy: 550,
    colorHex: "#fb923c",
  }),
  makeFeaturedStar({
    id: "procyon",
    nameJa: "プロキオン",
    nameEn: "Procyon",
    constellationJa: "こいぬ座",
    season: "winter",
    raHours: 7.655,
    decDeg: 5.225,
    mag: 0.34,
    distanceLy: 11.5,
    colorHex: "#fef9c3",
  }),
  makeFeaturedStar({
    id: "rigel",
    nameJa: "リゲル",
    nameEn: "Rigel",
    constellationJa: "オリオン座",
    season: "winter",
    raHours: 5.2423,
    decDeg: -8.2016,
    mag: 0.13,
    distanceLy: 860,
    colorHex: "#93c5fd",
  }),
  makeFeaturedStar({
    id: "aldebaran",
    nameJa: "アルデバラン",
    nameEn: "Aldebaran",
    constellationJa: "おうし座",
    season: "winter",
    raHours: 4.5987,
    decDeg: 16.5093,
    mag: 0.86,
    distanceLy: 65,
    colorHex: "#fdba74",
  }),
  makeFeaturedStar({
    id: "capella",
    nameJa: "カペラ",
    nameEn: "Capella",
    constellationJa: "ぎょしゃ座",
    season: "winter",
    raHours: 5.2782,
    decDeg: 45.998,
    mag: 0.08,
    distanceLy: 42.9,
    colorHex: "#fde68a",
  }),
  makeFeaturedStar({
    id: "pollux",
    nameJa: "ポルックス",
    nameEn: "Pollux",
    constellationJa: "ふたご座",
    season: "winter",
    raHours: 7.7553,
    decDeg: 28.0262,
    mag: 1.14,
    distanceLy: 33.8,
    colorHex: "#fed7aa",
  }),
  makeFeaturedStar({
    id: "arcturus",
    nameJa: "アークトゥルス",
    nameEn: "Arcturus",
    constellationJa: "うしかい座",
    season: "spring",
    raHours: 14.261,
    decDeg: 19.1824,
    mag: -0.05,
    distanceLy: 36.7,
    colorHex: "#fdba74",
  }),
  makeFeaturedStar({
    id: "spica",
    nameJa: "スピカ",
    nameEn: "Spica",
    constellationJa: "おとめ座",
    season: "spring",
    raHours: 13.4199,
    decDeg: -11.1613,
    mag: 0.97,
    distanceLy: 250,
    colorHex: "#93c5fd",
  }),
  makeFeaturedStar({
    id: "denebola",
    nameJa: "デネボラ",
    nameEn: "Denebola",
    constellationJa: "しし座",
    season: "spring",
    raHours: 11.8177,
    decDeg: 14.5721,
    mag: 2.14,
    distanceLy: 35.9,
    colorHex: "#e0f2fe",
  }),
  makeFeaturedStar({
    id: "vega",
    nameJa: "ベガ",
    nameEn: "Vega",
    constellationJa: "こと座",
    season: "summer",
    raHours: 18.6156,
    decDeg: 38.7837,
    mag: 0.03,
    distanceLy: 25.0,
    colorHex: "#bfdbfe",
  }),
  makeFeaturedStar({
    id: "altair",
    nameJa: "アルタイル",
    nameEn: "Altair",
    constellationJa: "わし座",
    season: "summer",
    raHours: 19.8464,
    decDeg: 8.8683,
    mag: 0.76,
    distanceLy: 16.7,
    colorHex: "#f0f9ff",
  }),
  makeFeaturedStar({
    id: "deneb",
    nameJa: "デネブ",
    nameEn: "Deneb",
    constellationJa: "はくちょう座",
    season: "summer",
    raHours: 20.6905,
    decDeg: 45.2803,
    mag: 1.25,
    distanceLy: 2600,
    colorHex: "#dbeafe",
  }),
  makeFeaturedStar({
    id: "fomalhaut",
    nameJa: "フォーマルハウト",
    nameEn: "Fomalhaut",
    constellationJa: "みなみのうお座",
    season: "autumn",
    raHours: 22.9608,
    decDeg: -29.6222,
    mag: 1.16,
    distanceLy: 25.1,
    colorHex: "#e0f2fe",
  }),
  makeFeaturedStar({
    id: "alphaCentauri",
    nameJa: "アルファ・ケンタウリ",
    nameEn: "Alpha Centauri",
    constellationJa: "ケンタウルス座",
    season: "spring",
    raHours: 14.6601,
    decDeg: -60.834,
    mag: -0.27,
    distanceLy: 4.37,
    colorHex: "#fef08a",
  }),
];

export const FEATURED_STAR_MAP: Record<FeaturedStarId, FeaturedBrightStar> =
  FEATURED_BRIGHT_STARS.reduce(
    (acc, star) => {
      acc[star.id] = star;
      return acc;
    },
    {} as Record<FeaturedStarId, FeaturedBrightStar>
  );

/**
 * 四季の代表的な12星座（黄道13星座に含まれないオリオン座・おおいぬ座・こと座・はくちょう座・ペガスス座・北斗七星など）です。
 */
export const SEASONAL_CONSTELLATIONS: SeasonalConstellation[] = [
  // === 春 ===
  {
    id: "ursaMajor",
    nameJa: "北斗七星 (おおぐま座)",
    season: "spring",
    labelPoint: equatorialToEclipticDeg(12.25, 59.5),
    stars: buildSeasonalStars([
      { raHours: 11.062, decDeg: 61.75, mag: 1.79, nameJa: "ドゥーベ", colorHex: "#fde68a" }, // 0: α UMa
      { raHours: 11.031, decDeg: 56.38, mag: 2.37, nameJa: "メラク", colorHex: "#e0f2fe" }, // 1: β UMa
      { raHours: 11.897, decDeg: 53.69, mag: 2.44, nameJa: "フェクダ", colorHex: "#e0f2fe" }, // 2: γ UMa
      { raHours: 12.257, decDeg: 57.03, mag: 3.31, nameJa: "メグレズ", colorHex: "#e0f2fe" }, // 3: δ UMa
      { raHours: 12.900, decDeg: 55.96, mag: 1.77, nameJa: "アリオト", colorHex: "#e0f2fe" }, // 4: ε UMa
      { raHours: 13.399, decDeg: 54.93, mag: 2.27, nameJa: "ミザール", colorHex: "#e0f2fe" }, // 5: ζ UMa
      { raHours: 13.792, decDeg: 49.31, mag: 1.86, nameJa: "アルカイド", colorHex: "#bae6fd" }, // 6: η UMa
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
      [5, 6],
    ],
  },
  {
    id: "bootes",
    nameJa: "うしかい座",
    season: "spring",
    labelPoint: equatorialToEclipticDeg(14.65, 31.5),
    stars: buildSeasonalStars([
      { raHours: 14.261, decDeg: 19.18, mag: -0.05, nameJa: "アークトゥルス", colorHex: "#fdba74" }, // 0: α Boo
      { raHours: 13.911, decDeg: 18.4, mag: 2.68, nameJa: "ムフリド" }, // 1: η Boo
      { raHours: 14.75, decDeg: 27.07, mag: 2.35, nameJa: "イザール" }, // 2: ε Boo
      { raHours: 15.258, decDeg: 33.31, mag: 3.49 }, // 3: δ Boo
      { raHours: 15.032, decDeg: 40.39, mag: 3.49, nameJa: "ネクカル" }, // 4: β Boo
      { raHours: 14.535, decDeg: 38.31, mag: 3.03, nameJa: "セギヌス" }, // 5: γ Boo
      { raHours: 14.531, decDeg: 30.37, mag: 3.57 }, // 6: ρ Boo
    ]),
    edges: [
      [0, 1],
      [0, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 0],
    ],
  },

  // === 夏 ===
  {
    id: "lyra",
    nameJa: "こと座",
    season: "summer",
    labelPoint: equatorialToEclipticDeg(18.85, 35.8),
    stars: buildSeasonalStars([
      { raHours: 18.616, decDeg: 38.78, mag: 0.03, nameJa: "ベガ", colorHex: "#bfdbfe" }, // 0: α Lyr
      { raHours: 18.74, decDeg: 39.67, mag: 4.6 }, // 1: ε Lyr
      { raHours: 18.746, decDeg: 37.6, mag: 4.36 }, // 2: ζ Lyr
      { raHours: 18.908, decDeg: 36.9, mag: 4.3 }, // 3: δ Lyr
      { raHours: 18.982, decDeg: 32.69, mag: 3.24, nameJa: "スラファト" }, // 4: γ Lyr
      { raHours: 18.835, decDeg: 33.36, mag: 3.52, nameJa: "シェリアク" }, // 5: β Lyr
    ]),
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 2],
    ],
  },
  {
    id: "aquila",
    nameJa: "わし座",
    season: "summer",
    labelPoint: equatorialToEclipticDeg(19.65, 3.2),
    stars: buildSeasonalStars([
      { raHours: 19.846, decDeg: 8.87, mag: 0.76, nameJa: "アルタイル", colorHex: "#f0f9ff" }, // 0: α Aql
      { raHours: 19.771, decDeg: 10.61, mag: 2.72, nameJa: "タラゼド", colorHex: "#fde68a" }, // 1: γ Aql
      { raHours: 19.922, decDeg: 6.41, mag: 3.71, nameJa: "アルシャイン" }, // 2: β Aql
      { raHours: 19.425, decDeg: 3.11, mag: 3.36 }, // 3: δ Aql
      { raHours: 19.09, decDeg: 13.86, mag: 2.99 }, // 4: ζ Aql
      { raHours: 19.104, decDeg: -4.88, mag: 3.43 }, // 5: λ Aql
      { raHours: 20.188, decDeg: -0.82, mag: 3.24 }, // 6: θ Aql
    ]),
    edges: [
      [1, 0],
      [0, 2],
      [1, 4],
      [0, 3],
      [3, 5],
      [2, 6],
      [3, 6],
    ],
  },
  {
    id: "cygnus",
    nameJa: "はくちょう座",
    season: "summer",
    labelPoint: equatorialToEclipticDeg(20.4, 42.5),
    stars: buildSeasonalStars([
      { raHours: 20.691, decDeg: 45.28, mag: 1.25, nameJa: "デネブ", colorHex: "#dbeafe" }, // 0: α Cyg
      { raHours: 20.37, decDeg: 40.26, mag: 2.23, nameJa: "サドル", colorHex: "#fef3c7" }, // 1: γ Cyg
      { raHours: 19.512, decDeg: 27.96, mag: 3.05, nameJa: "アルビレオ", colorHex: "#fde68a" }, // 2: β Cyg
      { raHours: 19.75, decDeg: 45.13, mag: 2.87 }, // 3: δ Cyg
      { raHours: 20.77, decDeg: 33.97, mag: 2.48, nameJa: "ギェナー" }, // 4: ε Cyg
      { raHours: 19.284, decDeg: 53.37, mag: 3.79 }, // 5: κ Cyg
      { raHours: 21.216, decDeg: 30.23, mag: 3.21 }, // 6: ζ Cyg
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [3, 1],
      [1, 4],
      [3, 5],
      [4, 6],
    ],
  },

  // === 秋 ===
  {
    id: "pegasus",
    nameJa: "ペガスス座",
    season: "autumn",
    labelPoint: equatorialToEclipticDeg(22.9, 23.0),
    stars: buildSeasonalStars([
      { raHours: 23.079, decDeg: 15.21, mag: 2.49, nameJa: "マルカブ", colorHex: "#dbeafe" }, // 0: α Peg
      { raHours: 23.063, decDeg: 28.08, mag: 2.42, nameJa: "シェアト", colorHex: "#fdba74" }, // 1: β Peg
      { raHours: 0.221, decDeg: 15.18, mag: 2.83, nameJa: "アルゲニブ", colorHex: "#bae6fd" }, // 2: γ Peg
      { raHours: 0.14, decDeg: 29.09, mag: 2.06, nameJa: "アルフェラッツ", colorHex: "#dbeafe" }, // 3: α And (共有)
      { raHours: 21.736, decDeg: 9.88, mag: 2.38, nameJa: "エニフ", colorHex: "#fde68a" }, // 4: ε Peg
      { raHours: 22.691, decDeg: 10.83, mag: 3.41, nameJa: "ホマム" }, // 5: ζ Peg
      { raHours: 22.717, decDeg: 30.22, mag: 2.94, nameJa: "マタル" }, // 6: η Peg
    ]),
    edges: [
      [0, 1],
      [1, 3],
      [3, 2],
      [2, 0],
      [0, 5],
      [5, 4],
      [1, 6],
    ],
  },
  {
    id: "andromeda",
    nameJa: "アンドロメダ座",
    season: "autumn",
    labelPoint: equatorialToEclipticDeg(1.2, 39.2),
    stars: buildSeasonalStars([
      { raHours: 0.14, decDeg: 29.09, mag: 2.06, nameJa: "アルフェラッツ", colorHex: "#dbeafe" }, // 0: α And
      { raHours: 0.655, decDeg: 30.86, mag: 3.27 }, // 1: δ And
      { raHours: 1.162, decDeg: 35.62, mag: 2.07, nameJa: "ミラク", colorHex: "#fdba74" }, // 2: β And
      { raHours: 2.065, decDeg: 42.33, mag: 2.1, nameJa: "アルマク", colorHex: "#fde68a" }, // 3: γ And
      { raHours: 0.946, decDeg: 38.5, mag: 3.87 }, // 4: μ And
      { raHours: 0.83, decDeg: 41.08, mag: 4.53 }, // 5: ν And (M31付近)
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
      [4, 5],
    ],
  },
  {
    id: "piscisAustrinus",
    nameJa: "みなみのうお座",
    season: "autumn",
    labelPoint: equatorialToEclipticDeg(22.5, -31.8),
    stars: buildSeasonalStars([
      { raHours: 22.961, decDeg: -29.62, mag: 1.16, nameJa: "フォーマルハウト", colorHex: "#e0f2fe" }, // 0: α PsA
      { raHours: 22.674, decDeg: -27.04, mag: 4.18 }, // 1: ε PsA
      { raHours: 22.932, decDeg: -32.54, mag: 4.2 }, // 2: δ PsA
      { raHours: 22.525, decDeg: -32.35, mag: 4.29 }, // 3: β PsA
      { raHours: 21.749, decDeg: -33.02, mag: 4.17 }, // 4: ι PsA
    ]),
    edges: [
      [0, 1],
      [1, 4],
      [4, 3],
      [3, 2],
      [2, 0],
    ],
  },

  // === 冬 ===
  {
    id: "orion",
    nameJa: "オリオン座",
    season: "winter",
    labelPoint: equatorialToEclipticDeg(5.6, 1.5),
    stars: buildSeasonalStars([
      { raHours: 5.92, decDeg: 7.41, mag: 0.5, nameJa: "ベテルギウス", colorHex: "#fb923c" }, // 0: α Ori
      { raHours: 5.419, decDeg: 6.35, mag: 1.64, nameJa: "ベラトリックス", colorHex: "#bae6fd" }, // 1: γ Ori
      { raHours: 5.242, decDeg: -8.2, mag: 0.13, nameJa: "リゲル", colorHex: "#93c5fd" }, // 2: β Ori
      { raHours: 5.796, decDeg: -9.67, mag: 2.09, nameJa: "サイフ", colorHex: "#bae6fd" }, // 3: κ Ori
      { raHours: 5.533, decDeg: -0.3, mag: 2.23, nameJa: "ミンタカ", colorHex: "#bae6fd" }, // 4: δ Ori (三つ星)
      { raHours: 5.604, decDeg: -1.2, mag: 1.69, nameJa: "アルニラム", colorHex: "#bae6fd" }, // 5: ε Ori (三つ星)
      { raHours: 5.679, decDeg: -1.94, mag: 1.77, nameJa: "アルニタク", colorHex: "#bae6fd" }, // 6: ζ Ori (三つ星)
      { raHours: 5.586, decDeg: 9.93, mag: 3.39, nameJa: "メイサ" }, // 7: λ Ori (頭)
    ]),
    edges: [
      [0, 7],
      [7, 1],
      [0, 6],
      [1, 4],
      [4, 5],
      [5, 6],
      [4, 2],
      [6, 3],
      [2, 3],
    ],
  },
  {
    id: "canisMajor",
    nameJa: "おおいぬ座",
    season: "winter",
    labelPoint: equatorialToEclipticDeg(6.95, -23.0),
    stars: buildSeasonalStars([
      { raHours: 6.753, decDeg: -16.72, mag: -1.46, nameJa: "シリウス", colorHex: "#bae6fd" }, // 0: α CMa
      { raHours: 6.378, decDeg: -17.96, mag: 1.98, nameJa: "ミルザム", colorHex: "#bae6fd" }, // 1: β CMa
      { raHours: 7.063, decDeg: -15.63, mag: 4.11 }, // 2: γ CMa
      { raHours: 7.14, decDeg: -26.39, mag: 1.83, nameJa: "ウェズン", colorHex: "#fef3c7" }, // 3: δ CMa
      { raHours: 6.977, decDeg: -28.97, mag: 1.5, nameJa: "アダーラ", colorHex: "#bae6fd" }, // 4: ε CMa
      { raHours: 7.402, decDeg: -29.3, mag: 2.45, nameJa: "アルドラ" }, // 5: η CMa
    ]),
    edges: [
      [1, 0],
      [0, 2],
      [0, 3],
      [3, 4],
      [3, 5],
    ],
  },
  {
    id: "canisMinor",
    nameJa: "こいぬ座",
    season: "winter",
    labelPoint: equatorialToEclipticDeg(7.35, 11.4),
    stars: buildSeasonalStars([
      { raHours: 7.655, decDeg: 5.22, mag: 0.34, nameJa: "プロキオン", colorHex: "#fef9c3" }, // 0: α CMi
      { raHours: 7.453, decDeg: 8.29, mag: 2.89, nameJa: "ゴメイサ", colorHex: "#dbeafe" }, // 1: β CMi
    ]),
    edges: [[0, 1]],
  },
  {
    id: "auriga",
    nameJa: "ぎょしゃ座",
    season: "winter",
    labelPoint: equatorialToEclipticDeg(5.55, 39.5),
    stars: buildSeasonalStars([
      { raHours: 5.278, decDeg: 46.0, mag: 0.08, nameJa: "カペラ", colorHex: "#fde68a" }, // 0: α Aur
      { raHours: 5.992, decDeg: 44.95, mag: 1.9, nameJa: "メンカリナン" }, // 1: β Aur
      { raHours: 5.995, decDeg: 37.21, mag: 2.65 }, // 2: θ Aur
      { raHours: 5.438, decDeg: 28.61, mag: 1.65, nameJa: "エルナト" }, // 3: β Tau (五角形の底)
      { raHours: 4.95, decDeg: 33.17, mag: 2.69, nameJa: "ハッサレー" }, // 4: ι Aur
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 0],
    ],
  },
];

const pegMarkab = equatorialToEclipticDeg(23.079, 15.21);
const pegScheat = equatorialToEclipticDeg(23.063, 28.08);
const pegAlgenib = equatorialToEclipticDeg(0.221, 15.18);
const andAlpheratz = equatorialToEclipticDeg(0.14, 29.09);

const dipperAlioth = equatorialToEclipticDeg(12.9, 55.96);
const dipperMizar = equatorialToEclipticDeg(13.399, 54.93);
const dipperAlkaid = equatorialToEclipticDeg(13.792, 49.31);

/**
 * 春夏秋冬の代表的なアステリズム（三角形・四角形・大曲線・ダイヤモンド）です。
 */
export const SEASONAL_ASTERISMS: SeasonalAsterism[] = [
  {
    id: "springTriangle",
    nameJa: "△ 春の大三角",
    season: "spring",
    colorHex: "#f9a8d4",
    dashed: false,
    labelPoint: equatorialToEclipticDeg(13.18, 8.2),
    vertices: [
      {
        lonDeg: FEATURED_STAR_MAP.arcturus.lonDeg,
        latDeg: FEATURED_STAR_MAP.arcturus.latDeg,
        starId: "arcturus",
      },
      {
        lonDeg: FEATURED_STAR_MAP.spica.lonDeg,
        latDeg: FEATURED_STAR_MAP.spica.latDeg,
        starId: "spica",
      },
      {
        lonDeg: FEATURED_STAR_MAP.denebola.lonDeg,
        latDeg: FEATURED_STAR_MAP.denebola.latDeg,
        starId: "denebola",
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    id: "springCurve",
    nameJa: "⌒ 春の大曲線",
    season: "spring",
    colorHex: "#fbcfe8",
    dashed: true,
    labelPoint: equatorialToEclipticDeg(14.05, 34.5),
    vertices: [
      { lonDeg: dipperAlioth.lonDeg, latDeg: dipperAlioth.latDeg },
      { lonDeg: dipperMizar.lonDeg, latDeg: dipperMizar.latDeg },
      { lonDeg: dipperAlkaid.lonDeg, latDeg: dipperAlkaid.latDeg },
      {
        lonDeg: FEATURED_STAR_MAP.arcturus.lonDeg,
        latDeg: FEATURED_STAR_MAP.arcturus.latDeg,
        starId: "arcturus",
      },
      {
        lonDeg: FEATURED_STAR_MAP.spica.lonDeg,
        latDeg: FEATURED_STAR_MAP.spica.latDeg,
        starId: "spica",
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: "summerTriangle",
    nameJa: "△ 夏の大三角",
    season: "summer",
    colorHex: "#67e8f9",
    dashed: false,
    labelPoint: equatorialToEclipticDeg(19.65, 30.8),
    vertices: [
      {
        lonDeg: FEATURED_STAR_MAP.vega.lonDeg,
        latDeg: FEATURED_STAR_MAP.vega.latDeg,
        starId: "vega",
      },
      {
        lonDeg: FEATURED_STAR_MAP.altair.lonDeg,
        latDeg: FEATURED_STAR_MAP.altair.latDeg,
        starId: "altair",
      },
      {
        lonDeg: FEATURED_STAR_MAP.deneb.lonDeg,
        latDeg: FEATURED_STAR_MAP.deneb.latDeg,
        starId: "deneb",
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    id: "autumnSquare",
    nameJa: "□ 秋の四辺形",
    season: "autumn",
    colorHex: "#fcd34d",
    dashed: false,
    labelPoint: equatorialToEclipticDeg(23.62, 21.8),
    vertices: [
      { lonDeg: pegMarkab.lonDeg, latDeg: pegMarkab.latDeg },
      { lonDeg: pegScheat.lonDeg, latDeg: pegScheat.latDeg },
      { lonDeg: andAlpheratz.lonDeg, latDeg: andAlpheratz.latDeg },
      { lonDeg: pegAlgenib.lonDeg, latDeg: pegAlgenib.latDeg },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ],
  },
  {
    id: "winterTriangle",
    nameJa: "△ 冬の大三角",
    season: "winter",
    colorHex: "#93c5fd",
    dashed: false,
    labelPoint: equatorialToEclipticDeg(6.75, -1.5),
    vertices: [
      {
        lonDeg: FEATURED_STAR_MAP.sirius.lonDeg,
        latDeg: FEATURED_STAR_MAP.sirius.latDeg,
        starId: "sirius",
      },
      {
        lonDeg: FEATURED_STAR_MAP.betelgeuse.lonDeg,
        latDeg: FEATURED_STAR_MAP.betelgeuse.latDeg,
        starId: "betelgeuse",
      },
      {
        lonDeg: FEATURED_STAR_MAP.procyon.lonDeg,
        latDeg: FEATURED_STAR_MAP.procyon.latDeg,
        starId: "procyon",
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
    ],
  },
  {
    id: "winterDiamond",
    nameJa: "◇ 冬のダイヤモンド",
    season: "winter",
    colorHex: "#a5b4fc",
    dashed: true,
    labelPoint: equatorialToEclipticDeg(6.05, 22.5),
    vertices: [
      {
        lonDeg: FEATURED_STAR_MAP.sirius.lonDeg,
        latDeg: FEATURED_STAR_MAP.sirius.latDeg,
        starId: "sirius",
      },
      {
        lonDeg: FEATURED_STAR_MAP.procyon.lonDeg,
        latDeg: FEATURED_STAR_MAP.procyon.latDeg,
        starId: "procyon",
      },
      {
        lonDeg: FEATURED_STAR_MAP.pollux.lonDeg,
        latDeg: FEATURED_STAR_MAP.pollux.latDeg,
        starId: "pollux",
      },
      {
        lonDeg: FEATURED_STAR_MAP.capella.lonDeg,
        latDeg: FEATURED_STAR_MAP.capella.latDeg,
        starId: "capella",
      },
      {
        lonDeg: FEATURED_STAR_MAP.aldebaran.lonDeg,
        latDeg: FEATURED_STAR_MAP.aldebaran.latDeg,
        starId: "aldebaran",
      },
      {
        lonDeg: FEATURED_STAR_MAP.rigel.lonDeg,
        latDeg: FEATURED_STAR_MAP.rigel.latDeg,
        starId: "rigel",
      },
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
    ],
  },
];

/**
 * 「近傍恒星（3D奥行き）」視点で、距離（光年）を対数スケールで3D半径へ変換します。
 * 4.37光年（アルファ・ケンタウリ）〜 2,600光年（デネブ）の奥行き差が一目で分かる配置にします。
 */
export function starDistanceLyToSceneRadius(distanceLy: number): number {
  return 5.4 + 7.2 * Math.log10(1 + Math.max(0.5, distanceLy) * 1.45);
}

/**
 * 地球の自転軸（赤道座標）における北極星（約433光年）の3D方向ベクトル（黄道座標系）を返します。
 */
export function getPolarisNearbyPosition(): [number, number, number] {
  const ec = equatorialToEclipticDeg(2.53, 89.26);
  const [ux, uy, uz] = eclipticToWorldUnitVector(ec.lonDeg, ec.latDeg);
  const r = starDistanceLyToSceneRadius(433);
  return [ux * r, uy * r, uz * r];
}

/**
 * 指定した季節の夜21時（東京 JST = UTC+9）に、該当季節の星座が南の空で見やすい代表日時（ISO UTC）を返します。
 */
export const SEASONAL_SKY_GUIDE_DATES: Record<
  SeasonTag,
  { isoUtc: string; azDeg: number; elevDeg: number }
> = {
  // 5月15日 21:00 JST (12:00 UTC)：春の大三角（アークトゥルス・スピカ・デネボラ）と北斗七星が見頃
  spring: { isoUtc: "2026-05-15T12:00:00Z", azDeg: 175, elevDeg: 44 },
  // 8月15日 21:00 JST (12:00 UTC)：夏の大三角（ベガ・アルタイル・デネブ）が南〜天頂高くに見頃
  summer: { isoUtc: "2026-08-15T12:00:00Z", azDeg: 168, elevDeg: 58 },
  // 11月1日 21:00 JST (12:00 UTC)：秋の四辺形（ペガスス）とフォーマルハウトが南中
  autumn: { isoUtc: "2026-11-01T12:00:00Z", azDeg: 180, elevDeg: 48 },
  // 2月15日 21:00 JST (12:00 UTC)：冬の大三角（シリウス・ベテルギウス・プロキオン）とオリオン座・冬のダイヤモンドが南中
  winter: { isoUtc: "2026-02-15T12:00:00Z", azDeg: 182, elevDeg: 38 },
};

/**
 * 指定した恒星が指定地点・指定日時に地平線より上にあるか、高度（度）を簡易算出します（テスト・検証用）。
 */
export function getStarAltitudeDeg(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  gmstRad: number
): number {
  const raRad = degToRad(raHours * 15);
  const decRad = degToRad(decDeg);
  const latRad = degToRad(latDeg);
  const lonRad = degToRad(lonDeg);
  const lst = gmstRad + lonRad;
  const ha = lst - raRad;
  const sinAlt =
    Math.sin(latRad) * Math.sin(decRad) +
    Math.cos(latRad) * Math.cos(decRad) * Math.cos(ha);
  return (Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180) / Math.PI;
}
