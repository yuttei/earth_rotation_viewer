import { City } from "../types/astronomy";

/**
 * 地球の自転・昼夜・地上からの星空（北極星・カシオペア座・南十字星・赤道直下の垂直な日周運動・白夜/極夜）を
 * 観察しやすい8つの代表地点（東京・ロンドン・ニューヨーク・トロムソ・キト・シドニー・北極点・南極点）です。
 */
export const OBSERVATION_CITIES: City[] = [
  {
    id: "tokyo",
    nameJa: "東京",
    nameEn: "Tokyo",
    regionJa: "日本（北緯35.7°・東経139.7°）",
    latDeg: 35.6762,
    lonDeg: 139.6503,
    utcOffsetHours: 9,
    noteJa:
      "北の空では高度35.7°の北極星のまわりをカシオペア座が反時計回りに巡り、東から昇った太陽や月が南の空を通って西へ沈みます。",
  },
  {
    id: "london",
    nameJa: "ロンドン",
    nameEn: "London",
    regionJa: "イギリス（北緯51.5°・経度0°付近）",
    latDeg: 51.5072,
    lonDeg: -0.1276,
    utcOffsetHours: 0,
    noteJa:
      "経度0°（本初子午線）の基準地。東京より高緯度にあるため北極星の高度が51.5°と高く、夏と冬の昼の長さの差が大きくなります。",
  },
  {
    id: "new-york",
    nameJa: "ニューヨーク",
    nameEn: "New York",
    regionJa: "アメリカ（北緯40.7°・西経74.0°）",
    latDeg: 40.7128,
    lonDeg: -74.006,
    utcOffsetHours: -5,
    noteJa:
      "本初子午線から西側にあり、東京とは約14時間の時差があります。北の空の高度40.7°に北極星が見えます。",
  },
  {
    id: "tromso",
    nameJa: "トロムソ",
    nameEn: "Tromsø",
    regionJa: "ノルウェー（北緯69.6°・北極圏内）",
    latDeg: 69.6492,
    lonDeg: 18.9553,
    utcOffsetHours: 1,
    noteJa:
      "北極圏（北緯66.6°以北）の街です。地上視点にすると、夏至前後は北の空でも太陽が沈まない白夜、冬至前後は太陽が昇らない極夜を体験できます。",
  },
  {
    id: "quito",
    nameJa: "キト",
    nameEn: "Quito",
    regionJa: "エクアドル（緯度0.0°・赤道直下）",
    latDeg: 0,
    lonDeg: -78.4558,
    utcOffsetHours: -5,
    noteJa:
      "国名が「赤道」を意味するエクアドルの首都（赤道記念碑・緯度0°）。一年中昼と夜がほぼ12時間ずつで、太陽や星が東の地平線から垂直に昇り、春分・秋分の正午には太陽が真上（高度90°・天頂）を通ります。",
  },
  {
    id: "sydney",
    nameJa: "シドニー",
    nameEn: "Sydney",
    regionJa: "オーストラリア（南緯33.9°・東経151.2°）",
    latDeg: -33.8688,
    lonDeg: 151.2093,
    utcOffsetHours: 10,
    noteJa:
      "南半球にあるため、地上から見ると太陽は東から昇って「北の空」を通って西へ沈み、南の空には南十字星が天の南極のまわりを時計回りに巡ります。",
  },
  {
    id: "north-pole",
    nameJa: "北極点",
    nameEn: "North Pole",
    regionJa: "北緯90°（北の自転軸の中心）",
    latDeg: 90,
    lonDeg: 0,
    utcOffsetHours: 0,
    noteJa:
      "北極星が真上（天頂・高度90°）にあり、地上から見ると星や太陽は地平線と平行に横へぐるりと回ります。春分〜秋分は半年間ずっと昼（白夜）です。",
  },
  {
    id: "south-pole",
    nameJa: "南極点",
    nameEn: "South Pole",
    regionJa: "南緯90°（南の自転軸の中心）",
    latDeg: -90,
    lonDeg: 0,
    utcOffsetHours: 0,
    noteJa:
      "天の南極と南十字星が頭上にあり、星々は地平線と平行に時計回りに回ります。北極点とは季節が逆になり、秋分〜春分（冬至側）が半年間ずっと昼（白夜）です。",
  },
];
