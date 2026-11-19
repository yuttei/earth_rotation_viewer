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
  VENUS_SIDEREAL_PERIOD_DAYS,
  applyAnnualFixedHourLock,
  calculateGmstRad,
  calculateMoonState,
  calculateSolarPosition,
  calculateSolarSystemState,
  calculateVenusState,
  dateToJulianDay,
  degToRad,
  formatDateTimeParts,
  formatHoursToClock,
  getLocalCompassVectors,
  getMoonPhaseLabelJa,
  getNextSeasonDate,
  getSeasonLabelJa,
  getTimeSliderScale,
  latLonToVector3Tuple,
  normalizeAngleRad,
  normalizeLonDeg,
  observeCity,
  raDecToVector3Tuple,
  radToDeg,
  snapDateToJstHour,
} from "../calculations";
import {
  calculateFullSolarSystemState,
  calculateGalileanMoonsState,
} from "../solarSystem";
import {
  CASSIOPEIA_CONSTELLATION,
  ZODIAC_CONSTELLATIONS,
  equatorialToEclipticDeg,
  getSunAndMidnightZodiac,
  getZodiacConstellationAtLongitude,
} from "../zodiac";

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

  it("getNextSeasonDate は常に現在時刻より未来の次の季節日時を返し、太陽視黄経が目標季節に一致する", () => {
    const novDate = new Date("2026-11-19T00:00:00Z");

    // 11月から冬至は同年の12月（約32日後）
    const nextWinter = getNextSeasonDate(novDate, "winter-solstice");
    expect(nextWinter.getTime()).toBeGreaterThan(novDate.getTime());
    expect(
      Math.abs(
        signedAngleDiffDeg(
          calculateSolarSystemState(nextWinter).sunEclipticLongitudeDeg,
          270
        )
      )
    ).toBeLessThan(0.5);

    // 11月から春分は翌年の3月（約122日後）へ前進する
    const nextVernal = getNextSeasonDate(novDate, "vernal-equinox");
    expect(nextVernal.getTime()).toBeGreaterThan(nextWinter.getTime());
    expect(
      Math.abs(
        signedAngleDiffDeg(
          calculateSolarSystemState(nextVernal).sunEclipticLongitudeDeg,
          0
        )
      )
    ).toBeLessThan(0.5);

    // ちょうど夏至の瞬間に夏至を選ぶと、1太陽年後の次の夏至へ前進する
    const exactSummer = SEASON_PRESETS[1].date;
    const nextSummer = getNextSeasonDate(exactSummer, "summer-solstice");
    const diffDays = (nextSummer.getTime() - exactSummer.getTime()) / (86400 * 1000);
    expect(diffDays).toBeCloseTo(365.24219, 3);
  });

  it("金星は内惑星として離角が約48°以内に収まり、1公転周期（約224.7日）で日心黄経が1周戻る", () => {
    // 2026年10月24日頃は金星の内合付近（太陽の正面・距離約0.28 AU・離角が小さい）
    const infConjDate = new Date("2026-10-24T12:00:00Z");
    const infConjVenus = calculateVenusState(infConjDate);
    expect(infConjVenus.distanceAu).toBeLessThan(0.32);
    expect(Math.abs(infConjVenus.elongationDeg)).toBeLessThan(8);
    expect(infConjVenus.illumination).toBeLessThan(0.05);

    // 約1ヶ月後の2026年11月19日は太陽の西側へ離れ「明けの明星（東の空）」になる
    const morningDate = new Date("2026-11-19T00:00:00Z");
    const morningVenus = calculateVenusState(morningDate);
    expect(morningVenus.elongationDeg).toBeLessThan(-15);
    expect(morningVenus.visibilityLabelJa).toBe("明けの明星（東の空）");

    // 1公転周期（224.7008日）経過すると日心黄経がほぼ元の値に戻る
    const afterOneOrbit = new Date(
      morningDate.getTime() + VENUS_SIDEREAL_PERIOD_DAYS * SOLAR_DAY_SECONDS * 1000
    );
    const orbitVenus = calculateVenusState(afterOneOrbit);
    expect(
      Math.abs(
        signedAngleDiffDeg(
          orbitVenus.heliocentricLongitudeDeg,
          morningVenus.heliocentricLongitudeDeg
        )
      )
    ).toBeLessThan(1.0);

    // 1会合周期（約584日）にわたって離角が常に 48° 以内（内惑星の性質）
    for (let day = 0; day < 600; day += 30) {
      const d = new Date(infConjDate.getTime() + day * SOLAR_DAY_SECONDS * 1000);
      const v = calculateVenusState(d);
      expect(Math.abs(v.elongationDeg)).toBeLessThanOrEqual(48);
      expect(Math.abs(v.heliocentricLatitudeDeg)).toBeLessThanOrEqual(3.5);
    }
  });

  it("リアル太陽系エンジンが水金地火木土天海冥の9天体と木星主要4衛星を軌道要素どおりに算出する", () => {
    const sampleDate = new Date("2026-11-19T00:00:00Z");
    const bodies = calculateFullSolarSystemState(sampleDate);
    expect(bodies).toHaveLength(9);
    expect(bodies.map((b) => b.id)).toEqual([
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
    ]);

    const earth = bodies.find((b) => b.id === "earth")!;
    const pluto = bodies.find((b) => b.id === "pluto")!;
    expect(earth.distanceFromSunAu).toBeGreaterThan(0.98);
    expect(earth.distanceFromSunAu).toBeLessThan(1.02);
    expect(pluto.distanceFromSunAu).toBeGreaterThan(29.5);
    expect(pluto.distanceFromSunAu).toBeLessThan(50.0);
    expect(pluto.inclinationDeg).toBeCloseTo(17.16, 1);

    // 木星の主要4衛星（イオ・エウロパ・ガニメデ・カリスト）の算出とイオの1公転復帰
    const moons = calculateGalileanMoonsState(sampleDate);
    expect(moons.map((m) => m.id)).toEqual([
      "io",
      "europa",
      "ganymede",
      "callisto",
    ]);
    const io0 = moons[0];
    const afterIoOrbit = new Date(
      sampleDate.getTime() + io0.periodDays * SOLAR_DAY_SECONDS * 1000
    );
    const io1 = calculateGalileanMoonsState(afterIoOrbit)[0];
    expect(Math.abs(signedAngleDiffDeg(io1.angleDeg, io0.angleDeg))).toBeLessThan(
      0.01
    );
  });

  it("getTimeSliderScale が再生速度に応じて 1日 / 1ヶ月 / 1年 / 50年 レンジへ自動スケーリングする", () => {
    const d = new Date("2026-11-19T03:30:00Z");

    const dayScale = getTimeSliderScale(d, 1800);
    expect(dayScale.mode).toBe("day");
    expect(dayScale.rangeBadgeJa).toBe("1日");
    expect(dayScale.label).toBe("UTC 03:30");

    const monthScale = getTimeSliderScale(d, 86400);
    expect(monthScale.mode).toBe("month");
    expect(monthScale.rangeBadgeJa).toBe("1ヶ月");
    expect(monthScale.label).toBe("11月 19日");

    const yearScale = getTimeSliderScale(d, 2592000);
    expect(yearScale.mode).toBe("year");
    expect(yearScale.rangeBadgeJa).toBe("1年");
    expect(yearScale.label).toBe("2026/11/19");

    const longScale = getTimeSliderScale(d, 31557600);
    expect(longScale.mode).toBe("half-century");
    expect(longScale.rangeBadgeJa).toBe("50年");
    expect(longScale.label).toBe("2026年 11月");
  });

  it("黄道13星座（へびつかい座を含む）が全周360°をすき間なく覆い、春分点・夏至点・12月初旬の星座判定が正しい", () => {
    expect(ZODIAC_CONSTELLATIONS).toHaveLength(13);

    // 赤道座標 → 黄道座標変換の検算（春分点 0h,0° → λ=0°,β=0° / 夏至点 6h,+23.44° → λ=90°,β=0°）
    const vernal = equatorialToEclipticDeg(0, 0);
    expect(vernal.lonDeg).toBeCloseTo(0, 4);
    expect(vernal.latDeg).toBeCloseTo(0, 4);
    const summer = equatorialToEclipticDeg(6, EARTH_AXIAL_TILT_DEG);
    expect(summer.lonDeg).toBeCloseTo(90, 2);
    expect(Math.abs(summer.latDeg)).toBeLessThan(0.01);

    // 0°〜359° の全黄経が必ず13星座のいずれかへ一意に属する
    const seen = new Set<string>();
    for (let deg = 0; deg < 360; deg++) {
      seen.add(getZodiacConstellationAtLongitude(deg).id);
    }
    expect(seen.size).toBe(13);

    // 現代（J2000）では春分点 0° はうお座、12月初旬（λ=255°）は13番目の「へびつかい座」
    const equinoxZodiac = getSunAndMidnightZodiac(0);
    expect(equinoxZodiac.sunConstellation.id).toBe("pisces");
    expect(equinoxZodiac.midnightConstellation.id).toBe("virgo");

    const decZodiac = getSunAndMidnightZodiac(255);
    expect(decZodiac.sunConstellation.id).toBe("ophiuchus");
    expect(decZodiac.sunConstellation.isThirteenth).toBe(true);
    expect(decZodiac.midnightConstellation.id).toBe("taurus");

    // カシオペア座（W字形5星・4辺）が北天高緯度に配置されている
    expect(CASSIOPEIA_CONSTELLATION.stars).toHaveLength(5);
    expect(CASSIOPEIA_CONSTELLATION.edges).toHaveLength(4);
    for (const st of CASSIOPEIA_CONSTELLATION.stars) {
      expect(st.latDeg).toBeGreaterThan(40);
    }
  });

  it("年周運動モード（snapDateToJstHour / applyAnnualFixedHourLock）が毎日21時JSTを維持したまま1ヶ月約30°ずつ恒星を滑らかに進める", () => {
    const base = snapDateToJstHour(new Date("2026-11-19T03:15:00Z"), 21);
    expect(base.toISOString()).toBe("2026-11-19T12:00:00.000Z");

    const halfDayLater = new Date(base.getTime() + 12 * 3_600_000);
    const monthLater = new Date(base.getTime() + 30 * SOLAR_DAY_SECONDS * 1000);

    const s0 = applyAnnualFixedHourLock(calculateSolarSystemState(base), base, 21);
    const sHalf = applyAnnualFixedHourLock(
      calculateSolarSystemState(halfDayLater),
      halfDayLater,
      21
    );
    const sMonth = applyAnnualFixedHourLock(
      calculateSolarSystemState(monthLater),
      monthLater,
      21
    );

    // 12時間後でも自転の昼夜回転が相殺され、GMST の進みは半日分の年周移動（約 +0.49°）だけになる
    const halfDriftDeg = normalizeLonDeg(radToDeg(sHalf.gmstRad - s0.gmstRad));
    expect(halfDriftDeg).toBeCloseTo(0.493, 1);

    // 30日後（同じ21:00 JST）には恒星が約 +29.57°（約30°）進む
    const monthDriftDeg = normalizeLonDeg(radToDeg(sMonth.gmstRad - s0.gmstRad));
    expect(monthDriftDeg).toBeCloseTo(29.57, 0);

    // 東京は半日後も21時固定の夜（太陽高度が負）のまま安定する
    const tokyo = OBSERVATION_CITIES.find((c) => c.id === "tokyo")!;
    expect(observeCity(tokyo, sHalf).daylightPhase).toBe("night");
  });
});
