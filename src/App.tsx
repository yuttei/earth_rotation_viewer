import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OBSERVATION_CITIES } from "./data/cities";
import {
  calculateMoonState,
  calculateSolarSystemState,
  degToRad,
  SEASON_PRESETS,
} from "./astronomy/calculations";
import {
  CameraPreset,
  DisplayLayers,
  ReferenceFrame,
  VisualStyle,
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
import { ViewTransitionWidget } from "./components/ViewTransitionWidget";

const DEFAULT_LAYERS: DisplayLayers = {
  graticule: true,
  celestialCompass: true,
  eclipticPlane: true,
  terminatorGuide: true,
  cities: true,
  starsAndEquinox: true,
  moonAndOrbit: true,
};

const GROUND_DEFAULT_ELEVATION = degToRad(26);

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
    durationSec: 2.8,
    ratio: 1,
  },
  sunOverhead: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 56.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    durationSec: 3.4,
    ratio: 1,
  },
  sunEclipticOblique: {
    yaw: 0,
    pitch: degToRad(20),
    distance: 43.0,
    eclipticBlend: 1,
    sunCenterBlend: 1,
    groundBlend: 0,
    groundAzimuth: 0,
    groundElevation: GROUND_DEFAULT_ELEVATION,
    durationSec: 3.2,
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
    durationSec: 1.8,
    ratio: 0,
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
  const [visualStyle, setVisualStyle] = useState<VisualStyle>("realistic");
  const [referenceFrame, setReferenceFrame] = useState<ReferenceFrame>("solar");

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
    durationSec: PRESET_POSES.northPole.durationSec,
    seq: 0,
  });

  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [layers, setLayers] = useState<DisplayLayers>(DEFAULT_LAYERS);

  const simTimeMsRef = useRef<number>(currentDate.getTime());

  const applyNewDate = useCallback((nextDate: Date) => {
    simTimeMsRef.current = nextDate.getTime();
    setCurrentDate(nextDate);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let rafId = 0;
    let lastFrameMs = performance.now();

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const elapsedSec = Math.min(0.1, (now - lastFrameMs) / 1000);
      lastFrameMs = now;

      simTimeMsRef.current += elapsedSec * 1000 * speedMultiplier;
      setCurrentDate(new Date(simTimeMsRef.current));
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speedMultiplier]);

  const solarState = useMemo(
    () => calculateSolarSystemState(currentDate),
    [currentDate]
  );

  const moonState = useMemo(
    () => calculateMoonState(currentDate, solarState.sunEclipticLongitudeDeg),
    [currentDate, solarState.sunEclipticLongitudeDeg]
  );

  const handleStepSeconds = useCallback(
    (deltaSeconds: number) => {
      const next = new Date(simTimeMsRef.current + deltaSeconds * 1000);
      applyNewDate(next);
    },
    [applyNewDate]
  );

  const handleResetToNow = useCallback(() => {
    applyNewDate(new Date());
  }, [applyNewDate]);

  const handleSelectCameraPreset = useCallback(
    (preset: CameraPreset, adjustSpeedAutomatically = true) => {
      const p = PRESET_POSES[preset];
      const isTargetGround = p.groundBlend > 0.5;
      setActivePresetButton(preset);
      setViewTransitionRatio(p.ratio);

      if (isTargetGround) {
        // 東京の地上視点へ移動したら、右パネルの観測情報も自動で「東京」に合わせます。
        setSelectedCityId("tokyo");
      }

      // 宇宙空間 ⇄ 東京地上、および太陽中心・月軌道・地球近接の各距離帯を跨ぐ場合はゆっくり連続移動します。
      setCameraPoseTarget((prev) => {
        const crossesGround = prev.groundBlend !== p.groundBlend;
        const crossesSunCenter = prev.sunCenterBlend !== p.sunCenterBlend;
        const crossesMoonBand = (prev.distance >= 7.5) !== (p.distance >= 7.5);
        const durationSec = crossesGround
          ? prev.sunCenterBlend > 0.5 || p.sunCenterBlend > 0.5
            ? 3.6
            : 3.1
          : crossesSunCenter
          ? 3.4
          : crossesMoonBand
          ? 3.0
          : p.durationSec;

        return {
          yaw: p.yaw,
          pitch: p.pitch,
          distance: p.distance,
          eclipticBlend: p.eclipticBlend,
          sunCenterBlend: p.sunCenterBlend,
          groundBlend: p.groundBlend,
          // 地上から宇宙へ戻るときは直前に見ていた方角を保ったまま滑らかに上昇します。
          groundAzimuth: isTargetGround ? p.groundAzimuth : prev.groundAzimuth,
          groundElevation: isTargetGround
            ? p.groundElevation
            : prev.groundElevation,
          durationSec,
          seq: prev.seq + 1,
        };
      });

      if (adjustSpeedAutomatically) {
        const isOrbitalView =
          preset === "moonNorthPole" ||
          preset === "moonEclipticPlane" ||
          preset === "sunOverhead" ||
          preset === "sunEclipticOblique";
        if (isOrbitalView) {
          setSpeedMultiplier((prev) => (prev < 86400 ? 86400 : prev));
          setIsPlaying(true);
        } else {
          setSpeedMultiplier((prev) => (prev >= 86400 ? 1800 : prev));
        }
      }
    },
    []
  );

  const isMoonDistanceMode =
    cameraPoseTarget.groundBlend < 0.5 &&
    cameraPoseTarget.sunCenterBlend < 0.5 &&
    cameraPoseTarget.distance >= 7.5;

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
        durationSec:
          prev.sunCenterBlend > 0.5 || prev.groundBlend > 0.5 ? 2.6 : 0.45,
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
        case "tokyo-ground-sky":
          handleSelectCameraPreset("tokyoSouth", false);
          setSelectedCityId("tokyo");
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
          applyNewDate(new Date(SEASON_PRESETS[1].date.getTime()));
          setReferenceFrame("solar");
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
          applyNewDate(new Date(SEASON_PRESETS[1].date.getTime()));
          setReferenceFrame("solar");
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
          applyNewDate(new Date(SEASON_PRESETS[3].date.getTime()));
          setReferenceFrame("solar");
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
          setReferenceFrame("solar");
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

        case "sidereal-vs-solar":
          handleSelectCameraPreset("northPole", false);
          setReferenceFrame("sidereal");
          setLayers((prev) => ({
            ...prev,
            starsAndEquinox: true,
            celestialCompass: true,
            graticule: true,
          }));
          setIsPlaying(false);
          break;
      }
    },
    [applyNewDate, handleSelectCameraPreset]
  );

  return (
    <div className="app-shell">
      <EarthGlobeCanvas
        solarState={solarState}
        moonState={moonState}
        cities={OBSERVATION_CITIES}
        selectedCityId={selectedCityId}
        onSelectCity={setSelectedCityId}
        visualStyle={visualStyle}
        referenceFrame={referenceFrame}
        cameraPoseTarget={cameraPoseTarget}
        onCameraUserDrag={handleCameraUserDrag}
        layers={layers}
        isInspectorOpen={isInspectorOpen}
      />

      <div className="ui-hud-layout">
        <HeaderBar
          currentDate={currentDate}
          solarState={solarState}
          visualStyle={visualStyle}
          onChangeVisualStyle={setVisualStyle}
          referenceFrame={referenceFrame}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        />

        <div className="hud-middle">
          <div className="hud-left-column">
            <ViewTransitionWidget
              transitionRatio={viewTransitionRatio}
              onChangeTransitionRatio={handleChangeViewTransitionRatio}
              activePreset={activePresetButton}
              onSelectPreset={handleSelectCameraPreset}
            />

            <div className="hud-legend" aria-label="図解の凡例">
              <div className="legend-row">
                <span className="legend-swatch ccw" />
                <span>シアン矢印：反時計回りの自転 ／ 各地の「東」</span>
              </div>
              <div className="legend-row">
                <span className="legend-swatch sun" />
                <span>ゴールド矢印：太陽光の向き（昼の側）</span>
              </div>
              <div className="legend-row">
                <span className="legend-swatch ecliptic" />
                <span>オレンジリング：黄道面（公転面・公転軌道）</span>
              </div>
              <div className="legend-row">
                <span className="legend-swatch moon" />
                <span>銀白リング：月の公転軌道（白道・約5.1°傾斜）</span>
              </div>
              <div className="legend-row">
                <span className="legend-swatch arctic" />
                <span>水色破線：北極圏 (66.6°N・白夜と極夜の境界)</span>
              </div>
              <div className="legend-row">
                <span className="legend-swatch equinox" />
                <span>紫破線：春分点方向 (♈・恒星基準の方向)</span>
              </div>
            </div>
          </div>

          <InspectorPanel
            isOpen={isInspectorOpen}
            solarState={solarState}
            moonState={moonState}
            cities={OBSERVATION_CITIES}
            selectedCityId={selectedCityId}
            onSelectCity={setSelectedCityId}
            cameraPreset={activePresetButton}
            onSelectCameraPreset={handleSelectCameraPreset}
            onResetNorthPoleCamera={handleResetNorthPoleCamera}
            viewTransitionRatio={viewTransitionRatio}
            onChangeViewTransitionRatio={handleChangeViewTransitionRatio}
            referenceFrame={referenceFrame}
            onChangeReferenceFrame={setReferenceFrame}
            layers={layers}
            onToggleLayer={handleToggleLayer}
            onRunGuideExperiment={handleRunGuideExperiment}
          />
        </div>

        <TimeControlBar
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((prev) => !prev)}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={setSpeedMultiplier}
          currentDate={currentDate}
          onSetDate={applyNewDate}
          onStepSeconds={handleStepSeconds}
          onResetToNow={handleResetToNow}
        />
      </div>
    </div>
  );
}

export default App;
