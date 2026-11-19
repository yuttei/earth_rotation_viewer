import React from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import {
  getTimeSliderScale,
  SEASON_PRESETS,
  SeasonPreset,
  SIDEREAL_DAY_SECONDS,
  SOLAR_DAY_SECONDS,
} from "../astronomy/calculations";

interface TimeControlBarProps {
  /** 現在シミュレーションが再生中か */
  isPlaying: boolean;
  /** 再生・一時停止トグル */
  onTogglePlay: () => void;
  /** 現在の再生倍率（1 = 実時間） */
  speedMultiplier: number;
  /** 倍率変更ハンドラ */
  onChangeSpeed: (multiplier: number) => void;
  /** 現在のシミュレーション日時 */
  currentDate: Date;
  /** 日時を直接変更するハンドラ（スライダー等） */
  onSetDate: (date: Date) => void;
  /** 指定季節（春分・夏至・秋分・冬至）へ時間を滑らかに進めるハンドラ */
  onSelectSeason: (seasonId: SeasonPreset["id"]) => void;
  /** 現在、滑らかな時間移動で向かっている季節ID（移動中でなければ null） */
  transitioningSeasonId: SeasonPreset["id"] | null;
  /** 指定秒数だけ時間を進める（または戻す）ハンドラ */
  onStepSeconds: (deltaSeconds: number) => void;
  /** 現在時刻（「今」）へリセットするハンドラ */
  onResetToNow: () => void;
}

const SPEED_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: "1×" },
  { value: 1800, label: "30分/s" },
  { value: 7200, label: "2時間/s" },
  { value: 86400, label: "1日/s" },
  { value: 864000, label: "10日/s" },
  { value: 2592000, label: "30日/s" },
  { value: 31557600, label: "1年/s" },
];

/**
 * 画面下部に配置する時間操作バーです。
 * 自転観察向けの倍率から公転観察向けの高速倍率（1日/s〜30日/s）、
 * 1日スライダー、1恒星日/1太陽日ステップ、季節プリセットを提供します。
 */
export const TimeControlBar: React.FC<TimeControlBarProps> = ({
  isPlaying,
  onTogglePlay,
  speedMultiplier,
  onChangeSpeed,
  currentDate,
  onSetDate,
  onSelectSeason,
  transitioningSeasonId,
  onStepSeconds,
  onResetToNow,
}) => {
  // 現在の再生速度（時間/s）に応じてスライダーのレンジ（1日 / 1ヶ月 / 1年 / 50年）と刻み幅をスケーリングします。
  const sliderScale = getTimeSliderScale(currentDate, speedMultiplier);

  const handleScrubSlider = (stepValue: number) => {
    const clamped = Math.max(0, Math.min(sliderScale.max, stepValue));
    let nextMs = sliderScale.startMs + clamped * sliderScale.stepMs;
    // 1年レンジ（1日刻み）でドラッグするときは、現在の時刻（時・分）を保ったまま日付だけ動かします。
    if (sliderScale.mode === "year") {
      const dayStartMs = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate()
      );
      const timeOfDayMs = currentDate.getTime() - dayStartMs;
      nextMs += timeOfDayMs;
    }
    onSetDate(new Date(nextMs));
  };

  return (
    <section className="time-control-bar" aria-label="時間と季節の操作">
      <div className="playback-group">
        <button
          type="button"
          className="play-btn"
          onClick={onTogglePlay}
          title={isPlaying ? "自転・公転の進行を一時停止" : "自転・公転の進行を再生"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          {isPlaying ? "一時停止" : "再生"}
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={onResetToNow}
          title="現実の現在時刻に合わせる"
        >
          <RotateCcw size={12} />
          今
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={() => onStepSeconds(SIDEREAL_DAY_SECONDS)}
          title="1恒星日（23時間56分04秒）だけ進める：恒星に対して地球がちょうど1周します"
        >
          <StepForward size={12} />
          +1恒星日
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={() => onStepSeconds(SOLAR_DAY_SECONDS)}
          title="1太陽日（24時間ちょうど）だけ進める：太陽に対して地球が1周します"
        >
          <StepForward size={12} />
          +1太陽日
        </button>
      </div>

      <div className="speed-group" role="group" aria-label="再生速度">
        {SPEED_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`ctrl-btn ${speedMultiplier === opt.value ? "is-active" : ""}`}
            onClick={() => onChangeSpeed(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="scrub-group" title={sliderScale.ariaLabel}>
        <span className="scrub-scale-badge">{sliderScale.rangeBadgeJa}</span>
        <input
          type="range"
          className="scrub-slider"
          min={0}
          max={sliderScale.max}
          step={1}
          value={sliderScale.value}
          onChange={(e) => handleScrubSlider(Number(e.target.value))}
          aria-label={sliderScale.ariaLabel}
        />
        <span className="scrub-label">{sliderScale.label}</span>
      </div>

      <div className="season-group" role="group" aria-label="季節プリセット">
        {SEASON_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`ctrl-btn ${
              transitioningSeasonId === preset.id ? "is-active" : ""
            }`}
            onClick={() => onSelectSeason(preset.id)}
            title={`${preset.labelJa}まで時間を滑らかに進めます：${preset.descriptionJa}`}
          >
            {preset.labelJa}
          </button>
        ))}
      </div>
    </section>
  );
};
