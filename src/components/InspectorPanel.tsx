import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Compass,
  Layers,
  Moon,
  Orbit,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";
import {
  CameraPreset,
  City,
  DisplayLayers,
  GalileanMoonState,
  MoonState,
  SolarSystemBodyState,
  SolarSystemState,
  VenusState,
} from "../types/astronomy";
import { SEASON_PRESETS } from "../astronomy/calculations";
import {
  IMPACTOR_SPECS,
  ImpactorId,
  formatImpactorMassJa,
  formatImpactorRadiusJa,
} from "../astronomy/impactPhysics";
import { CelestialPhaseDiagram } from "./CelestialPhaseDiagram";
import { AchievementList } from "./AchievementList";
import { AchievementState } from "../achievements/achievementState";

type InspectorTab = "city" | "display" | "guide" | "achievements";

export type GuideExperimentId =
  | "counterclockwise"
  | "summer-midnight-sun"
  | "winter-polar-night"
  | "sunrise-east"
  | "ecliptic-tilt"
  | "sun-orbit-overview"
  | "moon-orbit-observe"
  | "venus-orbit-observe"
  | "tokyo-ground-sky"
  | "sydney-southern-cross"
  | "real-solar-system"
  | "zodiac-ecliptic-follow"
  | "zodiac-ecliptic-fixed"
  | "annual-motion-north"
  | "annual-motion-south"
  | "solar-eclipse-total"
  | "solar-eclipse-annular"
  | "solar-eclipse-partial"
  | "solar-eclipse-space"
  | "lunar-eclipse-total"
  | "lunar-eclipse-partial"
  | "lunar-eclipse-penumbral"
  | "lunar-eclipse-space"
  | "seasonal-spring"
  | "seasonal-summer"
  | "seasonal-autumn"
  | "seasonal-winter"
  | "cosmic-nearby-stars"
  | "cosmic-milky-way"
  | "cosmic-andromeda"
  | "cosmic-local-group"
  | "cosmic-galaxy-cluster"
  | "cosmic-laniakea"
  | "cosmic-observable-universe";

interface InspectorPanelProps {
  isOpen: boolean;
  currentDate: Date;
  solarState: SolarSystemState;
  moonState: MoonState;
  venusState: VenusState;
  solarSystemBodies: SolarSystemBodyState[];
  galileanMoons: GalileanMoonState[];
  isRealSolarSystemMode: boolean;
  isAnnualMotionMode: boolean;
  onToggleAnnualMotion: () => void;
  onStepMonth: () => void;
  cities: City[];
  selectedCityId: string;
  onSelectCity: (cityId: string) => void;
  cameraPreset: CameraPreset | null;
  onSelectCameraPreset: (preset: CameraPreset) => void;
  onResetNorthPoleCamera: () => void;
  viewTransitionRatio: number;
  onChangeViewTransitionRatio: (ratio: number) => void;
  layers: DisplayLayers;
  onToggleLayer: (key: keyof DisplayLayers) => void;
  onRunGuideExperiment: (id: GuideExperimentId) => void;
  selectedImpactorId: ImpactorId;
  isImpactAimMode: boolean;
  onSelectImpactor: (id: ImpactorId) => void;
  onSetImpactAimMode: (aimMode: boolean) => void;
  canRestoreImpact: boolean;
  onRestoreImpact: () => void;
  /** 実績の達成状況 */
  achievementState: AchievementState;
  /** 実績の記録を消す */
  onResetAchievements: () => void;
}

const LAYER_LABELS: Array<{ key: keyof DisplayLayers; label: string }> = [
  { key: "graticule", label: "経緯線・赤道・北極圏(66.6°N)" },
  { key: "celestialCompass", label: "天球目盛り・自転矢印(反時計回り)" },
  { key: "eclipticPlane", label: "黄道面（公転面）・公転軌道リング" },
  { key: "zodiacConstellations", label: "黄道12星座（13星座）と黄道ライン" },
  { key: "seasonalAsterisms", label: "四季の大三角・四辺形と主要1等星" },
  { key: "moonAndOrbit", label: "月本体と白道（月の公転軌道）" },
  { key: "venusAndOrbit", label: "金星と金星の公転軌道（内惑星）" },
  { key: "terminatorGuide", label: "太陽光線・昼夜境界ハイライト" },
  { key: "cities", label: "都市マーカー・現地N/E/S/W矢印" },
];

/**
 * 画面右側に配置する観察インスペクターパネルです。
 * 「視点・表示」「地点・天体」「学習ガイド」「実績」の4タブで、視点設定、月・金星の満ち欠け、学習実験、実績の一覧を切り替えます。
 */
export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  moonState,
  venusState,
  isAnnualMotionMode,
  onToggleAnnualMotion,
  onStepMonth,
  cities,
  selectedCityId,
  onSelectCity,
  cameraPreset,
  onSelectCameraPreset,
  onResetNorthPoleCamera,
  viewTransitionRatio,
  onChangeViewTransitionRatio,
  layers,
  onToggleLayer,
  onRunGuideExperiment,
  selectedImpactorId,
  isImpactAimMode,
  onSelectImpactor,
  onSetImpactAimMode,
  canRestoreImpact,
  onRestoreImpact,
  achievementState,
  onResetAchievements,
}) => {
  // 視点移動を観察パネル内からすぐ操作できるよう「視点・表示」を初期タブにします。
  const [activeTab, setActiveTab] = useState<InspectorTab>("display");
  // 学習ガイドの各カードは初期状態ですべて閉じた状態にし、クリックで個別に開閉できるようにします。
  const [openGuideIds, setOpenGuideIds] = useState<Set<string>>(
    () => new Set()
  );

  const toggleGuideCard = (cardId: string) => {
    setOpenGuideIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const renderGuideCard = (
    cardId: string,
    title: string,
    children: React.ReactNode
  ) => {
    const isCardOpen = openGuideIds.has(cardId);
    return (
      <div
        key={cardId}
        className={`guide-card ${isCardOpen ? "is-open" : "is-closed"}`}
      >
        <button
          type="button"
          className="guide-card-header"
          onClick={() => toggleGuideCard(cardId)}
          aria-expanded={isCardOpen}
        >
          <span className="guide-title">{title}</span>
          <ChevronDown
            size={15}
            className={`guide-card-chevron ${isCardOpen ? "is-open" : ""}`}
            aria-hidden="true"
          />
        </button>
        {isCardOpen && <div className="guide-card-body">{children}</div>}
      </div>
    );
  };

  const selectedCity =
    cities.find((c) => c.id === selectedCityId) ?? cities[0];

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
          aria-label="視点・表示"
          title="視点・表示"
          className={`inspector-tab-btn ${activeTab === "display" ? "is-active" : ""}`}
          onClick={() => setActiveTab("display")}
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "city"}
          aria-label="地点・天体"
          title="地点・天体"
          className={`inspector-tab-btn ${activeTab === "city" ? "is-active" : ""}`}
          onClick={() => setActiveTab("city")}
        >
          <Orbit size={16} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "guide"}
          aria-label="学習ガイド"
          title="学習ガイド"
          className={`inspector-tab-btn ${activeTab === "guide" ? "is-active" : ""}`}
          onClick={() => setActiveTab("guide")}
        >
          <BookOpen size={16} />
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "achievements"}
          aria-label="実績"
          title="実績"
          className={`inspector-tab-btn ${activeTab === "achievements" ? "is-active" : ""}`}
          onClick={() => setActiveTab("achievements")}
        >
          <Trophy size={16} />
        </button>
      </div>

      <div className="inspector-body">
        {activeTab === "achievements" && (
          <AchievementList
            state={achievementState}
            onReset={onResetAchievements}
          />
        )}
        {activeTab === "city" && (
          <>
            <div className="section-card">
              <h2 className="section-title">
                <Moon size={13} />
                月
              </h2>
              <div className="phase-preview-row">
                <CelestialPhaseDiagram
                  body="moon"
                  illumination={moonState.illumination}
                  litSide={moonState.phaseAngleDeg < 180 ? "right" : "left"}
                  solarEclipseType={moonState.solarEclipseType}
                  lunarEclipseType={moonState.lunarEclipseType}
                  ariaLabel={`現在の月の満ち欠け：${moonState.phaseLabelJa}`}
                />
                <div className="phase-preview-meta">
                  <div className="phase-preview-title">
                    {moonState.phaseLabelJa}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h2 className="section-title">
                <Sparkles size={13} />
                金星
              </h2>
              <div className="phase-preview-row">
                <CelestialPhaseDiagram
                  body="venus"
                  illumination={venusState.illumination}
                  litSide={venusState.elongationDeg >= 0 ? "right" : "left"}
                  distanceAu={venusState.distanceAu}
                  ariaLabel={`現在の金星の満ち欠け：${venusState.visibilityLabelJa}`}
                />
                <div className="phase-preview-meta">
                  <div
                    className="phase-preview-title"
                    style={{ color: "#fef08a" }}
                  >
                    {venusState.visibilityLabelJa}
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card impact-simulator-card">
              <h2 className="section-title">
                <Orbit size={13} />
                万有引力・天体衝突シミュレーター
              </h2>

              <div className="view-group-block">
                <span className="view-group-label">1本指ドラッグの操作モード</span>
                <div
                  className="option-btn-group two-col"
                  role="group"
                  aria-label="1本指操作モードの切り替え"
                >
                  <button
                    type="button"
                    className={`choice-btn ${!isImpactAimMode ? "is-active" : ""}`}
                    onClick={() => onSetImpactAimMode(false)}
                  >
                    視点を移動
                  </button>
                  <button
                    type="button"
                    className={`choice-btn ${isImpactAimMode ? "is-active" : ""}`}
                    onClick={() => onSetImpactAimMode(true)}
                  >
                    天体を狙う
                  </button>
                </div>
              </div>

              <p className="impact-section-hint">
                重さ・大きさ・距離はすべて<strong>実在の天体の値</strong>で計算します。
                衝突は画面に描いている大きさで判定し、描いた絵どうしが触れたら当たります。
                狙っている間に出る予測線と、当たる天体に付くリングを目安に投げてみましょう。
              </p>

              <div className="impact-grid">
                {IMPACTOR_SPECS.map((spec) => {
                  const isSelected = selectedImpactorId === spec.id;
                  const isActiveAim = isSelected && isImpactAimMode;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      className={`impact-btn ${isSelected ? "is-active" : ""}`}
                      style={
                        isActiveAim
                          ? {
                              borderColor: spec.accentColor,
                              boxShadow: `0 0 18px ${spec.accentColor}44`,
                            }
                          : isSelected
                          ? {
                              borderColor: `${spec.accentColor}88`,
                            }
                          : undefined
                      }
                      aria-pressed={isActiveAim}
                      onClick={() => onSelectImpactor(spec.id)}
                    >
                      <div className="impact-btn-header">
                        <span
                          className="impact-btn-symbol"
                          style={{ color: spec.accentColor }}
                        >
                          {spec.symbol}
                        </span>
                        <span className="impact-btn-name">{spec.nameJa}</span>
                      </div>
                      {/* モデルにした実在の天体の名前と、半径・質量 */}
                      <span className="impact-btn-sub">
                        {spec.model.nameJa}
                        <br />
                        {formatImpactorRadiusJa(spec)}
                        <br />
                        {formatImpactorMassJa(spec)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {canRestoreImpact && (
                <div className="impact-panel-actions">
                  <button
                    type="button"
                    className="choice-btn impact-action-btn is-restore"
                    onClick={onRestoreImpact}
                  >
                    <RotateCcw
                      size={11}
                      style={{ marginRight: 4, verticalAlign: -1 }}
                    />
                    すぐ復活させる
                  </button>
                </div>
              )}
            </div>
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
                <span className="view-group-label">
                  観察地点の地上から見る空（現在：{selectedCity.nameJa}）
                </span>
                <div
                  className="option-btn-group four-col"
                  style={{ marginBottom: 3 }}
                  role="group"
                  aria-label="地上観察地点の選択"
                >
                  {cities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className={`choice-btn ${
                        city.id === selectedCity.id ? "is-active" : ""
                      }`}
                      style={{ padding: "5px 4px", fontSize: 10.5 }}
                      onClick={() => onSelectCity(city.id)}
                      title={`${city.nameJa}（${city.regionJa}）の地上へ切り替え`}
                    >
                      {city.nameJa}
                    </button>
                  ))}
                </div>
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
                <div className="option-btn-group two-col" style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className={`choice-btn tokyo-view-btn ${
                      isAnnualMotionMode ? "is-active" : ""
                    }`}
                    onClick={onToggleAnnualMotion}
                    aria-pressed={isAnnualMotionMode}
                    title="毎日21:00 JSTに時刻を固定し、カシオペア座や季節の星座の年周運動（1ヶ月約30°）を観察"
                  >
                    年周運動 (21時固定)
                  </button>
                  <button
                    type="button"
                    className="choice-btn tokyo-view-btn"
                    onClick={onStepMonth}
                    title="同じ時刻のまま30日（約1ヶ月）進め、星が約30°動く様子を比較"
                  >
                    +1ヶ月 (同刻)
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

              <div className="view-group-block">
                <span className="view-group-label">近傍恒星・銀河・宇宙の大規模構造</span>
                <div className="option-btn-group two-col">
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "nearbyStars" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("nearbyStars")}
                  >
                    近傍恒星 (3D奥行き)
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "milkyWay" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("milkyWay")}
                  >
                    天の川銀河
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "milkyWayAndromeda" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("milkyWayAndromeda")}
                  >
                    天の川＆アンドロメダ
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "localGroup" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("localGroup")}
                  >
                    局部銀河群
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "galaxyCluster" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("galaxyCluster")}
                  >
                    銀河団 (おとめ座)
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn ${
                      cameraPreset === "laniakea" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("laniakea")}
                  >
                    ラニアケア超銀河団
                  </button>
                  <button
                    type="button"
                    className={`choice-btn cosmic-view-btn cosmic-span-full ${
                      cameraPreset === "observableUniverse" ? "is-active" : ""
                    }`}
                    onClick={() => onSelectCameraPreset("observableUniverse")}
                  >
                    観測可能な宇宙（約930億光年）
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
                6DOF操作：左ドラッグ＝回転 ／ 右ドラッグ・Shift+ドラッグ・2本指移動＝平行移動 ／ Alt+ドラッグ・Q/E・2本指ひねり＝ロール ／ WASD・R/F＝自由飛行 ／ ホイール・ピンチ＝ズーム
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
            {renderGuideCard(
              "guide-1-rotation",
              "1. なぜ天の北極からは反時計回り？",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-2-sunrise",
              "2. なぜ太陽は東から昇り西に沈む？",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-3-axial-tilt",
              "3. 黄道面（公転面）と地軸23.4°の傾き",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-4-polar-day-night",
              "4. 夏至の「白夜」と冬至の「極夜」",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-5-sun-orbit",
              "5. 太陽の真上から見る「公転と季節」",
              <>
                <p className="guide-text">
                  太陽の真上へ視点を移すと、地球が 23.4° 地軸を右に傾けたまま太陽の周りを反時計回りに公転し、春分（上）・夏至（左）・秋分（下）・冬至（右）が巡る様子を一望できます。
                </p>
                <button
                  type="button"
                  className="guide-action-btn"
                  onClick={() => onRunGuideExperiment("sun-orbit-overview")}
                >
                  太陽の真上へ移動して公転を見る
                </button>
              </>
            )}

            {renderGuideCard(
              "guide-6-ground-sky",
              "6. 観察地点の地上から見る空（北極星・カシオペア座・南十字星）",
              <>
                <p className="guide-text">
                  東京やトロムソなど北半球では、北の空の北極星（高度＝その土地の北緯）とW字の<strong>カシオペア座</strong>を中心に星が反時計回りに回り、南半球のシドニーや南極点では、南の空に<strong>南十字星</strong>が見えて天の南極のまわりを時計回りに巡ります。
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("tokyo-ground-sky")}
                  >
                    東京の地上（南の空）を見る
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("sydney-southern-cross")}
                  >
                    シドニーの南の空（南十字星）を見る
                  </button>
                </div>
              </>
            )}

            {renderGuideCard(
              "guide-7-annual-motion",
              "7. 星の「年周運動」とカシオペア座（毎日21時の星空）",
              <>
                <p className="guide-text">
                  地球が1年かけて太陽のまわりを公転しているため、毎日同じ時刻（たとえば夜21時）に空を見上げると、星の位置は<strong>1ヶ月で約30°</strong>ずつズレて見えます。これを<strong>年周運動</strong>と呼びます。
                </p>
                <p className="guide-text">
                  東京の北の空ではW字形の<strong>カシオペア座</strong>が北極星を中心に反時計回りに1年で1周し、南の空では季節の星座が東から西へ少しずつ移り変わります。
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("annual-motion-north")}
                  >
                    北の空：カシオペア座の年周運動
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("annual-motion-south")}
                  >
                    南の空：季節の星座の年周運動
                  </button>
                </div>
              </>
            )}

            {renderGuideCard(
              "guide-8-seasonal-stars",
              "8. 四季の星座と1等星（春・夏・秋・冬の大三角／四辺形・北斗七星）",
              <>
                <p className="guide-text">
                  地球の公転にともない、夜21時ごろに南の空で見える星座は春夏秋冬で移り変わります。明るい1等星を結んだ<strong>大三角</strong>や<strong>四辺形</strong>を目印にすると、実際の夜空でも星座を見つけやすくなります（星をタップすると日英解説カードが開きます）。
                </p>
                <ul className="guide-checklist">
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="春">春</span>
                    <span>
                      <strong>春の大三角＆春の大曲線</strong>：北斗七星の柄のカーブから、うしかい座の<strong>アークトゥルス</strong>（橙）→おとめ座の<strong>スピカ</strong>（青白）へ結び、しし座の<strong>デネボラ</strong>と三角形を作ります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="夏">夏</span>
                    <span>
                      <strong>夏の大三角</strong>：こと座の<strong>ベガ</strong>（織姫星）・わし座の<strong>アルタイル</strong>（彦星）・はくちょう座の<strong>デネブ</strong>が作る巨大な三角形です。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="秋">秋</span>
                    <span>
                      <strong>秋の四辺形＆フォーマルハウト</strong>：ペガスス座とアンドロメダ座の4星（マルカブ・シェアト・アルフェラッツ・アルゲニブ）が大きな四角形を描き、低い南に秋唯一の1等星<strong>フォーマルハウト</strong>が輝きます。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="冬">冬</span>
                    <span>
                      <strong>冬の大三角＆冬のダイヤモンド</strong>：全天最輝の<strong>シリウス</strong>（おおいぬ座）・赤色超巨星<strong>ベテルギウス</strong>（オリオン座）・<strong>プロキオン</strong>（こいぬ座）の大三角と、リゲル・アルデバラン・カペラ・ポルックスを結ぶ六角形が見どころです。
                    </span>
                  </li>
                </ul>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("seasonal-spring")}
                  >
                    春の夜空（5月21時）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("seasonal-summer")}
                  >
                    夏の夜空（8月21時）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("seasonal-autumn")}
                  >
                    秋の夜空（11月21時）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("seasonal-winter")}
                  >
                    冬の夜空（2月21時）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-nearby-stars")}
                  >
                    宇宙から3D奥行きを見る（シリウス8.6光年〜デネブ2,600光年）
                  </button>
                </div>
              </>
            )}

            {renderGuideCard(
              "guide-9-zodiac-ecliptic",
              "9. 地球から見る「黄道」と黄道12星座（13星座）",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-10-moon-orbit",
              "10. 月の公転・満ち欠けと白道の傾き",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-11-solar-eclipse",
              "11. 日食のしくみと3つの種類（皆既・金環・部分日食）",
              <>
                <p className="guide-text">
                  <strong>日食（にっしょく）</strong>は、宇宙で「<strong>太陽 ― 月 ― 地球</strong>」の順に一直線に並んだとき（<strong>新月</strong>のとき）、月が太陽の前を横切って太陽の光が遮られる現象です。月の通り道（白道）は地球の公転面（黄道）に対して<strong>約5.1°傾いている</strong>ため、新月のたびに毎回起こるわけではなく、2つの通り道が交わる点の近くで新月になったときだけ起こります。
                </p>
                <ul className="guide-checklist">
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="皆既">皆</span>
                    <span>
                      <strong>皆既日食（かいきにっしょく）</strong>：月が楕円軌道の地球に近い側にあるとき、見かけの大きさが太陽よりわずかに大きくなり、太陽を完全に隠します。昼間の空が暗くなり、太陽のまわりに真珠色の<strong>コロナ</strong>が広がります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="金環">環</span>
                    <span>
                      <strong>金環日食（きんかんにっしょく）</strong>：月が地球から遠い側にあるとき、見かけの大きさが太陽より少し小さいため太陽を隠しきれず、黒い月のまわりに太陽の縁が<strong>金の指輪（リング）</strong>のように光って残ります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="部分">部</span>
                    <span>
                      <strong>部分日食（ぶぶんにっしょく）</strong>：月の中心が太陽の中心から少しずれて重なる地域では、太陽の一部が丸く欠けて<strong>三日月のような形の太陽</strong>が見えます。
                    </span>
                  </li>
                </ul>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("solar-eclipse-total")}
                  >
                    皆既日食を見る（地上・コロナ）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("solar-eclipse-annular")}
                  >
                    金環日食を見る（地上・金の輪）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("solar-eclipse-partial")}
                  >
                    部分日食を見る（地上・欠けた太陽）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("solar-eclipse-space")}
                  >
                    宇宙から日食（地球に落ちる月の影）を見る
                  </button>
                </div>
              </>
            )}

            {renderGuideCard(
              "guide-12-lunar-eclipse",
              "12. 月食のしくみと3つの種類（皆既・部分・半影月食）",
              <>
                <p className="guide-text">
                  <strong>月食（げっしょく）</strong>は、「<strong>太陽 ― 地球 ― 月</strong>」の順に一直線に並んだとき（<strong>満月</strong>のとき）、満月が地球の影の中を通過して暗く欠けたり赤く染まったりする現象です。日食とは違い、そのとき<strong>夜になっている地球上のどこからでも同じ月食を同時に観察</strong>できます。
                </p>
                <ul className="guide-checklist">
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="皆既">皆</span>
                    <span>
                      <strong>皆既月食（かいきげっしょく）</strong>：満月全体が地球の濃い影（<strong>本影</strong>）にすっぽり入ります。真っ暗にはならず、地球の大気を通り抜けた赤い太陽光（夕焼けと同じ光）だけが屈折して月を照らすため、<strong>赤銅色（しゃくどういろ）</strong>に輝きます。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="部分">部</span>
                    <span>
                      <strong>部分月食（ぶぶんげっしょく）</strong>：満月の一部だけが地球の本影に入り、地球の丸い影の形に沿って満月が暗く欠けて見えます。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="半影">半</span>
                    <span>
                      <strong>半影月食（はんえいげっしょく）</strong>：月が本影の外側にある薄い影（<strong>半影</strong>：太陽光の一部だけが届く領域）だけを通過し、満月の片側がうっすらと暗く翳（かげ）って見えます。
                    </span>
                  </li>
                </ul>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("lunar-eclipse-total")}
                  >
                    皆既月食を見る（地上・赤銅色の満月）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("lunar-eclipse-partial")}
                  >
                    部分月食を見る（地上・丸く欠ける満月）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("lunar-eclipse-penumbral")}
                  >
                    半影月食を見る（地上・うっすら翳る満月）
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("lunar-eclipse-space")}
                  >
                    宇宙から月食（白道と地球の影）を見る
                  </button>
                </div>
              </>
            )}

            {renderGuideCard(
              "guide-13-venus",
              "13. 金星の公転と「明けの明星・宵の明星」",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-14-real-solar-system",
              "14. リアル太陽系（水金地火木土天海冥・衛星）",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-15-pluto-dwarf-planet",
              "15. なぜ冥王星は「惑星」ではなく「準惑星」なの？",
              <>
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
              </>
            )}

            {renderGuideCard(
              "guide-16-cosmic-hierarchy",
              "16. 宇宙の階層：近傍恒星・天の川銀河から観測可能な宇宙へ",
              <>
                <p className="guide-text">
                  太陽系を飛び出してさらに遠くへズームアウトすると、宇宙は7段階の壮大な階層構造を作っていることがわかります。各恒星・銀河・銀河団・超銀河団をタップすると、日本語と中学英語の解説カードも開けます。
                </p>
                <ul className="guide-checklist">
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="1">1</span>
                    <span>
                      <strong>近傍恒星（数光年〜数千光年・3D奥行き）</strong>：地上からは平面の三角形に見える冬の大三角・夏の大三角も、実は<strong>シリウス（8.6光年）</strong>・<strong>ベテルギウス（約550光年）</strong>・<strong>デネブ（約2,600光年）</strong>と奥行きがまったく異なります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="2">2</span>
                    <span>
                      <strong>天の川銀河（直径 約10万光年）</strong>：約2,000億〜4,000億個の星が集まる棒渦巻銀河。太陽系は中心（いて座A*）から約2.7万光年の<strong>オリオン腕</strong>にあります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="3">3</span>
                    <span>
                      <strong>天の川＆アンドロメダ（約250万光年）</strong>：隣の巨大渦巻銀河アンドロメダ（M31）と重力で引き合い、約45億年後に合体すると考えられています。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="4">4</span>
                    <span>
                      <strong>局部銀河群（直径 約1,000万光年）</strong>：天の川・アンドロメダ・さんかく座銀河（M33）・大小マゼラン雲など50個以上の銀河のご近所グループです。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="5">5</span>
                    <span>
                      <strong>おとめ座銀河団（約5,400万光年）</strong>：M87中心に1,500〜2,000銀河が密集。近くには南天の<strong>ろ座銀河団</strong>、さらに奥には<strong>かみのけ座銀河団</strong>や<strong>グレートアトラクター</strong>があります。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="6">6</span>
                    <span>
                      <strong>ラニアケア超銀河団（直径 約5.2億光年）</strong>：約10万個の銀河が重力の中心（グレートアトラクター）へ川のように流れ込む、私たちの宇宙の住所です。
                    </span>
                  </li>
                  <li className="guide-check-item is-pass">
                    <span className="guide-check-mark" aria-label="7">7</span>
                    <span>
                      <strong>観測可能な宇宙（直径 約930億光年）</strong>：約2兆個の銀河がクモの巣（コズミック・ウェブ）と超空洞（ボイド）を作り、最外殻を宇宙誕生約38万年後の光（<strong>CMB</strong>）が包んでいます。
                    </span>
                  </li>
                </ul>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-nearby-stars")}
                  >
                    ① 近傍恒星 (3D奥行き)
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-milky-way")}
                  >
                    ② 天の川銀河
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-andromeda")}
                  >
                    ③ 天の川＆アンドロメダ
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-local-group")}
                  >
                    ④ 局部銀河群
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-galaxy-cluster")}
                  >
                    ⑤ おとめ座銀河団
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() => onRunGuideExperiment("cosmic-laniakea")}
                  >
                    ⑥ ラニアケア超銀河団
                  </button>
                  <button
                    type="button"
                    className="guide-action-btn"
                    onClick={() =>
                      onRunGuideExperiment("cosmic-observable-universe")
                    }
                  >
                    ⑦ 観測可能な宇宙
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
