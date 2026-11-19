/**
 * 天体の大きさ（表示半径）と、画面に描くときの誇張のしかたを1か所で決めるモジュールです。
 *
 * 3D シーンの長さの単位は「地球の半径 = 1」です（簡易モード）。
 * リアル太陽系モードでは、惑星・月・木星4衛星を「実際の半径 × REAL_SOLAR_PLANET_SCALE」で描き、
 * 惑星どうしの大きさを実際の比率にそろえます。
 * 太陽だけは実際の比率（地球の約109倍）で描くと水星の軌道まで飲み込んでしまうため、別の縮尺にします。
 *
 * ここで決めるのは「見せ方」だけです。衝突シミュレーターの物理計算は realBodyData.ts の実際の値を使います。
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
 * リアル太陽系モードでの表示半径（シーン単位）を返します。
 * 例：地球 → 1 × 0.277 = 0.277、木星 → 11.21 × 0.277 = 3.1
 */
export function realSolarDisplayRadius(id: SizedSolarBodyId): number {
  return BODY_RADIUS_EARTH[id] * REAL_SOLAR_PLANET_SCALE;
}

/**
 * 実際の半径（km）を、惑星と同じ縮尺（REAL_SOLAR_PLANET_SCALE）の表示半径に直します。
 * 月サイズ・火星サイズなど、惑星と同じ種類の投入天体に使います。
 */
export function planetScaleDisplayRadiusFromKm(radiusKm: number): number {
  return (radiusKm / EARTH_RADIUS_KM) * REAL_SOLAR_PLANET_SCALE;
}

/**
 * 実際の半径（km）を、太陽と同じ別縮尺（太陽 = REAL_SOLAR_SUN_RADIUS）の表示半径に直します。
 * 赤色矮星・太陽クラス恒星・青色超巨星など、恒星の投入天体に使います。
 */
export function starScaleDisplayRadiusFromKm(radiusKm: number): number {
  return (radiusKm / SUN_RADIUS_KM) * REAL_SOLAR_SUN_RADIUS;
}

// ---------------------------------------------------------------------------
// 衛星の位置の誇張（見せ方だけ）
// ---------------------------------------------------------------------------

/**
 * 衛星は、実際の距離のままだと母惑星の絵（拡大して描いている）の内側に入ってしまいます。
 * そこで「母惑星からのずれ × 系ごとに1つの倍率」の位置に描きます。
 * 同じ母惑星の衛星どうしは同じ倍率なので、母惑星からの距離の比は実際のままです。
 */

/** 月の実際の距離（シーン単位、約 0.0347） */
const MOON_ORBIT_SCENE = kmToScene(SATELLITE_ORBIT_KM.moon);

/**
 * 地球と月の系の誇張倍率（約 27.5）です。
 * 月が簡易モードと同じ見た目の位置（公転半径 3.45 × 0.277 ≒ 0.954）に来るように決めています。
 */
export const EARTH_SYSTEM_DISPLAY_FACTOR =
  (SIMPLE_MODE_MOON_ORBIT_RADIUS * REAL_SOLAR_PLANET_SCALE) / MOON_ORBIT_SCENE;

/** 木星の中心からイオを描く距離（描いた木星の半径の何倍か）。木星の絵のすぐ外側に見えるようにします */
const IO_DISPLAY_ORBIT_IN_JUPITER_RADII = 1.5;

/**
 * 木星と4衛星の系の誇張倍率（約 122）です。
 * イオが描いた木星の半径の 1.5 倍の位置に来るように決め、ほかの3衛星も同じ倍率で描きます
 * （エウロパ 約2.4倍、ガニメデ 約3.8倍、カリスト 約6.7倍。実際の距離の比のとおり）。
 */
export const JUPITER_SYSTEM_DISPLAY_FACTOR =
  (IO_DISPLAY_ORBIT_IN_JUPITER_RADII * REAL_SOLAR_JUPITER_RADIUS) /
  kmToScene(SATELLITE_ORBIT_KM.io);

/**
 * 木星の4衛星を描く距離を、描いた木星の半径の何倍かで返します（木星の模型の中での配置に使います）。
 * 例：カリスト → 1,882,700 km × 倍率 ÷ 描いた木星の半径 ≒ 6.7
 */
export function galileanDisplayOrbitInJupiterRadii(
  id: "io" | "europa" | "ganymede" | "callisto"
): number {
  return (
    (kmToScene(SATELLITE_ORBIT_KM[id]) * JUPITER_SYSTEM_DISPLAY_FACTOR) /
    REAL_SOLAR_JUPITER_RADIUS
  );
}
