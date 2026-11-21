import React from "react";
import { CheckCircle2, Circle, RotateCcw, Trophy } from "lucide-react";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  DISTINCT_BODY_CARDS_GOAL,
  DISTINCT_IMPACTOR_TYPES_GOAL,
  SIMULTANEOUS_RIGELS_GOAL,
  AchievementId,
  getAchievementListTitle,
} from "../achievements/definitions";
import { AchievementState, countUnlocked } from "../achievements/achievementState";

interface AchievementListProps {
  state: AchievementState;
  /** 「記録を消す」が確認のうえで押されたとき */
  onReset: () => void;
}

/**
 * 観察パネルの「実績」タブの中身です。
 * 進捗（n/23。全体の数は定義の個数から数えます）と、分類ごとの実績一覧（未達成のものも「やること」を表示）を並べます。
 * シークレットの実績は、達成するまで名前だけを「？？？」にします（やることと進捗は表示します）。
 */
export const AchievementList: React.FC<AchievementListProps> = ({
  state,
  onReset,
}) => {
  const total = ACHIEVEMENTS.length;
  const done = countUnlocked(state);
  const percent = Math.round((done / total) * 100);

  /** 「〇種類」「同時に〇個」の実績は、未達成のあいだ今の累計や最大記録（例：2/5）を添えます */
  const progressText = (id: AchievementId): string | null => {
    if (id === "open-five-body-cards") {
      return `${Math.min(state.progress.openedBodyIds.length, DISTINCT_BODY_CARDS_GOAL)}/${DISTINCT_BODY_CARDS_GOAL}`;
    }
    if (id === "place-five-impactor-types") {
      return `${Math.min(state.progress.placedImpactorIds.length, DISTINCT_IMPACTOR_TYPES_GOAL)}/${DISTINCT_IMPACTOR_TYPES_GOAL}`;
    }
    if (id === "five-rigels-at-once") {
      // これまでに同時に置けたリゲルの最大数
      return `${Math.min(state.progress.maxSimultaneousRigels, SIMULTANEOUS_RIGELS_GOAL)}/${SIMULTANEOUS_RIGELS_GOAL}`;
    }
    return null;
  };

  const handleReset = () => {
    // 消すと元に戻せないため、ブラウザの確認ダイアログで本当に消すかを聞きます
    if (window.confirm("実績の記録をすべて消します。よろしいですか？")) {
      onReset();
    }
  };

  return (
    <>
      <div className="section-card achievement-summary-card">
        <h2 className="section-title">
          <Trophy size={13} />
          実績
        </h2>
        <div className="achievement-progress-row">
          <span className="achievement-progress-count">
            {done}
            <span className="achievement-progress-total">/{total}</span>
          </span>
          <div
            className="achievement-progress-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label="実績の達成数"
          >
            <div
              className="achievement-progress-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <p className="achievement-note">
          記録はこのブラウザだけに保存されます。
        </p>
      </div>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const items = ACHIEVEMENTS.filter((a) => a.category === category.id);
        return (
          <div key={category.id} className="section-card">
            <h3 className="achievement-category-title">{category.titleJa}</h3>
            <ul className="achievement-list">
              {items.map((item) => {
                const isDone = state.unlocked[item.id] !== undefined;
                const extra = isDone ? null : progressText(item.id);
                const title = getAchievementListTitle(item, isDone);
                // 名前を隠しているときは、読み上げソフトにもシークレットであることを伝えます
                const isHiddenSecret = title !== item.titleJa;
                return (
                  <li
                    key={item.id}
                    className={`achievement-item ${isDone ? "is-done" : ""}`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={16}
                        className="achievement-item-icon"
                        aria-label="達成済み"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="achievement-item-icon"
                        aria-label="未達成"
                      />
                    )}
                    <div className="achievement-item-text">
                      <span className="achievement-item-title">
                        {isHiddenSecret ? (
                          <span aria-label="シークレット実績（名前は達成すると表示）">
                            {title}
                          </span>
                        ) : (
                          title
                        )}
                        {extra && (
                          <span className="achievement-item-count">{extra}</span>
                        )}
                      </span>
                      <span className="achievement-item-hint">{item.hintJa}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="achievement-reset-row">
        <button
          type="button"
          className="choice-btn achievement-reset-btn"
          onClick={handleReset}
          disabled={
            done === 0 &&
            state.progress.openedBodyIds.length === 0 &&
            state.progress.placedImpactorIds.length === 0 &&
            state.progress.maxSimultaneousRigels === 0
          }
        >
          <RotateCcw size={11} style={{ marginRight: 4, verticalAlign: -1 }} />
          記録を消す
        </button>
      </div>
    </>
  );
};
