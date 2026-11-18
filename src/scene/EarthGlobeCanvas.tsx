import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  City,
  DisplayLayers,
  ReferenceFrame,
  SolarSystemState,
  VisualStyle,
} from "../types/astronomy";
import {
  EARTH_AXIAL_TILT_DEG,
  degToRad,
  getLocalCompassVectors,
  latLonToVector3Tuple,
  observeCity,
  raDecToVector3Tuple,
} from "../astronomy/calculations";
import { createEarthTextures, EarthTextures } from "./earthTexture";
import { createAtmosphereMaterial, createEarthMaterial } from "./shaders";

/** 3Dカメラが目標とする連続視点パラメータ */
export interface CameraPoseTarget {
  /** 基準平面に対する方位角（ラジアン） */
  yaw: number;
  /** 基準平面からの仰角（π/2 = 真上、0 = 水平真横） */
  pitch: number;
  /** 地球中心からの距離 */
  distance: number;
  /** 座標基準のブレンド率（0 = 天の北極/赤道基準、1 = 公転面/黄道面基準） */
  eclipticBlend: number;
  /** 同じ数値でもアニメーションを再適用するための連番トリガー */
  seq: number;
}

interface EarthGlobeCanvasProps {
  /** 現在の太陽・地球の姿勢状態 */
  solarState: SolarSystemState;
  /** 表示する代表都市の配列 */
  cities: City[];
  /** 現在選択中の都市ID */
  selectedCityId: string;
  /** 都市選択時のコールバック */
  onSelectCity: (cityId: string) => void;
  /** ビジュアルモード（宇宙リアル / 天文図解） */
  visualStyle: VisualStyle;
  /** 基準座標系（太陽方向固定 / 恒星・春分点固定） */
  referenceFrame: ReferenceFrame;
  /** 目標カメラ姿勢（プリセット・連続スライダーから渡されます） */
  cameraPoseTarget: CameraPoseTarget;
  /** 手動ドラッグ時にプリセット選択表示を解除するための通知 */
  onCameraUserDrag: () => void;
  /** 3D補助レイヤーのON/OFF設定 */
  layers: DisplayLayers;
  /** 右側の観察パネルが開いているか（地球儀の水平センタリングを補正するため） */
  isInspectorOpen: boolean;
}

interface CameraPoseState {
  yaw: number;
  pitch: number;
  distance: number;
  eclipticBlend: number;
}

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * 点型の柔らかな星テクスチャをキャンバスで生成します。
 */
function createStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(0.22, "rgba(224, 242, 254, 0.85)");
  grad.addColorStop(0.55, "rgba(148, 163, 184, 0.2)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * 緯度線（定緯度の円）の Line を生成します。
 */
function createLatitudeRing(
  latDeg: number,
  radius: number,
  segments: number,
  material: THREE.Material,
  dashed = false
): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const lonDeg = (i / segments) * 360 - 180;
    const [x, y, z] = latLonToVector3Tuple(latDeg, lonDeg, radius);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  if (dashed) {
    line.computeLineDistances();
  }
  return line;
}

/**
 * 経度線（南北の両極を結ぶ半円弧）の Line を生成します。
 */
function createLongitudeArc(
  lonDeg: number,
  radius: number,
  segments: number,
  material: THREE.Material
): THREE.Line {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const latDeg = -90 + (i / segments) * 180;
    const [x, y, z] = latLonToVector3Tuple(latDeg, lonDeg, radius);
    points.push(new THREE.Vector3(x, y, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geometry, material);
}

/**
 * 指定された 3D 方向を向く矢印グループ（軸＋円錐ヘッド）を生成します。
 */
function createVectorArrow(
  direction: THREE.Vector3,
  length: number,
  color: number,
  opacity = 0.95
): THREE.Group {
  const group = new THREE.Group();
  const dir = direction.clone().normalize();
  const headLength = Math.min(length * 0.28, 0.065);
  const shaftLength = Math.max(0.01, length - headLength);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    dir.clone().multiplyScalar(shaftLength),
  ]);
  const lineMat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  group.add(new THREE.Line(lineGeo, lineMat));

  const coneGeo = new THREE.ConeGeometry(headLength * 0.42, headLength, 14);
  const coneMat = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.copy(dir.clone().multiplyScalar(shaftLength + headLength * 0.5));
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  group.add(cone);

  return group;
}

/**
 * XZ平面上の水平リング（Line）を生成するヘルパーです。
 */
function createHorizontalRing(
  radius: number,
  color: number,
  opacity: number,
  segments = 128
): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, -Math.sin(a) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

/**
 * 3D オブジェクトのワールド座標をスクリーン座標 (px) へ投影してバッジ位置を更新するヘルパーです。
 */
function updateFloatingBadge(
  badgeEl: HTMLSpanElement | null,
  anchorObj: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  hostW: number,
  hostH: number,
  visible: boolean,
  isInspectorOpen: boolean
): void {
  if (!badgeEl) return;
  if (!visible) {
    badgeEl.style.display = "none";
    return;
  }

  const worldPos = new THREE.Vector3();
  anchorObj.getWorldPosition(worldPos);
  const projected = worldPos.project(camera);
  if (projected.z > 1 || projected.z < -1) {
    badgeEl.style.display = "none";
    return;
  }

  const x = (projected.x * 0.5 + 0.5) * hostW;
  const y = (-projected.y * 0.5 + 0.5) * hostH;

  // 右側の観察パネルや上下のバーに隠れない範囲へ安全に収めます。
  const maxX = isInspectorOpen && hostW > 860 ? hostW - 390 : hostW - 72;
  const clampedX = Math.max(60, Math.min(maxX, x));
  const clampedY = Math.max(84, Math.min(hostH - 86, y));

  badgeEl.style.display = "inline-flex";
  badgeEl.style.transform = `translate(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px)`;
}

/**
 * Three.js を使って 3D 地球儀・星空・公転面（黄道面）・太陽方向・局所方位・都市ラベルを描画するキャンバスです。
 */
export const EarthGlobeCanvas: React.FC<EarthGlobeCanvasProps> = ({
  solarState,
  cities,
  selectedCityId,
  onSelectCity,
  visualStyle,
  referenceFrame,
  cameraPoseTarget,
  onCameraUserDrag,
  layers,
  isInspectorOpen,
}) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const labelButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const sunBadgeRef = useRef<HTMLSpanElement | null>(null);
  const equinoxBadgeRef = useRef<HTMLSpanElement | null>(null);

  const latestPropsRef = useRef({
    solarState,
    cities,
    selectedCityId,
    visualStyle,
    referenceFrame,
    layers,
    isInspectorOpen,
  });
  latestPropsRef.current = {
    solarState,
    cities,
    selectedCityId,
    visualStyle,
    referenceFrame,
    layers,
    isInspectorOpen,
  };

  // カメラの現在姿勢とアニメーション目標姿勢を保持します。
  const cameraPoseRef = useRef<{
    current: CameraPoseState;
    target: CameraPoseState;
  }>({
    current: {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
    },
    target: {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
    },
  });

  // 目標姿勢が更新されたら、アニメーションターゲットを差し替えて滑らかに追従させます。
  useEffect(() => {
    cameraPoseRef.current.target = {
      yaw: cameraPoseTarget.yaw,
      pitch: cameraPoseTarget.pitch,
      distance: cameraPoseTarget.distance,
      eclipticBlend: cameraPoseTarget.eclipticBlend,
    };
  }, [
    cameraPoseTarget.yaw,
    cameraPoseTarget.pitch,
    cameraPoseTarget.distance,
    cameraPoseTarget.eclipticBlend,
    cameraPoseTarget.seq,
  ]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);

    // 1. テクスチャとシェーダーの構築
    const textures: EarthTextures = createEarthTextures(
      renderer.capabilities.maxTextureSize
    );
    const starTexture = createStarSpriteTexture();

    const earthBundle = createEarthMaterial(
      textures.realisticMap,
      textures.maskMap
    );
    const atmosphereBundle = createAtmosphereMaterial();

    // 2. 座標系ルート（基準フレーム切り替えでここを回転させます）
    const universeRoot = new THREE.Group();
    scene.add(universeRoot);

    // 3. 恒星背景 & 春分点方向ライン（universeRoot の子）
    const starsGroup = new THREE.Group();
    universeRoot.add(starsGroup);

    const starCount = 2200;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 24 + Math.random() * 28;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const tintPick = Math.random();
      const brightness = 0.55 + Math.random() * 0.45;
      if (tintPick < 0.25) {
        starColors[i * 3] = 0.72 * brightness;
        starColors[i * 3 + 1] = 0.86 * brightness;
        starColors[i * 3 + 2] = 1.0 * brightness;
      } else if (tintPick < 0.8) {
        starColors[i * 3] = 0.94 * brightness;
        starColors[i * 3 + 1] = 0.96 * brightness;
        starColors[i * 3 + 2] = 1.0 * brightness;
      } else {
        starColors[i * 3] = 1.0 * brightness;
        starColors[i * 3 + 1] = 0.85 * brightness;
        starColors[i * 3 + 2] = 0.68 * brightness;
      }
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.42,
      map: starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    starsGroup.add(new THREE.Points(starGeo, starMat));

    const equinoxLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(1.36, 0, 0),
      new THREE.Vector3(1.85, 0, 0),
    ]);
    const equinoxLineMat = new THREE.LineDashedMaterial({
      color: 0xc084fc,
      dashSize: 0.06,
      gapSize: 0.035,
      transparent: true,
      opacity: 0.86,
    });
    const equinoxLine = new THREE.Line(equinoxLineGeo, equinoxLineMat);
    equinoxLine.computeLineDistances();
    starsGroup.add(equinoxLine);

    const equinoxMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xd8b4fe })
    );
    equinoxMarker.position.set(1.88, 0, 0);
    starsGroup.add(equinoxMarker);

    // 4. 天球目盛りリングと反時計回り（自転方向）の矢印（赤道面上）
    const celestialCompassGroup = new THREE.Group();
    universeRoot.add(celestialCompassGroup);

    celestialCompassGroup.add(createHorizontalRing(1.24, 0x38bdf8, 0.24));
    celestialCompassGroup.add(createHorizontalRing(1.33, 0x94a3b8, 0.18));

    const tickPositions: number[] = [];
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const rIn = deg % 90 === 0 ? 1.21 : 1.24;
      const rOut = deg % 90 === 0 ? 1.35 : 1.31;
      tickPositions.push(
        Math.cos(rad) * rIn,
        0,
        -Math.sin(rad) * rIn,
        Math.cos(rad) * rOut,
        0,
        -Math.sin(rad) * rOut
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(tickPositions, 3)
    );
    celestialCompassGroup.add(
      new THREE.LineSegments(
        tickGeo,
        new THREE.LineBasicMaterial({
          color: 0x7dd3fc,
          transparent: true,
          opacity: 0.36,
        })
      )
    );

    const addRotationArc = (startDeg: number, endDeg: number) => {
      const r = 1.15;
      const y = 0.02;
      const pts: THREE.Vector3[] = [];
      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const a = ((startDeg + ((endDeg - startDeg) * i) / steps) * Math.PI) / 180;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, -Math.sin(a) * r));
      }
      const arcLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.88,
        })
      );
      celestialCompassGroup.add(arcLine);

      const endRad = (endDeg * Math.PI) / 180;
      const tipPos = new THREE.Vector3(Math.cos(endRad) * r, y, -Math.sin(endRad) * r);
      const tangent = new THREE.Vector3(-Math.sin(endRad), 0, -Math.cos(endRad)).normalize();
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.064, 14),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      cone.position.copy(tipPos);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      celestialCompassGroup.add(cone);
    };
    addRotationArc(22, 68);
    addRotationArc(202, 248);

    // 4.5. 公転面（黄道面）ガイドグループ：春分点（+X軸）を回転軸として +23.439° 傾けた平面
    const eclipticPlaneGroup = new THREE.Group();
    eclipticPlaneGroup.rotation.x = degToRad(EARTH_AXIAL_TILT_DEG);
    universeRoot.add(eclipticPlaneGroup);

    eclipticPlaneGroup.add(createHorizontalRing(1.44, 0xf59e0b, 0.36, 128));
    eclipticPlaneGroup.add(createHorizontalRing(1.52, 0xfbbf24, 0.18, 128));

    // 黄道面上の 30°（黄道十二宮・約1か月）ごとの放射目盛りと、春分点〜秋分点の交線
    const eclipticTicks: number[] = [];
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const rIn = deg % 90 === 0 ? 1.39 : 1.44;
      const rOut = 1.52;
      eclipticTicks.push(
        Math.cos(rad) * rIn,
        0,
        -Math.sin(rad) * rIn,
        Math.cos(rad) * rOut,
        0,
        -Math.sin(rad) * rOut
      );
    }
    const eclipticTickGeo = new THREE.BufferGeometry();
    eclipticTickGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(eclipticTicks, 3)
    );
    eclipticPlaneGroup.add(
      new THREE.LineSegments(
        eclipticTickGeo,
        new THREE.LineBasicMaterial({
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.38,
        })
      )
    );

    // 5. 地球グループ（earthGroup.rotation.y = GMST で自転させます）
    const earthGroup = new THREE.Group();
    universeRoot.add(earthGroup);

    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 144, 72),
      earthBundle.material
    );
    earthGroup.add(earthMesh);

    const atmosphereMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 72, 36),
      atmosphereBundle.material
    );
    earthGroup.add(atmosphereMesh);

    // 緯線・経線・北極圏・地軸ガイド（graticuleGroup）
    const graticuleGroup = new THREE.Group();
    earthGroup.add(graticuleGroup);

    const minorLineMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.16,
    });
    const equatorMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.42,
    });
    const arcticCircleMat = new THREE.LineDashedMaterial({
      color: 0x7dd3fc,
      dashSize: 0.045,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.85,
    });
    const primeMeridianMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.6,
    });

    for (const lat of [-60, -30, 30, 60]) {
      graticuleGroup.add(createLatitudeRing(lat, 1.003, 96, minorLineMat));
    }
    graticuleGroup.add(createLatitudeRing(0, 1.0035, 128, equatorMat));
    graticuleGroup.add(
      createLatitudeRing(66.5607, 1.004, 128, arcticCircleMat, true)
    );

    for (let lon = -150; lon <= 180; lon += 30) {
      graticuleGroup.add(
        createLongitudeArc(
          lon,
          lon === 0 ? 1.004 : 1.003,
          64,
          lon === 0 ? primeMeridianMat : minorLineMat
        )
      );
    }

    // 地軸（北極軸・南極軸）
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.18, 0),
      new THREE.Vector3(0, 1.22, 0),
    ]);
    graticuleGroup.add(
      new THREE.Line(
        axisGeo,
        new THREE.LineBasicMaterial({
          color: 0xe2e8f0,
          transparent: true,
          opacity: 0.85,
        })
      )
    );
    const poleCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xbae6fd })
    );
    poleCrown.position.set(0, 1.22, 0);
    graticuleGroup.add(poleCrown);

    const southCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
    );
    southCrown.position.set(0, -1.18, 0);
    graticuleGroup.add(southCrown);

    const poleRing = new THREE.Mesh(
      new THREE.RingGeometry(0.024, 0.032, 24),
      new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      })
    );
    poleRing.position.set(0, 1.015, 0);
    poleRing.rotation.x = -Math.PI / 2;
    graticuleGroup.add(poleRing);

    // 6. 太陽光線ガイド（universeRoot の子：太陽方向に向きを毎フレーム更新）
    const sunGuideGroup = new THREE.Group();
    universeRoot.add(sunGuideGroup);

    const sunBeamRoot = new THREE.Group();
    sunGuideGroup.add(sunBeamRoot);

    const beamOffsets: Array<[number, number]> = [
      [0, 0],
      [0.28, 0],
      [-0.28, 0],
    ];
    for (const [ox, oy] of beamOffsets) {
      const arrow = createVectorArrow(
        new THREE.Vector3(0, 0, -1),
        0.38,
        0xfbbf24,
        ox === 0 ? 0.96 : 0.68
      );
      arrow.position.set(ox, oy, 1.76);
      sunBeamRoot.add(arrow);
    }

    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.046, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfde047 })
    );
    sunOrb.position.set(0, 0, 1.85);
    sunBeamRoot.add(sunOrb);

    // 7. 都市3Dマーカーと、選択都市の局所方位ベクトル（N/E/S/W）
    const citiesGroup = new THREE.Group();
    earthGroup.add(citiesGroup);

    const cityMarkerMap = new Map<
      string,
      {
        mesh: THREE.Mesh;
        ring: THREE.Mesh;
        normalLocal: THREE.Vector3;
        city: City;
      }
    >();

    for (const city of cities) {
      const [px, py, pz] = latLonToVector3Tuple(city.latDeg, city.lonDeg, 1.011);
      const normalLocal = new THREE.Vector3(px, py, pz).normalize();

      const markerMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      markerMesh.position.set(px, py, pz);
      citiesGroup.add(markerMesh);

      const ringMesh = new THREE.Mesh(
        new THREE.RingGeometry(0.023, 0.034, 24),
        new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.92,
        })
      );
      ringMesh.position.set(px * 1.003, py * 1.003, pz * 1.003);
      ringMesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normalLocal
      );
      ringMesh.visible = false;
      citiesGroup.add(ringMesh);

      cityMarkerMap.set(city.id, {
        mesh: markerMesh,
        ring: ringMesh,
        normalLocal,
        city,
      });
    }

    const selectedCompassGroup = new THREE.Group();
    citiesGroup.add(selectedCompassGroup);
    let lastCompassCityId = "";

    const rebuildSelectedCompass = (city: City) => {
      while (selectedCompassGroup.children.length > 0) {
        selectedCompassGroup.remove(selectedCompassGroup.children[0]);
      }

      if (Math.abs(city.latDeg) >= 89.5) {
        return;
      }

      const [cx, cy, cz] = latLonToVector3Tuple(city.latDeg, city.lonDeg, 1.022);
      selectedCompassGroup.position.set(cx, cy, cz);

      const vectors = getLocalCompassVectors(city.latDeg, city.lonDeg);
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.east), 0.22, 0x22d3ee, 0.96)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.north), 0.17, 0xfb7185, 0.92)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.west), 0.11, 0x94a3b8, 0.42)
      );
      selectedCompassGroup.add(
        createVectorArrow(new THREE.Vector3(...vectors.south), 0.11, 0x94a3b8, 0.42)
      );
    };

    // 8. マウス・タッチドラッグおよびホイールズーム操作
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onPointerDown = (ev: PointerEvent) => {
      isDragging = true;
      lastPointerX = ev.clientX;
      lastPointerY = ev.clientY;
      renderer.domElement.setPointerCapture(ev.pointerId);
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDragging) return;
      const dx = ev.clientX - lastPointerX;
      const dy = ev.clientY - lastPointerY;
      lastPointerX = ev.clientX;
      lastPointerY = ev.clientY;

      onCameraUserDrag();

      const { target, current } = cameraPoseRef.current;
      target.yaw -= dx * 0.0065;
      target.pitch = Math.max(
        -Math.PI / 2 + 0.02,
        Math.min(Math.PI / 2, target.pitch + dy * 0.0065)
      );
      current.yaw = target.yaw;
      current.pitch = target.pitch;
    };

    const onPointerUp = (ev: PointerEvent) => {
      isDragging = false;
      if (renderer.domElement.hasPointerCapture(ev.pointerId)) {
        renderer.domElement.releasePointerCapture(ev.pointerId);
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const { target } = cameraPoseRef.current;
      target.distance = Math.max(
        1.85,
        Math.min(6.4, target.distance + ev.deltaY * 0.002)
      );
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);

    // 9. メイン描画ループ
    let animFrameId = 0;
    let lastTimestamp = performance.now();
    let currentOffsetX = 0;

    const tmpWorldPos = new THREE.Vector3();
    const tmpWorldNormal = new THREE.Vector3();
    const tmpToCam = new THREE.Vector3();
    const tmpSunWorld = new THREE.Vector3();
    const tmpTiltQuat = new THREE.Quaternion();
    const tmpEclipticNorth = new THREE.Vector3();
    const tmpUpAxis = new THREE.Vector3();
    const tmpRightBase = new THREE.Vector3();
    const tmpBackBase = new THREE.Vector3();
    const tmpHorizBack = new THREE.Vector3();
    const tmpCamDir = new THREE.Vector3();
    const tmpCamUp = new THREE.Vector3();
    const earthQuat = new THREE.Quaternion();

    const tiltAngleRad = degToRad(EARTH_AXIAL_TILT_DEG);

    const renderFrame = (now: number) => {
      animFrameId = requestAnimationFrame(renderFrame);
      const dt = Math.min(0.05, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const {
        solarState: curSolar,
        cities: curCities,
        selectedCityId: curSelectedId,
        visualStyle: curStyle,
        referenceFrame: curFrame,
        layers: curLayers,
        isInspectorOpen: curInspectorOpen,
      } = latestPropsRef.current;

      const hostW = host.clientWidth || window.innerWidth;
      const hostH = host.clientHeight || window.innerHeight;

      // シーンの回転をカメラ計算より先に更新して、1フレームのズレも防ぎます。
      universeRoot.rotation.y =
        curFrame === "solar" ? -curSolar.sunRightAscensionRad : 0;
      earthGroup.rotation.y = curSolar.gmstRad;

      const [sx, sy, sz] = raDecToVector3Tuple(
        curSolar.sunRightAscensionRad,
        curSolar.sunDeclinationRad,
        1
      );
      const sunLocalDir = new THREE.Vector3(sx, sy, sz).normalize();
      sunBeamRoot.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        sunLocalDir
      );

      universeRoot.updateMatrixWorld(true);
      tmpSunWorld.copy(sunLocalDir).applyQuaternion(universeRoot.quaternion).normalize();
      earthBundle.uniforms.uSunDirection.value.copy(tmpSunWorld);
      atmosphereBundle.uniforms.uSunDirection.value.copy(tmpSunWorld);

      // パネル開閉に応じた地球の水平オフセットを補間します。
      const targetOffsetX =
        curInspectorOpen && hostW > 860
          ? Math.min(176, Math.max(0, (hostW - 760) * 0.45))
          : 0;
      const offsetSmooth = 1 - Math.exp(-9 * dt);
      currentOffsetX += (targetOffsetX - currentOffsetX) * offsetSmooth;

      if (Math.abs(currentOffsetX) > 0.5) {
        camera.setViewOffset(hostW, hostH, currentOffsetX, 0, hostW, hostH);
      } else {
        camera.clearViewOffset();
      }

      // カメラの目標姿勢へ滑らかに連続補間します。
      const { current, target } = cameraPoseRef.current;
      const camSmooth = 1 - Math.exp(-6.5 * dt);
      current.yaw += (target.yaw - current.yaw) * camSmooth;
      current.pitch += (target.pitch - current.pitch) * camSmooth;
      current.distance += (target.distance - current.distance) * camSmooth;
      current.eclipticBlend += (target.eclipticBlend - current.eclipticBlend) * camSmooth;

      // 天の北極(+Y)と黄道北極(公転面の法線)を eclipticBlend に応じて滑らかに補間します。
      tmpTiltQuat.setFromAxisAngle(X_AXIS, tiltAngleRad);
      tmpEclipticNorth
        .copy(Y_AXIS)
        .applyQuaternion(tmpTiltQuat)
        .applyQuaternion(universeRoot.quaternion)
        .normalize();

      tmpUpAxis
        .copy(Y_AXIS)
        .lerp(tmpEclipticNorth, current.eclipticBlend)
        .normalize();

      // 太陽固定時は太陽方向を右向き基準、恒星固定時は春分点(+X)を右向き基準にして直交基底を組みます。
      const refRight = curFrame === "solar" ? tmpSunWorld : X_AXIS;
      tmpRightBase
        .copy(refRight)
        .addScaledVector(tmpUpAxis, -refRight.dot(tmpUpAxis));
      if (tmpRightBase.lengthSq() < 1e-6) {
        tmpRightBase.copy(X_AXIS);
      }
      tmpRightBase.normalize();
      tmpBackBase.crossVectors(tmpRightBase, tmpUpAxis).normalize();

      const cosYaw = Math.cos(current.yaw);
      const sinYaw = Math.sin(current.yaw);
      const cosPitch = Math.cos(current.pitch);
      const sinPitch = Math.sin(current.pitch);

      tmpHorizBack
        .copy(tmpBackBase)
        .multiplyScalar(cosYaw)
        .addScaledVector(tmpRightBase, sinYaw);

      tmpCamDir
        .copy(tmpHorizBack)
        .multiplyScalar(cosPitch)
        .addScaledVector(tmpUpAxis, sinPitch);

      tmpCamUp
        .copy(tmpUpAxis)
        .multiplyScalar(cosPitch)
        .addScaledVector(tmpHorizBack, -sinPitch);

      camera.position.copy(tmpCamDir).multiplyScalar(current.distance);
      camera.up.copy(tmpCamUp);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(true);

      // ビジュアルモードと補助レイヤー表示設定を適用します。
      const isDiagram = curStyle === "diagram";
      earthBundle.uniforms.uDayMap.value = isDiagram
        ? textures.diagramMap
        : textures.realisticMap;
      earthBundle.uniforms.uIsDiagram.value = isDiagram ? 1.0 : 0.0;
      earthBundle.uniforms.uShowTerminatorHighlight.value =
        curLayers.terminatorGuide ? 1.0 : 0.0;
      atmosphereBundle.uniforms.uIsDiagram.value = isDiagram ? 1.0 : 0.0;

      graticuleGroup.visible = curLayers.graticule;
      celestialCompassGroup.visible = curLayers.celestialCompass;
      eclipticPlaneGroup.visible = curLayers.eclipticPlane;
      sunGuideGroup.visible = curLayers.terminatorGuide;
      citiesGroup.visible = curLayers.cities;
      starsGroup.visible = curLayers.starsAndEquinox;

      if (lastCompassCityId !== curSelectedId) {
        const foundCity = curCities.find((c) => c.id === curSelectedId);
        if (foundCity) {
          rebuildSelectedCompass(foundCity);
          lastCompassCityId = curSelectedId;
        }
      }

      earthGroup.getWorldQuaternion(earthQuat);

      for (const [cityId, entry] of cityMarkerMap.entries()) {
        const obs = observeCity(entry.city, curSolar);
        const isDay = obs.daylightPhase === "day";
        const isSelected = cityId === curSelectedId;

        const mat = entry.mesh.material as THREE.MeshBasicMaterial;
        if (isSelected) {
          mat.color.setHex(0xfde047);
          entry.mesh.scale.setScalar(1.35);
        } else if (isDay) {
          mat.color.setHex(0xfbbf24);
          entry.mesh.scale.setScalar(1.0);
        } else {
          mat.color.setHex(0x60a5fa);
          entry.mesh.scale.setScalar(1.0);
        }
        entry.ring.visible = isSelected;

        const btn = labelButtonRefs.current.get(cityId);
        if (!btn) continue;

        if (!curLayers.cities) {
          btn.style.display = "none";
          continue;
        }

        entry.mesh.getWorldPosition(tmpWorldPos);
        tmpWorldNormal.copy(entry.normalLocal).applyQuaternion(earthQuat);
        tmpToCam.copy(camera.position).sub(tmpWorldPos).normalize();

        const facing = tmpToCam.dot(tmpWorldNormal);
        if (facing < -0.05) {
          btn.style.display = "none";
          continue;
        }

        const projected = tmpWorldPos.clone().project(camera);
        if (projected.z > 1) {
          btn.style.display = "none";
          continue;
        }

        const screenX = (projected.x * 0.5 + 0.5) * hostW;
        const screenY = (-projected.y * 0.5 + 0.5) * hostH;

        btn.style.display = "inline-flex";
        btn.style.transform = `translate(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px)`;
        btn.classList.toggle("is-day", isDay);
        btn.classList.toggle("is-night", !isDay);
      }

      updateFloatingBadge(
        sunBadgeRef.current,
        sunOrb,
        camera,
        hostW,
        hostH,
        curLayers.terminatorGuide,
        curInspectorOpen
      );
      updateFloatingBadge(
        equinoxBadgeRef.current,
        equinoxMarker,
        camera,
        hostW,
        hostH,
        curLayers.starsAndEquinox,
        curInspectorOpen
      );

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      textures.dispose();
      starTexture.dispose();
      earthBundle.material.dispose();
      atmosphereBundle.material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [cities, onCameraUserDrag]);

  return (
    <div className="viewport-stage">
      <div ref={hostRef} className="three-canvas-host" />
      <div className="city-overlay-layer" aria-label="3D空間のラベル">
        {cities.map((city) => {
          const isSelected = city.id === selectedCityId;
          return (
            <button
              key={city.id}
              ref={(el) => {
                if (el) {
                  labelButtonRefs.current.set(city.id, el);
                } else {
                  labelButtonRefs.current.delete(city.id);
                }
              }}
              type="button"
              className={`city-chip ${isSelected ? "is-selected" : ""}`}
              style={{ display: "none" }}
              onClick={() => onSelectCity(city.id)}
              title={`${city.nameJa}の観測情報を表示`}
            >
              <span className="city-chip-dot" aria-hidden="true" />
              <span className="city-chip-name">{city.nameJa}</span>
            </button>
          );
        })}

        <span
          ref={sunBadgeRef}
          className="space-badge is-sun"
          style={{ display: "none" }}
        >
          ☀ 太陽方向
        </span>

        <span
          ref={equinoxBadgeRef}
          className="space-badge is-equinox"
          style={{ display: "none" }}
        >
          ♈ 春分点
        </span>
      </div>
    </div>
  );
};
