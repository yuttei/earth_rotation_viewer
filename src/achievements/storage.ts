import {
  AchievementEvent,
  AchievementState,
  AchievementUpdateResult,
  applyAchievementEvent,
  createEmptyAchievementState,
} from "./achievementState";
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
  return readStoredAchievementState(storage) ?? createEmptyAchievementState();
}

/**
 * 保存データを読み込みます。loadAchievementState との違いは、
 * 「localStorage そのものが使えない（読めない）」ときに空の状態ではなく null を返す点です。
 * null なら「保存データは頼れないので、画面が持っている状態を使う」と判断できます。
 */
export function readStoredAchievementState(
  storage: AchievementStorage | null
): AchievementState | null {
  if (!storage) return null;

  let raw: string | null = null;
  try {
    raw = storage.getItem(ACHIEVEMENT_STORAGE_NAME);
  } catch {
    return null;
  }
  return parseAchievementState(raw);
}

/** 保存データの文字列を、安全に実績の状態へ変換します（読めない部分は捨てます）。 */
function parseAchievementState(raw: string | null): AchievementState {
  const empty = createEmptyAchievementState();
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

/**
 * 保存データを消します。消せなかった場合は false を返します。
 * 削除に失敗したときは、代わりに「空の状態」を上書き保存して、古い記録が読み直しで復活しないようにします。
 */
export function clearAchievementState(
  storage: AchievementStorage | null
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(ACHIEVEMENT_STORAGE_NAME);
    return true;
  } catch {
    return saveAchievementState(storage, createEmptyAchievementState());
  }
}

/**
 * 出来事を1つ記録します（保存データの読み直し → 反映 → 保存）。
 *
 * 同じアプリを複数のタブで開いていると、画面が持っている状態は古い可能性があります。
 * そこで反映の直前に保存データを読み直し、その最新の内容に出来事を加えてから保存します。
 * こうすると、ほかのタブで増えた実績を上書きして消したり、ほかのタブの「記録を消す」を取り消したりしません。
 * localStorage が使えないときだけ、画面が持っている状態（fallbackState）を土台にします。
 */
export function recordAchievementEventWithStorage(
  storage: AchievementStorage | null,
  fallbackState: AchievementState,
  event: AchievementEvent,
  nowIso: string
): AchievementUpdateResult {
  const latest = readStoredAchievementState(storage) ?? fallbackState;
  const result = applyAchievementEvent(latest, event, nowIso);
  if (result.state !== latest) {
    saveAchievementState(storage, result.state);
  }
  return result;
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
