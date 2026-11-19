/**
 * 天体の大きさ（表示半径）を1か所で決めるモジュールです。
 *
 * 3D シーンの長さの単位は「地球の半径 = 1」です。
 * リアル太陽系モードでは、惑星・月・木星4衛星を「実際の半径 × REAL_SOLAR_PLANET_SCALE」で描き、
 * 惑星どうしの大きさを実際の比率にそろえます。
 * 太陽だけは実際の比率（地球の約109倍）で描くと水星の軌道まで飲み込んでしまうため、別の縮尺にします。
 */

/** 大きさを持つ太陽系の天体（太陽以外）の ID */
export type SizedSolarBodyId =
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
 * 実際の半径（地球の半径 = 1）です。
 * 地球 6,378 km・木星 71,492 km のような赤道半径（冥王星と衛星は平均半径）を、地球の赤道半径で割った値です。
 */
export const BODY_RADIUS_EARTH: Record<SizedSolarBodyId, number> = {
  mercury: 0.383,
  venus: 0.949,
  earth: 1.0,
  moon: 0.273,
  mars: 0.532,
  jupiter: 11.21,
  saturn: 9.45,
  uranus: 4.01,
  neptune: 3.88,
  pluto: 0.187,
  io: 0.286,
  europa: 0.245,
  ganymede: 0.413,
  callisto: 0.378,
};

/** リアル太陽系モードで描く木星の半径（これまでと同じ大きさに保ち、ほかの惑星をこれに合わせて縮めます） */
const REAL_SOLAR_JUPITER_RADIUS = 3.1;

/**
 * リアル太陽系モードで、実際の半径（地球 = 1）に掛ける倍率です（約 0.277）。
 * 全惑星・月・木星4衛星に同じ倍率を掛けるので、惑星どうしの大きさの比は実際と同じになります。
 */
export const REAL_SOLAR_PLANET_SCALE =
  REAL_SOLAR_JUPITER_RADIUS / BODY_RADIUS_EARTH.jupiter;

/**
 * リアル太陽系モードで描く太陽の半径（別の縮尺）です。
 * 木星（3.1）より大きく、水星が太陽にもっとも近づく位置（0.307 AU = 4.15）より十分内側に収まる値にしています。
 */
export const REAL_SOLAR_SUN_RADIUS = 3.4;

/** 天の北極視点などの簡易モードでの月の公転半径（地球の半径 = 1 のとき） */
export const SIMPLE_MODE_MOON_ORBIT_RADIUS = 3.45;

/**
 * リアル太陽系モードでの表示半径（地球の半径 = 1 のシーン単位）を返します。
 * 例：地球 → 1 × 0.277 = 0.277、木星 → 11.21 × 0.277 = 3.1
 */
export function realSolarDisplayRadius(id: SizedSolarBodyId): number {
  return BODY_RADIUS_EARTH[id] * REAL_SOLAR_PLANET_SCALE;
}
