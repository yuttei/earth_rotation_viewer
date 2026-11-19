import React, { useId } from "react";

interface CelestialPhaseDiagramProps {
  /** 天体の種類（月 または 金星） */
  body: "moon" | "venus";
  /** 輝面比（0.0 = 暗い新月型 〜 1.0 = 満月型） */
  illumination: number;
  /** 北半球（日本）から見てどちら側が光って見えるか */
  litSide: "right" | "left";
  /** 地球からの距離（AU・金星の見かけの大きさ変化にのみ使用） */
  distanceAu?: number;
  /** スクリーンリーダー向け説明文 */
  ariaLabel: string;
}

/**
 * 輝面比 k (0〜1) と光る側 (right / left) から、満ち欠けの光っている領域の SVG パス文字列を生成します。
 */
function buildLitPhasePath(
  cx: number,
  cy: number,
  r: number,
  k: number,
  litSide: "right" | "left"
): string | null {
  if (k <= 0.004) {
    return null;
  }
  const topY = cy - r;
  const bottomY = cy + r;
  const outerSweep = litSide === "right" ? 1 : 0;

  if (Math.abs(k - 0.5) < 0.004) {
    // ちょうど半月（上弦・下弦・最大離角）のときは垂直な直線で区切ります。
    return `M ${cx} ${topY} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${bottomY} L ${cx} ${topY} Z`;
  }

  // 昼夜境界（ターミネーター）は横半径 |2k - 1| * r、縦半径 r の楕円弧になります。
  const rx = Math.abs(2 * k - 1) * r;
  const termSweep = (litSide === "right") === (k > 0.5) ? 1 : 0;

  return [
    `M ${cx} ${topY}`,
    `A ${r} ${r} 0 0 ${outerSweep} ${cx} ${bottomY}`,
    `A ${rx.toFixed(3)} ${r} 0 0 ${termSweep} ${cx} ${topY}`,
    "Z",
  ].join(" ");
}

/**
 * 「地点・天体」パネルに表示する、月および金星のリアルタイム満ち欠けイラスト（SVG）です。
 * 金星は地球との距離 (AU) に応じて見かけの大きさ（視直径）も連動して変化します。
 */
export const CelestialPhaseDiagram: React.FC<CelestialPhaseDiagramProps> = ({
  body,
  illumination,
  litSide,
  distanceAu,
  ariaLabel,
}) => {
  const uid = useId().replace(/:/g, "");
  const cx = 34;
  const cy = 34;
  const maxRadius = 25;

  // 金星は地球距離（約 0.28 AU 〜 1.72 AU）に反比例して見かけの直径が約6倍変化します。
  const radius =
    body === "venus" && distanceAu !== undefined
      ? Math.max(6.5, Math.min(maxRadius, 7.2 / Math.max(0.26, distanceAu)))
      : 23;

  const clampedK = Math.max(0, Math.min(1, illumination));
  const isFull = clampedK >= 0.996;
  const litPath = isFull
    ? null
    : buildLitPhasePath(cx, cy, radius, clampedK, litSide);

  const gradId = `phase-grad-${body}-${uid}`;
  const clipId = `phase-clip-${body}-${uid}`;
  const glowId = `phase-glow-${body}-${uid}`;

  return (
    <svg
      className="phase-diagram-svg"
      viewBox="0 0 68 68"
      width="68"
      height="68"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        {body === "moon" ? (
          <radialGradient id={gradId} cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="68%" stopColor="#dce4ef" />
            <stop offset="100%" stopColor="#9fb0c7" />
          </radialGradient>
        ) : (
          <radialGradient id={gradId} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fffdf2" />
            <stop offset="55%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d99b38" />
          </radialGradient>
        )}

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop
            offset="55%"
            stopColor={body === "moon" ? "#bae6fd" : "#fde68a"}
            stopOpacity={0.22 * clampedK + 0.04}
          />
          <stop
            offset="100%"
            stopColor={body === "moon" ? "#bae6fd" : "#fde68a"}
            stopOpacity="0"
          />
        </radialGradient>

        <clipPath id={clipId}>
          {isFull ? (
            <circle cx={cx} cy={cy} r={radius} />
          ) : litPath ? (
            <path d={litPath} />
          ) : (
            <rect x="0" y="0" width="0" height="0" />
          )}
        </clipPath>
      </defs>

      {/* 背景の淡い光環 */}
      <circle cx={cx} cy={cy} r={radius + 7} fill={`url(#${glowId})`} />

      {/* 金星は距離で見かけの大きさが変わるため、最大視直径の目安円を点線で表示 */}
      {body === "venus" && (
        <circle
          cx={cx}
          cy={cy}
          r={maxRadius}
          fill="none"
          stroke="rgba(253, 230, 138, 0.2)"
          strokeWidth="1"
          strokeDasharray="2.5 2.5"
        />
      )}

      {/* 影側（夜面）のベース円 */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={body === "moon" ? "#121c30" : "#1f1810"}
        stroke={
          body === "moon"
            ? "rgba(203, 213, 225, 0.36)"
            : "rgba(253, 230, 138, 0.36)"
        }
        strokeWidth="1"
      />

      {/* 太陽に照らされて光っている領域 */}
      {isFull ? (
        <circle cx={cx} cy={cy} r={radius} fill={`url(#${gradId})`} />
      ) : (
        litPath && <path d={litPath} fill={`url(#${gradId})`} />
      )}

      {/* 月の海（うさぎ模様の気配）や金星の淡い雲バンドを光っている領域内だけに重ねる */}
      <g clipPath={`url(#${clipId})`}>
        {body === "moon" ? (
          <>
            <ellipse
              cx={cx - 7}
              cy={cy - 5}
              rx={7.2}
              ry={6.2}
              fill="rgba(71, 85, 105, 0.28)"
            />
            <ellipse
              cx={cx + 6}
              cy={cy - 6}
              rx={5.8}
              ry={4.8}
              fill="rgba(71, 85, 105, 0.25)"
            />
            <ellipse
              cx={cx + 8}
              cy={cy + 3}
              rx={5.0}
              ry={4.0}
              fill="rgba(71, 85, 105, 0.24)"
            />
            <ellipse
              cx={cx - 10}
              cy={cy + 5}
              rx={4.8}
              ry={5.6}
              fill="rgba(71, 85, 105, 0.22)"
            />
            <circle cx={cx - 2} cy={cy + 13} r={2.2} fill="rgba(255,255,255,0.45)" />
          </>
        ) : (
          <>
            <path
              d={`M ${cx - radius} ${cy - radius * 0.32} Q ${cx} ${
                cy - radius * 0.12
              } ${cx + radius} ${cy - radius * 0.32}`}
              fill="none"
              stroke="rgba(180, 120, 36, 0.22)"
              strokeWidth={Math.max(1.5, radius * 0.16)}
            />
            <path
              d={`M ${cx - radius} ${cy + radius * 0.28} Q ${cx} ${
                cy + radius * 0.45
              } ${cx + radius} ${cy + radius * 0.28}`}
              fill="none"
              stroke="rgba(255, 252, 235, 0.28)"
              strokeWidth={Math.max(1.2, radius * 0.13)}
            />
          </>
        )}
      </g>
    </svg>
  );
};
