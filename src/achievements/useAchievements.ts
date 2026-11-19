import { useCallback, useEffect, useRef, useState } from "react";
import {
  AchievementEvent,
  AchievementState,
  createEmptyAchievementState,
} from "./achievementState";
import { AchievementId } from "./definitions";
import {
  ACHIEVEMENT_STORAGE_NAME,
  clearAchievementState,
  getBrowserStorage,
  loadAchievementState,
  readStoredAchievementState,
  recordAchievementEventWithStorage,
} from "./storage";

/** 2つの状態の中身が同じかを調べます（同じなら画面を描き直さないため） */
function isSameState(a: AchievementState, b: AchievementState): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/** 達成通知を1件あたり表示する時間（ミリ秒） */
export const ACHIEVEMENT_TOAST_DURATION_MS = 3000;

/** 画面上部に順番に表示する達成通知 */
export interface AchievementToastItem {
  /** 同じ実績を消して再達成した場合も別の通知として扱うための通し番号 */
  key: number;
  id: AchievementId;
}

/**
 * 実績の達成状況を管理する React フックです。
 * - record(出来事)：操作が起きたことを知らせ、新しく達成した実績があれば保存して通知の列に積みます
 *   （保存データを読み直してから反映するので、複数のタブで開いていても記録を上書きして消しません）
 * - ほかのタブで記録が増えたり消されたりしたら、storage イベントで受け取り、この画面の表示も合わせます
 * - reset()：記録をすべて消します
 * - currentToast：いま表示する達成通知（なければ null）。3秒たつと次の通知に切り替わります
 */
export function useAchievements() {
  const [state, setState] = useState<AchievementState>(() =>
    loadAchievementState(getBrowserStorage())
  );
  // 同じ瞬間に record が何度も呼ばれても取りこぼさないよう、最新の状態をすぐ読める ref にも持ちます
  const stateRef = useRef<AchievementState>(state);
  const [toastQueue, setToastQueue] = useState<AchievementToastItem[]>([]);
  const toastKeyRef = useRef(0);

  /** 画面が持つ状態を更新します（中身が変わらないときは描き直しません） */
  const applyState = useCallback((next: AchievementState) => {
    if (isSameState(stateRef.current, next)) return;
    stateRef.current = next;
    setState(next);
  }, []);

  const record = useCallback((event: AchievementEvent) => {
    const result = recordAchievementEventWithStorage(
      getBrowserStorage(),
      stateRef.current,
      event,
      new Date().toISOString()
    );
    applyState(result.state);

    if (result.newlyUnlocked.length > 0) {
      const items: AchievementToastItem[] = [];
      for (const id of result.newlyUnlocked) {
        toastKeyRef.current += 1;
        items.push({ key: toastKeyRef.current, id });
      }
      setToastQueue((prev) => [...prev, ...items]);
    }
  }, [applyState]);

  /** 操作で即達成する実績を記録する、よく使う形の近道 */
  const unlock = useCallback(
    (id: AchievementId) => record({ type: "unlock", id }),
    [record]
  );

  const reset = useCallback(() => {
    clearAchievementState(getBrowserStorage());
    applyState(createEmptyAchievementState());
    setToastQueue([]);
  }, [applyState]);

  // ほかのタブで記録が更新・消去されたら、保存データを読み直してこの画面にも反映します。
  // （storage イベントは、変更したタブ自身ではなく、同じサイトを開いているほかのタブにだけ届きます）
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // e.key が null なのは、ほかのタブで localStorage 全体が消されたとき
      if (e.key !== null && e.key !== ACHIEVEMENT_STORAGE_NAME) return;
      const latest = readStoredAchievementState(getBrowserStorage());
      if (latest) applyState(latest);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [applyState]);

  // 先頭の通知を3秒表示したら列から外し、次の通知を表示します
  const currentToast = toastQueue.length > 0 ? toastQueue[0] : null;
  useEffect(() => {
    if (!currentToast) return;
    const timerId = window.setTimeout(() => {
      setToastQueue((prev) => prev.slice(1));
    }, ACHIEVEMENT_TOAST_DURATION_MS);
    return () => window.clearTimeout(timerId);
  }, [currentToast]);

  return { state, record, unlock, reset, currentToast };
}
