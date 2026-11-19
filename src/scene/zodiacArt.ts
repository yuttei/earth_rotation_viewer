import * as THREE from "three";
import { ZODIAC_CONSTELLATIONS, ZodiacConstellationId } from "../astronomy/zodiac";

/**
 * 黄道13星座（黄道12星座＋へびつかい座）それぞれの星図風イラストテクスチャを
 * ブラウザ上の Canvas2D で生成するモジュールです。
 * 太陽中心の公転ビュー（太陽の真上・公転面やや上）および黄道天球の背景装飾に使用します。
 */

function drawStarDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#fef3c7"
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r * 2.8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawConstellationFigure(
  ctx: CanvasRenderingContext2D,
  id: ZodiacConstellationId,
  stroke: string,
  fill: string
): void {
  ctx.save();
  ctx.translate(128, 114);
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = stroke;
  ctx.shadowBlur = 10;

  switch (id) {
    case "pisces": {
      // 2匹の魚と結び紐
      // 左上の魚
      ctx.beginPath();
      ctx.moveTo(-42, -26);
      ctx.quadraticCurveTo(-24, -44, -6, -24);
      ctx.quadraticCurveTo(-24, -10, -42, -26);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-42, -26);
      ctx.lineTo(-56, -36);
      ctx.lineTo(-52, -16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 右下の魚
      ctx.beginPath();
      ctx.moveTo(42, -14);
      ctx.quadraticCurveTo(22, -30, 8, -8);
      ctx.quadraticCurveTo(24, 8, 42, -14);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(42, -14);
      ctx.lineTo(56, -24);
      ctx.lineTo(54, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // V字の紐（結び目アルレシャ）
      ctx.beginPath();
      ctx.moveTo(-36, -16);
      ctx.quadraticCurveTo(-18, 22, 0, 38);
      ctx.quadraticCurveTo(22, 24, 34, -4);
      ctx.stroke();
      drawStarDot(ctx, 0, 38, 4.2);
      drawStarDot(ctx, -22, -26, 3.2);
      drawStarDot(ctx, 24, -12, 3.2);
      break;
    }

    case "aries": {
      // 渦巻き角の牡羊の頭部シルエット
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.quadraticCurveTo(0, -18, 18, -6);
      ctx.quadraticCurveTo(22, 18, 0, 38);
      ctx.quadraticCurveTo(-22, 18, -18, -6);
      ctx.fill();
      ctx.stroke();
      // 左の渦巻き角
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.bezierCurveTo(-48, -42, -62, 6, -34, 16);
      ctx.bezierCurveTo(-22, 18, -22, 2, -32, 2);
      ctx.stroke();
      // 右の渦巻き角
      ctx.beginPath();
      ctx.moveTo(12, -10);
      ctx.bezierCurveTo(48, -42, 62, 6, 34, 16);
      ctx.bezierCurveTo(22, 18, 22, 2, 32, 2);
      ctx.stroke();
      drawStarDot(ctx, 0, -10, 4.4);
      drawStarDot(ctx, -28, -22, 3.4);
      drawStarDot(ctx, 28, -22, 3.4);
      break;
    }

    case "taurus": {
      // 牡牛の力強い顔と三日月状の大きな角＋アルデバラン
      ctx.beginPath();
      ctx.moveTo(-24, -6);
      ctx.lineTo(24, -6);
      ctx.lineTo(14, 34);
      ctx.lineTo(-14, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 大きく弧を描く2本の角
      ctx.beginPath();
      ctx.moveTo(-22, -6);
      ctx.quadraticCurveTo(-56, -24, -46, -50);
      ctx.moveTo(22, -6);
      ctx.quadraticCurveTo(56, -24, 46, -50);
      ctx.stroke();
      // 耳
      ctx.beginPath();
      ctx.moveTo(-24, 2);
      ctx.lineTo(-38, 10);
      ctx.moveTo(24, 2);
      ctx.lineTo(38, 10);
      ctx.stroke();
      drawStarDot(ctx, 10, 8, 4.8, "#fdba74"); // アルデバラン
      drawStarDot(ctx, -46, -50, 3.4);
      drawStarDot(ctx, 46, -50, 3.4);
      break;
    }

    case "gemini": {
      // 肩を組む双子（カストル＆ポルックス）
      const drawTwin = (cx: number) => {
        ctx.beginPath();
        ctx.arc(cx, -32, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, -20);
        ctx.lineTo(cx, 14);
        ctx.moveTo(cx, 14);
        ctx.lineTo(cx - 10, 42);
        ctx.moveTo(cx, 14);
        ctx.lineTo(cx + 10, 42);
        ctx.stroke();
      };
      drawTwin(-22);
      drawTwin(22);
      // 繋いだ腕
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.quadraticCurveTo(-22, -14, 0, -6);
      ctx.quadraticCurveTo(22, -14, 40, 0);
      ctx.stroke();
      drawStarDot(ctx, -22, -32, 4.4);
      drawStarDot(ctx, 22, -32, 4.8, "#fde68a");
      break;
    }

    case "cancer": {
      // 蟹の甲羅・大きなハサミ・6本の脚
      ctx.beginPath();
      ctx.ellipse(0, 8, 28, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // ハサミ（左右）
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.quadraticCurveTo(-42, -26, -30, -44);
      ctx.quadraticCurveTo(-18, -36, -24, -22);
      ctx.moveTo(18, -8);
      ctx.quadraticCurveTo(42, -26, 30, -44);
      ctx.quadraticCurveTo(18, -36, 24, -22);
      ctx.stroke();
      // 脚
      for (const dy of [-2, 10, 22]) {
        ctx.beginPath();
        ctx.moveTo(-26, dy);
        ctx.lineTo(-48, dy + 8);
        ctx.moveTo(26, dy);
        ctx.lineTo(48, dy + 8);
        ctx.stroke();
      }
      drawStarDot(ctx, 0, 6, 3.8);
      drawStarDot(ctx, -30, -40, 3.2);
      drawStarDot(ctx, 30, -40, 3.2);
      break;
    }

    case "leo": {
      // たてがみとS字の尻尾をもつ獅子シルエット＋レグルス
      ctx.beginPath();
      ctx.arc(-20, -18, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 胴体と前脚・後脚
      ctx.beginPath();
      ctx.moveTo(-8, -8);
      ctx.quadraticCurveTo(18, -14, 34, 4);
      ctx.lineTo(28, 34);
      ctx.moveTo(34, 4);
      ctx.lineTo(44, 34);
      ctx.moveTo(-16, 2);
      ctx.lineTo(-26, 34);
      ctx.moveTo(-4, 2);
      ctx.lineTo(-8, 34);
      // 尻尾（デネボラ）
      ctx.moveTo(34, 2);
      ctx.bezierCurveTo(54, -10, 56, -34, 40, -34);
      ctx.stroke();
      drawStarDot(ctx, -12, 4, 4.8, "#bae6fd"); // レグルス
      drawStarDot(ctx, 40, -34, 4.0); // デネボラ
      break;
    }

    case "virgo": {
      // 翼と麦の穂（スピカ）を持つ乙女
      // 頭とドレス
      ctx.beginPath();
      ctx.arc(0, -36, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(-18, 36);
      ctx.lineTo(18, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 翼
      ctx.beginPath();
      ctx.moveTo(-6, -16);
      ctx.quadraticCurveTo(-48, -34, -44, 4);
      ctx.quadraticCurveTo(-24, 6, -8, -4);
      ctx.moveTo(6, -16);
      ctx.quadraticCurveTo(48, -34, 44, 4);
      ctx.quadraticCurveTo(24, 6, 8, -4);
      ctx.stroke();
      // 麦の穂
      ctx.beginPath();
      ctx.moveTo(14, 14);
      ctx.lineTo(38, -22);
      ctx.stroke();
      drawStarDot(ctx, 36, -18, 4.8, "#93c5fd"); // スピカ
      drawStarDot(ctx, 0, -36, 3.2);
      break;
    }

    case "libra": {
      // 天秤（支柱・横竿・2つの皿）
      ctx.beginPath();
      ctx.moveTo(0, -38);
      ctx.lineTo(0, 36);
      ctx.moveTo(-24, 36);
      ctx.lineTo(24, 36);
      ctx.moveTo(-42, -20);
      ctx.lineTo(42, -20);
      ctx.stroke();
      // 左皿
      ctx.beginPath();
      ctx.moveTo(-42, -20);
      ctx.lineTo(-54, 10);
      ctx.moveTo(-42, -20);
      ctx.lineTo(-30, 10);
      ctx.moveTo(-56, 10);
      ctx.quadraticCurveTo(-42, 24, -28, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 右皿
      ctx.beginPath();
      ctx.moveTo(42, -20);
      ctx.lineTo(30, 10);
      ctx.moveTo(42, -20);
      ctx.lineTo(54, 10);
      ctx.moveTo(28, 10);
      ctx.quadraticCurveTo(42, 24, 56, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawStarDot(ctx, 0, -38, 4.0);
      drawStarDot(ctx, -42, -20, 3.6);
      drawStarDot(ctx, 42, -20, 3.6);
      break;
    }

    case "scorpius": {
      // ハサミと赤い心臓アンタレス・J字の毒針尾をもつさそり
      ctx.beginPath();
      ctx.ellipse(-10, -8, 14, 20, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // 前方ハサミ
      ctx.beginPath();
      ctx.moveTo(-18, -22);
      ctx.quadraticCurveTo(-46, -34, -36, -50);
      ctx.moveTo(-6, -26);
      ctx.quadraticCurveTo(-2, -48, 16, -46);
      // 湾曲する尾と毒針
      ctx.moveTo(-2, 10);
      ctx.bezierCurveTo(6, 40, 42, 46, 44, 18);
      ctx.quadraticCurveTo(44, 4, 30, 6);
      ctx.stroke();
      drawStarDot(ctx, -10, -8, 5.2, "#fb923c"); // アンタレス
      drawStarDot(ctx, 30, 6, 4.0); // シャウラ
      break;
    }

    case "ophiuchus": {
      // 13番目の星座：大蛇を抱える蛇遣い（Ophiuchus）
      // 人物の頭・胴体
      ctx.beginPath();
      ctx.arc(0, -38, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(0, 20);
      ctx.moveTo(0, 20);
      ctx.lineTo(-14, 44);
      ctx.moveTo(0, 20);
      ctx.lineTo(14, 44);
      ctx.moveTo(-24, -12);
      ctx.lineTo(24, -12);
      ctx.stroke();
      // 大きくうねる大蛇（左右へ伸びるS字）
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-54, -22);
      ctx.bezierCurveTo(-44, 18, -16, -6, 0, 2);
      ctx.bezierCurveTo(18, 10, 40, -24, 52, -14);
      ctx.stroke();
      // 蛇の頭
      ctx.beginPath();
      ctx.arc(-54, -22, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawStarDot(ctx, 0, -38, 4.6, "#f0abfc"); // ラスアルハゲ
      drawStarDot(ctx, -54, -22, 3.6, "#fde68a");
      drawStarDot(ctx, 52, -14, 3.4, "#fde68a");
      break;
    }

    case "sagittarius": {
      // 引き絞られた弓と矢（射手座）
      ctx.beginPath();
      ctx.arc(-8, 6, 42, -Math.PI * 0.42, Math.PI * 0.36);
      ctx.stroke();
      // 弓弦
      ctx.beginPath();
      ctx.moveTo(2, -34);
      ctx.lineTo(-22, 6);
      ctx.lineTo(10, 44);
      ctx.stroke();
      // 矢（斜め右上へ）
      ctx.beginPath();
      ctx.moveTo(-36, 28);
      ctx.lineTo(44, -36);
      ctx.moveTo(28, -36);
      ctx.lineTo(44, -36);
      ctx.lineTo(40, -20);
      ctx.stroke();
      drawStarDot(ctx, 44, -36, 4.4);
      drawStarDot(ctx, -22, 6, 3.6);
      break;
    }

    case "capricornus": {
      // 山羊の上半身と渦巻く魚の尾（海山羊）
      ctx.beginPath();
      ctx.moveTo(-44, -12);
      ctx.quadraticCurveTo(-24, -32, -8, -12);
      ctx.quadraticCurveTo(10, 12, 34, 8);
      ctx.bezierCurveTo(54, 6, 52, 36, 28, 32);
      ctx.quadraticCurveTo(6, 26, -14, 18);
      ctx.quadraticCurveTo(-30, 14, -44, -12);
      ctx.fill();
      ctx.stroke();
      // 角
      ctx.beginPath();
      ctx.moveTo(-26, -24);
      ctx.quadraticCurveTo(-18, -46, -2, -42);
      ctx.moveTo(-32, -20);
      ctx.quadraticCurveTo(-34, -42, -18, -44);
      ctx.stroke();
      drawStarDot(ctx, -32, -16, 3.8);
      drawStarDot(ctx, 36, 22, 4.0);
      break;
    }

    case "aquarius": {
      // 傾いた水がめと流れ落ちる3筋の波
      ctx.save();
      ctx.translate(-10, -18);
      ctx.rotate(0.55);
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(18, -8);
      ctx.lineTo(30, -12);
      ctx.lineTo(30, 12);
      ctx.lineTo(18, 8);
      ctx.stroke();
      ctx.restore();
      // 流れ落ちる水の波（3本）
      for (const offset of [-10, 4, 18]) {
        ctx.beginPath();
        ctx.moveTo(14, -6 + offset * 0.4);
        ctx.bezierCurveTo(
          28,
          12 + offset * 0.5,
          -4,
          24 + offset * 0.6,
          16,
          44
        );
        ctx.stroke();
      }
      drawStarDot(ctx, -14, -22, 4.0);
      drawStarDot(ctx, 16, 44, 3.6);
      break;
    }
  }

  ctx.restore();
}

export interface ZodiacArtBundle {
  textures: Map<ZodiacConstellationId, THREE.CanvasTexture>;
  dispose: () => void;
}

/**
 * 黄道13星座すべてのイラスト入りメダリオンテクスチャを生成します。
 */
export function createZodiacArtTextures(): ZodiacArtBundle {
  const textures = new Map<ZodiacConstellationId, THREE.CanvasTexture>();

  for (const c of ZODIAC_CONSTELLATIONS) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const is13 = c.isThirteenth;
    const primaryStroke = is13 ? "#e9d5ff" : "#bae6fd";
    const fillTint = is13
      ? "rgba(192, 132, 252, 0.22)"
      : "rgba(56, 189, 248, 0.16)";
    const ringStroke = is13
      ? "rgba(216, 180, 254, 0.62)"
      : "rgba(251, 191, 36, 0.45)";

    // 背景の柔らかな星図メダリオン発光
    const bgGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
    bgGrad.addColorStop(
      0.0,
      is13 ? "rgba(59, 24, 92, 0.82)" : "rgba(12, 28, 58, 0.82)"
    );
    bgGrad.addColorStop(
      0.74,
      is13 ? "rgba(24, 12, 42, 0.68)" : "rgba(6, 15, 34, 0.68)"
    );
    bgGrad.addColorStop(1.0, "rgba(4, 9, 22, 0.0)");
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();

    // 外周の天球儀リング
    ctx.strokeStyle = ringStroke;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(128, 128, 108, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = is13
      ? "rgba(216, 180, 254, 0.24)"
      : "rgba(125, 211, 252, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(128, 128, 99, 0, Math.PI * 2);
    ctx.stroke();

    // 星座のイラスト描画
    drawConstellationFigure(ctx, c.id, primaryStroke, fillTint);

    // 下部に星座記号と名前を鮮明に印字
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      '700 22px "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif';
    ctx.fillStyle = is13 ? "#f5d0fe" : "#fef3c7";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 8;
    const caption = is13 ? `${c.symbol} ${c.nameJa}(13)` : `${c.symbol} ${c.nameJa}`;
    ctx.fillText(caption, 128, 206);
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    textures.set(c.id, tex);
  }

  return {
    textures,
    dispose: () => {
      for (const tex of textures.values()) {
        tex.dispose();
      }
    },
  };
}
