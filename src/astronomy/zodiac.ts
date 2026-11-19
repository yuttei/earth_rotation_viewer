import { EARTH_AXIAL_TILT_DEG, degToRad, radToDeg } from "./calculations";

function normalizeDeg360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** 黄道13星座（黄道12星座＋へびつかい座）の識別子 */
export type ZodiacConstellationId =
  | "pisces"
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpius"
  | "ophiuchus"
  | "sagittarius"
  | "capricornus"
  | "aquarius";

/** 星座を構成する恒星の黄道座標 */
export interface ZodiacStarPoint {
  /** 黄経（度：0°〜360°） */
  lonDeg: number;
  /** 黄緯（度：-90°〜+90°） */
  latDeg: number;
  /** 見かけの等級（小さいほど明るい） */
  mag: number;
  /** 1等星など代表的な星の日本語名（任意） */
  nameJa?: string;
}

/** 黄道13星座の定義データ（国際天文学連合 IAU 境界・J2000.0 準拠） */
export interface ZodiacConstellation {
  id: ZodiacConstellationId;
  /** 日本語名 */
  nameJa: string;
  /** 学術英語名 */
  nameEn: string;
  /** 星座記号 */
  symbol: string;
  /** 13番目の星座（へびつかい座）かどうか */
  isThirteenth: boolean;
  /** 太陽がこの星座へ入る黄経（度） */
  startLonDeg: number;
  /** 太陽がこの星座から出る黄経（度） */
  endLonDeg: number;
  /** 太陽が通過するおおよその時期（現代・歳差反映後） */
  dateRangeJa: string;
  /** ラベル配置用の黄経（度） */
  labelLonDeg: number;
  /** ラベル配置用の黄緯（度） */
  labelLatDeg: number;
  /** 星座を形作る主要恒星の配列 */
  stars: ZodiacStarPoint[];
  /** 星座線（stars のインデックス対） */
  edges: Array<[number, number]>;
}

/** 黄道上の4つの季節点（春分点・夏至点・秋分点・冬至点） */
export const ECLIPTIC_CARDINAL_POINTS: Array<{
  id: "vernal" | "summer" | "autumnal" | "winter";
  labelJa: string;
  lonDeg: number;
}> = [
  { id: "vernal", labelJa: "♈ 春分点 (0°)", lonDeg: 0 },
  { id: "summer", labelJa: "☀ 夏至点 (90°)", lonDeg: 90 },
  { id: "autumnal", labelJa: "♎ 秋分点 (180°)", lonDeg: 180 },
  { id: "winter", labelJa: "❄ 冬至点 (270°)", lonDeg: 270 },
];

/**
 * 赤道座標（J2000.0 の赤経[時間]・赤緯[度]）を黄道座標（黄経[度]・黄緯[度]）へ変換します。
 */
export function equatorialToEclipticDeg(
  raHours: number,
  decDeg: number
): { lonDeg: number; latDeg: number } {
  const raRad = degToRad(raHours * 15);
  const decRad = degToRad(decDeg);
  const epsRad = degToRad(EARTH_AXIAL_TILT_DEG);

  const cosDec = Math.cos(decRad);
  const sinDec = Math.sin(decRad);
  const cosRa = Math.cos(raRad);
  const sinRa = Math.sin(raRad);
  const cosEps = Math.cos(epsRad);
  const sinEps = Math.sin(epsRad);

  const xEc = cosDec * cosRa;
  const yEc = cosDec * sinRa * cosEps + sinDec * sinEps;
  const zEc = -cosDec * sinRa * sinEps + sinDec * cosEps;

  const lonDeg = normalizeDeg360(radToDeg(Math.atan2(yEc, xEc)));
  const latDeg = radToDeg(Math.asin(Math.max(-1, Math.min(1, zEc))));
  return { lonDeg, latDeg };
}

/**
 * 黄道座標（黄経・黄緯）を、本アプリの Three.js ワールド単位ベクトルへ変換します。
 * +X = 春分点 (λ=0°), +Y = 黄道北極 (β=+90°), -Z = 夏至点 (λ=90°) です。
 */
export function eclipticToWorldUnitVector(
  lonDeg: number,
  latDeg: number
): [number, number, number] {
  const lonRad = degToRad(lonDeg);
  const latRad = degToRad(latDeg);
  const cosLat = Math.cos(latRad);
  return [
    cosLat * Math.cos(lonRad),
    Math.sin(latRad),
    -cosLat * Math.sin(lonRad),
  ];
}

interface RawStarSpec {
  raHours: number;
  decDeg: number;
  mag: number;
  nameJa?: string;
}

function buildStars(specs: RawStarSpec[]): ZodiacStarPoint[] {
  const result: ZodiacStarPoint[] = [];
  for (const s of specs) {
    const ec = equatorialToEclipticDeg(s.raHours, s.decDeg);
    result.push({
      lonDeg: ec.lonDeg,
      latDeg: ec.latDeg,
      mag: s.mag,
      nameJa: s.nameJa,
    });
  }
  return result;
}

/**
 * 国際天文学連合（IAU）の実際の星座境界（J2000.0）に基づく黄道13星座データです。
 * 地球の歳差運動により、春分点（0°）は現在「うお座」の中にあります。
 * また、さそり座といて座の間には13番目の星座「へびつかい座」が黄道を横切っています。
 */
export const ZODIAC_CONSTELLATIONS: ZodiacConstellation[] = [
  {
    id: "pisces",
    nameJa: "うお座",
    nameEn: "Pisces",
    symbol: "♓",
    isThirteenth: false,
    startLonDeg: 351.6,
    endLonDeg: 28.7,
    dateRangeJa: "3/12〜4/18",
    labelLonDeg: 9.0,
    labelLatDeg: 11.5,
    stars: buildStars([
      // 西の魚（サークレット）
      { raHours: 23.063, decDeg: 3.82, mag: 4.5 }, // 0: β Psc
      { raHours: 23.286, decDeg: 3.28, mag: 3.7 }, // 1: γ Psc
      { raHours: 23.466, decDeg: 6.38, mag: 4.3 }, // 2: θ Psc
      { raHours: 23.666, decDeg: 5.63, mag: 4.1 }, // 3: ι Psc
      { raHours: 23.702, decDeg: 1.78, mag: 4.5 }, // 4: λ Psc
      { raHours: 23.449, decDeg: 1.26, mag: 4.9 }, // 5: κ Psc
      // 紐の結び目（アルレシャ）へ
      { raHours: 23.988, decDeg: 6.86, mag: 4.0 }, // 6: ω Psc
      { raHours: 0.815, decDeg: 7.59, mag: 4.4 }, // 7: δ Psc
      { raHours: 1.048, decDeg: 7.89, mag: 4.3 }, // 8: ε Psc
      { raHours: 2.034, decDeg: 2.76, mag: 3.8, nameJa: "アルレシャ" }, // 9: α Psc
      // 北の魚へ
      { raHours: 1.756, decDeg: 9.16, mag: 4.3 }, // 10: ο Psc
      { raHours: 1.525, decDeg: 15.35, mag: 3.6 }, // 11: η Psc
      { raHours: 1.139, decDeg: 24.58, mag: 4.5 }, // 12: τ Psc
      { raHours: 1.325, decDeg: 27.26, mag: 4.7 }, // 13: υ Psc
    ]),
    edges: [
      [0, 1],
      [1, 5],
      [5, 4],
      [4, 3],
      [3, 2],
      [2, 0],
      [3, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
    ],
  },
  {
    id: "aries",
    nameJa: "おひつじ座",
    nameEn: "Aries",
    symbol: "♈",
    isThirteenth: false,
    startLonDeg: 28.7,
    endLonDeg: 53.4,
    dateRangeJa: "4/18〜5/13",
    labelLonDeg: 40.5,
    labelLatDeg: 15.0,
    stars: buildStars([
      { raHours: 1.892, decDeg: 19.29, mag: 3.9 }, // 0: γ Ari (メサルティム)
      { raHours: 1.911, decDeg: 20.81, mag: 2.6 }, // 1: β Ari (シェラタン)
      { raHours: 2.120, decDeg: 23.46, mag: 2.0, nameJa: "ハマル" }, // 2: α Ari
      { raHours: 2.833, decDeg: 27.26, mag: 3.6 }, // 3: 41 Ari
      { raHours: 3.193, decDeg: 19.73, mag: 4.3 }, // 4: δ Ari
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  {
    id: "taurus",
    nameJa: "おうし座",
    nameEn: "Taurus",
    symbol: "♉",
    isThirteenth: false,
    startLonDeg: 53.4,
    endLonDeg: 90.1,
    dateRangeJa: "5/13〜6/21",
    labelLonDeg: 71.0,
    labelLatDeg: 10.0,
    stars: buildStars([
      // ヒアデス星団のV字顔＋アルデバラン
      { raHours: 4.599, decDeg: 16.51, mag: 0.9, nameJa: "アルデバラン" }, // 0: α Tau
      { raHours: 4.477, decDeg: 15.87, mag: 3.4 }, // 1: θ2 Tau
      { raHours: 4.330, decDeg: 15.63, mag: 3.7 }, // 2: γ Tau
      { raHours: 4.382, decDeg: 17.54, mag: 3.8 }, // 3: δ Tau
      { raHours: 4.477, decDeg: 19.18, mag: 3.5 }, // 4: ε Tau
      // 長い2本の角
      { raHours: 5.438, decDeg: 28.61, mag: 1.7, nameJa: "エルナト" }, // 5: β Tau
      { raHours: 5.627, decDeg: 21.14, mag: 3.0 }, // 6: ζ Tau
      // 胴体とすばる（プレアデス）
      { raHours: 4.011, decDeg: 12.49, mag: 3.5 }, // 7: λ Tau
      { raHours: 3.791, decDeg: 24.11, mag: 2.9, nameJa: "すばる" }, // 8: η Tau (プレアデス)
    ]),
    edges: [
      [6, 0],
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 7],
      [4, 8],
    ],
  },
  {
    id: "gemini",
    nameJa: "ふたご座",
    nameEn: "Gemini",
    symbol: "♊",
    isThirteenth: false,
    startLonDeg: 90.1,
    endLonDeg: 118.0,
    dateRangeJa: "6/21〜7/20",
    labelLonDeg: 104.0,
    labelLatDeg: 13.0,
    stars: buildStars([
      // カストル側
      { raHours: 7.577, decDeg: 31.89, mag: 1.6, nameJa: "カストル" }, // 0: α Gem
      { raHours: 7.069, decDeg: 20.57, mag: 3.8 }, // 1: ζ Gem
      { raHours: 6.732, decDeg: 25.13, mag: 3.0 }, // 2: ε Gem (メブスタ)
      { raHours: 6.383, decDeg: 22.51, mag: 2.9 }, // 3: μ Gem (テジャト)
      { raHours: 6.248, decDeg: 22.51, mag: 3.3 }, // 4: η Gem
      // ポルックス側
      { raHours: 7.755, decDeg: 28.03, mag: 1.1, nameJa: "ポルックス" }, // 5: β Gem
      { raHours: 7.335, decDeg: 21.98, mag: 3.5 }, // 6: δ Gem (ワサト)
      { raHours: 6.629, decDeg: 16.40, mag: 1.9, nameJa: "アルヘナ" }, // 7: γ Gem
      { raHours: 6.754, decDeg: 12.90, mag: 3.4 }, // 8: ξ Gem
    ]),
    edges: [
      [0, 5],
      [0, 2],
      [2, 3],
      [3, 4],
      [5, 6],
      [6, 1],
      [1, 7],
      [6, 8],
    ],
  },
  {
    id: "cancer",
    nameJa: "かに座",
    nameEn: "Cancer",
    symbol: "♋",
    isThirteenth: false,
    startLonDeg: 118.0,
    endLonDeg: 138.0,
    dateRangeJa: "7/20〜8/10",
    labelLonDeg: 128.0,
    labelLatDeg: 12.0,
    stars: buildStars([
      { raHours: 8.778, decDeg: 28.76, mag: 4.0 }, // 0: ι Cnc
      { raHours: 8.721, decDeg: 21.47, mag: 4.7 }, // 1: γ Cnc
      { raHours: 8.745, decDeg: 18.15, mag: 3.9 }, // 2: δ Cnc
      { raHours: 8.975, decDeg: 11.86, mag: 4.3 }, // 3: α Cnc (アクベンス)
      { raHours: 8.275, decDeg: 9.19, mag: 3.5 }, // 4: β Cnc (アルタルフ)
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  {
    id: "leo",
    nameJa: "しし座",
    nameEn: "Leo",
    symbol: "♌",
    isThirteenth: false,
    startLonDeg: 138.0,
    endLonDeg: 173.8,
    dateRangeJa: "8/10〜9/16",
    labelLonDeg: 156.0,
    labelLatDeg: 15.0,
    stars: buildStars([
      // ししの大鎌（？マーク）
      { raHours: 9.764, decDeg: 23.77, mag: 3.0 }, // 0: ε Leo
      { raHours: 9.879, decDeg: 26.01, mag: 3.9 }, // 1: μ Leo
      { raHours: 10.278, decDeg: 23.42, mag: 3.4 }, // 2: ζ Leo
      { raHours: 10.333, decDeg: 19.84, mag: 2.0, nameJa: "アルギエバ" }, // 3: γ Leo
      { raHours: 10.122, decDeg: 16.76, mag: 3.5 }, // 4: η Leo
      { raHours: 10.139, decDeg: 11.97, mag: 1.4, nameJa: "レグルス" }, // 5: α Leo
      // 胴体と尾
      { raHours: 11.235, decDeg: 20.52, mag: 2.6 }, // 6: δ Leo (ゾスマ)
      { raHours: 11.237, decDeg: 15.43, mag: 3.3 }, // 7: θ Leo
      { raHours: 11.818, decDeg: 14.57, mag: 2.1, nameJa: "デネボラ" }, // 8: β Leo
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [3, 6],
      [6, 8],
      [8, 7],
      [7, 5],
      [6, 7],
    ],
  },
  {
    id: "virgo",
    nameJa: "おとめ座",
    nameEn: "Virgo",
    symbol: "♍",
    isThirteenth: false,
    startLonDeg: 173.8,
    endLonDeg: 217.8,
    dateRangeJa: "9/16〜10/30",
    labelLonDeg: 196.0,
    labelLatDeg: 11.0,
    stars: buildStars([
      { raHours: 11.845, decDeg: 1.76, mag: 3.6 }, // 0: β Vir
      { raHours: 12.332, decDeg: -0.67, mag: 3.9 }, // 1: η Vir
      { raHours: 12.694, decDeg: -1.45, mag: 2.7 }, // 2: γ Vir (ポリマ)
      { raHours: 12.927, decDeg: 3.40, mag: 3.4 }, // 3: δ Vir
      { raHours: 13.036, decDeg: 10.96, mag: 2.8 }, // 4: ε Vir (ヴィンデミアトリクス)
      { raHours: 13.420, decDeg: -11.16, mag: 1.0, nameJa: "スピカ" }, // 5: α Vir
      { raHours: 13.578, decDeg: -0.60, mag: 3.4 }, // 6: ζ Vir
      { raHours: 14.267, decDeg: -10.27, mag: 4.1 }, // 7: κ Vir
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 6],
      [6, 5],
      [5, 7],
    ],
  },
  {
    id: "libra",
    nameJa: "てんびん座",
    nameEn: "Libra",
    symbol: "♎",
    isThirteenth: false,
    startLonDeg: 217.8,
    endLonDeg: 241.0,
    dateRangeJa: "10/30〜11/23",
    labelLonDeg: 229.0,
    labelLatDeg: 11.0,
    stars: buildStars([
      { raHours: 14.848, decDeg: -16.04, mag: 2.8, nameJa: "ズベンエルゲヌビ" }, // 0: α Lib
      { raHours: 15.283, decDeg: -9.38, mag: 2.6, nameJa: "ズベンエシャマリ" }, // 1: β Lib
      { raHours: 15.592, decDeg: -14.79, mag: 3.9 }, // 2: γ Lib
      { raHours: 15.068, decDeg: -25.28, mag: 3.3 }, // 3: σ Lib
      { raHours: 15.617, decDeg: -28.14, mag: 3.6 }, // 4: υ Lib
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [2, 4],
    ],
  },
  {
    id: "scorpius",
    nameJa: "さそり座",
    nameEn: "Scorpius",
    symbol: "♏",
    isThirteenth: false,
    startLonDeg: 241.0,
    endLonDeg: 247.7,
    dateRangeJa: "11/23〜11/29",
    labelLonDeg: 244.5,
    labelLatDeg: -14.5,
    stars: buildStars([
      // ハサミ（頭）
      { raHours: 16.091, decDeg: -19.81, mag: 2.6 }, // 0: β Sco
      { raHours: 16.006, decDeg: -22.62, mag: 2.3 }, // 1: δ Sco
      { raHours: 15.981, decDeg: -26.11, mag: 2.9 }, // 2: π Sco
      // 心臓アンタレスとS字の尾
      { raHours: 16.490, decDeg: -26.43, mag: 1.0, nameJa: "アンタレス" }, // 3: α Sco
      { raHours: 16.836, decDeg: -34.29, mag: 2.3 }, // 4: ε Sco
      { raHours: 17.202, decDeg: -43.24, mag: 3.3 }, // 5: η Sco
      { raHours: 17.622, decDeg: -42.99, mag: 1.9 }, // 6: θ Sco (サルガス)
      { raHours: 17.708, decDeg: -39.03, mag: 2.4 }, // 7: κ Sco
      { raHours: 17.560, decDeg: -37.10, mag: 1.6, nameJa: "シャウラ" }, // 8: λ Sco
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
    ],
  },
  {
    id: "ophiuchus",
    nameJa: "へびつかい座",
    nameEn: "Ophiuchus",
    symbol: "⛎",
    isThirteenth: true,
    startLonDeg: 247.7,
    endLonDeg: 266.3,
    dateRangeJa: "11/29〜12/17",
    labelLonDeg: 257.5,
    labelLatDeg: 15.5,
    stars: buildStars([
      // 頭（ラスアルハゲ）から五角形の胴体・足元（黄道をまたぐ）
      { raHours: 17.582, decDeg: 12.56, mag: 2.1, nameJa: "ラスアルハゲ" }, // 0: α Oph
      { raHours: 17.725, decDeg: 4.57, mag: 2.8 }, // 1: β Oph (ケバルライ)
      { raHours: 17.984, decDeg: -9.77, mag: 3.3 }, // 2: ν Oph
      { raHours: 17.173, decDeg: -15.72, mag: 2.4, nameJa: "サビク" }, // 3: η Oph
      { raHours: 17.367, decDeg: -24.99, mag: 3.3 }, // 4: θ Oph（黄道付近）
      { raHours: 16.619, decDeg: -10.57, mag: 2.6 }, // 5: ζ Oph
      { raHours: 16.239, decDeg: -3.69, mag: 2.7 }, // 6: δ Oph
      { raHours: 16.961, decDeg: 9.38, mag: 3.2 }, // 7: κ Oph
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [3, 5],
      [5, 6],
      [6, 7],
      [7, 0],
    ],
  },
  {
    id: "sagittarius",
    nameJa: "いて座",
    nameEn: "Sagittarius",
    symbol: "♐",
    isThirteenth: false,
    startLonDeg: 266.3,
    endLonDeg: 299.7,
    dateRangeJa: "12/17〜1/20",
    labelLonDeg: 282.5,
    labelLatDeg: -12.0,
    stars: buildStars([
      // 南斗六星・ティーポット形
      { raHours: 18.097, decDeg: -30.42, mag: 3.0 }, // 0: γ Sgr (アルナスル・注ぎ口)
      { raHours: 18.350, decDeg: -29.83, mag: 2.7 }, // 1: δ Sgr (カウス・メディア)
      { raHours: 18.403, decDeg: -34.38, mag: 1.8, nameJa: "カウス・アウストラリス" }, // 2: ε Sgr
      { raHours: 18.466, decDeg: -25.42, mag: 2.8 }, // 3: λ Sgr (蓋の頂点)
      { raHours: 18.761, decDeg: -26.99, mag: 3.2 }, // 4: φ Sgr
      { raHours: 18.921, decDeg: -26.30, mag: 2.1, nameJa: "ヌンキ" }, // 5: σ Sgr
      { raHours: 19.043, decDeg: -29.88, mag: 2.6 }, // 6: ζ Sgr (アスケラ)
      { raHours: 19.115, decDeg: -27.67, mag: 3.3 }, // 7: τ Sgr
    ]),
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [3, 4],
      [4, 1],
      [2, 6],
      [4, 6],
      [4, 5],
      [5, 7],
      [7, 6],
    ],
  },
  {
    id: "capricornus",
    nameJa: "やぎ座",
    nameEn: "Capricornus",
    symbol: "♑",
    isThirteenth: false,
    startLonDeg: 299.7,
    endLonDeg: 327.5,
    dateRangeJa: "1/20〜2/16",
    labelLonDeg: 313.5,
    labelLatDeg: -11.0,
    stars: buildStars([
      { raHours: 20.301, decDeg: -12.54, mag: 3.6 }, // 0: α Cap (アルゲディ)
      { raHours: 20.350, decDeg: -14.78, mag: 3.1 }, // 1: β Cap (ダビー)
      { raHours: 20.768, decDeg: -25.27, mag: 4.1 }, // 2: ψ Cap
      { raHours: 21.444, decDeg: -22.41, mag: 3.7 }, // 3: ζ Cap
      { raHours: 21.668, decDeg: -16.66, mag: 3.7 }, // 4: γ Cap (ナシラ)
      { raHours: 21.784, decDeg: -16.13, mag: 2.9, nameJa: "デネブ・アルゲディ" }, // 5: δ Cap
      { raHours: 21.099, decDeg: -17.23, mag: 4.1 }, // 6: θ Cap
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 1],
    ],
  },
  {
    id: "aquarius",
    nameJa: "みずがめ座",
    nameEn: "Aquarius",
    symbol: "♒",
    isThirteenth: false,
    startLonDeg: 327.5,
    endLonDeg: 351.6,
    dateRangeJa: "2/16〜3/12",
    labelLonDeg: 339.5,
    labelLatDeg: 11.0,
    stars: buildStars([
      { raHours: 21.526, decDeg: -5.57, mag: 2.9 }, // 0: β Aqr (サダルスウド)
      { raHours: 22.096, decDeg: -0.32, mag: 3.0, nameJa: "サダルメリク" }, // 1: α Aqr
      { raHours: 22.361, decDeg: -1.39, mag: 3.8 }, // 2: γ Aqr (水がめ)
      { raHours: 22.481, decDeg: -0.02, mag: 3.7 }, // 3: ζ Aqr
      { raHours: 22.589, decDeg: -0.12, mag: 4.0 }, // 4: η Aqr
      { raHours: 22.878, decDeg: -7.58, mag: 3.7 }, // 5: λ Aqr
      { raHours: 22.911, decDeg: -15.82, mag: 3.3 }, // 6: δ Aqr (スカト)
    ]),
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [3, 5],
      [5, 6],
    ],
  },
];

/**
 * 指定した黄経（度）が、黄道13星座のどの星座の区間にあるかを判定します。
 */
export function getZodiacConstellationAtLongitude(
  eclipticLongitudeDeg: number
): ZodiacConstellation {
  const lon = normalizeDeg360(eclipticLongitudeDeg);
  for (const c of ZODIAC_CONSTELLATIONS) {
    if (c.startLonDeg < c.endLonDeg) {
      if (lon >= c.startLonDeg && lon < c.endLonDeg) {
        return c;
      }
    } else {
      // うお座のように 360° → 0° をまたぐ区間
      if (lon >= c.startLonDeg || lon < c.endLonDeg) {
        return c;
      }
    }
  }
  return ZODIAC_CONSTELLATIONS[0];
}

/**
 * 現在の太陽の視黄経から「太陽がある星座（黄道13星座）」と
 * 「真夜中に南の空高く（南中）見える星座（180°反対側）」を返します。
 */
export function getSunAndMidnightZodiac(sunEclipticLongitudeDeg: number): {
  sunConstellation: ZodiacConstellation;
  midnightConstellation: ZodiacConstellation;
} {
  return {
    sunConstellation: getZodiacConstellationAtLongitude(sunEclipticLongitudeDeg),
    midnightConstellation: getZodiacConstellationAtLongitude(
      sunEclipticLongitudeDeg + 180
    ),
  };
}
