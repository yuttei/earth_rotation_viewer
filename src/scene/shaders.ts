import * as THREE from "three";

/**
 * 地球本体と大気ハローに使うカスタム GLSL シェーダーを生成するモジュールです。
 * 宇宙リアル表現として、昼夜の滑らかな薄明（トワイライト）、海面の鏡面反射、
 * 夜側の街明かりの点灯、大気リムライトを描画します。
 */

const EARTH_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vLocalNormal = normalize(position);
    // 法線と頂点座標をワールド空間（地球が自転した後の向き）に変換します。
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uDayMap;
  uniform sampler2D uMaskMap;
  uniform vec3 uSunDirection;
  uniform float uShowTerminatorHighlight;
  uniform vec4 uSolarEclipseSpot;
  uniform vec3 uImpactDir;
  uniform vec4 uImpactParams; // x: craterRad, y: heat(0..1), z: crackIntensity(0..1), w: shockAngleRad
  uniform vec3 uImpactColor;
  uniform float uImpactTime;

  varying vec2 vUv;
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float impactHash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float impactNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = impactHash(i);
    float n100 = impactHash(i + vec3(1.0, 0.0, 0.0));
    float n010 = impactHash(i + vec3(0.0, 1.0, 0.0));
    float n110 = impactHash(i + vec3(1.0, 1.0, 0.0));
    float n001 = impactHash(i + vec3(0.0, 0.0, 1.0));
    float n101 = impactHash(i + vec3(1.0, 0.0, 1.0));
    float n011 = impactHash(i + vec3(0.0, 1.0, 1.0));
    float n111 = impactHash(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
  }

  float impactFbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * impactNoise(p);
      p = p * 2.12 + vec3(1.9, 5.4, 3.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 localN = normalize(vLocalNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    vec3 baseColor = texture2D(uDayMap, vUv).rgb;
    vec3 maskData = texture2D(uMaskMap, vUv).rgb;
    float landMask = maskData.r;   // 0.0 = 海, 1.0 = 陸
    float cityLight = maskData.g;  // 夜間に光る都市の光度

    // 太陽光線と地表法線の内積（+1が太陽直下、0が昼夜境界線、-1が真夜中の裏側）
    float ndotl = dot(normal, sunDir);

    // 昼と夜の滑らかな遷移（薄明帯の表現）
    float twilightWidth = 0.14;
    float dayFactor = smoothstep(-twilightWidth * 0.75, twilightWidth, ndotl);

    // 昼側の拡散光（立体感ある陰影）
    float diffuse = max(ndotl, 0.0);
    float realisticShade = mix(0.68, 1.15, pow(diffuse, 0.65));
    vec3 dayColor = baseColor * realisticShade;

    // 海面だけの太陽鏡面反射（上品なハイライトを追加）
    vec3 halfVec = normalize(sunDir + viewDir);
    float specBase = pow(max(dot(normal, halfVec), 0.0), 42.0);
    float oceanSpecular = specBase * (1.0 - landMask) * smoothstep(0.0, 0.25, ndotl);
    dayColor += vec3(0.45, 0.65, 0.85) * oceanSpecular * 0.35;

    // 日食時：地球の昼面に落ちる月の影（中心の濃い本影スポットと周囲の半影）
    if (uSolarEclipseSpot.w > 0.01 && ndotl > 0.0) {
      vec3 spotDir = normalize(uSolarEclipseSpot.xyz);
      float angularDist = acos(clamp(dot(normal, spotDir), -1.0, 1.0));
      float penumbra = (1.0 - smoothstep(0.08, 0.42, angularDist)) * uSolarEclipseSpot.w;
      float umbra = (1.0 - smoothstep(0.035, 0.11, angularDist)) * uSolarEclipseSpot.w;
      dayColor *= mix(1.0, 0.38, penumbra);
      dayColor = mix(dayColor, baseColor * vec3(0.08, 0.10, 0.18), umbra * 0.92);
    }

    // 夜側の色（完全に黒く潰さず、輪郭と地形が視認できる濃紺にする）
    vec3 nightColor = baseColor * vec3(0.14, 0.19, 0.30) + vec3(0.018, 0.032, 0.068);

    // 夜側に入った地域で都市の街明かりを点灯させる
    float nightVisibility = smoothstep(0.04, -0.18, ndotl);
    nightColor += vec3(1.0, 0.76, 0.38) * cityLight * nightVisibility * 1.25;

    // 昼と夜を合成
    vec3 finalColor = mix(nightColor, dayColor, dayFactor);

    // 昼夜境界付近の薄明（朝焼け・夕焼け）の散乱光
    float twilightBand = exp(-pow(ndotl * 12.0, 2.0));
    finalColor += vec3(0.95, 0.44, 0.18) * twilightBand * 0.18;

    // 昼夜境界線（ターミネーター）の補助強調ライン
    if (uShowTerminatorHighlight > 0.5) {
      float lineBand = smoothstep(0.020, 0.002, abs(ndotl));
      finalColor = mix(finalColor, vec3(0.98, 0.74, 0.35), lineBand * 0.45);
    }

    // 天体衝突ダメージ表現（クレーター傷・焦げ跡・衝撃波リング・惑星全体のマグマ亀裂）
    float impactHeat = uImpactParams.y;
    float crackLevel = uImpactParams.z;
    if (impactHeat > 0.002 || crackLevel > 0.002) {
      vec3 impDir = normalize(uImpactDir);
      float ang = acos(clamp(dot(localN, impDir), -1.0, 1.0));
      float n1 = impactFbm(localN * 6.5 + vec3(uImpactTime * 0.12));
      float n2 = impactFbm(localN * 14.0 - vec3(uImpactTime * 0.18));
      float craterRad = max(0.05, uImpactParams.x);
      float jaggedAng = ang + (n1 - 0.5) * craterRad * 0.42;

      // 1) クレーター周辺の焦げ跡（イジェクタ・ブラスト痕）
      float scorch = (1.0 - smoothstep(craterRad * 0.7, craterRad * 2.1, jaggedAng)) * impactHeat;
      vec3 charredCrust = vec3(0.07, 0.045, 0.04);
      finalColor = mix(finalColor, charredCrust, clamp(scorch * 0.88, 0.0, 0.92));

      // 2) クレーター内部の灼熱マグマ溜まりと白熱リム
      float moltenCore = (1.0 - smoothstep(craterRad * 0.18, craterRad * 0.98, jaggedAng)) * impactHeat;
      float craterRim = exp(-pow((jaggedAng - craterRad * 0.92) / max(0.04, craterRad * 0.22), 2.0)) * impactHeat;
      float pulse = 0.86 + 0.14 * sin(uImpactTime * 4.5 + n2 * 8.0);
      vec3 hotCoreCol = mix(uImpactColor, vec3(1.0, 0.97, 0.84), smoothstep(0.35, 0.95, moltenCore * n1 * 1.6));
      finalColor = mix(finalColor, hotCoreCol * 1.45 * pulse, clamp(moltenCore * 1.15, 0.0, 1.0));
      finalColor += uImpactColor * craterRim * 0.95;

      // 3) 地表を伝わる衝撃波リング（地球の裏側まで走る圧縮波）
      float shockAng = uImpactParams.w;
      if (shockAng > 0.02 && shockAng < 3.25) {
        float ringWave = exp(-pow((ang - shockAng) / 0.11, 2.0)) * (1.0 - shockAng / 3.3);
        finalColor += mix(uImpactColor, vec3(1.0, 0.98, 0.92), 0.6) * ringWave * impactHeat * 1.5;
      }

      // 4) 中〜超大規模衝突時の惑星規模マグマ亀裂（テクトニック・クラック）
      if (crackLevel > 0.01) {
        float ridgeA = 1.0 - abs(impactNoise(localN * 5.2 + vec3(n1 * 1.4)) * 2.0 - 1.0);
        float ridgeB = 1.0 - abs(impactNoise(localN * 11.5 - vec3(n2 * 1.2)) * 2.0 - 1.0);
        float crackNet = pow(max(ridgeA, ridgeB * 0.88), 6.5);
        float spreadMask = 1.0 - smoothstep(0.25, mix(1.0, 3.25, crackLevel), ang);
        float crackGlow = clamp(crackNet * spreadMask * crackLevel * 2.4, 0.0, 1.0);
        vec3 lavaVein = mix(vec3(0.95, 0.16, 0.03), vec3(1.0, 0.92, 0.55), crackGlow);
        finalColor = mix(finalColor, charredCrust * 0.9, spreadMask * crackLevel * 0.52);
        finalColor += lavaVein * crackGlow * 1.85 * pulse;
      }
    }

    // 地球外周の大気リムライト（フレネル反射：衝突時は灼熱色に変化）
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.4);
    float sunFacingRim = smoothstep(-0.35, 0.65, ndotl);
    vec3 rimCol = mix(vec3(0.28, 0.62, 1.0), uImpactColor, clamp(crackLevel * 0.85, 0.0, 0.9));
    finalColor += rimCol * fresnel * mix(0.22, 0.65, sunFacingRim) * (0.85 + crackLevel * 0.9);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform float uImpactHeat;
  uniform vec3 uImpactColor;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 sunDir = normalize(uSunDirection);

    // 裏面描画（BackSide）のため、視線と逆向きの法線で縁の輝きを計算します。
    float intensity = pow(max(0.0, 0.68 - dot(normal, -viewDir)), 3.2);
    float daySide = smoothstep(-0.4, 0.7, dot(normal, sunDir));
    float baseAlpha = intensity * mix(0.25, 0.95, daySide) * 0.55;
    float hotAlpha = intensity * uImpactHeat * 0.95;
    vec3 col = mix(vec3(0.26, 0.60, 1.0), uImpactColor, clamp(uImpactHeat, 0.0, 1.0));

    gl_FragColor = vec4(col, clamp(baseAlpha + hotAlpha, 0.0, 1.0));
  }
`;

export interface EarthMaterialBundle {
  material: THREE.ShaderMaterial;
  uniforms: {
    uDayMap: { value: THREE.Texture };
    uMaskMap: { value: THREE.Texture };
    uSunDirection: { value: THREE.Vector3 };
    uShowTerminatorHighlight: { value: number };
    uSolarEclipseSpot: { value: THREE.Vector4 };
    uImpactDir: { value: THREE.Vector3 };
    uImpactParams: { value: THREE.Vector4 };
    uImpactColor: { value: THREE.Vector3 };
    uImpactTime: { value: number };
  };
}

/**
 * 地球儀本体に貼り付けるカスタム ShaderMaterial を生成します。
 */
export function createEarthMaterial(
  initialDayMap: THREE.Texture,
  maskMap: THREE.Texture
): EarthMaterialBundle {
  const uniforms = {
    uDayMap: { value: initialDayMap },
    uMaskMap: { value: maskMap },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uShowTerminatorHighlight: { value: 1 },
    uSolarEclipseSpot: { value: new THREE.Vector4(1, 0, 0, 0) },
    uImpactDir: { value: new THREE.Vector3(0, 0, 1) },
    uImpactParams: { value: new THREE.Vector4(0.35, 0, 0, 0) },
    uImpactColor: { value: new THREE.Vector3(1.0, 0.45, 0.1) },
    uImpactTime: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: EARTH_VERTEX_SHADER,
    fragmentShader: EARTH_FRAGMENT_SHADER,
  });

  return { material, uniforms };
}

const SUN_VERTEX_SHADER = /* glsl */ `
  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vLocalNormal = normalize(position);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SUN_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;

  varying vec3 vLocalNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  // 軽量な 3D 値ノイズで太陽表面の対流セル（粒状斑）を表現します。
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3D(p);
      p = p * 2.05 + vec3(1.7, 9.2, 4.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    // 太陽表面を時間でゆっくり流動させます。
    float gran = fbm(vLocalNormal * 4.5 + vec3(uTime * 0.12, -uTime * 0.09, uTime * 0.07));
    float flare = fbm(vLocalNormal * 9.0 - vec3(uTime * 0.18));
    float pattern = clamp(gran * 0.65 + flare * 0.35, 0.0, 1.0);

    // 中心が白熱の黄色、縁に向かってオレンジ色になる周辺減光（Limb Darkening）
    float ndotv = max(dot(normal, viewDir), 0.0);
    float limb = pow(ndotv, 0.45);

    vec3 deepOrange = vec3(0.95, 0.36, 0.06);
    vec3 brightGold = vec3(1.0, 0.78, 0.24);
    vec3 whiteHot = vec3(1.0, 0.96, 0.78);

    vec3 surface = mix(deepOrange, brightGold, smoothstep(0.22, 0.72, pattern));
    surface = mix(surface, whiteHot, smoothstep(0.62, 0.95, pattern) * limb);
    surface *= mix(0.68, 1.15, limb);

    // 縁の紅炎（彩層リム）
    float rim = pow(1.0 - ndotv, 2.6);
    surface += vec3(1.0, 0.52, 0.14) * rim * 0.55;

    gl_FragColor = vec4(surface, 1.0);
  }
`;

const SUN_CORONA_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SUN_CORONA_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    // BackSide の内向き法線を使って太陽外周へ広がるソフトなコロナを描きます。
    float radial = max(0.0, dot(normal, -viewDir));
    float glow = pow(radial, 3.6) * 0.85;
    vec3 coronaColor = mix(vec3(1.0, 0.45, 0.1), vec3(1.0, 0.85, 0.45), radial);
    gl_FragColor = vec4(coronaColor, glow);
  }
`;

/**
 * 太陽本体用のプロシージャルプラズマ ShaderMaterial を生成します。
 */
export function createSunMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: { uTime: { value: number } };
} {
  const uniforms = {
    uTime: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SUN_VERTEX_SHADER,
    fragmentShader: SUN_FRAGMENT_SHADER,
  });
  return { material, uniforms };
}

/**
 * 太陽外周を包む黄金コロナハロー用の ShaderMaterial を生成します。
 */
export function createSunCoronaMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SUN_CORONA_VERTEX_SHADER,
    fragmentShader: SUN_CORONA_FRAGMENT_SHADER,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

const MOON_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vLocalNormal;

  void main() {
    vUv = uv;
    vLocalNormal = normalize(position);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MOON_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMoonMap;
  uniform vec3 uSunDirection;
  uniform vec3 uLunarEclipse;
  uniform float uSolarEclipseSilhouette;
  uniform vec3 uMoonImpactDir;
  uniform vec4 uMoonImpactParams; // x: craterRad, y: heat, z: crackLevel, w: earthMagmaGlow
  uniform vec3 uMoonImpactColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vLocalNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 localN = normalize(vLocalNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 albedo = texture2D(uMoonMap, vUv).rgb;

    // 大気のない月面のくっきりした昼夜境界と、なだらかな拡散反射
    float ndotl = dot(normal, sunDir);
    float dayMask = smoothstep(-0.04, 0.08, ndotl);
    float diffuse = pow(max(ndotl, 0.0), 0.72);

    vec3 sunlit = albedo * mix(0.75, 1.22, diffuse);

    // 月食時（満月が地球の半影・本影を通過するとき）：
    // 月面の各点の対日照点（地球の影の中心）からの角度距離 distDeg を計算し、
    // 半影（1.50°以内）の減光と、本影（0.73°以内）の丸い欠け＆赤銅色（ブラッドムーン）を描画します。
    if (uLunarEclipse.z > 0.01 && dayMask > 0.01) {
      vec2 pointOffsetDeg = vec2(
        uLunarEclipse.x + localN.z * 0.28,
        uLunarEclipse.y + localN.y * 0.28
      );
      float distDeg = length(pointOffsetDeg);

      // 半影（0.73°〜1.50°）による穏やかな減光（半影月食）
      float penumbraKeep = mix(0.32, 1.0, smoothstep(0.73, 1.50, distDeg));
      vec3 penumbraLit = sunlit * mix(1.0, penumbraKeep, uLunarEclipse.z);

      // 本影（0.73°以内）のくっきりした丸い境界と、地球大気屈折による赤銅色（皆既月食・部分月食）
      float umbraMask = (1.0 - smoothstep(0.68, 0.75, distDeg)) * uLunarEclipse.z;
      float umbraDepth = clamp(distDeg / 0.73, 0.0, 1.0);
      vec3 copperCenter = albedo * vec3(0.68, 0.14, 0.04) + vec3(0.10, 0.018, 0.005);
      vec3 copperRim = albedo * vec3(0.96, 0.34, 0.09) + vec3(0.14, 0.04, 0.01);
      vec3 umbraColor = mix(copperCenter, copperRim, pow(umbraDepth, 1.3));

      sunlit = mix(penumbraLit, umbraColor, umbraMask);
    }

    // 影側も完全に真っ黒にせず、地球からの反射光（地球照）でうっすら青白く見せます（日食シルエット時は黒く引き締める）。
    vec3 baseEarthshine = albedo * vec3(0.11, 0.14, 0.22) + vec3(0.015, 0.024, 0.045);
    vec3 darkSilhouette = vec3(0.008, 0.012, 0.024);
    vec3 earthshine = mix(baseEarthshine, darkSilhouette, uSolarEclipseSilhouette);

    vec3 finalColor = mix(earthshine, sunlit, dayMask);

    // 地球がマグマ化・爆発した際の真っ赤な照り返し（月の地球向き面が赤く照らされます）
    if (uMoonImpactParams.w > 0.01) {
      float earthFacing = smoothstep(-0.15, 0.85, localN.x);
      finalColor += uMoonImpactColor * earthFacing * uMoonImpactParams.w * 0.78;
    }

    // 月本体への直撃クレーター・灼熱ひび割れ表現
    if (uMoonImpactParams.y > 0.005 || uMoonImpactParams.z > 0.005) {
      vec3 mImpDir = normalize(uMoonImpactDir);
      float ang = acos(clamp(dot(localN, mImpDir), -1.0, 1.0));
      float cRad = max(0.08, uMoonImpactParams.x);
      float scorch = (1.0 - smoothstep(cRad * 0.65, cRad * 1.9, ang)) * uMoonImpactParams.y;
      float molten = (1.0 - smoothstep(cRad * 0.15, cRad * 0.95, ang)) * uMoonImpactParams.y;
      finalColor = mix(finalColor, vec3(0.05, 0.04, 0.04), clamp(scorch * 0.85, 0.0, 0.9));
      finalColor = mix(finalColor, mix(uMoonImpactColor, vec3(1.0, 0.96, 0.8), molten) * 1.5, clamp(molten, 0.0, 1.0));
      if (uMoonImpactParams.z > 0.01) {
        float crackWave = pow(abs(sin(localN.x * 22.0 + localN.y * 17.0) * sin(localN.z * 19.0 - localN.x * 13.0)), 6.0);
        finalColor += uMoonImpactColor * crackWave * uMoonImpactParams.z * 2.2;
      }
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * 月本体用の ShaderMaterial（太陽光による満ち欠け＋地球照＋月食の本影/半影/赤銅色＋衝突ダメージ表現）を生成します。
 */
export function createMoonMaterial(moonMap: THREE.Texture): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uMoonMap: { value: THREE.Texture };
    uSunDirection: { value: THREE.Vector3 };
    uLunarEclipse: { value: THREE.Vector3 };
    uSolarEclipseSilhouette: { value: number };
    uMoonImpactDir: { value: THREE.Vector3 };
    uMoonImpactParams: { value: THREE.Vector4 };
    uMoonImpactColor: { value: THREE.Vector3 };
  };
} {
  const uniforms = {
    uMoonMap: { value: moonMap },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uLunarEclipse: { value: new THREE.Vector3(0, 0, 0) },
    uSolarEclipseSilhouette: { value: 0 },
    uMoonImpactDir: { value: new THREE.Vector3(1, 0, 0) },
    uMoonImpactParams: { value: new THREE.Vector4(0.4, 0, 0, 0) },
    uMoonImpactColor: { value: new THREE.Vector3(1.0, 0.45, 0.1) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: MOON_VERTEX_SHADER,
    fragmentShader: MOON_FRAGMENT_SHADER,
  });
  return { material, uniforms };
}

const VENUS_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const VENUS_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uVenusMap;
  uniform vec3 uSunDirection;
  uniform vec3 uImpactDir;
  uniform vec4 uImpactParams; // x: craterRad, y: heat, z: crackLevel, w: unused
  uniform vec3 uImpactColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 albedo = texture2D(uVenusMap, vUv).rgb;

    // 分厚い大気を持つ金星は、月よりも柔らかな明暗境界と明るい雲の散乱光を見せます。
    float ndotl = dot(normal, sunDir);
    float dayMask = smoothstep(-0.18, 0.24, ndotl);
    float diffuse = pow(max(ndotl, 0.0), 0.62);

    vec3 sunlit = albedo * mix(0.82, 1.28, diffuse);
    // 大気のリム散乱（昼側の縁が淡い金色に輝きます）
    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.8);
    sunlit += vec3(1.0, 0.92, 0.72) * rim * smoothstep(-0.2, 0.3, ndotl) * 0.34;

    // 夜側も完全な真っ黒にせず、うっすら輪郭が分かる暗褐色に留めます。
    vec3 nightSide = albedo * vec3(0.09, 0.08, 0.07) + vec3(0.02, 0.018, 0.015);
    vec3 finalColor = mix(nightSide, sunlit, dayMask);

    if (uImpactParams.y > 0.005 || uImpactParams.z > 0.005) {
      vec3 impDir = normalize(uImpactDir);
      float ang = acos(clamp(dot(normal, impDir), -1.0, 1.0));
      float cRad = max(0.08, uImpactParams.x);
      float scorch = (1.0 - smoothstep(cRad * 0.65, cRad * 1.9, ang)) * uImpactParams.y;
      float molten = (1.0 - smoothstep(cRad * 0.15, cRad * 0.95, ang)) * uImpactParams.y;
      finalColor = mix(finalColor, vec3(0.06, 0.04, 0.03), clamp(scorch * 0.85, 0.0, 0.9));
      finalColor = mix(finalColor, mix(uImpactColor, vec3(1.0, 0.96, 0.82), molten) * 1.5, clamp(molten, 0.0, 1.0));
      if (uImpactParams.z > 0.01) {
        float crackWave = pow(abs(sin(normal.x * 20.0 + normal.y * 16.0) * sin(normal.z * 18.0 - normal.x * 14.0)), 6.0);
        finalColor += uImpactColor * crackWave * uImpactParams.z * 2.2;
      }
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * 金星本体用の ShaderMaterial（分厚い雲の拡散反射・大気リム光・満ち欠け＋衝突ダメージ表現）を生成します。
 */
export function createVenusMaterial(venusMap: THREE.Texture): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uVenusMap: { value: THREE.Texture };
    uSunDirection: { value: THREE.Vector3 };
    uImpactDir: { value: THREE.Vector3 };
    uImpactParams: { value: THREE.Vector4 };
    uImpactColor: { value: THREE.Vector3 };
  };
} {
  const uniforms = {
    uVenusMap: { value: venusMap },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uImpactDir: { value: new THREE.Vector3(1, 0, 0) },
    uImpactParams: { value: new THREE.Vector4(0.4, 0, 0, 0) },
    uImpactColor: { value: new THREE.Vector3(1.0, 0.45, 0.1) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VENUS_VERTEX_SHADER,
    fragmentShader: VENUS_FRAGMENT_SHADER,
  });
  return { material, uniforms };
}

const PLANET_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLANET_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uSunDirection;
  uniform float uAmbientBoost;
  uniform vec3 uImpactDir;
  uniform vec4 uImpactParams; // x: craterRad, y: heat, z: crackLevel, w: unused
  uniform vec3 uImpactColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 albedo = texture2D(uMap, vUv).rgb;

    float ndotl = dot(normal, sunDir);
    float dayMask = smoothstep(-0.14, 0.22, ndotl);
    float diffuse = pow(max(ndotl, 0.0), 0.72);

    vec3 sunlit = albedo * mix(0.8, 1.32, diffuse);
    vec3 nightSide = albedo * uAmbientBoost;
    vec3 color = mix(nightSide, sunlit, dayMask);

    if (uImpactParams.y > 0.005 || uImpactParams.z > 0.005) {
      vec3 impDir = normalize(uImpactDir);
      float ang = acos(clamp(dot(normal, impDir), -1.0, 1.0));
      float cRad = max(0.08, uImpactParams.x);
      float scorch = (1.0 - smoothstep(cRad * 0.65, cRad * 1.9, ang)) * uImpactParams.y;
      float molten = (1.0 - smoothstep(cRad * 0.15, cRad * 0.95, ang)) * uImpactParams.y;
      color = mix(color, vec3(0.05, 0.04, 0.04), clamp(scorch * 0.85, 0.0, 0.9));
      color = mix(color, mix(uImpactColor, vec3(1.0, 0.96, 0.82), molten) * 1.5, clamp(molten, 0.0, 1.0));
      if (uImpactParams.z > 0.01) {
        float crackWave = pow(abs(sin(normal.x * 20.0 + normal.y * 16.0) * sin(normal.z * 18.0 - normal.x * 14.0)), 6.0);
        color += uImpactColor * crackWave * uImpactParams.z * 2.2;
      }
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * リアル太陽系モードの各惑星（水星・火星・木星・土星・天王星・海王星・冥王星）用 ShaderMaterial を生成します。
 */
export function createPlanetMaterial(
  map: THREE.Texture,
  ambientBoost = 0.24
): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uMap: { value: THREE.Texture };
    uSunDirection: { value: THREE.Vector3 };
    uAmbientBoost: { value: number };
    uImpactDir: { value: THREE.Vector3 };
    uImpactParams: { value: THREE.Vector4 };
    uImpactColor: { value: THREE.Vector3 };
  };
} {
  const uniforms = {
    uMap: { value: map },
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uAmbientBoost: { value: ambientBoost },
    uImpactDir: { value: new THREE.Vector3(1, 0, 0) },
    uImpactParams: { value: new THREE.Vector4(0.4, 0, 0, 0) },
    uImpactColor: { value: new THREE.Vector3(1.0, 0.45, 0.1) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: PLANET_VERTEX_SHADER,
    fragmentShader: PLANET_FRAGMENT_SHADER,
  });
  return { material, uniforms };
}

/**
 * 地球の輪郭を包む青い大気ハロー（外気圏の光）用 ShaderMaterial を生成します。
 */
export function createAtmosphereMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uSunDirection: { value: THREE.Vector3 };
    uImpactHeat: { value: number };
    uImpactColor: { value: THREE.Vector3 };
  };
} {
  const uniforms = {
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uImpactHeat: { value: 0 },
    uImpactColor: { value: new THREE.Vector3(1.0, 0.45, 0.1) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: ATMOSPHERE_VERTEX_SHADER,
    fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return { material, uniforms };
}

const TOKYO_SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vSkyDir;

  void main() {
    // 球メッシュはワールド空間の回転を持たず東京の観測点を中心にするため、position 自体が天球の視線方向になります。
    vSkyDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TOKYO_SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uUpWorld;
  uniform vec3 uSunDirWorld;
  uniform float uOpacity;
  uniform float uEclipseDimming;

  varying vec3 vSkyDir;

  void main() {
    vec3 dir = normalize(vSkyDir);
    vec3 up = normalize(uUpWorld);
    vec3 sunDir = normalize(uSunDirWorld);

    float elev = dot(dir, up);
    float sunElev = dot(sunDir, up);
    float sunAlign = max(dot(dir, sunDir), 0.0);

    // 太陽高度に応じて 昼・薄明（朝焼け/夕焼け）・夜 のブレンド係数を滑らかに求めます（皆既日食時は昼でも薄明〜夜空へ減光）。
    float rawDayFactor = smoothstep(-0.07, 0.22, sunElev);
    float dayFactor = rawDayFactor * (1.0 - uEclipseDimming * 0.92);
    float twilightFactor =
      max(
        smoothstep(-0.24, -0.02, sunElev) * (1.0 - smoothstep(0.03, 0.28, sunElev)),
        rawDayFactor * uEclipseDimming * 0.75
      );
    float horizonGlow = pow(1.0 - clamp(elev, 0.0, 1.0), 2.7);

    // 昼の青空（天頂は深い青、地平線付近は明るい水色＋太陽周辺の柔らかな輝き）
    vec3 dayZenith = vec3(0.08, 0.26, 0.62);
    vec3 dayHorizon = vec3(0.46, 0.75, 0.96);
    vec3 dayColor = mix(dayZenith, dayHorizon, horizonGlow);
    dayColor += vec3(1.0, 0.9, 0.72) * pow(sunAlign, 18.0) * 0.42;
    dayColor += vec3(0.95, 0.96, 1.0) * pow(sunAlign, 4.0) * 0.14;

    // 朝焼け・夕焼け（太陽側の地平線ほど暖かな橙〜茜色に染めます）
    vec3 twZenith = vec3(0.04, 0.09, 0.26);
    vec3 twHorizonCool = vec3(0.24, 0.28, 0.48);
    vec3 twHorizonWarm = vec3(0.96, 0.46, 0.18);
    vec3 twHorizon = mix(twHorizonCool, twHorizonWarm, pow(sunAlign, 1.8));
    vec3 twilightColor = mix(twZenith, twHorizon, pow(1.0 - clamp(elev, 0.0, 1.0), 2.1));

    // 夜空（星空がくっきり透過するよう、地平線付近だけわずかに青みを帯びさせます）
    vec3 nightColor = mix(vec3(0.015, 0.03, 0.08), vec3(0.05, 0.1, 0.2), horizonGlow);

    vec3 skyColor = mix(nightColor, dayColor, dayFactor);
    skyColor = mix(skyColor, twilightColor, twilightFactor * 0.85);

    // 昼間は青空で背景の星を自然に隠し、夜は透明にして実際の3D星空と北極星を見せます。
    float maxDayAlpha = 0.95;
    float nightAlpha = mix(0.06, 0.26, horizonGlow);
    float alpha = mix(nightAlpha, maxDayAlpha, dayFactor);
    alpha = clamp(alpha + twilightFactor * (0.28 + 0.45 * horizonGlow), 0.0, 0.97);

    // 地平線より下は地面メッシュに隠れるため、下側へ滑らかに減衰させます。
    float aboveMask = smoothstep(-0.18, 0.02, elev);
    gl_FragColor = vec4(skyColor, alpha * aboveMask * uOpacity);
  }
`;

/**
 * 東京の地上視点で見上げる大気スカイドーム（昼の青空・朝夕焼け・夜の星空透過）用 ShaderMaterial を生成します。
 */
export function createTokyoSkyMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uUpWorld: { value: THREE.Vector3 };
    uSunDirWorld: { value: THREE.Vector3 };
    uOpacity: { value: number };
    uEclipseDimming: { value: number };
  };
} {
  const uniforms = {
    uUpWorld: { value: new THREE.Vector3(0, 1, 0) },
    uSunDirWorld: { value: new THREE.Vector3(1, 0, 0) },
    uOpacity: { value: 0 },
    uEclipseDimming: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: TOKYO_SKY_VERTEX_SHADER,
    fragmentShader: TOKYO_SKY_FRAGMENT_SHADER,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  });

  return { material, uniforms };
}

const TOKYO_GROUND_VERTEX_SHADER = /* glsl */ `
  varying vec2 vLocalXY;

  void main() {
    // CircleGeometry のローカル平面 (X, Y) を使って観測点からの距離を計算します。
    vLocalXY = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const TOKYO_GROUND_FRAGMENT_SHADER = /* glsl */ `
  uniform float uSunElevation;
  uniform float uOpacity;

  varying vec2 vLocalXY;

  void main() {
    float dist = clamp(length(vLocalXY) / 14.0, 0.0, 1.0);
    float dayFactor = smoothstep(-0.08, 0.25, uSunElevation);
    float twilightFactor =
      smoothstep(-0.22, -0.02, uSunElevation) * (1.0 - smoothstep(0.04, 0.24, uSunElevation));

    vec3 nightNear = vec3(0.02, 0.04, 0.08);
    vec3 nightFar = vec3(0.05, 0.09, 0.16);
    vec3 dayNear = vec3(0.08, 0.14, 0.22);
    vec3 dayFar = vec3(0.18, 0.29, 0.42);

    vec3 nearCol = mix(nightNear, dayNear, dayFactor);
    vec3 farCol = mix(nightFar, dayFar, dayFactor);
    farCol += vec3(0.18, 0.09, 0.05) * twilightFactor;

    // 観測点を中心に同心円状の控えめなグリッド気配を出し、方角感覚をわかりやすくします。
    float ringPattern = smoothstep(0.96, 1.0, abs(sin(dist * 3.14159265 * 6.0))) * 0.045;
    vec3 color = mix(nearCol, farCol, pow(dist, 1.35)) + vec3(0.12, 0.26, 0.38) * ringPattern;

    gl_FragColor = vec4(color, uOpacity);
  }
`;

/**
 * 東京の地上視点における地平線ディスク（地平線下の太陽・月・星を自然に遮蔽）用 ShaderMaterial を生成します。
 */
export function createTokyoGroundMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uSunElevation: { value: number };
    uOpacity: { value: number };
  };
} {
  const uniforms = {
    uSunElevation: { value: 0 },
    uOpacity: { value: 0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: TOKYO_GROUND_VERTEX_SHADER,
    fragmentShader: TOKYO_GROUND_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true,
  });

  return { material, uniforms };
}
