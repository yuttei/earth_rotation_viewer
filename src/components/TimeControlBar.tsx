import React from "react";
import { CalendarClock, Pause, Play, RotateCcw } from "lucide-react";
import {
  getTimeSliderScale,
  SEASON_PRESETS,
  SeasonPreset,
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
  /** 現在時刻（「今」）へリセットするハンドラ */
  onResetToNow: () => void;
  /** 星の年周運動観察モード（毎日 21:00 JST 固定で日付のみ進行）が有効か */
  isAnnualMotionMode: boolean;
  /** 年周運動観察モードの ON/OFF トグル */
  onToggleAnnualMotion: () => void;
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
  onResetToNow,
  isAnnualMotionMode,
  onToggleAnnualMotion,
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
          className={`play-btn ${isPlaying ? "is-active" : ""}`}
          onClick={onTogglePlay}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? "一時停止" : "再生"}
          title={isPlaying ? "自転・公転の進行を一時停止" : "自転・公転の進行を再生"}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
        </button>

        <button
          type="button"
          className="ctrl-btn"
          onClick={onResetToNow}
          aria-label="現在時刻（今）に合わせる"
          title="現実の現在時刻に合わせる"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          className={`ctrl-btn ${isAnnualMotionMode ? "is-active" : ""}`}
          onClick={onToggleAnnualMotion}
          aria-pressed={isAnnualMotionMode}
          title="毎日21:00 JSTに時刻を固定し、公転による星と星座の年周運動（1ヶ月で約30°）を滑らかに観察"
        >
          <CalendarClock size={12} />
          年周(21時)
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
