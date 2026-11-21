import React from "react";
import type {
  CelestialBodyProfile,
  SkyFigure,
} from "../data/celestialBodies";
import type {
  SpectralLetter,
  StarSizeClass,
} from "../data/constellationStarProfiles";

/**
 * 星座の星・すばる・星座・星座の形・宇宙の構造の、説明カード用の絵（SVG）です。
 * もとからある41件は CelestialBodyCard.tsx の専用の絵を使い、ここでは種類（cardKind）ごとに共通の絵を描きます。
 */

/** 絵の大きさ（CelestialBodyCard.tsx の絵と同じ 160×124） */
const VIEW_W = 160;
const VIEW_H = 124;

/** スペクトル型の英字ごとの星の色（中心・まわり・外側の光） */
const STAR_COLORS: Record<
  SpectralLetter,
  { core: string; mid: string; halo: string }
> = {
  O: { core: "#ffffff", mid: "#93c5fd", halo: "#2563eb" },
  B: { core: "#ffffff", mid: "#bae6fd", halo: "#3b82f6" },
  A: { core: "#ffffff", mid: "#e0f2fe", halo: "#60a5fa" },
  F: { core: "#ffffff", mid: "#fef9c3", halo: "#facc15" },
  G: { core: "#fffbeb", mid: "#fde047", halo: "#d97706" },
  K: { core: "#fff7ed", mid: "#fdba74", halo: "#ea580c" },
  M: { core: "#fef3c7", mid: "#f97316", halo: "#dc2626" },
};

/** 星の大きさの種類ごとの、絵の中の星の半径 */
const STAR_RADIUS: Record<StarSizeClass, number> = {
  dwarf: 19,
  subgiant: 22,
  giant: 27,
  brightGiant: 31,
  supergiant: 36,
};

/** 背景に散らす小さな星（どの絵でも同じ位置） */
const BackgroundStars: React.FC = () => (
  <>
    <circle cx="18" cy="22" r="1.0" fill="#e2e8f0" opacity="0.65" />
    <circle cx="144" cy="20" r="1.2" fill="#bae6fd" opacity="0.65" />
    <circle cx="24" cy="102" r="1.0" fill="#fde68a" opacity="0.55" />
    <circle cx="140" cy="96" r="1.1" fill="#e2e8f0" opacity="0.6" />
  </>
);

/** 1つの星の絵（光の輪と、十字の光の筋） */
const StarArt: React.FC<{
  idPrefix: string;
  letter: SpectralLetter;
  sizeClass: StarSizeClass;
}> = ({ idPrefix, letter, sizeClass }) => {
  const color = STAR_COLORS[letter];
  const r = STAR_RADIUS[sizeClass];
  const cx = 80;
  const cy = 62;
  return (
    <>
      <defs>
        <radialGradient id={`${idPrefix}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.core} stopOpacity="0.98" />
          <stop offset="40%" stopColor={color.mid} stopOpacity="0.58" />
          <stop offset="100%" stopColor={color.halo} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-body`} cx="42%" cy="38%" r="60%">
          <stop offset="0%" stopColor={color.core} />
          <stop offset="65%" stopColor={color.mid} />
          <stop offset="100%" stopColor={color.halo} />
        </radialGradient>
      </defs>
      <BackgroundStars />
      <circle cx={cx} cy={cy} r={r + 22} fill={`url(#${idPrefix}-glow)`} />
      <line x1={cx - r - 20} y1={cy} x2={cx + r + 20} y2={cy} stroke={color.core} strokeWidth="1.6" opacity="0.72" />
      <line x1={cx} y1={cy - r - 18} x2={cx} y2={cy + r + 18} stroke={color.core} strokeWidth="1.6" opacity="0.72" />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${idPrefix}-body)`} />
      {/* 太陽と色をくらべるための小さな太陽 */}
      <circle cx="26" cy="108" r="3.5" fill="#fbbf24" />
      <text x="34" y="111" fill="#94a3b8" fontSize="8.5">
        太陽(色比較)
      </text>
    </>
  );
};

/** すばる（散開星団）の絵：青白い星が小さく集まり、まわりをうすい光がつつむ */
const ClusterArt: React.FC<{ idPrefix: string }> = ({ idPrefix }) => {
  // すばるの明るい星の並び（ひしゃくのような形）をおおまかに描きます
  const stars: Array<[number, number, number]> = [
    [70, 58, 5.2],
    [86, 50, 4.2],
    [98, 62, 4.6],
    [60, 70, 3.6],
    [80, 74, 3.4],
    [108, 54, 3.0],
    [52, 52, 2.8],
    [92, 80, 2.4],
  ];
  return (
    <>
      <defs>
        <radialGradient id={`${idPrefix}-haze`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <BackgroundStars />
      <ellipse cx="80" cy="64" rx="62" ry="44" fill={`url(#${idPrefix}-haze)`} />
      {stars.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r * 2.4} fill="#93c5fd" opacity="0.22" />
          <circle cx={x} cy={y} r={r} fill="#f0f9ff" />
        </g>
      ))}
    </>
  );
};

/**
 * 星座や星座の形の星を、絵の枠に収まるように平面へ写します。
 * 星の集まりの中心から見た向きで、空を見上げたときと同じく「東が左・北が上」になるよう並べます。
 */
function projectFigure(figure: SkyFigure): Array<{ x: number; y: number; mag: number }> {
  const toVec = (lonDeg: number, latDeg: number): [number, number, number] => {
    const lon = (lonDeg * Math.PI) / 180;
    const lat = (latDeg * Math.PI) / 180;
    return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  };
  // 1) 星の向きを足し合わせて、集まりの中心の向きを求めます
  let cx = 0;
  let cy = 0;
  let cz = 0;
  const vecs: Array<[number, number, number]> = [];
  for (const p of figure.points) {
    const v = toVec(p.lonDeg, p.latDeg);
    vecs.push(v);
    cx += v[0];
    cy += v[1];
    cz += v[2];
  }
  const len = Math.hypot(cx, cy, cz) || 1;
  const c: [number, number, number] = [cx / len, cy / len, cz / len];
  // 2) 中心で空に接する平面の「東」と「北」の向きを作ります
  let east: [number, number, number] = [-c[1], c[0], 0];
  const eastLen = Math.hypot(east[0], east[1]) || 1;
  east = [east[0] / eastLen, east[1] / eastLen, 0];
  const north: [number, number, number] = [
    c[1] * east[2] - c[2] * east[1],
    c[2] * east[0] - c[0] * east[2],
    c[0] * east[1] - c[1] * east[0],
  ];
  const dot = (a: [number, number, number], b: [number, number, number]) =>
    a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // 3) 平面に写した位置（東は左、北は上）
  const raw: Array<{ x: number; y: number; mag: number }> = [];
  vecs.forEach((v, i) => {
    const d = dot(v, c) || 1;
    raw.push({ x: -dot(v, east) / d, y: -dot(v, north) / d, mag: figure.points[i].mag });
  });
  // 4) 縦横の比を保ったまま、枠（余白 16）に収まるように大きさをそろえます
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of raw) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const margin = 16;
  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const scale = Math.min((VIEW_W - margin * 2) / spanX, (VIEW_H - margin * 2) / spanY);
  const offX = (VIEW_W - spanX * scale) / 2;
  const offY = (VIEW_H - spanY * scale) / 2;
  return raw.map((p) => ({
    x: offX + (p.x - minX) * scale,
    y: offY + (p.y - minY) * scale,
    mag: p.mag,
  }));
}

/** 星座・星座の形の絵：実際の星の並びと線 */
const FigureArt: React.FC<{ figure: SkyFigure; dashed: boolean }> = ({
  figure,
  dashed,
}) => {
  const pts = projectFigure(figure);
  return (
    <>
      <BackgroundStars />
      {figure.edges.map(([a, b], i) =>
        pts[a] && pts[b] ? (
          <line
            key={`e${i}`}
            x1={pts[a].x}
            y1={pts[a].y}
            x2={pts[b].x}
            y2={pts[b].y}
            stroke={figure.lineColor}
            strokeWidth="1.4"
            strokeDasharray={dashed ? "4 3" : undefined}
            opacity="0.8"
          />
        ) : null
      )}
      {pts.map((p, i) => {
        // 明るい星（等級が小さい星）ほど大きく描きます
        const r = Math.min(4.4, Math.max(1.2, 3.8 - p.mag * 0.6));
        return (
          <g key={`s${i}`}>
            <circle cx={p.x} cy={p.y} r={r * 2.2} fill="#e0f2fe" opacity="0.18" />
            <circle cx={p.x} cy={p.y} r={r} fill="#f8fafc" />
          </g>
        );
      })}
    </>
  );
};

/** 宇宙の構造の絵（ID ごとに少しずつ描き分けます） */
const CosmicArt: React.FC<{ idPrefix: string; id: string }> = ({ idPrefix, id }) => {
  const cx = 80;
  const cy = 62;
  if (id === "galacticCenter") {
    // ブラックホールの黒い影と、まわりの光る輪
    return (
      <>
        <defs>
          <radialGradient id={`${idPrefix}-ring`} cx="50%" cy="50%" r="50%">
            <stop offset="45%" stopColor="#000000" stopOpacity="1" />
            <stop offset="62%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#ea580c" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c2d12" stopOpacity="0" />
          </radialGradient>
        </defs>
        <BackgroundStars />
        <circle cx={cx} cy={cy} r="48" fill={`url(#${idPrefix}-ring)`} />
        <circle cx={cx} cy={cy} r="20" fill="#020617" />
      </>
    );
  }
  if (id === "solarSystemInGalaxy") {
    // 渦巻銀河と、腕の中の太陽系の印
    return (
      <>
        <BackgroundStars />
        <ellipse cx={cx} cy={cy} rx="62" ry="34" fill="#1e3a8a" opacity="0.35" />
        <path d="M 80 62 C 104 50, 132 58, 136 76" fill="none" stroke="#93c5fd" strokeWidth="5" opacity="0.55" />
        <path d="M 80 62 C 56 74, 28 66, 24 48" fill="none" stroke="#93c5fd" strokeWidth="5" opacity="0.55" />
        <path d="M 80 62 C 90 82, 66 96, 46 90" fill="none" stroke="#bae6fd" strokeWidth="3" opacity="0.4" />
        <circle cx={cx} cy={cy} r="7" fill="#fde68a" opacity="0.95" />
        <circle cx="112" cy="84" r="4" fill="#fbbf24" />
        <circle cx="112" cy="84" r="8" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
        <text x="96" y="104" fill="#fde68a" fontSize="8.5">
          太陽系
        </text>
      </>
    );
  }
  if (id === "cosmicMicrowaveBackground") {
    // 全天の温度のむらを、だ円の地図に描いたもの
    const blobs: Array<[number, number, number, string]> = [
      [50, 52, 10, "#f59e0b"],
      [78, 70, 12, "#38bdf8"],
      [104, 50, 9, "#f97316"],
      [118, 72, 8, "#7dd3fc"],
      [64, 78, 7, "#fbbf24"],
      [92, 44, 6, "#60a5fa"],
      [38, 66, 6, "#fde68a"],
    ];
    return (
      <>
        <BackgroundStars />
        <ellipse cx={cx} cy={cy} rx="66" ry="36" fill="#1d4ed8" opacity="0.85" />
        {blobs.map(([x, y, r, col], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={col} opacity="0.55" />
        ))}
        <ellipse cx={cx} cy={cy} rx="66" ry="36" fill="none" stroke="#fde68a" strokeWidth="1.2" opacity="0.8" />
      </>
    );
  }
  if (id === "cosmicVoid") {
    // まん中の空っぽの空間と、まわりを囲む銀河の糸
    return (
      <>
        <BackgroundStars />
        <path d="M 20 30 Q 50 18 80 22 T 140 30 Q 150 62 140 94 Q 110 106 80 102 T 20 94 Q 10 62 20 30 Z" fill="none" stroke="#a5b4fc" strokeWidth="2.2" opacity="0.75" />
        <circle cx={cx} cy={cy} r="30" fill="#020617" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="24" cy="30" r="3" fill="#e0e7ff" />
        <circle cx="140" cy="30" r="3" fill="#e0e7ff" />
        <circle cx="140" cy="94" r="3" fill="#e0e7ff" />
        <circle cx="22" cy="94" r="3" fill="#e0e7ff" />
      </>
    );
  }
  // 超銀河団とコズミック・ウェブ：銀河団（点の集まり）を糸で結んだ網の目
  const nodes: Array<[number, number, number]> =
    id === "cosmicWeb"
      ? [
          [26, 30, 3], [70, 24, 4], [120, 34, 3.5], [44, 70, 4.5], [92, 62, 5], [136, 80, 3],
          [30, 104, 3], [78, 100, 3.5], [118, 106, 3],
        ]
      : [
          [44, 46, 5], [80, 58, 7], [116, 48, 4.5], [62, 86, 4], [104, 84, 5], [134, 70, 3],
        ];
  const links: Array<[number, number]> =
    id === "cosmicWeb"
      ? [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5], [3, 6], [3, 7], [4, 7], [5, 8], [7, 8]]
      : [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 4]];
  const lineColor = id === "cosmicWeb" ? "#c4b5fd" : id === "shapleySupercluster" ? "#f472b6" : id === "perseusPiscesSupercluster" ? "#a5b4fc" : "#7dd3fc";
  return (
    <>
      <BackgroundStars />
      {links.map(([a, b], i) => (
        <line key={`l${i}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={lineColor} strokeWidth="1.6" opacity="0.6" />
      ))}
      {nodes.map(([x, y, r], i) => (
        <g key={`n${i}`}>
          <circle cx={x} cy={y} r={r * 2.4} fill={lineColor} opacity="0.18" />
          <circle cx={x} cy={y} r={r} fill="#fef3c7" opacity="0.9" />
        </g>
      ))}
    </>
  );
};

/**
 * 種類（cardKind）ごとの共通の絵を返します。種類がない（もとからある41件の）ときは null を返します。
 */
export const SkyObjectIllustration: React.FC<{
  profile: CelestialBodyProfile;
  idPrefix: string;
}> = ({ profile, idPrefix }) => {
  let content: React.ReactNode = null;
  if (profile.cardKind === "star" && profile.starVisual) {
    content = (
      <StarArt
        idPrefix={idPrefix}
        letter={profile.starVisual.spectralLetter}
        sizeClass={profile.starVisual.sizeClass}
      />
    );
  } else if (profile.cardKind === "starCluster") {
    content = <ClusterArt idPrefix={idPrefix} />;
  } else if (
    (profile.cardKind === "constellation" || profile.cardKind === "asterism") &&
    profile.figure
  ) {
    // 春の大曲線・冬のダイヤモンドは、3D 画面と同じく点線で描きます
    const dashed = profile.id === "springCurve" || profile.id === "winterDiamond";
    content = <FigureArt figure={profile.figure} dashed={dashed} />;
  } else if (profile.cardKind === "cosmicStructure") {
    content = <CosmicArt idPrefix={idPrefix} id={profile.id} />;
  }
  if (content === null) return null;
  return (
    <svg
      className="celestial-art-svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={VIEW_W}
      height={VIEW_H}
      role="img"
      aria-label={`${profile.nameJa}のイラスト`}
    >
      {content}
    </svg>
  );
};
