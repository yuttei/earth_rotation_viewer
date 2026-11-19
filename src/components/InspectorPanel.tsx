import React, { useState } from "react";
import {
  BookOpen,
  Compass,
  Globe,
  Layers,
  MapPin,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import {
  CameraPreset,
  City,
  DisplayLayers,
  GalileanMoonState,
  MoonState,
  ReferenceFrame,
  SolarSystemBodyState,
  SolarSystemState,
  VenusState,
} from "../types/astronomy";
import {
  formatDateTimeParts,
  formatHoursToClock,
  getSeasonLabelJa,
  observeCity,
  SEASON_PRESETS,
} from "../astronomy/calculations";
import { getSunAndMidnightZodiac } from "../astronomy/zodiac";
import { CelestialPhaseDiagram } from "./CelestialPhaseDiagram";

type InspectorTab = "city" | "display" | "guide";

export type GuideExperimentId =
  | "counterclockwise"
  | "summer-midnight-sun"
  | "winter-polar-night"
  | "sunrise-east"
  | "sidereal-vs-solar"
  | "ecliptic-tilt"
  | "sun-orbit-overview"
  | "moon-orbit-observe"
  | "venus-orbit-observe"
  | "tokyo-ground-sky"
  | "real-solar-system"
  | "zodiac-ecliptic-follow"
  | "zodiac-ecliptic-fixed";

interface InspectorPanelProps {
  isOpen: boolean;
  currentDate: Date;
  solarState: SolarSystemState;
  moonState: MoonState;
  venusState: VenusState;
  solarSystemBodies: SolarSystemBodyState[];
  galileanMoons: GalileanMoonState[];
  isRealSolarSystemMode: boolean;
  cities: City[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  cameraPreset: CameraPreset | null;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onResetNorthPoleCamera: () => void;
  viewTransitionRatio: number;
  onChangeViewTransitionRatio: (ratio: number) => void;
  referenceFrame: ReferenceFrame;
  onChangeReferenceFrame: (frame: ReferenceFrame) => void;
  layers: DisplayLayers;
  onToggleLayer: (key: keyof DisplayLayers) => void;
  onRunGuideExperiment: (id: GuideExperimentId) => void;
}

const LAYER_LABELS: Array<{ key: keyof DisplayLayers; label: string }> = [
  { key: "graticule", label: "経緯線・赤道・北極圏(66.6°N)" },
  { key: "celestialCompass", label: "天球目盛り・自転矢印(反時計回り)" },
  { key: "eclipticPlane", label: "黄道面（公転面）・公転軌道リング" },
  { key: "zodiacConstellations", label: "黄道12星座（13星座）と黄道ライン" },
  { key: "moonAndOrbit", label: "月本体と白道（月の公転軌道）" },
  { key: "venusAndOrbit", label: "金星と金星の公転軌道（内惑星）" },
  { key: "terminatorGuide", label: "太陽光線・昼夜境界ハイライト" },
  { key: "cities", label: "都市マーカー・現地N/E/S/W矢印" },
  { key: "starsAndEquinox", label: "恒星背景・春分点ライン(♈)" },
];

/**
 * 画面右側に配置する観察インスペクターパネルです。
 * 「地点・天体」「視点・表示」「学習ガイド」の3タブで都市・月・金星の観測、視点設定、学習実験を切り替えられます。
 */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  currentDate,
  solarState,
  moonState,
  venusState,
  solarSystemBodies,
  galileanMoons,
  isRealSolarSystemMode,
  cities,
  selectedCityId,
  onSelectCity,
  cameraPreset,
  onSelectCameraPreset,
  onResetNorthPoleCamera,
  viewTransitionRatio,
  onChangeViewTransitionRatio,
  referenceFrame,
  onChangeReferenceFrame,
  layers,
  onToggleLayer,
  onRunGuideExperiment,
}) => {
  // 視点移動を観察パネル内からすぐ操作できるよう「視点・表示」を初期タブにします。
  const [activeTab, setActiveTab] = useState<InspectorTab>("display");

  const { utcText, jstText } = formatDateTimeParts(currentDate);
  const seasonLabel = getSeasonLabelJa(solarState.sunEclipticLongitudeDeg);
  const declSign = solarState.subsolarLatDeg >= 0 ? "+" : "";
  const poleStateLabel = {
    "polar-day": "北極：白夜（ずっと昼）",
    "polar-night": "北極：極夜（ずっと夜）",
    "equinox-transition": "北極：昼夜の境界付近",
  }[solarState.northPoleDaylightState];

  const selectedCity =
    cities.find((c) => c.id === selectedCityId) ?? cities[0];
  const observation = observeCity(selectedCity, solarState);
  const { sunConstellation, midnightConstellation } = getSunAndMidnightZodiac(
    solarState.sunEclipticLongitudeDeg
  );
  const isEclipticSkyMode =
    cameraPreset === "earthEclipticFollow" ||
    cameraPreset === "earthEclipticFixed";

  const zodiacStatusCard = (
    <div className="section-card">
      <h2 className="section-title">
        <Sun size={13} />
        太陽の黄道位置（黄道13星座）
      </h2>
      <div className="observation-metrics">
        <div className="metric-box">
          <div className="metric-label">太陽がある星座 (IAU)</div>
          <div
            className="metric-val"
            style={{
              fontSize: 13,
              color: sunConstellation.isThirteenth ? "#e9d5ff" : "#fde68a",
            }}
          >
            {sunConstellation.symbol} {sunConstellation.nameJa}
            {sunConstellation.isThirteenth ? " (13)" : ""}
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">太陽の視黄経</div>
          <div className="metric-val">
            {solarState.sunEclipticLongitudeDeg.toFixed(1)}°
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">通過する時期 (目安)</div>
          <div className="metric-val" style={{ fontSize: 12 }}>
            {sunConstellation.dateRangeJa}
          </div>
        </div>
        <div className="metric-box">
          <div className="metric-label">真夜中に南中する星座</div>
          <div className="metric-val" style={{ fontSize: 12, color: "#bae6fd" }}>
            {midnightConstellation.symbol} {midnightConstellation.nameJa}
          </div>
        </div>
      </div>
      <p className="note-box" style={{ fontSize: 11 }}>
        地球の公転により、太陽は黄道上を1年で360°（西→東）移動します。現在の太陽と180°反対側にある「
        {midnightConstellation.nameJa}」が真夜中の南の空で見ごろです。
      </p>
    </div>
  );

  const phaseTextMap = {
    day: "昼（太陽光が当たっています）",
    twilight: "薄明（明け方・夕暮れ）",
    night: "夜（地球の影側です）",
  };

  const solarSystemOverviewCard = (
    <div className="section-card">
      <h2 className="section-title">
        <Sparkles size={13} />
        リアル太陽系 9天体・衛星（水〜冥）
      </h2>
      <div className="solar-body-list">
        {solarSystemBodies.map((body) => (
          <div key={body.id} className="solar-body-row">
            <span className="solar-body-name" style={{ color: body.accentColor }}>
              <span>{body.symbol}</span>
              <span>{body.nameJa}</span>
            </span>
            <span className="solar-body-meta">
              {body.distanceFromSunAu.toFixed(2)} AU ・ 傾 {body.inclinationDeg.toFixed(1)}°
            </span>
            <span className="solar-body-meta">
              {body.orbitalPeriodYears < 1
                ? `${Math.round(body.orbitalPeriodYears * 365.25)}日`
                : `${body.orbitalPeriodYears.toFixed(1)}年`}
            </span>
          </div>
        ))}
      </div>
      <div className="view-group-block" style={{ marginTop: 4 }}>
        <span className="view-group-label">木星の主要4衛星（ガリレオ衛星）</span>
        <div className="galilean-pill-grid">
          {galileanMoons.map((gm) => (
            <div key={gm.id} className="galilean-pill">
              <span style={{ color: gm.color, fontWeight: 600 }}>
                ◦ {gm.nameJa}
              </span>
              <span className="solar-body-meta">{gm.periodDays.toFixed(2)}日</span>
            </div>
          ))}
        </div>
      </div>
      <p className="note-box" style={{ fontSize: 11 }}>
        軌道半径・離心率・傾斜角は J2000.0 ケプラー軌道要素（1 AU 比例縮尺）で再現しています。地球は月、木星は主要4衛星を伴って公転します。
      </p>
    </div>
  );

  return (
    <aside
      className={`inspector-panel ${isOpen ? "" : "is-collapsed"}`}
      aria-label="観察パネル"
    >
      <div className="inspector-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "display"}
          className={`inspector-tab-btn ${activeTab === "display" ? "is-active" : ""}`}
          onClick={() => setActiveTab("display")}
        >
          <Layers size={13} />
          視点・表示
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "city"}
          className={`inspector-tab-btn ${activeTab === "city" ? "is-active" : ""}`}
          onClick={() => setActiveTab("city")}
        >
          <MapPin size={13} />
          地点・天体
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "guide"}
          className={`inspector-tab-btn ${activeTab === "guide" ? "is-active" : ""}`}
          onClick={() => setActiveTab("guide")}
        >
          <BookOpen size={13} />
          学習ガイド
        </button>
      </div>

      <div className="inspector-body">
        {activeTab === "city" && (
          <>
            <div className="section-card">
              <h2 className="section-title">
                <Sun size={13} />
                観測日時・季節
              </h2>
              <div className="observation-metrics">
                <div className="metric-box" style={{ gridColumn: "span 2" }}>
                  <div className="metric-label">日本時間 (JST) / UTC</div>
                  <div className="metric-val" style={{ fontSize: 12 }}>
                    {jstText}{" "}
                    <span style={{ opacity: 0.58 }}>/ {utcText.slice(11)}</span>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">太陽赤緯・季節</div>
                  <div className="metric-val" style={{ fontSize: 12.5 }}>
                    {declSign}
                    {solarState.subsolarLatDeg.toFixed(1)}° ({seasonLabel})
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">北極点の状態</div>
                  <div className="metric-val" style={{ fontSize: 11.5 }}>
                    {poleStateLabel.replace("北極：", "")}
                  </div>
                </div>
              </div>
            </div>
            {isEclipticSkyMode && zodiacStatusCard}
            {isRealSolarSystemMode && solarSystemOverviewCard}
            <div className="section-card">
              <h2 className="section-title">
                <Globe size={13} />
                観察地点を選択
              </h2>
              <div className="city-grid">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    className={`city-select-btn ${
                      city.id === selectedCity.id ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCity(city.id)}
                  >
                    <span>{city.nameJa}</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      {city.latDeg >= 0
                        ? `${Math.round(city.latDeg)}°N`
                        : `${Math.round(-city.latDeg)}°S`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">
                <Sun size={13} />
                {selectedCity.nameJa}（{selectedCity.regionJa}）
              </h2>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    observation.daylightPhase === "day"
                      ? "#fde68a"
                      : observation.daylightPhase === "twilight"
                        ? "#fdba74"
                        : "#93c5fd",
                }}
              >
                {phaseTextMap[observation.daylightPhase]}
              </div>

              <div className="observation-metrics">
                <div className="metric-box">
                  <div className="metric-label">地方太陽時</div>
                  <div className="metric-val">
                    {formatHoursToClock(observation.localSolarHours)}
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">太陽高度角</div>
                  <div className="metric-val">
                    {observation.solarAltitudeDeg >= 0 ? "+" : ""}
                    {observation.solarAltitudeDeg.toFixed(1)}°
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">太陽の方向</div>
                  <div className="metric-val">
                    {observation.solarDirectionJa}
                    <span style={{ fontSize: 11, opacity: 0.68, marginLeft: 4 }}>
                      ({Math.round(observation.solarAzimuthDeg)}°)
                    </span>
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">緯度 / 経度</div>
                  <div className="metric-val" style={{ fontSize: 12 }}>
                    {selectedCity.latDeg.toFixed(1)}°, {selectedCity.lonDeg.toFixed(1)}°
                  </div>
                </div>
              </div>

              <p className="note-box">{selectedCity.noteJa}</p>
              {Math.abs(selectedCity.latDeg) < 89.5 && (
                <p className="note-box" style={{ fontSize: 11, color: "#bae6fd" }}>
                  地表矢印：シアン＝東（自転方向）／ ピンク＝北
                </p>
              )}
            </div>

            {!isEclipticSkyMode && zodiacStatusCard}

            <div className="section-card">
              <h2 className="section-title">
                <Moon size={13} />
                月の観測状態（白道・満ち欠け）
              </h2>
              <div className="phase-preview-row">
                <CelestialPhaseDiagram
                  body="moon"
                  illumination={moonState.illumination}
                  litSide={moonState.phaseAngleDeg < 180 ? "right" : "left"}
                  ariaLabel={`現在の月の満ち欠け：${moonState.phaseLabelJa}（輝面比 ${Math.round(
                    moonState.illumination * 100
                  )}%）`}
                />
                <div className="phase-preview-meta">
                  <div className="phase-preview-title">
                    {moonState.phaseLabelJa}（{Math.round(moonState.illumination * 100)}%）
                  </div>
                  <div className="phase-preview-sub">
                    {moonState.illumination < 0.03
                      ? "ほぼ新月（太陽と同じ方向）"
                      : moonState.illumination > 0.97
                      ? "ほぼ満月（全面が光る）"
                      : moonState.phaseAngleDeg < 180
                      ? "地球から見て右側が光る（満ちていく時期）"
                      : "地球から見て左側が光る（欠けていく時期）"}
                  </div>
                </div>
              </div>
              <div className="observation-metrics">
                <div className="metric-box">
                  <div className="metric-label">月相</div>
                  <div className="metric-val" style={{ fontSize: 13 }}>
                    {moonState.phaseLabelJa}
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">月齢（目安）</div>
                  <div className="metric-val">
                    {moonState.moonAgeDays.toFixed(1)} 日
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">輝面比</div>
                  <div className="metric-val">
                    {Math.round(moonState.illumination * 100)}%
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">黄緯（白道の傾き）</div>
                  <div className="metric-val">
                    {moonState.eclipticLatitudeDeg >= 0 ? "+" : ""}
                    {moonState.eclipticLatitudeDeg.toFixed(1)}°
                  </div>
                </div>
              </div>
              <p className="note-box" style={{ fontSize: 11 }}>
                月は地球の周りを反時計回りに約27.3日で公転し、常に同じ面を地球に向けています。
              </p>
            </div>

            <div className="section-card">
              <h2 className="section-title">
                <Sparkles size={13} />
                金星の観測状態（内惑星）
              </h2>
              <div className="phase-preview-row">
                <CelestialPhaseDiagram
                  body="venus"
                  illumination={venusState.illumination}
                  litSide={venusState.elongationDeg >= 0 ? "right" : "left"}
                  distanceAu={venusState.distanceAu}
                  ariaLabel={`現在の金星の満ち欠け：${venusState.visibilityLabelJa}（輝面比 ${Math.round(
                    venusState.illumination * 100
                  )}%、距離 ${venusState.distanceAu.toFixed(2)} AU）`}
                />
                <div className="phase-preview-meta">
                  <div
                    className="phase-preview-title"
                    style={{ color: "#fef08a" }}
                  >
                    {venusState.visibilityLabelJa}
                  </div>
                  <div className="phase-preview-sub">
                    {Math.abs(venusState.elongationDeg) < 8
                      ? "太陽付近（点線円は最大視直径の目安）"
                      : venusState.elongationDeg >= 0
                      ? "右側が光る・距離に応じて見かけの大きさも変化"
                      : "左側が光る・距離に応じて見かけの大きさも変化"}
                  </div>
                </div>
              </div>
              <div className="observation-metrics">
                <div className="metric-box">
                  <div className="metric-label">太陽からの離角</div>
                  <div className="metric-val" style={{ fontSize: 13 }}>
                    {venusState.elongationDeg >= 0 ? "東 " : "西 "}
                    {Math.abs(venusState.elongationDeg).toFixed(1)}°
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">輝面比（満ち欠け）</div>
                  <div className="metric-val">
                    {Math.round(venusState.illumination * 100)}%
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">地球からの距離</div>
                  <div className="metric-val">
                    {venusState.distanceAu.toFixed(2)} AU
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-label">日心黄経</div>
                  <div className="metric-val">
                    {Math.round(venusState.heliocentricLongitudeDeg)}°
                  </div>
                </div>
              </div>
              <p className="note-box" style={{ fontSize: 11 }}>
                金星は地球の内側（0.72 AU）を約225日で公転するため、太陽から約47°以上離れず、明け方の東の空や夕方の西の空で輝きます。
              </p>
            </div>

            {!isRealSolarSystemMode && solarSystemOverviewCard}
          </>
        )}

        {activeTab === "display" && (
          <>
            <div className="section-card">
              <h2 className="section-title">
                <Compass size={13} />
                カメラ視点の連続移動
              </h2>

              <div className="view-group-block">
                <span className="view-group-label">地球の自転</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn ${
                      cameraPreset === "northPole" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("northPole")}
                  >
                    天の北極
                  </button>
                  <button
                    type="button"
                    className={`choice-btn ${
                      cameraPreset === "eclipticPlane" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("eclipticPlane")}
                  >
                    黄道面 (水平)
                  </button>
                </div>
              </div>

              <div className="view-group-block">
                <span className="view-group-label">月の公転・満ち欠け</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn moon-view-btn ${
                      cameraPreset === "moonNorthPole" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("moonNorthPole")}
                  >
                    <Moon size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                    天の北極 (真上)
                  </button>
                  <button
                    type="button"
                    className={`choice-btn moon-view-btn ${
                      cameraPreset === "moonEclipticPlane" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("moonEclipticPlane")}
                  >
                    <Moon size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                    公転面 (水平)
                  </button>
                </div>
              </div>

              <div className="view-group-block">
                <span className="view-group-label">太陽と地球の公転</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn sun-overhead-btn ${
                      cameraPreset === "sunOverhead" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("sunOverhead")}
                  >
                    <Sun size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                    太陽の真上
                  </button>
                  <button
                    type="button"
                    className={`choice-btn sun-overhead-btn ${
                      cameraPreset === "sunEclipticOblique" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("sunEclipticOblique")}
                  >
                    <Sun size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                    公転面 (やや上)
                  </button>
                </div>
              </div>

              <div className="view-group-block">
                <span className="view-group-label">地球から見る黄道（13星座）</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn zodiac-view-btn ${
                      cameraPreset === "earthEclipticFollow" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("earthEclipticFollow")}
                  >
                    黄道・太陽追尾
                  </button>
                  <button
                    type="button"
                    className={`choice-btn zodiac-view-btn ${
                      cameraPreset === "earthEclipticFixed" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("earthEclipticFixed")}
                  >
                    黄道・星座固定
                  </button>
                </div>
              </div>

              <div className="view-group-block">
                <span className="view-group-label">東京の地上から見る空</span>
                <div className="option-btn-group four-col">
                  <button
                    type="button"
                    className={`choice-btn tokyo-view-btn ${
                      cameraPreset === "tokyoNorth" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("tokyoNorth")}
                  >
                    北
                  </button>
                  <button
                    type="button"
                    className={`choice-btn tokyo-view-btn ${
                      cameraPreset === "tokyoEast" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("tokyoEast")}
                  >
                    東
                  </button>
                  <button
                    type="button"
                    className={`choice-btn tokyo-view-btn ${
                      cameraPreset === "tokyoSouth" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("tokyoSouth")}
                  >
                    南
                  </button>
                  <button
                    type="button"
                    className={`choice-btn tokyo-view-btn ${
                      cameraPreset === "tokyoWest" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("tokyoWest")}
                  >
                    西
                  </button>
                </div>
              </div>

              <div className="view-group-block">
                <span className="view-group-label">リアル太陽系（水〜冥・衛星）</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn solar-real-btn ${
                      cameraPreset === "solarInner" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("solarInner")}
                  >
                    内惑星 (水金地火)
                  </button>
                  <button
                    type="button"
                    className={`choice-btn solar-real-btn ${
                      cameraPreset === "solarJupiter" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("solarJupiter")}
                  >
                    木星・4衛星
                  </button>
                  <button
                    type="button"
                    className={`choice-btn solar-real-btn ${
                      cameraPreset === "solarFullTop" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("solarFullTop")}
                  >
                    全体・真上
                  </button>
                  <button
                    type="button"
                    className={`choice-btn solar-real-btn ${
                      cameraPreset === "solarFullOblique" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("solarFullOblique")}
                  >
                    全体・斜め
                  </button>
                </div>
              </div>

              <div className="view-slider-wrap">
                <input
                  type="range"
                  className="view-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(viewTransitionRatio * 100)}
                  onChange={(e) =>
                    onChangeViewTransitionRatio(Number(e.target.value) / 100)
                  }
                  aria-label="パネル内：天の北極から公転面（水平）への連続視点移動"
                />
                <div className="view-slider-labels">
                  <span>天の北極 (0%)</span>
                  <span>公転面・水平 (100%)</span>
                </div>
              </div>

              <button
                type="button"
                className="guide-action-btn"
                onClick={onResetNorthPoleCamera}
              >
                <RotateCcw size={12} />
                地球：天の北極へゆっくり戻る
              </button>
              <p className="note-box" style={{ fontSize: 11 }}>
                各視点ボタンでゆっくり連続的に移動します。ドラッグで自由回転・ホイールで拡大縮小もできます。
              </p>
            </div>

            <div className="section-card">
              <h2 className="section-title">基準座標系</h2>
              <div className="option-btn-group two-col">
                <button
                  type="button"
                  className={`choice-btn ${
                    referenceFrame === "solar" ? "is-active" : ""
                  }`}
                  onClick={() => onChangeReferenceFrame("solar")}
                >
                  太陽方向を固定
                </button>
                <button
                  type="button"
                  className={`choice-btn ${
                    referenceFrame === "sidereal" ? "is-active" : ""
                  }`}
                  onClick={() => onChangeReferenceFrame("sidereal")}
                >
                  恒星・春分点を固定
                </button>
              </div>
              <p className="note-box" style={{ fontSize: 11 }}>
                {referenceFrame === "solar"
                  ? "太陽を画面右側に固定して、各地の昼夜変化や月の満ち欠けを見やすくします。"
                  : "背景の星座と春分点（紫線）を静止させます。「+1恒星日」を押すと地球が同じ星に対してきっちり1回転する様子を確認できます。"}
              </p>
            </div>

            <div className="section-card">
              <h2 className="section-title">
                <Layers size={13} />
                補助レイヤー表示
              </h2>
              <div className="toggle-list">
                {LAYER_LABELS.map(({ key, label }) => {
                  const isOn = layers[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`toggle-row ${isOn ? "is-on" : ""}`}
                      onClick={() => onToggleLayer(key)}
                      aria-pressed={isOn}
                    >
                      <span>{label}</span>
                      <span className="toggle-switch" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === "guide" && (
          <>
            <div className="guide-card">
              <h3 className="guide-title">★ 地球から見る「黄道」と黄道12星座（13星座）</h3>
              <p className="guide-text">
                地球が1年かけて太陽のまわりを公転するため、地球から見ると太陽は背景の星座の中を少しずつ東（画面右→左）へ移動し、1年で1周する通り道を描きます。この通り道を<strong>黄道（こうどう）</strong>と呼びます。
              </p>
              <p className="guide-text">
                占いで有名な<strong>黄道12星座</strong>に加え、国際天文学連合（IAU）の実際の星座の境界では、さそり座といて座の間で<strong>へびつかい座（13番目の星座）</strong>の上も太陽が約18日間通るため、天文学では<strong>黄道13星座</strong>として配置しています。
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={() => onRunGuideExperiment("zodiac-ecliptic-follow")}
                >
                  黄道・太陽追尾で見る
                </button>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={() => onRunGuideExperiment("zodiac-ecliptic-fixed")}
                >
                  黄道・星座固定で見る
                </button>
              </div>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">★ リアル太陽系（水金地火木土天海冥・衛星）</h3>
              <p className="guide-text">
                1 AU 比例縮尺の忠実なケプラー楕円軌道で水星から冥王星までを一望できます。冥王星の17.2°傾いた軌道や、地球の月・木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）も観察できます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("real-solar-system")}
              >
                リアル太陽系（全体・斜め）へ移動
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">★ なぜ冥王星は「惑星」ではなく「準惑星」なの？</h3>
              <p className="guide-text">
                かつて冥王星は9番目の惑星とされていましたが、2006年に国際天文学連合（IAU）が「惑星」の3つの条件を決めたことで、<strong>準惑星</strong>に分類されるようになりました。3つの条件と冥王星を比べてみましょう。
              </p>
              <ul className="guide-checklist">
                <li className="guide-check-item is-pass">
                  <span className="guide-check-mark" aria-label="満たす">○</span>
                  <span>
                    <strong>条件① 太陽のまわりを回っていること（公転）</strong>
                    <br />
                    冥王星も約248年かけて太陽のまわりを公転しています。
                  </span>
                </li>
                <li className="guide-check-item is-pass">
                  <span className="guide-check-mark" aria-label="満たす">○</span>
                  <span>
                    <strong>条件② 自分の重力でほぼ丸い球の形になれること</strong>
                    <br />
                    冥王星も自分の重さで丸い球の形になっています。
                  </span>
                </li>
                <li className="guide-check-item is-fail">
                  <span className="guide-check-mark" aria-label="満たさない">✕</span>
                  <span>
                    <strong>条件③ 自分の通り道（軌道）の近くから、ほかの小さな天体をはじき飛ばしたり吸収したりして、ひとりじめできていること</strong>
                    <br />
                    冥王星は地球の月より小さく重力が弱いため、通り道のまわりにある似た大きさの氷の天体（エリスなど）を追い払えていません。
                  </span>
                </li>
              </ul>
              <p className="guide-text">
                さらに、ほかの8つの惑星がほぼ同じ平らな面を回っているのに対し、冥王星は通り道が約17.2°も大きく傾き、細長いだ円になっていて、上から見ると海王星の軌道と交差し、一時は海王星より太陽に近づきます。①と②は満たすけれど③だけ満たさないため、冥王星は「準惑星」と呼ばれます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("real-solar-system")}
              >
                冥王星の傾いた軌道を3Dで確認する
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">1. 東京の地上から見る空（日周運動と北極星）</h3>
              <p className="guide-text">
                東京（北緯35.7°）の地上へ降りると、北の空では高度35.7°の北極星を中心に星々が反時計回りに回り、東から昇った太陽や月が南を通って西へ沈む様子を連続視点で観察できます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("tokyo-ground-sky")}
              >
                東京の地上（南の空）へ移動して観察
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">2. 月の公転・満ち欠けと白道の傾き</h3>
              <p className="guide-text">
                月は地球の周りを反時計回りに公転し、太陽との位置関係によって新月・上弦・満月・下弦へと満ち欠けします。月の軌道（白道）は黄道面に対し約5.1°傾いています。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("moon-orbit-observe")}
              >
                月の観察視点（天の北極・真上）へ移動
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">3. 金星の公転と「明けの明星・宵の明星」</h3>
              <p className="guide-text">
                地球より内側（0.72 AU）を約225日で公転する金星は、地球から見ると常に太陽の近く（離角約47°以内）にあり、太陽の西側にあると明け方の東の空、東側にあると夕方の西の空で輝きます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("venus-orbit-observe")}
              >
                太陽の真上から金星と地球の公転を見る
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">4. 太陽の真上から見る「公転と季節」</h3>
              <p className="guide-text">
                太陽の真上へ視点を移すと、地球が 23.4° 地軸を傾けたまま太陽の周りを反時計回りに公転し、春分・夏至・秋分・冬至が巡る様子を一望できます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("sun-orbit-overview")}
              >
                太陽の真上へ移動して公転を見る
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">5. なぜ天の北極からは反時計回り？</h3>
              <p className="guide-text">
                地球の自転は西から東へ向かっています。天の北極（北極点の真上）から地球を見下ろすと、本初子午線（黄色い線）も日本も反時計回りに回転します。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("counterclockwise")}
              >
                天の北極＋早回しで観察する
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">6. 黄道面（公転面）と地軸23.4°の傾き</h3>
              <p className="guide-text">
                視点を黄道面（公転面・オレンジの輪）の水平目線へ移すと、太陽光が真横から水平に差し込む中で、地球の地軸が23.4°傾いて自転する姿が見えます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("ecliptic-tilt")}
              >
                黄道面 (水平) へ移動して観察
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">7. 夏至の「白夜」と冬至の「極夜」</h3>
              <p className="guide-text">
                地軸は公転面に対して約23.4°傾いています。夏至には北極側が太陽を向くため北極圏（水色の破線）全体が昼のまま回り（白夜）、冬至には逆に影の中へすっぽり入ります（極夜）。
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={() => onRunGuideExperiment("summer-midnight-sun")}
                >
                  {SEASON_PRESETS[1].labelJa}（白夜）を見る
                </button>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={() => onRunGuideExperiment("winter-polar-night")}
                >
                  {SEASON_PRESETS[3].labelJa}（極夜）を見る
                </button>
              </div>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">8. なぜ太陽は東から昇り西に沈む？</h3>
              <p className="guide-text">
                東京の地表に伸びるシアン色の矢印が「東（地球が回っていく向き）」です。地球が反時計回りに回ることで、東京が東向きに昼の側へ飛び込んでいくため、太陽は東の地平線から昇って見えます。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("sunrise-east")}
              >
                東京の夜明け前を再現する
              </button>
            </div>

            <div className="guide-card">
              <h3 className="guide-title">9. 恒星日（23h56m）と太陽日（24h）</h3>
              <p className="guide-text">
                地球が1回転する間にも地球は太陽の周りを約1°公転するため、太陽が再び真上に来るには約4分余計に回る必要があります。春分点（紫線）を固定し、下の「+1恒星日」と「+1太陽日」を押し比べてみましょう。
              </p>
              <button
                type="button"
                className="guide-action-btn"
                onClick={() => onRunGuideExperiment("sidereal-vs-solar")}
              >
                恒星固定モードで比較準備
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
