import React from "react";
import { Orbit, RotateCcw } from "lucide-react";
import { CameraPreset } from "../types/astronomy";

interface ViewTransitionWidgetProps {
  /** 現在の連続視点スライダー値（0 = 天の北極真上、1 = 公転面の水平視点） */
  transitionRatio: number;
  /** 連続スライダー変更時のハンドラ */
  onChangeTransitionRatio: (ratio: number) => void;
  /** 現在一致しているプリセット（自由ドラッグ中は null） */
  activePreset: CameraPreset | null;
  /** プリセットボタンクリック時のハンドラ */
  onSelectPreset: (preset: CameraPreset) => void;
}

/**
 * 天の北極からの視点と、公転面（黄道面）からの視点を
 * スライダーとボタンで滑らかに連続移動できる操作カードです。
 */
export const ViewTransitionWidget: React.FC<ViewTransitionWidgetProps> = ({
  transitionRatio,
  onChangeTransitionRatio,
  activePreset,
  onSelectPreset,
}) => {
  const percent = Math.round(transitionRatio * 100);

  let statusLabel = `移行 ${percent}%`;
  if (activePreset === "northPole") {
    statusLabel = "天の北極（真上）";
  } else if (activePreset === "oblique") {
    statusLabel = "斜め俯瞰";
  } else if (activePreset === "eclipticNorth") {
    statusLabel = "黄道面（真上）";
  } else if (activePreset === "eclipticPlane") {
    statusLabel = "黄道面（水平）";
  }

  return (
    <section
      className="view-transition-card"
      aria-label="天の北極と黄道面（公転面）の連続視点移動"
    >
      <div className="view-transition-header">
        <span className="view-transition-title">
          <Orbit size={13} />
          視点移動（天の北極 ⇄ 黄道面）
        </span>
        <span className="view-transition-badge">{statusLabel}</span>
      </div>

      <div className="view-slider-wrap">
        <input
          type="range"
          className="view-slider"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(e) => onChangeTransitionRatio(Number(e.target.value) / 100)}
          aria-label="天の北極から黄道面（公転面）への連続視点移動"
        />
        <div className="view-slider-labels">
          <span>天の北極 (0%)</span>
          <span>黄道面・水平 (100%)</span>
        </div>
      </div>

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
          className={`choice-btn ${activePreset === "oblique" ? "is-active" : ""}`}
          onClick={() => onSelectPreset("oblique")}
        >
          斜め俯瞰
        </button>
        <button
          type="button"
          className={`choice-btn ${activePreset === "eclipticNorth" ? "is-active" : ""}`}
          onClick={() => onSelectPreset("eclipticNorth")}
          title="公転面（黄道面）に垂直な真上から見下ろし、地軸が23.4°傾いている様子を観察"
        >
          黄道面 (真上)
        </button>
        <button
          type="button"
          className={`choice-btn ${activePreset === "eclipticPlane" ? "is-active" : ""}`}
          onClick={() => onSelectPreset("eclipticPlane")}
          title="公転面（黄道面）の真横に降りて、太陽光の水平照射と地軸の傾きを観察"
        >
          黄道面 (水平)
        </button>
      </div>
    </section>
  );
};
