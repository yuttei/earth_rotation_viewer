import {
  AchievementId,
  DISTINCT_BODY_CARDS_GOAL,
  DISTINCT_IMPACTOR_TYPES_GOAL,
  RIGEL_IMPACTOR_ID,
  SIMULTANEOUS_RIGELS_GOAL,
} from "./definitions";

/**
 * 実績の達成状況（ブラウザに保存する内容そのもの）です。
 * 画面や保存処理から切り離した「純粋な計算」だけをここに置き、単体テストしやすくしています。
 */
export interface AchievementState {
  /** 保存形式の版（形式を変えたときに古いデータを見分けるため） */
  version: 1;
  /** 達成した実績と、その日時（ISO 形式の文字列） */
  unlocked: Partial<Record<AchievementId, string>>;
  /** 「〇種類」「同時に〇個」の実績のための累計記録 */
  progress: {
    /** 解説カードを開いた天体の id（重複なし） */
    openedBodyIds: string[];
    /** 衝突シミュレーターで置いた天体の種類の id（重複なし） */
    placedImpactorIds: string[];
    /**
     * これまでに同時に置けたリゲルの数の最大値（0 以上の整数）。
     * この項目を追加する前の保存データには無いので、読み込むときは 0 として扱います。
     */
    maxSimultaneousRigels: number;
  };
}

/** progress のうち、文字列の配列で累計する項目の名前 */
type DistinctListKey = "openedBodyIds" | "placedImpactorIds";

/** アプリで起きた出来事（実績の判定に使う入力） */
export type AchievementEvent =
  /** その操作をしたら即達成する実績 */
  | { type: "unlock"; id: AchievementId }
  /** 天体の解説カードを開いた */
  | { type: "open-body"; bodyId: string }
  /**
   * 衝突シミュレーターで天体を置いた。
   * liveSameTypeCount は、置いた直後（衝突の判定より前）に、同じ種類の天体が同時にいくつ置かれているか（今置いた1個を含む）
   */
  | { type: "place-impactor"; impactorId: string; liveSameTypeCount: number };

export interface AchievementUpdateResult {
  /** 更新後の状態（何も変わらなければ、渡した状態と同じオブジェクト） */
  state: AchievementState;
  /** 今回新しく達成した実績（通知に使う） */
  newlyUnlocked: AchievementId[];
}

/** 何も達成していない、空の状態を作ります。 */
export function createEmptyAchievementState(): AchievementState {
  return {
    version: 1,
    unlocked: {},
    progress: { openedBodyIds: [], placedImpactorIds: [], maxSimultaneousRigels: 0 },
  };
}

/** 達成済みの実績の数を数えます。 */
export function countUnlocked(state: AchievementState): number {
  return Object.keys(state.unlocked).length;
}

/**
 * 出来事を1つ受け取り、新しく達成した実績を反映した状態を返します。
 * 元の状態は書き換えず、変化があったときだけ新しいオブジェクトを作ります（React の状態として扱いやすくするため）。
 * すでに達成済みの実績は、もう一度達成しても日時を上書きしません。
 */
export function applyAchievementEvent(
  state: AchievementState,
  event: AchievementEvent,
  nowIso: string
): AchievementUpdateResult {
  // この出来事で達成になる実績の候補と、更新後の累計記録を決めます
  const candidates: AchievementId[] = [];
  let progress = state.progress;

  if (event.type === "unlock") {
    candidates.push(event.id);
  } else if (event.type === "open-body") {
    candidates.push("open-body-card");
    progress = addDistinct(progress, "openedBodyIds", event.bodyId);
    if (progress.openedBodyIds.length >= DISTINCT_BODY_CARDS_GOAL) {
      candidates.push("open-five-body-cards");
    }
  } else {
    candidates.push("place-impactor");
    progress = addDistinct(progress, "placedImpactorIds", event.impactorId);
    if (progress.placedImpactorIds.length >= DISTINCT_IMPACTOR_TYPES_GOAL) {
      candidates.push("place-five-impactor-types");
    }
    // リゲルを置いたときは、同時に置かれているリゲルの数の最大記録を更新します
    if (event.impactorId === RIGEL_IMPACTOR_ID) {
      if (event.liveSameTypeCount > progress.maxSimultaneousRigels) {
        progress = { ...progress, maxSimultaneousRigels: event.liveSameTypeCount };
      }
      if (progress.maxSimultaneousRigels >= SIMULTANEOUS_RIGELS_GOAL) {
        candidates.push("five-rigels-at-once");
      }
    }
  }

  // まだ達成していないものだけを「新しく達成」として記録します
  const newlyUnlocked: AchievementId[] = [];
  for (const id of candidates) {
    if (state.unlocked[id] === undefined) {
      newlyUnlocked.push(id);
    }
  }

  if (newlyUnlocked.length === 0 && progress === state.progress) {
    return { state, newlyUnlocked };
  }

  const unlocked = { ...state.unlocked };
  for (const id of newlyUnlocked) {
    unlocked[id] = nowIso;
  }
  return {
    state: { version: 1, unlocked, progress },
    newlyUnlocked,
  };
}

/** 累計リストに、まだ入っていない値だけを追加します（入っていればそのまま返します）。 */
function addDistinct(
  progress: AchievementState["progress"],
  key: DistinctListKey,
  value: string
): AchievementState["progress"] {
  if (progress[key].includes(value)) {
    return progress;
  }
  return { ...progress, [key]: [...progress[key], value] };
}
