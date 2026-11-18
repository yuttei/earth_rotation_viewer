import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OBSERVATION_CITIES } from "./data/cities";
import {
  calculateSolarSystemState,
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
    ratio: 0,
  },
  oblique: {
    yaw: -0.45,
    pitch: 0.68,
    distance: 3.98,
    eclipticBlend: 0,
    ratio: 0.56,
  },
  eclipticNorth: {
    yaw: 0,
    pitch: Math.PI / 2,
    distance: 3.92,
    eclipticBlend: 1,
    ratio: 0,
  },
  eclipticPlane: {
    yaw: 0,
    pitch: 0,
    distance: 4.02,
    eclipticBlend: 1,
    ratio: 1,
  },
};

/**
 * アプリ全体の状態（観測時刻・再生速度・連続視点移動・表示設定・選択都市）を統合するルートコンポーネントです。
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

  const handleSelectCameraPreset = useCallback((preset: CameraPreset) => {
    const p = PRESET_POSES[preset];
    setActivePresetButton(preset);
    setViewTransitionRatio(p.ratio);
    setCameraPoseTarget((prev) => ({
      yaw: p.yaw,
      pitch: p.pitch,
      distance: p.distance,
      eclipticBlend: p.eclipticBlend,
      seq: prev.seq + 1,
    }));
  }, []);

  const handleChangeViewTransitionRatio = useCallback((ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    setViewTransitionRatio(clamped);

    if (clamped <= 0.005) {
      setActivePresetButton("northPole");
    } else if (clamped >= 0.995) {
      setActivePresetButton("eclipticPlane");
    } else {
      setActivePresetButton(null);
    }

    setCameraPoseTarget((prev) => ({
      yaw: 0,
      pitch: (1 - clamped) * (Math.PI / 2),
      distance: 3.92 + clamped * 0.1,
      eclipticBlend: clamped,
      seq: prev.seq,
    }));
  }, []);

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
        case "counterclockwise":
          handleResetNorthPoleCamera();
          setLayers((prev) => ({
            ...prev,
            celestialCompass: true,
            graticule: true,
          }));
          setSpeedMultiplier(3600);
          setIsPlaying(true);
          break;

        case "ecliptic-tilt":
          handleSelectCameraPreset("eclipticPlane");
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
          handleResetNorthPoleCamera();
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
          handleResetNorthPoleCamera();
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
          handleResetNorthPoleCamera();
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
          handleResetNorthPoleCamera();
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
    [applyNewDate, handleResetNorthPoleCamera, handleSelectCameraPreset]
  );

  return (
    <div className="app-shell">
      <EarthGlobeCanvas
        solarState={solarState}
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
                <span>オレンジリング：公転面（黄道面・赤道と23.4°傾斜）</span>
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
