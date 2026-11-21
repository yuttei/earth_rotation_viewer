import React, { useId } from "react";
import { Globe2, X } from "lucide-react";
import {
  CELESTIAL_BODY_PROFILES,
  CelestialBodyId,
} from "../data/celestialBodies";
import { SkyObjectIllustration } from "./SkyObjectIllustration";

interface CelestialBodyCardProps {
  /** 現在フォーカス表示中の天体ID */
  bodyId: CelestialBodyId;
  /** カードを閉じて元の視点へ戻すハンドラ */
  onClose: () => void;
}

/**
 * 各天体の特徴（土星の環・木星の大赤斑・地球の大陸・冥王星のハート模様など）を
 * 鮮やかに描く SVG イラストコンポーネントです。
 */
const CelestialIllustration: React.FC<{
  bodyId: CelestialBodyId;
  nameJa: string;
}> = ({ bodyId, nameJa }) => {
  const uid = useId().replace(/:/g, "");
  const gradId = `cb-grad-${bodyId}-${uid}`;
  const glowId = `cb-glow-${bodyId}-${uid}`;
  const clipId = `cb-clip-${bodyId}-${uid}`;

  // 星座の星・星座・星座の形・宇宙の構造など、種類（cardKind）がある対象は、種類ごとの共通の絵を描きます
  const kindProfile = CELESTIAL_BODY_PROFILES[bodyId];
  if (kindProfile.cardKind) {
    return (
      <SkyObjectIllustration profile={kindProfile} idPrefix={`cb-kind-${uid}`} />
    );
  }

  const cx = 80;
  const cy = 62;
  const r = bodyId === "saturn" ? 32 : bodyId === "uranus" ? 34 : 40;

  const FIXED_STAR_STYLES: Partial<
    Record<
      CelestialBodyId,
      { core: string; mid: string; halo: string; starR: number; showSunDot?: boolean }
    >
  > = {
    sirius: { core: "#ffffff", mid: "#bae6fd", halo: "#38bdf8", starR: 25, showSunDot: true },
    betelgeuse: { core: "#fef3c7", mid: "#f97316", halo: "#dc2626", starR: 38, showSunDot: true },
    procyon: { core: "#ffffff", mid: "#fef9c3", halo: "#facc15", starR: 24, showSunDot: true },
    rigel: { core: "#ffffff", mid: "#93c5fd", halo: "#2563eb", starR: 34, showSunDot: true },
    aldebaran: { core: "#fef3c7", mid: "#fb923c", halo: "#ea580c", starR: 33, showSunDot: true },
    capella: { core: "#fffbeb", mid: "#fde047", halo: "#d97706", starR: 28, showSunDot: true },
    pollux: { core: "#fff7ed", mid: "#fdba74", halo: "#ea580c", starR: 27, showSunDot: true },
    arcturus: { core: "#fff7ed", mid: "#fb923c", halo: "#ea580c", starR: 31, showSunDot: true },
    spica: { core: "#ffffff", mid: "#93c5fd", halo: "#3b82f6", starR: 28, showSunDot: true },
    denebola: { core: "#ffffff", mid: "#e0f2fe", halo: "#38bdf8", starR: 23, showSunDot: true },
    vega: { core: "#ffffff", mid: "#bfdbfe", halo: "#3b82f6", starR: 26, showSunDot: true },
    altair: { core: "#ffffff", mid: "#e0f2fe", halo: "#60a5fa", starR: 24, showSunDot: true },
    deneb: { core: "#ffffff", mid: "#dbeafe", halo: "#38bdf8", starR: 36, showSunDot: true },
    fomalhaut: { core: "#ffffff", mid: "#e0f2fe", halo: "#38bdf8", starR: 24, showSunDot: true },
    alphaCentauri: { core: "#fffbeb", mid: "#fde047", halo: "#eab308", starR: 22, showSunDot: true },
  };

  const fixedStarStyle = FIXED_STAR_STYLES[bodyId];
  if (fixedStarStyle) {
    return (
      <svg
        className="celestial-art-svg"
        viewBox="0 0 160 124"
        width="160"
        height="124"
        role="img"
        aria-label={`${nameJa}のイラスト`}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={fixedStarStyle.core} stopOpacity="0.98" />
            <stop offset="40%" stopColor={fixedStarStyle.mid} stopOpacity="0.58" />
            <stop offset="100%" stopColor={fixedStarStyle.halo} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={gradId} cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor={fixedStarStyle.core} />
            <stop offset="65%" stopColor={fixedStarStyle.mid} />
            <stop offset="100%" stopColor={fixedStarStyle.halo} />
          </radialGradient>
        </defs>
        <circle cx="18" cy="22" r="1.0" fill="#e2e8f0" opacity="0.65" />
        <circle cx="144" cy="20" r="1.2" fill="#bae6fd" opacity="0.65" />
        <circle cx="24" cy="102" r="1.0" fill="#fde68a" opacity="0.55" />
        <circle cx="140" cy="96" r="1.1" fill="#e2e8f0" opacity="0.6" />
        {/* 恒星のコロナと4方向回折スパイク */}
        <circle cx={cx} cy={cy} r={fixedStarStyle.starR + 22} fill={`url(#${glowId})`} />
        <line
          x1={cx - fixedStarStyle.starR - 20}
          y1={cy}
          x2={cx + fixedStarStyle.starR + 20}
          y2={cy}
          stroke={fixedStarStyle.core}
          strokeWidth="1.6"
          opacity="0.72"
        />
        <line
          x1={cx}
          y1={cy - fixedStarStyle.starR - 18}
          x2={cx}
          y2={cy + fixedStarStyle.starR + 18}
          stroke={fixedStarStyle.core}
          strokeWidth="1.6"
          opacity="0.72"
        />
        {bodyId === "fomalhaut" && (
          <ellipse
            cx={cx}
            cy={cy}
            rx="52"
            ry="18"
            transform={`rotate(-16 ${cx} ${cy})`}
            fill="none"
            stroke="#bae6fd"
            strokeWidth="2.2"
            strokeDasharray="5 3"
            opacity="0.62"
          />
        )}
        <circle cx={cx} cy={cy} r={fixedStarStyle.starR} fill={`url(#${gradId})`} />
        {/* 伴星（シリウスB・アルファケンタウリBなど） */}
        {bodyId === "sirius" && (
          <circle cx={cx + 34} cy={cy + 14} r="3.2" fill="#ffffff" opacity="0.92" />
        )}
        {bodyId === "alphaCentauri" && (
          <>
            <circle cx={cx + 28} cy={cy - 10} r="10" fill="#fb923c" opacity="0.88" />
            <circle cx={cx - 38} cy={cy + 22} r="3.4" fill="#ef4444" opacity="0.9" />
          </>
        )}
        {fixedStarStyle.showSunDot && (
          <g>
            <circle cx="26" cy="108" r="3.5" fill="#fbbf24" />
            <text x="34" y="111" fill="#94a3b8" fontSize="8.5">
              太陽(色比較)
            </text>
          </g>
        )}
      </svg>
    );
  }

  const isCosmicStructure =
    bodyId === "milkyWay" ||
    bodyId === "andromeda" ||
    bodyId === "triangulum" ||
    bodyId === "magellanicClouds" ||
    bodyId === "localGroup" ||
    bodyId === "virgoCluster" ||
    bodyId === "fornaxCluster" ||
    bodyId === "comaCluster" ||
    bodyId === "greatAttractor" ||
    bodyId === "laniakea" ||
    bodyId === "observableUniverse";

  // 銀河・銀河群・銀河団向けの専用イラストを描画します。
  if (isCosmicStructure) {
    return (
      <svg
        className="celestial-art-svg"
        viewBox="0 0 160 124"
        width="160"
        height="124"
        role="img"
        aria-label={`${nameJa}のイラスト`}
      >
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#93c5fd" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="18" cy="20" r="1.0" fill="#e2e8f0" opacity="0.65" />
        <circle cx="142" cy="18" r="1.2" fill="#bae6fd" opacity="0.65" />
        <circle cx="24" cy="106" r="1.1" fill="#fde68a" opacity="0.55" />
        <circle cx="138" cy="102" r="1.0" fill="#c4b5fd" opacity="0.65" />

        {bodyId === "milkyWay" && (
          <g transform={`rotate(-18 ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx="64" ry="30" fill={`url(#${glowId})`} />
            <path
              d="M 80 62 C 98 54, 126 52, 138 64 C 122 80, 92 84, 62 76"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.72"
            />
            <path
              d="M 80 62 C 62 70, 34 72, 22 60 C 38 44, 68 40, 98 48"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.72"
            />
            <path
              d="M 80 62 C 96 72, 118 76, 128 68"
              fill="none"
              stroke="#f472b6"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <ellipse cx={cx} cy={cy} rx="19" ry="7" fill="#fef3c7" opacity="0.92" />
            <circle cx={cx} cy={cy} r="7" fill="#ffffff" opacity="0.95" />
            {/* 太陽系の位置（オリオン腕） */}
            <circle cx={cx + 28} cy={cy + 8} r="3.2" fill="#fbbf24" />
            <circle
              cx={cx + 28}
              cy={cy + 8}
              r="6"
              fill="none"
              stroke="#fde68a"
              strokeWidth="1.2"
            />
          </g>
        )}

        {bodyId === "andromeda" && (
          <g transform={`rotate(-28 ${cx} ${cy})`}>
            <ellipse cx={cx} cy={cy} rx="72" ry="26" fill={`url(#${glowId})`} />
            <ellipse
              cx={cx}
              cy={cy}
              rx="62"
              ry="19"
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="3.2"
              opacity="0.72"
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx="44"
              ry="13"
              fill="none"
              stroke="#93c5fd"
              strokeWidth="3.8"
              opacity="0.78"
            />
            <ellipse cx={cx} cy={cy} rx="22" ry="9" fill="#fde68a" opacity="0.88" />
            <circle cx={cx} cy={cy} r="7.5" fill="#ffffff" opacity="0.96" />
          </g>
        )}

        {bodyId === "triangulum" && (
          <g>
            <circle cx={cx} cy={cy} r="46" fill={`url(#${glowId})`} />
            <path
              d="M 80 62 C 95 44, 118 46, 122 64 C 124 84, 98 96, 74 92"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 80 62 C 65 80, 42 78, 38 60 C 36 40, 62 28, 86 32"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <circle cx={cx + 24} cy={cy - 10} r="2.8" fill="#f472b6" opacity="0.8" />
            <circle cx={cx - 22} cy={cy + 14} r="2.6" fill="#f472b6" opacity="0.8" />
            <circle cx={cx} cy={cy} r="8" fill="#fef3c7" opacity="0.95" />
          </g>
        )}

        {bodyId === "magellanicClouds" && (
          <g>
            <ellipse cx="62" cy="58" rx="32" ry="20" fill="#38bdf8" opacity="0.28" />
            <ellipse cx="62" cy="58" rx="20" ry="11" fill="#bae6fd" opacity="0.65" />
            <circle cx="56" cy="54" r="4" fill="#f472b6" opacity="0.8" />
            <circle cx="68" cy="60" r="3" fill="#ffffff" opacity="0.9" />
            <ellipse cx="114" cy="76" rx="18" ry="12" fill="#93c5fd" opacity="0.32" />
            <ellipse cx="114" cy="76" rx="10" ry="6.5" fill="#e0f2fe" opacity="0.72" />
          </g>
        )}

        {bodyId === "localGroup" && (
          <g>
            <circle
              cx={cx}
              cy={cy}
              r="52"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              opacity="0.55"
            />
            {/* 天の川銀河 */}
            <g transform="translate(52 70) rotate(-18)">
              <ellipse rx="18" ry="7" fill="#60a5fa" opacity="0.8" />
              <circle r="4" fill="#fef3c7" />
            </g>
            {/* アンドロメダ銀河 */}
            <g transform="translate(106 48) rotate(-26)">
              <ellipse rx="23" ry="8.5" fill="#c4b5fd" opacity="0.85" />
              <circle r="4.8" fill="#ffffff" />
            </g>
            {/* さんかく座銀河 */}
            <circle cx="116" cy="78" r="6" fill="#67e8f9" opacity="0.8" />
            {/* 矮小銀河群 */}
            <circle cx="42" cy="84" r="2.6" fill="#bae6fd" />
            <circle cx="64" cy="44" r="2" fill="#cbd5e1" />
            <circle cx="82" cy="88" r="2.2" fill="#e9d5ff" />
            <circle cx="90" cy="34" r="1.8" fill="#cbd5e1" />
            <circle cx="122" cy="58" r="2" fill="#bae6fd" />
            <circle cx="38" cy="54" r="1.8" fill="#e2e8f0" />
          </g>
        )}

        {bodyId === "virgoCluster" && (
          <g>
            {/* 宇宙の大規模構造フィラメント */}
            <path
              d="M 14 96 Q 54 78 80 62 T 146 30"
              fill="none"
              stroke="#818cf8"
              strokeWidth="2.4"
              opacity="0.45"
            />
            <path
              d="M 24 24 Q 58 50 80 62 T 136 100"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.0"
              opacity="0.42"
            />
            <circle cx={cx} cy={cy} r="44" fill={`url(#${glowId})`} />
            {/* 中心の巨大楕円銀河 M87 と密集する銀河団 */}
            <circle cx={cx} cy={cy} r="9" fill="#fde68a" opacity="0.95" />
            <circle cx="64" cy="52" r="3.2" fill="#bae6fd" />
            <circle cx="96" cy="54" r="3.5" fill="#fef3c7" />
            <circle cx="72" cy="78" r="2.8" fill="#c4b5fd" />
            <circle cx="94" cy="74" r="2.5" fill="#93c5fd" />
            <circle cx="52" cy="68" r="2.2" fill="#fde68a" />
            <circle cx="108" cy="62" r="2.4" fill="#bae6fd" />
            <circle cx="82" cy="40" r="2.5" fill="#e9d5ff" />
            <circle cx="32" cy="86" r="3.4" fill="#38bdf8" />
            <circle cx="128" cy="38" r="3.0" fill="#c4b5fd" />
          </g>
        )}

        {bodyId === "fornaxCluster" && (
          <g>
            <circle cx={cx} cy={cy} r="42" fill={`url(#${glowId})`} />
            {/* 中心の巨大楕円銀河 NGC 1399 */}
            <ellipse cx={cx} cy={cy} rx="12" ry="9" fill="#fde68a" opacity="0.92" />
            <circle cx={cx} cy={cy} r="5" fill="#ffffff" opacity="0.95" />
            {/* 美しい棒渦巻銀河 NGC 1365 をイメージした伴銀河 */}
            <g transform="translate(48 76) rotate(-25)">
              <ellipse rx="13" ry="5.5" fill="none" stroke="#60a5fa" strokeWidth="2.2" opacity="0.85" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#fef3c7" strokeWidth="2.2" />
            </g>
            {/* 周囲の密集銀河群 */}
            <circle cx="106" cy="48" r="4.2" fill="#93c5fd" opacity="0.9" />
            <circle cx="114" cy="74" r="3.2" fill="#bae6fd" opacity="0.85" />
            <circle cx="62" cy="40" r="3.0" fill="#e9d5ff" opacity="0.85" />
            <circle cx="96" cy="86" r="2.6" fill="#fde68a" opacity="0.8" />
            <circle cx="44" cy="52" r="2.4" fill="#cbd5e1" opacity="0.78" />
          </g>
        )}

        {bodyId === "comaCluster" && (
          <g>
            {/* 球状に密集する巨大楕円銀河のハロー */}
            <circle cx={cx} cy={cy} r="46" fill={`url(#${glowId})`} />
            <circle
              cx={cx}
              cy={cy}
              r="42"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="1.1"
              strokeDasharray="3 4"
              opacity="0.55"
            />
            {/* 中心の双子の超巨大楕円銀河 NGC 4874 & NGC 4889 */}
            <ellipse cx={cx - 10} cy={cy - 2} rx="10" ry="7.5" fill="#fde68a" opacity="0.92" />
            <ellipse cx={cx + 12} cy={cy + 3} rx="11" ry="8" fill="#fef3c7" opacity="0.92" />
            {/* 周囲の無数の楕円銀河 */}
            <circle cx="56" cy="44" r="3.4" fill="#c4b5fd" opacity="0.9" />
            <circle cx="104" cy="40" r="3.0" fill="#a5b4fc" opacity="0.88" />
            <circle cx="48" cy="76" r="3.2" fill="#e0e7ff" opacity="0.86" />
            <circle cx="112" cy="78" r="2.8" fill="#c4b5fd" opacity="0.86" />
            <circle cx="80" cy="30" r="2.6" fill="#fde68a" opacity="0.85" />
            <circle cx="78" cy="92" r="2.8" fill="#a5b4fc" opacity="0.85" />
            <circle cx="66" cy="82" r="2.2" fill="#f8fafc" opacity="0.8" />
            <circle cx="96" cy="84" r="2.2" fill="#fde68a" opacity="0.8" />
          </g>
        )}

        {bodyId === "greatAttractor" && (
          <g>
            {/* 四方八方から重力の谷へ吸い込まれる銀河流線 */}
            <path d="M 16 26 Q 52 44 80 62" fill="none" stroke="#f0abfc" strokeWidth="2.1" opacity="0.78" />
            <path d="M 14 64 Q 48 64 80 62" fill="none" stroke="#7dd3fc" strokeWidth="2.1" opacity="0.78" />
            <path d="M 22 102 Q 54 84 80 62" fill="none" stroke="#a5b4fc" strokeWidth="1.9" opacity="0.72" />
            <path d="M 144 24 Q 108 42 80 62" fill="none" stroke="#f472b6" strokeWidth="2.1" opacity="0.78" />
            <path d="M 146 66 Q 112 64 80 62" fill="none" stroke="#f0abfc" strokeWidth="2.1" opacity="0.78" />
            <path d="M 138 104 Q 106 84 80 62" fill="none" stroke="#c4b5fd" strokeWidth="1.9" opacity="0.72" />
            {/* 重力ポテンシャルの同心円と中心コア */}
            <circle cx={cx} cy={cy} r="30" fill={`url(#${glowId})`} />
            <circle cx={cx} cy={cy} r="22" fill="none" stroke="#f0abfc" strokeWidth="1.2" opacity="0.55" />
            <circle cx={cx} cy={cy} r="13" fill="none" stroke="#fde68a" strokeWidth="1.4" opacity="0.75" />
            <circle cx={cx} cy={cy} r="6.5" fill="#fffbeb" opacity="0.96" />
          </g>
        )}

        {bodyId === "laniakea" && (
          <g>
            {/* ラニアケア超銀河団の羽根状の重力流線 */}
            <path
              d="M 20 82 Q 52 72 86 62"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.2"
              opacity="0.82"
            />
            <path
              d="M 26 52 Q 58 56 86 62"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1.8"
              opacity="0.74"
            />
            <path
              d="M 38 24 Q 68 42 86 62"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="1.8"
              opacity="0.7"
            />
            <path
              d="M 136 28 Q 112 48 86 62"
              fill="none"
              stroke="#f0abfc"
              strokeWidth="2.0"
              opacity="0.78"
            />
            <path
              d="M 142 66 Q 114 66 86 62"
              fill="none"
              stroke="#f472b6"
              strokeWidth="2.2"
              opacity="0.82"
            />
            <path
              d="M 122 100 Q 102 82 86 62"
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="1.8"
              opacity="0.75"
            />
            <path
              d="M 52 104 Q 72 82 86 62"
              fill="none"
              stroke="#67e8f9"
              strokeWidth="1.6"
              opacity="0.7"
            />
            {/* グレートアトラクター中心の輝き */}
            <circle cx="86" cy="62" r="20" fill={`url(#${glowId})`} />
            <circle cx="86" cy="62" r="5.5" fill="#fde68a" opacity="0.96" />
            {/* 私たちの位置（おとめ座超銀河団の枝） */}
            <circle cx="34" cy="76" r="3.4" fill="#38bdf8" />
            <circle cx="34" cy="76" r="6.5" fill="none" stroke="#7dd3fc" strokeWidth="1" opacity="0.75" />
          </g>
        )}

        {bodyId === "observableUniverse" && (
          <g>
            {/* 最外殻：宇宙マイクロ波背景放射 (CMB) の球殻 */}
            <circle
              cx={cx}
              cy={cy}
              r="51"
              fill="#0c1938"
              stroke="#38bdf8"
              strokeWidth="2.6"
              opacity="0.92"
            />
            <circle
              cx={cx}
              cy={cy}
              r="47"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.0"
              strokeDasharray="6 4 3 5"
              opacity="0.65"
            />
            {/* コズミック・ウェブとボイド（超空洞） */}
            <path
              d="M 42 46 Q 64 58 80 62 T 118 44"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="1.6"
              opacity="0.7"
            />
            <path
              d="M 48 86 Q 70 72 80 62 T 114 84"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="1.6"
              opacity="0.7"
            />
            <path
              d="M 80 20 Q 74 42 80 62 T 84 104"
              fill="none"
              stroke="#c4b5fd"
              strokeWidth="1.4"
              opacity="0.6"
            />
            {/* 超空洞ボイドの輪郭 */}
            <circle
              cx="58"
              cy="64"
              r="11"
              fill="#020617"
              stroke="#38bdf8"
              strokeWidth="0.9"
              strokeDasharray="2 2"
              opacity="0.7"
            />
            <circle
              cx="104"
              cy="66"
              r="10"
              fill="#020617"
              stroke="#818cf8"
              strokeWidth="0.9"
              strokeDasharray="2 2"
              opacity="0.65"
            />
            {/* 中心の私たち（ラニアケア超銀河団） */}
            <circle cx={cx} cy={cy} r="4.5" fill="#fde68a" opacity="0.98" />
          </g>
        )}
      </svg>
    );
  }

  // 天体ごとの球面ベースグラデーション配色
  const palette: Partial<
    Record<
      CelestialBodyId,
      { c0: string; c1: string; c2: string; glow: string }
    >
  > = {
    sun: { c0: "#fffbeb", c1: "#fbbf24", c2: "#ea580c", glow: "#f59e0b" },
    mercury: { c0: "#e2e8f0", c1: "#94a3b8", c2: "#475569", glow: "#94a3b8" },
    venus: { c0: "#fefce8", c1: "#f5d08a", c2: "#b47824", glow: "#fde68a" },
    earth: { c0: "#60a5fa", c1: "#1d4ed8", c2: "#0f275c", glow: "#38bdf8" },
    moon: { c0: "#f8fafc", c1: "#cbd5e1", c2: "#64748b", glow: "#cbd5e1" },
    mars: { c0: "#fdba74", c1: "#dc5332", c2: "#7c2112", glow: "#fb7185" },
    jupiter: { c0: "#fef3c7", c1: "#d99b62", c2: "#7c4723", glow: "#fdba74" },
    io: { c0: "#fef9c3", c1: "#eab308", c2: "#9a4c0f", glow: "#fde047" },
    europa: { c0: "#f8fafc", c1: "#cbd5e1", c2: "#6b7c93", glow: "#bae6fd" },
    ganymede: { c0: "#e7e5e4", c1: "#a8a29e", c2: "#57534e", glow: "#d6d3d1" },
    callisto: { c0: "#a8a29e", c1: "#645d58", c2: "#2d2a28", glow: "#a8a29e" },
    saturn: { c0: "#fef9c3", c1: "#e2c179", c2: "#8f6f36", glow: "#fde047" },
    uranus: { c0: "#ecfeff", c1: "#67e8f9", c2: "#0e7490", glow: "#67e8f9" },
    neptune: { c0: "#93c5fd", c1: "#2563eb", c2: "#172554", glow: "#60a5fa" },
    pluto: { c0: "#f5ebe0", c1: "#b89685", c2: "#5c4239", glow: "#e9d5ff" },
  };

  const p = palette[bodyId] ?? {
    c0: "#e2e8f0",
    c1: "#94a3b8",
    c2: "#475569",
    glow: "#94a3b8",
  };

  return (
    <svg
      className="celestial-art-svg"
      viewBox="0 0 160 124"
      width="160"
      height="124"
      role="img"
      aria-label={`${nameJa}のイラスト`}
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor={p.c0} />
          <stop offset="56%" stopColor={p.c1} />
          <stop offset="100%" stopColor={p.c2} />
        </radialGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="45%" stopColor={p.glow} stopOpacity="0.34" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* 背景の星空と柔らかなオーラ */}
      <circle cx="22" cy="22" r="1.1" fill="#e2e8f0" opacity="0.6" />
      <circle cx="138" cy="26" r="1.3" fill="#bae6fd" opacity="0.7" />
      <circle cx="28" cy="102" r="0.9" fill="#fde68a" opacity="0.55" />
      <circle cx="134" cy="98" r="1.0" fill="#e2e8f0" opacity="0.6" />
      <circle
        cx={cx}
        cy={cy}
        r={bodyId === "sun" ? 58 : 52}
        fill={`url(#${glowId})`}
      />

      {/* 土星・天王星の「後ろ側」リング */}
      {bodyId === "saturn" && (
        <g transform={`rotate(-18 ${cx} ${cy})`}>
          <ellipse
            cx={cx}
            cy={cy}
            rx="66"
            ry="18"
            fill="none"
            stroke="#e8cfa0"
            strokeWidth="8"
            opacity="0.78"
            strokeDasharray="160 120"
            strokeDashoffset="140"
          />
          <ellipse
            cx={cx}
            cy={cy}
            rx="54"
            ry="14.5"
            fill="none"
            stroke="#c9a567"
            strokeWidth="4"
            opacity="0.7"
          />
        </g>
      )}
      {bodyId === "uranus" && (
        <g transform={`rotate(76 ${cx} ${cy})`}>
          <ellipse
            cx={cx}
            cy={cy}
            rx="52"
            ry="13"
            fill="none"
            stroke="#a5f3fc"
            strokeWidth="2.4"
            opacity="0.65"
          />
        </g>
      )}

      {/* 太陽の紅炎リング */}
      {bodyId === "sun" && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 5}
          fill="none"
          stroke="#fb923c"
          strokeWidth="2.5"
          strokeDasharray="8 6 4 7"
          opacity="0.6"
        />
      )}

      {/* 天体本体の球面 */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />

      {/* 各天体固有の表面模様（球面クリップ内） */}
      <g clipPath={`url(#${clipId})`}>
        {bodyId === "sun" && (
          <>
            <circle cx={cx - 12} cy={cy - 10} r="10" fill="#fff7ed" opacity="0.45" />
            <circle cx={cx + 14} cy={cy + 8} r="7" fill="#ea580c" opacity="0.32" />
            <circle cx={cx - 6} cy={cy + 16} r="5" fill="#c2410c" opacity="0.28" />
          </>
        )}

        {bodyId === "mercury" && (
          <>
            <circle cx={cx - 14} cy={cy - 10} r="7" fill="#475569" opacity="0.45" />
            <circle cx={cx + 12} cy={cy - 6} r="9" fill="#64748b" opacity="0.4" />
            <circle cx={cx - 2} cy={cy + 14} r="6" fill="#334155" opacity="0.45" />
            <circle cx={cx + 16} cy={cy + 16} r="4.5" fill="#cbd5e1" opacity="0.35" />
          </>
        )}

        {bodyId === "venus" && (
          <>
            <path
              d="M 35 48 Q 80 34 125 50"
              fill="none"
              stroke="#fffbeb"
              strokeWidth="6"
              opacity="0.38"
            />
            <path
              d="M 35 68 Q 80 82 125 64"
              fill="none"
              stroke="#92400e"
              strokeWidth="5"
              opacity="0.22"
            />
            <path
              d="M 35 84 Q 80 94 125 80"
              fill="none"
              stroke="#fef3c7"
              strokeWidth="4"
              opacity="0.32"
            />
          </>
        )}

        {bodyId === "earth" && (
          <>
            {/* 大陸シルエット */}
            <path
              d="M 52 38 Q 68 34 74 48 Q 68 62 56 58 Q 48 50 52 38 Z"
              fill="#34d399"
              opacity="0.82"
            />
            <path
              d="M 76 52 Q 96 42 108 56 Q 104 72 90 78 Q 80 68 76 52 Z"
              fill="#22c55e"
              opacity="0.78"
            />
            <path
              d="M 58 68 Q 70 72 72 88 Q 62 94 54 82 Z"
              fill="#10b981"
              opacity="0.72"
            />
            {/* 雲と北極の氷 */}
            <ellipse cx={cx} cy={cy - 36} rx="18" ry="6" fill="#f8fafc" opacity="0.85" />
            <path
              d="M 46 54 Q 76 48 112 58"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M 56 76 Q 84 82 110 72"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.38"
            />
          </>
        )}

        {bodyId === "moon" && (
          <>
            <ellipse cx={cx - 12} cy={cy - 8} rx="11" ry="9" fill="#64748b" opacity="0.42" />
            <ellipse cx={cx + 10} cy={cy - 10} rx="9" ry="7.5" fill="#64748b" opacity="0.36" />
            <ellipse cx={cx + 13} cy={cy + 6} rx="8" ry="6.5" fill="#475569" opacity="0.38" />
            <circle cx={cx - 4} cy={cy + 20} r="3.2" fill="#ffffff" opacity="0.6" />
          </>
        )}

        {bodyId === "mars" && (
          <>
            <ellipse cx={cx} cy={cy - 37} rx="15" ry="5.5" fill="#f8fafc" opacity="0.88" />
            <ellipse cx={cx - 10} cy={cy + 6} rx="15" ry="9" fill="#7c2d12" opacity="0.42" />
            <ellipse cx={cx + 14} cy={cy - 4} rx="10" ry="6" fill="#9a3412" opacity="0.34" />
          </>
        )}

        {bodyId === "jupiter" && (
          <>
            <rect x="35" y="34" width="90" height="7" fill="#b45309" opacity="0.45" />
            <rect x="35" y="47" width="90" height="9" fill="#9a3412" opacity="0.52" />
            <rect x="35" y="62" width="90" height="6" fill="#fef3c7" opacity="0.4" />
            <rect x="35" y="72" width="90" height="8" fill="#b45309" opacity="0.48" />
            <rect x="35" y="86" width="90" height="6" fill="#78350f" opacity="0.42" />
            {/* 大赤斑 */}
            <ellipse
              cx={cx + 12}
              cy={cy + 11}
              rx="11"
              ry="6.5"
              fill="#dc2626"
              opacity="0.85"
            />
            <ellipse
              cx={cx + 12}
              cy={cy + 11}
              rx="7"
              ry="3.8"
              fill="#f97316"
              opacity="0.7"
            />
          </>
        )}

        {bodyId === "saturn" && (
          <>
            <rect x="44" y="42" width="72" height="5" fill="#b48a46" opacity="0.35" />
            <rect x="44" y="54" width="72" height="6" fill="#fef3c7" opacity="0.32" />
            <rect x="44" y="68" width="72" height="6" fill="#926c31" opacity="0.38" />
          </>
        )}

        {bodyId === "uranus" && (
          <path
            d="M 42 54 Q 80 48 118 54"
            fill="none"
            stroke="#cffafe"
            strokeWidth="5"
            opacity="0.32"
          />
        )}

        {bodyId === "neptune" && (
          <>
            <path
              d="M 40 50 Q 80 44 120 52"
              fill="none"
              stroke="#bfdbfe"
              strokeWidth="4"
              opacity="0.38"
            />
            <ellipse cx={cx - 10} cy={cy + 6} rx="10" ry="5.5" fill="#1e3a8a" opacity="0.75" />
            <path
              d="M 54 78 Q 84 82 110 74"
              fill="none"
              stroke="#e0f2fe"
              strokeWidth="2.5"
              opacity="0.45"
            />
          </>
        )}

        {bodyId === "pluto" && (
          <>
            <ellipse cx={cx - 14} cy={cy + 10} rx="14" ry="10" fill="#5c2d1f" opacity="0.52" />
            {/* トンボー地域（有名なハート模様） */}
            <path
              d="M 82 54 C 82 47, 94 46, 95 54 C 96 47, 107 49, 105 58 C 102 66, 91 72, 88 74 C 84 71, 79 62, 82 54 Z"
              fill="#fff7ed"
              opacity="0.88"
            />
          </>
        )}

        {bodyId === "io" && (
          <>
            <circle cx={cx - 12} cy={cy - 8} r="6.5" fill="#ea580c" opacity="0.65" />
            <circle cx={cx - 12} cy={cy - 8} r="2.2" fill="#1c1917" opacity="0.85" />
            <circle cx={cx + 14} cy={cy + 8} r="5.5" fill="#c2410c" opacity="0.6" />
            <circle cx={cx + 14} cy={cy + 8} r="1.8" fill="#1c1917" opacity="0.8" />
            <circle cx={cx + 2} cy={cy - 18} r="4.5" fill="#fef08a" opacity="0.65" />
          </>
        )}

        {bodyId === "europa" && (
          <>
            <path d="M 42 46 Q 82 56 118 42" fill="none" stroke="#9a3412" strokeWidth="1.6" opacity="0.55" />
            <path d="M 44 74 Q 78 58 116 82" fill="none" stroke="#9a3412" strokeWidth="1.8" opacity="0.52" />
            <path d="M 60 28 Q 74 64 96 98" fill="none" stroke="#b45309" strokeWidth="1.4" opacity="0.48" />
          </>
        )}

        {bodyId === "ganymede" && (
          <>
            <ellipse cx={cx - 12} cy={cy - 10} rx="14" ry="11" fill="#57534e" opacity="0.55" />
            <path d="M 46 68 Q 84 58 118 72" fill="none" stroke="#f5f5f4" strokeWidth="3" opacity="0.45" />
            <circle cx={cx + 14} cy={cy + 12} r="3.5" fill="#f5f5f4" opacity="0.7" />
          </>
        )}

        {bodyId === "callisto" && (
          <>
            <circle cx={cx - 14} cy={cy - 12} r="2.6" fill="#e7e5e4" opacity="0.78" />
            <circle cx={cx + 12} cy={cy - 8} r="3.2" fill="#f5f5f4" opacity="0.82" />
            <circle cx={cx - 4} cy={cy + 12} r="2.4" fill="#d6d3d1" opacity="0.72" />
            <circle cx={cx + 18} cy={cy + 14} r="2.0" fill="#f5f5f4" opacity="0.75" />
            <circle cx={cx - 20} cy={cy + 6} r="1.8" fill="#e7e5e4" opacity="0.7" />
          </>
        )}

        {/* 立体感を強める柔らかな右側シャドウ（太陽以外） */}
        {bodyId !== "sun" && (
          <circle
            cx={cx + 16}
            cy={cy + 12}
            r={r + 4}
            fill="none"
            stroke="rgba(2, 6, 23, 0.36)"
            strokeWidth="16"
          />
        )}
      </g>

      {/* 土星の「手前側」リング弧 */}
      {bodyId === "saturn" && (
        <g transform={`rotate(-18 ${cx} ${cy})`}>
          <path
            d={`M ${cx - 66} ${cy} A 66 18 0 0 0 ${cx + 66} ${cy}`}
            fill="none"
            stroke="#f3dfae"
            strokeWidth="7.5"
            strokeLinecap="round"
            opacity="0.92"
          />
          <path
            d={`M ${cx - 54} ${cy} A 54 14.5 0 0 0 ${cx + 54} ${cy}`}
            fill="none"
            stroke="#c9a567"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.82"
          />
        </g>
      )}
    </svg>
  );
};

/**
 * 3D画面で天体をタップしたときに右（スマホ縦画面では下）へ表示する天体詳細カードです。
 * 天体のイラスト・基本データ・日本語の説明文・中学英語レベルの説明文を表示します。
 */
export const CelestialBodyCard: React.FC<CelestialBodyCardProps> = ({
  bodyId,
  onClose,
}) => {
  const profile = CELESTIAL_BODY_PROFILES[bodyId];

  return (
    <aside
      className="celestial-detail-card"
      aria-label={`${profile.nameJa}の詳細解説`}
    >
      <div className="celestial-detail-header">
        <div className="celestial-detail-heading">
          <span
            className="celestial-detail-symbol"
            style={{ color: profile.accentColor }}
            aria-hidden="true"
          >
            {profile.symbol}
          </span>
          <div>
            <h2 className="celestial-detail-name">
              {profile.nameJa}
              <span className="celestial-detail-en">{profile.nameEn}</span>
            </h2>
            <div className="celestial-detail-category">
              {profile.categoryJa} / {profile.categoryEn}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="celestial-detail-close-btn"
          onClick={onClose}
          aria-label="天体の詳細を閉じて元の視点へ戻る"
          title="閉じて元の視点へ戻る"
        >
          <X size={16} />
        </button>
      </div>

      <div className="celestial-detail-body">
        <div className="celestial-detail-hero">
          <CelestialIllustration bodyId={bodyId} nameJa={profile.nameJa} />
          <div className="celestial-fact-list">
            {profile.facts.map((fact) => (
              <div key={fact.labelJa} className="celestial-fact-item">
                <span className="celestial-fact-label">{fact.labelJa}</span>
                <span className="celestial-fact-val">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="celestial-desc-block">
          <div className="celestial-desc-label">解説（日本語）</div>
          <p className="celestial-desc-text">{profile.descriptionJa}</p>
        </div>

        <div className="celestial-desc-block is-english">
          <div className="celestial-desc-label">
            <Globe2 size={12} />
            English（中学英語レベル）
          </div>
          <p className="celestial-desc-text is-english">
            {profile.descriptionEn}
          </p>
        </div>

        <p className="celestial-detail-hint">
          天体はドラッグで360°回転、ホイール・ピンチで拡大縮小できます。「×」で元の視点へ戻ります。
        </p>
      </div>
    </aside>
  );
};
