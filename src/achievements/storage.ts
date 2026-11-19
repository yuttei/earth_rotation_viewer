import { AchievementState, createEmptyAchievementState } from "./achievementState";
import { isAchievementId } from "./definitions";

/**
 * 実績の達成状況を、ユーザーのブラウザ（localStorage）へ保存・読み込みする処理です。
 * テストでは本物の localStorage の代わりに、同じ形のオブジェクトを渡せるようにしています。
 */

/** localStorage に保存するときの名前（キー）。形式を変えたら末尾の版番号を上げます */
export const ACHIEVEMENT_STORAGE_NAME = "polaris.achievements.v1";

/** 保存・読み込みに必要な localStorage の機能だけを取り出した型 */
export type AchievementStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

/**
 * ブラウザの localStorage を取り出します。
 * プライベートブラウズやサイトデータの無効化で使えない場合は、エラーにせず null を返します。
 */
export function getBrowserStorage(): AchievementStorage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * 保存データを読み込みます。
 * データがない・壊れている・形が違う場合でもエラーにせず、読める部分だけを使い、残りは空の状態にします。
 */
export function loadAchievementState(
  storage: AchievementStorage | null
): AchievementState {
  const empty = createEmptyAchievementState();
  if (!storage) return empty;

  let raw: string | null = null;
  try {
    raw = storage.getItem(ACHIEVEMENT_STORAGE_NAME);
  } catch {
    return empty;
  }
  if (!raw) return empty;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!isPlainObject(parsed)) return empty;

  // 達成済みの実績：知っている id で、値が文字列のものだけを残します
  const unlocked: AchievementState["unlocked"] = {};
  if (isPlainObject(parsed.unlocked)) {
    for (const [id, value] of Object.entries(parsed.unlocked)) {
      if (isAchievementId(id) && typeof value === "string") {
        unlocked[id] = value;
      }
    }
  }

  // 累計記録：文字列の配列だけを、重複を除いて残します
  const progress = isPlainObject(parsed.progress) ? parsed.progress : {};
  return {
    version: 1,
    unlocked,
    progress: {
      openedBodyIds: readStringList(progress.openedBodyIds),
      placedImpactorIds: readStringList(progress.placedImpactorIds),
    },
  };
}

/** 状態を保存します。保存できなかった場合は false を返します（アプリはそのまま動かします）。 */
export function saveAchievementState(
  storage: AchievementStorage | null,
  state: AchievementState
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ACHIEVEMENT_STORAGE_NAME, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** 保存データを消します。消せなかった場合は false を返します。 */
export function clearAchievementState(
  storage: AchievementStorage | null
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(ACHIEVEMENT_STORAGE_NAME);
    return true;
  } catch {
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && !result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}
