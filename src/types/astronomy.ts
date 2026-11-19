/**
 * 天文計算・3D表示・UI全体で共有する型定義をまとめたファイルです。
 */

/** 地球の見た目（ビジュアルモード）の種類 */
export type VisualStyle = "realistic" | "diagram";

/** 基準にする座標系（何を画面内で固定して見せるか） */
export type ReferenceFrame = "solar" | "sidereal";

/** カメラのプリセット視点 */
export type CameraPreset =
  | "northPole"
  | "eclipticPlane"
  | "moonNorthPole"
  | "moonEclipticPlane"
  | "sunOverhead"
  | "sunEclipticOblique"
  | "tokyoNorth"
  | "tokyoEast"
  | "tokyoSouth"
  | "tokyoWest"
  | "solarInner"
  | "solarJupiter"
  | "solarFullTop"
  | "solarFullOblique";

/** 木星の主要4衛星（ガリレオ衛星）の識別子 */
export type GalileanMoonId = "io" | "europa" | "ganymede" | "callisto";

/** 木星の主要4衛星（ガリレオ衛星）の瞬間状態 */
export interface GalileanMoonState {
  id: GalileanMoonId;
  nameJa: string;
  /** 公転周期（日） */
  periodDays: number;
  /** 木星中心からの軌道半径（木星半径 R_J 倍） */
  orbitRadiusRj: number;
  /** 現在の公転位相角（度：0°〜360°） */
  angleDeg: number;
  /** 代表カラー（HEX文字列） */
  color: string;
}

/** リアル太陽系モードで扱う9天体（水金地火木土天海冥）の識別子 */
export type SolarBodyId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

/** リアル太陽系モードにおける各天体の瞬間状態（日心黄道座標・AU単位） */
export interface SolarSystemBodyState {
  id: SolarBodyId;
  nameJa: string;
  symbol: string;
  /** 軌道長半径 (AU) */
  semiMajorAxisAu: number;
  /** 軌道離心率 */
  eccentricity: number;
  /** 黄道面に対する軌道傾斜角（度） */
  inclinationDeg: number;
  /** 恒星公転周期（年） */
  orbitalPeriodYears: number;
  /** 現在の太陽からの距離 (AU) */
  distanceFromSunAu: number;
  /** 現在の日心黄経（度：0°〜360° 未満） */
  heliocentricLongitudeDeg: number;
  /** 現在の日心黄緯（度） */
  heliocentricLatitudeDeg: number;
  /** 日心黄道直交座標 [x, y, z] (AU、+X=春分点, +Y=黄道北極, -Z=黄経90°) */
  positionAu: [number, number, number];
  /** UI・軌道ライン用の代表カラー（HEX文字列） */
  accentColor: string;
}

/** 観測したい主要都市（または北極点）の定義 */
export interface City {
  /** 一意な識別子 */
  id: string;
  /** 画面に表示する日本語名 */
  nameJa: string;
  /** 補助表示用の英語名 */
  nameEn: string;
  /** 国・地域名 */
  regionJa: string;
  /** 緯度（度：北緯がプラス、南緯がマイナス） */
  latDeg: number;
  /** 経度（度：東経がプラス、西経がマイナス） */
  lonDeg: number;
  /** 標準時のUTCからの時差（時間） */
  utcOffsetHours: number;
  /** この地点で観察すると面白いポイント */
  noteJa: string;
}

/** ある瞬間における太陽の天球上の位置と地球の姿勢 */
export interface SolarSystemState {
  /** ユリウス日（天文学で使う連続した日数） */
  julianDay: number;
  /** グリニッジ平均恒星時（ラジアン：春分点に対する本初子午線の回転角） */
  gmstRad: number;
  /** 太陽の赤経（ラジアン） */
  sunRightAscensionRad: number;
  /** 太陽の赤緯（ラジアン：夏至で約+23.44°、冬至で約-23.44°） */
  sunDeclinationRad: number;
  /** 太陽の視黄経（度：0°が春分、90°が夏至、180°が秋分、270°が冬至） */
  sunEclipticLongitudeDeg: number;
  /** 太陽直下点（地球上で太陽が真上にある場所）の緯度（度） */
  subsolarLatDeg: number;
  /** 太陽直下点の経度（度） */
  subsolarLonDeg: number;
  /** 現在の北極点の太陽状態 */
  northPoleDaylightState: "polar-day" | "polar-night" | "equinox-transition";
}

/** 選択された都市の、ある瞬間における太陽の観測データ */
export interface CityObservation {
  city: City;
  /** 太陽高度角（度：0°より大きければ昼、-6°〜0°は薄明、-6°未満は夜） */
  solarAltitudeDeg: number;
  /** 太陽方位角（度：北=0°, 東=90°, 南=180°, 西=270°） */
  solarAzimuthDeg: number;
  /** 太陽方位を日本語で表したもの（例: 「東南東」） */
  solarDirectionJa: string;
  /** 現地地方太陽時（0〜24時間） */
  localSolarHours: number;
  /** 昼・薄明・夜の区分 */
  daylightPhase: "day" | "twilight" | "night";
}

/** 3D空間上のどの補助表示をオンにするか */
export interface DisplayLayers {
  /** 緯線・経線・赤道・北極圏(66.6°N)のガイド線 */
  graticule: boolean;
  /** 天の北極周りの角度目盛り・自転方向（反時計回り）の矢印 */
  celestialCompass: boolean;
  /** 太陽光線と昼夜境界（ターミネーター）の強調表示 */
  terminatorGuide: boolean;
  /** 都市マーカーと、選択都市の局所方位（N/E/S/W）ベクトル */
  cities: boolean;
  /** 恒星背景と春分点（♈）の基準方向ライン */
  starsAndEquinox: boolean;
  /** 公転面（黄道面：赤道面と約23.4°傾いた軌道面）のガイドリング */
  eclipticPlane: boolean;
  /** 月本体と白道（月の公転軌道）の表示 */
  moonAndOrbit: boolean;
  /** 金星本体と金星の公転軌道（内惑星）の表示 */
  venusAndOrbit: boolean;
}

/** ある瞬間における月の位置（黄道座標）と満ち欠けの状態 */
export interface MoonState {
  /** 月の視黄経（度：0°〜360° 未満） */
  eclipticLongitudeDeg: number;
  /** 月の視黄緯（度：白道の傾きにより約 -5.15°〜+5.15° の間で変化） */
  eclipticLatitudeDeg: number;
  /** 白道の昇交点黄経（度：月の軌道面が黄道面を南から北へ横切る方向） */
  ascendingNodeDeg: number;
  /** 太陽からの離角・月相角（度：0°=新月, 90°=上弦, 180°=満月, 270°=下弦） */
  phaseAngleDeg: number;
  /** 地球から見た月の輝面比（0.0 = 新月 〜 1.0 = 満月） */
  illumination: number;
  /** 平均朔望月に基づく月齢の目安（日：0 〜 29.53） */
  moonAgeDays: number;
  /** 月相の日本語名（例：「上弦の月」「満月」） */
  phaseLabelJa: string;
}

/** ある瞬間における金星の位置（日心・地心黄道座標）と見え方の状態 */
export interface VenusState {
  /** 金星の日心黄経（度：太陽から見た公転位置、0°〜360° 未満） */
  heliocentricLongitudeDeg: number;
  /** 金星の日心黄緯（度：軌道傾斜角 約3.39° による上下のズレ） */
  heliocentricLatitudeDeg: number;
  /** 地球から見た金星の地心黄経（度：0°〜360° 未満） */
  geocentricLongitudeDeg: number;
  /** 地球から見た金星の地心黄緯（度） */
  geocentricLatitudeDeg: number;
  /** 地球から金星までの距離（天文単位 AU：約0.28〜1.72 AU） */
  distanceAu: number;
  /** 太陽からの符号付き離角（度：プラス=太陽の東＝宵の明星、マイナス=太陽の西＝明けの明星） */
  elongationDeg: number;
  /** 地球から見た金星の輝面比（0.0 〜 1.0） */
  illumination: number;
  /** 日本語での見え方ラベル（明けの明星・宵の明星・内合付近・外合付近） */
  visibilityLabelJa: string;
}
