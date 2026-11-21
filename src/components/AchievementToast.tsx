import React from "react";
import { Trophy } from "lucide-react";
import { ACHIEVEMENT_MAP } from "../achievements/definitions";
import { AchievementToastItem } from "../achievements/useAchievements";

interface AchievementToastProps {
  /** いま表示する達成通知（なければ何も表示しません） */
  toast: AchievementToastItem | null;
}

/**
 * 実績を達成した瞬間に画面上部へ出す小さな通知です。
 * 3D 画面の操作を邪魔しないよう、クリックやタップは下へ素通りさせます（CSS の pointer-events: none）。
 */
export const AchievementToast: React.FC<AchievementToastProps> = ({ toast }) => {
  // 読み上げソフトにも達成を伝えるため、通知がないときも枠（aria-live）だけは置いておきます
  return (
    <div className="achievement-toast-layer" aria-live="polite">
      {toast && (
        // key を変えると、同じ見た目でも新しい通知として出現アニメーションをやり直します
        <div key={toast.key} className="achievement-toast" role="status">
          <Trophy size={15} className="achievement-toast-icon" aria-hidden="true" />
          <span className="achievement-toast-label">実績解除：</span>
          <span className="achievement-toast-title">
            {/* シークレットの実績も、達成した瞬間なので本当の名前を出します */}
            {ACHIEVEMENT_MAP[toast.id].titleJa}
          </span>
        </div>
      )}
    </div>
  );
};
