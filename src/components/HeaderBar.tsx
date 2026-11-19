import React from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

interface HeaderBarProps {
  /** 観察パネルが開いているか */
  isInspectorOpen: boolean;
  /** 観察パネルの開閉トグル */
  onToggleInspector: () => void;
}

/**
 * 画面右上に配置するシンプルなヘッダーバーです。
 * 3D 空間を広く見せるため、観察パネルの開閉ボタンのみを表示します。
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  isInspectorOpen,
  onToggleInspector,
}) => {
  return (
    <header className="header-bar">
      <div className="header-actions">
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
