import { describe, expect, it } from "vitest";
import {
  applyAchievementEvent,
  createEmptyAchievementState,
} from "../achievementState";
import { ACHIEVEMENTS } from "../definitions";
import {
  ACHIEVEMENT_STORAGE_NAME,
  AchievementStorage,
  loadAchievementState,
  saveAchievementState,
} from "../storage";

/** テスト用の、メモリ上だけで動く localStorage の代わり */
function createMemoryStorage(initial: Record<string, string> = {}): AchievementStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const NOW = "2026-11-19T00:00:00.000Z";
const LATER = "2026-11-20T00:00:00.000Z";

describe("実績機能 (achievements)", () => {
  it("22個の実績の id が重複しない", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(22);
  });

  it("達成した実績は記録され、同じ実績をもう一度達成しても日時が変わらず通知もされない", () => {
    const first = applyAchievementEvent(
      createEmptyAchievementState(),
      { type: "unlock", id: "ground-sky" },
      NOW
    );
    expect(first.newlyUnlocked).toEqual(["ground-sky"]);
    expect(first.state.unlocked["ground-sky"]).toBe(NOW);

    const second = applyAchievementEvent(
      first.state,
      { type: "unlock", id: "ground-sky" },
      LATER
    );
    expect(second.newlyUnlocked).toEqual([]);
    expect(second.state).toBe(first.state);
  });

  it("異なる5種類の天体を置くと累計の実績を達成し、同じ種類は数えない", () => {
    let state = createEmptyAchievementState();
    const unlockedOrder: string[] = [];
    for (const impactorId of ["asteroid", "asteroid", "comet", "moonSize", "marsSize", "blackHole"]) {
      const result = applyAchievementEvent(state, { type: "place-impactor", impactorId }, NOW);
      state = result.state;
      unlockedOrder.push(...result.newlyUnlocked);
    }
    expect(state.progress.placedImpactorIds).toHaveLength(5);
    expect(unlockedOrder).toEqual(["place-impactor", "place-five-impactor-types"]);
  });

  it("保存した状態を読み込め、壊れた保存データや未知の id は安全に無視する", () => {
    const storage = createMemoryStorage();
    const saved = applyAchievementEvent(
      createEmptyAchievementState(),
      { type: "open-body", bodyId: "jupiter" },
      NOW
    ).state;
    expect(saveAchievementState(storage, saved)).toBe(true);
    expect(loadAchievementState(storage)).toEqual(saved);

    // JSON として壊れている
    expect(
      loadAchievementState(createMemoryStorage({ [ACHIEVEMENT_STORAGE_NAME]: "{broken" }))
    ).toEqual(createEmptyAchievementState());

    // 未知の id・型違いの値・重複は捨て、正しい部分だけ残す
    const messy = loadAchievementState(
      createMemoryStorage({
        [ACHIEVEMENT_STORAGE_NAME]: JSON.stringify({
          version: 1,
          unlocked: { "ground-sky": NOW, "no-such-achievement": NOW, "annual-motion": 123 },
          progress: { openedBodyIds: ["sun", "sun", 5], placedImpactorIds: "asteroid" },
        }),
      })
    );
    expect(messy.unlocked).toEqual({ "ground-sky": NOW });
    expect(messy.progress).toEqual({ openedBodyIds: ["sun"], placedImpactorIds: [] });

    // localStorage が使えない環境（読み込み時に例外）でも空の状態で動く
    const throwingStorage: AchievementStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadAchievementState(throwingStorage)).toEqual(createEmptyAchievementState());
    expect(saveAchievementState(throwingStorage, saved)).toBe(false);
  });
});
