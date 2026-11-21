import { describe, expect, it } from "vitest";
import { CELESTIAL_BODY_PROFILES } from "../celestialBodies";
import {
  CASSIOPEIA_CONSTELLATION,
  SOUTHERN_CROSS_CONSTELLATION,
  ZODIAC_CONSTELLATIONS,
} from "../../astronomy/zodiac";
import {
  SEASONAL_ASTERISMS,
  SEASONAL_CONSTELLATIONS,
} from "../../astronomy/seasonalStars";
import {
  ConstellationKey,
  getConstellationCardId,
} from "../constellationProfiles";
import {
  formatStarDistanceJa,
  getStarSizeClass,
} from "../constellationStarProfiles";

// 解説カードを増やしたときの、データのつながりと表示の書き方だけを確かめます。
describe("星座の星・星座・星座の形の解説カード", () => {
  it("アプリに描く星座と星座の形には、すべて解説カードがある", () => {
    const keys: ConstellationKey[] = [
      ...ZODIAC_CONSTELLATIONS.map((c) => c.id),
      ...SEASONAL_CONSTELLATIONS.map((c) => c.id as ConstellationKey),
      "cassiopeia",
      "crux",
    ];
    for (const key of keys) {
      const profile = CELESTIAL_BODY_PROFILES[getConstellationCardId(key)];
      expect(profile, key).toBeDefined();
      expect(profile.cardKind).toBe("constellation");
    }
    for (const ast of SEASONAL_ASTERISMS) {
      expect(CELESTIAL_BODY_PROFILES[ast.id].cardKind).toBe("asterism");
    }
  });

  it("星座の星に書いた bodyId は、すべて解説カードを開ける", () => {
    const stars = [
      ...ZODIAC_CONSTELLATIONS.flatMap((c) => c.stars),
      ...SEASONAL_CONSTELLATIONS.flatMap((c) => c.stars),
      ...CASSIOPEIA_CONSTELLATION.stars,
      ...SOUTHERN_CROSS_CONSTELLATION.stars,
    ];
    let withId = 0;
    for (const star of stars) {
      if (!star.bodyId) continue;
      withId++;
      const profile = CELESTIAL_BODY_PROFILES[star.bodyId];
      expect(profile, star.bodyId).toBeDefined();
      expect(profile.facts).toHaveLength(3);
    }
    // 説明がないのは、みなみのうお座の暗い4つの星だけ
    expect(stars.length - withId).toBe(4);
  });

  it("スペクトル型から星の大きさの種類を決め、距離の誤差を書き分ける", () => {
    expect(getStarSizeClass("A1V")).toBe("dwarf");
    expect(getStarSizeClass("G8IV")).toBe("subgiant");
    expect(getStarSizeClass("K0III")).toBe("giant");
    expect(getStarSizeClass("K0II-III")).toBe("brightGiant");
    expect(getStarSizeClass("B0Ia")).toBe("supergiant");
    expect(formatStarDistanceJa({ distanceLy: 120 })).toBe("約120光年");
    expect(
      formatStarDistanceJa({ distanceLy: 2000, distanceUncertain: true })
    ).toBe("約2,000光年（誤差が大きい）");
    expect(
      formatStarDistanceJa({ distanceLy: 1400, distanceRangeLy: [1100, 1400] })
    ).toBe("約1,100〜1,400光年（資料で差あり）");
  });
});
