import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Moon,
  Orbit,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { CameraPreset } from "../types/astronomy";

interface ViewTransitionWidgetProps {
  /** 現在の連続視点スライダー値（0 = 天の北極真上、1 = 公転面・水平） */
  transitionRatio: number;
  /** 連続スライダー変更時のハンドラ */
  onChangeTransitionRatio: (ratio: number) => void;
  /** 現在一致しているプリセット（自由ドラッグ・途中角度では null） */
  activePreset: CameraPreset | null;
  /** プリセットボタンクリック時のハンドラ */
  onSelectPreset: (preset: CameraPreset) => void;
}

/**
 * 地球・月・太陽の3グループの視点間を滑らかに連続移動できる操作カードです。
 */
export const ViewTransitionWidget: React.FC<ViewTransitionWidgetProps> = ({
  transitionRatio,
  onChangeTransitionRatio,
  activePreset,
  onSelectPreset,
}) => {
  // スマホ等の狭い画面（< 860px）では初期状態で折り畳んで3D画面を広く見せ、タップで展開できるようにします。
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 860 : false
  );
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 860;
      setIsMobileViewport(mobile);
      if (!mobile) {
        setIsMobileExpanded(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleSelectPresetAndCollapse = (preset: CameraPreset) => {
    onSelectPreset(preset);
    if (isMobileViewport) {
      setIsMobileExpanded(false);
    }
  };

  const isBodyVisible = !isMobileViewport || isMobileExpanded;

  const percent = Math.round(transitionRatio * 100);
  const isTokyoGroundView =
    activePreset === "tokyoNorth" ||
    activePreset === "tokyoEast" ||
    activePreset === "tokyoSouth" ||
    activePreset === "tokyoWest";
  const isRealSolarView =
    activePreset === "solarInner" ||
    activePreset === "solarJupiter" ||
    activePreset === "solarFullTop" ||
    activePreset === "solarFullOblique";
  const isSliderDimmed =
    activePreset === "sunOverhead" ||
    activePreset === "sunEclipticOblique" ||
    isTokyoGroundView ||
    isRealSolarView;

  let statusLabel = `移行 ${percent}%`;
  if (activePreset === "northPole") {
    statusLabel = "地球：天の北極";
  } else if (activePreset === "eclipticPlane") {
    statusLabel = "地球：黄道面(水平)";
  } else if (activePreset === "moonNorthPole") {
    statusLabel = "月：天の北極(真上)";
  } else if (activePreset === "moonEclipticPlane") {
    statusLabel = "月：公転面(水平)";
  } else if (activePreset === "sunOverhead") {
    statusLabel = "太陽の真上";
  } else if (activePreset === "sunEclipticOblique") {
    statusLabel = "公転面（やや上）";
  } else if (activePreset === "tokyoNorth") {
    statusLabel = "東京地上：北の空";
  } else if (activePreset === "tokyoEast") {
    statusLabel = "東京地上：東の空";
  } else if (activePreset === "tokyoSouth") {
    statusLabel = "東京地上：南の空";
  } else if (activePreset === "tokyoWest") {
    statusLabel = "東京地上：西の空";
  } else if (activePreset === "solarInner") {
    statusLabel = "太陽系：内惑星";
  } else if (activePreset === "solarJupiter") {
    statusLabel = "太陽系：木星4衛星";
  } else if (activePreset === "solarFullTop") {
    statusLabel = "太陽系：全体(真上)";
  } else if (activePreset === "solarFullOblique") {
    statusLabel = "太陽系：全体(斜め)";
  }

  return (
    <section
      className={`view-transition-card ${
        isMobileViewport && !isMobileExpanded ? "is-mobile-collapsed" : ""
      }`}
      aria-label="地球・月・太陽・東京地上の連続視点移動"
    >
      <div
        className={`view-transition-header ${
          isMobileViewport ? "is-clickable" : ""
        }`}
        onClick={
          isMobileViewport
            ? () => setIsMobileExpanded((prev) => !prev)
            : undefined
        }
        role={isMobileViewport ? "button" : undefined}
        tabIndex={isMobileViewport ? 0 : undefined}
        aria-expanded={isMobileViewport ? isMobileExpanded : undefined}
        onKeyDown={
          isMobileViewport
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsMobileExpanded((prev) => !prev);
                }
              }
            : undefined
        }
      >
        <span className="view-transition-title">
          <Orbit size={13} />
          視点移動
        </span>
        <span className="view-transition-header-right">
          <span className="view-transition-badge">{statusLabel}</span>
          {isMobileViewport && (
            <span className="view-collapse-chevron" aria-hidden="true">
              {isMobileExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </span>
          )}
        </span>
      </div>

      {isBodyVisible && (
        <>
          <div className={`view-slider-wrap ${isSliderDimmed ? "is-dimmed" : ""}`}>
            <input
              type="range"
              className="view-slider"
              min={0}
              max={100}
              step={1}
              value={percent}
              onChange={(e) => onChangeTransitionRatio(Number(e.target.value) / 100)}
              aria-label="天の北極から公転面（水平）への連続視点移動"
            />
            <div className="view-slider-labels">
              <span>天の北極 (0%)</span>
              <span>公転面・水平 (100%)</span>
            </div>
          </div>

          <div className="view-group-block">
            <span className="view-group-label">地球の自転</span>
            <div className="view-preset-grid">
              <button
                type="button"
                className={`choice-btn ${activePreset === "northPole" ? "is-active" : ""}`}
                onClick={() => handleSelectPresetAndCollapse("northPole")}
              >
                <RotateCcw size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                天の北極
              </button>
              <button
                type="button"
                className={`choice-btn ${activePreset === "eclipticPlane" ? "is-active" : ""}`}
                onClick={() => handleSelectPresetAndCollapse("eclipticPlane")}
                title="公転面（黄道面）の真横に降りて、太陽光の水平照射と地軸23.4°の傾きを観察"
              >
                黄道面 (水平)
              </button>
            </div>
          </div>

          <div className="view-group-block">
            <span className="view-group-label">月の公転・満ち欠け</span>
            <div className="view-preset-grid">
              <button
                type="button"
                className={`choice-btn moon-view-btn ${
                  activePreset === "moonNorthPole" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("moonNorthPole")}
                title="天の北極（真上）から、地球の周りを公転して満ち欠けする月を観察"
              >
                <Moon size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                天の北極 (真上)
              </button>
              <button
                type="button"
                className={`choice-btn moon-view-btn ${
                  activePreset === "moonEclipticPlane" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("moonEclipticPlane")}
                title="公転面（水平）から、黄道面に対して約5.1°傾いた白道上を動く月を観察"
              >
                <Moon size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                公転面 (水平)
              </button>
            </div>
          </div>

          <div className="view-group-block">
            <span className="view-group-label">太陽と地球の公転</span>
            <div className="view-preset-grid">
              <button
                type="button"
                className={`choice-btn sun-overhead-btn ${
                  activePreset === "sunOverhead" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("sunOverhead")}
                title="太陽の真上へ連続移動し、公転軌道全体を真上から観察"
              >
                <Sun size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                太陽の真上
              </button>
              <button
                type="button"
                className={`choice-btn sun-overhead-btn ${
                  activePreset === "sunEclipticOblique" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("sunEclipticOblique")}
                title="公転面水平よりやや上から、太陽を回る地球と軌道の奥行きを立体的に観察"
              >
                <Sun size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                公転面 (やや上)
              </button>
            </div>
          </div>

          <div className="view-group-block">
            <span className="view-group-label">
              <Compass size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
              東京の地上から見る空
            </span>
            <div className="view-preset-grid four-col">
              <button
                type="button"
                className={`choice-btn tokyo-view-btn ${
                  activePreset === "tokyoNorth" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("tokyoNorth")}
                title="東京の地上から北の空（高度35.7°の北極星と反時計回りに回る星々）を観察"
              >
                北
              </button>
              <button
                type="button"
                className={`choice-btn tokyo-view-btn ${
                  activePreset === "tokyoEast" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("tokyoEast")}
                title="東京の地上から東の空（太陽・月・星が右上へ昇る様子）を観察"
              >
                東
              </button>
              <button
                type="button"
                className={`choice-btn tokyo-view-btn ${
                  activePreset === "tokyoSouth" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("tokyoSouth")}
                title="東京の地上から南の空（左から右へ弧を描く太陽・月・星の南中）を観察"
              >
                南
              </button>
              <button
                type="button"
                className={`choice-btn tokyo-view-btn ${
                  activePreset === "tokyoWest" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("tokyoWest")}
                title="東京の地上から西の空（太陽・月・星が右下へ沈む様子）を観察"
              >
                西
              </button>
            </div>
          </div>

          <div className="view-group-block">
            <span className="view-group-label">
              <Sparkles size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
              リアル太陽系（水〜冥・衛星）
            </span>
            <div className="view-preset-grid">
              <button
                type="button"
                className={`choice-btn solar-real-btn ${
                  activePreset === "solarInner" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("solarInner")}
                title="水星・金星・地球（月付き）・火星の忠実な1:1 AU 楕円軌道を真上から観察"
              >
                内惑星 (水金地火)
              </button>
              <button
                type="button"
                className={`choice-btn solar-real-btn ${
                  activePreset === "solarJupiter" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("solarJupiter")}
                title="木星へ滑らかに接近し、主要4衛星（イオ・エウロパ・ガニメデ・カリスト）の公転を観察"
              >
                木星・4衛星
              </button>
              <button
                type="button"
                className={`choice-btn solar-real-btn ${
                  activePreset === "solarFullTop" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("solarFullTop")}
                title="水金地火木土天海冥までの太陽系全体を1:1 AU 縮尺の真上から一望"
              >
                全体・真上
              </button>
              <button
                type="button"
                className={`choice-btn solar-real-btn ${
                  activePreset === "solarFullOblique" ? "is-active" : ""
                }`}
                onClick={() => handleSelectPresetAndCollapse("solarFullOblique")}
                title="太陽系全体を斜めから観察し、冥王星の約17.2°傾いた楕円軌道と海王星との位置関係を確認"
              >
                全体・斜め
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};
