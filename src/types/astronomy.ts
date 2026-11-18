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
  | "oblique"
  | "eclipticNorth"
  | "eclipticPlane";

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
}
