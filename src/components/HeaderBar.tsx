import React from "react";
import { Compass, Crosshair, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
import { IMPACTOR_SPECS, ImpactorId } from "../astronomy/impactPhysics";
import { MAX_LIVE_IMPACTORS } from "../scene/impactSystem";

interface HeaderBarProps {
  /** 観察パネルが開いているか */
  isInspectorOpen: boolean;
  /** 観察パネルの開閉トグル */
  onToggleInspector: () => void;
  /** 1本指の操作が「天体を狙う」モードになっているか（false なら通常の視点移動） */
  isImpactAimMode: boolean;
  /** 1本指の操作モード（視点移動 ⇄ 天体を狙う）を切り替えるコールバック */
  onToggleImpactAimMode: () => void;
  /** 現在選択されている落下天体の記号と名前 */
  selectedImpactorLabel: string;
  /** 現在選択されている落下天体の種類 */
  selectedImpactorId: ImpactorId;
  /** 落下天体の種類を切り替えるコールバック（観察パネルを開かずに種類を変えて続けて置くため） */
  onSelectImpactor: (id: ImpactorId) => void;
  /** 今置かれている投入天体の数 */
  liveImpactorCount: number;
  /** 衝突演出中で「すぐ復活」が可能か */
  canRestoreImpact: boolean;
  /** 太陽系の全天体を滑らかに復活させ、置いた天体をすべて消すコールバック */
  onRestoreImpact: () => void;
}

/**
 * 画面右上に配置するシンプルなヘッダーバーです。
 * 1本指での「視点移動 ⇄ 天体を狙う」モード切替と、観察パネルの開閉ボタンを並べて配置します。
 * 「天体を狙う」モードの間は、その下に天体の種類を選ぶ小さなボタン列を出し、
 * 種類を切り替えながら何個でも続けて置けるようにします。
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  isInspectorOpen,
  onToggleInspector,
  isImpactAimMode,
  onToggleImpactAimMode,
  selectedImpactorLabel,
  selectedImpactorId,
  onSelectImpactor,
  liveImpactorCount,
  canRestoreImpact,
  onRestoreImpact,
}) => {
  return (
    <header className="header-bar">
      <div className="header-actions">
        {canRestoreImpact && (
          <button
            type="button"
            className="icon-toggle-btn is-restore-chip"
            onClick={onRestoreImpact}
            aria-label="太陽系をすぐ復活させる（置いた天体はすべて消えます）"
            title="太陽系をすぐ復活させる（置いた天体はすべて消えます）"
          >
            <RotateCcw size={13} style={{ marginRight: 4 }} />
            復活
          </button>
        )}
        <button
          type="button"
          className={`icon-toggle-btn is-mode-switch ${
            isImpactAimMode ? "is-aim-active" : ""
          }`}
          onClick={onToggleImpactAimMode}
          aria-pressed={isImpactAimMode}
          aria-label={
            isImpactAimMode
              ? "1本指：天体を狙うモード（タップで視点移動へ切替）"
              : "1本指：視点移動モード（タップで天体を狙うモードへ切替）"
          }
          title={
            isImpactAimMode
              ? "現在：1本指で天体を狙う（クリックで視点移動モードへ切替）"
              : "現在：1本指で視点を移動（クリックで天体を狙うモードへ切替）"
          }
        >
          {isImpactAimMode ? (
            <>
              <Crosshair size={13} style={{ marginRight: 5 }} />
              狙う：{selectedImpactorLabel}
            </>
          ) : (
            <>
              <Compass size={13} style={{ marginRight: 5 }} />
              視点移動
            </>
          )}
        </button>
        <button
          type="button"
          className="icon-toggle-btn"
          onClick={onToggleInspector}
          aria-expanded={isInspectorOpen}
          aria-label={isInspectorOpen ? "観察パネルを隠す" : "観察パネルを開く"}
          title={isInspectorOpen ? "観察パネルを隠す" : "観察パネルを開く"}
        >
          {isInspectorOpen ? (
            <PanelRightClose size={16} />
          ) : (
            <PanelRightOpen size={16} />
          )}
        </button>
      </div>

      {isImpactAimMode && (
        <div
          className="impact-quick-picker"
          role="group"
          aria-label="置く天体の種類"
        >
          {IMPACTOR_SPECS.map((spec) => {
            const isSelected = spec.id === selectedImpactorId;
            return (
              <button
                key={spec.id}
                type="button"
                className={`impact-quick-btn ${isSelected ? "is-active" : ""}`}
                style={
                  isSelected
                    ? {
                        borderColor: spec.accentColor,
                        boxShadow: `0 0 12px ${spec.accentColor}55`,
                      }
                    : undefined
                }
                onClick={() => onSelectImpactor(spec.id)}
                aria-pressed={isSelected}
                aria-label={spec.nameJa}
                title={spec.nameJa}
              >
                <span style={{ color: spec.accentColor }}>{spec.symbol}</span>
              </button>
            );
          })}
          <span
            className="impact-quick-count"
            title={`同時に置けるのは${MAX_LIVE_IMPACTORS}個までです（超えると古い天体から消えます）`}
          >
            置いた天体 {liveImpactorCount}/{MAX_LIVE_IMPACTORS}
          </span>
        </div>
      )}
    </header>
  );
};
