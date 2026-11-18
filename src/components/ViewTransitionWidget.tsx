import React from "react";
import { Compass, Moon, Orbit, RotateCcw, Sun } from "lucide-react";
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
  const percent = Math.round(transitionRatio * 100);
  const isTokyoGroundView =
    activePreset === "tokyoNorth" ||
    activePreset === "tokyoEast" ||
    activePreset === "tokyoSouth" ||
    activePreset === "tokyoWest";
  const isSliderDimmed =
    activePreset === "sunOverhead" ||
    activePreset === "sunEclipticOblique" ||
    isTokyoGroundView;

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
  }

  return (
    <section
      className="view-transition-card"
      aria-label="地球・月・太陽・東京地上の連続視点移動"
    >
      <div className="view-transition-header">
        <span className="view-transition-title">
          <Orbit size={13} />
          視点移動
        </span>
        <span className="view-transition-badge">{statusLabel}</span>
      </div>

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
            onClick={() => onSelectPreset("northPole")}
          >
            <RotateCcw size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
            天の北極
          </button>
          <button
            type="button"
            className={`choice-btn ${activePreset === "eclipticPlane" ? "is-active" : ""}`}
            onClick={() => onSelectPreset("eclipticPlane")}
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
            onClick={() => onSelectPreset("moonNorthPole")}
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
            onClick={() => onSelectPreset("moonEclipticPlane")}
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
            onClick={() => onSelectPreset("sunOverhead")}
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
            onClick={() => onSelectPreset("sunEclipticOblique")}
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
            onClick={() => onSelectPreset("tokyoNorth")}
            title="東京の地上から北の空（高度35.7°の北極星と反時計回りに回る星々）を観察"
          >
            北
          </button>
          <button
            type="button"
            className={`choice-btn tokyo-view-btn ${
              activePreset === "tokyoEast" ? "is-active" : ""
            }`}
            onClick={() => onSelectPreset("tokyoEast")}
            title="東京の地上から東の空（太陽・月・星が右上へ昇る様子）を観察"
          >
            東
          </button>
          <button
            type="button"
            className={`choice-btn tokyo-view-btn ${
              activePreset === "tokyoSouth" ? "is-active" : ""
            }`}
            onClick={() => onSelectPreset("tokyoSouth")}
            title="東京の地上から南の空（左から右へ弧を描く太陽・月・星の南中）を観察"
          >
            南
          </button>
          <button
            type="button"
            className={`choice-btn tokyo-view-btn ${
              activePreset === "tokyoWest" ? "is-active" : ""
            }`}
            onClick={() => onSelectPreset("tokyoWest")}
            title="東京の地上から西の空（太陽・月・星が右下へ沈む様子）を観察"
          >
            西
          </button>
        </div>
      </div>
    </section>
  );
};
