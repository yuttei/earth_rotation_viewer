import React from "react";
import { Orbit, RotateCcw, Sun } from "lucide-react";
import { CameraPreset } from "../types/astronomy";

interface ViewTransitionWidgetProps {
  /** 現在の連続視点スライダー値（0 = 天の北極真上、1 = 黄道面・水平） */
  transitionRatio: number;
  /** 連続スライダー変更時のハンドラ */
  onChangeTransitionRatio: (ratio: number) => void;
  /** 現在一致しているプリセット（自由ドラッグ・途中角度では null） */
  activePreset: CameraPreset | null;
  /** プリセットボタンクリック時のハンドラ */
  onSelectPreset: (preset: CameraPreset) => void;
}

/**
 * 天の北極・黄道面（水平）・太陽中心（真上 / 公転面やや上）の各視点を
 * 滑らかに連続移動できる操作カードです。
 */
export const ViewTransitionWidget: React.FC<ViewTransitionWidgetProps> = ({
  transitionRatio,
  onChangeTransitionRatio,
  activePreset,
  onSelectPreset,
}) => {
  const percent = Math.round(transitionRatio * 100);
  const isSunView =
    activePreset === "sunOverhead" || activePreset === "sunEclipticOblique";

  let statusLabel = `移行 ${percent}%`;
  if (activePreset === "northPole") {
    statusLabel = "天の北極";
  } else if (activePreset === "eclipticPlane") {
    statusLabel = "黄道面（水平）";
  } else if (activePreset === "sunOverhead") {
    statusLabel = "太陽の真上";
  } else if (activePreset === "sunEclipticOblique") {
    statusLabel = "公転面（やや上）";
  }

  return (
    <section
      className="view-transition-card"
      aria-label="天の北極・黄道面・太陽公転の連続視点移動"
    >
      <div className="view-transition-header">
        <span className="view-transition-title">
          <Orbit size={13} />
          視点移動（天の北極 ⇄ 黄道面）
        </span>
        <span className="view-transition-badge">{statusLabel}</span>
      </div>

      <div className={`view-slider-wrap ${isSunView ? "is-dimmed" : ""}`}>
        <input
          type="range"
          className="view-slider"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={(e) => onChangeTransitionRatio(Number(e.target.value) / 100)}
          aria-label="天の北極から黄道面（水平）への連続視点移動"
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
          className={`choice-btn ${activePreset === "eclipticPlane" ? "is-active" : ""}`}
          onClick={() => onSelectPreset("eclipticPlane")}
          title="公転面（黄道面）の真横に降りて、太陽光の水平照射と地軸23.4°の傾きを観察"
        >
          黄道面 (水平)
        </button>
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
    </section>
  );
};
