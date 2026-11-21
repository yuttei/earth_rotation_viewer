/**
 * 衛星を持つ惑星のまわりだけ、物理上の位置を「描く位置」へ広げて見せる変換（表示用のゆがみ）です。
 *
 * 衝突シミュレーターの重力の計算は実際の距離で行います。実際の距離のままだと、月は描いた地球（拡大して描いている）の
 * 内側に入り、木星の4衛星も描いた木星の内側に入って見えません。そこで母惑星の中心のまわりを次のように広げて描きます。
 * 当たり判定も、この変換で直した「描く位置」で行います（impactPhysics.ts）。
 *
 * - 内側（中心からの距離 d が innerRadius 以下）：d × 倍率 factor の位置に描く（衛星はすべてここに入ります）
 * - 外側（outerRadius 以上）：そのままの位置に描く（ほかの惑星や太陽には影響しません）
 * - その間：2つをまっすぐ（直線）つないで、位置が途切れずに移るようにする
 *
 * 母惑星から見た向きは変えず、距離だけを変えます。逆の変換（描く位置 → 物理上の位置）も用意し、
 * 画面で狙った位置を物理計算の位置に直すときに使います。
 */

/** x・y・z を持つ3次元の点（three.js の Vector3 もこの形で渡せます） */
export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

/** 位置を広げて描く範囲（母惑星1つぶん） */
export interface DisplayWarpHost {
  /**
   * 変換の中心（物理上の位置）。ふつうは母惑星の中心です（惑星そのものは位置を誇張しないので、描く位置と同じ）。
   * 母惑星が衝突で消えたあとは、生き残っている衛星たちの重心と一緒に動く点です（impactPhysics.ts の resolveSatelliteHost）。
   */
  center: Vec3Like;
  /** 内側で距離に掛ける倍率（地球と月の系で約 27.5、木星の系で約 122） */
  factor: number;
  /** この距離までは倍率どおりに広げます（物理上の距離・シーン単位） */
  innerRadius: number;
  /** この距離から外は変換しません（物理上の距離 = 描く距離） */
  outerRadius: number;
  /**
   * 変換の効き具合（1 = そのまま効く、0 = 効かない）。
   * 衝突シミュレーターでは、その系の母惑星か衛星が1つでも残っていれば 1、すべて消えたら 0 にします。
   */
  weight: number;
}

/** 内側と外側をつなぐ部分の傾き（物理の距離が1増えると描く距離がいくつ増えるか） */
function shellSlope(host: DisplayWarpHost): number {
  return (
    (host.outerRadius - host.factor * host.innerRadius) /
    (host.outerRadius - host.innerRadius)
  );
}

/** 物理上の距離 d を、描く距離に直します（weight も反映） */
function forwardDistance(host: DisplayWarpHost, d: number): number {
  let warped: number;
  if (d <= host.innerRadius) {
    warped = d * host.factor;
  } else if (d < host.outerRadius) {
    warped =
      host.factor * host.innerRadius + (d - host.innerRadius) * shellSlope(host);
  } else {
    warped = d;
  }
  return d + host.weight * (warped - d);
}

/** 描く距離 D を、物理上の距離に直します（forwardDistance の逆） */
function inverseDistance(host: DisplayWarpHost, displayD: number): number {
  const w = host.weight;
  const k = host.factor;
  const s = shellSlope(host);
  // 内側の境目（物理 innerRadius）が、描く距離ではどこになるか
  const innerBoundary = host.innerRadius * (1 + w * (k - 1));
  if (displayD <= innerBoundary) {
    return displayD / (1 + w * (k - 1));
  }
  if (displayD < host.outerRadius) {
    const offset = w * (k * host.innerRadius - host.innerRadius * s);
    return (displayD - offset) / (1 + w * (s - 1));
  }
  return displayD;
}

/** 点 p がどの母惑星の範囲に入っているかを探します（入っていなければ null。重なるときは中心に近いほう） */
function pickHost(
  p: Vec3Like,
  hosts: ReadonlyArray<DisplayWarpHost>
): { host: DisplayWarpHost; dist: number } | null {
  let best: { host: DisplayWarpHost; dist: number } | null = null;
  let bestRatio = Infinity;
  for (const host of hosts) {
    if (host.weight <= 0) continue;
    const dist = Math.hypot(
      p.x - host.center.x,
      p.y - host.center.y,
      p.z - host.center.z
    );
    if (dist >= host.outerRadius) continue;
    const ratio = dist / host.outerRadius;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      best = { host, dist };
    }
  }
  return best;
}

/** 母惑星から点 p への向きを保ったまま、距離だけを newDist にした点を out に書き込みます */
function placeAlongRay(
  host: DisplayWarpHost,
  p: Vec3Like,
  dist: number,
  newDist: number,
  out: Vec3Like
): Vec3Like {
  if (dist < 1e-12) {
    out.x = p.x;
    out.y = p.y;
    out.z = p.z;
    return out;
  }
  const scale = newDist / dist;
  out.x = host.center.x + (p.x - host.center.x) * scale;
  out.y = host.center.y + (p.y - host.center.y) * scale;
  out.z = host.center.z + (p.z - host.center.z) * scale;
  return out;
}

/**
 * 物理上の位置を、画面に描く位置に直して out に書き込みます（out は p と同じでもかまいません）。
 * どの母惑星の範囲にも入っていなければ、そのままの位置です。
 */
export function warpPhysicsToDisplay(
  p: Vec3Like,
  hosts: ReadonlyArray<DisplayWarpHost>,
  out: Vec3Like
): Vec3Like {
  const picked = pickHost(p, hosts);
  if (!picked) {
    out.x = p.x;
    out.y = p.y;
    out.z = p.z;
    return out;
  }
  return placeAlongRay(
    picked.host,
    p,
    picked.dist,
    forwardDistance(picked.host, picked.dist),
    out
  );
}

/**
 * 画面に描く位置を、物理上の位置に直して out に書き込みます（warpPhysicsToDisplay の逆）。
 * 画面で狙った位置を、物理計算で天体を置く位置に直すときに使います。
 */
export function warpDisplayToPhysics(
  p: Vec3Like,
  hosts: ReadonlyArray<DisplayWarpHost>,
  out: Vec3Like
): Vec3Like {
  // 描く範囲の外側の境目は物理上と同じ距離なので、同じ方法で母惑星を選べます
  const picked = pickHost(p, hosts);
  if (!picked) {
    out.x = p.x;
    out.y = p.y;
    out.z = p.z;
    return out;
  }
  return placeAlongRay(
    picked.host,
    p,
    picked.dist,
    inverseDistance(picked.host, picked.dist),
    out
  );
}
