/**
 * 実績（アチーブメント）の定義データです。
 * アプリで体験してほしい操作を、分類ごとに22個のチェックリストとしてまとめています。
 * 未達成の実績も「やること」（hintJa）をそのまま表示して、次に試す操作の道案内にします。
 */

/** 実績の分類 */
export type AchievementCategoryId =
  | "rotation"
  | "ground"
  | "moonVenus"
  | "solarSystem"
  | "bodies"
  | "cosmic"
  | "impact";

/** 実績の識別子（保存データのキーにも使うため、一度決めたら変えません） */
export type AchievementId =
  | "view-ecliptic-plane"
  | "speed-up-time"
  | "jump-to-season"
  | "polar-day-night"
  | "ground-sky"
  | "southern-cross"
  | "annual-motion"
  | "moon-phases"
  | "venus-orbit"
  | "total-solar-eclipse"
  | "total-lunar-eclipse"
  | "zodiac-from-earth"
  | "real-solar-system"
  | "jupiter-moons"
  | "seasonal-constellations"
  | "open-body-card"
  | "open-five-body-cards"
  | "reach-milky-way"
  | "reach-observable-universe"
  | "place-impactor"
  | "place-five-impactor-types"
  | "restore-solar-system";

export interface AchievementCategory {
  id: AchievementCategoryId;
  /** 一覧の見出し */
  titleJa: string;
}

export interface AchievementDefinition {
  id: AchievementId;
  category: AchievementCategoryId;
  /** 実績の名前（通知と一覧に表示） */
  titleJa: string;
  /** やること（未達成のときも表示する、操作の道案内） */
  hintJa: string;
}

/** 一覧に表示する分類の順番 */
export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  { id: "rotation", titleJa: "地球の自転・昼夜" },
  { id: "ground", titleJa: "地上から見る" },
  { id: "moonVenus", titleJa: "月・金星・食" },
  { id: "solarSystem", titleJa: "太陽系・星座" },
  { id: "bodies", titleJa: "天体を調べる" },
  { id: "cosmic", titleJa: "宇宙の大きさ" },
  { id: "impact", titleJa: "天体衝突シミュレーター" },
];

/** 「〇種類」の累計で達成する実績に必要な種類数 */
export const DISTINCT_BODY_CARDS_GOAL = 5;
export const DISTINCT_IMPACTOR_TYPES_GOAL = 5;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "view-ecliptic-plane",
    category: "rotation",
    titleJa: "真横から見る地球",
    hintJa: "天の北極から公転面（水平）へ視点を動かす（視点スライダーを右端まで、または公転面の視点ボタン）",
  },
  {
    id: "speed-up-time",
    category: "rotation",
    titleJa: "時間を早送り",
    hintJa: "画面下の倍速ボタンで、時間を1日/s以上に速める",
  },
  {
    id: "jump-to-season",
    category: "rotation",
    titleJa: "季節を旅する",
    hintJa: "画面下の季節ボタン（春分・夏至・秋分・冬至）で季節へ進む",
  },
  {
    id: "polar-day-night",
    category: "rotation",
    titleJa: "白夜と極夜",
    hintJa: "学習ガイドの実験で、北極の白夜または極夜を見る",
  },
  {
    id: "ground-sky",
    category: "ground",
    titleJa: "地上に降り立つ",
    hintJa: "地上の視点ボタン（北・東・南・西の空）で、地上から空を見る",
  },
  {
    id: "southern-cross",
    category: "ground",
    titleJa: "南十字星",
    hintJa: "シドニーの地上から南の空を見て、南十字星を探す",
  },
  {
    id: "annual-motion",
    category: "ground",
    titleJa: "星の年周運動",
    hintJa: "年周運動モード（毎日21時）をONにする",
  },
  {
    id: "moon-phases",
    category: "moonVenus",
    titleJa: "月の満ち欠け",
    hintJa: "月の視点ボタンや学習ガイドで、月の公転と満ち欠けを観察する",
  },
  {
    id: "venus-orbit",
    category: "moonVenus",
    titleJa: "明けの明星・宵の明星",
    hintJa: "学習ガイドの実験で、金星の公転と見え方を観察する",
  },
  {
    id: "total-solar-eclipse",
    category: "moonVenus",
    titleJa: "皆既日食",
    hintJa: "学習ガイドの実験で、皆既日食を見る",
  },
  {
    id: "total-lunar-eclipse",
    category: "moonVenus",
    titleJa: "皆既月食",
    hintJa: "学習ガイドの実験で、皆既月食を見る",
  },
  {
    id: "zodiac-from-earth",
    category: "solarSystem",
    titleJa: "黄道13星座",
    hintJa: "地球から黄道を見る視点で、黄道13星座を見る",
  },
  {
    id: "real-solar-system",
    category: "solarSystem",
    titleJa: "リアル太陽系",
    hintJa: "水星〜冥王星が並ぶリアル太陽系の視点へ移る",
  },
  {
    id: "jupiter-moons",
    category: "solarSystem",
    titleJa: "ガリレオ衛星",
    hintJa: "木星の視点へ行き、4つの衛星を見る",
  },
  {
    id: "seasonal-constellations",
    category: "solarSystem",
    titleJa: "四季の星座",
    hintJa: "学習ガイドの実験で、四季の星座を見る",
  },
  {
    id: "open-body-card",
    category: "bodies",
    titleJa: "天体図鑑",
    hintJa: "3D画面の天体をタップして、解説カードを開く",
  },
  {
    id: "open-five-body-cards",
    category: "bodies",
    titleJa: "天体博士",
    hintJa: `${DISTINCT_BODY_CARDS_GOAL}種類の天体の解説カードを開く`,
  },
  {
    id: "reach-milky-way",
    category: "cosmic",
    titleJa: "銀河の外へ",
    hintJa: "宇宙の大きさの視点で、天の川銀河まで出る",
  },
  {
    id: "reach-observable-universe",
    category: "cosmic",
    titleJa: "宇宙の果て",
    hintJa: "宇宙の大きさの視点で、観測可能な宇宙まで行く",
  },
  {
    id: "place-impactor",
    category: "impact",
    titleJa: "はじめての衝突実験",
    hintJa: "天体衝突シミュレーターで、天体を1個置く",
  },
  {
    id: "place-five-impactor-types",
    category: "impact",
    titleJa: "重力の実験家",
    hintJa: `天体衝突シミュレーターで、${DISTINCT_IMPACTOR_TYPES_GOAL}種類の天体を置く`,
  },
  {
    id: "restore-solar-system",
    category: "impact",
    titleJa: "太陽系の復活",
    hintJa: "天体衝突シミュレーターの「復活」で、太陽系を元に戻す",
  },
];

/** id から実績の定義を引くための表 */
export const ACHIEVEMENT_MAP: Record<AchievementId, AchievementDefinition> =
  ACHIEVEMENTS.reduce(
    (acc, def) => {
      acc[def.id] = def;
      return acc;
    },
    {} as Record<AchievementId, AchievementDefinition>
  );

/** 文字列が実績の id として正しいかを調べます（保存データの読み込みで使います）。 */
export function isAchievementId(value: string): value is AchievementId {
  return Object.prototype.hasOwnProperty.call(ACHIEVEMENT_MAP, value);
}
