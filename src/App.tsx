import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OBSERVATION_CITIES } from "./data/cities";
import {
  applyAnnualFixedHourLock,
  calculateMoonState,
  calculateSolarSystemState,
  calculateVenusState,
  degToRad,
  getNextSeasonDate,
  SeasonPreset,
  snapDateToJstHour,
  SOLAR_DAY_SECONDS,
} from "./astronomy/calculations";
import {
  calculateFullSolarSystemState,
  calculateGalileanMoonsState,
} from "./astronomy/solarSystem";
import {
  CameraPreset,
  DisplayLayers,
} from "./types/astronomy";
import {
  CameraPoseTarget,
  EarthGlobeCanvas,
} from "./scene/EarthGlobeCanvas";
import { HeaderBar } from "./components/HeaderBar";
import { TimeControlBar } from "./components/TimeControlBar";
import {
  GuideExperimentId,
  InspectorPanel,
} from "./components/InspectorPanel";

const DEFAULT_LAYERS: DisplayLayers = {
  graticule: true,
  celestialCompass: true,
  eclipticPlane: true,
  terminatorGuide: true,
  cities: true,
  starsAndEquinox: true,
  moonAndOrbit: true,
  venusAndOrbit: true,
  zodiacConstellations: true,
};

const GROUND_DEFAULT_ELEVATION = degToRad(26);

const ECLIPTIC_OFF_DEFAULTS = {
  eclipticViewBlend: 0,
  eclipticFollowSun: 1,
  eclipticYawOffset: 0,
  eclipticFixedLon: 0,
  eclipticViewLatRad: 0,
};

const PRESET_POSES: Record<
  CameraPreset,
  Omit<CameraPoseTarget, "seq"> & { ratio: number }
> = {
  northPole: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 2.6,
    ratio: 0,
  },
  eclipticPlane: {
    yaw: 0,
    pitch: 0,
    distance: 4.02,
    eclipticBlend: 1,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 2.6,
    ratio: 1,
  },
  moonNorthPole: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 14.0,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 2.8,
    ratio: 0,
  },
  moonEclipticPlane: {
    yaw: 0,
    pitch: 0,
    distance: 14.0,
    eclipticBlend: 1,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 2.8,
    ratio: 1,
  },
  sunOverhead: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 78.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.4,
    ratio: 1,
  },
  sunEclipticOblique: {
    yaw: 0,
    pitch: degToRad(20),
    distance: 56.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.2,
    ratio: 1,
  },
  earthEclipticFollow: {
    yaw: 0,
    pitch: 0,
    distance: 4.0,
    eclipticBlend: 1,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    eclipticViewBlend: 1,
    eclipticFollowSun: 1,
    eclipticYawOffset: 0,
    eclipticFixedLon: 0,
    eclipticViewLatRad: 0,
    durationSec: 2.8,
    ratio: 1,
  },
  earthEclipticFixed: {
    yaw: 0,
    pitch: 0,
    distance: 4.0,
    eclipticBlend: 1,
    sunCenterBlend: 0,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    eclipticViewBlend: 1,
    eclipticFollowSun: 0,
    eclipticYawOffset: 0,
    eclipticFixedLon: 0,
    eclipticViewLatRad: 0,
    durationSec: 2.2,
    ratio: 1,
  },
  tokyoNorth: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 1,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 1.8,
    ratio: 0,
  },
  tokyoEast: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 1,
    groundAzimuth: Math.PI / 2,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 1.8,
    ratio: 0,
  },
  tokyoSouth: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 1,
    groundAzimuth: Math.PI,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 1.8,
    ratio: 0,
  },
  tokyoWest: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 0,
    sunCenterBlend: 0,
    groundBlend: 1,
    groundAzimuth: -Math.PI / 2,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 0,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 1.8,
    ratio: 0,
  },
  solarInner: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 78.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 1,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.4,
    ratio: 1,
  },
  solarJupiter: {
    yaw: 0,
    pitch: degToRad(26),
    distance: 34.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 1,
    jupiterFocusBlend: 1,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.4,
    ratio: 1,
  },
  solarFullTop: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 1520.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 1,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.8,
    ratio: 1,
  },
  solarFullOblique: {
    yaw: 0,
    pitch: degToRad(24),
    distance: 1320.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    solarSystemBlend: 1,
    jupiterFocusBlend: 0,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: 3.6,
    ratio: 1,
  },
};

/**
 * アプリ全体の状態（観測時刻・再生速度・連続視点移動・公転表示・選択都市）を統合するルートコンポーネントです。
 */
export function App() {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1800);

  const [selectedCityId, setSelectedCityId] = useState<string>("tokyo");

  const [activePresetButton, setActivePresetButton] =
    useState<CameraPreset | null>("northPole");
  const [viewTransitionRatio, setViewTransitionRatio] = useState<number>(0);
  const [cameraPoseTarget, setCameraPoseTarget] = useState<CameraPoseTarget>({
    yaw: PRESET_POSES.northPole.yaw,
    pitch: PRESET_POSES.northPole.pitch,
    distance: PRESET_POSES.northPole.distance,
    eclipticBlend: PRESET_POSES.northPole.eclipticBlend,
    sunCenterBlend: PRESET_POSES.northPole.sunCenterBlend,
    groundBlend: PRESET_POSES.northPole.groundBlend,
    groundAzimuth: PRESET_POSES.northPole.groundAzimuth,
    groundElevation: PRESET_POSES.northPole.groundElevation,
    solarSystemBlend: PRESET_POSES.northPole.solarSystemBlend,
    jupiterFocusBlend: PRESET_POSES.northPole.jupiterFocusBlend,
    ...ECLIPTIC_OFF_DEFAULTS,
    durationSec: PRESET_POSES.northPole.durationSec,
    seq: 0,
  });

  // iPhone 17 (402x874 / 横874x402)・iPad A16 縦 (820x1180) では初期格納し、iPad 横 (1180x820) とPCでは展開します。
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.innerWidth >= 1024 && window.innerHeight >= 540
      : true
  );
  const [layers, setLayers] = useState<DisplayLayers>(DEFAULT_LAYERS);
  const [isAnnualMotionMode, setIsAnnualMotionMode] = useState<boolean>(false);
  const isAnnualMotionRef = useRef<boolean>(false);
  isAnnualMotionRef.current = isAnnualMotionMode;
  const [transitioningSeasonId, setTransitioningSeasonId] = useState<
    SeasonPreset["id"] | null
  >(null);

  const simTimeMsRef = useRef<number>(currentDate.getTime());
  // 春分・夏至・秋分・冬至ボタンを押した際に時間を未来方向へ滑らかに進める補間状態です。
  const timeTransitionRef = useRef<{
    active: boolean;
    fromMs: number;
    toMs: number;
    elapsed: number;
    duration: number;
  }>({
    active: false,
    fromMs: currentDate.getTime(),
    toMs: currentDate.getTime(),
    elapsed: 0,
    duration: 2.8,
  });

  const cancelTimeTransition = useCallback(() => {
    if (timeTransitionRef.current.active) {
      timeTransitionRef.current.active = false;
      setTransitioningSeasonId(null);
    }
  }, []);

  const applyNewDate = useCallback(
    (nextDate: Date) => {
      cancelTimeTransition();
      simTimeMsRef.current = nextDate.getTime();
      setCurrentDate(nextDate);
    },
    [cancelTimeTransition]
  );

  const handleSelectSeason = useCallback((seasonId: SeasonPreset["id"]) => {
    const fromMs = simTimeMsRef.current;
    const targetDate = getNextSeasonDate(new Date(fromMs), seasonId);
    const toMs = targetDate.getTime();
    const deltaDays = Math.max(0, (toMs - fromMs) / 86_400_000);
    // 移動する日数に応じて 1.8〜5.2 秒かけて、加減速しながら滑らかに未来へ時間を進めます。
    const duration = Math.max(1.8, Math.min(5.2, 1.5 + (deltaDays / 91.3) * 1.15));

    timeTransitionRef.current = {
      active: true,
      fromMs,
      toMs,
      elapsed: 0,
      duration,
    };
    setTransitioningSeasonId(seasonId);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        cancelTimeTransition();
      }
      return !prev;
    });
  }, [cancelTimeTransition]);

  const isTimeTransitioning = transitioningSeasonId !== null;

  useEffect(() => {
    if (!isPlaying && !isTimeTransitioning) return;

    let rafId = 0;
    let lastFrameMs = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const elapsedSec = Math.min(0.1, (now - lastFrameMs) / 1000);
      lastFrameMs = now;

      const tr = timeTransitionRef.current;
      if (tr.active) {
        tr.elapsed += elapsedSec;
        const rawT = Math.min(1, tr.elapsed / tr.duration);
        // 動き始めと着地が滑らかな 3 次イージング（Ease-In-Out Cubic）で時間を進めます。
        const ease =
          rawT < 0.5
            ? 4 * rawT * rawT * rawT
            : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        simTimeMsRef.current = tr.fromMs + (tr.toMs - tr.fromMs) * ease;
        setCurrentDate(new Date(simTimeMsRef.current));

        if (rawT >= 1) {
          tr.active = false;
          setTransitioningSeasonId(null);
        }
        return;
      }

      if (isPlaying) {
        simTimeMsRef.current += elapsedSec * 1000 * speedMultiplier;
        setCurrentDate(new Date(simTimeMsRef.current));
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speedMultiplier, isTimeTransitioning]);

  const rawSolarState = useMemo(
    () => calculateSolarSystemState(currentDate),
    [currentDate]
  );

  const solarState = useMemo(
    () =>
      isAnnualMotionMode
        ? applyAnnualFixedHourLock(rawSolarState, currentDate, 21)
        : rawSolarState,
    [rawSolarState, currentDate, isAnnualMotionMode]
  );

  const moonState = useMemo(
    () => calculateMoonState(currentDate, solarState.sunEclipticLongitudeDeg),
    [currentDate, solarState.sunEclipticLongitudeDeg]
  );

  const venusState = useMemo(
    () => calculateVenusState(currentDate, solarState.sunEclipticLongitudeDeg),
    [currentDate, solarState.sunEclipticLongitudeDeg]
  );

  const solarSystemBodies = useMemo(
    () => calculateFullSolarSystemState(currentDate),
    [currentDate]
  );

  const galileanMoons = useMemo(
    () => calculateGalileanMoonsState(currentDate),
    [currentDate]
  );

  const handleStepMonth = useCallback(() => {
    const next = new Date(
      simTimeMsRef.current + 30 * SOLAR_DAY_SECONDS * 1000
    );
    applyNewDate(next);
  }, [applyNewDate]);

  const handleToggleAnnualMotion = useCallback(() => {
    setIsAnnualMotionMode((prev) => {
      const nextOn = !prev;
      if (nextOn) {
        // 毎日 21:00 JST へ揃えて、公転による星・カシオペア座・黄道星座の年周運動を滑らかに観察します。
        const snapped = snapDateToJstHour(new Date(simTimeMsRef.current), 21);
        applyNewDate(snapped);
        setLayers((l) => ({
          ...l,
          starsAndEquinox: true,
          zodiacConstellations: true,
        }));
        setSpeedMultiplier((sp) => (sp < 86400 ? 864000 : sp));
        setIsPlaying(true);
      } else {
        setSpeedMultiplier((sp) => (sp >= 86400 ? 1800 : sp));
      }
      return nextOn;
    });
  }, [applyNewDate]);

  const handleResetToNow = useCallback(() => {
    setIsAnnualMotionMode(false);
    applyNewDate(new Date());
  }, [applyNewDate]);

  const handleSelectCameraPreset = useCallback(
    (preset: CameraPreset, adjustSpeedAutomatically = true) => {
      const p = PRESET_POSES[preset];
      const isTargetGround = p.groundBlend > 0.5;
      setActivePresetButton(preset);
      setViewTransitionRatio(p.ratio);

      if (!isTargetGround) {
        setIsAnnualMotionMode(false);
      }

      const isTargetEclipticView =
        preset === "earthEclipticFollow" || preset === "earthEclipticFixed";
      const curSunLonRad = degToRad(
        calculateSolarSystemState(new Date(simTimeMsRef.current))
          .sunEclipticLongitudeDeg
      );

      // 宇宙空間 ⇄ 東京地上 ⇄ 地球から黄道 ⇄ リアル太陽系、各距離帯を跨ぐ場合はゆっくり連続移動します。
      setCameraPoseTarget((prev) => {
        const crossesGround = prev.groundBlend !== p.groundBlend;
        const crossesEclipticSky =
          prev.eclipticViewBlend !== p.eclipticViewBlend;
        const crossesSolarMode = prev.solarSystemBlend !== p.solarSystemBlend;
        const crossesJupiter = prev.jupiterFocusBlend !== p.jupiterFocusBlend;
        const crossesSunCenter = prev.sunCenterBlend !== p.sunCenterBlend;
        const crossesMoonBand = (prev.distance >= 7.5) !== (p.distance >= 7.5);
        const durationSec = crossesGround || crossesEclipticSky
          ? prev.sunCenterBlend > 0.5 || p.sunCenterBlend > 0.5
            ? 3.4
            : 2.9
          : crossesSolarMode || crossesJupiter
          ? 3.6
          : crossesSunCenter
          ? 3.4
          : crossesMoonBand
          ? 3.0
          : p.durationSec;

        // 星座固定ビューに入るときは、現在の太陽位置の少し先（+14°）を正面にして太陽が画面を横切る様子を見やすくします。
        const targetFixedLon =
          preset === "earthEclipticFixed"
            ? curSunLonRad + degToRad(14)
            : isTargetEclipticView
            ? curSunLonRad
            : prev.eclipticFixedLon;

        return {
          yaw: p.yaw,
          pitch: p.pitch,
          distance: p.distance,
          eclipticBlend: p.eclipticBlend,
          sunCenterBlend: p.sunCenterBlend,
          groundBlend: p.groundBlend,
          groundAzimuth: isTargetGround ? p.groundAzimuth : prev.groundAzimuth,
          groundElevation: isTargetGround
            ? p.groundElevation
            : prev.groundElevation,
          solarSystemBlend: p.solarSystemBlend,
          jupiterFocusBlend: p.jupiterFocusBlend,
          eclipticViewBlend: p.eclipticViewBlend,
          eclipticFollowSun: p.eclipticFollowSun,
          eclipticYawOffset: 0,
          eclipticFixedLon: targetFixedLon,
          eclipticViewLatRad: isTargetEclipticView
            ? p.eclipticViewLatRad
            : prev.eclipticViewLatRad,
          durationSec,
          seq: prev.seq + 1,
        };
      });

      if (adjustSpeedAutomatically) {
        const isOuterSolarView =
          preset === "solarFullTop" || preset === "solarFullOblique";
        const isJupiterOrInnerView =
          preset === "solarInner" || preset === "solarJupiter";
        const isSimpleOrbitalView =
          preset === "moonNorthPole" ||
          preset === "moonEclipticPlane" ||
          preset === "sunOverhead" ||
          preset === "sunEclipticOblique";

        if (isTargetEclipticView) {
          // 地球から黄道上の太陽の移動を観察しやすい 10日/s を標準にします。
          setSpeedMultiplier((prev) =>
            prev < 864000 || prev > 2592000 ? 864000 : prev
          );
          setIsPlaying(true);
        } else if (isOuterSolarView) {
          // 冥王星までの全体俯瞰では外惑星も滑らかに動く 30日/s を標準にします。
          setSpeedMultiplier((prev) => (prev < 2592000 ? 2592000 : prev));
          setIsPlaying(true);
        } else if (isJupiterOrInnerView) {
          // 内惑星・木星4衛星ではイオ(1.77日)や月が見やすい 1日/s を標準にします。
          setSpeedMultiplier(86400);
          setIsPlaying(true);
        } else if (isSimpleOrbitalView) {
          setSpeedMultiplier((prev) =>
            prev < 86400 || prev > 2592000 ? 86400 : prev
          );
          setIsPlaying(true);
        } else if (isTargetGround && isAnnualMotionRef.current) {
          // 年周運動モード中は東京の東西南北を切り替えても 10日/s〜30日/s を維持します。
          setSpeedMultiplier((prev) => (prev < 86400 ? 864000 : prev));
        } else {
          setSpeedMultiplier((prev) => (prev >= 86400 ? 1800 : prev));
        }
      }

      // スマホ・タブレット縦画面では観察パネルから視点を選んだ直後にパネルを閉じて3D移動を見やすくします。
      if (
        adjustSpeedAutomatically &&
        typeof window !== "undefined" &&
        (window.innerWidth < 1024 || window.innerHeight < 540)
      ) {
        setIsInspectorOpen(false);
      }
    },
    []
  );

  const isMoonDistanceMode =
    cameraPoseTarget.groundBlend < 0.5 &&
    cameraPoseTarget.eclipticViewBlend < 0.5 &&
    cameraPoseTarget.sunCenterBlend < 0.5 &&
    cameraPoseTarget.solarSystemBlend < 0.5 &&
    cameraPoseTarget.distance >= 7.5;

  const isRealSolarSystemMode = cameraPoseTarget.solarSystemBlend >= 0.5;

  const handleChangeViewTransitionRatio = useCallback(
    (ratio: number) => {
      const clamped = Math.max(0, Math.min(1, ratio));
      setViewTransitionRatio(clamped);

      if (isMoonDistanceMode) {
        if (clamped <= 0.005) {
          setActivePresetButton("moonNorthPole");
        } else if (clamped >= 0.995) {
          setActivePresetButton("moonEclipticPlane");
        } else {
          setActivePresetButton(null);
        }
      } else {
        if (clamped <= 0.005) {
          setActivePresetButton("northPole");
        } else if (clamped >= 0.995) {
          setActivePresetButton("eclipticPlane");
        } else {
          setActivePresetButton(null);
        }
        setSpeedMultiplier((prev) => (prev >= 86400 ? 1800 : prev));
      }

      setCameraPoseTarget((prev) => ({
        yaw: 0,
        pitch: (1 - clamped) * (Math.PI / 2),
        distance: isMoonDistanceMode ? 14.0 : 3.92 + clamped * 0.1,
        eclipticBlend: clamped,
        sunCenterBlend: 0,
        groundBlend: 0,
        groundAzimuth: prev.groundAzimuth,
        groundElevation: prev.groundElevation,
        solarSystemBlend: 0,
        jupiterFocusBlend: 0,
        ...ECLIPTIC_OFF_DEFAULTS,
        durationSec:
          prev.sunCenterBlend > 0.5 ||
          prev.groundBlend > 0.5 ||
          prev.eclipticViewBlend > 0.5 ||
          prev.solarSystemBlend > 0.5
            ? 2.8
            : 0.45,
        seq: prev.seq,
      }));
    },
    [isMoonDistanceMode]
  );

  const handleResetNorthPoleCamera = useCallback(() => {
    handleSelectCameraPreset("northPole");
  }, [handleSelectCameraPreset]);

  const handleCameraUserDrag = useCallback(() => {
    setActivePresetButton(null);
  }, []);

  const handleToggleLayer = useCallback((key: keyof DisplayLayers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleRunGuideExperiment = useCallback(
    (id: GuideExperimentId) => {
      switch (id) {
        case "annual-motion-north":
          handleSelectCameraPreset("tokyoNorth", false);
          setSelectedCityId("tokyo");
          applyNewDate(snapDateToJstHour(new Date(simTimeMsRef.current), 21));
          setIsAnnualMotionMode(true);
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            starsAndEquinox: true,
            zodiacConstellations: true,
          }));
          setSpeedMultiplier(864000);
          setIsPlaying(true);
          break;

        case "annual-motion-south":
          handleSelectCameraPreset("tokyoSouth", false);
          setSelectedCityId("tokyo");
          applyNewDate(snapDateToJstHour(new Date(simTimeMsRef.current), 21));
          setIsAnnualMotionMode(true);
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            starsAndEquinox: true,
            zodiacConstellations: true,
            moonAndOrbit: true,
          }));
          setSpeedMultiplier(864000);
          setIsPlaying(true);
          break;

        case "zodiac-ecliptic-follow":
          handleSelectCameraPreset("earthEclipticFollow", false);
          setLayers((prev) => ({
            ...prev,
            zodiacConstellations: true,
            eclipticPlane: true,
            moonAndOrbit: true,
            venusAndOrbit: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(864000);
          setIsPlaying(true);
          break;

        case "zodiac-ecliptic-fixed":
          handleSelectCameraPreset("earthEclipticFixed", false);
          setLayers((prev) => ({
            ...prev,
            zodiacConstellations: true,
            eclipticPlane: true,
            moonAndOrbit: true,
            venusAndOrbit: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(864000);
          setIsPlaying(true);
          break;

        case "real-solar-system":
          handleSelectCameraPreset("solarFullOblique", false);
          setLayers((prev) => ({
            ...prev,
            moonAndOrbit: true,
            venusAndOrbit: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(2592000);
          setIsPlaying(true);
          break;

        case "tokyo-ground-sky":
          setSelectedCityId("tokyo");
          handleSelectCameraPreset("tokyoSouth", false);
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            moonAndOrbit: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;

        case "sydney-southern-cross":
          // 5月中旬の 21:00 AEST（UTC 11:00）はシドニーの南の空高くに南十字星が正立して見やすい時刻です。
          setSelectedCityId("sydney");
          handleSelectCameraPreset("tokyoSouth", false);
          applyNewDate(new Date("2026-05-15T11:00:00Z"));
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            moonAndOrbit: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;

        case "moon-orbit-observe":
          handleSelectCameraPreset("moonNorthPole", false);
          setLayers((prev) => ({
            ...prev,
            moonAndOrbit: true,
            eclipticPlane: true,
            terminatorGuide: true,
          }));
          setSpeedMultiplier(86400);
          setIsPlaying(true);
          break;

        case "venus-orbit-observe":
          handleSelectCameraPreset("sunOverhead", false);
          setLayers((prev) => ({
            ...prev,
            venusAndOrbit: true,
            eclipticPlane: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(86400);
          setIsPlaying(true);
          break;

        case "sun-orbit-overview":
          handleSelectCameraPreset("sunOverhead", false);
          setLayers((prev) => ({
            ...prev,
            eclipticPlane: true,
            starsAndEquinox: true,
          }));
          setSpeedMultiplier(86400);
          setIsPlaying(true);
          break;

        case "counterclockwise":
          handleSelectCameraPreset("northPole", false);
          setLayers((prev) => ({
            ...prev,
            celestialCompass: true,
            graticule: true,
          }));
          setSpeedMultiplier(7200);
          setIsPlaying(true);
          break;

        case "ecliptic-tilt":
          handleSelectCameraPreset("eclipticPlane", false);
          handleSelectSeason("summer-solstice");
          setLayers((prev) => ({
            ...prev,
            eclipticPlane: true,
            graticule: true,
            terminatorGuide: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;

        case "summer-midnight-sun":
          handleSelectCameraPreset("northPole", false);
          handleSelectSeason("summer-solstice");
          setSelectedCityId("tromso");
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            terminatorGuide: true,
            cities: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;

        case "winter-polar-night":
          handleSelectCameraPreset("northPole", false);
          handleSelectSeason("winter-solstice");
          setSelectedCityId("tromso");
          setLayers((prev) => ({
            ...prev,
            graticule: true,
            terminatorGuide: true,
            cities: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;

        case "sunrise-east":
          // 春分日の UTC 20:15 は、東経139.65°の東京が夜明け直前（太陽時 05:34頃）になる時刻です。
          handleSelectCameraPreset("northPole", false);
          applyNewDate(new Date("2026-03-20T20:15:00Z"));
          setSelectedCityId("tokyo");
          setLayers((prev) => ({
            ...prev,
            cities: true,
            terminatorGuide: true,
            celestialCompass: true,
          }));
          setSpeedMultiplier(1800);
          setIsPlaying(true);
          break;
      }

      // スマホ（iPhone 17）・タブレット縦（iPad A16 縦）では3D確認ボタンを押した直後にパネルを閉じて画面を広く見せます。
      if (
        typeof window !== "undefined" &&
        (window.innerWidth < 1024 || window.innerHeight < 540)
      ) {
        setIsInspectorOpen(false);
      }
    },
    [applyNewDate, handleSelectCameraPreset, handleSelectSeason]
  );

  return (
    <div className="app-shell">
      <EarthGlobeCanvas
        solarState={solarState}
        moonState={moonState}
        venusState={venusState}
        solarSystemBodies={solarSystemBodies}
        galileanMoons={galileanMoons}
        cities={OBSERVATION_CITIES}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
        cameraPoseTarget={cameraPoseTarget}
        onCameraUserDrag={handleCameraUserDrag}
        layers={layers}
        isInspectorOpen={isInspectorOpen}
      />

      <div className="ui-hud-layout">
        <HeaderBar
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        />

        <div className="hud-middle">
          <InspectorPanel
            isOpen={isInspectorOpen}
            currentDate={currentDate}
            solarState={solarState}
            moonState={moonState}
            venusState={venusState}
            solarSystemBodies={solarSystemBodies}
            galileanMoons={galileanMoons}
            isRealSolarSystemMode={isRealSolarSystemMode}
            isAnnualMotionMode={isAnnualMotionMode}
            onToggleAnnualMotion={handleToggleAnnualMotion}
            onStepMonth={handleStepMonth}
            cities={OBSERVATION_CITIES}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
            cameraPreset={activePresetButton}
            onSelectCameraPreset={handleSelectCameraPreset}
            onResetNorthPoleCamera={handleResetNorthPoleCamera}
            viewTransitionRatio={viewTransitionRatio}
            onChangeViewTransitionRatio={handleChangeViewTransitionRatio}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            onRunGuideExperiment={handleRunGuideExperiment}
          />
        </div>

        <TimeControlBar
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={setSpeedMultiplier}
          currentDate={currentDate}
          onSetDate={applyNewDate}
          onSelectSeason={handleSelectSeason}
          transitioningSeasonId={transitioningSeasonId}
          onResetToNow={handleResetToNow}
          isAnnualMotionMode={isAnnualMotionMode}
          onToggleAnnualMotion={handleToggleAnnualMotion}
        />
      </div>
    </div>
  );
}

export default App;
