import { describe, expect, it } from "vitest";
import { OBSERVATION_CITIES } from "../../data/cities";
import type { City } from "../../types/astronomy";
import {
  EARTH_AXIAL_TILT_DEG,
  SEASON_PRESETS,
  SIDEREAL_DAY_SECONDS,
  SIDEREAL_MONTH_DAYS,
  SOLAR_DAY_SECONDS,
  SYNODIC_MONTH_DAYS,
  calculateGmstRad,
  calculateMoonState,
  calculateSolarPosition,
  calculateSolarSystemState,
  dateToJulianDay,
  degToRad,
  formatDateTimeParts,
  formatHoursToClock,
  getLocalCompassVectors,
  getMoonPhaseLabelJa,
  getSeasonLabelJa,
  latLonToVector3Tuple,
  normalizeAngleRad,
  normalizeLonDeg,
  observeCity,
  raDecToVector3Tuple,
  radToDeg,
} from "../calculations";

/** 2つの角度（度）の符号付き最短差（-180° 〜 +180°）を計算するテスト用補助関数 */
function signedAngleDiffDeg(targetDeg: number, baseDeg: number): number {
  return ((((targetDeg - baseDeg + 180) % 360) + 360) % 360) - 180;
}

describe("天文計算エンジン (calculations)", () => {
  it("J2000.0 エポック (2000-01-01T12:00:00Z) のユリウス日が 2451545.0 になる", () => {
    const j2000 = new Date("2000-01-01T12:00:00Z");
    const jd = dateToJulianDay(j2000);

    expect(jd).toBe(2451545.0);
    expect(radToDeg(calculateGmstRad(jd))).toBeCloseTo(280.46061837, 6);
  });

  it("春分・夏至・秋分・冬至で太陽赤緯・視黄経・北極点の昼夜状態が理論どおりになる", () => {
    const northPole = OBSERVATION_CITIES.find((c) => c.id === "north-pole");
    expect(northPole).toBeDefined();

    const byId = new Map(SEASON_PRESETS.map((preset) => [preset.id, preset]));

    // 春分：赤緯 ≈ 0°、視黄経 ≈ 0°、分点付近
    const vernal = calculateSolarSystemState(byId.get("vernal-equinox")!.date);
    expect(Math.abs(vernal.subsolarLatDeg)).toBeLessThan(0.05);
    expect(Math.abs(signedAngleDiffDeg(vernal.sunEclipticLongitudeDeg, 0))).toBeLessThan(0.1);
    expect(vernal.northPoleDaylightState).toBe("equinox-transition");
    expect(getSeasonLabelJa(vernal.sunEclipticLongitudeDeg)).toBe("春分付近");

    // 夏至：赤緯 ≈ +23.44°、視黄経 ≈ 90°、北極点は白夜
    const summer = calculateSolarSystemState(byId.get("summer-solstice")!.date);
    expect(summer.subsolarLatDeg).toBeCloseTo(EARTH_AXIAL_TILT_DEG, 1);
    expect(summer.sunEclipticLongitudeDeg).toBeCloseTo(90, 1);
    expect(summer.northPoleDaylightState).toBe("polar-day");
    expect(getSeasonLabelJa(summer.sunEclipticLongitudeDeg)).toBe("夏至付近");
    expect(observeCity(northPole!, summer).daylightPhase).toBe("day");

    // 秋分：赤緯 ≈ 0°、視黄経 ≈ 180°、分点付近
    const autumnal = calculateSolarSystemState(byId.get("autumnal-equinox")!.date);
    expect(Math.abs(autumnal.subsolarLatDeg)).toBeLessThan(0.05);
    expect(autumnal.sunEclipticLongitudeDeg).toBeCloseTo(180, 1);
    expect(autumnal.northPoleDaylightState).toBe("equinox-transition");
    expect(getSeasonLabelJa(autumnal.sunEclipticLongitudeDeg)).toBe("秋分付近");

    // 冬至：赤緯 ≈ -23.44°、視黄経 ≈ 270°、北極点は極夜
    const winter = calculateSolarSystemState(byId.get("winter-solstice")!.date);
    expect(winter.subsolarLatDeg).toBeCloseTo(-EARTH_AXIAL_TILT_DEG, 1);
    expect(winter.sunEclipticLongitudeDeg).toBeCloseTo(270, 1);
    expect(winter.northPoleDaylightState).toBe("polar-night");
    expect(getSeasonLabelJa(winter.sunEclipticLongitudeDeg)).toBe("冬至付近");
    expect(observeCity(northPole!, winter).daylightPhase).toBe("night");
  });

  it("1恒星日で GMST がほぼ 360° 戻り、1太陽日で太陽との相対角度がほぼ 360° 戻って GMST が約 +0.9856° 先に進む", () => {
    const baseDate = new Date("2026-03-20T12:00:00Z");
    const afterSiderealDay = new Date(
      baseDate.getTime() + SIDEREAL_DAY_SECONDS * 1000
    );
    const afterSolarDay = new Date(
      baseDate.getTime() + SOLAR_DAY_SECONDS * 1000
    );

    const jd0 = dateToJulianDay(baseDate);
    const jdSidereal = dateToJulianDay(afterSiderealDay);
    const jdSolar = dateToJulianDay(afterSolarDay);

    const gmst0Deg = radToDeg(calculateGmstRad(jd0));
    const gmstSiderealDeg = radToDeg(calculateGmstRad(jdSidereal));
    const gmstSolarDeg = radToDeg(calculateGmstRad(jdSolar));

    // 1恒星日後：遠い恒星を基準に地球がちょうど1回転（360°）するため GMST の差はほぼ 0°
    expect(Math.abs(signedAngleDiffDeg(gmstSiderealDeg, gmst0Deg))).toBeLessThan(
      1e-4
    );

    // 1太陽日後：地球が太陽の周りを公転した分だけ余分に回るため GMST は約 +0.9856° 先に進む
    expect(signedAngleDiffDeg(gmstSolarDeg, gmst0Deg)).toBeCloseTo(0.9856, 3);

    // 一方、太陽の赤経も公転により約 +0.9° 進むため、GMST と太陽赤経の差（時角）はほぼ元に戻る
    const sun0 = calculateSolarPosition(jd0);
    const sunSolar = calculateSolarPosition(jdSolar);
    const hourAngle0Deg = gmst0Deg - radToDeg(sun0.rightAscensionRad);
    const hourAngleSolarDeg =
      gmstSolarDeg - radToDeg(sunSolar.rightAscensionRad);

    expect(
      Math.abs(signedAngleDiffDeg(hourAngleSolarDeg, hourAngle0Deg))
    ).toBeLessThan(0.15);
  });

  it("座標変換 latLonToVector3Tuple と getLocalCompassVectors が右手直交単位基底 (east × north = up) になる", () => {
    // 基準点の向きを検証（北極=+Y、本初子午線=+X、東経90°=-Z）
    const [nx, ny, nz] = latLonToVector3Tuple(90, 0);
    expect(nx).toBeCloseTo(0, 10);
    expect(ny).toBeCloseTo(1, 10);
    expect(nz).toBeCloseTo(0, 10);

    const [px, py, pz] = latLonToVector3Tuple(0, 0);
    expect(px).toBeCloseTo(1, 10);
    expect(py).toBeCloseTo(0, 10);
    expect(pz).toBeCloseTo(0, 10);

    const [ex, ey, ez] = latLonToVector3Tuple(0, 90);
    expect(ex).toBeCloseTo(0, 10);
    expect(ey).toBeCloseTo(0, 10);
    expect(ez).toBeCloseTo(-1, 10);

    // 角度正規化と天球座標変換（春分点 +X、赤経+90° -Z）
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(normalizeAngleRad(-Math.PI / 2)).toBeCloseTo(1.5 * Math.PI, 10);
    const [rx, ry, rz] = raDecToVector3Tuple(Math.PI / 2, 0);
    expect(rx).toBeCloseTo(0, 10);
    expect(ry).toBeCloseTo(0, 10);
    expect(rz).toBeCloseTo(-1, 10);

    // 東京・シドニー・北極点（極点の特異点なし）で直交単位基底を確認
    const testPoints = [
      { lat: 35.6762, lon: 139.6503 },
      { lat: -33.8688, lon: 151.2093 },
      { lat: 90, lon: 0 },
    ];

    for (const point of testPoints) {
      const { up, north, east, south, west } = getLocalCompassVectors(
        point.lat,
        point.lon
      );

      // 各ベクトルの大きさが 1（単位ベクトル）
      const norm = (v: [number, number, number]) =>
        Math.hypot(v[0], v[1], v[2]);
      expect(norm(up)).toBeCloseTo(1, 10);
      expect(norm(north)).toBeCloseTo(1, 10);
      expect(norm(east)).toBeCloseTo(1, 10);

      // 互いに直交（内積 = 0）
      const dot = (
        a: [number, number, number],
        b: [number, number, number]
      ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      expect(dot(east, north)).toBeCloseTo(0, 10);
      expect(dot(east, up)).toBeCloseTo(0, 10);
      expect(dot(north, up)).toBeCloseTo(0, 10);

      // 右手系の外積 east × north = up が成り立つ
      const cross: [number, number, number] = [
        east[1] * north[2] - east[2] * north[1],
        east[2] * north[0] - east[0] * north[2],
        east[0] * north[1] - east[1] * north[0],
      ];
      expect(cross[0]).toBeCloseTo(up[0], 10);
      expect(cross[1]).toBeCloseTo(up[1], 10);
      expect(cross[2]).toBeCloseTo(up[2], 10);

      // 南・西がそれぞれ北・東の逆ベクトルになっている
      expect(south[0]).toBeCloseTo(-north[0], 10);
      expect(south[1]).toBeCloseTo(-north[1], 10);
      expect(south[2]).toBeCloseTo(-north[2], 10);
      expect(west[0]).toBeCloseTo(-east[0], 10);
      expect(west[1]).toBeCloseTo(-east[1], 10);
      expect(west[2]).toBeCloseTo(-east[2], 10);
    }
  });

  it("春分の夜明け地点で太陽方位が東（約90°）になり、正午付近の東京（UTC 03:00）が昼で現地太陽時が約12:00になる", () => {
    // 1. 春分の瞬間における赤道上の夜明け地点（太陽直下点から西へ90°）を観測
    const equinoxState = calculateSolarSystemState(
      new Date("2026-03-20T14:46:00Z")
    );
    const sunrisePoint: City = {
      id: "equinox-sunrise",
      nameJa: "夜明け地点",
      nameEn: "Sunrise Point",
      regionJa: "赤道上",
      latDeg: 0,
      lonDeg: normalizeLonDeg(equinoxState.subsolarLonDeg - 90),
      utcOffsetHours: 0,
      noteJa: "テスト用",
    };

    const sunriseObs = observeCity(sunrisePoint, equinoxState);
    expect(Math.abs(sunriseObs.solarAltitudeDeg)).toBeLessThan(0.1);
    expect(sunriseObs.solarAzimuthDeg).toBeCloseTo(90, 0);
    expect(sunriseObs.solarDirectionJa).toBe("東");
    expect(sunriseObs.localSolarHours).toBeCloseTo(6.0, 1);
    expect(formatHoursToClock(sunriseObs.localSolarHours)).toBe("06:00");

    // 2. 春分日の UTC 03:00（JST 12:00 正午）における東京を観測
    const tokyo = OBSERVATION_CITIES.find((c) => c.id === "tokyo");
    expect(tokyo).toBeDefined();

    const tokyoNoonDate = new Date("2026-03-20T03:00:00Z");
    const tokyoNoonState = calculateSolarSystemState(tokyoNoonDate);
    const tokyoObs = observeCity(tokyo!, tokyoNoonState);

    expect(tokyoObs.daylightPhase).toBe("day");
    expect(tokyoObs.solarAltitudeDeg).toBeGreaterThan(50);
    expect(Math.abs(tokyoObs.localSolarHours - 12)).toBeLessThan(0.3);
    expect(tokyoObs.solarDirectionJa).toBe("南");

    const { utcText, jstText } = formatDateTimeParts(tokyoNoonDate);
    expect(utcText).toBe("2026-03-20 03:00:00 UTC");
    expect(jstText).toBe("2026-03-20 12:00:00 JST");
  });

  it("月の黄緯が白道傾斜（約±5.15°）の範囲に収まり、1恒星月で黄経が、1朔望月で月相角がほぼ1周戻る", () => {
    const baseDate = new Date("2026-06-21T08:24:00Z");
    const baseSolar = calculateSolarSystemState(baseDate);
    const baseMoon = calculateMoonState(
      baseDate,
      baseSolar.sunEclipticLongitudeDeg
    );

    // 白道の傾きによる黄緯は ±5.2° 以内に収まる
    expect(Math.abs(baseMoon.eclipticLatitudeDeg)).toBeLessThanOrEqual(5.2);
    expect(baseMoon.illumination).toBeGreaterThanOrEqual(0);
    expect(baseMoon.illumination).toBeLessThanOrEqual(1);

    // 1恒星月後、月の黄経はほぼ元の位置に戻る（楕円軌道による近点移動差を含むため数度以内）
    const afterSiderealMonth = new Date(
      baseDate.getTime() + SIDEREAL_MONTH_DAYS * SOLAR_DAY_SECONDS * 1000
    );
    const siderealMoon = calculateMoonState(afterSiderealMonth);
    const lonDiff = Math.abs(
      normalizeLonDeg(
        siderealMoon.eclipticLongitudeDeg - baseMoon.eclipticLongitudeDeg
      )
    );
    expect(lonDiff).toBeLessThan(8);

    // 1朔望月後、太陽からの離角（月相角）はほぼ元の値に戻る
    const afterSynodicMonth = new Date(
      baseDate.getTime() + SYNODIC_MONTH_DAYS * SOLAR_DAY_SECONDS * 1000
    );
    const synodicMoon = calculateMoonState(afterSynodicMonth);
    const phaseDiff = Math.abs(
      normalizeLonDeg(synodicMoon.phaseAngleDeg - baseMoon.phaseAngleDeg)
    );
    expect(phaseDiff).toBeLessThan(10);

    // 代表的な月相ラベルの境界チェック
    expect(getMoonPhaseLabelJa(0)).toBe("新月");
    expect(getMoonPhaseLabelJa(90)).toBe("上弦の月");
    expect(getMoonPhaseLabelJa(180)).toBe("満月");
    expect(getMoonPhaseLabelJa(270)).toBe("下弦の月");
  });
});
