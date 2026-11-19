/**
 * 天体の大きさ（半径）を1か所で決めるモジュールです。
 *
 * 3D シーンの長さの単位は、簡易モード（天の北極視点など）では「地球の半径 = 1」です。
 * リアル太陽系モードでは、太陽・惑星・月・木星4衛星を、軌道と同じ縮尺（1 天文単位 = 13.5）の
 * 実際の大きさ（realBodyData.ts の半径を kmToScene で直した値）で描きます。
 * どの天体も、どの距離から見ても、実際より大きくも小さくも描きません。
 */

import {
  BODY_RADIUS_KM,
  EARTH_RADIUS_KM,
  SATELLITE_ORBIT_KM,
  SUN_RADIUS_KM,
  kmToScene,
  type RealSolarBodyId,
} from "./realBodyData";

/** 大きさを持つ太陽系の天体（太陽以外）の ID */
export type SizedSolarBodyId = RealSolarBodyId;

/**
 * 実際の半径（地球の赤道半径 = 1）です。
 * realBodyData.ts の半径（km）を地球の赤道半径 6,378.1 km で割って求めます（例：木星 71,492 ÷ 6,378.1 ≒ 11.21）。
 */
export const BODY_RADIUS_EARTH: Record<SizedSolarBodyId, number> = (() => {
  const ratios = {} as Record<SizedSolarBodyId, number>;
  for (const id of Object.keys(BODY_RADIUS_KM) as SizedSolarBodyId[]) {
    ratios[id] = BODY_RADIUS_KM[id] / EARTH_RADIUS_KM;
  }
  return ratios;
})();

/**
 * リアル太陽系モードでの実際の半径（シーン単位）を返します。
 * 例：地球 → 6,378.1 km ≒ 0.00058、木星 → 71,492 km ≒ 0.0065
 */
export function realSolarRadius(id: SizedSolarBodyId): number {
  return kmToScene(BODY_RADIUS_KM[id]);
}

/** リアル太陽系モードでの太陽の実際の半径（シーン単位、約 0.063） */
export const REAL_SOLAR_SUN_RADIUS = kmToScene(SUN_RADIUS_KM);

/** 天の北極視点などの簡易モードでの月の公転半径（地球の半径 = 1 のとき） */
export const SIMPLE_MODE_MOON_ORBIT_RADIUS = 3.45;

/** 月の実際の公転半径（地球の半径 = 1 のとき。384,400 ÷ 6,378.1 ≒ 60.3） */
export const REAL_MOON_ORBIT_IN_EARTH_RADII =
  SATELLITE_ORBIT_KM.moon / EARTH_RADIUS_KM;

/**
 * 木星の4衛星の、木星の中心からの実際の距離（木星の半径 = 1 とした倍率）を返します。
 * 例：イオ → 421,800 ÷ 71,492 ≒ 5.9、カリスト → 1,882,700 ÷ 71,492 ≒ 26.3
 */
export function galileanOrbitInJupiterRadii(
  id: "io" | "europa" | "ganymede" | "callisto"
): number {
  return SATELLITE_ORBIT_KM[id] / BODY_RADIUS_KM.jupiter;
}
