import type {
  City,
  CityObservation,
  MoonState,
  SolarSystemState,
  VenusState,
} from "../types/astronomy";

/** 1恒星日の長さ（秒）：遠い恒星を基準に地球が1回転（360°）するのにかかる時間（約23時間56分4秒） */
export const SIDEREAL_DAY_SECONDS = 86164.0905;

/** 1太陽日の長さ（秒）：太陽を基準に地球が1回転する平均時間（24時間ちょうど） */
export const SOLAR_DAY_SECONDS = 86400;

/** 地球の自転軸の傾き（赤道傾斜角・度）：J2000.0 時点の平均値 */
export const EARTH_AXIAL_TILT_DEG = 23.4392911;

/** 1朔望月の平均長さ（日）：新月から次の新月までの周期（約29.53日） */
export const SYNODIC_MONTH_DAYS = 29.530588853;

/** 1恒星月の平均長さ（日）：恒星に対して月が地球の周りを1周する周期（約27.32日） */
export const SIDEREAL_MONTH_DAYS = 27.321661;

/** 月の公転軌道面（白道）と黄道面の傾き（度）：約5.145° */
export const MOON_ORBIT_INCLINATION_DEG = 5.145;

/** 1太陽年（春分から次の春分までの回帰年・日）：約365.24219日 */
export const TROPICAL_YEAR_DAYS = 365.24219;

/** 金星の軌道長半径（天文単位 AU：地球 = 1.0 AU） */
export const VENUS_ORBIT_RADIUS_AU = 0.723332;

/** 金星の恒星公転周期（日）：約224.70日 */
export const VENUS_SIDEREAL_PERIOD_DAYS = 224.7008;

/** 金星の軌道傾斜角（黄道面に対する傾き・度）：約3.395° */
export const VENUS_ORBIT_INCLINATION_DEG = 3.3947;

/** 金星の昇交点黄経（J2000.0・度） */
export const VENUS_ASCENDING_NODE_DEG = 76.68;

/** 2000年1月1日 12:00 UTC（J2000.0 エポック）のユリウス日 */
const J2000_JULIAN_DAY = 2451545.0;

/** UNIX エポック（1970年1月1日 00:00 UTC）のユリウス日 */
const UNIX_EPOCH_JULIAN_DAY = 2440587.5;

/** 1日あたりのミリ秒数（24 * 60 * 60 * 1000） */
const MS_PER_DAY = SOLAR_DAY_SECONDS * 1000;

/** 16方位の日本語ラベル（北=0°から時計回り・22.5°刻み） */
const DIRECTIONS_16_JA = [
  "北",
  "北北東",
  "北東",
  "東北東",
  "東",
  "東南東",
  "南東",
  "南南東",
  "南",
  "南南西",
  "南西",
  "西南西",
  "西",
  "西北西",
  "北西",
  "北北西",
] as const;

/** 3次元ベクトルを表すタプル [x, y, z] */
export type Vector3Tuple = [number, number, number];

/** 太陽の天球上の位置を表す計算結果 */
export interface SolarPosition {
  /** 赤経（ラジアン：0 〜 2π 未満、春分点が 0） */
  rightAscensionRad: number;
  /** 赤緯（ラジアン：-π/2 〜 +π/2、天の赤道が 0） */
  declinationRad: number;
  /** 視黄経（度：0° 〜 360° 未満、0°=春分、90°=夏至、180°=秋分、270°=冬至） */
  eclipticLongitudeDeg: number;
}

/** 地球上のある地点における東西南北・天頂方向の単位ベクトル群 */
export interface LocalCompassVectors {
  /** 天頂方向（地面から真上に向かうベクトル） */
  up: Vector3Tuple;
  /** 真北方向（北極へ向かう接線ベクトル） */
  north: Vector3Tuple;
  /** 真東方向（地球の自転が進む向きの接線ベクトル） */
  east: Vector3Tuple;
  /** 真南方向（north の逆向き） */
  south: Vector3Tuple;
  /** 真西方向（east の逆向き） */
  west: Vector3Tuple;
}

/** UI の季節ジャンプボタン等で使う季節プリセットの定義 */
export interface SeasonPreset {
  /** プリセットの識別子 */
  id:
    | "vernal-equinox"
    | "summer-solstice"
    | "autumnal-equinox"
    | "winter-solstice";
  /** ボタン等に表示する季節名 */
  labelJa: string;
  /** この季節の天文的な見どころ */
  descriptionJa: string;
  /** ISO 8601 形式の UTC 日時文字列 */
  isoUtc: string;
  /** 対応する Date オブジェクト */
  date: Date;
}

/**
 * 2026年の春分・夏至・秋分・冬至の正確な瞬間に近い代表日時プリセットです。
 * 春分・秋分で太陽赤緯が約 0°、夏至・冬至でそれぞれ約 +23.4° / -23.4° になります。
 */
export const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: "vernal-equinox",
    labelJa: "春分",
    descriptionJa: "太陽赤緯が約0°になり、世界中の昼と夜の長さがほぼ等しくなります。",
    isoUtc: "2026-03-20T14:46:00Z",
    date: new Date("2026-03-20T14:46:00Z"),
  },
  {
    id: "summer-solstice",
    labelJa: "夏至",
    descriptionJa: "太陽赤緯が約+23.4°に達し、北極点や北極圏で太陽が沈まない白夜になります。",
    isoUtc: "2026-06-21T08:24:00Z",
    date: new Date("2026-06-21T08:24:00Z"),
  },
  {
    id: "autumnal-equinox",
    labelJa: "秋分",
    descriptionJa: "太陽赤緯が再び約0°に戻り、赤道直下で太陽が真上を通過します。",
    isoUtc: "2026-09-23T00:05:00Z",
    date: new Date("2026-09-23T00:05:00Z"),
  },
  {
    id: "winter-solstice",
    labelJa: "冬至",
    descriptionJa: "太陽赤緯が約-23.4°に達し、北極点や北極圏が一日中暗い極夜になります。",
    isoUtc: "2026-12-21T20:50:00Z",
    date: new Date("2026-12-21T20:50:00Z"),
  },
];

// --- 内部ユーティリティ関数（ファイル外へは公開しない補助処理） ---

/**
 * 任意の数値を [0, period) の範囲（0以上・period未満）に折り返します。
 * JavaScript の `%` は負の数で負の余りを返すため、2回余りを取って必ず正の範囲に収めます。
 */
function wrapPositive(value: number, period: number): number {
  const wrapped = ((value % period) + period) % period;
  // 浮動小数点の丸め誤差で period ちょうどになった場合や -0 を 0 に統一する
  return wrapped >= period || wrapped === 0 ? 0 : wrapped;
}

/**
 * 値を指定した最小値〜最大値の範囲に制限します（Math.asin 等の定義域外エラー防止用）。
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 2つの3次元ベクトルの内積を計算します。
 * 単位ベクトル同士の内積は、2つのベクトルのなす角 θ の cos(θ) に等しくなります。
 */
function dotProduct(a: Vector3Tuple, b: Vector3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * 球面上の角度（緯度・赤緯 latRad と経度・赤経 lonRad）を3次元直交座標へ変換する共通処理です。
 * 座標規約：北極が +Y、基準方向（経度0° / 春分点）が +X、+90°方向が -Z（+Yから見て反時計回り）。
 */
function sphericalRadToVector3Tuple(
  latRad: number,
  lonRad: number,
  radius: number
): Vector3Tuple {
  const cosLat = Math.cos(latRad);
  const x = radius * cosLat * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = -radius * cosLat * Math.sin(lonRad);
  return [x, y, z];
}

/**
 * 2つの角度（度）の最短の角度差（0° 〜 180°）を返します。
 * 例：359° と 1° の差は 358° ではなく 2° になります。
 */
function angularDistanceDeg(aDeg: number, bDeg: number): number {
  return Math.abs(wrapPositive(aDeg - bDeg + 180, 360) - 180);
}

/**
 * 整数を2桁のゼロ埋め文字列に変換します（例: 5 -> "05"）。
 */
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Date オブジェクトの UTC フィールドを使って "YYYY-MM-DD HH:MM:SS タイムゾーン" 形式に整形します。
 * UTC と JST（+9時間ずらした Date）の両方で同じ処理を使い回すための共通関数です。
 */
function formatUtcFieldsWithLabel(date: Date, zoneLabel: string): string {
  const year = date.getUTCFullYear();
  const month = pad2(date.getUTCMonth() + 1);
  const day = pad2(date.getUTCDate());
  const hours = pad2(date.getUTCHours());
  const minutes = pad2(date.getUTCMinutes());
  const seconds = pad2(date.getUTCSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${zoneLabel}`;
}

// --- 公開関数 ---

/**
 * 度数法（°）の角度を弧度法（ラジアン）に変換します。
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 弧度法（ラジアン）の角度を度数法（°）に変換します。
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 角度（ラジアン）を 0 〜 2π 未満（[0, 2π)）の範囲に正規化します。
 */
export function normalizeAngleRad(rad: number): number {
  return wrapPositive(rad, Math.PI * 2);
}

/**
 * 経度（度）を -180° 〜 +180° の範囲（[-180, 180)）に正規化します。
 * 東経がプラス、西経がマイナスになります。
 */
export function normalizeLonDeg(deg: number): number {
  const normalized = wrapPositive(deg + 180, 360) - 180;
  return normalized === 0 ? 0 : normalized;
}

/**
 * JavaScript の Date（UTC時刻）を天文学で使う連続した日数「ユリウス日」に変換します。
 * J2000.0（2000年1月1日 12:00:00 UTC）のユリウス日はちょうど 2451545.0 になります。
 */
export function dateToJulianDay(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JULIAN_DAY;
}

/**
 * ユリウス日からグリニッジ平均恒星時（GMST：ラジアン）を計算します。
 * GMST は「春分点から見て、本初子午線（経度0°）がどれだけ東へ回転しているか」を表す角度です。
 * 国際天文学連合（IAU）の J2000.0 基準の近似式を使用しています。
 */
export function calculateGmstRad(julianDay: number): number {
  // J2000.0 からの経過日数 d と、経過ユリウス世紀 T（1世紀 = 36525日）
  const d = julianDay - J2000_JULIAN_DAY;
  const T = d / 36525.0;

  const gmstDeg =
    280.46061837 +
    360.98564736629 * d +
    0.000387933 * T * T -
    (T * T * T) / 38710000;

  return normalizeAngleRad(degToRad(gmstDeg));
}

/**
 * Astronomical Almanac（天文年鑑）の近似式を用いて、指定ユリウス日の太陽の位置を計算します。
 * 1950〜2050年の範囲でおよそ 0.01°（1分角未満）の精度で赤経・赤緯・視黄経を求められます。
 */
export function calculateSolarPosition(julianDay: number): SolarPosition {
  const d = julianDay - J2000_JULIAN_DAY;

  // 1. 太陽の平均近点角 g（楕円軌道の近日点からの平均的な角度）
  const meanAnomalyDeg = wrapPositive(357.529 + 0.98560028 * d, 360);
  const meanAnomalyRad = degToRad(meanAnomalyDeg);

  // 2. 太陽の平均黄経 q（円軌道とみなした場合の黄道上の角度）
  const meanLongitudeDeg = wrapPositive(280.459 + 0.98564736 * d, 360);

  // 3. 楕円軌道による中心差の補正を加えて、見かけの黄経（視黄経 λ）を算出
  const eclipticLongitudeDeg = wrapPositive(
    meanLongitudeDeg +
      1.915 * Math.sin(meanAnomalyRad) +
      0.02 * Math.sin(2 * meanAnomalyRad),
    360
  );
  const eclipticLongitudeRad = degToRad(eclipticLongitudeDeg);

  // 4. 黄道傾斜角 ε（地球の赤道面と公転面＝黄道面の傾き）
  const obliquityDeg = EARTH_AXIAL_TILT_DEG - 0.00000036 * d;
  const obliquityRad = degToRad(obliquityDeg);

  // 5. 黄道座標（黄経 λ, 黄緯 β≈0）から赤道座標（赤経 α, 赤緯 δ）へ変換
  const cosLambda = Math.cos(eclipticLongitudeRad);
  const sinLambda = Math.sin(eclipticLongitudeRad);

  const rightAscensionRad = normalizeAngleRad(
    Math.atan2(Math.cos(obliquityRad) * sinLambda, cosLambda)
  );
  const declinationRad = Math.asin(
    clamp(Math.sin(obliquityRad) * sinLambda, -1, 1)
  );

  return {
    rightAscensionRad,
    declinationRad,
    eclipticLongitudeDeg,
  };
}

/**
 * 指定された日時の太陽・地球システム全体の状態（太陽位置、地球の回転角、太陽直下点、北極の昼夜）をまとめて計算します。
 */
export function calculateSolarSystemState(date: Date): SolarSystemState {
  const julianDay = dateToJulianDay(date);
  const gmstRad = calculateGmstRad(julianDay);
  const solar = calculateSolarPosition(julianDay);

  // 太陽直下点（太陽が真上に来る地点）の緯度は太陽の赤緯そのもの
  const subsolarLatDeg = radToDeg(solar.declinationRad);
  // 太陽直下点の経度は「太陽の赤経 - 本初子午線の回転角(GMST)」を -180〜+180° に収めた値
  const subsolarLonDeg = normalizeLonDeg(
    radToDeg(solar.rightAscensionRad - gmstRad)
  );

  // 北極点では太陽高度が赤緯と一致するため、赤緯の符号と大きさだけで白夜・極夜・春分秋分付近が決まる
  let northPoleDaylightState: SolarSystemState["northPoleDaylightState"];
  if (subsolarLatDeg > 0.5) {
    northPoleDaylightState = "polar-day";
  } else if (subsolarLatDeg < -0.5) {
    northPoleDaylightState = "polar-night";
  } else {
    northPoleDaylightState = "equinox-transition";
  }

  return {
    julianDay,
    gmstRad,
    sunRightAscensionRad: solar.rightAscensionRad,
    sunDeclinationRad: solar.declinationRad,
    sunEclipticLongitudeDeg: solar.eclipticLongitudeDeg,
    subsolarLatDeg,
    subsolarLonDeg,
    northPoleDaylightState,
  };
}

/**
 * 地球上の緯度・経度（度）を、地球ローカル3D空間の直交座標 [x, y, z] に変換します。
 * 座標規約：北極 = +Y、本初子午線（経度0°）= +X、東経90° = -Z（+Yから見て反時計回りに東経が増加）。
 */
export function latLonToVector3Tuple(
  latDeg: number,
  lonDeg: number,
  radius = 1
): Vector3Tuple {
  return sphericalRadToVector3Tuple(degToRad(latDeg), degToRad(lonDeg), radius);
}

/**
 * 天球上の赤経・赤緯（ラジアン）を、天球（慣性）3D空間の直交座標 [x, y, z] に変換します。
 * 座標規約：天の北極 = +Y、春分点（赤経0）= +X、赤経+90° = -Z。
 */
export function raDecToVector3Tuple(
  raRad: number,
  decRad: number,
  radius = 1
): Vector3Tuple {
  return sphericalRadToVector3Tuple(decRad, raRad, radius);
}

/**
 * 指定した緯度・経度の地点に立ったときの「真上(up)・北・東・南・西」の単位ベクトルを計算します。
 * `east × north = up` となる右手直交基底であり、極点（lat = ±90°）でもゼロ除算を起こさず安全に計算できます。
 */
export function getLocalCompassVectors(
  latDeg: number,
  lonDeg: number
): LocalCompassVectors {
  const phi = degToRad(latDeg);
  const lambda = degToRad(lonDeg);

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinLam = Math.sin(lambda);
  const cosLam = Math.cos(lambda);

  const up: Vector3Tuple = [cosPhi * cosLam, sinPhi, -cosPhi * sinLam];
  const east: Vector3Tuple = [-sinLam, 0, -cosLam];
  const north: Vector3Tuple = [-sinPhi * cosLam, cosPhi, sinPhi * sinLam];
  const south: Vector3Tuple = [-north[0], -north[1], -north[2]];
  const west: Vector3Tuple = [-east[0], -east[1], -east[2]];

  return { up, north, east, south, west };
}

/**
 * 太陽方位角（度：北=0°, 東=90°, 南=180°, 西=270°）を日本語の16方位文字列に変換します。
 */
export function azimuthToDirectionJa(azimuthDeg: number): string {
  if (!Number.isFinite(azimuthDeg)) {
    return "北";
  }
  const normalizedDeg = wrapPositive(azimuthDeg, 360);
  // 各方位は ±11.25° の幅を持つため、11.25° 足してから 22.5° で割ると対応する添字が得られる
  const index = Math.floor((normalizedDeg + 11.25) / 22.5) % 16;
  return DIRECTIONS_16_JA[index];
}

/**
 * ある都市（または観測点）から現在の太陽が「どの高さ・どの方角」に見え、今が何時頃かを計算します。
 */
export function observeCity(
  city: City,
  state: SolarSystemState
): CityObservation {
  // 地球を固定した座標系での太陽の方向ベクトル（経度方向は「太陽の赤経 - GMST」）
  const sunLocal = raDecToVector3Tuple(
    state.sunRightAscensionRad - state.gmstRad,
    state.sunDeclinationRad,
    1
  );
  const { up, north, east } = getLocalCompassVectors(city.latDeg, city.lonDeg);

  // 真上ベクトルとの内積 = sin(太陽高度角)
  const sinAltitude = clamp(dotProduct(sunLocal, up), -1, 1);
  const solarAltitudeDeg = radToDeg(Math.asin(sinAltitude));

  // 北方向成分・東方向成分への射影から、北=0°・東=90°の時計回り方位角を計算
  const northComponent = dotProduct(sunLocal, north);
  const eastComponent = dotProduct(sunLocal, east);
  const azimuthRad = normalizeAngleRad(Math.atan2(eastComponent, northComponent));
  const solarAzimuthDeg = wrapPositive(radToDeg(azimuthRad), 360);

  // 太陽の時角 H（その地点の子午線から太陽がどれだけ西へ過ぎたか）から地方太陽時（0〜24時間）を算出
  // H = 0（正午）のとき 12.0 時間、地球は15°あたり1時間自転する
  const hourAngleRad =
    state.gmstRad + degToRad(city.lonDeg) - state.sunRightAscensionRad;
  const localSolarHours = wrapPositive(radToDeg(hourAngleRad) / 15 + 12, 24);

  // 太陽高度角に応じた昼・薄明（市民薄明の目安 -6°〜0°）・夜の判定
  let daylightPhase: CityObservation["daylightPhase"];
  if (solarAltitudeDeg > 0) {
    daylightPhase = "day";
  } else if (solarAltitudeDeg > -6) {
    daylightPhase = "twilight";
  } else {
    daylightPhase = "night";
  }

  return {
    city,
    solarAltitudeDeg,
    solarAzimuthDeg,
    solarDirectionJa: azimuthToDirectionJa(solarAzimuthDeg),
    localSolarHours,
    daylightPhase,
  };
}

/**
 * 小数の時間（0〜24時間）を "HH:MM" 形式の時刻文字列に整形します（例: 12.5 -> "12:30"）。
 */
export function formatHoursToClock(hours: number): string {
  if (!Number.isFinite(hours)) {
    return "--:--";
  }
  const normalizedHours = wrapPositive(hours, 24);
  // 四捨五入で 1440分（24:00）になった場合は 00:00 へ折り返す
  const totalMinutes = Math.round(normalizedHours * 60) % (24 * 60);
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

/**
 * Date を UI 表示用の UTC（協定世界時）文字列と JST（日本標準時：UTC+9時間）文字列に整形します。
 */
export function formatDateTimeParts(date: Date): {
  utcText: string;
  jstText: string;
} {
  const jstDate = new Date(date.getTime() + 9 * 3600 * 1000);
  return {
    utcText: formatUtcFieldsWithLabel(date, "UTC"),
    jstText: formatUtcFieldsWithLabel(jstDate, "JST"),
  };
}

/**
 * 太陽の視黄経（0°〜360°）から現在の季節ラベル（春分付近・春夏秋冬の区分）を日本語で返します。
 */
export function getSeasonLabelJa(eclipticLongitudeDeg: number): string {
  const lambda = wrapPositive(eclipticLongitudeDeg, 360);

  // 分点・至点（0°, 90°, 180°, 270°）から ±3° 以内を「付近」として優先表示する
  if (angularDistanceDeg(lambda, 0) <= 3) {
    return "春分付近";
  }
  if (angularDistanceDeg(lambda, 90) <= 3) {
    return "夏至付近";
  }
  if (angularDistanceDeg(lambda, 180) <= 3) {
    return "秋分付近";
  }
  if (angularDistanceDeg(lambda, 270) <= 3) {
    return "冬至付近";
  }

  if (lambda < 90) {
    return "春";
  }
  if (lambda < 180) {
    return "夏";
  }
  if (lambda < 270) {
    return "秋";
  }
  return "冬";
}

/**
 * 太陽と月の黄経差（月相角：0°=新月, 90°=上弦, 180°=満月, 270°=下弦）から日本語の月相名を返します。
 */
export function getMoonPhaseLabelJa(phaseAngleDeg: number): string {
  const angle = wrapPositive(phaseAngleDeg, 360);
  if (angle < 11.25 || angle >= 348.75) {
    return "新月";
  }
  if (angle < 78.75) {
    return "三日月";
  }
  if (angle < 101.25) {
    return "上弦の月";
  }
  if (angle < 168.75) {
    return "満ちていく月";
  }
  if (angle < 191.25) {
    return "満月";
  }
  if (angle < 258.75) {
    return "欠けていく月";
  }
  if (angle < 281.25) {
    return "下弦の月";
  }
  return "有明の月";
}

/**
 * 指定された日時の月の黄道座標（視黄経・視黄緯・昇交点黄経）と満ち欠け（月相角・輝面比・月齢）を計算します。
 * Astronomical Almanac の低精度月位置近似式を使用しています。
 */
export function calculateMoonState(
  date: Date,
  sunEclipticLongitudeDeg?: number
): MoonState {
  const julianDay = dateToJulianDay(date);
  const d = julianDay - J2000_JULIAN_DAY;

  // 1. 月の平均黄経 L0、平均近点角 M、昇交点からの平均引数 F
  const meanLongitudeDeg = wrapPositive(218.316 + 13.176396 * d, 360);
  const meanAnomalyDeg = wrapPositive(134.963 + 13.064993 * d, 360);
  const argumentOfLatitudeDeg = wrapPositive(93.272 + 13.22935 * d, 360);

  // 2. 楕円軌道の主要項（中心差）を加えた視黄経と、白道の傾きによる視黄緯
  const eclipticLongitudeDeg = wrapPositive(
    meanLongitudeDeg + 6.289 * Math.sin(degToRad(meanAnomalyDeg)),
    360
  );
  const eclipticLatitudeDeg =
    5.128 * Math.sin(degToRad(argumentOfLatitudeDeg));
  const ascendingNodeDeg = wrapPositive(
    meanLongitudeDeg - argumentOfLatitudeDeg,
    360
  );

  // 3. 太陽の視黄経との差から月相角・輝面比・月齢を算出
  const sunLon =
    sunEclipticLongitudeDeg ?? calculateSolarPosition(julianDay).eclipticLongitudeDeg;
  const phaseAngleDeg = wrapPositive(eclipticLongitudeDeg - sunLon, 360);
  const illumination = (1 - Math.cos(degToRad(phaseAngleDeg))) / 2;
  const moonAgeDays = (phaseAngleDeg / 360) * SYNODIC_MONTH_DAYS;

  // 4. 楕円軌道による見かけの視直径比（太陽=1.0基準：近地点 cosM>0 で約1.075、遠地点 cosM<0 で約0.925）と日食・月食判定
  const cosAnomaly = Math.cos(degToRad(meanAnomalyDeg));
  const apparentSizeRatio = 1.0 + 0.075 * cosAnomaly;

  const deltaNewLonDeg = normalizeLonDeg(phaseAngleDeg);
  const solarSepDeg = Math.hypot(deltaNewLonDeg, eclipticLatitudeDeg);

  const deltaFullLonDeg = normalizeLonDeg(phaseAngleDeg - 180);
  const lunarSepDeg = Math.hypot(deltaFullLonDeg, eclipticLatitudeDeg);

  let solarEclipseType: MoonState["solarEclipseType"] = "none";
  let lunarEclipseType: MoonState["lunarEclipseType"] = "none";
  let eclipseObscuration = 0;
  let eclipseOffsetDeg: [number, number] = [0, 0];
  let phaseLabelJa = getMoonPhaseLabelJa(phaseAngleDeg);

  if (solarSepDeg <= 1.65) {
    eclipseOffsetDeg = [deltaNewLonDeg, eclipticLatitudeDeg];
    if (solarSepDeg <= 0.48 && Math.abs(deltaNewLonDeg) <= 0.35) {
      if (apparentSizeRatio >= 1.0) {
        solarEclipseType = "total";
        phaseLabelJa = "新月（皆既日食）";
        eclipseObscuration = 1.0;
      } else {
        solarEclipseType = "annular";
        phaseLabelJa = "新月（金環日食）";
        eclipseObscuration = clamp(apparentSizeRatio * apparentSizeRatio, 0.82, 0.96);
      }
    } else {
      solarEclipseType = "partial";
      phaseLabelJa = "新月（部分日食）";
      eclipseObscuration = clamp(1.0 - (solarSepDeg - 0.25) / 1.45, 0.1, 0.82);
    }
  } else if (lunarSepDeg <= 1.65) {
    eclipseOffsetDeg = [deltaFullLonDeg, eclipticLatitudeDeg];
    if (lunarSepDeg <= 0.45) {
      lunarEclipseType = "total";
      phaseLabelJa = "満月（皆既月食）";
      eclipseObscuration = clamp(1.0 - (lunarSepDeg / 0.45) * 0.12, 0.88, 1.0);
    } else if (lunarSepDeg <= 1.05) {
      lunarEclipseType = "partial";
      phaseLabelJa = "満月（部分月食）";
      eclipseObscuration = clamp(1.0 - (lunarSepDeg - 0.45) / 0.65, 0.2, 0.85);
    } else {
      lunarEclipseType = "penumbral";
      phaseLabelJa = "満月（半影月食）";
      eclipseObscuration = clamp(1.0 - (lunarSepDeg - 1.05) / 0.65, 0.1, 0.45);
    }
  }

  return {
    eclipticLongitudeDeg,
    eclipticLatitudeDeg,
    ascendingNodeDeg,
    phaseAngleDeg,
    illumination,
    moonAgeDays,
    phaseLabelJa,
    apparentSizeRatio,
    solarEclipseType,
    lunarEclipseType,
    eclipseObscuration,
    eclipseOffsetDeg,
  };
}

/**
 * 現在時刻から「常に未来方向へ」次に訪れる指定季節（春分・夏至・秋分・冬至）の日時を返します。
 * すでにその季節の直前・直後（12時間未満）にある場合は、1太陽年後の次の同じ季節を返します。
 */
export function getNextSeasonDate(
  fromDate: Date,
  seasonId: SeasonPreset["id"]
): Date {
  const preset = SEASON_PRESETS.find((p) => p.id === seasonId);
  if (!preset) {
    return new Date(fromDate.getTime());
  }

  const tropicalYearMs = TROPICAL_YEAR_DAYS * MS_PER_DAY;
  const minForwardMs = 12 * 3600 * 1000;
  const fromMs = fromDate.getTime();
  const baseMs = preset.date.getTime();

  const cycles = Math.ceil((fromMs - baseMs) / tropicalYearMs);
  let targetMs = baseMs + cycles * tropicalYearMs;
  if (targetMs - fromMs < minForwardMs) {
    targetMs += tropicalYearMs;
  }

  return new Date(targetMs);
}

/**
 * 指定された日時の金星の位置（日心・地心黄道座標）と、地球からの見え方（離角・輝面比・明け/宵の明星）を計算します。
 * J2000.0 の平均軌道要素（NASA JPL / Astronomical Almanac 準拠）を使用しています。
 */
export function calculateVenusState(
  date: Date,
  sunEclipticLongitudeDeg?: number
): VenusState {
  const julianDay = dateToJulianDay(date);
  const d = julianDay - J2000_JULIAN_DAY;

  // 1. 金星の日心平均黄経 L_v、近日点黄経 ϖ_v、平均近点角 M_v（離心率 e ≈ 0.006773）
  const meanLonDeg = wrapPositive(181.979801 + 1.60213034 * d, 360);
  const perihelionLonDeg = 131.5637;
  const meanAnomalyRad = degToRad(wrapPositive(meanLonDeg - perihelionLonDeg, 360));

  // 楕円軌道による中心差（2e ≈ 0.776°）を加えた真の日心黄経と太陽距離
  const helioLonDeg = wrapPositive(
    meanLonDeg + 0.776 * Math.sin(meanAnomalyRad),
    360
  );
  const rAu = VENUS_ORBIT_RADIUS_AU * (1 - 0.006773 * Math.cos(meanAnomalyRad));

  // 黄道面に対する軌道傾斜角（約 3.395°）と昇交点黄経から日心黄緯を算出
  const argLatRad = degToRad(wrapPositive(helioLonDeg - VENUS_ASCENDING_NODE_DEG, 360));
  const inclRad = degToRad(VENUS_ORBIT_INCLINATION_DEG);
  const helioLatRad = Math.asin(
    clamp(Math.sin(inclRad) * Math.sin(argLatRad), -1, 1)
  );
  const helioLatDeg = radToDeg(helioLatRad);

  // 2. 太陽中心の右手黄道直交座標（+X=春分点, +Y=黄道北極, -Z=黄経90°）
  const helioLonRad = degToRad(helioLonDeg);
  const cosHelioLat = Math.cos(helioLatRad);
  const vx = rAu * cosHelioLat * Math.cos(helioLonRad);
  const vy = rAu * Math.sin(helioLatRad);
  const vz = -rAu * cosHelioLat * Math.sin(helioLonRad);

  // 地球の太陽中心座標（太陽視黄経 λ_sun の反対側 1.0 AU）
  const sunLonDeg =
    sunEclipticLongitudeDeg ??
    calculateSolarPosition(julianDay).eclipticLongitudeDeg;
  const sunLonRad = degToRad(sunLonDeg);
  const ex = -Math.cos(sunLonRad);
  const ey = 0;
  const ez = Math.sin(sunLonRad);

  // 3. 地球から金星へのベクトル（地心座標・距離・地心黄経/黄緯）
  const dx = vx - ex;
  const dy = vy - ey;
  const dz = vz - ez;
  const distanceAu = Math.hypot(dx, dy, dz);

  const geoLonDeg = wrapPositive(radToDeg(Math.atan2(-dz, dx)), 360);
  const geoLatDeg = radToDeg(Math.asin(clamp(dy / distanceAu, -1, 1)));

  // 4. 太陽からの符号付き離角（東がプラス＝夕方の西の空「宵の明星」、西がマイナス＝明け方の東の空「明けの明星」）
  const elongationDeg = normalizeLonDeg(geoLonDeg - sunLonDeg);

  // 5. 金星から見た太陽方向 (-v) と地球方向 (-d) のなす角（位相角）から輝面比を算出
  const dotSunEarth = (-vx * -dx + -vy * -dy + -vz * -dz) / (rAu * distanceAu);
  const illumination = clamp((1 + dotSunEarth) * 0.5, 0, 1);

  let visibilityLabelJa: string;
  if (Math.abs(elongationDeg) < 8) {
    visibilityLabelJa = distanceAu < 1.0 ? "内合付近（太陽の正面）" : "外合付近（太陽の裏側）";
  } else if (elongationDeg > 0) {
    visibilityLabelJa = "宵の明星（西の空）";
  } else {
    visibilityLabelJa = "明けの明星（東の空）";
  }

  return {
    heliocentricLongitudeDeg: helioLonDeg,
    heliocentricLatitudeDeg: helioLatDeg,
    geocentricLongitudeDeg: geoLonDeg,
    geocentricLatitudeDeg: geoLatDeg,
    distanceAu,
    elongationDeg,
    illumination,
    visibilityLabelJa,
  };
}

/** 再生倍率（時間/s）に応じてスケーリングされた下部タイムスライダーの設定 */
export interface TimeSliderScale {
  /** スライダーのレンジ種別（1日 / 1ヶ月 / 1年 / 50年） */
  mode: "day" | "month" | "year" | "half-century";
  /** スライダー横に表示する短いレンジ名（例: 1日 / 1ヶ月 / 1年 / 50年） */
  rangeBadgeJa: string;
  /** レンジ開始時刻（UTC ミリ秒） */
  startMs: number;
  /** レンジ終了時刻（UTC ミリ秒） */
  endMs: number;
  /** スライダー最大値（min は常に 0） */
  max: number;
  /** 現在のスライダー値（0 〜 max） */
  value: number;
  /** 1ステップあたりのミリ秒数 */
  stepMs: number;
  /** スライダー右端に表示する現在位置ラベル */
  label: string;
  /** アクセシビリティ・ツールチップ用の説明 */
  ariaLabel: string;
}

/**
 * 現在の再生倍率（speedMultiplier：秒/秒）に応じて、下部タイムスライダーの
 * 「間隔（レンジ＆刻み幅）」と「つまみの進む速さ」を自動でスケーリングします。
 * どの速度でもつまみが約 12〜50 秒で1周する落ち着いた進行速度になります。
 */
export function getTimeSliderScale(
  date: Date,
  speedMultiplier: number
): TimeSliderScale {
  const curMs = date.getTime();
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();

  // 1. 自転観察帯域（1× / 30分/s / 2時間/s）：1日（24時間・1分刻み）
  if (speedMultiplier < SOLAR_DAY_SECONDS) {
    const startMs = Date.UTC(y, m, d, 0, 0, 0, 0);
    const endMs = startMs + MS_PER_DAY;
    const stepMs = 60 * 1000;
    const max = 1439;
    const value = Math.max(0, Math.min(max, hh * 60 + mm));
    return {
      mode: "day",
      rangeBadgeJa: "1日",
      startMs,
      endMs,
      max,
      value,
      stepMs,
      label: `UTC ${pad2(hh)}:${pad2(mm)}`,
      ariaLabel: "1日の時刻スライダー（24時間・1分刻み）",
    };
  }

  // 2. 1日/s 帯域（月・内惑星公転）：1ヶ月（当月1日〜月末・2時間刻み、約30秒で1周）
  if (speedMultiplier < SOLAR_DAY_SECONDS * 10) {
    const startMs = Date.UTC(y, m, 1, 0, 0, 0, 0);
    const endMs = Date.UTC(y, m + 1, 1, 0, 0, 0, 0);
    const stepMs = 2 * 3600 * 1000;
    const max = Math.max(1, Math.floor((endMs - startMs) / stepMs) - 1);
    const value = Math.max(0, Math.min(max, Math.floor((curMs - startMs) / stepMs)));
    return {
      mode: "month",
      rangeBadgeJa: "1ヶ月",
      startMs,
      endMs,
      max,
      value,
      stepMs,
      label: `${pad2(m + 1)}月 ${pad2(d)}日`,
      ariaLabel: "1ヶ月の日付スライダー（当月1日〜月末・2時間刻み）",
    };
  }

  // 3. 10日/s・30日/s 帯域（地球・木星公転）：1年（当年1月1日〜12月31日・1日刻み、約12〜36秒で1周）
  if (speedMultiplier < 31557600) {
    const startMs = Date.UTC(y, 0, 1, 0, 0, 0, 0);
    const endMs = Date.UTC(y + 1, 0, 1, 0, 0, 0, 0);
    const stepMs = MS_PER_DAY;
    const max = Math.max(1, Math.floor((endMs - startMs) / stepMs) - 1);
    const value = Math.max(0, Math.min(max, Math.floor((curMs - startMs) / stepMs)));
    return {
      mode: "year",
      rangeBadgeJa: "1年",
      startMs,
      endMs,
      max,
      value,
      stepMs,
      label: `${y}/${pad2(m + 1)}/${pad2(d)}`,
      ariaLabel: "1年の日付スライダー（1月1日〜12月31日・1日刻み）",
    };
  }

  // 4. 1年/s 帯域（外惑星・冥王星）：50年レンジ（1ヶ月刻み、50秒で1周）
  const blockStartYear = Math.floor(y / 50) * 50;
  const startMs = Date.UTC(blockStartYear, 0, 1, 0, 0, 0, 0);
  const endMs = Date.UTC(blockStartYear + 50, 0, 1, 0, 0, 0, 0);
  const max = 600;
  const stepMs = (endMs - startMs) / max;
  const value = Math.max(0, Math.min(max, Math.floor((curMs - startMs) / stepMs)));
  return {
    mode: "half-century",
    rangeBadgeJa: "50年",
    startMs,
    endMs,
    max,
    value,
    stepMs,
    label: `${y}年 ${pad2(m + 1)}月`,
    ariaLabel: `50年タイムスライダー（${blockStartYear}年〜${blockStartYear + 50}年・約1ヶ月刻み）`,
  };
}

/**
 * 指定された日時の日本時間（JST）のカレンダー日付を維持したまま、指定の時刻（既定 21:00 JST）へ合わせます。
 * 星の年周運動を観察するときに、夜の同じ時刻へ揃えるために使用します。
 */
export function snapDateToJstHour(date: Date, jstHour = 21): Date {
  const jstMs = date.getTime() + 9 * 3_600_000;
  const jst = new Date(jstMs);
  const utcMs =
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate(),
      jstHour,
      0,
      0,
      0
    ) -
    9 * 3_600_000;
  return new Date(utcMs);
}

/**
 * 年周運動観察モード用：通常の自転（24時間周期の昼夜点滅）だけを滑らかに相殺し、
 * 毎日同じ時刻（既定 21:00 JST）で公転によって星座が1日あたり約0.9856°（1ヶ月約30°）ずつ
 * 連続的に移動する地球姿勢（GMST・太陽直下点経度）を算出します。
 */
export function applyAnnualFixedHourLock(
  state: SolarSystemState,
  date: Date,
  fixedJstHour = 21
): SolarSystemState {
  const MS_PER_DAY = 86_400_000;
  const shiftMs = (9 - fixedJstHour) * 3_600_000;
  const shifted = date.getTime() + shiftMs;
  const fracDay = (((shifted % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY) / MS_PER_DAY;
  const lockedGmstRad = normalizeAngleRad(state.gmstRad - fracDay * Math.PI * 2);
  const lockedSubsolarLonDeg = normalizeLonDeg(
    radToDeg(state.sunRightAscensionRad - lockedGmstRad)
  );
  return {
    ...state,
    gmstRad: lockedGmstRad,
    subsolarLonDeg: lockedSubsolarLonDeg,
  };
}
