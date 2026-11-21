import {
  CONSTELLATION_STAR_PROFILES,
  ConstellationStarId,
  SpectralLetter,
  StarSizeClass,
} from "./constellationStarProfiles";
import {
  ASTERISM_PROFILES,
  AsterismCardId,
  CONSTELLATION_PROFILES,
  ConstellationCardId,
} from "./constellationProfiles";
import {
  COSMIC_STRUCTURE_PROFILES,
  CosmicStructureId,
} from "./cosmicStructureProfiles";

/**
 * 太陽系15天体（太陽・月・9天体・木星の主要4衛星）・主要15恒星・銀河〜宇宙規模の11構造（計41件）の
 * 解説データ（日本語説明・中学英語レベルの説明・基本データ）をまとめたファイルです。
 * 3D画面で天体・恒星・銀河構造やラベルをタップしたときの詳細カード表示に使用します。
 *
 * このほかに、次のファイルの解説データもここでまとめます。
 * - constellationStarProfiles.ts：星座の星（北極星・北斗七星・黄道や四季の星座の星など）とすばる
 * - constellationProfiles.ts：アプリに出てくる27星座と、6つの星座の形（大三角など）
 * - cosmicStructureProfiles.ts：銀河中心・超銀河団・宇宙マイクロ波背景放射などの宇宙の構造
 */

/** もとからある41件（太陽系・主要15恒星・銀河〜宇宙の構造）の ID */
type BaseCelestialBodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "io"
  | "europa"
  | "ganymede"
  | "callisto"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "milkyWay"
  | "andromeda"
  | "triangulum"
  | "magellanicClouds"
  | "localGroup"
  | "virgoCluster"
  | "fornaxCluster"
  | "comaCluster"
  | "greatAttractor"
  | "laniakea"
  | "observableUniverse"
  | "sirius"
  | "betelgeuse"
  | "procyon"
  | "rigel"
  | "aldebaran"
  | "capella"
  | "pollux"
  | "arcturus"
  | "spica"
  | "denebola"
  | "vega"
  | "altair"
  | "deneb"
  | "fomalhaut"
  | "alphaCentauri";

/** 解説カードを開けるすべての天体・星座・構造の ID */
export type CelestialBodyId =
  | BaseCelestialBodyId
  | ConstellationStarId
  | ConstellationCardId
  | AsterismCardId
  | CosmicStructureId;

/**
 * 解説カードの絵の描き分けに使う、対象の種類です。
 * 書いていないとき（もとからある41件）は、ID ごとの専用の絵を描きます。
 */
export type CelestialCardKind =
  | "star"
  | "starCluster"
  | "constellation"
  | "asterism"
  | "cosmicStructure";

/** 星座や星座の形を、説明カードに絵として描くための星と線です。 */
export interface SkyFigure {
  /** 星の位置（黄経・黄緯）と明るさ（等級） */
  points: Array<{ lonDeg: number; latDeg: number; mag: number }>;
  /** 線で結ぶ星の番号の組 */
  edges: Array<[number, number]>;
  /** 線の色 */
  lineColor: string;
}

export interface CelestialBodyFact {
  labelJa: string;
  value: string;
}

export interface CelestialBodyProfile {
  id: CelestialBodyId;
  /** 日本語名 */
  nameJa: string;
  /** 英語名 */
  nameEn: string;
  /** 天体の分類（日本語） */
  categoryJa: string;
  /** 天体の分類（英語） */
  categoryEn: string;
  /** 天体記号 */
  symbol: string;
  /** カードのアクセントカラー */
  accentColor: string;
  /** 基本スペックのミニ項目（3つ） */
  facts: CelestialBodyFact[];
  /** 中学生にも分かりやすい日本語の説明文 */
  descriptionJa: string;
  /** 中学英語レベルのやさしい英語説明文 */
  descriptionEn: string;
  /** 説明カードの絵の種類（書いていないときは ID ごとの専用の絵） */
  cardKind?: CelestialCardKind;
  /** 星の絵の色と大きさ（cardKind が "star" のとき） */
  starVisual?: { spectralLetter: SpectralLetter; sizeClass: StarSizeClass };
  /** 星座や星座の形の絵（cardKind が "constellation" か "asterism" のとき） */
  figure?: SkyFigure;
}

const BASE_CELESTIAL_BODY_PROFILES: Record<
  BaseCelestialBodyId,
  CelestialBodyProfile
> = {
  sun: {
    id: "sun",
    nameJa: "太陽",
    nameEn: "Sun",
    categoryJa: "恒星（みずから光る星）",
    categoryEn: "Star",
    symbol: "☀",
    accentColor: "#fbbf24",
    facts: [
      { labelJa: "直径", value: "地球の約109倍" },
      { labelJa: "表面温度", value: "約6,000℃" },
      { labelJa: "分類", value: "恒星" },
    ],
    descriptionJa:
      "太陽系の中心で自ら光と熱を放つ恒星です。直径は地球の約109倍もあり、太陽系全体の重さの約99.8%を太陽だけで占めています。太陽の強い重力があるからこそ、地球や惑星たちは決まった軌道を回り続け、地球に昼夜と四季をもたらしています。",
    descriptionEn:
      "The Sun is a big, hot star at the center of our solar system. It gives light and heat to the Earth every day. It is about 109 times wider than the Earth. Because of the Sun's strong gravity, all the planets move around it.",
  },
  mercury: {
    id: "mercury",
    nameJa: "水星",
    nameEn: "Mercury",
    categoryJa: "地球型惑星（岩石惑星）",
    categoryEn: "Rocky Planet",
    symbol: "☿",
    accentColor: "#cbd5e1",
    facts: [
      { labelJa: "太陽からの距離", value: "約0.39 AU" },
      { labelJa: "公転周期", value: "約88日" },
      { labelJa: "表面", value: "クレーター多数" },
    ],
    descriptionJa:
      "太陽にいちばん近い、太陽系で最も小さな惑星です。大気がほとんどないため、昼は約430℃もの猛暑になるのに、夜はマイナス170℃以下まで一気に冷え込みます。表面は月のようにたくさんのクレーターでおおわれています。",
    descriptionEn:
      "Mercury is the smallest planet and the closest one to the Sun. It goes around the Sun very fast, in only 88 days. It has almost no air, so it is very hot during the day and very cold at night. Its surface has many round holes called craters.",
  },
  venus: {
    id: "venus",
    nameJa: "金星",
    nameEn: "Venus",
    categoryJa: "地球型惑星（内惑星）",
    categoryEn: "Rocky Planet",
    symbol: "♀",
    accentColor: "#fde68a",
    facts: [
      { labelJa: "太陽からの距離", value: "約0.72 AU" },
      { labelJa: "公転周期", value: "約225日" },
      { labelJa: "表面温度", value: "約460℃" },
    ],
    descriptionJa:
      "地球のすぐ内側を回る惑星で、大きさが地球に似ているため「双子の惑星」とも呼ばれます。濃い二酸化炭素の大気と厚い雲による強い温室効果で、表面は約460℃と太陽系でいちばん高温です。明け方の東の空や夕方の西の空で明るく輝き、「明けの明星」「宵の明星」として親しまれています。",
    descriptionEn:
      "Venus is the second planet from the Sun and is almost the same size as the Earth. Thick clouds cover the whole planet and trap heat, so it is the hottest planet in our solar system. You can often see it shining very brightly in the morning or evening sky.",
  },
  earth: {
    id: "earth",
    nameJa: "地球",
    nameEn: "Earth",
    categoryJa: "地球型惑星",
    categoryEn: "Rocky Planet",
    symbol: "●",
    accentColor: "#38bdf8",
    facts: [
      { labelJa: "太陽からの距離", value: "1.00 AU" },
      { labelJa: "公転周期", value: "約365.24日" },
      { labelJa: "地軸の傾き", value: "約23.4°" },
    ],
    descriptionJa:
      "私たちが暮らす青い惑星です。太陽からちょうどよい距離にあるため、液体の海と酸素を含む大気が保たれ、豊かな生命が育まれました。地軸が約23.4°傾いたまま約24時間で1回自転し、約1年かけて太陽のまわりを公転することで、昼夜と春夏秋冬が生まれます。",
    descriptionEn:
      "Earth is our home planet and the third planet from the Sun. It has liquid water, fresh air, and many kinds of living things. It turns around once a day and moves around the Sun once a year. Because its axis is tilted, we have four seasons.",
  },
  moon: {
    id: "moon",
    nameJa: "月",
    nameEn: "Moon",
    categoryJa: "地球の衛星",
    categoryEn: "Earth's Natural Satellite",
    symbol: "☾",
    accentColor: "#e2e8f0",
    facts: [
      { labelJa: "地球からの距離", value: "約38万 km" },
      { labelJa: "公転周期", value: "約27.3日" },
      { labelJa: "白道の傾き", value: "約5.1°" },
    ],
    descriptionJa:
      "地球のまわりを反時計回りに公転するただひとつの自然衛星です。自ら光っているのではなく太陽の光を反射して輝いており、地球・太陽との位置関係によって新月・三日月・上弦・満月へと満ち欠けします。常に同じ面を地球に向けて回り、潮の満ち引きや日食・月食を引き起こします。",
    descriptionEn:
      "The Moon is the Earth's only natural satellite. It does not make its own light; it reflects light from the Sun. As it moves around the Earth, its shape seems to change from a new moon to a full moon. We always see the same side of the Moon from the Earth.",
  },
  mars: {
    id: "mars",
    nameJa: "火星",
    nameEn: "Mars",
    categoryJa: "地球型惑星（外惑星）",
    categoryEn: "Rocky Planet",
    symbol: "♂",
    accentColor: "#fb7185",
    facts: [
      { labelJa: "太陽からの距離", value: "約1.52 AU" },
      { labelJa: "公転周期", value: "約687日" },
      { labelJa: "1日の長さ", value: "約24時間37分" },
    ],
    descriptionJa:
      "地表の岩石に酸化鉄（さび）を多く含むため、赤茶色に輝く「赤い惑星」です。太陽系でいちばん高い火山「オリンポス山」や巨大な渓谷があり、北極と南極には氷の白い極冠が広がっています。1日の長さや地軸の傾きが地球に近く、季節の変化もあります。",
    descriptionEn:
      "Mars is the fourth planet from the Sun and is called the Red Planet. Its ground looks red because the dust has a lot of iron in it. Mars has the tallest mountain in our solar system and white ice at its poles. One day on Mars is almost as long as one day on the Earth.",
  },
  jupiter: {
    id: "jupiter",
    nameJa: "木星",
    nameEn: "Jupiter",
    categoryJa: "巨大ガス惑星",
    categoryEn: "Gas Giant",
    symbol: "♃",
    accentColor: "#fdba74",
    facts: [
      { labelJa: "太陽からの距離", value: "約5.20 AU" },
      { labelJa: "公転周期", value: "約11.9年" },
      { labelJa: "直径", value: "地球の約11倍" },
    ],
    descriptionJa:
      "太陽系で最も大きな惑星で、ほかのすべての惑星を合わせたより重い巨大ガス惑星です。主に水素とヘリウムのガスでできており、約10時間という猛スピードで自転するため、美しいしま模様と「大赤斑」と呼ばれる巨大な台風が何百年も続いています。",
    descriptionEn:
      "Jupiter is the largest planet in our solar system. It is about 11 times wider than the Earth and is made mostly of gas. It spins very fast, in about 10 hours, so we can see colorful stripes on it. It also has a giant red storm called the Great Red Spot.",
  },
  io: {
    id: "io",
    nameJa: "イオ",
    nameEn: "Io",
    categoryJa: "木星の衛星（ガリレオ衛星）",
    categoryEn: "Moon of Jupiter",
    symbol: "◦",
    accentColor: "#fde047",
    facts: [
      { labelJa: "公転周期", value: "約1.77日" },
      { labelJa: "木星からの順番", value: "主要衛星の1番目" },
      { labelJa: "特徴", value: "活発な火山活動" },
    ],
    descriptionJa:
      "木星の主要4衛星（ガリレオ衛星）のうち最も内側を回る衛星です。木星と他の衛星からの強い引力でもみほぐされる（潮汐加熱）ため、太陽系でいちばん火山活動が活発な天体になっています。噴き出した硫黄によって表面が黄色やオレンジ色に染まっています。",
    descriptionEn:
      "Io is one of Jupiter's four big moons and moves very close to Jupiter. It has more active volcanoes than any other place in our solar system. Because of the volcanic dust, its surface looks bright yellow and orange. It goes around Jupiter in less than two days.",
  },
  europa: {
    id: "europa",
    nameJa: "エウロパ",
    nameEn: "Europa",
    categoryJa: "木星の衛星（ガリレオ衛星）",
    categoryEn: "Moon of Jupiter",
    symbol: "◦",
    accentColor: "#bae6fd",
    facts: [
      { labelJa: "公転周期", value: "約3.55日" },
      { labelJa: "木星からの順番", value: "主要衛星の2番目" },
      { labelJa: "特徴", value: "氷の下に広がる海" },
    ],
    descriptionJa:
      "表面全体がなめらかな氷の殻でおおわれ、赤茶色のひび割れ模様が走る木星の衛星です。この分厚い氷の下には、地球のすべての海を合わせたより多い液体の海が広がっていると考えられており、地球外生命がいるかもしれない注目スポットです。",
    descriptionEn:
      "Europa is a cold moon of Jupiter covered with smooth white ice. You can see many long red and brown lines across the ice. Scientists think there is a deep ocean of liquid water under the ice. Because of this water, people hope to find signs of life there.",
  },
  ganymede: {
    id: "ganymede",
    nameJa: "ガニメデ",
    nameEn: "Ganymede",
    categoryJa: "木星の衛星（ガリレオ衛星）",
    categoryEn: "Moon of Jupiter",
    symbol: "◦",
    accentColor: "#d6d3d1",
    facts: [
      { labelJa: "公転周期", value: "約7.16日" },
      { labelJa: "木星からの順番", value: "主要衛星の3番目" },
      { labelJa: "特徴", value: "太陽系最大の衛星" },
    ],
    descriptionJa:
      "太陽系にあるすべての衛星の中でいちばん大きく、惑星である水星よりも直径が大きな衛星です。衛星としては珍しく自分自身の磁場（じば）を持っており、表面には古い暗い地形と新しい明るい筋模様の地形が入り混じっています。",
    descriptionEn:
      "Ganymede is the biggest moon in the whole solar system. In fact, it is even larger than the planet Mercury! It is made of rock and ice, and it is the only moon known to have its own magnetic field. It goes around Jupiter once every seven days.",
  },
  callisto: {
    id: "callisto",
    nameJa: "カリスト",
    nameEn: "Callisto",
    categoryJa: "木星の衛星（ガリレオ衛星）",
    categoryEn: "Moon of Jupiter",
    symbol: "◦",
    accentColor: "#a8a29e",
    facts: [
      { labelJa: "公転周期", value: "約16.69日" },
      { labelJa: "木星からの順番", value: "主要衛星の4番目" },
      { labelJa: "特徴", value: "無数のクレーター" },
    ],
    descriptionJa:
      "木星の主要4衛星の中でいちばん外側を回る、氷と岩石でできた大きな衛星です。何十億年ものあいだ火山活動や地殻変動がほとんど起きていないため、太陽系でもトップクラスにたくさんのクレーターが昔の姿のまま残っています。",
    descriptionEn:
      "Callisto is the farthest of Jupiter's four big moons. It is a dark world made of rock and ice, and it is covered with thousands of bright craters. Its surface is very old and has not changed much for billions of years. It takes about 17 days to go around Jupiter.",
  },
  saturn: {
    id: "saturn",
    nameJa: "土星",
    nameEn: "Saturn",
    categoryJa: "巨大ガス惑星",
    categoryEn: "Gas Giant",
    symbol: "♄",
    accentColor: "#fde047",
    facts: [
      { labelJa: "太陽からの距離", value: "約9.58 AU" },
      { labelJa: "公転周期", value: "約29.5年" },
      { labelJa: "密度", value: "水より軽い" },
    ],
    descriptionJa:
      "大きく美しいリング（環）を持つことで有名な巨大ガス惑星です。リングは1枚の板ではなく、数センチから数メートルほどの無数の氷や岩の粒が集まって土星のまわりを回っています。土星全体の平均密度は水より小さいため、巨大なプールがあれば水に浮くほど軽い惑星です。",
    descriptionEn:
      "Saturn is a giant gas planet famous for its huge, beautiful rings. The rings are not solid; they are made of millions of pieces of ice and rock. Saturn is the second largest planet, but it is very light—lighter than water! It takes almost 30 years to go around the Sun.",
  },
  uranus: {
    id: "uranus",
    nameJa: "天王星",
    nameEn: "Uranus",
    categoryJa: "巨大氷惑星",
    categoryEn: "Ice Giant",
    symbol: "♅",
    accentColor: "#67e8f9",
    facts: [
      { labelJa: "太陽からの距離", value: "約19.2 AU" },
      { labelJa: "公転周期", value: "約84.0年" },
      { labelJa: "自転軸の傾き", value: "約97.8°（横倒し）" },
    ],
    descriptionJa:
      "淡い水色に輝く巨大氷惑星です。最大の特徴は自転軸が約97.8°も傾いていることで、まるで横に寝転がって転がるボールのように太陽のまわりを公転しています。そのため、天王星のまわりにある細い環も縦向きに回って見えます。",
    descriptionEn:
      "Uranus is a cold, light-blue planet made mostly of ice and gas. It is very special because it leans completely on its side as it moves around the Sun. Because it is tilted like this, its thin rings look almost vertical. One year on Uranus is 84 Earth years long.",
  },
  neptune: {
    id: "neptune",
    nameJa: "海王星",
    nameEn: "Neptune",
    categoryJa: "巨大氷惑星",
    categoryEn: "Ice Giant",
    symbol: "♆",
    accentColor: "#60a5fa",
    facts: [
      { labelJa: "太陽からの距離", value: "約30.1 AU" },
      { labelJa: "公転周期", value: "約164.8年" },
      { labelJa: "特徴", value: "時速2,000kmの嵐" },
    ],
    descriptionJa:
      "太陽系の8つの惑星の中でいちばん外側を回る、深いコバルトブルーの氷惑星です。望遠鏡で偶然見つかったのではなく、天王星の動きのズレから数学の計算で位置が予測されて発見されました。大気では時速2,000kmにも達する太陽系最強の暴風が吹き荒れています。",
    descriptionEn:
      "Neptune is the farthest of the eight planets from the Sun. It has a deep blue color because of a gas called methane in its air. Very strong winds blow on Neptune—the fastest winds in our solar system. It is so far away that it takes about 165 years to go around the Sun.",
  },
  pluto: {
    id: "pluto",
    nameJa: "冥王星",
    nameEn: "Pluto",
    categoryJa: "準惑星",
    categoryEn: "Dwarf Planet",
    symbol: "♇",
    accentColor: "#e9d5ff",
    facts: [
      { labelJa: "太陽からの距離", value: "約39.5 AU" },
      { labelJa: "公転周期", value: "約248年" },
      { labelJa: "軌道の傾き", value: "約17.2°" },
    ],
    descriptionJa:
      "海王星の外側（エッジワース・カイパーベルト）を回る氷と岩の準惑星です。表面にはハート形に見える明るい氷原「トンボー地域」があります。太陽のまわりを回り丸い形をしていますが、軌道の近くに似た大きさの氷の天体が他にも多く存在するため、2006年から「準惑星」に分類されています。",
    descriptionEn:
      "Pluto is a small, icy dwarf planet far beyond Neptune. It is even smaller than the Earth's Moon and has a bright heart shape on its surface. Its path around the Sun is tilted and long, and it takes 248 years to go around once. Because it shares its path with other icy objects, it is called a dwarf planet.",
  },
  milkyWay: {
    id: "milkyWay",
    nameJa: "天の川銀河",
    nameEn: "Milky Way Galaxy",
    categoryJa: "棒渦巻銀河（私たちの銀河系）",
    categoryEn: "Barred Spiral Galaxy",
    symbol: "✦",
    accentColor: "#93c5fd",
    facts: [
      { labelJa: "直径", value: "約10万光年" },
      { labelJa: "恒星の数", value: "約2,000〜4,000億個" },
      { labelJa: "太陽系の位置", value: "中心から約2.6万光年" },
    ],
    descriptionJa:
      "私たちの太陽系が属する大きな「棒渦巻銀河（銀河系）」です。直径は光の速さでも端から端まで約10万年かかる約10万光年もあり、2,000億〜4,000億個もの星が集まっています。太陽系は中心から約2.6万光年離れた「オリオン腕」のあたりにあり、約2.3億年かけて銀河の中心（巨大ブラックホール・いて座A*）のまわりを1周しています。",
    descriptionEn:
      "The Milky Way is our home galaxy. It is a huge spiral galaxy with more than 200 billion stars. It is about 100,000 light-years wide. Our Sun and Earth are not at the center; we live on a spiral arm far from the center. The solar system takes about 230 million years to go around the center once.",
  },
  andromeda: {
    id: "andromeda",
    nameJa: "アンドロメダ銀河 (M31)",
    nameEn: "Andromeda Galaxy",
    categoryJa: "巨大渦巻銀河",
    categoryEn: "Large Spiral Galaxy",
    symbol: "✧",
    accentColor: "#c4b5fd",
    facts: [
      { labelJa: "距離", value: "約250万光年" },
      { labelJa: "直径", value: "約22万光年" },
      { labelJa: "恒星の数", value: "約1兆個" },
    ],
    descriptionJa:
      "天の川銀河のいちばん近くにある大型の渦巻銀河で、肉眼で見える最も遠い天体のひとつです。地球から約250万光年離れており、今私たちが望遠鏡で見ている光は250万年前に出発した光です。天の川銀河よりさらに大きく、お互いに重力で引き合っているため、約45億年後には2つの銀河が合体して1つの巨大な銀河になると考えられています。",
    descriptionEn:
      "Andromeda is the biggest spiral galaxy near the Milky Way. It is about 2.5 million light-years away from us and has around one trillion stars. It is even larger than our galaxy! Because of gravity, Andromeda and the Milky Way are slowly moving closer and will join together in about 4.5 billion years.",
  },
  triangulum: {
    id: "triangulum",
    nameJa: "さんかく座銀河 (M33)",
    nameEn: "Triangulum Galaxy",
    categoryJa: "渦巻銀河（局部銀河群第3位）",
    categoryEn: "Spiral Galaxy",
    symbol: "✶",
    accentColor: "#67e8f9",
    facts: [
      { labelJa: "距離", value: "約270〜300万光年" },
      { labelJa: "直径", value: "約6万光年" },
      { labelJa: "恒星の数", value: "約400億個" },
    ],
    descriptionJa:
      "局部銀河群の中で、アンドロメダ銀河・天の川銀河に次いで3番目に大きな渦巻銀河です。直径は約6万光年で、きれいな渦巻きの腕の中で新しい星が次々と生まれています。アンドロメダ銀河のすぐ近くに位置し、重力でゆるやかに結びついています。",
    descriptionEn:
      "The Triangulum Galaxy is the third largest galaxy in our Local Group, after Andromeda and the Milky Way. It is about 3 million light-years away and has around 40 billion stars. Many young, bright stars are being born in its clean spiral arms.",
  },
  magellanicClouds: {
    id: "magellanicClouds",
    nameJa: "大小マゼラン雲",
    nameEn: "Magellanic Clouds",
    categoryJa: "伴銀河（不規則銀河）",
    categoryEn: "Satellite Irregular Galaxies",
    symbol: "☁",
    accentColor: "#bae6fd",
    facts: [
      { labelJa: "距離", value: "約16〜20万光年" },
      { labelJa: "観察できる場所", value: "南半球（シドニー等）" },
      { labelJa: "分類", value: "天の川銀河の伴銀河" },
    ],
    descriptionJa:
      "天の川銀河のすぐ外側を回る「大マゼラン雲」と「小マゼラン雲」の2つの小さな不規則銀河です。距離は約16万〜20万光年と非常に近く、オーストラリア（シドニー）など南半球の暗い夜空では、肉眼でもぼんやり光る雲のように見えます。",
    descriptionEn:
      "The Large and Small Magellanic Clouds are two small galaxies that move around the Milky Way. They are only about 160,000 to 200,000 light-years away. If you visit the Southern Hemisphere, such as Australia, you can see them in the night sky without a telescope.",
  },
  localGroup: {
    id: "localGroup",
    nameJa: "局部銀河群",
    nameEn: "Local Group",
    categoryJa: "銀河群（約50個以上の銀河の集まり）",
    categoryEn: "Galaxy Group",
    symbol: "◎",
    accentColor: "#7dd3fc",
    facts: [
      { labelJa: "広がり（直径）", value: "約1,000万光年" },
      { labelJa: "銀河の数", value: "約50〜80個以上" },
      { labelJa: "中心メンバー", value: "天の川＆アンドロメダ" },
    ],
    descriptionJa:
      "天の川銀河・アンドロメダ銀河・さんかく座銀河の3つの渦巻銀河と、大小マゼラン雲などの小さな矮小銀河（わいしょうぎんが）が合わせて50個以上、重力で引き合って集まった「銀河のグループ」です。直径は約1,000万光年にも広がっています。",
    descriptionEn:
      "The Local Group is a family of more than 50 galaxies held together by gravity. It is about 10 million light-years wide. The Milky Way, Andromeda, and the Triangulum Galaxy are the three biggest members, and many smaller dwarf galaxies move around them.",
  },
  virgoCluster: {
    id: "virgoCluster",
    nameJa: "おとめ座銀河団",
    nameEn: "Virgo Cluster",
    categoryJa: "銀河団（大規模構造の中核）",
    categoryEn: "Galaxy Cluster",
    symbol: "❖",
    accentColor: "#fde68a",
    facts: [
      { labelJa: "距離", value: "約5,400万光年" },
      { labelJa: "銀河の数", value: "約1,500〜2,000個" },
      { labelJa: "中心の巨大銀河", value: "M87（楕円銀河）" },
    ],
    descriptionJa:
      "私たちの局部銀河群から約5,400万光年離れた場所にある、1,500〜2,000個もの銀河がぎっしり集まった巨大な「銀河団」です。中心には巨大ブラックホールの撮影で有名な楕円銀河「M87」があります。さらに広いスケールで見ると、銀河団どうしがクモの巣のように連なる「超銀河団（ラニアケア超銀河団）」という宇宙の大規模構造を作っています。",
    descriptionEn:
      "The Virgo Cluster is a giant crowd of about 1,500 to 2,000 galaxies, located 54 million light-years away from us. At its center sits a huge galaxy called M87 with a supermassive black hole. Together with our Local Group and other clusters, it forms a vast web of galaxies across the universe.",
  },
  fornaxCluster: {
    id: "fornaxCluster",
    nameJa: "ろ座銀河団",
    nameEn: "Fornax Cluster",
    categoryJa: "銀河団（南天の近傍銀河団）",
    categoryEn: "Galaxy Cluster",
    symbol: "◈",
    accentColor: "#93c5fd",
    facts: [
      { labelJa: "距離", value: "約6,200万光年" },
      { labelJa: "銀河の数", value: "約60〜340個以上" },
      { labelJa: "中心の巨大銀河", value: "NGC 1399（楕円銀河）" },
    ],
    descriptionJa:
      "南の空の「ろ座（炉座）」の方向、約6,200万光年先にある銀河団で、おとめ座銀河団に次いで地球から2番目に近い大規模な銀河団です。おとめ座銀河団より規模は小ぶりですが中心部に銀河がぎゅっと集まっており、巨大な楕円銀河 NGC 1399 や美しい棒渦巻銀河 NGC 1365、銀河どうしが合体している現場などが見られるため、銀河の進化を研究する重要な場所になっています。",
    descriptionEn:
      "The Fornax Cluster is the second closest rich galaxy cluster to Earth, after the Virgo Cluster. It is about 62 million light-years away in the southern sky. Although it is smaller than Virgo, its galaxies are packed closely together. Scientists study it to learn how galaxies meet, merge, and grow over time.",
  },
  comaCluster: {
    id: "comaCluster",
    nameJa: "かみのけ座銀河団",
    nameEn: "Coma Cluster (Abell 1656)",
    categoryJa: "超大型銀河団（暗黒物質発見の舞台）",
    categoryEn: "Rich Galaxy Cluster",
    symbol: "◈",
    accentColor: "#a5b4fc",
    facts: [
      { labelJa: "距離", value: "約3.2億光年" },
      { labelJa: "銀河の数", value: "1,000個以上（主に楕円銀河）" },
      { labelJa: "歴史的意義", value: "ダークマター存在の初提唱" },
    ],
    descriptionJa:
      "春の星座「かみのけ座」の方向、約3.2億光年先にある非常に大きく球状に整った銀河団です。1,000個以上の銀河が集まり、中心には2つの超巨大楕円銀河（NGC 4874・NGC 4889）が鎮座しています。1933年に天文学者フリッツ・ツビッキーがこの銀河団の銀河の動きが速すぎることに気づき、目に見えない重力源「ダークマター（暗黒物質）」の存在を初めて提唱した記念碑的な天体です。",
    descriptionEn:
      "The Coma Cluster is a massive, round cluster of more than 1,000 galaxies, about 320 million light-years away. Most of its galaxies are old elliptical galaxies. In 1933, scientists noticed the galaxies were moving too fast to stay together by normal gravity alone. This led to the famous idea of invisible dark matter!",
  },
  greatAttractor: {
    id: "greatAttractor",
    nameJa: "グレートアトラクター",
    nameEn: "Great Attractor",
    categoryJa: "巨大重力異常（ラニアケアの中心）",
    categoryEn: "Gravitational Center of Laniakea",
    symbol: "★",
    accentColor: "#f0abfc",
    facts: [
      { labelJa: "距離", value: "約1.5〜2.5億光年" },
      { labelJa: "役割", value: "ラニアケア超銀河団の重力中心" },
      { labelJa: "正体", value: "じょうぎ座銀河団など大質量密集域" },
    ],
    descriptionJa:
      "天の川銀河や局部銀河群、おとめ座銀河団など数万個もの銀河を秒速数百kmで引き寄せている、ラニアケア超銀河団の巨大な重力の中心です。地球から見ると天の川銀河自身の厚いガスとちりの円盤の向こう側（隠蔽帯）にあるため可視光では観測しにくく、長いあいだ謎に包まれていました。現在は「じょうぎ座銀河団」を中心とした巨大な銀河密集域（さらに奥のシャプレー超銀河団の重力も含む）だと考えられています。",
    descriptionEn:
      "The Great Attractor is a huge center of gravity about 150 to 250 million light-years away. It pulls our Milky Way and tens of thousands of nearby galaxies toward it. It was hard to see for a long time because the dust of our own galaxy blocks the view. Today, we know it sits near the heart of the Laniakea Supercluster.",
  },
  laniakea: {
    id: "laniakea",
    nameJa: "ラニアケア超銀河団",
    nameEn: "Laniakea Supercluster",
    categoryJa: "超銀河団（私たちの宇宙の住所）",
    categoryEn: "Supercluster",
    symbol: "❖",
    accentColor: "#f0abfc",
    facts: [
      { labelJa: "広がり（直径）", value: "約5.2億光年" },
      { labelJa: "銀河の数", value: "約10万個" },
      { labelJa: "重力中心", value: "グレートアトラクター" },
    ],
    descriptionJa:
      "2014年に定義された、私たちの天の川銀河や局部銀河群・おとめ座銀河団を含む巨大な「超銀河団」です。名前はハワイ語で「計り知れない天国」を意味します。直径は約5.2億光年もあり、約10万個もの銀河が、まるで川の水がひとつの海へ流れ込むように、重力の中心「グレートアトラクター」へ向かって羽根のような流れを作って集まっています。",
    descriptionEn:
      "Laniakea is the giant supercluster of galaxies that is our home in space. Its name means 'immeasurable heaven' in Hawaiian. It is about 520 million light-years wide and holds around 100,000 galaxies, including our Milky Way. Like rivers flowing to the sea, galaxies in Laniakea move toward a huge center of gravity called the Great Attractor.",
  },
  observableUniverse: {
    id: "observableUniverse",
    nameJa: "観測可能な宇宙",
    nameEn: "Observable Universe",
    categoryJa: "宇宙の果て（光が届く限界の球体）",
    categoryEn: "Cosmic Horizon & CMB",
    symbol: "✦",
    accentColor: "#38bdf8",
    facts: [
      { labelJa: "直径", value: "約930億光年" },
      { labelJa: "宇宙の年齢", value: "約138億年" },
      { labelJa: "銀河の数", value: "約2兆個以上" },
    ],
    descriptionJa:
      "約138億年前のビッグバンから今まで、宇宙自身の膨張を含めて地球へ光が届く限界の範囲を「観測可能な宇宙」と呼び、その直径は約930億光年に達します。内部には銀河団がクモの巣のように連なる「コズミック・ウェブ」と銀河がほぼない「超空洞（ボイド）」が広がり、いちばん外側を宇宙誕生約38万年後の名残である「宇宙マイクロ波背景放射（CMB）」が包んでいます。",
    descriptionEn:
      "The observable universe is the whole part of space that we can see from Earth. Even though the universe is about 13.8 billion years old, space has been expanding, so the edge we can see is about 46.5 billion light-years away—93 billion light-years across! Inside is a giant web of over two trillion galaxies surrounded by ancient light from the early universe.",
  },
  sirius: {
    id: "sirius",
    nameJa: "シリウス",
    nameEn: "Sirius (Alpha Canis Majoris)",
    categoryJa: "主系列星（冬の大三角・全天最輝）",
    categoryEn: "Brightest Night Star (A1V)",
    symbol: "★",
    accentColor: "#bae6fd",
    facts: [
      { labelJa: "距離", value: "約8.6光年" },
      { labelJa: "明るさ（等級）", value: "-1.46等（夜空で1位）" },
      { labelJa: "表面温度・色", value: "約9,900℃（青白）" },
    ],
    descriptionJa:
      "おおいぬ座の1等星で、太陽をのぞくと地球の夜空でいちばん明るく輝く青白い星です。オリオン座の三つ星を左下にたどるとすぐに見つかり、ベテルギウス・プロキオンと「冬の大三角」を作ります。地球から約8.6光年と非常に近く、すぐそばを小さな白色矮星「シリウスB」が約50年周期で回っています。",
    descriptionEn:
      "Sirius is the brightest star in Earth's night sky. It shines with a bright blue-white light in the winter constellation Canis Major. Sirius is very close to us—only 8.6 light-years away—and is about 25 times brighter than our Sun. It forms the Winter Triangle with Betelgeuse and Procyon.",
  },
  betelgeuse: {
    id: "betelgeuse",
    nameJa: "ベテルギウス",
    nameEn: "Betelgeuse (Alpha Orionis)",
    categoryJa: "赤色超巨星（冬の大三角・オリオン座）",
    categoryEn: "Red Supergiant (M1-2)",
    symbol: "★",
    accentColor: "#fb923c",
    facts: [
      { labelJa: "距離", value: "約550光年" },
      { labelJa: "大きさ", value: "太陽の約700倍以上" },
      { labelJa: "表面温度・色", value: "約3,300℃（赤橙）" },
    ],
    descriptionJa:
      "オリオン座の左肩（北東）で赤オレンジ色に輝く巨大な「赤色超巨星」です。太陽の位置に置くと木星の軌道に届くほど巨大で、表面温度が約3,300℃と低いため赤く見えます。星の寿命の終盤にあり、今後10万年ほどのあいだに大爆発（超新星爆発）を起こすと考えられています。",
    descriptionEn:
      "Betelgeuse is a huge orange-red star on the shoulder of Orion. It is a red supergiant—hundreds of times wider than our Sun! Because its surface is cooler than the Sun, it glows red. It is near the end of its life and will explode as a supernova in the distant future.",
  },
  procyon: {
    id: "procyon",
    nameJa: "プロキオン",
    nameEn: "Procyon (Alpha Canis Minoris)",
    categoryJa: "準巨星（冬の大三角・こいぬ座）",
    categoryEn: "Bright Winter Star (F5IV)",
    symbol: "★",
    accentColor: "#fef9c3",
    facts: [
      { labelJa: "距離", value: "約11.5光年" },
      { labelJa: "明るさ（等級）", value: "+0.34等（1等星）" },
      { labelJa: "表面温度・色", value: "約6,500℃（黄白）" },
    ],
    descriptionJa:
      "こいぬ座の1等星で、シリウス・ベテルギウスとともに「冬の大三角」を作る黄白色の星です。名前はギリシャ語で「犬（シリウス）の前」という意味があり、シリウスより少し早く東の空から昇ってくることに由来します。地球から約11.5光年とご近所にある恒星のひとつです。",
    descriptionEn:
      "Procyon is the brightest star in the small winter constellation Canis Minor. Its name means 'before the dog' because it rises just before Sirius, the Dog Star. Procyon is only 11.5 light-years from Earth and shines with a soft yellow-white light as part of the Winter Triangle.",
  },
  rigel: {
    id: "rigel",
    nameJa: "リゲル",
    nameEn: "Rigel (Beta Orionis)",
    categoryJa: "青色超巨星（オリオン座・冬のダイヤモンド）",
    categoryEn: "Blue Supergiant (B8Ia)",
    symbol: "★",
    accentColor: "#93c5fd",
    facts: [
      { labelJa: "距離", value: "約860光年" },
      { labelJa: "明るさ", value: "太陽の約12万倍" },
      { labelJa: "表面温度・色", value: "約12,000℃（青白）" },
    ],
    descriptionJa:
      "オリオン座の右足（南西）で鋭く青白く輝く「青色超巨星」です。地球から約860光年も遠く離れているにもかかわらず1等星として非常に明るく見えるのは、太陽の約12万倍ものすさまじいエネルギーで輝いているためです。「冬のダイヤモンド」の角のひとつでもあります。",
    descriptionEn:
      "Rigel is a blazing blue-white supergiant star at the foot of Orion. Even though it is about 860 light-years away, it is one of the brightest stars we can see because it shines over 100,000 times brighter than our Sun! Its surface is very hot, which gives it a crisp blue color.",
  },
  aldebaran: {
    id: "aldebaran",
    nameJa: "アルデバラン",
    nameEn: "Aldebaran (Alpha Tauri)",
    categoryJa: "赤色巨星（おうし座・冬のダイヤモンド）",
    categoryEn: "Orange Giant Star (K5III)",
    symbol: "★",
    accentColor: "#fdba74",
    facts: [
      { labelJa: "距離", value: "約65光年" },
      { labelJa: "大きさ", value: "太陽の約44倍" },
      { labelJa: "表面温度・色", value: "約3,900℃（橙）" },
    ],
    descriptionJa:
      "おうし座の赤い目にあたる1等星で、「あとに続くもの」というアラビア語の名前（すばる＝プレアデス星団のあとから昇るため）を持ちます。太陽の約44倍の直径を持つオレンジ色の巨星で、冬の夜空に大きく広がる「冬のダイヤモンド」を形作る星のひとつです。",
    descriptionEn:
      "Aldebaran is the bright orange eye of Taurus the Bull. Its name means 'the follower' because it rises right after the Pleiades star cluster. It is an orange giant star about 44 times wider than the Sun, located 65 light-years away, and forms one corner of the Winter Hexagon.",
  },
  capella: {
    id: "capella",
    nameJa: "カペラ",
    nameEn: "Capella (Alpha Aurigae)",
    categoryJa: "黄色巨星ペア（ぎょしゃ座・冬のダイヤモンド）",
    categoryEn: "Golden Giant Star System (G8III)",
    symbol: "★",
    accentColor: "#fde68a",
    facts: [
      { labelJa: "距離", value: "約42.9光年" },
      { labelJa: "明るさ（等級）", value: "+0.08等（全天6位）" },
      { labelJa: "特徴", value: "実は4重星システム" },
    ],
    descriptionJa:
      "ぎょしゃ座の1等星で、冬の夜空のいちばん北より（高い位置）で黄金色に輝く明るい星です。肉眼では1つの星に見えますが、実は太陽より約10倍大きい2つの黄色巨星がすぐそばで回り合い、さらに2つの小さな赤色矮星も伴う「4重星」になっています。",
    descriptionEn:
      "Capella is the brightest star in the constellation Auriga and shines high in the northern winter sky. It looks like a single golden star to our eyes, but it is actually a system of four stars—two bright yellow giants orbiting close together and two smaller red stars.",
  },
  pollux: {
    id: "pollux",
    nameJa: "ポルックス",
    nameEn: "Pollux (Beta Geminorum)",
    categoryJa: "橙色巨星（ふたご座・冬のダイヤモンド）",
    categoryEn: "Orange Giant Star (K0III)",
    symbol: "★",
    accentColor: "#fed7aa",
    facts: [
      { labelJa: "距離", value: "約33.8光年" },
      { labelJa: "大きさ", value: "太陽の約9倍" },
      { labelJa: "特徴", value: "系外惑星を持つ1等星" },
    ],
    descriptionJa:
      "ふたご座で最も明るいオレンジ色の1等星で、兄弟星「カストル」と仲良く並んでいます。地球から約33.8光年と近く、まわりを木星より大きな太陽系外惑星（テスティアス）が公転していることが確認されている、数少ない1等星のひとつです。",
    descriptionEn:
      "Pollux is the brightest star in Gemini, shining next to its twin star Castor. It is an orange giant star located 34 light-years away, about nine times wider than our Sun. Scientists also discovered a giant planet orbiting around Pollux!",
  },
  arcturus: {
    id: "arcturus",
    nameJa: "アークトゥルス",
    nameEn: "Arcturus (Alpha Boötis)",
    categoryJa: "赤色巨星（春の大三角・北天最輝）",
    categoryEn: "Brightest Northern Star (K1.5III)",
    symbol: "★",
    accentColor: "#fdba74",
    facts: [
      { labelJa: "距離", value: "約36.7光年" },
      { labelJa: "明るさ（等級）", value: "-0.05等（全天4位）" },
      { labelJa: "大きさ", value: "太陽の約25倍" },
    ],
    descriptionJa:
      "うしかい座の1等星で、北斗七星の柄のカーブをそのまま伸ばした先に見つかるオレンジ色の明るい星です。天の赤道より北側（北天）では全天一明るく、スピカ・デネボラと「春の大三角」を作ります。日本では麦の刈り入れ時期に輝くため「麦星」とも呼ばれます。",
    descriptionEn:
      "Arcturus is a bright orange giant star in the spring sky and the brightest star in the northern celestial hemisphere. You can find it easily by following the curved handle of the Big Dipper. It is about 37 light-years away and forms the Spring Triangle with Spica and Denebola.",
  },
  spica: {
    id: "spica",
    nameJa: "スピカ",
    nameEn: "Spica (Alpha Virginis)",
    categoryJa: "青色巨星連星（春の大三角・おとめ座）",
    categoryEn: "Blue Giant Binary (B1III)",
    symbol: "★",
    accentColor: "#93c5fd",
    facts: [
      { labelJa: "距離", value: "約250光年" },
      { labelJa: "表面温度・色", value: "約25,000℃（青白）" },
      { labelJa: "特徴", value: "4日で回り合う超近接連星" },
    ],
    descriptionJa:
      "おとめ座の1等星で、春の大曲線（北斗七星→アークトゥルス→スピカ）の終点に青白く清らかに輝く星です。日本では「真珠星」と呼ばれます。実は非常に高温な2つの大質量星がわずか4日周期ですぐそばを回り合っており、重力で少し卵形に引き伸ばされています。",
    descriptionEn:
      "Spica is the brightest star in Virgo and shines with a crisp blue-white light in the spring sky. In Japan, it is also called the 'Pearl Star.' It is actually two very hot, massive stars orbiting close to each other every four days, about 250 light-years away.",
  },
  denebola: {
    id: "denebola",
    nameJa: "デネボラ",
    nameEn: "Denebola (Beta Leonis)",
    categoryJa: "主系列星（春の大三角・しし座）",
    categoryEn: "Spring Triangle Star (A3V)",
    symbol: "★",
    accentColor: "#e0f2fe",
    facts: [
      { labelJa: "距離", value: "約35.9光年" },
      { labelJa: "明るさ（等級）", value: "+2.14等（2等星）" },
      { labelJa: "特徴", value: "しし座の尻尾の星" },
    ],
    descriptionJa:
      "しし座の尻尾にあたる白い星で、名前はアラビア語で「ライオンの尾」を意味します。アークトゥルス・スピカと結ぶと、春の南の空に美しい正三角形に近い「春の大三角」が浮かび上がります。周囲には塵の円盤（デブリ円盤）があることも知られています。",
    descriptionEn:
      "Denebola marks the tail of Leo the Lion—its name literally means 'the lion's tail.' It is a bright white star located about 36 light-years away. Together with Arcturus and Spica, Denebola forms the large Spring Triangle in the night sky.",
  },
  vega: {
    id: "vega",
    nameJa: "ベガ（織姫星）",
    nameEn: "Vega (Alpha Lyrae)",
    categoryJa: "主系列星（夏の大三角・こと座）",
    categoryEn: "Summer Triangle Star (A0V)",
    symbol: "★",
    accentColor: "#bfdbfe",
    facts: [
      { labelJa: "距離", value: "約25.0光年" },
      { labelJa: "明るさ（等級）", value: "+0.03等（等級の基準）" },
      { labelJa: "特徴", value: "約1.2万年後の北極星" },
    ],
    descriptionJa:
      "こと座の1等星で、七夕の「織姫星」として親しまれる青白い星です。アルタイル・デネブと「夏の大三角」を作ります。12.5時間という猛スピードで自転しているため少し平べったく、さらに地球の歳差運動によって約1万2,000年後にはベガが北極星になります。",
    descriptionEn:
      "Vega is a bright blue-white star in the constellation Lyra and is famous in Japan as Orihime, the Weaver Star of Tanabata. It is 25 light-years away and forms the Summer Triangle with Altair and Deneb. In about 12,000 years, Earth's slow wobble will make Vega our new North Star!",
  },
  altair: {
    id: "altair",
    nameJa: "アルタイル（彦星）",
    nameEn: "Altair (Alpha Aquilae)",
    categoryJa: "主系列星（夏の大三角・わし座）",
    categoryEn: "Summer Triangle Star (A7V)",
    symbol: "★",
    accentColor: "#f0f9ff",
    facts: [
      { labelJa: "距離", value: "約16.7光年" },
      { labelJa: "明るさ（等級）", value: "+0.76等（1等星）" },
      { labelJa: "自転速度", value: "約9時間（超高速自転）" },
    ],
    descriptionJa:
      "わし座の1等星で、七夕の「彦星」として知られる白い星です。ベガとの間には夏の天の川が流れています。地球から約16.7光年と非常に近く、わずか約9時間というすさまじい速さで自転しているため、赤道が大きく膨らんだ楕円形をしています。",
    descriptionEn:
      "Altair is the brightest star in Aquila the Eagle and is known as Hikoboshi in Japan's Tanabata story. It is only 16.7 light-years from Earth. Altair spins so fast—once every nine hours—that the star is flattened like a cushion instead of a perfect ball.",
  },
  deneb: {
    id: "deneb",
    nameJa: "デネブ",
    nameEn: "Deneb (Alpha Cygni)",
    categoryJa: "白色超巨星（夏の大三角・はくちょう座）",
    categoryEn: "Blue-White Supergiant (A2Ia)",
    symbol: "★",
    accentColor: "#dbeafe",
    facts: [
      { labelJa: "距離", value: "約2,600光年" },
      { labelJa: "明るさ", value: "太陽の約20万倍" },
      { labelJa: "大きさ", value: "太陽の約200倍" },
    ],
    descriptionJa:
      "はくちょう座の尾にあたる1等星で、ベガ・アルタイルとともに「夏の大三角」を作ります。他の2星（17〜25光年）と違って地球から約2,600光年も彼方にあり、実は太陽の約20万倍も明るい途方もない超巨星です。地球から見る三角形が、宇宙では深い奥行きを持つことを教えてくれます。",
    descriptionEn:
      "Deneb marks the tail of Cygnus the Swan and completes the Summer Triangle. While Vega and Altair are nearby, Deneb is roughly 2,600 light-years away! It still looks bright to us because it is a colossal supergiant shining nearly 200,000 times brighter than our Sun.",
  },
  fomalhaut: {
    id: "fomalhaut",
    nameJa: "フォーマルハウト",
    nameEn: "Fomalhaut (Alpha Piscis Austrini)",
    categoryJa: "主系列星（秋の南の1等星・みなみのうお座）",
    categoryEn: "Autumn First-Magnitude Star (A3V)",
    symbol: "★",
    accentColor: "#e0f2fe",
    facts: [
      { labelJa: "距離", value: "約25.1光年" },
      { labelJa: "明るさ（等級）", value: "+1.16等（秋唯一の1等星）" },
      { labelJa: "特徴", value: "壮大な塵のリングを持つ" },
    ],
    descriptionJa:
      "みなみのうお座の1等星で、明るい星が少ない秋の夜空の低い南にぽつんと輝くため「秋のひとつ星」とも呼ばれます。地球から約25光年と近く、ジェイムズ・ウェッブ宇宙望遠鏡などによって、星のまわりを取り巻く美しい塵と氷のリングが直接撮影されています。",
    descriptionEn:
      "Fomalhaut is the only first-magnitude star in the autumn sky, shining low in the south in Piscis Austrinus. It is a young white star about 25 light-years away. Space telescopes have taken direct pictures of a huge ring of icy dust orbiting around Fomalhaut.",
  },
  alphaCentauri: {
    id: "alphaCentauri",
    nameJa: "アルファ・ケンタウリ",
    nameEn: "Alpha Centauri System",
    categoryJa: "最寄りの恒星系（三重星・ケンタウルス座）",
    categoryEn: "Closest Star System to Sun",
    symbol: "★",
    accentColor: "#fef08a",
    facts: [
      { labelJa: "距離", value: "約4.37光年（最寄り）" },
      { labelJa: "構成", value: "太陽に似た2星＋プロキシマ" },
      { labelJa: "観察できる場所", value: "南半球（南十字星の隣）" },
    ],
    descriptionJa:
      "私たちの太陽系からわずか約4.37光年（伴星のプロキシマ・ケンタウリは約4.24光年）と、宇宙で最も近いお隣の恒星系です。太陽によく似た2つの星（A・B）と小さな赤色矮星（プロキシマ）の3重星で、プロキシマのまわりには地球に似た大きさの惑星も見つかっています。",
    descriptionEn:
      "Alpha Centauri is the closest star system to our Sun, just 4.37 light-years away! It is made of three stars: two stars very similar to our Sun, plus a small red star called Proxima Centauri, which is the very closest star to Earth and even has a planet of its own.",
  },
};

/** 解説カードを開けるすべての天体・星座・構造の解説データです。 */
export const CELESTIAL_BODY_PROFILES: Record<
  CelestialBodyId,
  CelestialBodyProfile
> = {
  ...BASE_CELESTIAL_BODY_PROFILES,
  ...CONSTELLATION_STAR_PROFILES,
  ...CONSTELLATION_PROFILES,
  ...ASTERISM_PROFILES,
  ...COSMIC_STRUCTURE_PROFILES,
};
