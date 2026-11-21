import * as THREE from "three";
import type { CelestialBodyId } from "../data/celestialBodies";

/**
 * 星座の星・星座の線・星座の形の線を「押して選ぶ」ための当たり判定をまとめたモジュールです。
 *
 * 星座の星は、たくさんの点をまとめて1つの点群（THREE.Points）として描いているため、
 * 星ごとに 3D の球を作る代わりに、画面に写した位置と押した位置の距離（ピクセル）で判定します。
 *
 * 判定の順番（EarthGlobeCanvas.tsx の pickCelestialBodyAtClientPos から呼びます）：
 * 1. 太陽系の天体・主要15恒星（今までの判定。球に当たるか、中心から 14px 以内）
 * 2. 星座の星：画面上で星から SKY_STAR_PICK_RADIUS_PX（12px）以内の、いちばん近い星
 * 3. 星座の線・星座の形の線：画面上で線から SKY_LINE_PICK_RADIUS_PX（8px）以内の、いちばん近い線
 *    （星座の線と星座の形の線が重なるところでは、上に目立つ色で描いている星座の形を選びます）
 */

/** 星座の星を選べる、星からの画面上の距離（ピクセル） */
export const SKY_STAR_PICK_RADIUS_PX = 12;
/** 星座の線を選べる、線からの画面上の距離（ピクセル） */
export const SKY_LINE_PICK_RADIUS_PX = 8;
/** 星座の線と星座の形の線がほぼ同じ距離のとき、星座の形を選ぶためのおまけ（ピクセル） */
const ASTERISM_LINE_BONUS_PX = 2;

/** 1つの星の当たり判定 */
interface SkyStarTarget {
  id: CelestialBodyId;
  /** 星を描いているグループ（このグループの中の位置で持ちます） */
  group: THREE.Object3D;
  localPos: THREE.Vector3;
  /** 地上視点で、地平線より下なら選べないようにするか */
  horizonCheck: boolean;
  /** 解説カードを開いたときに寄る大きさ（カメラの距離の目安） */
  focusRadius: number;
}

/** 1つの星座（または星座の形）の線の当たり判定 */
interface SkyFigureTarget {
  id: CelestialBodyId;
  kind: "constellation" | "asterism";
  group: THREE.Object3D;
  /** 線の両はしの位置（グループの中の位置） */
  segments: Array<[THREE.Vector3, THREE.Vector3]>;
  /** 星座の中心（解説カードを開いたときに見る位置） */
  localCenter: THREE.Vector3;
  horizonCheck: boolean;
  focusRadius: number;
}

/** オブジェクト自身と、その親をたどったすべてが表示中なら true を返します。 */
function isRenderedVisible(obj: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = obj;
  while (current) {
    if (!current.visible) return false;
    current = current.parent;
  }
  return true;
}

/** 点 (px, py) と線分 (ax, ay)-(bx, by) の距離を返します。 */
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = 0;
  if (lenSq > 1e-9) {
    t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
  }
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export interface SkyPickRegistry {
  /** 星を1つ登録します。 */
  addStar: (
    id: CelestialBodyId,
    group: THREE.Object3D,
    localPos: THREE.Vector3,
    options: { horizonCheck: boolean; focusRadius: number }
  ) => void;
  /** 星座（または星座の形）の線を登録します。 */
  addFigure: (
    id: CelestialBodyId,
    kind: "constellation" | "asterism",
    group: THREE.Object3D,
    starPositions: THREE.Vector3[],
    edges: ReadonlyArray<readonly [number, number]>,
    options: { horizonCheck: boolean; sphereRadius: number }
  ) => void;
  /** 地上視点のときは地面の上向きのベクトル、それ以外のときは null を渡します（毎フレーム）。 */
  setGroundUp: (up: THREE.Vector3 | null) => void;
  /** 押した位置から、星座の星、星座の線の順に選びます。 */
  pick: (
    clientX: number,
    clientY: number,
    camera: THREE.Camera,
    rect: DOMRect
  ) => CelestialBodyId | null;
  /** この ID の当たり判定が登録されているか */
  has: (id: CelestialBodyId) => boolean;
  /** 解説カードを開いたときに見る位置（outPos）と大きさ（戻り値）。登録がなければ null */
  getFocus: (id: CelestialBodyId, outPos: THREE.Vector3) => number | null;
}

/** 星座の当たり判定をまとめる入れ物を作ります。 */
export function createSkyPickRegistry(): SkyPickRegistry {
  const stars: SkyStarTarget[] = [];
  const figures: SkyFigureTarget[] = [];
  const registeredIds = new Set<CelestialBodyId>();
  const groundUp = new THREE.Vector3();
  let useGroundUp = false;

  // 計算に使う作業用のベクトル（毎回 new しないよう使い回します）
  const tmpWorld = new THREE.Vector3();
  const tmpWorldB = new THREE.Vector3();
  const tmpOrigin = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();

  /** グループの中の位置が、地上視点で地平線より上にあるか（地上視点でなければ常に true） */
  const isAboveHorizon = (group: THREE.Object3D, worldPos: THREE.Vector3) => {
    if (!useGroundUp) return true;
    group.getWorldPosition(tmpOrigin);
    tmpDir.copy(worldPos).sub(tmpOrigin).normalize();
    return tmpDir.dot(groundUp) > 0;
  };

  /** ワールド座標を画面のピクセル位置へ写します。カメラの後ろなら null を返します。 */
  const toScreen = (
    worldPos: THREE.Vector3,
    camera: THREE.Camera,
    rect: DOMRect
  ): { x: number; y: number } | null => {
    const p = worldPos.clone().project(camera);
    if (p.z < -1 || p.z > 1) return null;
    return {
      x: ((p.x + 1) / 2) * rect.width + rect.left,
      y: ((1 - p.y) / 2) * rect.height + rect.top,
    };
  };

  return {
    addStar(id, group, localPos, options) {
      stars.push({
        id,
        group,
        localPos: localPos.clone(),
        horizonCheck: options.horizonCheck,
        focusRadius: options.focusRadius,
      });
      registeredIds.add(id);
    },

    addFigure(id, kind, group, starPositions, edges, options) {
      const segments: Array<[THREE.Vector3, THREE.Vector3]> = [];
      for (const [a, b] of edges) {
        const pa = starPositions[a];
        const pb = starPositions[b];
        if (pa && pb) segments.push([pa.clone(), pb.clone()]);
      }
      // 星の向きの平均を「星座の中心の向き」にし、中心からいちばん離れた星までの角度で大きさを決めます
      const centerDir = new THREE.Vector3();
      for (const p of starPositions) centerDir.add(tmpDir.copy(p).normalize());
      centerDir.normalize();
      let maxAngle = 0;
      for (const p of starPositions) {
        maxAngle = Math.max(maxAngle, centerDir.angleTo(p));
      }
      const localCenter = centerDir.clone().multiplyScalar(options.sphereRadius);
      // カメラが天球の内側に収まるよう、大きさには上限を付けます
      const focusRadius = THREE.MathUtils.clamp(
        options.sphereRadius * Math.sin(maxAngle) * 1.15,
        options.sphereRadius * 0.04,
        options.sphereRadius * 0.24
      );
      figures.push({
        id,
        kind,
        group,
        segments,
        localCenter,
        horizonCheck: options.horizonCheck,
        focusRadius,
      });
      registeredIds.add(id);
    },

    setGroundUp(up) {
      if (up) {
        groundUp.copy(up).normalize();
        useGroundUp = true;
      } else {
        useGroundUp = false;
      }
    },

    pick(clientX, clientY, camera, rect) {
      // 2) 星座の星：画面上でいちばん近い星（12px 以内）
      let bestStar: { id: CelestialBodyId; distPx: number } | null = null;
      for (const s of stars) {
        if (!isRenderedVisible(s.group)) continue;
        tmpWorld.copy(s.localPos);
        s.group.localToWorld(tmpWorld);
        if (s.horizonCheck && !isAboveHorizon(s.group, tmpWorld)) continue;
        const sp = toScreen(tmpWorld, camera, rect);
        if (!sp) continue;
        const distPx = Math.hypot(sp.x - clientX, sp.y - clientY);
        if (distPx > SKY_STAR_PICK_RADIUS_PX) continue;
        if (!bestStar || distPx < bestStar.distPx) {
          bestStar = { id: s.id, distPx };
        }
      }
      if (bestStar) return bestStar.id;

      // 3) 星座の線・星座の形の線：画面上でいちばん近い線（8px 以内）
      let bestLine: { id: CelestialBodyId; score: number } | null = null;
      for (const f of figures) {
        if (!isRenderedVisible(f.group)) continue;
        for (const [a, b] of f.segments) {
          tmpWorld.copy(a);
          f.group.localToWorld(tmpWorld);
          tmpWorldB.copy(b);
          f.group.localToWorld(tmpWorldB);
          if (
            f.horizonCheck &&
            (!isAboveHorizon(f.group, tmpWorld) || !isAboveHorizon(f.group, tmpWorldB))
          ) {
            continue;
          }
          const sa = toScreen(tmpWorld, camera, rect);
          const sb = toScreen(tmpWorldB, camera, rect);
          if (!sa || !sb) continue;
          const distPx = distanceToSegment(clientX, clientY, sa.x, sa.y, sb.x, sb.y);
          if (distPx > SKY_LINE_PICK_RADIUS_PX) continue;
          const score = f.kind === "asterism" ? distPx - ASTERISM_LINE_BONUS_PX : distPx;
          if (!bestLine || score < bestLine.score) {
            bestLine = { id: f.id, score };
          }
        }
      }
      return bestLine ? bestLine.id : null;
    },

    has(id) {
      return registeredIds.has(id);
    },

    getFocus(id, outPos) {
      // 今画面に描かれているもの（なければ最初に登録したもの）の位置に寄ります
      let star: SkyStarTarget | null = null;
      for (const s of stars) {
        if (s.id !== id) continue;
        if (!star) star = s;
        if (isRenderedVisible(s.group)) {
          star = s;
          break;
        }
      }
      if (star) {
        outPos.copy(star.localPos);
        star.group.localToWorld(outPos);
        return star.focusRadius;
      }
      let figure: SkyFigureTarget | null = null;
      for (const f of figures) {
        if (f.id !== id) continue;
        if (!figure) figure = f;
        if (isRenderedVisible(f.group)) {
          figure = f;
          break;
        }
      }
      if (figure) {
        outPos.copy(figure.localCenter);
        figure.group.localToWorld(outPos);
        return figure.focusRadius;
      }
      return null;
    },
  };
}
