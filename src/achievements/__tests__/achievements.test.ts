import { describe, expect, it } from "vitest";
import {
  applyAchievementEvent,
  createEmptyAchievementState,
} from "../achievementState";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP, getAchievementListTitle } from "../definitions";
import {
  ACHIEVEMENT_STORAGE_NAME,
  AchievementStorage,
  clearAchievementState,
  loadAchievementState,
  recordAchievementEventWithStorage,
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
  it("23個の実績の id が重複しない", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(ids).toHaveLength(23);
    expect(new Set(ids).size).toBe(23);
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
      const result = applyAchievementEvent(state, { type: "place-impactor", impactorId, liveSameTypeCount: 1 }, NOW);
      state = result.state;
      unlockedOrder.push(...result.newlyUnlocked);
    }
    expect(state.progress.placedImpactorIds).toHaveLength(5);
    expect(unlockedOrder).toEqual(["place-impactor", "place-five-impactor-types"]);
  });

  it("リゲルを同時に5つ置くとシークレット実績を達成し、それまでは名前を隠して最大数を記録する", () => {
    const rigel = ACHIEVEMENT_MAP["five-rigels-at-once"];
    expect(getAchievementListTitle(rigel, false)).toBe("？？？");
    expect(getAchievementListTitle(rigel, true)).toBe("ドパガキ");

    // 同時に3つまで置いたあと、対消滅で減ってから置き直しても、最大記録は 3 のまま
    let state = createEmptyAchievementState();
    for (const count of [1, 2, 3, 1]) {
      state = applyAchievementEvent(state, { type: "place-impactor", impactorId: "blueSupergiant", liveSameTypeCount: count }, NOW).state;
    }
    expect(state.progress.maxSimultaneousRigels).toBe(3);
    expect(state.unlocked["five-rigels-at-once"]).toBeUndefined();

    // ほかの天体を5つ同時に置いても達成しない
    state = applyAchievementEvent(state, { type: "place-impactor", impactorId: "asteroid", liveSameTypeCount: 5 }, NOW).state;
    expect(state.unlocked["five-rigels-at-once"]).toBeUndefined();

    // リゲルが同時に5つになった瞬間に達成
    const result = applyAchievementEvent(state, { type: "place-impactor", impactorId: "blueSupergiant", liveSameTypeCount: 5 }, NOW);
    expect(result.newlyUnlocked).toEqual(["five-rigels-at-once"]);
    expect(result.state.progress.maxSimultaneousRigels).toBe(5);
  });

  it("複数タブで開いても、保存データを読み直してから反映するので、ほかのタブの記録や消去を上書きしない", () => {
    const storage = createMemoryStorage();
    // タブA が開いた時点の状態（まだ何も達成していない）
    const staleTabA = createEmptyAchievementState();

    // タブB で「地上に降り立つ」を達成して保存
    recordAchievementEventWithStorage(storage, createEmptyAchievementState(), { type: "unlock", id: "ground-sky" }, NOW, true);

    // 古い状態のタブA で別の実績を達成しても、タブB の記録が残る
    const tabA = recordAchievementEventWithStorage(storage, staleTabA, { type: "unlock", id: "annual-motion" }, LATER, true);
    expect(Object.keys(loadAchievementState(storage).unlocked).sort()).toEqual(["annual-motion", "ground-sky"]);

    // タブB で「記録を消す」をしたあと、古い状態のタブA が操作しても、消した記録は復活しない
    clearAchievementState(storage);
    recordAchievementEventWithStorage(storage, tabA.state, { type: "unlock", id: "speed-up-time" }, LATER, true);
    expect(Object.keys(loadAchievementState(storage).unlocked)).toEqual(["speed-up-time"]);
  });

  it("読めるが書けない保存先でも、このタブで達成した分を失わず、通知も重複せず、消した記録も戻らない", () => {
    // 古い記録（皆既日食）が残っていて、読めるが書き込み・削除はできない保存先（容量超過など）
    const oldData = applyAchievementEvent(
      createEmptyAchievementState(),
      { type: "unlock", id: "total-solar-eclipse" },
      NOW
    ).state;
    const readOnlyStorage: AchievementStorage = {
      getItem: () => JSON.stringify(oldData),
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("QuotaExceededError");
      },
    };

    // 1件目：保存に失敗するので、以後は画面の状態を土台にする
    const first = recordAchievementEventWithStorage(readOnlyStorage, oldData, { type: "unlock", id: "ground-sky" }, NOW, true);
    expect(first.isStorageInSync).toBe(false);
    // 2件目：1件目の達成が残り、新しく達成したのは2件目だけ
    const second = recordAchievementEventWithStorage(readOnlyStorage, first.state, { type: "unlock", id: "annual-motion" }, NOW, first.isStorageInSync);
    expect(Object.keys(second.state.unlocked).sort()).toEqual(["annual-motion", "ground-sky", "total-solar-eclipse"]);
    expect(second.newlyUnlocked).toEqual(["annual-motion"]);
    // 同じ実績をもう一度：通知しない
    const again = recordAchievementEventWithStorage(readOnlyStorage, second.state, { type: "unlock", id: "ground-sky" }, NOW, second.isStorageInSync);
    expect(again.newlyUnlocked).toEqual([]);

    // 「記録を消す」が保存データに反映できなかった場合も、空の画面の状態を土台にするので古い記録は戻らない
    const cleared = clearAchievementState(readOnlyStorage);
    expect(cleared).toBe(false);
    const afterReset = recordAchievementEventWithStorage(readOnlyStorage, createEmptyAchievementState(), { type: "unlock", id: "speed-up-time" }, NOW, cleared);
    expect(Object.keys(afterReset.state.unlocked)).toEqual(["speed-up-time"]);
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
    expect(messy.progress).toEqual({ openedBodyIds: ["sun"], placedImpactorIds: [], maxSimultaneousRigels: 0 });

    // リゲルの最大数を記録する前の古い保存データも読め、最大数は 0 になる（壊れた値も 0）
    const old = loadAchievementState(
      createMemoryStorage({
        [ACHIEVEMENT_STORAGE_NAME]: JSON.stringify({
          version: 1,
          unlocked: { "place-impactor": NOW },
          progress: { openedBodyIds: [], placedImpactorIds: ["blueSupergiant"] },
        }),
      })
    );
    expect(old.unlocked).toEqual({ "place-impactor": NOW });
    expect(old.progress.maxSimultaneousRigels).toBe(0);
    const badCount = loadAchievementState(
      createMemoryStorage({
        [ACHIEVEMENT_STORAGE_NAME]: JSON.stringify({ version: 1, unlocked: {}, progress: { maxSimultaneousRigels: -2.5 } }),
      })
    );
    expect(badCount.progress.maxSimultaneousRigels).toBe(0);

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
