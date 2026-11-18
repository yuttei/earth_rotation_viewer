import React from "react";
import { Compass, Eye, PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import {
  ReferenceFrame,
  SolarSystemState,
  VisualStyle,
} from "../types/astronomy";
import {
  formatDateTimeParts,
  getSeasonLabelJa,
} from "../astronomy/calculations";

interface HeaderBarProps {
  /** 現在の観測日時 */
  currentDate: Date;
  /** 天文計算による太陽・地球状態 */
  solarState: SolarSystemState;
  /** 現在のビジュアルモード */
  visualStyle: VisualStyle;
  /** ビジュアルモード変更ハンドラ */
  onChangeVisualStyle: (style: VisualStyle) => void;
  /** 現在の基準座標系 */
  referenceFrame: ReferenceFrame;
  /** 観察パネルが開いているか */
  isInspectorOpen: boolean;
  /** 観察パネルの開閉トグル */
  onToggleInspector: () => void;
}

/**
 * 画面上部に配置するヘッダーバーです。
 * 観測中の日時・太陽赤緯・北極点の昼夜状態と、ビジュアルモード切替を表示します。
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentDate,
  solarState,
  visualStyle,
  onChangeVisualStyle,
  referenceFrame,
  isInspectorOpen,
  onToggleInspector,
}) => {
  const { utcText, jstText } = formatDateTimeParts(currentDate);
  const seasonLabel = getSeasonLabelJa(solarState.sunEclipticLongitudeDeg);
  const declSign = solarState.subsolarLatDeg >= 0 ? "+" : "";

  const poleBadgeInfo = {
    "polar-day": { label: "北極：白夜（ずっと昼）", cls: "polar-day" },
    "polar-night": { label: "北極：極夜（ずっと夜）", cls: "polar-night" },
    "equinox-transition": {
      label: "北極：昼夜の境界付近",
      cls: "equinox-transition",
    },
  }[solarState.northPoleDaylightState];

  return (
    <header className="header-bar">
      <div className="header-card">
        <div className="brand-block">
          <div className="brand-icon" aria-hidden="true">
            <Compass size={18} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-code">POLARIS</span>
              <h1 className="brand-title">天の北極から見る地球の自転</h1>
            </div>
            <p className="brand-subtitle">
              {referenceFrame === "solar"
                ? "太陽方向を固定表示中（昼夜と季節の変化を観察）"
                : "恒星・春分点を固定表示中（恒星日と公転のズレを観察）"}
            </p>
          </div>
        </div>
      </div>

      <div className="telemetry-strip" aria-label="観測テレメトリ">
        <div className="telemetry-item">
          <span className="telemetry-label">観測日時 (日本時間 / UTC)</span>
          <span className="telemetry-value">
            {jstText} <span style={{ opacity: 0.55 }}>/ {utcText.slice(11)}</span>
          </span>
        </div>

        <div className="telemetry-divider" aria-hidden="true" />

        <div className="telemetry-item">
          <span className="telemetry-label">太陽赤緯・季節</span>
          <span className="telemetry-value">
            {declSign}
            {solarState.subsolarLatDeg.toFixed(1)}° ({seasonLabel})
          </span>
        </div>

        <div className="telemetry-divider" aria-hidden="true" />

        <span className={`pole-badge ${poleBadgeInfo.cls}`}>
          {poleBadgeInfo.label}
        </span>
      </div>

      <div className="header-actions">
        <div className="segmented-pill" role="group" aria-label="ビジュアル切替">
          <button
            type="button"
            className={`segmented-btn ${visualStyle === "realistic" ? "is-active" : ""}`}
            onClick={() => onChangeVisualStyle("realistic")}
          >
            <Sparkles size={13} />
            宇宙リアル
          </button>
          <button
            type="button"
            className={`segmented-btn ${visualStyle === "diagram" ? "is-active" : ""}`}
            onClick={() => onChangeVisualStyle("diagram")}
          >
            <Eye size={13} />
            天文図解
          </button>
        </div>

        <button
          type="button"
          className="icon-toggle-btn"
          onClick={onToggleInspector}
          aria-expanded={isInspectorOpen}
        >
          {isInspectorOpen ? (
            <>
              <PanelRightClose size={15} />
              パネルを隠す
            </>
          ) : (
            <>
              <PanelRightOpen size={15} />
              観察パネル
            </>
          )}
        </button>
      </div>
    </header>
  );
};
