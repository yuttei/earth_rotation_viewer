import type { CelestialBodyProfile } from "./celestialBodies";

/**
 * 宇宙スケールの視点に出てくる構造（銀河中心・太陽系の位置・超銀河団・宇宙マイクロ波背景放射・ボイド・コズミック・ウェブ）の
 * 解説データです。名前の札を押したときに開く解説カードに使います。
 *
 * 数値の出どころ：
 * - いて座A*：ESO の発表（2022年5月12日、EHT による初の画像）
 * - 太陽系の公転：NASA（時速約82万8,000km、約2億3,000万年で1周）
 * - 銀河中心までの距離：ESO の約2.7万光年にそろえます（NASA は約2.6万光年と書いており、資料で少し差があります）
 * - シャプレー超銀河団の銀河団の数：Shapley Supercluster Survey などの論文で「少なくとも25個の Abell 銀河団」
 * - 宇宙マイクロ波背景放射：NASA の COBE・WMAP（約2.725K、宇宙誕生から約38万年後、1965年にペンジアスとウィルソンが発表）
 * - シャプレー超銀河団：距離 約6.5億光年（赤方偏移 0.046 から求めた値。ハッブル定数の値で少し変わります）
 * - スローン・グレートウォール：長さ 約13.7億光年（Gott ほか 2005）
 * - うしかい座ボイド：直径は調べ方により約2.5億〜3.3億光年
 */

/** 宇宙の構造の解説カード ID */
export type CosmicStructureId =
  | "galacticCenter"
  | "solarSystemInGalaxy"
  | "virgoSupercluster"
  | "shapleySupercluster"
  | "perseusPiscesSupercluster"
  | "cosmicMicrowaveBackground"
  | "cosmicVoid"
  | "cosmicWeb";

/** 宇宙の構造の解説カードを、ID ごとにまとめたものです。 */
export const COSMIC_STRUCTURE_PROFILES: Record<
  CosmicStructureId,
  CelestialBodyProfile
> = {
  galacticCenter: {
    id: "galacticCenter",
    nameJa: "銀河中心（いて座A*）",
    nameEn: "Galactic Center (Sagittarius A*)",
    categoryJa: "超大質量ブラックホール（天の川銀河の中心）",
    categoryEn: "Supermassive Black Hole",
    symbol: "◎",
    accentColor: "#fde68a",
    facts: [
      { labelJa: "地球からの距離", value: "約2.7万光年" },
      { labelJa: "重さ", value: "太陽の約400万倍" },
      { labelJa: "初めての画像", value: "2022年（EHT）" },
    ],
    descriptionJa:
      "天の川銀河の中心には、太陽の約400万倍の重さを持つ巨大なブラックホール「いて座A*（エー・スター）」があります。地球から約2.7万光年離れたいて座の方向にあり、まわりを回る星の動きから重さが求められました。2022年には、世界中の電波望遠鏡をつないだ「イベント・ホライズン・テレスコープ（EHT）」が、その影を初めて画像にとらえました。",
    descriptionEn:
      "At the center of our Milky Way, there is a giant black hole called Sagittarius A*. It is about four million times heavier than the Sun and about 27,000 light-years away from us. In 2022, the Event Horizon Telescope, which connects radio telescopes around the world, took the first picture of its shadow.",
    cardKind: "cosmicStructure",
  },
  solarSystemInGalaxy: {
    id: "solarSystemInGalaxy",
    nameJa: "天の川銀河の中の太陽系",
    nameEn: "Our Solar System in the Milky Way",
    categoryJa: "私たちの住所（オリオン腕）",
    categoryEn: "Our Place in the Galaxy",
    symbol: "☀",
    accentColor: "#fbbf24",
    facts: [
      { labelJa: "銀河中心からの距離", value: "約2.7万光年" },
      { labelJa: "1周にかかる時間", value: "約2億3,000万年" },
      { labelJa: "回る速さ", value: "時速 約83万km" },
    ],
    descriptionJa:
      "太陽系は、天の川銀河の中心から約2.7万光年離れた「オリオン腕（オリオン・スパー）」と呼ばれる小さな腕の中にあります。太陽系は時速約83万kmという速さで銀河の中心のまわりを回っていますが、それでも1周するのに約2億3,000万年もかかります。",
    descriptionEn:
      "Our solar system is in a small arm of the Milky Way called the Orion Spur, about 27,000 light-years from the center. The solar system moves around the center of the galaxy at about 830,000 kilometers per hour, but one trip around still takes about 230 million years.",
    cardKind: "cosmicStructure",
  },
  virgoSupercluster: {
    id: "virgoSupercluster",
    nameJa: "おとめ座超銀河団（局部超銀河団）",
    nameEn: "Virgo Supercluster (Local Supercluster)",
    categoryJa: "超銀河団（ラニアケア超銀河団の一部）",
    categoryEn: "Supercluster of Galaxies",
    symbol: "◎",
    accentColor: "#7dd3fc",
    facts: [
      { labelJa: "中心", value: "おとめ座銀河団" },
      { labelJa: "ふくむもの", value: "局部銀河群（天の川銀河）など" },
      { labelJa: "位置づけ", value: "ラニアケア超銀河団の一部" },
    ],
    descriptionJa:
      "天の川銀河がある局部銀河群や、おとめ座銀河団などをふくむ銀河の大集団で、「局部超銀河団」とも呼ばれてきました。2014年、たくさんの銀河の動きを調べた研究によって、さらに大きなラニアケア超銀河団の一部であることが示されました。",
    descriptionEn:
      "The Virgo Supercluster is a huge group of galaxies that includes our Local Group and the Virgo Cluster. It is also called the Local Supercluster. In 2014, scientists studied how many galaxies move and showed that it is part of an even bigger supercluster, Laniakea.",
    cardKind: "cosmicStructure",
  },
  shapleySupercluster: {
    id: "shapleySupercluster",
    nameJa: "シャプレー超銀河団",
    nameEn: "Shapley Supercluster",
    categoryJa: "超銀河団（近くの宇宙で最大級）",
    categoryEn: "Supercluster of Galaxies",
    symbol: "◈",
    accentColor: "#f472b6",
    facts: [
      { labelJa: "距離", value: "約6.5億光年" },
      { labelJa: "中身", value: "25個以上の大きな銀河団" },
      { labelJa: "方向", value: "ケンタウルス座" },
    ],
    descriptionJa:
      "ケンタウルス座の方向、約6.5億光年のかなたにある、近くの宇宙で最も重い銀河の集まりのひとつです。25個以上の大きな銀河団が集まっています。天文学者ハーロー・シャプレーにちなんで名づけられ、私たちの銀河の動きにも影響していると考えられています。",
    descriptionEn:
      "The Shapley Supercluster is one of the heaviest groups of galaxies near us. It is about 650 million light-years away in the direction of Centaurus and has at least 25 big galaxy clusters. It is named after the astronomer Harlow Shapley, and scientists think it also pulls on our galaxy.",
    cardKind: "cosmicStructure",
  },
  perseusPiscesSupercluster: {
    id: "perseusPiscesSupercluster",
    nameJa: "ペルセウス座・うお座超銀河団",
    nameEn: "Perseus–Pisces Supercluster",
    categoryJa: "超銀河団（ラニアケアのとなり）",
    categoryEn: "Supercluster of Galaxies",
    symbol: "◈",
    accentColor: "#a5b4fc",
    facts: [
      { labelJa: "方向", value: "ペルセウス座〜うお座" },
      { labelJa: "代表的な銀河団", value: "ペルセウス座銀河団" },
      { labelJa: "位置づけ", value: "ラニアケア超銀河団のとなり" },
    ],
    descriptionJa:
      "ペルセウス座からうお座にかけて、銀河団が長いくさりのように連なった超銀河団です。ラニアケア超銀河団のとなりにあり、宇宙の大きな構造の地図づくりで早くから調べられてきた、代表的な超銀河団のひとつです。",
    descriptionEn:
      "The Perseus–Pisces Supercluster is a long chain of galaxy clusters from Perseus to Pisces. It is next to our Laniakea Supercluster. It is one of the first superclusters that scientists studied when they made maps of the large structures of the universe.",
    cardKind: "cosmicStructure",
  },
  cosmicMicrowaveBackground: {
    id: "cosmicMicrowaveBackground",
    nameJa: "宇宙マイクロ波背景放射（CMB）",
    nameEn: "Cosmic Microwave Background (CMB)",
    categoryJa: "宇宙誕生のころの光の名残",
    categoryEn: "The Oldest Light in the Universe",
    symbol: "◎",
    accentColor: "#fbbf24",
    facts: [
      { labelJa: "温度", value: "約2.7K（約−270℃）" },
      { labelJa: "光が出た時期", value: "宇宙誕生から約38万年後" },
      { labelJa: "発見", value: "1965年（ペンジアスとウィルソン）" },
    ],
    descriptionJa:
      "宇宙が生まれて約38万年後、それまで光を閉じこめていた熱いガスが冷えて透明になったときに放たれた光の名残です。宇宙の膨張で波長が引き伸ばされ、今では約2.7K（約−270℃）のマイクロ波として、空のあらゆる方向から届いています。わずか10万分の1ほどの温度のむらが、のちの銀河の種になりました。",
    descriptionEn:
      "The cosmic microwave background is the oldest light we can see. It was released about 380,000 years after the universe began, when the hot gas cooled down and became clear. The universe has stretched this light, so now it comes from every direction as very cold microwaves, at about 2.7 kelvin (about minus 270 degrees Celsius).",
    cardKind: "cosmicStructure",
  },
  cosmicVoid: {
    id: "cosmicVoid",
    nameJa: "超空洞（ボイド）",
    nameEn: "Cosmic Void",
    categoryJa: "銀河がほとんどない巨大な空間",
    categoryEn: "Huge Empty Space",
    symbol: "◯",
    accentColor: "#94a3b8",
    facts: [
      { labelJa: "大きさ", value: "直径 数千万〜数億光年" },
      { labelJa: "中身", value: "銀河がとても少ない" },
      { labelJa: "有名な例", value: "うしかい座ボイド" },
    ],
    descriptionJa:
      "銀河がほとんどない、宇宙の巨大な空き地です。銀河が網の目のように連なるコズミック・ウェブのすき間にあたり、宇宙の体積の多くを占めています。有名な「うしかい座ボイド」は、直径が約2.5億〜3.3億光年もあると見積もられています。",
    descriptionEn:
      "A cosmic void is a huge empty space with very few galaxies. Voids are the holes in the cosmic web, and they fill much of the universe. The famous Boötes Void is about 250 to 330 million light-years across.",
    cardKind: "cosmicStructure",
  },
  cosmicWeb: {
    id: "cosmicWeb",
    nameJa: "銀河フィラメント（コズミック・ウェブ）",
    nameEn: "Galaxy Filaments (Cosmic Web)",
    categoryJa: "宇宙の大規模構造",
    categoryEn: "Large-Scale Structure of the Universe",
    symbol: "❖",
    accentColor: "#c4b5fd",
    facts: [
      { labelJa: "形", value: "糸・壁・すき間の網の目" },
      { labelJa: "骨組み", value: "ダークマターの重力" },
      { labelJa: "大きな例", value: "スローン・グレートウォール（長さ約14億光年）" },
    ],
    descriptionJa:
      "銀河や銀河団は宇宙に均一に散らばっているのではなく、糸（フィラメント）や壁のように連なり、そのすき間に超空洞（ボイド）がある、クモの巣のような形に並んでいます。目に見えないダークマターの重力が骨組みとなり、ガスや銀河が糸に沿って集まってできたと考えられています。",
    descriptionEn:
      "Galaxies are not spread evenly in space. They line up in long threads and walls, with huge empty spaces between them, like a spider's web. Scientists think the gravity of invisible dark matter made the frame of this web, and gas and galaxies gathered along it.",
    cardKind: "cosmicStructure",
  },
};
