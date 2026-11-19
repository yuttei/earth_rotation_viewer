/**
 * 実在する天体の大きさ・重さ・距離（公開されている実測値・推定値）と、
 * それを 3D シーンの単位へ直すための換算をまとめたモジュールです。
 *
 * 天体衝突シミュレーターの物理計算（重力・衝突・予測）は、ここの値をそのまま使います。
 * 画面に描くときの大きさや位置の誇張は bodySizes.ts と displayWarp.ts が受け持ち、物理計算には持ち込みません。
 *
 * 出典（どれも NASA の公開資料）：
 * - 惑星・冥王星：NASA NSSDCA Planetary Fact Sheet（https://nssdc.gsfc.nasa.gov/planetary/factsheet/）
 * - 太陽：NASA NSSDCA Sun Fact Sheet（https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html）
 * - 月：NASA NSSDCA Moon Fact Sheet（https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html）
 * - 木星の4衛星：NASA NSSDCA Jovian Satellite Fact Sheet（https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html）
 */

/** 1 天文単位（地球と太陽の平均距離）を km で表した値（IAU 2012 の定義値） */
export const AU_KM = 149_597_870.7;

/** 3D シーンで 1 天文単位を表す長さ（シーン単位）。リアル太陽系モードの惑星の軌道もこの縮尺です */
export const SCENE_UNITS_PER_AU = 13.5;

/** 1 km がシーン単位でいくつになるか（約 9.0 × 10⁻⁸） */
export const SCENE_UNITS_PER_KM = SCENE_UNITS_PER_AU / AU_KM;

/** km をシーン単位に直します（例：地球の半径 6,378 km → 約 0.00058） */
export function kmToScene(km: number): number {
  return km * SCENE_UNITS_PER_KM;
}

/** 太陽の質量（kg） */
export const SUN_MASS_KG = 1.9885e30;

/** 太陽の半径（km。IAU の公称値） */
export const SUN_RADIUS_KM = 695_700;

/** 地球の赤道半径（km） */
export const EARTH_RADIUS_KM = 6_378.1;

/** 地球の質量（kg） */
export const EARTH_MASS_KG = 5.9722e24;

/**
 * シーン単位での太陽の重力の強さ GM（万有引力定数 G × 質量）です。
 * シーンの時間の単位（以下「シミュレーション時間」）は、この値と 1 AU = 13.5 から決まり、
 * 地球が太陽を1周する時間が約 9.0 シミュレーション時間になります。
 */
export const SUN_GM_SCENE = 1200;

/** 質量（kg）から、シーン単位での重力の強さ GM を求めます（太陽との質量の比 × 太陽の GM） */
export function massKgToGmScene(massKg: number): number {
  return (SUN_GM_SCENE * massKg) / SUN_MASS_KG;
}

/** 地球が太陽を1周する時間（恒星年・秒） */
const SIDEREAL_YEAR_SECONDS = 365.256363 * 86_400;

/**
 * 1 シミュレーション時間が、実際の何秒にあたるか（約 3.5 × 10⁶ 秒 ≒ 40.6 日）です。
 * ケプラーの法則から、1 AU を回る周期は 2π√(a³/GM) シミュレーション時間なので、
 * それが恒星年（約 365.26 日）に等しくなるように換算します。
 */
export const ASTRO_SECONDS_PER_SIM_TIME =
  SIDEREAL_YEAR_SECONDS /
  (2 * Math.PI * Math.sqrt(SCENE_UNITS_PER_AU ** 3 / SUN_GM_SCENE));

/** 速さ（km/s）を、シーン単位 ÷ シミュレーション時間に直します（例：地球の公転 29.8 km/s → 約 9.4） */
export function kmPerSecToScene(kmPerSec: number): number {
  return kmPerSec * SCENE_UNITS_PER_KM * ASTRO_SECONDS_PER_SIM_TIME;
}

/** 実在のデータを持つ太陽系の天体（太陽を除く） */
export type RealSolarBodyId =
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "io"
  | "europa"
  | "ganymede"
  | "callisto";

/**
 * 半径（km）。惑星は赤道半径、月・冥王星・木星の衛星は平均半径です。
 * 例：地球 6,378 km、木星 71,492 km
 */
export const BODY_RADIUS_KM: Record<RealSolarBodyId, number> = {
  mercury: 2_440.5,
  venus: 6_051.8,
  earth: EARTH_RADIUS_KM,
  moon: 1_737.4,
  mars: 3_396.2,
  jupiter: 71_492,
  saturn: 60_268,
  uranus: 25_559,
  neptune: 24_764,
  pluto: 1_188,
  io: 1_821.5,
  europa: 1_560.8,
  ganymede: 2_631.2,
  callisto: 2_410.3,
};

/** 質量（kg） */
export const BODY_MASS_KG: Record<RealSolarBodyId, number> = {
  mercury: 0.3301e24,
  venus: 4.8673e24,
  earth: EARTH_MASS_KG,
  moon: 0.07346e24,
  mars: 0.64169e24,
  jupiter: 1_898.13e24,
  saturn: 568.32e24,
  uranus: 86.811e24,
  neptune: 102.409e24,
  pluto: 0.01303e24,
  io: 893.2e20,
  europa: 480.0e20,
  ganymede: 1_481.9e20,
  callisto: 1_075.9e20,
};

/** 衛星の ID */
export type RealSatelliteId = "moon" | "io" | "europa" | "ganymede" | "callisto";

/** 衛星が母惑星の中心から離れている距離（軌道長半径・km） */
export const SATELLITE_ORBIT_KM: Record<RealSatelliteId, number> = {
  moon: 384_400,
  io: 421_800,
  europa: 671_100,
  ganymede: 1_070_400,
  callisto: 1_882_700,
};
