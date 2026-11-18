import * as THREE from "three";

/**
 * 地球本体と大気ハローに使うカスタム GLSL シェーダーを生成するモジュールです。
 * 昼夜の滑らかな薄明（トワイライト）表現や、夜側の街明かりの点灯、
 * 「宇宙リアル」と「天文図解」の2つのビジュアルモードを1つの地球儀で切り替えられます。
 */

const EARTH_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
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
  uniform float uIsDiagram;
  uniform float uShowTerminatorHighlight;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);

    vec3 baseColor = texture2D(uDayMap, vUv).rgb;
    vec3 maskData = texture2D(uMaskMap, vUv).rgb;
    float landMask = maskData.r;   // 0.0 = 海, 1.0 = 陸
    float cityLight = maskData.g;  // 夜間に光る都市の光度

    // 太陽光線と地表法線の内積（+1が太陽直下、0が昼夜境界線、-1が真夜中の裏側）
    float ndotl = dot(normal, sunDir);

    // 昼と夜の滑らかな遷移（薄明帯の表現）
    float twilightWidth = mix(0.14, 0.07, uIsDiagram);
    float dayFactor = smoothstep(-twilightWidth * 0.75, twilightWidth, ndotl);

    // 昼側の拡散光（リアルモードでは立体感ある陰影、図解モードでは均一で見やすく）
    float diffuse = max(ndotl, 0.0);
    float realisticShade = mix(0.68, 1.15, pow(diffuse, 0.65));
    float diagramShade = mix(0.92, 1.06, diffuse);
    vec3 dayColor = baseColor * mix(realisticShade, diagramShade, uIsDiagram);

    // 海面だけの太陽鏡面反射（リアルモード時のみ上品なハイライトを追加）
    vec3 halfVec = normalize(sunDir + viewDir);
    float specBase = pow(max(dot(normal, halfVec), 0.0), 42.0);
    float oceanSpecular = specBase * (1.0 - landMask) * smoothstep(0.0, 0.25, ndotl) * (1.0 - uIsDiagram);
    dayColor += vec3(0.45, 0.65, 0.85) * oceanSpecular * 0.35;

    // 夜側の色（完全に黒く潰さず、輪郭と地形が視認できる濃紺にする）
    vec3 realisticNight = baseColor * vec3(0.14, 0.19, 0.30) + vec3(0.018, 0.032, 0.068);
    vec3 diagramNight = baseColor * vec3(0.32, 0.39, 0.54) + vec3(0.015, 0.025, 0.06);
    vec3 nightColor = mix(realisticNight, diagramNight, uIsDiagram);

    // 夜側に入った地域で都市の街明かりを点灯させる
    float nightVisibility = smoothstep(0.04, -0.18, ndotl);
    vec3 lightTint = mix(vec3(1.0, 0.76, 0.38), vec3(1.0, 0.88, 0.55), uIsDiagram * 0.5);
    float lightStrength = mix(1.25, 0.55, uIsDiagram);
    nightColor += lightTint * cityLight * nightVisibility * lightStrength;

    // 昼と夜を合成
    vec3 finalColor = mix(nightColor, dayColor, dayFactor);

    // 昼夜境界付近の薄明（朝焼け・夕焼け）の散乱光
    float twilightBand = exp(-pow(ndotl * 12.0, 2.0));
    vec3 twilightTint = mix(vec3(0.95, 0.44, 0.18), vec3(0.42, 0.80, 1.0), uIsDiagram);
    finalColor += twilightTint * twilightBand * mix(0.18, 0.12, uIsDiagram);

    // 昼夜境界線（ターミネーター）の補助強調ライン
    if (uShowTerminatorHighlight > 0.5) {
      float lineBand = smoothstep(0.020, 0.002, abs(ndotl));
      vec3 lineTint = mix(vec3(0.98, 0.74, 0.35), vec3(0.38, 0.88, 1.0), uIsDiagram);
      finalColor = mix(finalColor, lineTint, lineBand * mix(0.45, 0.72, uIsDiagram));
    }

    // 地球外周の大気リムライト（フレネル反射）
    float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.4);
    float sunFacingRim = smoothstep(-0.35, 0.65, ndotl);
    vec3 rimColor = mix(vec3(0.28, 0.62, 1.0), vec3(0.45, 0.82, 1.0), uIsDiagram);
    finalColor += rimColor * fresnel * mix(0.22, 0.65, sunFacingRim) * mix(0.85, 0.45, uIsDiagram);

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
  uniform float uIsDiagram;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 sunDir = normalize(uSunDirection);

    // 裏面描画（BackSide）のため、視線と逆向きの法線で縁の輝きを計算します。
    float intensity = pow(max(0.0, 0.68 - dot(normal, -viewDir)), 3.2);
    float daySide = smoothstep(-0.4, 0.7, dot(normal, sunDir));
    float alpha = intensity * mix(0.25, 0.95, daySide) * mix(0.55, 0.25, uIsDiagram);

    vec3 glowColor = mix(vec3(0.26, 0.60, 1.0), vec3(0.40, 0.80, 1.0), uIsDiagram);
    gl_FragColor = vec4(glowColor, alpha);
  }
`;

export interface EarthMaterialBundle {
  material: THREE.ShaderMaterial;
  uniforms: {
    uDayMap: { value: THREE.Texture };
    uMaskMap: { value: THREE.Texture };
    uSunDirection: { value: THREE.Vector3 };
    uIsDiagram: { value: number };
    uShowTerminatorHighlight: { value: number };
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
    uIsDiagram: { value: 0 },
    uShowTerminatorHighlight: { value: 1 },
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

/**
 * 地球の輪郭を包む青い大気ハロー（外気圏の光）用 ShaderMaterial を生成します。
 */
export function createAtmosphereMaterial(): {
  material: THREE.ShaderMaterial;
  uniforms: {
    uSunDirection: { value: THREE.Vector3 };
    uIsDiagram: { value: number };
  };
} {
  const uniforms = {
    uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
    uIsDiagram: { value: 0 },
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
