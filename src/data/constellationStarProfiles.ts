import type { CelestialBodyFact, CelestialBodyProfile } from "./celestialBodies";

/**
 * 星座の星（北極星・北斗七星・黄道の星・四季の星座の星・カシオペヤ座・南十字星）と、
 * すばる（プレアデス星団）の解説データです。
 *
 * 数値の出どころ（どこで確かめたか）：
 * - 距離（光年）：ESA の Hipparcos カタログ新整約版（van Leeuwen 2007）の年周視差から計算
 *   （1光年あたり 3261.56 ÷ 年周視差[ミリ秒角]）。ESA Gaia アーカイブで取得
 * - 見かけの等級：ESA の Hipparcos カタログ（1997）の V 等級
 * - スペクトル型：SIMBAD（ストラスブール天文データセンター）の値を、初心者向けに簡単にしたもの
 * - 距離の誤差が大きい星（年周視差の誤差が 12% 以上）は「誤差が大きい」と書きます
 * - Gaia の値と Hipparcos の値が 15% より大きくちがう星は、2つの値の範囲で書きます
 */

/** 1つの星の、照合した値と説明文です。 */
export interface ConstellationStarSpec {
  /** 解説カードの ID（星座データの bodyId と同じ文字列） */
  id: string;
  /** 日本語の名前（固有名がない星は「うしかい座δ星」のようなバイエル符号） */
  nameJa: string;
  /** 英語の名前 */
  nameEn: string;
  /** バイエル符号（日本語） */
  designationJa: string;
  /** バイエル符号（英語） */
  designationEn: string;
  /** 所属する星座（IAU の88星座） */
  constellationJa: string;
  /** Hipparcos カタログの番号（照合に使った番号） */
  hip: number;
  /** 見かけの等級（Hipparcos の V 等級） */
  vMag: number;
  /** スペクトル型（星の種類と温度を表す記号を簡単にしたもの） */
  spectralType: string;
  /** 地球からの距離（光年・Hipparcos 新整約版の年周視差から計算して丸めた値） */
  distanceLy: number;
  /** Hipparcos と Gaia の距離が大きくちがうときの範囲（光年） */
  distanceRangeLy?: readonly [number, number];
  /** 年周視差の誤差が大きく、距離がはっきりしないとき true */
  distanceUncertain?: boolean;
  /** 日本語の説明文 */
  descriptionJa: string;
  /** 中学英語レベルの説明文 */
  descriptionEn: string;
}

/** 星座の星の一覧です（説明カードを開ける星）。並びは星座ごとです。 */
export const CONSTELLATION_STAR_SPECS = [
  {
    id: "betaPsc",
    nameJa: "うお座β星",
    nameEn: "Beta Piscium",
    designationJa: "うお座β星",
    designationEn: "Beta Piscium",
    constellationJa: "うお座",
    hip: 113889,
    vMag: 4.48,
    spectralType: "B6V",
    distanceLy: 410,
    descriptionJa:
      "うお座の西の魚の輪（サークレット）を作る星のひとつです。表面温度の高い青白い星で、まわりにガスの円盤を持つ「Be星」の仲間です。",
    descriptionEn:
      "Beta Piscium is one of the stars in the ring of the western fish of Pisces. It is a hot blue-white star with a disk of gas around it.",
  },
  {
    id: "gammaPsc",
    nameJa: "うお座γ星",
    nameEn: "Gamma Piscium",
    designationJa: "うお座γ星",
    designationEn: "Gamma Piscium",
    constellationJa: "うお座",
    hip: 114971,
    vMag: 3.7,
    spectralType: "G9III",
    distanceLy: 140,
    descriptionJa:
      "うお座の西の魚の輪を作る星の中で、いちばん明るい星です。太陽より大きくふくらんだ巨星です。",
    descriptionEn:
      "Gamma Piscium is the brightest star in the ring of the western fish of Pisces. It is a giant star, much bigger than our Sun.",
  },
  {
    id: "thetaPsc",
    nameJa: "うお座θ星",
    nameEn: "Theta Piscium",
    designationJa: "うお座θ星",
    designationEn: "Theta Piscium",
    constellationJa: "うお座",
    hip: 115830,
    vMag: 4.27,
    spectralType: "K0.5III",
    distanceLy: 150,
    descriptionJa:
      "うお座の西の魚の輪を作る星のひとつで、オレンジ色の巨星です。",
    descriptionEn:
      "Theta Piscium is one of the stars in the ring of the western fish. It is an orange giant star.",
  },
  {
    id: "iotaPsc",
    nameJa: "うお座ι星",
    nameEn: "Iota Piscium",
    designationJa: "うお座ι星",
    designationEn: "Iota Piscium",
    constellationJa: "うお座",
    hip: 116771,
    vMag: 4.13,
    spectralType: "F7V",
    distanceLy: 45,
    descriptionJa:
      "うお座の西の魚の輪を作る星で、太陽より少し温度の高い主系列星です。地球から約45光年と、この星座線の星の中ではいちばん近くにあります。",
    descriptionEn:
      "Iota Piscium is in the ring of the western fish. It is a little hotter than our Sun, and it is the closest star in this constellation figure, only about 45 light-years away.",
  },
  {
    id: "lambdaPsc",
    nameJa: "うお座λ星",
    nameEn: "Lambda Piscium",
    designationJa: "うお座λ星",
    designationEn: "Lambda Piscium",
    constellationJa: "うお座",
    hip: 116928,
    vMag: 4.49,
    spectralType: "A7V",
    distanceLy: 110,
    descriptionJa:
      "うお座の西の魚の輪の南東のはしにある、白い主系列星です。",
    descriptionEn:
      "Lambda Piscium is a white star at the southeast end of the ring of the western fish.",
  },
  {
    id: "kappaPsc",
    nameJa: "うお座κ星",
    nameEn: "Kappa Piscium",
    designationJa: "うお座κ星",
    designationEn: "Kappa Piscium",
    constellationJa: "うお座",
    hip: 115738,
    vMag: 4.95,
    spectralType: "A2V",
    distanceLy: 150,
    descriptionJa:
      "うお座の西の魚の輪の南のはしにある星です。表面にストロンチウムやクロムなどの元素が多く見られる「Ap星（化学特異星）」です。",
    descriptionEn:
      "Kappa Piscium is at the south end of the ring of the western fish. Its surface has unusually large amounts of some elements, such as strontium and chromium.",
  },
  {
    id: "omegaPsc",
    nameJa: "うお座ω星",
    nameEn: "Omega Piscium",
    designationJa: "うお座ω星",
    designationEn: "Omega Piscium",
    constellationJa: "うお座",
    hip: 118268,
    vMag: 4.03,
    spectralType: "F4V",
    distanceLy: 100,
    descriptionJa:
      "うお座の西の魚の輪と、2匹の魚を結ぶひもの間にある黄白色の星です。",
    descriptionEn:
      "Omega Piscium is a yellow-white star between the ring of the western fish and the cord that ties the two fish.",
  },
  {
    id: "deltaPsc",
    nameJa: "うお座δ星",
    nameEn: "Delta Piscium",
    designationJa: "うお座δ星",
    designationEn: "Delta Piscium",
    constellationJa: "うお座",
    hip: 3786,
    vMag: 4.44,
    spectralType: "K5III",
    distanceLy: 310,
    descriptionJa:
      "うお座の2匹の魚を結ぶひもの途中にある、オレンジ色の巨星です。",
    descriptionEn:
      "Delta Piscium is an orange giant star on the cord that ties the two fish of Pisces.",
  },
  {
    id: "epsilonPsc",
    nameJa: "うお座ε星",
    nameEn: "Epsilon Piscium",
    designationJa: "うお座ε星",
    designationEn: "Epsilon Piscium",
    constellationJa: "うお座",
    hip: 4906,
    vMag: 4.27,
    spectralType: "G9III",
    distanceLy: 180,
    descriptionJa:
      "うお座の2匹の魚を結ぶひもの途中にある巨星です。",
    descriptionEn:
      "Epsilon Piscium is a giant star on the cord that ties the two fish of Pisces.",
  },
  {
    id: "alrescha",
    nameJa: "アルレシャ",
    nameEn: "Alrescha",
    designationJa: "うお座α星",
    designationEn: "Alpha Piscium",
    constellationJa: "うお座",
    hip: 9487,
    vMag: 3.82,
    spectralType: "A型（連星）",
    distanceLy: 150,
    descriptionJa:
      "うお座の2匹の魚を結ぶひもの結び目にあたる星で、名前はアラビア語で「ひも」を意味します。望遠鏡で見ると、2つの白い星が並んで見える連星です。",
    descriptionEn:
      "Alrescha is the knot of the cord that ties the two fish of Pisces. Its name means 'the cord' in Arabic. With a telescope, you can see two white stars side by side.",
  },
  {
    id: "omicronPsc",
    nameJa: "うお座ο星",
    nameEn: "Omicron Piscium",
    designationJa: "うお座ο星",
    designationEn: "Omicron Piscium",
    constellationJa: "うお座",
    hip: 8198,
    vMag: 4.26,
    spectralType: "G8III",
    distanceLy: 280,
    descriptionJa:
      "うお座の結び目から北の魚へのびるひもの上にある巨星です。",
    descriptionEn:
      "Omicron Piscium is a giant star on the cord that goes from the knot to the northern fish.",
  },
  {
    id: "etaPsc",
    nameJa: "うお座η星",
    nameEn: "Eta Piscium",
    designationJa: "うお座η星",
    designationEn: "Eta Piscium",
    constellationJa: "うお座",
    hip: 7097,
    vMag: 3.62,
    spectralType: "G7III",
    distanceLy: 350,
    descriptionJa:
      "うお座の北の魚の近くにある星で、うお座でいちばん明るい星です。",
    descriptionEn:
      "Eta Piscium is near the northern fish, and it is the brightest star in Pisces.",
  },
  {
    id: "phiPsc",
    nameJa: "うお座φ星",
    nameEn: "Phi Piscium",
    designationJa: "うお座φ星",
    designationEn: "Phi Piscium",
    constellationJa: "うお座",
    hip: 5742,
    vMag: 4.67,
    spectralType: "K0III",
    distanceLy: 450,
    descriptionJa:
      "うお座の北の魚の体を作る星のひとつで、オレンジ色の巨星です。",
    descriptionEn:
      "Phi Piscium is one of the stars that make the body of the northern fish. It is an orange giant star.",
  },
  {
    id: "upsilonPsc",
    nameJa: "うお座υ星",
    nameEn: "Upsilon Piscium",
    designationJa: "うお座υ星",
    designationEn: "Upsilon Piscium",
    constellationJa: "うお座",
    hip: 6193,
    vMag: 4.74,
    spectralType: "A3V",
    distanceLy: 310,
    descriptionJa:
      "うお座の北の魚の先にある、白い主系列星です。",
    descriptionEn:
      "Upsilon Piscium is a white star at the tip of the northern fish of Pisces.",
  },
  {
    id: "mesarthim",
    nameJa: "メサルティム",
    nameEn: "Mesarthim",
    designationJa: "おひつじ座γ星",
    designationEn: "Gamma Arietis",
    constellationJa: "おひつじ座",
    hip: 8832,
    vMag: 3.88,
    spectralType: "A型（二重星）",
    distanceLy: 160,
    descriptionJa:
      "おひつじの角の先にある星で、小さな望遠鏡でも2つの白い星が並んで見える、美しい二重星です。",
    descriptionEn:
      "Mesarthim is at the tip of the ram's horn. Even with a small telescope, you can see two white stars side by side.",
  },
  {
    id: "sheratan",
    nameJa: "シェラタン",
    nameEn: "Sheratan",
    designationJa: "おひつじ座β星",
    designationEn: "Beta Arietis",
    constellationJa: "おひつじ座",
    hip: 8903,
    vMag: 2.64,
    spectralType: "A5V",
    distanceLy: 59,
    descriptionJa:
      "おひつじの頭にある2等星で、名前はアラビア語で「2つのしるし」を意味するといわれます。ハマルとともに、おひつじの頭を作ります。",
    descriptionEn:
      "Sheratan is a bright star on the head of Aries. Its name is said to mean 'the two signs' in Arabic. Together with Hamal, it makes the ram's head.",
  },
  {
    id: "hamal",
    nameJa: "ハマル",
    nameEn: "Hamal",
    designationJa: "おひつじ座α星",
    designationEn: "Alpha Arietis",
    constellationJa: "おひつじ座",
    hip: 9884,
    vMag: 2.01,
    spectralType: "K2III",
    distanceLy: 66,
    descriptionJa:
      "おひつじ座でいちばん明るいオレンジ色の巨星で、名前はアラビア語の「羊」に由来します。約2,000年前には春分点がおひつじ座にあったため、おひつじ座は黄道12星座の最初の星座とされてきました。",
    descriptionEn:
      "Hamal is the brightest star in Aries. It is an orange giant, and its name comes from the Arabic word for 'sheep.' About 2,000 years ago, the Sun was in Aries at the start of spring, so Aries became the first sign of the zodiac.",
  },
  {
    id: "ari41",
    nameJa: "おひつじ座41番星",
    nameEn: "41 Arietis",
    designationJa: "おひつじ座41番星",
    designationEn: "41 Arietis",
    constellationJa: "おひつじ座",
    hip: 13209,
    vMag: 3.61,
    spectralType: "B8V",
    distanceLy: 170,
    descriptionJa:
      "おひつじの背中の側にある青白い星です。固有の名前の代わりに、フラムスティードがつけた「41番」という番号で呼ばれています。",
    descriptionEn:
      "41 Arietis is a blue-white star on the back of the ram. It is usually called by its number, 41, which was given by the astronomer John Flamsteed.",
  },
  {
    id: "deltaAri",
    nameJa: "おひつじ座δ星",
    nameEn: "Delta Arietis",
    designationJa: "おひつじ座δ星",
    designationEn: "Delta Arietis",
    constellationJa: "おひつじ座",
    hip: 14838,
    vMag: 4.35,
    spectralType: "G9.5III",
    distanceLy: 170,
    descriptionJa:
      "おひつじ座の東のはしにある巨星です。",
    descriptionEn:
      "Delta Arietis is a giant star at the east end of Aries.",
  },
  {
    id: "theta2Tau",
    nameJa: "おうし座θ2星",
    nameEn: "Theta-2 Tauri",
    designationJa: "おうし座θ2星",
    designationEn: "Theta-2 Tauri",
    constellationJa: "おうし座",
    hip: 20894,
    vMag: 3.4,
    spectralType: "A7III",
    distanceLy: 150,
    descriptionJa:
      "おうしの顔をつくる「ヒアデス星団」の中でいちばん明るい星です。すぐ隣にθ1星が並んでいて、肉眼でも2つの星に見分けられます。",
    descriptionEn:
      "Theta-2 Tauri is the brightest star in the Hyades, the star cluster that makes the face of the bull. Next to it is Theta-1 Tauri, and you can see the two stars apart with your eyes.",
  },
  {
    id: "gammaTau",
    nameJa: "おうし座γ星",
    nameEn: "Gamma Tauri",
    designationJa: "おうし座γ星",
    designationEn: "Gamma Tauri",
    constellationJa: "おうし座",
    hip: 20205,
    vMag: 3.65,
    spectralType: "G9.5III",
    distanceLy: 160,
    descriptionJa:
      "おうしの顔のV字形の頂点（鼻先）にある巨星で、ヒアデス星団の仲間です。",
    descriptionEn:
      "Gamma Tauri is a giant star at the point of the V-shaped face of the bull. It is a member of the Hyades star cluster.",
  },
  {
    id: "deltaTau",
    nameJa: "おうし座δ星",
    nameEn: "Delta Tauri",
    designationJa: "おうし座δ星",
    designationEn: "Delta Tauri",
    constellationJa: "おうし座",
    hip: 20455,
    vMag: 3.77,
    spectralType: "G9.5III",
    distanceLy: 160,
    descriptionJa:
      "おうしの顔のV字形の北側の線にある巨星で、ヒアデス星団の仲間です。",
    descriptionEn:
      "Delta Tauri is a giant star on the northern line of the bull's V-shaped face. It is a member of the Hyades star cluster.",
  },
  {
    id: "epsilonTau",
    nameJa: "おうし座ε星",
    nameEn: "Epsilon Tauri",
    designationJa: "おうし座ε星",
    designationEn: "Epsilon Tauri",
    constellationJa: "おうし座",
    hip: 20889,
    vMag: 3.53,
    spectralType: "G9.5III",
    distanceLy: 150,
    descriptionJa:
      "おうしの顔のV字形の北のはしにある巨星で、アラビア語で「目」を意味する「アイン」という名前もあります。散開星団の星で初めて惑星が見つかった星として知られています。",
    descriptionEn:
      "Epsilon Tauri is a giant star at the north end of the bull's V-shaped face. It is also called Ain, which means 'eye' in Arabic. It was the first star in an open star cluster found to have a planet.",
  },
  {
    id: "elnath",
    nameJa: "エルナト",
    nameEn: "Elnath",
    designationJa: "おうし座β星",
    designationEn: "Beta Tauri",
    constellationJa: "おうし座",
    hip: 25428,
    vMag: 1.65,
    spectralType: "B7III",
    distanceLy: 130,
    descriptionJa:
      "おうしの北の角の先にある2等星で、名前はアラビア語で「（角で）突くもの」を意味します。ぎょしゃ座の五角形の一角にも使われ、昔はぎょしゃ座の星ともされていました。",
    descriptionEn:
      "Elnath is at the tip of the northern horn of Taurus. Its name means 'the butting one' in Arabic. It also makes one corner of the pentagon of Auriga, and long ago it was counted as a star of Auriga, too.",
  },
  {
    id: "zetaTau",
    nameJa: "おうし座ζ星",
    nameEn: "Zeta Tauri",
    designationJa: "おうし座ζ星",
    designationEn: "Zeta Tauri",
    constellationJa: "おうし座",
    hip: 26451,
    vMag: 2.97,
    spectralType: "B1IV",
    distanceLy: 450,
    descriptionJa:
      "おうしの南の角の先にある青白い星です。すぐ近くに、1054年に起きた超新星爆発の名残「かに星雲（M1）」があります。",
    descriptionEn:
      "Zeta Tauri is a blue-white star at the tip of the southern horn of Taurus. Near this star is the Crab Nebula (M1), which was made by a star explosion seen in the year 1054.",
  },
  {
    id: "lambdaTau",
    nameJa: "おうし座λ星",
    nameEn: "Lambda Tauri",
    designationJa: "おうし座λ星",
    designationEn: "Lambda Tauri",
    constellationJa: "おうし座",
    hip: 18724,
    vMag: 3.41,
    spectralType: "B4IV",
    distanceLy: 480,
    distanceRangeLy: [410, 480],
    descriptionJa:
      "おうしの体の南側にある青白い星です。2つの星がおたがいを隠し合い、約4日ごとに明るさが変わる「食連星」です。",
    descriptionEn:
      "Lambda Tauri is a blue-white star in the southern part of the bull's body. It is really two stars that hide each other, so its brightness changes about every four days.",
  },
  {
    id: "castor",
    nameJa: "カストル",
    nameEn: "Castor",
    designationJa: "ふたご座α星",
    designationEn: "Alpha Geminorum",
    constellationJa: "ふたご座",
    hip: 36850,
    vMag: 1.58,
    spectralType: "A1V",
    distanceLy: 51,
    descriptionJa:
      "ふたご座の双子の兄弟のうち、カストルの頭にあたる2等星で、ポルックスと並んで輝きます。望遠鏡で見ると2つの星に分かれ、それぞれが連星で、さらに暗い赤い星のペアも加わった「6重星」です。",
    descriptionEn:
      "Castor marks the head of one of the twins of Gemini and shines next to Pollux. With a telescope, it splits into two stars. In fact, it is a family of six stars that move around each other.",
  },
  {
    id: "zetaGem",
    nameJa: "ふたご座ζ星",
    nameEn: "Zeta Geminorum",
    designationJa: "ふたご座ζ星",
    designationEn: "Zeta Geminorum",
    constellationJa: "ふたご座",
    hip: 34088,
    vMag: 4.01,
    spectralType: "G1Ib",
    distanceLy: 1400,
    distanceRangeLy: [1100, 1400],
    descriptionJa:
      "ふたご座のポルックス側の体にある黄色い超巨星で、約10日の周期でふくらんだり縮んだりして明るさが変わる「ケフェイド変光星」です。",
    descriptionEn:
      "Zeta Geminorum is a yellow supergiant in the Pollux half of Gemini. It grows and shrinks, so its brightness changes about every ten days.",
  },
  {
    id: "mebsuta",
    nameJa: "メブスタ",
    nameEn: "Mebsuta",
    designationJa: "ふたご座ε星",
    designationEn: "Epsilon Geminorum",
    constellationJa: "ふたご座",
    hip: 32246,
    vMag: 3.06,
    spectralType: "G8Ib",
    distanceLy: 850,
    descriptionJa:
      "ふたご座のカストル側の体にある黄色い超巨星です。黄道のすぐ近くにあるため、月に隠されること（星食）があります。",
    descriptionEn:
      "Mebsuta is a yellow supergiant in the Castor half of Gemini. It is very close to the path of the Sun, so the Moon sometimes passes in front of it.",
  },
  {
    id: "tejat",
    nameJa: "テジャト",
    nameEn: "Tejat",
    designationJa: "ふたご座μ星",
    designationEn: "Mu Geminorum",
    constellationJa: "ふたご座",
    hip: 30343,
    vMag: 2.87,
    spectralType: "M3III",
    distanceLy: 230,
    descriptionJa:
      "ふたご座のカストル側の足元にある赤い巨星で、明るさがゆっくりと変わる変光星です。",
    descriptionEn:
      "Tejat is a red giant star at the foot of the Castor half of Gemini. Its brightness changes slowly.",
  },
  {
    id: "etaGem",
    nameJa: "ふたご座η星",
    nameEn: "Eta Geminorum",
    designationJa: "ふたご座η星",
    designationEn: "Eta Geminorum",
    constellationJa: "ふたご座",
    hip: 29655,
    vMag: 3.31,
    spectralType: "M2III",
    distanceLy: 390,
    distanceRangeLy: [390, 690],
    descriptionJa:
      "ふたご座のカストル側の足の先にある赤い巨星で、明るさがゆっくりと変わる変光星です。",
    descriptionEn:
      "Eta Geminorum is a red giant star at the tip of the foot of the Castor half of Gemini. Its brightness changes slowly.",
  },
  {
    id: "wasat",
    nameJa: "ワサト",
    nameEn: "Wasat",
    designationJa: "ふたご座δ星",
    designationEn: "Delta Geminorum",
    constellationJa: "ふたご座",
    hip: 35550,
    vMag: 3.5,
    spectralType: "F2V",
    distanceLy: 60,
    descriptionJa:
      "ふたご座のポルックス側の体の中ほどにある星で、名前はアラビア語で「中央」を意味します。1930年、この星の近くを写した写真から冥王星が発見されました。",
    descriptionEn:
      "Wasat is in the middle of the Pollux half of Gemini. Its name means 'the middle' in Arabic. In 1930, Pluto was discovered in photos of the sky near this star.",
  },
  {
    id: "alhena",
    nameJa: "アルヘナ",
    nameEn: "Alhena",
    designationJa: "ふたご座γ星",
    designationEn: "Gamma Geminorum",
    constellationJa: "ふたご座",
    hip: 31681,
    vMag: 1.93,
    spectralType: "A1.5IV",
    distanceLy: 110,
    descriptionJa:
      "ふたご座のポルックス側の足元にある白い2等星で、ふたご座で3番目に明るい星です。黄道のすぐ近くにあります。",
    descriptionEn:
      "Alhena is a bright white star at the foot of the Pollux half of Gemini. It is the third brightest star in Gemini and is very close to the path of the Sun.",
  },
  {
    id: "xiGem",
    nameJa: "ふたご座ξ星",
    nameEn: "Xi Geminorum",
    designationJa: "ふたご座ξ星",
    designationEn: "Xi Geminorum",
    constellationJa: "ふたご座",
    hip: 32362,
    vMag: 3.35,
    spectralType: "F5IV-V",
    distanceLy: 59,
    descriptionJa:
      "ふたご座のポルックス側の足の先にある黄白色の星です。地球から約59光年と近くにあります。",
    descriptionEn:
      "Xi Geminorum is a yellow-white star at the tip of the foot of the Pollux half of Gemini. It is near us, only about 59 light-years away.",
  },
  {
    id: "iotaCnc",
    nameJa: "かに座ι星",
    nameEn: "Iota Cancri",
    designationJa: "かに座ι星",
    designationEn: "Iota Cancri",
    constellationJa: "かに座",
    hip: 43103,
    vMag: 4.03,
    spectralType: "G8III",
    distanceLy: 330,
    descriptionJa:
      "かに座の北のはしにある巨星です。望遠鏡で見ると青っぽい伴星と並び、色の違いが美しい二重星です。",
    descriptionEn:
      "Iota Cancri is a giant star at the north end of Cancer. With a telescope, you can see a bluish partner star next to it, and the two colors look beautiful together.",
  },
  {
    id: "gammaCnc",
    nameJa: "かに座γ星",
    nameEn: "Gamma Cancri",
    designationJa: "かに座γ星",
    designationEn: "Gamma Cancri",
    constellationJa: "かに座",
    hip: 42806,
    vMag: 4.66,
    spectralType: "A1V",
    distanceLy: 180,
    descriptionJa:
      "かにの甲羅にある白い星で、「北のロバの子」という意味の名前（アセルス・ボレアリス）を持ちます。すぐ西に、たくさんの星が集まった「プレセペ星団（M44）」があります。",
    descriptionEn:
      "Gamma Cancri is a white star on the shell of the crab. Its name, Asellus Borealis, means 'the northern donkey colt.' Just to the west is the Beehive Cluster (M44), a group of many stars.",
  },
  {
    id: "deltaCnc",
    nameJa: "かに座δ星",
    nameEn: "Delta Cancri",
    designationJa: "かに座δ星",
    designationEn: "Delta Cancri",
    constellationJa: "かに座",
    hip: 42911,
    vMag: 3.94,
    spectralType: "K0III",
    distanceLy: 130,
    descriptionJa:
      "かにの甲羅にある巨星で、「南のロバの子」という意味の名前（アセルス・アウストラリス）を持ちます。黄道のほぼ真上にあるため、月に隠されることがあります。",
    descriptionEn:
      "Delta Cancri is a giant star on the shell of the crab. Its name, Asellus Australis, means 'the southern donkey colt.' It is almost on the path of the Sun, so the Moon sometimes passes in front of it.",
  },
  {
    id: "acubens",
    nameJa: "アクベンス",
    nameEn: "Acubens",
    designationJa: "かに座α星",
    designationEn: "Alpha Cancri",
    constellationJa: "かに座",
    hip: 44066,
    vMag: 4.26,
    spectralType: "A型（Am星）",
    distanceLy: 190,
    descriptionJa:
      "かにの南のはさみにある星で、名前はアラビア語で「はさみ」を意味します。",
    descriptionEn:
      "Acubens is on the southern claw of the crab. Its name means 'the claws' in Arabic.",
  },
  {
    id: "altarf",
    nameJa: "アルタルフ",
    nameEn: "Altarf",
    designationJa: "かに座β星",
    designationEn: "Beta Cancri",
    constellationJa: "かに座",
    hip: 40526,
    vMag: 3.53,
    spectralType: "K4III",
    distanceLy: 300,
    descriptionJa:
      "かに座でいちばん明るい星で、かにの足の先にあるオレンジ色の巨星です。",
    descriptionEn:
      "Altarf is the brightest star in Cancer. It is an orange giant at the tip of the crab's leg.",
  },
  {
    id: "epsilonLeo",
    nameJa: "しし座ε星",
    nameEn: "Epsilon Leonis",
    designationJa: "しし座ε星",
    designationEn: "Epsilon Leonis",
    constellationJa: "しし座",
    hip: 47908,
    vMag: 2.97,
    spectralType: "G1III",
    distanceLy: 250,
    descriptionJa:
      "ししの頭を作る「ししの大がま」の先にある、黄色い輝巨星です。",
    descriptionEn:
      "Epsilon Leonis is a yellow bright giant at the tip of the Sickle, the curved line of stars that makes the lion's head.",
  },
  {
    id: "muLeo",
    nameJa: "しし座μ星",
    nameEn: "Mu Leonis",
    designationJa: "しし座μ星",
    designationEn: "Mu Leonis",
    constellationJa: "しし座",
    hip: 48455,
    vMag: 3.88,
    spectralType: "K2III",
    distanceLy: 120,
    descriptionJa:
      "ししの頭のてっぺんにある、オレンジ色の巨星です。",
    descriptionEn:
      "Mu Leonis is an orange giant star at the top of the lion's head.",
  },
  {
    id: "zetaLeo",
    nameJa: "しし座ζ星",
    nameEn: "Zeta Leonis",
    designationJa: "しし座ζ星",
    designationEn: "Zeta Leonis",
    constellationJa: "しし座",
    hip: 50335,
    vMag: 3.43,
    spectralType: "F0III",
    distanceLy: 270,
    distanceRangeLy: [230, 270],
    descriptionJa:
      "ししのたてがみにあたる「ししの大がま」の星のひとつです。",
    descriptionEn:
      "Zeta Leonis is one of the stars of the Sickle, which makes the lion's mane.",
  },
  {
    id: "algieba",
    nameJa: "アルギエバ",
    nameEn: "Algieba",
    designationJa: "しし座γ星",
    designationEn: "Gamma Leonis",
    constellationJa: "しし座",
    hip: 50583,
    vMag: 2.01,
    spectralType: "K1III（連星）",
    distanceLy: 130,
    descriptionJa:
      "「ししの大がま」の中ほどにある2等星です。小さな望遠鏡で見ると、金色の2つの星に分かれる美しい二重星です。",
    descriptionEn:
      "Algieba is a bright star in the middle of the Sickle of Leo. With a small telescope, it splits into two golden stars.",
  },
  {
    id: "etaLeo",
    nameJa: "しし座η星",
    nameEn: "Eta Leonis",
    designationJa: "しし座η星",
    designationEn: "Eta Leonis",
    constellationJa: "しし座",
    hip: 49583,
    vMag: 3.48,
    spectralType: "A0Ib",
    distanceLy: 1300,
    distanceRangeLy: [1300, 1800],
    descriptionJa:
      "ししの胸にある白い超巨星です。とても遠くにあるため、正確な距離はまだよく分かっていません。",
    descriptionEn:
      "Eta Leonis is a white supergiant on the lion's chest. It is very far away, so we do not know its exact distance yet.",
  },
  {
    id: "regulus",
    nameJa: "レグルス",
    nameEn: "Regulus",
    designationJa: "しし座α星",
    designationEn: "Alpha Leonis",
    constellationJa: "しし座",
    hip: 49669,
    vMag: 1.36,
    spectralType: "B8IV",
    distanceLy: 79,
    descriptionJa:
      "しし座でいちばん明るい1等星で、ししの心臓にあたります。名前はラテン語で「小さな王」を意味します。約16時間という速さで自転しているため、赤道が大きくふくらんだ形をしています。黄道のすぐ近くにあり、月に隠されることもあります。",
    descriptionEn:
      "Regulus is the brightest star in Leo and marks the lion's heart. Its name means 'little king' in Latin. It spins very fast, once in about 16 hours, so it is wider at its middle. It is close to the path of the Sun, and the Moon sometimes passes in front of it.",
  },
  {
    id: "zosma",
    nameJa: "ゾスマ",
    nameEn: "Zosma",
    designationJa: "しし座δ星",
    designationEn: "Delta Leonis",
    constellationJa: "しし座",
    hip: 54872,
    vMag: 2.56,
    spectralType: "A5IV",
    distanceLy: 58,
    descriptionJa:
      "ししの腰（背中）にある白い2等星です。",
    descriptionEn:
      "Zosma is a bright white star on the lion's back.",
  },
  {
    id: "thetaLeo",
    nameJa: "しし座θ星",
    nameEn: "Theta Leonis",
    designationJa: "しし座θ星",
    designationEn: "Theta Leonis",
    constellationJa: "しし座",
    hip: 54879,
    vMag: 3.33,
    spectralType: "A2IV",
    distanceLy: 170,
    descriptionJa:
      "ししの後ろ足のつけ根にある白い星です。",
    descriptionEn:
      "Theta Leonis is a white star at the top of the lion's back leg.",
  },
  {
    id: "betaVir",
    nameJa: "おとめ座β星",
    nameEn: "Beta Virginis",
    designationJa: "おとめ座β星",
    designationEn: "Beta Virginis",
    constellationJa: "おとめ座",
    hip: 57757,
    vMag: 3.59,
    spectralType: "F9V",
    distanceLy: 36,
    descriptionJa:
      "おとめ座の西のはしにある、太陽より少し温度の高い黄白色の星です。地球から約36光年と近くにあります。",
    descriptionEn:
      "Beta Virginis is a yellow-white star at the west end of Virgo. It is a little hotter than our Sun and is near us, only about 36 light-years away.",
  },
  {
    id: "etaVir",
    nameJa: "おとめ座η星",
    nameEn: "Eta Virginis",
    designationJa: "おとめ座η星",
    designationEn: "Eta Virginis",
    constellationJa: "おとめ座",
    hip: 60129,
    vMag: 3.89,
    spectralType: "A2IV",
    distanceLy: 270,
    descriptionJa:
      "おとめ座の西側にある白い星で、黄道のすぐ近くにあります。",
    descriptionEn:
      "Eta Virginis is a white star in the western part of Virgo. It is very close to the path of the Sun.",
  },
  {
    id: "porrima",
    nameJa: "ポリマ",
    nameEn: "Porrima",
    designationJa: "おとめ座γ星",
    designationEn: "Gamma Virginis",
    constellationJa: "おとめ座",
    hip: 61941,
    vMag: 2.74,
    spectralType: "F1V（連星）",
    distanceLy: 38,
    descriptionJa:
      "おとめ座の中央にある3等星です。ほぼ同じ明るさの2つの黄白色の星が、約169年かけて回り合う連星です。名前はローマ神話の予言の女神に由来します。",
    descriptionEn:
      "Porrima is in the center of Virgo. It is two yellow-white stars of almost the same brightness, and they go around each other once in about 169 years. Its name comes from a Roman goddess.",
  },
  {
    id: "deltaVir",
    nameJa: "おとめ座δ星",
    nameEn: "Delta Virginis",
    designationJa: "おとめ座δ星",
    designationEn: "Delta Virginis",
    constellationJa: "おとめ座",
    hip: 63090,
    vMag: 3.39,
    spectralType: "M3III",
    distanceLy: 200,
    descriptionJa:
      "おとめ座の中ほどにある赤い巨星です。",
    descriptionEn:
      "Delta Virginis is a red giant star in the middle of Virgo.",
  },
  {
    id: "vindemiatrix",
    nameJa: "ヴィンデミアトリクス",
    nameEn: "Vindemiatrix",
    designationJa: "おとめ座ε星",
    designationEn: "Epsilon Virginis",
    constellationJa: "おとめ座",
    hip: 63608,
    vMag: 2.85,
    spectralType: "G8III",
    distanceLy: 110,
    descriptionJa:
      "おとめ座の北側にある巨星で、名前はラテン語で「ぶどうをつむ女性」を意味します。昔、この星が明け方に見え始めるころが、ぶどうの収穫の時期だったことに由来します。",
    descriptionEn:
      "Vindemiatrix is a giant star in the northern part of Virgo. Its name means 'the grape picker' in Latin, because long ago it started to appear in the morning sky at the time of the grape harvest.",
  },
  {
    id: "zetaVir",
    nameJa: "おとめ座ζ星",
    nameEn: "Zeta Virginis",
    designationJa: "おとめ座ζ星",
    designationEn: "Zeta Virginis",
    constellationJa: "おとめ座",
    hip: 66249,
    vMag: 3.38,
    spectralType: "A2V",
    distanceLy: 74,
    descriptionJa:
      "おとめ座の東側にある白い主系列星です。",
    descriptionEn:
      "Zeta Virginis is a white star in the eastern part of Virgo.",
  },
  {
    id: "kappaVir",
    nameJa: "おとめ座κ星",
    nameEn: "Kappa Virginis",
    designationJa: "おとめ座κ星",
    designationEn: "Kappa Virginis",
    constellationJa: "おとめ座",
    hip: 69427,
    vMag: 4.18,
    spectralType: "K2.5III",
    distanceLy: 260,
    descriptionJa:
      "おとめ座の南東のはしにある、オレンジ色の巨星です。",
    descriptionEn:
      "Kappa Virginis is an orange giant star at the southeast end of Virgo.",
  },
  {
    id: "zubenelgenubi",
    nameJa: "ズベンエルゲヌビ",
    nameEn: "Zubenelgenubi",
    designationJa: "てんびん座α2星",
    designationEn: "Alpha-2 Librae",
    constellationJa: "てんびん座",
    hip: 72622,
    vMag: 2.75,
    spectralType: "A3IV",
    distanceLy: 76,
    descriptionJa:
      "てんびん座で2番目に明るい星で、名前はアラビア語で「南のはさみ」を意味します。昔はさそり座のはさみの一部と考えられていたためです。双眼鏡で見ると、すぐそばにα1星が並んで見えます。",
    descriptionEn:
      "Zubenelgenubi is the second brightest star in Libra. Its name means 'the southern claw' in Arabic, because long ago people thought it was part of the scorpion's claw. With binoculars, you can see another star next to it.",
  },
  {
    id: "zubeneschamali",
    nameJa: "ズベンエシャマリ",
    nameEn: "Zubeneschamali",
    designationJa: "てんびん座β星",
    designationEn: "Beta Librae",
    constellationJa: "てんびん座",
    hip: 74785,
    vMag: 2.61,
    spectralType: "B8V",
    distanceLy: 190,
    descriptionJa:
      "てんびん座でいちばん明るい星で、名前はアラビア語で「北のはさみ」を意味します。青白い星ですが、「緑色っぽく見える」と言われることがある、ふしぎな星です。",
    descriptionEn:
      "Zubeneschamali is the brightest star in Libra. Its name means 'the northern claw' in Arabic. It is a blue-white star, but some people say that it looks a little green.",
  },
  {
    id: "gammaLib",
    nameJa: "てんびん座γ星",
    nameEn: "Gamma Librae",
    designationJa: "てんびん座γ星",
    designationEn: "Gamma Librae",
    constellationJa: "てんびん座",
    hip: 76333,
    vMag: 3.91,
    spectralType: "G8.5III",
    distanceLy: 160,
    descriptionJa:
      "てんびん座の東側にある巨星です。",
    descriptionEn:
      "Gamma Librae is a giant star in the eastern part of Libra.",
  },
  {
    id: "sigmaLib",
    nameJa: "てんびん座σ星",
    nameEn: "Sigma Librae",
    designationJa: "てんびん座σ星",
    designationEn: "Sigma Librae",
    constellationJa: "てんびん座",
    hip: 73714,
    vMag: 3.25,
    spectralType: "M2.5III",
    distanceLy: 290,
    descriptionJa:
      "てんびん座の南西にある赤い巨星で、明るさが少し変わる変光星です。昔はさそり座のγ星とされていました。",
    descriptionEn:
      "Sigma Librae is a red giant star in the southwest of Libra. Its brightness changes a little. Long ago, it was called Gamma Scorpii, a star of Scorpius.",
  },
  {
    id: "upsilonLib",
    nameJa: "てんびん座υ星",
    nameEn: "Upsilon Librae",
    designationJa: "てんびん座υ星",
    designationEn: "Upsilon Librae",
    constellationJa: "てんびん座",
    hip: 76470,
    vMag: 3.6,
    spectralType: "K3.5III",
    distanceLy: 220,
    descriptionJa:
      "てんびん座の南のはしにある、オレンジ色の巨星です。",
    descriptionEn:
      "Upsilon Librae is an orange giant star at the south end of Libra.",
  },
  {
    id: "betaSco",
    nameJa: "さそり座β星",
    nameEn: "Beta Scorpii",
    designationJa: "さそり座β星",
    designationEn: "Beta Scorpii",
    constellationJa: "さそり座",
    hip: 78820,
    vMag: 2.56,
    spectralType: "B1V",
    distanceLy: 400,
    descriptionJa:
      "さそりの頭（はさみの付け根）にある2等星です。望遠鏡で見ると、2つの青白い星に分かれる二重星です。",
    descriptionEn:
      "Beta Scorpii is a bright star on the head of the scorpion. With a telescope, it splits into two blue-white stars.",
  },
  {
    id: "deltaSco",
    nameJa: "さそり座δ星",
    nameEn: "Delta Scorpii",
    designationJa: "さそり座δ星",
    designationEn: "Delta Scorpii",
    constellationJa: "さそり座",
    hip: 78401,
    vMag: 2.29,
    spectralType: "B0.3IV",
    distanceLy: 490,
    distanceUncertain: true,
    descriptionJa:
      "さそりの頭の中央にある青白い星です。2000年に急に明るくなり、それ以降も明るさが変わり続けています。",
    descriptionEn:
      "Delta Scorpii is a blue-white star in the middle of the scorpion's head. It suddenly became brighter in the year 2000, and its brightness has kept changing since then.",
  },
  {
    id: "piSco",
    nameJa: "さそり座π星",
    nameEn: "Pi Scorpii",
    designationJa: "さそり座π星",
    designationEn: "Pi Scorpii",
    constellationJa: "さそり座",
    hip: 78265,
    vMag: 2.89,
    spectralType: "B1V（連星）",
    distanceLy: 590,
    descriptionJa:
      "さそりの頭の南のはしにある青白い星で、2つの高温の星が回り合う連星です。",
    descriptionEn:
      "Pi Scorpii is a blue-white star at the south end of the scorpion's head. It is really two hot stars that go around each other.",
  },
  {
    id: "antares",
    nameJa: "アンタレス",
    nameEn: "Antares",
    designationJa: "さそり座α星",
    designationEn: "Alpha Scorpii",
    constellationJa: "さそり座",
    hip: 80763,
    vMag: 1.06,
    spectralType: "M1.5Iab",
    distanceLy: 550,
    distanceUncertain: true,
    descriptionJa:
      "さそり座の心臓にあたる赤い1等星です。名前はギリシャ語で「火星（アレス）に対抗するもの」という意味で、火星と色や明るさを競うように見えることに由来します。太陽の位置に置くと火星の軌道をこえるほど巨大な赤色超巨星で、日本では「赤星」とも呼ばれました。",
    descriptionEn:
      "Antares is the bright red heart of Scorpius. Its name means 'rival of Mars' in Greek, because its red color looks like the planet Mars. It is a red supergiant star. If it were in the place of our Sun, it would be bigger than the orbit of Mars!",
  },
  {
    id: "epsilonSco",
    nameJa: "さそり座ε星",
    nameEn: "Epsilon Scorpii",
    designationJa: "さそり座ε星",
    designationEn: "Epsilon Scorpii",
    constellationJa: "さそり座",
    hip: 82396,
    vMag: 2.29,
    spectralType: "K1III",
    distanceLy: 64,
    descriptionJa:
      "さそりの胴体にあるオレンジ色の巨星で、地球から約64光年と、さそり座の明るい星の中では近くにあります。",
    descriptionEn:
      "Epsilon Scorpii is an orange giant star on the body of the scorpion. It is only about 64 light-years away, close compared with the other bright stars of Scorpius.",
  },
  {
    id: "etaSco",
    nameJa: "さそり座η星",
    nameEn: "Eta Scorpii",
    designationJa: "さそり座η星",
    designationEn: "Eta Scorpii",
    constellationJa: "さそり座",
    hip: 84143,
    vMag: 3.32,
    spectralType: "F5IV",
    distanceLy: 73,
    descriptionJa:
      "さそりの尾の途中にある黄白色の星です。",
    descriptionEn:
      "Eta Scorpii is a yellow-white star on the tail of the scorpion.",
  },
  {
    id: "sargas",
    nameJa: "サルガス",
    nameEn: "Sargas",
    designationJa: "さそり座θ星",
    designationEn: "Theta Scorpii",
    constellationJa: "さそり座",
    hip: 86228,
    vMag: 1.86,
    spectralType: "F1III",
    distanceLy: 300,
    distanceUncertain: true,
    descriptionJa:
      "さそりの尾の曲がり角にある明るい輝巨星です。日本からは南の低い空に見えます。",
    descriptionEn:
      "Sargas is a bright giant star at the bend of the scorpion's tail. From Japan, it is seen low in the southern sky.",
  },
  {
    id: "kappaSco",
    nameJa: "さそり座κ星",
    nameEn: "Kappa Scorpii",
    designationJa: "さそり座κ星",
    designationEn: "Kappa Scorpii",
    constellationJa: "さそり座",
    hip: 86670,
    vMag: 2.39,
    spectralType: "B1.5III",
    distanceLy: 480,
    descriptionJa:
      "さそりの尾の先、シャウラのすぐそばにある青白い巨星です。",
    descriptionEn:
      "Kappa Scorpii is a blue-white giant star near the tip of the scorpion's tail, close to Shaula.",
  },
  {
    id: "shaula",
    nameJa: "シャウラ",
    nameEn: "Shaula",
    designationJa: "さそり座λ星",
    designationEn: "Lambda Scorpii",
    constellationJa: "さそり座",
    hip: 85927,
    vMag: 1.62,
    spectralType: "B2IV",
    distanceLy: 570,
    distanceUncertain: true,
    descriptionJa:
      "さそりの尾の先の毒針にあたる星で、名前はアラビア語で「持ち上げた（尾）」を意味します。実は3つ以上の星が集まった多重星です。",
    descriptionEn:
      "Shaula is the stinger at the tip of the scorpion's tail. Its name means 'the raised tail' in Arabic. It is really a system of three or more stars.",
  },
  {
    id: "rasalhague",
    nameJa: "ラスアルハゲ",
    nameEn: "Rasalhague",
    designationJa: "へびつかい座α星",
    designationEn: "Alpha Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 86032,
    vMag: 2.08,
    spectralType: "A5IV",
    distanceLy: 49,
    descriptionJa:
      "へびつかい座でいちばん明るい星で、へびつかいの頭にあたります。名前はアラビア語で「へびをつかう者の頭」を意味します。",
    descriptionEn:
      "Rasalhague is the brightest star in Ophiuchus and marks the head of the serpent bearer. Its name means 'head of the serpent collector' in Arabic.",
  },
  {
    id: "cebalrai",
    nameJa: "ケバルライ",
    nameEn: "Cebalrai",
    designationJa: "へびつかい座β星",
    designationEn: "Beta Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 86742,
    vMag: 2.76,
    spectralType: "K2III",
    distanceLy: 82,
    descriptionJa:
      "へびつかいの肩にあるオレンジ色の巨星で、名前はアラビア語で「羊飼いの犬」を意味するといわれます。",
    descriptionEn:
      "Cebalrai is an orange giant star on the shoulder of Ophiuchus. Its name is said to mean 'the shepherd's dog' in Arabic.",
  },
  {
    id: "nuOph",
    nameJa: "へびつかい座ν星",
    nameEn: "Nu Ophiuchi",
    designationJa: "へびつかい座ν星",
    designationEn: "Nu Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 88048,
    vMag: 3.32,
    spectralType: "G9III",
    distanceLy: 150,
    descriptionJa:
      "へびつかい座の南東にある巨星で、まわりを2つの「褐色矮星」が回っていることが知られています。",
    descriptionEn:
      "Nu Ophiuchi is a giant star in the southeast of Ophiuchus. Two brown dwarfs, objects between planets and stars, go around it.",
  },
  {
    id: "sabik",
    nameJa: "サビク",
    nameEn: "Sabik",
    designationJa: "へびつかい座η星",
    designationEn: "Eta Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 84012,
    vMag: 2.43,
    spectralType: "A2IV-V",
    distanceLy: 88,
    descriptionJa:
      "へびつかいのひざのあたりにある2等星で、2つの白い星が回り合う連星です。",
    descriptionEn:
      "Sabik is a bright star near the knee of Ophiuchus. It is really two white stars that go around each other.",
  },
  {
    id: "thetaOph",
    nameJa: "へびつかい座θ星",
    nameEn: "Theta Ophiuchi",
    designationJa: "へびつかい座θ星",
    designationEn: "Theta Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 84970,
    vMag: 3.27,
    spectralType: "B2IV",
    distanceLy: 440,
    descriptionJa:
      "へびつかいの足元にある青白い星で、黄道のすぐそばにあります。太陽は毎年12月上旬ごろ、この星の近くを通ります。",
    descriptionEn:
      "Theta Ophiuchi is a blue-white star at the foot of Ophiuchus, close to the path of the Sun. Every year in early December, the Sun passes near this star.",
  },
  {
    id: "zetaOph",
    nameJa: "へびつかい座ζ星",
    nameEn: "Zeta Ophiuchi",
    designationJa: "へびつかい座ζ星",
    designationEn: "Zeta Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 81377,
    vMag: 2.54,
    spectralType: "O9.2IV",
    distanceLy: 370,
    distanceRangeLy: [370, 440],
    descriptionJa:
      "へびつかい座の南にある、とても高温で重い青白い星です。宇宙空間を速いスピードで突き進む「暴走星」として知られています。",
    descriptionEn:
      "Zeta Ophiuchi is a very hot and heavy blue-white star in the south of Ophiuchus. It is a 'runaway star' that is moving through space very fast.",
  },
  {
    id: "deltaOph",
    nameJa: "へびつかい座δ星",
    nameEn: "Delta Ophiuchi",
    designationJa: "へびつかい座δ星",
    designationEn: "Delta Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 79593,
    vMag: 2.73,
    spectralType: "M0.5III",
    distanceLy: 170,
    descriptionJa:
      "へびつかいの手にある赤い巨星です。",
    descriptionEn:
      "Delta Ophiuchi is a red giant star in the hand of Ophiuchus.",
  },
  {
    id: "kappaOph",
    nameJa: "へびつかい座κ星",
    nameEn: "Kappa Ophiuchi",
    designationJa: "へびつかい座κ星",
    designationEn: "Kappa Ophiuchi",
    constellationJa: "へびつかい座",
    hip: 83000,
    vMag: 3.19,
    spectralType: "K2III",
    distanceLy: 91,
    descriptionJa:
      "へびつかい座の北側にある、オレンジ色の巨星です。",
    descriptionEn:
      "Kappa Ophiuchi is an orange giant star in the northern part of Ophiuchus.",
  },
  {
    id: "alnasl",
    nameJa: "アルナスル",
    nameEn: "Alnasl",
    designationJa: "いて座γ2星",
    designationEn: "Gamma-2 Sagittarii",
    constellationJa: "いて座",
    hip: 88635,
    vMag: 2.98,
    spectralType: "K0III",
    distanceLy: 97,
    descriptionJa:
      "いて座のティーポット形の注ぎ口にあたる星で、名前はアラビア語で「矢じり」を意味します。この星の少し西が、天の川銀河の中心の方向です。",
    descriptionEn:
      "Alnasl is the spout of the Teapot in Sagittarius. Its name means 'the arrowhead' in Arabic. A little west of this star is the direction of the center of our Milky Way.",
  },
  {
    id: "kausMedia",
    nameJa: "カウス・メディア",
    nameEn: "Kaus Media",
    designationJa: "いて座δ星",
    designationEn: "Delta Sagittarii",
    constellationJa: "いて座",
    hip: 89931,
    vMag: 2.72,
    spectralType: "K2.5III",
    distanceLy: 350,
    distanceRangeLy: [350, 420],
    descriptionJa:
      "いて座のティーポットの胴体にあるオレンジ色の巨星で、名前は「弓の中央」という意味です。",
    descriptionEn:
      "Kaus Media is an orange giant star in the body of the Teapot. Its name means 'the middle of the bow.'",
  },
  {
    id: "kausAustralis",
    nameJa: "カウス・アウストラリス",
    nameEn: "Kaus Australis",
    designationJa: "いて座ε星",
    designationEn: "Epsilon Sagittarii",
    constellationJa: "いて座",
    hip: 90185,
    vMag: 1.79,
    spectralType: "B9IV",
    distanceLy: 140,
    descriptionJa:
      "いて座でいちばん明るい星で、ティーポットの底にあたります。名前は「弓の南の部分」を意味します。",
    descriptionEn:
      "Kaus Australis is the brightest star in Sagittarius and makes the bottom of the Teapot. Its name means 'the southern part of the bow.'",
  },
  {
    id: "lambdaSgr",
    nameJa: "いて座λ星",
    nameEn: "Lambda Sagittarii",
    designationJa: "いて座λ星",
    designationEn: "Lambda Sagittarii",
    constellationJa: "いて座",
    hip: 90496,
    vMag: 2.82,
    spectralType: "K1III",
    distanceLy: 78,
    descriptionJa:
      "いて座のティーポットのふたの先にあるオレンジ色の巨星で、「南斗六星」のひとつです。",
    descriptionEn:
      "Lambda Sagittarii is an orange giant star at the top of the Teapot's lid. It is one of the six stars of the 'Southern Dipper.'",
  },
  {
    id: "phiSgr",
    nameJa: "いて座φ星",
    nameEn: "Phi Sagittarii",
    designationJa: "いて座φ星",
    designationEn: "Phi Sagittarii",
    constellationJa: "いて座",
    hip: 92041,
    vMag: 3.17,
    spectralType: "B8III",
    distanceLy: 240,
    descriptionJa:
      "いて座のティーポットの胴体にある青白い巨星で、「南斗六星」のひとつです。",
    descriptionEn:
      "Phi Sagittarii is a blue-white giant star in the body of the Teapot. It is one of the six stars of the 'Southern Dipper.'",
  },
  {
    id: "nunki",
    nameJa: "ヌンキ",
    nameEn: "Nunki",
    designationJa: "いて座σ星",
    designationEn: "Sigma Sagittarii",
    constellationJa: "いて座",
    hip: 92855,
    vMag: 2.05,
    spectralType: "B2.5V",
    distanceLy: 230,
    descriptionJa:
      "いて座で2番目に明るい青白い星で、ティーポットの取っ手にあたり、「南斗六星」のひとつです。名前は古代バビロニアの言葉に由来するといわれます。",
    descriptionEn:
      "Nunki is the second brightest star in Sagittarius and is on the handle of the Teapot. It is one of the six stars of the 'Southern Dipper.' Its name is said to come from the old Babylonian language.",
  },
  {
    id: "ascella",
    nameJa: "アスケラ",
    nameEn: "Ascella",
    designationJa: "いて座ζ星",
    designationEn: "Zeta Sagittarii",
    constellationJa: "いて座",
    hip: 93506,
    vMag: 2.6,
    spectralType: "A2.5V",
    distanceLy: 88,
    descriptionJa:
      "いて座のティーポットの取っ手の下にある白い星で、「南斗六星」のひとつです。名前はラテン語で「わきの下」を意味します。",
    descriptionEn:
      "Ascella is a white star at the bottom of the Teapot's handle. It is one of the six stars of the 'Southern Dipper.' Its name means 'armpit' in Latin.",
  },
  {
    id: "tauSgr",
    nameJa: "いて座τ星",
    nameEn: "Tau Sagittarii",
    designationJa: "いて座τ星",
    designationEn: "Tau Sagittarii",
    constellationJa: "いて座",
    hip: 93864,
    vMag: 3.32,
    spectralType: "K1.5III",
    distanceLy: 120,
    descriptionJa:
      "いて座のティーポットの取っ手にあるオレンジ色の巨星で、「南斗六星」のひとつです。",
    descriptionEn:
      "Tau Sagittarii is an orange giant star on the handle of the Teapot. It is one of the six stars of the 'Southern Dipper.'",
  },
  {
    id: "algedi",
    nameJa: "アルゲディ",
    nameEn: "Algedi",
    designationJa: "やぎ座α2星",
    designationEn: "Alpha-2 Capricorni",
    constellationJa: "やぎ座",
    hip: 100064,
    vMag: 3.58,
    spectralType: "G9III",
    distanceLy: 110,
    descriptionJa:
      "やぎの角にあたる星で、名前はアラビア語で「子やぎ」を意味します。肉眼でもα1星と2つ並んで見えますが、2つの星の距離は大きくちがい、たまたま同じ方向に見えているだけです。",
    descriptionEn:
      "Algedi is on the horn of the goat. Its name means 'the young goat' in Arabic. You can see another star, Alpha-1, next to it with your eyes, but the two stars are at very different distances.",
  },
  {
    id: "dabih",
    nameJa: "ダビー",
    nameEn: "Dabih",
    designationJa: "やぎ座β1星",
    designationEn: "Beta-1 Capricorni",
    constellationJa: "やぎ座",
    hip: 100345,
    vMag: 3.05,
    spectralType: "K0II（連星）",
    distanceLy: 330,
    distanceRangeLy: [330, 390],
    descriptionJa:
      "やぎの角にある3等星で、望遠鏡で見ると黄色とうす青色の2つの星に分かれる二重星です。",
    descriptionEn:
      "Dabih is on the horn of the goat. With a telescope, you can see a yellow star and a pale blue star.",
  },
  {
    id: "psiCap",
    nameJa: "やぎ座ψ星",
    nameEn: "Psi Capricorni",
    designationJa: "やぎ座ψ星",
    designationEn: "Psi Capricorni",
    constellationJa: "やぎ座",
    hip: 102485,
    vMag: 4.13,
    spectralType: "F5V",
    distanceLy: 48,
    descriptionJa:
      "やぎの体の西側にある黄白色の星です。地球から約48光年と近くにあります。",
    descriptionEn:
      "Psi Capricorni is a yellow-white star in the western part of the goat's body. It is near us, only about 48 light-years away.",
  },
  {
    id: "zetaCap",
    nameJa: "やぎ座ζ星",
    nameEn: "Zeta Capricorni",
    designationJa: "やぎ座ζ星",
    designationEn: "Zeta Capricorni",
    constellationJa: "やぎ座",
    hip: 105881,
    vMag: 3.77,
    spectralType: "G4Ib",
    distanceLy: 390,
    descriptionJa:
      "やぎの体の下側にある黄色い超巨星です。",
    descriptionEn:
      "Zeta Capricorni is a yellow supergiant star in the lower part of the goat's body.",
  },
  {
    id: "nashira",
    nameJa: "ナシラ",
    nameEn: "Nashira",
    designationJa: "やぎ座γ星",
    designationEn: "Gamma Capricorni",
    constellationJa: "やぎ座",
    hip: 106985,
    vMag: 3.69,
    spectralType: "F型（Am星）",
    distanceLy: 160,
    descriptionJa:
      "やぎのしっぽにある星で、名前はアラビア語で「よい知らせを運ぶもの」という意味です。",
    descriptionEn:
      "Nashira is on the tail of the goat. Its name means 'the bringer of good news' in Arabic.",
  },
  {
    id: "denebAlgedi",
    nameJa: "デネブ・アルゲディ",
    nameEn: "Deneb Algedi",
    designationJa: "やぎ座δ星",
    designationEn: "Delta Capricorni",
    constellationJa: "やぎ座",
    hip: 107556,
    vMag: 2.85,
    spectralType: "A型（Am星）",
    distanceLy: 39,
    descriptionJa:
      "やぎ座でいちばん明るい星で、名前はアラビア語で「やぎのしっぽ」を意味します。2つの星がおたがいを隠し合う食連星で、約1日ごとに少し暗くなります。",
    descriptionEn:
      "Deneb Algedi is the brightest star in Capricornus. Its name means 'the tail of the goat' in Arabic. It is really two stars that hide each other, so it gets a little darker about once a day.",
  },
  {
    id: "thetaCap",
    nameJa: "やぎ座θ星",
    nameEn: "Theta Capricorni",
    designationJa: "やぎ座θ星",
    designationEn: "Theta Capricorni",
    constellationJa: "やぎ座",
    hip: 104139,
    vMag: 4.08,
    spectralType: "A1V",
    distanceLy: 160,
    descriptionJa:
      "やぎの背中にある白い主系列星です。",
    descriptionEn:
      "Theta Capricorni is a white star on the back of the goat.",
  },
  {
    id: "sadalsuud",
    nameJa: "サダルスウド",
    nameEn: "Sadalsuud",
    designationJa: "みずがめ座β星",
    designationEn: "Beta Aquarii",
    constellationJa: "みずがめ座",
    hip: 106278,
    vMag: 2.9,
    spectralType: "G0Ib",
    distanceLy: 540,
    descriptionJa:
      "みずがめ座でいちばん明るい星で、名前はアラビア語で「幸運の中の幸運」を意味します。黄色い超巨星です。",
    descriptionEn:
      "Sadalsuud is the brightest star in Aquarius. Its name means 'luckiest of the lucky' in Arabic. It is a yellow supergiant star.",
  },
  {
    id: "sadalmelik",
    nameJa: "サダルメリク",
    nameEn: "Sadalmelik",
    designationJa: "みずがめ座α星",
    designationEn: "Alpha Aquarii",
    constellationJa: "みずがめ座",
    hip: 109074,
    vMag: 2.95,
    spectralType: "G2Ib",
    distanceLy: 520,
    distanceRangeLy: [520, 660],
    descriptionJa:
      "みずがめ座で2番目に明るい黄色い超巨星で、名前はアラビア語で「王の幸運」を意味します。天の赤道のすぐ近くにあります。",
    descriptionEn:
      "Sadalmelik is the second brightest star in Aquarius. It is a yellow supergiant, and its name means 'the luck of the king' in Arabic. It is very close to the celestial equator.",
  },
  {
    id: "gammaAqr",
    nameJa: "みずがめ座γ星",
    nameEn: "Gamma Aquarii",
    designationJa: "みずがめ座γ星",
    designationEn: "Gamma Aquarii",
    constellationJa: "みずがめ座",
    hip: 110395,
    vMag: 3.86,
    spectralType: "A0V",
    distanceLy: 160,
    distanceRangeLy: [130, 160],
    descriptionJa:
      "みずがめの口にあたるY字形の「水がめ」を作る、白い主系列星です。",
    descriptionEn:
      "Gamma Aquarii is a white star that is part of the Water Jar, the Y-shaped group of stars in Aquarius.",
  },
  {
    id: "zetaAqr",
    nameJa: "みずがめ座ζ星",
    nameEn: "Zeta Aquarii",
    designationJa: "みずがめ座ζ星",
    designationEn: "Zeta Aquarii",
    constellationJa: "みずがめ座",
    hip: 110960,
    vMag: 3.65,
    spectralType: "F2V（連星）",
    distanceLy: 92,
    descriptionJa:
      "みずがめの口にあたるY字形の中心の星で、2つの黄白色の星が回り合う連星です。天の赤道のほぼ真上にあります。",
    descriptionEn:
      "Zeta Aquarii is the center of the Y-shaped Water Jar. It is really two yellow-white stars that go around each other. It is almost on the celestial equator.",
  },
  {
    id: "etaAqr",
    nameJa: "みずがめ座η星",
    nameEn: "Eta Aquarii",
    designationJa: "みずがめ座η星",
    designationEn: "Eta Aquarii",
    constellationJa: "みずがめ座",
    hip: 111497,
    vMag: 4.04,
    spectralType: "B8V",
    distanceLy: 170,
    descriptionJa:
      "みずがめの口にある白い星です。毎年5月上旬に見られる「みずがめ座η流星群」は、この星の近くから流れ星が飛び出すように見えます。",
    descriptionEn:
      "Eta Aquarii is a white star in the Water Jar. Every year in early May, the Eta Aquariid meteors seem to come from near this star.",
  },
  {
    id: "lambdaAqr",
    nameJa: "みずがめ座λ星",
    nameEn: "Lambda Aquarii",
    designationJa: "みずがめ座λ星",
    designationEn: "Lambda Aquarii",
    constellationJa: "みずがめ座",
    hip: 112961,
    vMag: 3.73,
    spectralType: "M2.5III",
    distanceLy: 390,
    descriptionJa:
      "みずがめからこぼれる水の流れにある赤い巨星です。",
    descriptionEn:
      "Lambda Aquarii is a red giant star in the stream of water that flows from the jar.",
  },
  {
    id: "skat",
    nameJa: "スカト",
    nameEn: "Skat",
    designationJa: "みずがめ座δ星",
    designationEn: "Delta Aquarii",
    constellationJa: "みずがめ座",
    hip: 113136,
    vMag: 3.27,
    spectralType: "A3V",
    distanceLy: 160,
    descriptionJa:
      "水の流れの先にある白い星で、名前はアラビア語で「すね」を意味するといわれます。7月下旬に見られる「みずがめ座δ南流星群」の名前のもとになった星です。",
    descriptionEn:
      "Skat is a white star at the end of the stream of water. Its name is said to mean 'the shin' in Arabic. The Southern Delta Aquariid meteors in late July are named after this star.",
  },
  {
    id: "caph",
    nameJa: "カフ",
    nameEn: "Caph",
    designationJa: "カシオペヤ座β星",
    designationEn: "Beta Cassiopeiae",
    constellationJa: "カシオペヤ座",
    hip: 746,
    vMag: 2.28,
    spectralType: "F2III",
    distanceLy: 55,
    descriptionJa:
      "カシオペヤ座のW字の西のはしにある星で、名前はアラビア語で「手のひら」を意味するといわれます。",
    descriptionEn:
      "Caph is at the west end of the W shape of Cassiopeia. Its name is said to mean 'the palm of the hand' in Arabic.",
  },
  {
    id: "schedar",
    nameJa: "シェダル",
    nameEn: "Schedar",
    designationJa: "カシオペヤ座α星",
    designationEn: "Alpha Cassiopeiae",
    constellationJa: "カシオペヤ座",
    hip: 3179,
    vMag: 2.24,
    spectralType: "K0III",
    distanceLy: 230,
    descriptionJa:
      "カシオペヤ座のW字の2番目にあたるオレンジ色の巨星で、名前はアラビア語で「胸」を意味します。",
    descriptionEn:
      "Schedar is the second star of the W shape of Cassiopeia. It is an orange giant, and its name means 'the breast' in Arabic.",
  },
  {
    id: "tsih",
    nameJa: "ツィー",
    nameEn: "Tsih",
    designationJa: "カシオペヤ座γ星",
    designationEn: "Gamma Cassiopeiae",
    constellationJa: "カシオペヤ座",
    hip: 4427,
    vMag: 2.15,
    spectralType: "B0.5IV",
    distanceLy: 550,
    descriptionJa:
      "カシオペヤ座のW字の真ん中にある青白い星で、まわりにガスの円盤を持つ「Be星」の代表です。明るさが不規則に変わります。",
    descriptionEn:
      "Tsih is the blue-white star in the middle of the W shape of Cassiopeia. It has a disk of gas around it, and its brightness changes without a regular pattern.",
  },
  {
    id: "ruchbah",
    nameJa: "ルクバー",
    nameEn: "Ruchbah",
    designationJa: "カシオペヤ座δ星",
    designationEn: "Delta Cassiopeiae",
    constellationJa: "カシオペヤ座",
    hip: 6686,
    vMag: 2.66,
    spectralType: "A5IV",
    distanceLy: 99,
    descriptionJa:
      "カシオペヤ座のW字の4番目の星で、名前はアラビア語で「ひざ」を意味します。2つの星がおたがいを隠し合う食連星です。",
    descriptionEn:
      "Ruchbah is the fourth star of the W shape of Cassiopeia. Its name means 'the knee' in Arabic. It is really two stars that hide each other.",
  },
  {
    id: "segin",
    nameJa: "セギン",
    nameEn: "Segin",
    designationJa: "カシオペヤ座ε星",
    designationEn: "Epsilon Cassiopeiae",
    constellationJa: "カシオペヤ座",
    hip: 8886,
    vMag: 3.35,
    spectralType: "B3V",
    distanceLy: 410,
    descriptionJa:
      "カシオペヤ座のW字の東のはしにある、青白い星です。",
    descriptionEn:
      "Segin is a blue-white star at the east end of the W shape of Cassiopeia.",
  },
  {
    id: "acrux",
    nameJa: "アクルックス",
    nameEn: "Acrux",
    designationJa: "みなみじゅうじ座α星",
    designationEn: "Alpha Crucis",
    constellationJa: "みなみじゅうじ座",
    hip: 60718,
    vMag: 0.77,
    spectralType: "B0.5IV（連星）",
    distanceLy: 320,
    descriptionJa:
      "南十字星でいちばん明るい星で、十字の下の端にあります。望遠鏡で見ると2つの青白い星に分かれる二重星です。名前は「α（アルファ）」と「Crux（クルックス）」を組み合わせて作られました。",
    descriptionEn:
      "Acrux is the brightest star in the Southern Cross and is at the bottom of the cross. With a telescope, it splits into two blue-white stars. Its name was made from 'Alpha' and 'Crux.'",
  },
  {
    id: "mimosa",
    nameJa: "ミモザ",
    nameEn: "Mimosa",
    designationJa: "みなみじゅうじ座β星",
    designationEn: "Beta Crucis",
    constellationJa: "みなみじゅうじ座",
    hip: 62434,
    vMag: 1.25,
    spectralType: "B1IV",
    distanceLy: 280,
    descriptionJa:
      "南十字星の東のはしにある青白い星で、全天に21個ある1等星のひとつです。",
    descriptionEn:
      "Mimosa is the blue-white star at the east end of the Southern Cross. It is one of the 21 brightest stars in the night sky.",
  },
  {
    id: "gacrux",
    nameJa: "ガクルックス",
    nameEn: "Gacrux",
    designationJa: "みなみじゅうじ座γ星",
    designationEn: "Gamma Crucis",
    constellationJa: "みなみじゅうじ座",
    hip: 61084,
    vMag: 1.59,
    spectralType: "M3.5III",
    distanceLy: 89,
    descriptionJa:
      "南十字星のてっぺんにある赤い巨星で、地球から約89光年と、南十字星の星の中ではいちばん近くにあります。十字の縦の線（ガクルックスからアクルックス）を約4.5倍のばすと、天の南極の近くに着きます。",
    descriptionEn:
      "Gacrux is the red giant star at the top of the Southern Cross. It is the closest star of the cross, only about 89 light-years away. If you make the line from Gacrux to Acrux about 4.5 times longer, it points to near the south celestial pole.",
  },
  {
    id: "imai",
    nameJa: "イマイ",
    nameEn: "Imai",
    designationJa: "みなみじゅうじ座δ星",
    designationEn: "Delta Crucis",
    constellationJa: "みなみじゅうじ座",
    hip: 59747,
    vMag: 2.79,
    spectralType: "B2IV",
    distanceLy: 350,
    distanceRangeLy: [350, 460],
    descriptionJa:
      "南十字星の西のはしにある青白い星です。名前はエチオピアのムルシの人々の言葉に由来し、国際天文学連合（IAU）が正式な名前として認めました。",
    descriptionEn:
      "Imai is the blue-white star at the west end of the Southern Cross. Its name comes from the language of the Mursi people of Ethiopia and was approved by the International Astronomical Union (IAU).",
  },
  {
    id: "ginan",
    nameJa: "ギナン",
    nameEn: "Ginan",
    designationJa: "みなみじゅうじ座ε星",
    designationEn: "Epsilon Crucis",
    constellationJa: "みなみじゅうじ座",
    hip: 60260,
    vMag: 3.59,
    spectralType: "K3III",
    distanceLy: 230,
    descriptionJa:
      "南十字星の十字の中にある5番目の星で、オレンジ色の巨星です。名前はオーストラリアの先住民ワルダマンの人々の言葉に由来します。",
    descriptionEn:
      "Ginan is the fifth star inside the Southern Cross. It is an orange giant, and its name comes from the language of the Wardaman people of Australia.",
  },
  {
    id: "dubhe",
    nameJa: "ドゥーベ",
    nameEn: "Dubhe",
    designationJa: "おおぐま座α星",
    designationEn: "Alpha Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 54061,
    vMag: 1.81,
    spectralType: "G9III（連星）",
    distanceLy: 120,
    descriptionJa:
      "北斗七星のひしゃくの先（水をくむ部分のふち）にある巨星で、名前はアラビア語で「熊」を意味します。メラクからドゥーベへの線を約5倍のばすと北極星に着くため、この2つの星は「指極星」と呼ばれます。",
    descriptionEn:
      "Dubhe is a giant star at the front edge of the bowl of the Big Dipper. Its name means 'the bear' in Arabic. If you make the line from Merak to Dubhe about five times longer, you will find Polaris, so these two stars are called 'the Pointers.'",
  },
  {
    id: "merak",
    nameJa: "メラク",
    nameEn: "Merak",
    designationJa: "おおぐま座β星",
    designationEn: "Beta Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 53910,
    vMag: 2.34,
    spectralType: "A1IV",
    distanceLy: 80,
    descriptionJa:
      "北斗七星のひしゃくの底の先にある白い星で、ドゥーベとともに北極星を探す目印の「指極星」になります。名前はアラビア語で「（熊の）腰」を意味します。",
    descriptionEn:
      "Merak is a white star at the bottom of the bowl of the Big Dipper. Together with Dubhe, it is one of 'the Pointers' that help us find Polaris. Its name means 'the loins (of the bear)' in Arabic.",
  },
  {
    id: "phecda",
    nameJa: "フェクダ",
    nameEn: "Phecda",
    designationJa: "おおぐま座γ星",
    designationEn: "Gamma Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 58001,
    vMag: 2.41,
    spectralType: "A0V",
    distanceLy: 83,
    descriptionJa:
      "北斗七星のひしゃくの底の東側にある白い星で、名前はアラビア語で「（熊の）もも」を意味します。",
    descriptionEn:
      "Phecda is a white star at the bottom of the bowl of the Big Dipper. Its name means 'the thigh (of the bear)' in Arabic.",
  },
  {
    id: "megrez",
    nameJa: "メグレズ",
    nameEn: "Megrez",
    designationJa: "おおぐま座δ星",
    designationEn: "Delta Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 59774,
    vMag: 3.32,
    spectralType: "A2V",
    distanceLy: 81,
    descriptionJa:
      "北斗七星のひしゃくと柄のつなぎ目にある星で、7つの中でいちばん暗い星です。名前はアラビア語で「しっぽの付け根」を意味します。",
    descriptionEn:
      "Megrez is where the bowl and the handle of the Big Dipper meet. It is the faintest of the seven stars. Its name means 'the base of the tail' in Arabic.",
  },
  {
    id: "alioth",
    nameJa: "アリオト",
    nameEn: "Alioth",
    designationJa: "おおぐま座ε星",
    designationEn: "Epsilon Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 62956,
    vMag: 1.76,
    spectralType: "A1III-IV",
    distanceLy: 83,
    descriptionJa:
      "北斗七星の柄の付け根にある星で、北斗七星でいちばん明るい星です。",
    descriptionEn:
      "Alioth is at the start of the handle of the Big Dipper. It is the brightest of the seven stars.",
  },
  {
    id: "mizar",
    nameJa: "ミザール",
    nameEn: "Mizar",
    designationJa: "おおぐま座ζ星",
    designationEn: "Zeta Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 65378,
    vMag: 2.23,
    spectralType: "A2V（連星）",
    distanceLy: 86,
    descriptionJa:
      "北斗七星の柄の中ほどにある星で、すぐそばに4等星の「アルコル」が並んでいます。昔は2つを見分けられるかで視力を試したと伝えられています。望遠鏡で見ると、ミザール自身も2つの星に分かれます。",
    descriptionEn:
      "Mizar is in the middle of the handle of the Big Dipper. A fainter star called Alcor is right next to it, and long ago people tested their eyesight by trying to see both. With a telescope, Mizar itself splits into two stars.",
  },
  {
    id: "alkaid",
    nameJa: "アルカイド",
    nameEn: "Alkaid",
    designationJa: "おおぐま座η星",
    designationEn: "Eta Ursae Majoris",
    constellationJa: "おおぐま座",
    hip: 67301,
    vMag: 1.85,
    spectralType: "B3V",
    distanceLy: 100,
    descriptionJa:
      "北斗七星の柄の先にある青白い星で、名前はアラビア語で「（棺をかつぐ人たちの）先頭」を意味する言葉に由来します。北斗七星の中で、いちばん表面温度の高い星です。",
    descriptionEn:
      "Alkaid is the blue-white star at the end of the handle of the Big Dipper. Its name comes from an Arabic word for 'the leader.' It is the hottest of the seven stars.",
  },
  {
    id: "muphrid",
    nameJa: "ムフリド",
    nameEn: "Muphrid",
    designationJa: "うしかい座η星",
    designationEn: "Eta Boötis",
    constellationJa: "うしかい座",
    hip: 67927,
    vMag: 2.68,
    spectralType: "G0IV",
    distanceLy: 37,
    descriptionJa:
      "アークトゥルスのすぐ西にある黄色い準巨星で、地球から約37光年と、アークトゥルスとほぼ同じ距離にあります。",
    descriptionEn:
      "Muphrid is a yellow star just west of Arcturus. It is about 37 light-years away, almost the same distance as Arcturus.",
  },
  {
    id: "izar",
    nameJa: "イザール",
    nameEn: "Izar",
    designationJa: "うしかい座ε星",
    designationEn: "Epsilon Boötis",
    constellationJa: "うしかい座",
    hip: 72105,
    vMag: 2.35,
    spectralType: "K0II-III（連星）",
    distanceLy: 200,
    distanceRangeLy: [200, 240],
    descriptionJa:
      "うしかいの腰にある星です。望遠鏡で見るとオレンジ色と青緑色の2つの星が寄りそう二重星で、その美しさから「プルケリマ（いちばん美しいもの）」とも呼ばれます。",
    descriptionEn:
      "Izar is on the waist of Boötes. With a telescope, you can see an orange star and a blue-green star very close together. Because it is so beautiful, it is also called Pulcherrima, 'the most beautiful.'",
  },
  {
    id: "deltaBoo",
    nameJa: "うしかい座δ星",
    nameEn: "Delta Boötis",
    designationJa: "うしかい座δ星",
    designationEn: "Delta Boötis",
    constellationJa: "うしかい座",
    hip: 74666,
    vMag: 3.46,
    spectralType: "G8III",
    distanceLy: 120,
    descriptionJa:
      "うしかいの肩のあたりにある巨星です。",
    descriptionEn:
      "Delta Boötis is a giant star near the shoulder of Boötes.",
  },
  {
    id: "nekkar",
    nameJa: "ネクカル",
    nameEn: "Nekkar",
    designationJa: "うしかい座β星",
    designationEn: "Beta Boötis",
    constellationJa: "うしかい座",
    hip: 73555,
    vMag: 3.49,
    spectralType: "G8III",
    distanceLy: 230,
    descriptionJa:
      "うしかいの頭にある巨星で、名前は「牛飼い」を意味する言葉に由来します。",
    descriptionEn:
      "Nekkar is a giant star on the head of Boötes. Its name comes from a word for 'the herdsman.'",
  },
  {
    id: "seginus",
    nameJa: "セギヌス",
    nameEn: "Seginus",
    designationJa: "うしかい座γ星",
    designationEn: "Gamma Boötis",
    constellationJa: "うしかい座",
    hip: 71075,
    vMag: 3.04,
    spectralType: "A7IV",
    distanceLy: 87,
    descriptionJa:
      "うしかいの肩にある白い星で、明るさがわずかに変わる変光星です。",
    descriptionEn:
      "Seginus is a white star on the shoulder of Boötes. Its brightness changes a tiny bit.",
  },
  {
    id: "rhoBoo",
    nameJa: "うしかい座ρ星",
    nameEn: "Rho Boötis",
    designationJa: "うしかい座ρ星",
    designationEn: "Rho Boötis",
    constellationJa: "うしかい座",
    hip: 71053,
    vMag: 3.57,
    spectralType: "K3III",
    distanceLy: 160,
    descriptionJa:
      "うしかい座の中ほどにある、オレンジ色の巨星です。",
    descriptionEn:
      "Rho Boötis is an orange giant star in the middle of Boötes.",
  },
  {
    id: "epsilonLyr",
    nameJa: "こと座ε星",
    nameEn: "Epsilon Lyrae",
    designationJa: "こと座ε星",
    designationEn: "Epsilon Lyrae",
    constellationJa: "こと座",
    hip: 91919,
    vMag: 4.67,
    spectralType: "A型（4重星）",
    distanceLy: 160,
    descriptionJa:
      "ベガのすぐ北東にある星です。双眼鏡で2つに分かれ、望遠鏡で見るとそれぞれがさらに2つに分かれる「ダブル・ダブル（二重の二重星）」として有名です。",
    descriptionEn:
      "Epsilon Lyrae is just northeast of Vega. With binoculars, it splits into two stars, and with a telescope, each of them splits into two again. It is famous as the 'Double Double.'",
  },
  {
    id: "zetaLyr",
    nameJa: "こと座ζ星",
    nameEn: "Zeta Lyrae",
    designationJa: "こと座ζ星",
    designationEn: "Zeta Lyrae",
    constellationJa: "こと座",
    hip: 91971,
    vMag: 4.34,
    spectralType: "A型（Am星）",
    distanceLy: 160,
    descriptionJa:
      "こと座の小さな平行四辺形の角にある白い星で、双眼鏡で2つに分かれる二重星です。",
    descriptionEn:
      "Zeta Lyrae is a white star at one corner of the small parallelogram of Lyra. With binoculars, it splits into two stars.",
  },
  {
    id: "deltaLyr",
    nameJa: "こと座δ2星",
    nameEn: "Delta-2 Lyrae",
    designationJa: "こと座δ2星",
    designationEn: "Delta-2 Lyrae",
    constellationJa: "こと座",
    hip: 92791,
    vMag: 4.22,
    spectralType: "M4II",
    distanceLy: 740,
    descriptionJa:
      "こと座の平行四辺形の角にある赤い輝巨星です。すぐ近くの青白いδ1星と並び、双眼鏡で色の違いを楽しめます。",
    descriptionEn:
      "Delta-2 Lyrae is a red bright giant at one corner of the parallelogram of Lyra. Next to it is the blue-white star Delta-1 Lyrae, and with binoculars you can enjoy their different colors.",
  },
  {
    id: "sulafat",
    nameJa: "スラファト",
    nameEn: "Sulafat",
    designationJa: "こと座γ星",
    designationEn: "Gamma Lyrae",
    constellationJa: "こと座",
    hip: 93194,
    vMag: 3.25,
    spectralType: "B9.5II-III",
    distanceLy: 620,
    descriptionJa:
      "こと座で2番目に明るい星で、名前はアラビア語で「亀」を意味します。シェリアクとの間に、ドーナツ形の「環状星雲（M57）」があります。",
    descriptionEn:
      "Sulafat is the second brightest star in Lyra. Its name means 'the tortoise' in Arabic. Between Sulafat and Sheliak is the Ring Nebula (M57), which looks like a donut.",
  },
  {
    id: "sheliak",
    nameJa: "シェリアク",
    nameEn: "Sheliak",
    designationJa: "こと座β星",
    designationEn: "Beta Lyrae",
    constellationJa: "こと座",
    hip: 92420,
    vMag: 3.52,
    spectralType: "B8.5Ib-II",
    distanceLy: 960,
    descriptionJa:
      "2つの星がおたがいを隠し合い、約13日の周期で明るさが変わる有名な食連星です。名前はアラビア語で「竪琴」を意味します。",
    descriptionEn:
      "Sheliak is a famous pair of stars that hide each other, so its brightness changes about every 13 days. Its name means 'the harp' in Arabic.",
  },
  {
    id: "tarazed",
    nameJa: "タラゼド",
    nameEn: "Tarazed",
    designationJa: "わし座γ星",
    designationEn: "Gamma Aquilae",
    constellationJa: "わし座",
    hip: 97278,
    vMag: 2.72,
    spectralType: "K3II",
    distanceLy: 400,
    distanceRangeLy: [400, 580],
    descriptionJa:
      "アルタイルのすぐ北にあるオレンジ色の輝巨星で、アルタイルをはさんで反対側のアルシャインと3つ並んだ姿が目印になります。",
    descriptionEn:
      "Tarazed is an orange bright giant just north of Altair. Tarazed, Altair, and Alshain make a short line of three stars.",
  },
  {
    id: "alshain",
    nameJa: "アルシャイン",
    nameEn: "Alshain",
    designationJa: "わし座β星",
    designationEn: "Beta Aquilae",
    constellationJa: "わし座",
    hip: 98036,
    vMag: 3.71,
    spectralType: "G8IV",
    distanceLy: 45,
    descriptionJa:
      "アルタイルをはさんでタラゼドの反対側にある黄色い準巨星です。地球から約45光年と近くにあります。",
    descriptionEn:
      "Alshain is a yellow star on the other side of Altair from Tarazed. It is near us, only about 45 light-years away.",
  },
  {
    id: "deltaAql",
    nameJa: "わし座δ星",
    nameEn: "Delta Aquilae",
    designationJa: "わし座δ星",
    designationEn: "Delta Aquilae",
    constellationJa: "わし座",
    hip: 95501,
    vMag: 3.36,
    spectralType: "F1IV-V",
    distanceLy: 51,
    descriptionJa:
      "わしの体の中ほどにある黄白色の星です。",
    descriptionEn:
      "Delta Aquilae is a yellow-white star in the middle of the eagle's body.",
  },
  {
    id: "zetaAql",
    nameJa: "わし座ζ星",
    nameEn: "Zeta Aquilae",
    designationJa: "わし座ζ星",
    designationEn: "Zeta Aquilae",
    constellationJa: "わし座",
    hip: 93747,
    vMag: 2.99,
    spectralType: "A0IV-V",
    distanceLy: 83,
    descriptionJa:
      "わし座の北のはしにある白い星です。",
    descriptionEn:
      "Zeta Aquilae is a white star at the north end of Aquila.",
  },
  {
    id: "lambdaAql",
    nameJa: "わし座λ星",
    nameEn: "Lambda Aquilae",
    designationJa: "わし座λ星",
    designationEn: "Lambda Aquilae",
    constellationJa: "わし座",
    hip: 93805,
    vMag: 3.43,
    spectralType: "B8.5V",
    distanceLy: 120,
    descriptionJa:
      "わし座の南のはしにある青白い星です。",
    descriptionEn:
      "Lambda Aquilae is a blue-white star at the south end of Aquila.",
  },
  {
    id: "thetaAql",
    nameJa: "わし座θ星",
    nameEn: "Theta Aquilae",
    designationJa: "わし座θ星",
    designationEn: "Theta Aquilae",
    constellationJa: "わし座",
    hip: 99473,
    vMag: 3.24,
    spectralType: "B9.5III",
    distanceLy: 290,
    distanceRangeLy: [230, 290],
    descriptionJa:
      "わし座の南東にある白い巨星です。",
    descriptionEn:
      "Theta Aquilae is a white giant star in the southeast of Aquila.",
  },
  {
    id: "sadr",
    nameJa: "サドル",
    nameEn: "Sadr",
    designationJa: "はくちょう座γ星",
    designationEn: "Gamma Cygni",
    constellationJa: "はくちょう座",
    hip: 100453,
    vMag: 2.23,
    spectralType: "F8Ib",
    distanceLy: 1800,
    distanceUncertain: true,
    descriptionJa:
      "はくちょう座の十字の中心にある黄白色の超巨星で、名前はアラビア語で「胸」を意味します。まわりには天の川の明るい星雲が広がっています。",
    descriptionEn:
      "Sadr is a yellow-white supergiant at the center of the cross of Cygnus. Its name means 'the chest' in Arabic. Around it, there are bright clouds of gas in the Milky Way.",
  },
  {
    id: "albireo",
    nameJa: "アルビレオ",
    nameEn: "Albireo",
    designationJa: "はくちょう座β1星",
    designationEn: "Beta-1 Cygni",
    constellationJa: "はくちょう座",
    hip: 95947,
    vMag: 3.05,
    spectralType: "K3II（二重星）",
    distanceLy: 430,
    distanceRangeLy: [360, 430],
    descriptionJa:
      "はくちょうのくちばしにある星で、望遠鏡で見るとオレンジ色と青色の2つの星が並ぶ、全天でも有名な美しい二重星です。宮沢賢治の『銀河鉄道の夜』にも「アルビレオの観測所」として登場します。",
    descriptionEn:
      "Albireo is the head of the swan. With a telescope, you can see an orange star and a blue star side by side. It is one of the most beautiful double stars in the sky.",
  },
  {
    id: "deltaCyg",
    nameJa: "はくちょう座δ星",
    nameEn: "Delta Cygni",
    designationJa: "はくちょう座δ星",
    designationEn: "Delta Cygni",
    constellationJa: "はくちょう座",
    hip: 97165,
    vMag: 2.86,
    spectralType: "B9.5IV",
    distanceLy: 170,
    descriptionJa:
      "はくちょうの西の翼にある白い星です。",
    descriptionEn:
      "Delta Cygni is a white star on the western wing of the swan.",
  },
  {
    id: "gienah",
    nameJa: "ギェナー",
    nameEn: "Gienah",
    designationJa: "はくちょう座ε星",
    designationEn: "Epsilon Cygni",
    constellationJa: "はくちょう座",
    hip: 102488,
    vMag: 2.48,
    spectralType: "K0III",
    distanceLy: 73,
    descriptionJa:
      "はくちょうの東の翼にあるオレンジ色の巨星で、名前はアラビア語で「翼」を意味します。",
    descriptionEn:
      "Gienah is an orange giant on the eastern wing of the swan. Its name means 'the wing' in Arabic.",
  },
  {
    id: "kappaCyg",
    nameJa: "はくちょう座κ星",
    nameEn: "Kappa Cygni",
    designationJa: "はくちょう座κ星",
    designationEn: "Kappa Cygni",
    constellationJa: "はくちょう座",
    hip: 94779,
    vMag: 3.8,
    spectralType: "G9III",
    distanceLy: 120,
    descriptionJa:
      "はくちょうの西の翼の先にある巨星です。8月中ごろに見られる「はくちょう座κ流星群」の名前のもとになった星です。",
    descriptionEn:
      "Kappa Cygni is a giant star at the tip of the western wing of the swan. The Kappa Cygnid meteors in mid-August are named after this star.",
  },
  {
    id: "zetaCyg",
    nameJa: "はくちょう座ζ星",
    nameEn: "Zeta Cygni",
    designationJa: "はくちょう座ζ星",
    designationEn: "Zeta Cygni",
    constellationJa: "はくちょう座",
    hip: 104732,
    vMag: 3.21,
    spectralType: "G8III",
    distanceLy: 140,
    descriptionJa:
      "はくちょうの東の翼の先にある巨星です。",
    descriptionEn:
      "Zeta Cygni is a giant star at the tip of the eastern wing of the swan.",
  },
  {
    id: "markab",
    nameJa: "マルカブ",
    nameEn: "Markab",
    designationJa: "ペガスス座α星",
    designationEn: "Alpha Pegasi",
    constellationJa: "ペガスス座",
    hip: 113963,
    vMag: 2.49,
    spectralType: "A0IV",
    distanceLy: 130,
    descriptionJa:
      "秋の四辺形の南西の角にある白い星で、名前はアラビア語で「鞍（くら）」を意味します。",
    descriptionEn:
      "Markab is a white star at the southwest corner of the Great Square of Pegasus. Its name means 'the saddle' in Arabic.",
  },
  {
    id: "scheat",
    nameJa: "シェアト",
    nameEn: "Scheat",
    designationJa: "ペガスス座β星",
    designationEn: "Beta Pegasi",
    constellationJa: "ペガスス座",
    hip: 113881,
    vMag: 2.44,
    spectralType: "M2.5II-III",
    distanceLy: 200,
    descriptionJa:
      "秋の四辺形の北西の角にある赤い星で、明るさが少し変わる変光星です。",
    descriptionEn:
      "Scheat is a red star at the northwest corner of the Great Square. Its brightness changes a little.",
  },
  {
    id: "algenib",
    nameJa: "アルゲニブ",
    nameEn: "Algenib",
    designationJa: "ペガスス座γ星",
    designationEn: "Gamma Pegasi",
    constellationJa: "ペガスス座",
    hip: 1067,
    vMag: 2.83,
    spectralType: "B2IV",
    distanceLy: 390,
    distanceRangeLy: [390, 470],
    descriptionJa:
      "秋の四辺形の南東の角にある青白い星で、明るさがわずかに変わる変光星です。",
    descriptionEn:
      "Algenib is a blue-white star at the southeast corner of the Great Square. Its brightness changes a tiny bit.",
  },
  {
    id: "alpheratz",
    nameJa: "アルフェラッツ",
    nameEn: "Alpheratz",
    designationJa: "アンドロメダ座α星",
    designationEn: "Alpha Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 677,
    vMag: 2.07,
    spectralType: "B8IV",
    distanceLy: 97,
    descriptionJa:
      "秋の四辺形の北東の角にある星で、アンドロメダ座のα星です。昔はペガスス座のδ星でもあり、2つの星座が共有する星として知られています。",
    descriptionEn:
      "Alpheratz is at the northeast corner of the Great Square. It is the brightest star of Andromeda, and long ago it was also counted as a star of Pegasus.",
  },
  {
    id: "enif",
    nameJa: "エニフ",
    nameEn: "Enif",
    designationJa: "ペガスス座ε星",
    designationEn: "Epsilon Pegasi",
    constellationJa: "ペガスス座",
    hip: 107315,
    vMag: 2.38,
    spectralType: "K2Ib-II",
    distanceLy: 690,
    descriptionJa:
      "ペガサスの鼻先にあるオレンジ色の超巨星で、名前はアラビア語で「鼻」を意味します。ペガスス座でいちばん明るい星です。",
    descriptionEn:
      "Enif is an orange supergiant on the nose of Pegasus. Its name means 'the nose' in Arabic. It is the brightest star in Pegasus.",
  },
  {
    id: "homam",
    nameJa: "ホマム",
    nameEn: "Homam",
    designationJa: "ペガスス座ζ星",
    designationEn: "Zeta Pegasi",
    constellationJa: "ペガスス座",
    hip: 112029,
    vMag: 3.41,
    spectralType: "B8.5IV",
    distanceLy: 200,
    descriptionJa:
      "ペガサスの首にある青白い星です。",
    descriptionEn:
      "Homam is a blue-white star on the neck of Pegasus.",
  },
  {
    id: "matar",
    nameJa: "マタル",
    nameEn: "Matar",
    designationJa: "ペガスス座η星",
    designationEn: "Eta Pegasi",
    constellationJa: "ペガスス座",
    hip: 112158,
    vMag: 2.93,
    spectralType: "G8II（連星）",
    distanceLy: 210,
    descriptionJa:
      "ペガサスの前足にある黄色い輝巨星で、名前はアラビア語で「幸運の雨」を意味するといわれます。",
    descriptionEn:
      "Matar is a yellow bright giant on the front leg of Pegasus. Its name is said to mean 'the lucky rain' in Arabic.",
  },
  {
    id: "deltaAnd",
    nameJa: "アンドロメダ座δ星",
    nameEn: "Delta Andromedae",
    designationJa: "アンドロメダ座δ星",
    designationEn: "Delta Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 3092,
    vMag: 3.27,
    spectralType: "K3III",
    distanceLy: 110,
    descriptionJa:
      "アンドロメダ姫の胸のあたりにある、オレンジ色の巨星です。",
    descriptionEn:
      "Delta Andromedae is an orange giant star near the chest of Princess Andromeda.",
  },
  {
    id: "mirach",
    nameJa: "ミラク",
    nameEn: "Mirach",
    designationJa: "アンドロメダ座β星",
    designationEn: "Beta Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 5447,
    vMag: 2.07,
    spectralType: "M0III",
    distanceLy: 200,
    descriptionJa:
      "アンドロメダ座でいちばん明るい星のひとつで、赤い巨星です。名前はアラビア語で「腰帯」を意味します。この星から北西にたどると、アンドロメダ銀河（M31）が見つかります。",
    descriptionEn:
      "Mirach is one of the brightest stars in Andromeda. It is a red giant, and its name means 'the girdle' in Arabic. If you go northwest from this star, you can find the Andromeda Galaxy (M31).",
  },
  {
    id: "almach",
    nameJa: "アルマク",
    nameEn: "Almach",
    designationJa: "アンドロメダ座γ1星",
    designationEn: "Gamma-1 Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 9640,
    vMag: 2.1,
    spectralType: "K2II（二重星）",
    distanceLy: 390,
    distanceUncertain: true,
    descriptionJa:
      "アンドロメダ姫の足元にある星で、望遠鏡で見るとオレンジ色と青色の2つの星が並ぶ美しい二重星です。",
    descriptionEn:
      "Almach is at the foot of Princess Andromeda. With a telescope, you can see an orange star and a blue star side by side.",
  },
  {
    id: "muAnd",
    nameJa: "アンドロメダ座μ星",
    nameEn: "Mu Andromedae",
    designationJa: "アンドロメダ座μ星",
    designationEn: "Mu Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 4436,
    vMag: 3.86,
    spectralType: "A6V",
    distanceLy: 130,
    descriptionJa:
      "ミラクとアンドロメダ銀河を結ぶ線の途中にある白い星です。",
    descriptionEn:
      "Mu Andromedae is a white star on the line between Mirach and the Andromeda Galaxy.",
  },
  {
    id: "nuAnd",
    nameJa: "アンドロメダ座ν星",
    nameEn: "Nu Andromedae",
    designationJa: "アンドロメダ座ν星",
    designationEn: "Nu Andromedae",
    constellationJa: "アンドロメダ座",
    hip: 3881,
    vMag: 4.53,
    spectralType: "B5V",
    distanceLy: 620,
    descriptionJa:
      "アンドロメダ銀河（M31）のすぐ近くに見える青白い星で、銀河を探す目印になります。もちろん実際には、銀河のほうがずっと遠くにあります。",
    descriptionEn:
      "Nu Andromedae is a blue-white star that looks very close to the Andromeda Galaxy, so it helps us find the galaxy. Of course, the galaxy is much, much farther away.",
  },
  {
    id: "bellatrix",
    nameJa: "ベラトリックス",
    nameEn: "Bellatrix",
    designationJa: "オリオン座γ星",
    designationEn: "Gamma Orionis",
    constellationJa: "オリオン座",
    hip: 25336,
    vMag: 1.64,
    spectralType: "B2III",
    distanceLy: 250,
    descriptionJa:
      "オリオンの西の肩にある青白い巨星で、名前はラテン語で「女性の戦士」を意味します。",
    descriptionEn:
      "Bellatrix is a blue-white giant on the western shoulder of Orion. Its name means 'female warrior' in Latin.",
  },
  {
    id: "saiph",
    nameJa: "サイフ",
    nameEn: "Saiph",
    designationJa: "オリオン座κ星",
    designationEn: "Kappa Orionis",
    constellationJa: "オリオン座",
    hip: 27366,
    vMag: 2.07,
    spectralType: "B0.5Ia",
    distanceLy: 650,
    descriptionJa:
      "オリオンの東の足にある青白い超巨星で、名前はアラビア語で「剣」を意味します。",
    descriptionEn:
      "Saiph is a blue-white supergiant on the eastern leg of Orion. Its name means 'the sword' in Arabic.",
  },
  {
    id: "mintaka",
    nameJa: "ミンタカ",
    nameEn: "Mintaka",
    designationJa: "オリオン座δ星",
    designationEn: "Delta Orionis",
    constellationJa: "オリオン座",
    hip: 25930,
    vMag: 2.25,
    spectralType: "O9.5II",
    distanceLy: 690,
    distanceUncertain: true,
    descriptionJa:
      "オリオン座の三つ星のうち、西のはしの星です。天の赤道のほぼ真上にあるため、地球上のどこから見てもほぼ真東から昇り、ほぼ真西に沈みます。名前はアラビア語で「帯」を意味します。",
    descriptionEn:
      "Mintaka is the western star of Orion's Belt. It is almost on the celestial equator, so from anywhere on Earth it rises almost due east and sets almost due west. Its name means 'the belt' in Arabic.",
  },
  {
    id: "alnilam",
    nameJa: "アルニラム",
    nameEn: "Alnilam",
    designationJa: "オリオン座ε星",
    designationEn: "Epsilon Orionis",
    constellationJa: "オリオン座",
    hip: 26311,
    vMag: 1.69,
    spectralType: "B0Ia",
    distanceLy: 2000,
    distanceUncertain: true,
    descriptionJa:
      "オリオン座の三つ星の真ん中にある青白い超巨星で、名前はアラビア語で「真珠の糸」を意味します。太陽の数十万倍の明るさで輝いていますが、遠いため距離はよく分かっていません。",
    descriptionEn:
      "Alnilam is the blue-white supergiant in the middle of Orion's Belt. Its name means 'string of pearls' in Arabic. It shines hundreds of thousands of times brighter than the Sun, but we do not know its exact distance.",
  },
  {
    id: "alnitak",
    nameJa: "アルニタク",
    nameEn: "Alnitak",
    designationJa: "オリオン座ζ星",
    designationEn: "Zeta Orionis",
    constellationJa: "オリオン座",
    hip: 26727,
    vMag: 1.74,
    spectralType: "O9.7Ib",
    distanceLy: 740,
    distanceUncertain: true,
    descriptionJa:
      "オリオン座の三つ星のうち、東のはしにある青白い超巨星で、名前はアラビア語で「帯」を意味します。すぐ南には、馬の頭の形をした暗い雲「馬頭星雲」があります。",
    descriptionEn:
      "Alnitak is the blue-white supergiant at the eastern end of Orion's Belt. Its name means 'the girdle' in Arabic. Just south of it is the Horsehead Nebula, a dark cloud shaped like a horse's head.",
  },
  {
    id: "meissa",
    nameJa: "メイサ",
    nameEn: "Meissa",
    designationJa: "オリオン座λ星",
    designationEn: "Lambda Orionis",
    constellationJa: "オリオン座",
    hip: 26207,
    vMag: 3.39,
    spectralType: "O8III",
    distanceLy: 1100,
    distanceUncertain: true,
    descriptionJa:
      "オリオンの頭にある星で、名前はアラビア語で「輝くもの」を意味するといわれます。まわりを、光るガスの大きな輪が取り囲んでいます。",
    descriptionEn:
      "Meissa marks the head of Orion. Its name is said to mean 'the shining one' in Arabic. A big ring of glowing gas surrounds it.",
  },
  {
    id: "mirzam",
    nameJa: "ミルザム",
    nameEn: "Mirzam",
    designationJa: "おおいぬ座β星",
    designationEn: "Beta Canis Majoris",
    constellationJa: "おおいぬ座",
    hip: 30324,
    vMag: 1.98,
    spectralType: "B1II-III",
    distanceLy: 490,
    descriptionJa:
      "おおいぬの前足にある青白い星で、名前はアラビア語で「先ぶれ（知らせるもの）」を意味します。シリウスより少し先に昇り、シリウスが昇ることを知らせるためといわれます。",
    descriptionEn:
      "Mirzam is a blue-white star on the front leg of the Great Dog. Its name means 'the herald' in Arabic, because it rises a little before Sirius.",
  },
  {
    id: "gammaCMa",
    nameJa: "おおいぬ座γ星",
    nameEn: "Gamma Canis Majoris",
    designationJa: "おおいぬ座γ星",
    designationEn: "Gamma Canis Majoris",
    constellationJa: "おおいぬ座",
    hip: 34045,
    vMag: 4.11,
    spectralType: "B8II",
    distanceLy: 440,
    descriptionJa:
      "おおいぬの頭のあたりにある、青白い輝巨星です。",
    descriptionEn:
      "Gamma Canis Majoris is a blue-white bright giant near the head of the Great Dog.",
  },
  {
    id: "wezen",
    nameJa: "ウェズン",
    nameEn: "Wezen",
    designationJa: "おおいぬ座δ星",
    designationEn: "Delta Canis Majoris",
    constellationJa: "おおいぬ座",
    hip: 34444,
    vMag: 1.83,
    spectralType: "F8Ia",
    distanceLy: 1600,
    distanceUncertain: true,
    descriptionJa:
      "おおいぬの腰にある黄白色の超巨星で、名前はアラビア語で「重さ」を意味します。太陽の数万倍の明るさで輝く、とても大きな星です。",
    descriptionEn:
      "Wezen is a yellow-white supergiant on the back of the Great Dog. Its name means 'the weight' in Arabic. It is a very big star that shines tens of thousands of times brighter than the Sun.",
  },
  {
    id: "adhara",
    nameJa: "アダーラ",
    nameEn: "Adhara",
    designationJa: "おおいぬ座ε星",
    designationEn: "Epsilon Canis Majoris",
    constellationJa: "おおいぬ座",
    hip: 33579,
    vMag: 1.5,
    spectralType: "B1.5II",
    distanceLy: 410,
    descriptionJa:
      "おおいぬの後ろ足にある青白い星で、おおいぬ座で2番目に明るい星です。約470万年前には、地球から見て全天でいちばん明るい星だったと考えられています。",
    descriptionEn:
      "Adhara is a blue-white star on the back leg of the Great Dog. It is the second brightest star in Canis Major. Scientists think it was the brightest star in Earth's sky about 4.7 million years ago.",
  },
  {
    id: "aludra",
    nameJa: "アルドラ",
    nameEn: "Aludra",
    designationJa: "おおいぬ座η星",
    designationEn: "Eta Canis Majoris",
    constellationJa: "おおいぬ座",
    hip: 35904,
    vMag: 2.45,
    spectralType: "B5Ia",
    distanceLy: 2000,
    distanceUncertain: true,
    descriptionJa:
      "おおいぬのしっぽの先にある青白い超巨星です。とても遠くにあるため、距離ははっきりしていません。",
    descriptionEn:
      "Aludra is a blue-white supergiant at the tip of the Great Dog's tail. It is very far away, so we do not know its exact distance.",
  },
  {
    id: "gomeisa",
    nameJa: "ゴメイサ",
    nameEn: "Gomeisa",
    designationJa: "こいぬ座β星",
    designationEn: "Beta Canis Minoris",
    constellationJa: "こいぬ座",
    hip: 36188,
    vMag: 2.89,
    spectralType: "B8V",
    distanceLy: 160,
    descriptionJa:
      "こいぬ座で2番目に明るい青白い星で、プロキオンの北西に並んでいます。まわりにガスの円盤を持つ「Be星」です。",
    descriptionEn:
      "Gomeisa is the second brightest star in Canis Minor and is northwest of Procyon. It is a blue-white star with a disk of gas around it.",
  },
  {
    id: "menkalinan",
    nameJa: "メンカリナン",
    nameEn: "Menkalinan",
    designationJa: "ぎょしゃ座β星",
    designationEn: "Beta Aurigae",
    constellationJa: "ぎょしゃ座",
    hip: 28360,
    vMag: 1.9,
    spectralType: "A1IV",
    distanceLy: 81,
    descriptionJa:
      "ぎょしゃ座で2番目に明るい白い星で、名前はアラビア語で「手綱を持つ者の肩」を意味します。2つの星がおたがいを隠し合う食連星です。",
    descriptionEn:
      "Menkalinan is the second brightest star in Auriga. Its name means 'the shoulder of the rein holder' in Arabic. It is really two stars that hide each other.",
  },
  {
    id: "thetaAur",
    nameJa: "ぎょしゃ座θ星",
    nameEn: "Theta Aurigae",
    designationJa: "ぎょしゃ座θ星",
    designationEn: "Theta Aurigae",
    constellationJa: "ぎょしゃ座",
    hip: 28380,
    vMag: 2.65,
    spectralType: "A0V",
    distanceLy: 170,
    descriptionJa:
      "ぎょしゃの五角形の東側にある白い星で、表面にケイ素などが多く見られる「化学特異星（Ap星）」です。",
    descriptionEn:
      "Theta Aurigae is a white star on the eastern side of the pentagon of Auriga. Its surface has a lot of silicon and some other elements.",
  },
  {
    id: "hassaleh",
    nameJa: "ハッサレー",
    nameEn: "Hassaleh",
    designationJa: "ぎょしゃ座ι星",
    designationEn: "Iota Aurigae",
    constellationJa: "ぎょしゃ座",
    hip: 23015,
    vMag: 2.69,
    spectralType: "K3II-III",
    distanceLy: 490,
    descriptionJa:
      "ぎょしゃの五角形の南西の角にある、オレンジ色の輝巨星です。",
    descriptionEn:
      "Hassaleh is an orange bright giant at the southwest corner of the pentagon of Auriga.",
  },
] as const satisfies readonly ConstellationStarSpec[];

/** 星座の星の解説カード ID（北極星とすばるを含みます） */
export type ConstellationStarId =
  | (typeof CONSTELLATION_STAR_SPECS)[number]["id"]
  | "polaris"
  | "pleiades";

/** スペクトル型の最初の英字（O・B・A・F・G・K・M）です。星の色を決めます。 */
export type SpectralLetter = "O" | "B" | "A" | "F" | "G" | "K" | "M";

/** 星の大きさの種類（光度階級から決めます） */
export type StarSizeClass =
  | "dwarf"
  | "subgiant"
  | "giant"
  | "brightGiant"
  | "supergiant";

/** スペクトル型の英字ごとの色の名前とカードの色です。 */
const SPECTRAL_COLORS: Record<
  SpectralLetter,
  { adjJa: string; shortJa: string; en: string; accent: string }
> = {
  O: { adjJa: "青白い", shortJa: "青白", en: "Blue-White", accent: "#93c5fd" },
  B: { adjJa: "青白い", shortJa: "青白", en: "Blue-White", accent: "#bae6fd" },
  A: { adjJa: "白い", shortJa: "白", en: "White", accent: "#e0f2fe" },
  F: { adjJa: "黄白色の", shortJa: "黄白", en: "Yellow-White", accent: "#fef9c3" },
  G: { adjJa: "黄色い", shortJa: "黄", en: "Yellow", accent: "#fde68a" },
  K: { adjJa: "橙色の", shortJa: "橙", en: "Orange", accent: "#fdba74" },
  M: { adjJa: "赤い", shortJa: "赤", en: "Red", accent: "#fb923c" },
};

/** 星の大きさの種類ごとの名前です。 */
const SIZE_CLASS_NAMES: Record<StarSizeClass, { ja: string; en: string }> = {
  dwarf: { ja: "主系列星", en: "Main-Sequence Star" },
  subgiant: { ja: "準巨星", en: "Subgiant" },
  giant: { ja: "巨星", en: "Giant" },
  brightGiant: { ja: "輝巨星", en: "Bright Giant" },
  supergiant: { ja: "超巨星", en: "Supergiant" },
};

/** スペクトル型（例："K0III"）から、最初の英字（例："K"）を取り出します。 */
export function getSpectralLetter(spectralType: string): SpectralLetter {
  const match = spectralType.match(/[OBAFGKM]/);
  if (match) {
    return match[0] as SpectralLetter;
  }
  return "A";
}

/**
 * スペクトル型の光度階級（ローマ数字）から、星の大きさの種類を決めます。
 * 例：V は主系列星、IV は準巨星、III は巨星、II は輝巨星、I（Ia・Iab・Ib）は超巨星です。
 */
export function getStarSizeClass(spectralType: string): StarSizeClass {
  // 英字と数字のすぐ後ろにあるローマ数字を読みます（「II-III」のときは先に書かれた II を使います）
  const match = spectralType.match(/[OBAFGKM][0-9.]*(Iab|Ia|Ib|III|II|IV|V|I)?/);
  const lum = match ? match[1] : undefined;
  if (lum === "V") return "dwarf";
  if (lum === "IV") return "subgiant";
  if (lum === "III") return "giant";
  if (lum === "II") return "brightGiant";
  if (lum === "I" || lum === "Ia" || lum === "Iab" || lum === "Ib") {
    return "supergiant";
  }
  // 光度階級を書いていない星（連星としてまとめて書いた星など）は主系列星として扱います
  return "dwarf";
}

/** 数字を「1,234」のように3けたごとにカンマで区切ります。 */
function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** 距離の表示（例：「約120光年」「約1,100〜1,400光年（資料で差あり）」） */
export function formatStarDistanceJa(spec: {
  distanceLy: number;
  distanceRangeLy?: readonly [number, number];
  distanceUncertain?: boolean;
}): string {
  if (spec.distanceRangeLy) {
    const [lo, hi] = spec.distanceRangeLy;
    return `約${formatNumber(lo)}〜${formatNumber(hi)}光年（資料で差あり）`;
  }
  if (spec.distanceUncertain) {
    return `約${formatNumber(spec.distanceLy)}光年（誤差が大きい）`;
  }
  return `約${formatNumber(spec.distanceLy)}光年`;
}

/** 見かけの等級の表示（例：「+1.79等」「-0.05等」） */
export function formatMagnitude(vMag: number): string {
  const sign = vMag >= 0 ? "+" : "";
  return `${sign}${vMag.toFixed(2)}等`;
}

/** 1つの星の照合した値から、解説カードのデータを作ります。 */
function buildStarProfile(spec: ConstellationStarSpec): CelestialBodyProfile {
  const letter = getSpectralLetter(spec.spectralType);
  const sizeClass = getStarSizeClass(spec.spectralType);
  const color = SPECTRAL_COLORS[letter];
  const sizeName = SIZE_CLASS_NAMES[sizeClass];
  // 英語の分類には、英数字だけで書けるスペクトル型だけを添えます（「A型（連星）」などは添えません）
  const isAsciiType = /^[A-Za-z0-9.\-]+$/.test(spec.spectralType);
  const facts: CelestialBodyFact[] = [
    { labelJa: "距離", value: formatStarDistanceJa(spec) },
    { labelJa: "明るさ（等級）", value: formatMagnitude(spec.vMag) },
    {
      labelJa: "スペクトル型・色",
      value: `${spec.spectralType}・${color.shortJa}`,
    },
  ];
  return {
    id: spec.id as ConstellationStarId,
    nameJa: spec.nameJa,
    nameEn:
      spec.nameEn === spec.designationEn
        ? spec.nameEn
        : `${spec.nameEn} (${spec.designationEn})`,
    categoryJa: `${color.adjJa}${sizeName.ja}（${spec.designationJa}）`,
    categoryEn: isAsciiType
      ? `${color.en} ${sizeName.en} (${spec.spectralType})`
      : `${color.en} ${sizeName.en}`,
    symbol: "★",
    accentColor: color.accent,
    facts,
    descriptionJa: spec.descriptionJa,
    descriptionEn: spec.descriptionEn,
    cardKind: "star",
    starVisual: { spectralLetter: letter, sizeClass },
  };
}

/** 北極星（こぐま座α星）の解説データです。 */
const POLARIS_PROFILE: CelestialBodyProfile = {
  id: "polaris",
  nameJa: "北極星（ポラリス）",
  nameEn: "Polaris (Alpha Ursae Minoris)",
  categoryJa: "黄白色の超巨星（こぐま座・こぐま座α星）",
  categoryEn: "Yellow-White Supergiant (F8Ib)",
  symbol: "★",
  accentColor: "#fef9c3",
  facts: [
    // Hipparcos 新整約版の年周視差 7.54 ミリ秒角（誤差 0.11）から計算すると約433光年
    { labelJa: "距離", value: "約430光年" },
    { labelJa: "明るさ（等級）", value: "+1.97等" },
    { labelJa: "スペクトル型・色", value: "F8Ib・黄白" },
  ],
  descriptionJa:
    "こぐま座のしっぽの先にある2等星で、天の北極のすぐ近くにあるため、ほとんど動かずに北の空で輝き続ける「北極星」です。北極星の高さ（高度）は、見ている場所の北緯とほぼ同じになります。ふくらんだり縮んだりして明るさがわずかに変わる「ケフェイド変光星」でもあります。",
  descriptionEn:
    "Polaris is the North Star at the end of the tail of Ursa Minor. It is very close to the north celestial pole, so it almost does not move in the night sky. Its height above the horizon is almost the same as your latitude. It is also a star that grows and shrinks, so its brightness changes a tiny bit.",
  cardKind: "star",
  starVisual: { spectralLetter: "F", sizeClass: "supergiant" },
};

/** すばる（プレアデス星団・M45）の解説データです。 */
const PLEIADES_PROFILE: CelestialBodyProfile = {
  id: "pleiades",
  nameJa: "すばる（プレアデス星団）",
  nameEn: "Pleiades (M45)",
  categoryJa: "散開星団（おうし座）",
  categoryEn: "Open Star Cluster",
  symbol: "✶",
  accentColor: "#bae6fd",
  facts: [
    // Gaia DR2（Gaia Collaboration 2018）の星団の年周視差 7.364 ミリ秒角から計算すると約443光年
    { labelJa: "距離", value: "約440光年" },
    { labelJa: "星の数", value: "1,000個以上" },
    { labelJa: "種類", value: "散開星団（M45）" },
  ],
  descriptionJa:
    "おうし座の肩のあたりにある、若い星がたくさん集まった散開星団です。日本では昔から「すばる」と呼ばれ、清少納言の『枕草子』にも「星はすばる」と書かれています。肉眼では6〜7個の青白い星が小さくまとまって見えますが、実際には1,000個以上の星の集まりです。",
  descriptionEn:
    "The Pleiades is a group of young stars on the shoulder of Taurus. In Japan it is called Subaru. With your eyes, you can see six or seven blue-white stars close together, but there are more than 1,000 stars in the group.",
  cardKind: "starCluster",
};

/** 星座の星の解説カードを、ID ごとにまとめたものです。 */
export const CONSTELLATION_STAR_PROFILES = (() => {
  const result = {} as Record<ConstellationStarId, CelestialBodyProfile>;
  for (const spec of CONSTELLATION_STAR_SPECS) {
    result[spec.id] = buildStarProfile(spec);
  }
  result.polaris = POLARIS_PROFILE;
  result.pleiades = PLEIADES_PROFILE;
  return result;
})();
