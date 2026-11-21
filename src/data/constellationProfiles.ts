import type { CelestialBodyProfile, SkyFigure } from "./celestialBodies";
import {
  CASSIOPEIA_CONSTELLATION,
  SOUTHERN_CROSS_CONSTELLATION,
  ZODIAC_CONSTELLATIONS,
  ZodiacConstellationId,
  ZodiacStarPoint,
} from "../astronomy/zodiac";
import {
  FEATURED_STAR_MAP,
  SEASONAL_ASTERISMS,
  SEASONAL_CONSTELLATIONS,
  SeasonalAsterism,
} from "../astronomy/seasonalStars";

/**
 * 星座（アプリに出てくる27星座）と、星座の形（春・夏・冬の大三角、秋の四辺形、春の大曲線、冬のダイヤモンド）の
 * 解説データです。名前の札や星座の線を押したときに開く解説カードに使います。
 *
 * 星座の面積と順位は、国際天文学連合（IAU）の88星座の境界（デルポルト 1930）にもとづく値です。
 * 星座の形の大きさ（角度）は、アプリが使っている J2000.0 の赤経・赤緯から計算した値です。
 */

/** 季節の星座（seasonalStars.ts）の ID */
type SeasonalConstellationKey =
  | "ursaMajor"
  | "bootes"
  | "lyra"
  | "aquila"
  | "cygnus"
  | "pegasus"
  | "andromeda"
  | "piscisAustrinus"
  | "orion"
  | "canisMajor"
  | "canisMinor"
  | "auriga";

/** アプリに出てくる星座の ID（黄道13星座・季節の12星座・カシオペヤ座・みなみじゅうじ座） */
export type ConstellationKey =
  | ZodiacConstellationId
  | SeasonalConstellationKey
  | "cassiopeia"
  | "crux";

/** 星座の解説カード ID（例："constellationOrion"） */
export type ConstellationCardId =
  | "constellationPisces"
  | "constellationAries"
  | "constellationTaurus"
  | "constellationGemini"
  | "constellationCancer"
  | "constellationLeo"
  | "constellationVirgo"
  | "constellationLibra"
  | "constellationScorpius"
  | "constellationOphiuchus"
  | "constellationSagittarius"
  | "constellationCapricornus"
  | "constellationAquarius"
  | "constellationUrsaMajor"
  | "constellationBootes"
  | "constellationLyra"
  | "constellationAquila"
  | "constellationCygnus"
  | "constellationPegasus"
  | "constellationAndromeda"
  | "constellationPiscisAustrinus"
  | "constellationOrion"
  | "constellationCanisMajor"
  | "constellationCanisMinor"
  | "constellationAuriga"
  | "constellationCassiopeia"
  | "constellationCrux";

/** 星座の形の解説カード ID（seasonalStars.ts の星座の形の ID と同じ） */
export type AsterismCardId = SeasonalAsterism["id"];

/** 星座の ID から、解説カードの ID を作ります（例："orion" → "constellationOrion"）。 */
export function getConstellationCardId(key: ConstellationKey): ConstellationCardId {
  const head = key.charAt(0).toUpperCase();
  return `constellation${head}${key.slice(1)}` as ConstellationCardId;
}

/** 1つの星座の手書きの説明です。 */
interface ConstellationText {
  key: ConstellationKey;
  nameJa: string;
  nameEn: string;
  /** 学名（略号） */
  latinName: string;
  /** IAU の面積（平方度） */
  areaSqDeg: number;
  /** 88星座の中での面積の順位 */
  areaRank: number;
  /** 3つ目の事実（黄道の星座は太陽が通る時期、ほかは見ごろなど） */
  thirdFact: { labelJa: string; value: string };
  categoryJa: string;
  categoryEn: string;
  descriptionJa: string;
  descriptionEn: string;
}

/** 黄道の星座の「太陽が通る時期」（zodiac.ts の dateRangeJa と同じ値）を返します。 */
function sunPassage(id: ZodiacConstellationId): { labelJa: string; value: string } {
  const c = ZODIAC_CONSTELLATIONS.find((z) => z.id === id);
  return { labelJa: "太陽が通る時期", value: c ? c.dateRangeJa : "-" };
}

const CONSTELLATION_TEXTS: ConstellationText[] = [
  // === 黄道13星座 ===
  {
    key: "pisces",
    nameJa: "うお座",
    nameEn: "Pisces",
    latinName: "Pisces（Psc）",
    areaSqDeg: 889,
    areaRank: 14,
    thirdFact: sunPassage("pisces"),
    categoryJa: "黄道12星座（秋）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "2匹の魚がひもで結ばれた姿をあらわす、秋の黄道の星座です。明るい星は少ないものの、とても広い星座です。地球の自転軸がゆっくり首ふり運動（歳差運動）をしているため、今では春分の日に太陽がいる位置（春分点）がうお座の中にあります。",
    descriptionEn:
      "Pisces shows two fish tied together with a cord. It does not have many bright stars, but it covers a large part of the sky. Because the Earth's axis slowly wobbles, the point where the Sun is on the first day of spring is now in Pisces.",
  },
  {
    key: "aries",
    nameJa: "おひつじ座",
    nameEn: "Aries",
    latinName: "Aries（Ari）",
    areaSqDeg: 441,
    areaRank: 39,
    thirdFact: sunPassage("aries"),
    categoryJa: "黄道12星座（秋）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話に出てくる、金色の毛を持つ羊の姿をあらわす星座です。目立つのはハマルとシェラタンくらいの小さな星座ですが、約2,000年前には春分点がこの星座にあったため、黄道12星座の最初の星座とされてきました。",
    descriptionEn:
      "Aries is the ram with golden wool from Greek myths. It is a small constellation with only a few bright stars, such as Hamal and Sheratan. About 2,000 years ago, the Sun was in Aries at the start of spring, so it became the first sign of the zodiac.",
  },
  {
    key: "taurus",
    nameJa: "おうし座",
    nameEn: "Taurus",
    latinName: "Taurus（Tau）",
    areaSqDeg: 797,
    areaRank: 17,
    thirdFact: sunPassage("taurus"),
    categoryJa: "黄道12星座（冬）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話で、大神ゼウスが姿を変えた白い牛をあらわす冬の星座です。赤いアルデバランが牛の目にあたり、顔のV字形をヒアデス星団が、肩のあたりを「すばる（プレアデス星団）」が飾ります。",
    descriptionEn:
      "Taurus is the bull from Greek myths. The red star Aldebaran is the bull's eye. The Hyades star cluster makes the V shape of its face, and the Pleiades (Subaru) shine on its shoulder.",
  },
  {
    key: "gemini",
    nameJa: "ふたご座",
    nameEn: "Gemini",
    latinName: "Gemini（Gem）",
    areaSqDeg: 514,
    areaRank: 30,
    thirdFact: sunPassage("gemini"),
    categoryJa: "黄道12星座（冬）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話の双子の兄弟、カストルとポルックスをあらわす冬の星座です。2人の頭にあたる明るい2つの星が仲よく並んでいるのが目印です。毎年12月中ごろには「ふたご座流星群」が見られます。",
    descriptionEn:
      "Gemini shows the twin brothers Castor and Pollux from Greek myths. Two bright stars, the heads of the twins, shine side by side. Every year in mid-December, you can see the Geminid meteor shower.",
  },
  {
    key: "cancer",
    nameJa: "かに座",
    nameEn: "Cancer",
    latinName: "Cancer（Cnc）",
    areaSqDeg: 506,
    areaRank: 31,
    thirdFact: sunPassage("cancer"),
    categoryJa: "黄道12星座（春）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話で、英雄ヘラクレスと戦った大きなかにをあらわす春の星座です。明るい星は少ないですが、甲羅の中には肉眼でもぼんやり見える「プレセペ星団（M44）」があります。",
    descriptionEn:
      "Cancer is the big crab that fought the hero Heracles in Greek myths. It has no very bright stars, but in its shell there is the Beehive Cluster (M44), which you can see as a faint cloud with your eyes.",
  },
  {
    key: "leo",
    nameJa: "しし座",
    nameEn: "Leo",
    latinName: "Leo（Leo）",
    areaSqDeg: 947,
    areaRank: 12,
    thirdFact: sunPassage("leo"),
    categoryJa: "黄道12星座（春）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話で、英雄ヘラクレスが退治したライオンをあらわす春の星座です。頭を作る「？」を裏返したような星の並びは「ししの大がま」と呼ばれ、心臓には1等星レグルスが輝きます。11月中ごろには「しし座流星群」が見られます。",
    descriptionEn:
      "Leo is the lion that the hero Heracles fought in Greek myths. The lion's head is a line of stars shaped like a backward question mark, called the Sickle. The bright star Regulus is its heart. In mid-November, you can see the Leonid meteor shower.",
  },
  {
    key: "virgo",
    nameJa: "おとめ座",
    nameEn: "Virgo",
    latinName: "Virgo（Vir）",
    areaSqDeg: 1294,
    areaRank: 2,
    thirdFact: sunPassage("virgo"),
    categoryJa: "黄道12星座（春）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "麦の穂を持つ女神の姿をあらわす春の星座で、全天で2番目に大きな星座です。1等星スピカが、女神の持つ麦の穂にあたります。星座の中には、たくさんの銀河が集まった「おとめ座銀河団」があります。",
    descriptionEn:
      "Virgo is a goddess holding an ear of wheat. It is the second largest constellation in the sky. The bright star Spica is the ear of wheat. In Virgo, there is the Virgo Cluster, a big group of many galaxies.",
  },
  {
    key: "libra",
    nameJa: "てんびん座",
    nameEn: "Libra",
    latinName: "Libra（Lib）",
    areaSqDeg: 538,
    areaRank: 29,
    thirdFact: sunPassage("libra"),
    categoryJa: "黄道12星座（春〜夏）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "正義の女神が持つ天秤をあらわす星座です。黄道12星座の中で、動物や人ではなく道具をあらわすただひとつの星座です。昔はさそり座のはさみの一部とされていたため、星の名前に「はさみ」という言葉が残っています。",
    descriptionEn:
      "Libra is the scales held by the goddess of justice. It is the only zodiac constellation that is a tool, not an animal or a person. Long ago, its stars were part of the scorpion's claws, so their names still mean 'claw.'",
  },
  {
    key: "scorpius",
    nameJa: "さそり座",
    nameEn: "Scorpius",
    latinName: "Scorpius（Sco）",
    areaSqDeg: 497,
    areaRank: 33,
    thirdFact: sunPassage("scorpius"),
    categoryJa: "黄道12星座（夏）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "ギリシャ神話で、狩人オリオンを刺したさそりをあらわす夏の星座です。赤い1等星アンタレスが心臓にあたり、S字に曲がった尾が南の空の低いところに横たわります。オリオン座とは空の反対側にあり、2つの星座が同時に夜空に並ぶことはほとんどありません。",
    descriptionEn:
      "Scorpius is the scorpion that stung the hunter Orion in Greek myths. The red star Antares is its heart, and its S-shaped tail lies low in the southern sky. It is on the other side of the sky from Orion, so you can almost never see both of them at the same time.",
  },
  {
    key: "ophiuchus",
    nameJa: "へびつかい座",
    nameEn: "Ophiuchus",
    latinName: "Ophiuchus（Oph）",
    areaSqDeg: 948,
    areaRank: 11,
    thirdFact: sunPassage("ophiuchus"),
    categoryJa: "黄道を横切る13番目の星座（夏）",
    categoryEn: "The 13th Constellation on the Ecliptic",
    descriptionJa:
      "ギリシャ神話の名医アスクレピオスが、大きなへびをつかむ姿をあらわす夏の星座です。黄道がこの星座の中を通っているため、太陽は毎年11月末から12月中ごろにかけて、さそり座ではなくこの星座の中を通ります。そのため「13番目の黄道星座」と呼ばれることがあります。",
    descriptionEn:
      "Ophiuchus is the great doctor Asclepius holding a big snake in Greek myths. The path of the Sun goes through this constellation, so the Sun is in Ophiuchus from late November to mid-December. That is why it is sometimes called the 13th zodiac constellation.",
  },
  {
    key: "sagittarius",
    nameJa: "いて座",
    nameEn: "Sagittarius",
    latinName: "Sagittarius（Sgr）",
    areaSqDeg: 867,
    areaRank: 15,
    thirdFact: sunPassage("sagittarius"),
    categoryJa: "黄道12星座（夏）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "上半身が人、下半身が馬のケンタウロスが弓矢を構える姿をあらわす夏の星座です。明るい星がティーポットの形に並び、そのうち6つは「南斗六星」と呼ばれます。天の川銀河の中心は、いて座の方向にあります。",
    descriptionEn:
      "Sagittarius is a centaur, half human and half horse, with a bow and arrow. Its bright stars make the shape of a teapot, and six of them are called the Southern Dipper. The center of our Milky Way is in the direction of Sagittarius.",
  },
  {
    key: "capricornus",
    nameJa: "やぎ座",
    nameEn: "Capricornus",
    latinName: "Capricornus（Cap）",
    areaSqDeg: 414,
    areaRank: 40,
    thirdFact: sunPassage("capricornus"),
    categoryJa: "黄道12星座（秋）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "上半身がやぎ、下半身が魚というふしぎな姿をあらわす秋の星座です。ギリシャ神話では、怪物から逃げるために姿を変えた牧神パーンだといわれます。星を結ぶと、全体が大きな逆三角形になります。",
    descriptionEn:
      "Capricornus is a strange animal that is a goat on top and a fish on the bottom. In Greek myths, it is the god Pan, who changed his shape to run away from a monster. Its stars make a big upside-down triangle.",
  },
  {
    key: "aquarius",
    nameJa: "みずがめ座",
    nameEn: "Aquarius",
    latinName: "Aquarius（Aqr）",
    areaSqDeg: 980,
    areaRank: 10,
    thirdFact: sunPassage("aquarius"),
    categoryJa: "黄道12星座（秋）",
    categoryEn: "Zodiac Constellation",
    descriptionJa:
      "水がめから水を注ぐ少年の姿をあらわす秋の星座です。ギリシャ神話では、大神ゼウスに仕えた少年ガニメデスだといわれます。水がめの口は、Y字形に並ぶ小さな星で表されます。",
    descriptionEn:
      "Aquarius is a boy pouring water from a jar. In Greek myths, he is Ganymede, who served the god Zeus. The mouth of the jar is a small Y-shaped group of stars.",
  },
  // === 季節の星座 ===
  {
    key: "ursaMajor",
    nameJa: "おおぐま座（北斗七星）",
    nameEn: "Ursa Major (Big Dipper)",
    latinName: "Ursa Major（UMa）",
    areaSqDeg: 1280,
    areaRank: 3,
    thirdFact: { labelJa: "見ごろ", value: "春（5月の21時ごろ・北の空）" },
    categoryJa: "星座（春・北の空）",
    categoryEn: "Constellation (Spring)",
    descriptionJa:
      "北の空の大きな熊の姿をあらわす星座で、全天で3番目に大きな星座です。熊の背中からしっぽにかけての7つの星が、ひしゃくの形をした「北斗七星」です。ひしゃくの先の2つの星を結んだ線をのばすと、北極星が見つかります。",
    descriptionEn:
      "Ursa Major is the Great Bear in the northern sky, and it is the third largest constellation. Seven stars on the bear's back and tail make the Big Dipper. If you follow the line of the two stars at the front of the dipper, you can find Polaris.",
  },
  {
    key: "bootes",
    nameJa: "うしかい座",
    nameEn: "Boötes",
    latinName: "Boötes（Boo）",
    areaSqDeg: 907,
    areaRank: 13,
    thirdFact: { labelJa: "見ごろ", value: "春（5月の21時ごろ）" },
    categoryJa: "星座（春）",
    categoryEn: "Constellation (Spring)",
    descriptionJa:
      "牛飼い（熊の番人ともいわれます）の姿をあらわす春の星座です。北斗七星の柄のカーブをそのままのばすと、オレンジ色に輝く1等星アークトゥルスに着きます。",
    descriptionEn:
      "Boötes is the herdsman, who is also said to be the keeper of the bears. If you follow the curve of the Big Dipper's handle, you reach Arcturus, the bright orange star of Boötes.",
  },
  {
    key: "lyra",
    nameJa: "こと座",
    nameEn: "Lyra",
    latinName: "Lyra（Lyr）",
    areaSqDeg: 286,
    areaRank: 52,
    thirdFact: { labelJa: "見ごろ", value: "夏（8月の21時ごろ）" },
    categoryJa: "星座（夏）",
    categoryEn: "Constellation (Summer)",
    descriptionJa:
      "ギリシャ神話の音楽の名人オルフェウスが弾いた竪琴をあらわす夏の星座です。小さな星座ですが、1等星ベガ（織姫星）が明るく輝きます。",
    descriptionEn:
      "Lyra is the harp played by Orpheus, a great musician in Greek myths. It is a small constellation, but the bright star Vega (Orihime) shines in it.",
  },
  {
    key: "aquila",
    nameJa: "わし座",
    nameEn: "Aquila",
    latinName: "Aquila（Aql）",
    areaSqDeg: 652,
    areaRank: 22,
    thirdFact: { labelJa: "見ごろ", value: "夏（8月の21時ごろ）" },
    categoryJa: "星座（夏）",
    categoryEn: "Constellation (Summer)",
    descriptionJa:
      "ギリシャ神話で、大神ゼウスの使いとなった鷲をあらわす夏の星座です。1等星アルタイル（彦星）の両側に星が1つずつ並んでいるのが目印で、天の川をはさんでベガと向き合っています。",
    descriptionEn:
      "Aquila is the eagle that worked for the god Zeus in Greek myths. You can find it by the bright star Altair (Hikoboshi) with one star on each side. Altair faces Vega across the Milky Way.",
  },
  {
    key: "cygnus",
    nameJa: "はくちょう座",
    nameEn: "Cygnus",
    latinName: "Cygnus（Cyg）",
    areaSqDeg: 804,
    areaRank: 16,
    thirdFact: { labelJa: "見ごろ", value: "夏（8月の21時ごろ）" },
    categoryJa: "星座（夏）",
    categoryEn: "Constellation (Summer)",
    descriptionJa:
      "天の川の上を、翼を広げて飛ぶ白鳥の姿をあらわす夏の星座です。大きな十字の形に星が並ぶため、「北十字星」とも呼ばれます。尾には1等星デネブ、くちばしには二重星アルビレオが輝きます。",
    descriptionEn:
      "Cygnus is a swan flying over the Milky Way with its wings open. Its stars make a big cross, so it is also called the Northern Cross. The bright star Deneb is its tail, and the double star Albireo is its head.",
  },
  {
    key: "pegasus",
    nameJa: "ペガスス座",
    nameEn: "Pegasus",
    latinName: "Pegasus（Peg）",
    areaSqDeg: 1121,
    areaRank: 7,
    thirdFact: { labelJa: "見ごろ", value: "秋（11月の21時ごろ）" },
    categoryJa: "星座（秋）",
    categoryEn: "Constellation (Autumn)",
    descriptionJa:
      "ギリシャ神話の、翼を持つ天馬ペガサスをあらわす秋の星座です。胴体にあたる4つの星（1つはアンドロメダ座の星）が作る大きな四角形は「秋の四辺形」と呼ばれ、秋の星空を探す目印になります。",
    descriptionEn:
      "Pegasus is the flying horse with wings from Greek myths. Four stars of its body (one of them belongs to Andromeda) make a big square called the Great Square of Pegasus. It helps us find other autumn constellations.",
  },
  {
    key: "andromeda",
    nameJa: "アンドロメダ座",
    nameEn: "Andromeda",
    latinName: "Andromeda（And）",
    areaSqDeg: 722,
    areaRank: 19,
    thirdFact: { labelJa: "見ごろ", value: "秋（11月の21時ごろ）" },
    categoryJa: "星座（秋）",
    categoryEn: "Constellation (Autumn)",
    descriptionJa:
      "ギリシャ神話で、カシオペヤ王妃の娘アンドロメダ姫の姿をあらわす秋の星座です。秋の四辺形の北東の角から、星が北東へ連なります。星座の中には、肉眼で見えるもっとも遠い天体のひとつ「アンドロメダ銀河（M31）」があります。",
    descriptionEn:
      "Andromeda is the princess, the daughter of Queen Cassiopeia, in Greek myths. Its stars go northeast from a corner of the Great Square of Pegasus. In this constellation is the Andromeda Galaxy (M31), one of the farthest things you can see with your eyes.",
  },
  {
    key: "piscisAustrinus",
    nameJa: "みなみのうお座",
    nameEn: "Piscis Austrinus",
    latinName: "Piscis Austrinus（PsA）",
    areaSqDeg: 245,
    areaRank: 60,
    thirdFact: { labelJa: "見ごろ", value: "秋（11月の21時ごろ・南の低い空）" },
    categoryJa: "星座（秋）",
    categoryEn: "Constellation (Autumn)",
    descriptionJa:
      "南の空を泳ぐ魚をあらわす秋の星座です。明るい星が少ない秋の夜空で、魚の口にあたる1等星フォーマルハウトがひとつだけ目立って輝きます。",
    descriptionEn:
      "Piscis Austrinus is the Southern Fish. In the autumn sky, which has few bright stars, its bright star Fomalhaut shines alone at the mouth of the fish.",
  },
  {
    key: "orion",
    nameJa: "オリオン座",
    nameEn: "Orion",
    latinName: "Orion（Ori）",
    areaSqDeg: 594,
    areaRank: 26,
    thirdFact: { labelJa: "見ごろ", value: "冬（2月の21時ごろ）" },
    categoryJa: "星座（冬）",
    categoryEn: "Constellation (Winter)",
    descriptionJa:
      "ギリシャ神話の狩人オリオンの姿をあらわす冬の星座です。赤いベテルギウスと青白いリゲルの2つの1等星があり、真ん中には「三つ星」が並びます。三つ星の南には、星が生まれている「オリオン大星雲（M42）」があります。",
    descriptionEn:
      "Orion is the hunter from Greek myths. It has two bright stars, red Betelgeuse and blue-white Rigel, and three stars in a row in the middle called Orion's Belt. South of the Belt is the Orion Nebula (M42), where new stars are being born.",
  },
  {
    key: "canisMajor",
    nameJa: "おおいぬ座",
    nameEn: "Canis Major",
    latinName: "Canis Major（CMa）",
    areaSqDeg: 380,
    areaRank: 43,
    thirdFact: { labelJa: "見ごろ", value: "冬（2月の21時ごろ）" },
    categoryJa: "星座（冬）",
    categoryEn: "Constellation (Winter)",
    descriptionJa:
      "狩人オリオンが連れている大きな犬の姿をあらわす冬の星座です。犬の口もとには、太陽をのぞいて夜空でいちばん明るい星シリウスが輝きます。",
    descriptionEn:
      "Canis Major is the big dog of the hunter Orion. At the dog's mouth shines Sirius, the brightest star in the night sky.",
  },
  {
    key: "canisMinor",
    nameJa: "こいぬ座",
    nameEn: "Canis Minor",
    latinName: "Canis Minor（CMi）",
    areaSqDeg: 183,
    areaRank: 71,
    thirdFact: { labelJa: "見ごろ", value: "冬（2月の21時ごろ）" },
    categoryJa: "星座（冬）",
    categoryEn: "Constellation (Winter)",
    descriptionJa:
      "狩人オリオンが連れている小さな犬の姿をあらわす冬の星座です。1等星プロキオンとゴメイサの2つの星を結ぶだけの、とても簡単な形の星座です。",
    descriptionEn:
      "Canis Minor is the small dog of the hunter Orion. It is a very simple constellation made by a line between two stars, Procyon and Gomeisa.",
  },
  {
    key: "auriga",
    nameJa: "ぎょしゃ座",
    nameEn: "Auriga",
    latinName: "Auriga（Aur）",
    areaSqDeg: 657,
    areaRank: 21,
    thirdFact: { labelJa: "見ごろ", value: "冬（2月の21時ごろ・高い空）" },
    categoryJa: "星座（冬）",
    categoryEn: "Constellation (Winter)",
    descriptionJa:
      "馬車を操る御者（ぎょしゃ）の姿をあらわす冬の星座です。1等星カペラを含む5つの星が大きな五角形を作り、冬の夜空の高いところに見えます。五角形の一角のエルナトは、おうし座の星です。",
    descriptionEn:
      "Auriga is the charioteer, a man who drives a horse cart. Five stars, including the bright star Capella, make a big pentagon high in the winter sky. One corner of the pentagon, Elnath, is a star of Taurus.",
  },
  // === 北の空と南の空 ===
  {
    key: "cassiopeia",
    nameJa: "カシオペヤ座",
    nameEn: "Cassiopeia",
    latinName: "Cassiopeia（Cas）",
    areaSqDeg: 598,
    areaRank: 25,
    thirdFact: { labelJa: "見ごろ", value: "一年中（北の空・秋に高い）" },
    categoryJa: "星座（北の空・周極星座）",
    categoryEn: "Constellation (Northern Sky)",
    descriptionJa:
      "ギリシャ神話のエチオピアの王妃カシオペヤをあらわす星座で、5つの星がW字（またはM字）に並びます。北極星の近くにあり、東京では一年中地平線の下にしずみません。北極星をはさんで北斗七星の反対側にあるので、北極星を探す目印にもなります。学術用語では「カシオペヤ座」と書き、「カシオペア座」とも呼ばれます。",
    descriptionEn:
      "Cassiopeia is the queen of Ethiopia in Greek myths. Its five stars make a W (or M) shape. It is near Polaris, so from Tokyo it never sets below the horizon. It is on the other side of Polaris from the Big Dipper, so it also helps us find Polaris.",
  },
  {
    key: "crux",
    nameJa: "みなみじゅうじ座（南十字星）",
    nameEn: "Crux (Southern Cross)",
    latinName: "Crux（Cru）",
    areaSqDeg: 68,
    areaRank: 88,
    thirdFact: { labelJa: "見える場所", value: "南半球（日本では沖縄など南の地域）" },
    categoryJa: "星座（南の空・88星座で最小）",
    categoryEn: "Constellation (Southern Sky)",
    descriptionJa:
      "4つの明るい星が十字の形に並ぶ、全天88星座の中でいちばん小さな星座です。オーストラリアやニュージーランド、ブラジルなど、南半球の国々の国旗にも描かれています。日本からは、沖縄など南の地域でなければ全体を見ることができません。",
    descriptionEn:
      "Crux, the Southern Cross, is four bright stars in the shape of a cross. It is the smallest of the 88 constellations. It is on the flags of some countries in the Southern Hemisphere, such as Australia, New Zealand, and Brazil. In Japan, you can see the whole cross only from southern places like Okinawa.",
  },
];

/** 星座線の色（3D 画面の線の色と同じにします） */
function getConstellationLineColor(key: ConstellationKey): string {
  if (key === "ophiuchus") return "#d8b4fe";
  if (key === "cassiopeia" || key === "crux") return "#38bdf8";
  return "#7dd3fc";
}

/** 星座の星と線（説明カードの絵に使います）を返します。 */
function getConstellationFigure(key: ConstellationKey): SkyFigure {
  let stars: ZodiacStarPoint[] = [];
  let edges: Array<[number, number]> = [];
  if (key === "cassiopeia") {
    stars = CASSIOPEIA_CONSTELLATION.stars;
    edges = CASSIOPEIA_CONSTELLATION.edges;
  } else if (key === "crux") {
    stars = SOUTHERN_CROSS_CONSTELLATION.stars;
    edges = SOUTHERN_CROSS_CONSTELLATION.edges;
  } else {
    const zodiac = ZODIAC_CONSTELLATIONS.find((c) => c.id === key);
    const seasonal = SEASONAL_CONSTELLATIONS.find((c) => c.id === key);
    if (zodiac) {
      stars = zodiac.stars;
      edges = zodiac.edges;
    } else if (seasonal) {
      stars = seasonal.stars;
      edges = seasonal.edges;
    }
  }
  const points: SkyFigure["points"] = [];
  for (const s of stars) {
    points.push({ lonDeg: s.lonDeg, latDeg: s.latDeg, mag: s.mag });
  }
  return { points, edges, lineColor: getConstellationLineColor(key) };
}

/** 1つの星座の解説カードのデータを作ります。 */
function buildConstellationProfile(text: ConstellationText): CelestialBodyProfile {
  return {
    id: getConstellationCardId(text.key),
    nameJa: text.nameJa,
    nameEn: text.nameEn,
    categoryJa: text.categoryJa,
    categoryEn: text.categoryEn,
    symbol: "✧",
    accentColor: getConstellationLineColor(text.key),
    facts: [
      { labelJa: "学名（略号）", value: text.latinName },
      {
        labelJa: "面積（88星座中の順位）",
        value: `約${text.areaSqDeg.toLocaleString("en-US")}平方度（${text.areaRank}位）`,
      },
      text.thirdFact,
    ],
    descriptionJa: text.descriptionJa,
    descriptionEn: text.descriptionEn,
    cardKind: "constellation",
    figure: getConstellationFigure(text.key),
  };
}

/** 1つの星座の形の手書きの説明です。 */
interface AsterismText {
  id: AsterismCardId;
  nameJa: string;
  nameEn: string;
  starsJa: string;
  sizeJa: string;
  bestJa: string;
  descriptionJa: string;
  descriptionEn: string;
}

const ASTERISM_TEXTS: AsterismText[] = [
  {
    id: "springTriangle",
    nameJa: "春の大三角",
    nameEn: "Spring Triangle",
    starsJa: "アークトゥルス・スピカ・デネボラ",
    sizeJa: "1辺 約33〜35°",
    bestJa: "春（5月の21時ごろ）",
    descriptionJa:
      "うしかい座のアークトゥルス、おとめ座のスピカ、しし座のデネボラの3つの星を結んでできる大きな三角形です。春の夜、南の空の高いところに見えます。北斗七星から続く「春の大曲線」とあわせて、春の星座を探す目印になります。",
    descriptionEn:
      "The Spring Triangle is a big triangle made by three stars: Arcturus in Boötes, Spica in Virgo, and Denebola in Leo. On spring nights, it is high in the southern sky. Together with the Spring Curve, it helps us find the spring constellations.",
  },
  {
    id: "springCurve",
    nameJa: "春の大曲線",
    nameEn: "Spring Curve (Arc to Arcturus)",
    starsJa: "北斗七星の柄・アークトゥルス・スピカ",
    sizeJa: "長さ 約74°（柄からスピカまで）",
    bestJa: "春（5月の21時ごろ）",
    descriptionJa:
      "北斗七星の柄のカーブを、そのまま南へのばしてできる大きな弧です。北斗七星の柄から、オレンジ色のアークトゥルス、青白いスピカへとたどれます。春の星空を案内してくれる、いちばんの道しるべです。",
    descriptionEn:
      "The Spring Curve is a big arc that you get when you follow the curve of the Big Dipper's handle to the south. It takes you from the handle to orange Arcturus and then to blue-white Spica. It is the best guide to the spring sky.",
  },
  {
    id: "summerTriangle",
    nameJa: "夏の大三角",
    nameEn: "Summer Triangle",
    starsJa: "ベガ・アルタイル・デネブ",
    sizeJa: "1辺 約24〜38°",
    bestJa: "夏（8月の21時ごろ・頭の上）",
    descriptionJa:
      "こと座のベガ（織姫星）、わし座のアルタイル（彦星）、はくちょう座のデネブの3つの1等星を結んでできる大きな三角形です。夏の夜、頭の上の高いところに見え、暗い場所ではその中を天の川が流れます。地球からはひとつの三角形に見えますが、デネブだけがほかの2つよりずっと遠くにあります。",
    descriptionEn:
      "The Summer Triangle is a big triangle made by three bright stars: Vega in Lyra, Altair in Aquila, and Deneb in Cygnus. On summer nights, it is high above your head, and in a dark place you can see the Milky Way flowing through it. It looks flat, but Deneb is much farther away than the other two stars.",
  },
  {
    id: "autumnSquare",
    nameJa: "秋の四辺形",
    nameEn: "Great Square of Pegasus",
    starsJa: "マルカブ・シェアト・アルフェラッツ・アルゲニブ",
    sizeJa: "1辺 約13〜17°",
    bestJa: "秋（11月の21時ごろ）",
    descriptionJa:
      "ペガスス座の3つの星と、アンドロメダ座のアルフェラッツの4つの星が作る大きな四角形で、「ペガススの大四辺形」とも呼ばれます。明るい星が少ない秋の夜空の目印で、ここから秋の星座をたどれます。",
    descriptionEn:
      "The Great Square of Pegasus is a big square made by three stars of Pegasus and Alpheratz of Andromeda. The autumn sky has few bright stars, so this square is a good guide for finding the autumn constellations.",
  },
  {
    id: "winterTriangle",
    nameJa: "冬の大三角",
    nameEn: "Winter Triangle",
    starsJa: "ベテルギウス・シリウス・プロキオン",
    sizeJa: "1辺 約26〜27°（ほぼ正三角形）",
    bestJa: "冬（2月の21時ごろ）",
    descriptionJa:
      "オリオン座のベテルギウス、おおいぬ座のシリウス、こいぬ座のプロキオンの3つの1等星を結んでできる、ほぼ正三角形の形です。冬の夜、南の空に見え、冬の星座を探す出発点になります。",
    descriptionEn:
      "The Winter Triangle is made by three bright stars: Betelgeuse in Orion, Sirius in Canis Major, and Procyon in Canis Minor. Its three sides are almost the same length. On winter nights, it is in the southern sky, and it is a good starting point for finding the winter constellations.",
  },
  {
    id: "winterDiamond",
    nameJa: "冬のダイヤモンド",
    nameEn: "Winter Hexagon",
    starsJa: "シリウス・プロキオン・ポルックス・カペラ・アルデバラン・リゲル",
    sizeJa: "1辺 約23〜34°",
    bestJa: "冬（2月の21時ごろ）",
    descriptionJa:
      "シリウス・プロキオン・ポルックス・カペラ・アルデバラン・リゲルの6つの明るい星を結んでできる大きな六角形で、「冬の大六角形」とも呼ばれます。冬の夜空にはこれだけ多くの明るい星が集まっていて、一年でいちばん星空がにぎやかな季節です。",
    descriptionEn:
      "The Winter Hexagon is a big six-sided shape made by six bright stars: Sirius, Procyon, Pollux, Capella, Aldebaran, and Rigel. So many bright stars gather in the winter sky that it is the most colorful season for stargazing.",
  },
];

/** 星座の形の頂点と辺（説明カードの絵に使います）を返します。 */
function getAsterismFigure(id: AsterismCardId): SkyFigure {
  const ast = SEASONAL_ASTERISMS.find((a) => a.id === id);
  const points: SkyFigure["points"] = [];
  if (!ast) {
    return { points, edges: [], lineColor: "#e2e8f0" };
  }
  for (const v of ast.vertices) {
    // 主要な1等星はその等級、それ以外（北斗七星の柄など）は2等星として描きます
    const mag = v.starId ? FEATURED_STAR_MAP[v.starId].mag : 2.0;
    points.push({ lonDeg: v.lonDeg, latDeg: v.latDeg, mag });
  }
  return { points, edges: ast.edges, lineColor: ast.colorHex };
}

/** 1つの星座の形の解説カードのデータを作ります。 */
function buildAsterismProfile(text: AsterismText): CelestialBodyProfile {
  const figure = getAsterismFigure(text.id);
  return {
    id: text.id,
    nameJa: text.nameJa,
    nameEn: text.nameEn,
    categoryJa: "星座の形（アステリズム）",
    categoryEn: "Asterism",
    symbol: "△",
    accentColor: figure.lineColor,
    facts: [
      { labelJa: "作る星", value: text.starsJa },
      { labelJa: "大きさ（角度）", value: text.sizeJa },
      { labelJa: "見ごろ", value: text.bestJa },
    ],
    descriptionJa: text.descriptionJa,
    descriptionEn: text.descriptionEn,
    cardKind: "asterism",
    figure,
  };
}

/** 星座の解説カードを、ID ごとにまとめたものです。 */
export const CONSTELLATION_PROFILES = (() => {
  const result = {} as Record<ConstellationCardId, CelestialBodyProfile>;
  for (const text of CONSTELLATION_TEXTS) {
    result[getConstellationCardId(text.key)] = buildConstellationProfile(text);
  }
  return result;
})();

/** 星座の形の解説カードを、ID ごとにまとめたものです。 */
export const ASTERISM_PROFILES = (() => {
  const result = {} as Record<AsterismCardId, CelestialBodyProfile>;
  for (const text of ASTERISM_TEXTS) {
    result[text.id] = buildAsterismProfile(text);
  }
  return result;
})();
