# POLARIS — 詳細仕様書

本文書は、3D Web アプリケーション「POLARIS — 天の北極から見る地球の自転」（パッケージ名：`earth-rotation-viewer`）における天文座標系、天文計算モデル、表示・操作仕様、および実装・テスト方針を定義する。

---

## 1. 天文座標系の定義

### 1.1 3D 空間座標軸（右手座標系）

本アプリでは Three.js 標準の右手座標系を採用し、天球上の基準方向および地球固定座標の基準を以下のように割り当てる。

| 軸 | 地球固定基準（初期回転 $0$ 時） | 天球慣性基準（`sidereal` 時） | 空間内の幾何学的方向 |
|---|---|---|---|
| `+X` | 本初子午線（経度 $\lambda = 0^\circ$） | 春分点（`♈`、赤経 $\alpha = 0^\circ$） | 基準経線方向（水平右） |
| `+Y` | 北極点（北緯 $\phi = +90^\circ$） | 天の北極（赤緯 $\delta = +90^\circ$） | 自転軸の北向き延長方向（上） |
| `-Z` | 東経 $90^\circ$（$\lambda = +90^\circ$） | 赤経 $90^\circ$（$6\text{h}$） | 水平奥方向 |
| `+Z` | 西経 $90^\circ$（$\lambda = -90^\circ$） | 赤経 $270^\circ$（$18\text{h}$） | 水平手前方向 |

球面上の任意の点（半径 $R$、緯度または赤緯 $\phi$、経度または赤経 $\lambda$、いずれも東・北を正）から直交座標 $(x, y, z)$ への変換式は以下となる。

$$x = R \cos\phi \cos\lambda$$

$$y = R \sin\phi$$

$$z = -R \cos\phi \sin\lambda$$

- $R$：地球半径または天球半径（単位球計算時は $R = 1$）
- $\phi$：緯度または赤緯（ラジアン、$-\pi/2 \le \phi \le \pi/2$）
- $\lambda$：東経を正とする経度、または赤経（ラジアン）

### 1.2 天の北極から見て反時計回りになる理由

右手座標系では基本ベクトルの外積が $\vec{e}_x \times \vec{e}_y = +\vec{e}_z$ を満たすため、右手の親指を `+Y` 軸（天の北極の向き）に合わせると、他の4本の指は `+Z → +X → -Z → -X` の順に巻く。上記変換式では経度 $\lambda$ が $0^\circ \to +90^\circ$（西から東）へ増えるにつれて座標が `(+R, 0, 0)`（`+X`）から `(0, 0, -R)`（`-Z`）へ移るため、経度増加方向（地球の自転方向である西から東）は `+Y` 軸正方向周りの正の回転角に一致する。

したがって、`+Y` 軸の遠方（天の北極側）から地球を見下ろすと、地球の自転方向は常に**反時計回り**となる。Three.js で地球オブジェクトに Y 軸周りの回転角 `rotation.y = +θ` を適用した場合、変換行列は次式で作用する。

$$x' = x \cos\theta + z \sin\theta = R \cos\phi \cos(\lambda + \theta)$$

$$y' = y = R \sin\phi$$

$$z' = -x \sin\theta + z \cos\theta = -R \cos\phi \sin(\lambda + \theta)$$

- $\theta$：Y 軸正方向の回転角（`sidereal` フレームではグリニッジ平均恒星時 $\text{GMST}$、`solar` フレームでは $\text{GMST} - \alpha_\odot$）

これにより、回転角 $\theta = \text{GMST}$ を与えるだけで、地球上の経度 $\lambda$ の地点が天球座標上の赤経 $\alpha = \text{GMST} + \lambda$（地方恒星時 $\text{LST}$）へそのまま一致する。

---

## 2. 天文計算モデル

天文計算モジュールは純粋関数として実装し、任意の協定世界時（UTC）の `Date`（または UNIX ミリ秒 `timestampMs`）から [src/types/astronomy.ts](../src/types/astronomy.ts) で定義された `SolarSystemState` および `CityObservation` を算出する。

### 2.1 ユリウス日（`julianDay`）

UNIX エポック（1970-01-01T00:00:00.000Z）のユリウス日 $\text{JD}_{1970} = 2440587.5$ を基準とし、UNIX ミリ秒 `timestampMs`（1日 $= 86{,}400{,}000\text{ ms}$）から連続ユリウス日 $\text{JD}$ を求める。

$$\text{JD} = \frac{\text{timestampMs}}{86{,}400{,}000} + 2440587.5$$

さらに J2000.0 元期（2000-01-01T12:00:00Z、$\text{JD}_0 = 2451545.0$）からの経過日数 $D$ およびユリウス世紀数 $T$ を定義する。

$$D = \text{JD} - 2451545.0$$

$$T = \frac{D}{36525}$$

- $\text{JD}$：ユリウス日（`julianDay`）
- $D$：J2000.0 からの経過日数（日）
- $T$：J2000.0 からの経過ユリウス世紀数

### 2.2 グリニッジ平均恒星時（`gmstRad`）

春分点に対する本初子午線の回転角であるグリニッジ平均恒星時（以下 GMST）を、度単位の標準多項式で算出する。

$$\text{GMST}_{\deg} = 280.46061837 + 360.98564736629 \cdot D + 0.000387933 \cdot T^2 - \frac{T^3}{38{,}710{,}000}$$

算出した $\text{GMST}_{\deg}$ を $[0^\circ, 360^\circ)$ に正規化したうえでラジアンへ変換し、`gmstRad` $\in [0, 2\pi)$ を得る。

- 1太陽日（$D$ が $+1.0$ 増加）あたり、$\text{GMST}_{\deg}$ は約 $360.985647^\circ$ 進む
- $\text{GMST}_{\deg}$ がちょうど $360^\circ$ 進む所要時間が 1 恒星日（約 $0.99726957\text{ 日}$）となる

### 2.3 太陽の視黄経・赤経・赤緯

J2000.0 からの経過日数 $D$ を用いて、天文年鑑（Astronomical Almanac）の低精度太陽位置計算式（1950〜2050 年頃で精度約 $0.01^\circ$）により太陽の視黄経・赤経・赤緯を算出する。

$$L = (280.460 + 0.9856474 \cdot D) \bmod 360$$

$$g = (357.528 + 0.9856003 \cdot D) \bmod 360$$

$$\lambda_\odot = (L + 1.915 \sin g + 0.020 \sin 2g) \bmod 360$$

$$\varepsilon = 23.439 - 0.0000004 \cdot D$$

- $L$：太陽の平均黄経（度、$[0^\circ, 360^\circ)$ に正規化）
- $g$：太陽の平均近点角（度、三角関数へはラジアン変換して入力）
- $\lambda_\odot$：太陽視黄経（`sunEclipticLongitudeDeg`、度、$[0^\circ, 360^\circ)$）
- $\varepsilon$：黄道傾斜角（度、J2000.0 付近で約 $23.44^\circ$）

太陽視黄経 $\lambda_\odot$ と黄道傾斜角 $\varepsilon$ をラジアンに変換し、赤道座標上の太陽赤経 $\alpha_\odot$（`sunRightAscensionRad`）および太陽赤緯 $\delta_\odot$（`sunDeclinationRad`）を算出する。

$$\alpha_\odot = \operatorname{atan2}(\cos\varepsilon \sin\lambda_\odot,\; \cos\lambda_\odot) \bmod 2\pi$$

$$\delta_\odot = \arcsin(\sin\varepsilon \sin\lambda_\odot)$$

- $\alpha_\odot$：太陽の赤経（ラジアン、$[0, 2\pi)$）
- $\delta_\odot$：太陽の赤緯（ラジアン、夏至付近で約 $+23.44^\circ$、冬至付近で約 $-23.44^\circ$）

| 季節 | 太陽視黄経 $\lambda_\odot$ | 太陽赤経 $\alpha_\odot$ | 太陽赤緯 $\delta_\odot$ | 北半球の日照傾向 |
|---|---|---|---|---|
| 春分 | $0^\circ$ | $0^\circ$（$0\text{h}$） | $0^\circ$ | 全世界で昼夜がほぼ12時間ずつ |
| 夏至 | $90^\circ$ | $90^\circ$（$6\text{h}$） | 約 $+23.44^\circ$ | 北極圏（$66.6^\circ\text{N}$ 以北）が白夜 |
| 秋分 | $180^\circ$ | $180^\circ$（$12\text{h}$） | $0^\circ$ | 全世界で昼夜がほぼ12時間ずつ |
| 冬至 | $270^\circ$ | $270^\circ$（$18\text{h}$） | 約 $-23.44^\circ$ | 北極圏（$66.6^\circ\text{N}$ 以北）が極夜 |

### 2.4 太陽直下点と北極点の昼夜状態

太陽直下点（地表で太陽が天頂に位置する地点）の緯度 `subsolarLatDeg` および経度 `subsolarLonDeg` は次式で求める。

$$\phi_{\text{sub}} = \operatorname{radToDeg}(\delta_\odot)$$

$$\lambda_{\text{sub}} = \operatorname{wrap}_{180}(\operatorname{radToDeg}(\alpha_\odot - \text{gmstRad}))$$

- $\phi_{\text{sub}}$：太陽直下点の緯度（度、$[-90^\circ, +90^\circ]$）
- $\lambda_{\text{sub}}$：太陽直下点の経度（度、$[-180^\circ, +180^\circ)$、東経が正）
- $\operatorname{wrap}_{180}(\theta)$：角度を $[-180^\circ, +180^\circ)$ に折り返す正規化関数

北極点（$\phi = +90^\circ$）の太陽高度角は幾何学的に太陽赤緯 $\delta_\odot$ に等しくなるため、北極点の状態 `northPoleDaylightState` は太陽赤緯の度数 $\delta_{\deg} = \operatorname{radToDeg}(\delta_\odot)$ に応じて以下の3区分で判定する。

| 状態値 | 条件（設計基準） | 物理的意味 |
|---|---|---|
| `"polar-day"` | $\delta_{\deg} > +0.5^\circ$ | 太陽が常に地平線上にあり24時間昼（白夜） |
| `"equinox-transition"` | $-0.5^\circ \le \delta_{\deg} \le +0.5^\circ$ | 春分・秋分前後で太陽が地平線付近を周回する遷移期 |
| `"polar-night"` | $\delta_{\deg} < -0.5^\circ$ | 太陽が常に地平線下にあり24時間夜（極夜） |

### 2.5 都市の太陽高度・太陽方位角・現地地方太陽時

任意の地点（緯度 $\phi$、経度 $\lambda$、いずれもラジアン換算値）における `CityObservation` は、地方恒星時 $\text{LST}$ および太陽時角 $H$ を経由して計算する。

$$\text{LST} = \text{gmstRad} + \lambda$$

$$H = \operatorname{wrap}_{\pi}(\text{LST} - \alpha_\odot)$$

- $\text{LST}$：観測地点の地方恒星時（ラジアン）
- $H$：太陽の時角（ラジアン、$[-\pi, \pi)$ に正規化。南中時が $0$、午前が負、午後が正）

現地地方太陽時 `localSolarHours` $\in [0, 24)$（時間単位の地方視太陽時）は、$H = 0$ を正午 $12\text{h}$ として次式で算出する。

$$\text{localSolarHours} = \left(12 + \frac{H}{\pi} \cdot 12\right) \bmod 24$$

球面三角法により太陽高度角 $h$（`solarAltitudeDeg`）と太陽方位角 $A$（`solarAzimuthDeg`：北 $= 0^\circ$、東 $= 90^\circ$、南 $= 180^\circ$、西 $= 270^\circ$）を求める。各地点の East-North-Up（ENU）局所基底ベクトルとの内積から、象限ずれのない $\operatorname{atan2}$ 表記を用いる。

$$\sin h = \sin\phi \sin\delta_\odot + \cos\phi \cos\delta_\odot \cos H$$

$$h = \arcsin(\operatorname{clamp}(\sin h, -1, 1))$$

$$A_{\text{east}} = -\cos\delta_\odot \sin H$$

$$A_{\text{north}} = \cos\phi \sin\delta_\odot - \sin\phi \cos\delta_\odot \cos H$$

$$A = \operatorname{wrap}_{360}(\operatorname{radToDeg}(\operatorname{atan2}(A_{\text{east}},\; A_{\text{north}})))$$

- $h$：太陽高度角（ラジアン、度変換した値が `solarAltitudeDeg`）
- $A_{\text{east}}$：太陽方向ベクトルの局所東方向成分
- $A_{\text{north}}$：太陽方向ベクトルの局所北方向成分
- $A$：太陽方位角（度、$[0^\circ, 360^\circ)$）
- $\operatorname{clamp}(v, -1, 1)$：数値 $v$ を $[-1, 1]$ の範囲に制限する関数（浮動小数点誤差による `NaN` 防止）
- $\operatorname{wrap}_{\pi}(\theta)$：ラジアン角を $[-\pi, \pi)$ に正規化する関数
- $\operatorname{wrap}_{360}(\theta)$：度数角を $[0^\circ, 360^\circ)$ に正規化する関数

北極点（$\phi = +90^\circ$）では物理的な東西南北が定義上すべて南向きに退化する特異点となるため、上記式では $\lambda = 0^\circ$ を基準とした基準経線方向に対する角度が返る（UI 上では北極点が特異点である旨を補足表示して扱う）。

算出した `solarAltitudeDeg` および `solarAzimuthDeg` から、昼夜区分と16方位文字列を次のように決定する。

| 項目 | 規則・計算方法 | 出力例 |
|---|---|---|
| `daylightPhase` | `solarAltitudeDeg > 0`：`"day"`<br>`-6 <= solarAltitudeDeg <= 0`：`"twilight"`（常用薄明）<br>`solarAltitudeDeg < -6`：`"night"` | `"day"` / `"twilight"` / `"night"` |
| `solarDirectionJa` | $\lfloor (A + 11.25^\circ) / 22.5^\circ \rfloor \bmod 16$ を配列 `["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"]` で参照 | $112.5^\circ \to$ `"東南東"` |

### 2.6 恒星日と太陽日の差・太陽が東から昇る理由

本アプリで扱う2種類の「1日」の定義と差は以下の通りである。

| 指標 | 基準 | 自転角度 | 所要時間 |
|---|---|---|---|
| **1恒星日（Sidereal Day）** | 遠方の恒星・春分点に対して同じ向きに戻る周期 | $360^\circ$ | 約 $86{,}164.09\text{ 秒}$（約 $23\text{時間}56\text{分}04\text{秒}$） |
| **1太陽日（Mean Solar Day）** | 太陽に対して同じ子午線（南中）に戻る平均周期 | 約 $360.9856^\circ$ | $86{,}400\text{ 秒}$（$24\text{時間}00\text{分}00\text{秒}$） |

1恒星日のあいだに地球は公転軌道上を反時計回りに約 $360^\circ / 365.2422\text{ 日} \approx 0.9856^\circ$ 移動する。そのため、恒星に対して $360^\circ$ 自転しただけでは、太陽の位置が前日より約 $0.9856^\circ$ 東（反時計回り方向）へずれて見える。太陽を再び同じ子午線上に捉えるには追加で約 $0.9856^\circ$ 自転する必要があり、この追加自転に約 $235.91\text{ 秒}$（約 $3\text{分}56\text{秒}$）を要する。

また、ある都市から太陽が東から昇り西へ沈む理由は、地表における「東」の向き（経度が増える向き）が地球の自転方向（反時計回り）と一致しているためである。夜の側にある地点が自転によって東向きへ回転して昼夜の境界（夜明け線）を通過するとき、進行方向前方にあたる東の地平線側から太陽光が差し込み、正午（南中、南半球中緯度では北中）を経て、さらに東へ回転するにつれ太陽は進行方向後方の西へ傾いていく。

---

## 3. 表示・操作仕様

### 3.1 ビジュアルモード（`VisualStyle`）

| モード値 | 名称 | 表現内容 | 主な観察用途 |
|---|---|---|---|
| `"realistic"` | 宇宙リアル | 地球昼面・夜景の都市灯り・大気リムライト・海洋の鏡面反射・恒星背景を描画 | 宇宙空間から見た実際の昼夜境界と夜景の推移を観察 |
| `"diagram"` | 天文図解 | `world-atlas` と `topojson-client` による大陸輪郭・経緯線・北極圏（`66.6°N`）・昼夜境界を明快に描画 | 経度・緯度と太陽照射範囲の幾何学的関係を観察 |

### 3.2 基準フレーム（`ReferenceFrame`）

基準フレームに応じて、3D シーン内の地球自転角・太陽方向ベクトル・恒星背景の回転を次表の通り切り替える。

| フレーム値 | 名称 | 地球の Y 軸回転角 | 太陽方向ベクトル（単位） | 恒星背景・春分点の Y 軸回転角 | 特徴 |
|---|---|---|---|---|---|
| `"solar"` | 太陽方向を固定 | $\text{gmstRad} - \alpha_\odot$ | $(\cos\delta_\odot,\; \sin\delta_\odot,\; 0)$ | $-\alpha_\odot$ | 太陽が常に `+X` 側（赤緯 $\delta_\odot$ 分のみ上下に傾斜）に静止し、昼夜と季節の比較が容易 |
| `"sidereal"` | 恒星・春分点を固定 | $\text{gmstRad}$ | $(\cos\delta_\odot\cos\alpha_\odot,\; \sin\delta_\odot,\; -\cos\delta_\odot\sin\alpha_\odot)$ | $0$ | 恒星背景と春分点ラインが静止し、公転に伴う太陽移動と恒星日・太陽日の約4分差が明瞭 |

### 3.3 カメラプリセット（`CameraPreset`）と連続視点移動

| プリセット値 | 名称 | 視点位置の役割 |
|---|---|---|
| `"northPole"` | 天の北極（真上・初期値） | `+Y` 軸上空（`eclipticBlend = 0`, `pitch = 90°`）から北極点を見下ろす視点。反時計回りの自転、北極圏の白夜・極夜、経線上の時刻差を一望 |
| `"oblique"` | 斜め俯瞰 | 北半球中緯度から昼夜境界と地球全体の立体感を同時に把握する斜め視点 |
| `"eclipticNorth"` | 黄道面（真上・黄道北極） | 公転面（黄道面）の法線方向（`eclipticBlend = 1`, `pitch = 90°`）から見下ろし、公転軌道面に対する地軸23.4°の傾きを上方から確認 |
| `"eclipticPlane"` | 黄道面（水平） | 公転面（`eclipticBlend = 1`, `pitch = 0°`）の真横に降り、太陽光線の水平照射と季節ごとの地軸23.4°の傾きを確認 |

- **天の北極 ⇄ 黄道面（公転面）の連続視点移動**：`ViewTransitionWidget` および観察パネル内のスライダー（`0%`〜`100%`）により、`eclipticBlend`（`0 -> 1`）と `pitch`（`90° -> 0°`）を連動させて天の北極真上から黄道面水平視点まで無段階かつ滑らかに移動する。なお、`solar` フレーム時は常に太陽方向と水平基準を Gram-Schmidt 直交化してカメラ姿勢を決定するため、春夏秋冬のどの季節でも黄道面水平移動時に太陽が真右から水平に差し込む
- ドラッグ操作によりカメラを地球中心周りに任意方向へ周回回転し、スクロール操作でズームイン・ズームアウトを実行する
- 「天の北極」ボタンまたは「天の北極（真上）へリセット」操作により、任意の回転・ズーム状態から `"northPole"` プリセットの初期カメラ姿勢へ滑らかに復帰する

### 3.4 オーバーレイレイヤー（`DisplayLayers`）

| キー名 | 表示対象 | 観察上の役割 |
|---|---|---|
| `graticule` | 緯線・経線・赤道・北極圏（`66.6°N`）・地軸のガイド線 | 緯度帯ごとの昼夜の割合と、白夜・極夜が生じる北極圏の境界・地軸の傾きを確認 |
| `celestialCompass` | 天の北極周りの角度目盛り・反時計回り自転矢印 | 自転の向きと、1恒星日・1太陽日ステップによる回転角の違いを確認 |
| `eclipticPlane` | 公転面（黄道面）のオレンジリングおよび30°刻み目盛り | 赤道面に対して約 $23.44^\circ$ 傾いた公転面（黄道面）の立体的な位置関係を確認 |
| `terminatorGuide` | 太陽光線ベクトルと昼夜境界（ターミネーター）の強調線 | 太陽直下点方向と昼夜の切り替わり位置（日の出・日の入り境界）を強調 |
| `cities` | 都市マーカー・投影ラベル・選択都市の局所方位（N/E/S/W）ベクトル | 各地点の昼夜状態と、地表から見た東・西・南・北の向きを確認 |
| `starsAndEquinox` | 恒星背景と春分点（`♈`）の基準方向ライン | 基準フレームによる恒星・春分点の動きと太陽移動の対比を確認 |

### 3.5 時間操作と季節プリセット

- **再生 / 一時停止**：アニメーション進行の開始と停止の切り替え
- **現在時刻（「今」）への同期**：システム現在時刻（UTC）への即時同期
- **倍速設定**：
  - `1×`（実時間：1秒あたり1秒進行）
  - `60×`（1秒あたり1分進行）
  - `1800×`（1秒あたり30分進行）
  - `3600×`（1秒あたり1時間進行）
  - `14400×`（1秒あたり4時間進行）
- **恒星日 / 太陽日ステップ**：
  - `±1 恒星日`：$86{,}164.09\text{ 秒}$（約23時間56分04秒）単位の時刻進退
  - `±1 太陽日`：$86{,}400\text{ 秒}$（24時間）単位の時刻進退
- **時刻オフセット操作**：基準時刻からの時間・分単位の微調整による任意太陽時での昼夜確認
- **季節プリセット**：春分（3月20日頃）・夏至（6月21日頃）・秋分（9月22日頃）・冬至（12月21日頃）の太陽視黄経（$0^\circ / 90^\circ / 180^\circ / 270^\circ$ 付近）に対応する日時への移動

### 3.6 代表都市・北極点データ一覧（`OBSERVATION_CITIES`）

[src/data/cities.ts](../src/data/cities.ts) に定義されている観測地点一覧を以下に示す。

| `id` | 日本語名（`nameJa`） | 英語名（`nameEn`） | 地域・特徴（`regionJa`） | 緯度 `latDeg` | 経度 `lonDeg` | 標準時差 `utcOffsetHours` |
|---|---|---|---|---|---|---|
| `tokyo` | 東京 | Tokyo | 日本（東経139.7°） | `35.6762°` | `139.6503°` | `+9` |
| `london` | ロンドン | London | イギリス（経度0°付近） | `51.5072°` | `-0.1276°` | `0` |
| `new-york` | ニューヨーク | New York | アメリカ（西経74.0°） | `40.7128°` | `-74.006°` | `-5` |
| `reykjavik` | レイキャビク | Reykjavik | アイスランド（北緯64.1°） | `64.1466°` | `-21.9426°` | `0` |
| `tromso` | トロムソ | Tromsø | ノルウェー（北緯69.6°・北極圏内） | `69.6492°` | `18.9553°` | `+1` |
| `nairobi` | ナイロビ | Nairobi | ケニア（赤道付近） | `-1.2921°` | `36.8219°` | `+3` |
| `sydney` | シドニー | Sydney | オーストラリア（南緯33.9°） | `-33.8688°` | `151.2093°` | `+10` |
| `north-pole` | 北極点 | North Pole | 北緯90°（自転軸の中心） | `90°` | `0°` | `0` |

3D 空間上の各都市座標は `EarthGlobeCanvas.tsx` 内で毎フレームスクリーン座標 `(x, y)` へ投影し、HTML バッジ要素の `transform` を直接更新することで React の再描画負荷を抑えながら滑らかに追従させる。カメラから見て地球の裏側にある地点は非表示にする。また、各都市定義には UI の解説欄で表示する観察ポイント説明（`noteJa`）が含まれる。

### 3.7 インタラクティブ学習ガイド

学習ガイドでは、各テーマを選択した瞬間に推奨の日時・基準フレーム・カメラ視点・選択都市・補助レイヤー・再生設定を一括適用し、解説と連動して現象を観察する。

| 学習テーマ | 適用される状態（実装） | 観察ポイント |
|---|---|---|
| **なぜ天の北極からは反時計回り？** | 視点：`"northPole"`（真上リセット）<br>速度：`3600×` 再生 / レイヤー：`celestialCompass`・`graticule` 有効 | 北極点を中心に地球全体および本初子午線（黄色線）が反時計回りに回転する様子を確認 |
| **公転面（黄道面）と地軸23.4°の傾き** | 視点：`"eclipticPlane"` / 日時：夏至（`2026-06-21T08:24:00Z`）<br>フレーム：`"solar"` / レイヤー：`eclipticPlane`・`graticule`・`terminatorGuide` 有効 | 黄道面が水平一直線、太陽光が水平右から差し込む中で地軸が約 $23.4^\circ$ 傾いている様子を確認 |
| **夏至の白夜** | 日時：`2026-06-21T08:24:00Z`（夏至、`+23.4°`）<br>フレーム：`"solar"` / 視点：`"northPole"`<br>都市：トロムソ（`tromso`） / 速度：`1800×` 再生 | 北極圏（`66.6°N` 以北）の全域がターミネーターの昼側に含まれ、24時間太陽が沈まない状態を確認 |
| **冬至の極夜** | 日時：`2026-12-21T20:50:00Z`（冬至、`-23.4°`）<br>フレーム：`"solar"` / 視点：`"northPole"`<br>都市：トロムソ（`tromso`） / 速度：`1800×` 再生 | 北極圏（`66.6°N` 以北）の全域がターミネーターの夜側に隠れ、24時間太陽が昇らない状態を確認 |
| **なぜ太陽は東から昇り西に沈む？** | 日時：`2026-03-20T20:15:00Z`（春分付近・東京の夜明け直前）<br>フレーム：`"solar"` / 視点：`"northPole"`<br>都市：東京（`tokyo`） / 速度：`1800×` 再生 | 反時計回りの自転に伴い、地点の東（シアン矢印）が太陽側へ向かって昼の領域へ飛び込み、東から太陽が昇る仕組みを確認 |
| **恒星日（23h56m）と太陽日（24h）** | フレーム：`"sidereal"` / 視点：`"northPole"` / 一時停止<br>レイヤー：`starsAndEquinox`・`celestialCompass`・`graticule` 有効 | 春分点（紫破線）を固定した状態で「+1 恒星日」と「+1 太陽日」を押し分け、約 $0.9856^\circ$（約3分56秒）の角度差を確認 |

---

## 4. 技術構成・ファイル役割・テスト方針

### 4.1 技術スタックと実行環境

[package.json](../package.json)・[tsconfig.json](../tsconfig.json)・[vite.config.ts](../vite.config.ts)・[flake.nix](../flake.nix)・[packages.nix](../packages.nix) に定義された技術構成を以下に示す。

| 領域 | 採用技術・設定 | 用途・バージョン |
|---|---|---|
| UI フレームワーク | React / React DOM | 画面レイアウト・状態管理・コントロールパネル（`^19.1.0`） |
| 開発言語 | TypeScript | 厳格な型検査（`^5.8.3`、`strict: true`、`noUnusedLocals: true`、`noUnusedParameters: true`、`noFallthroughCasesInSwitch: true`、`resolveJsonModule: true`、`target: ES2022`） |
| 3D グラフィックス | Three.js | WebGL 3D 地球儀・カスタム GLSL シェーダー・連続軌道補間カメラ・座標投影（`^0.176.0`） |
| 地図データ | World Atlas / TopoJSON Client | 天文図解モード向け大陸輪郭ポリゴン・海岸線生成（`world-atlas` `^2.0.2`、`topojson-client` `^3.1.0`） |
| アイコン | Lucide React | 操作 UI 用アイコン（`^0.511.0`） |
| ビルド・テスト | Vite / Vitest | 開発サーバー・本番バンドル（`@vitejs/plugin-react` `^4.4.1`）、単体テスト（`vitest` `^3.1.3`、`environment: "node"`） |
| 開発・CI 環境 | Nix Flake / GitHub Actions / gitleaks | `aarch64-darwin` 向け `nodejs_22` 等の一括提供、PR 時の自動検証（`check.yml`）、コミット前秘匿情報検査（`.githooks/pre-commit`） |

### 4.2 ファイル・モジュール役割

| パス | 役割 |
|---|---|
| `index.html` | アプリケーションタイトルと `/src/main.tsx` を読み込むエントリ HTML |
| `package.json` / `package-lock.json` | npm スクリプト（`dev` / `build` / `typecheck` / `test` / `preview`）と依存関係管理 |
| `tsconfig.json` / `vite.config.ts` | TypeScript 厳格設定および Vite（チャンク分割含む）・Vitest 共通設定 |
| `flake.nix` / `packages.nix` / `flake.lock` | Nix 開発環境とツールチェーン（`nodejs_22`、`git`、`gh`、`gitleaks` 等）の定義 |
| `.githooks/pre-commit` / `.github/workflows/check.yml` | `gitleaks` コミット検査および PR 時の自動チェック（`typecheck`・`test`・`build`） |
| `src/types/astronomy.ts` | `VisualStyle`、`ReferenceFrame`、`CameraPreset`、`City`、`SolarSystemState`、`CityObservation`、`DisplayLayers` の型定義 |
| `src/data/cities.ts` | 代表7都市および北極点の定義配列 `OBSERVATION_CITIES` |
| `src/astronomy/calculations.ts` | ユリウス日、GMST、太陽位置、太陽直下点、都市観測値、季節日時プリセットの純粋関数群 |
| `src/astronomy/__tests__/calculations.test.ts` | 天文計算エンジンの単体テスト（Vitest 5件） |
| `src/scene/earthTexture.ts` | Natural Earth 50m データからの等距円筒図法テクスチャ（宇宙リアル / 天文図解 / 陸マスク・夜景ライト）生成 |
| `src/scene/shaders.ts` | 薄明表現・夜間都市灯・海洋鏡面反射・大気リムハローを描画する GLSL シェーダー |
| `src/scene/EarthGlobeCanvas.tsx` | Three.js 3D 地球儀、天の北極⇄黄道面連続カメラ補間、経緯線・黄道面リング・天球コンパス・太陽光線・都市/天球バッジ投影の統合 |
| `src/components/HeaderBar.tsx` | アプリタイトル、観測日時・太陽赤緯・北極状態テレメトリ、ビジュアルモード切替 |
| `src/components/ViewTransitionWidget.tsx` | 左上の天の北極 ⇄ 黄道面（公転面）連続視点移動スライダーおよびプリセットボタン |
| `src/components/InspectorPanel.tsx` | 「地点観測」「視点・表示」「学習ガイド」3タブの観察パネル |
| `src/components/TimeControlBar.tsx` | 再生/一時停止、現在時刻同期、倍速、1恒星日/1太陽日ステップ、1日スライダー、季節プリセット |
| `src/styles/app.css` | 宇宙テーマのダークグラス UI と重なり防止レスポンシブレイアウト |
| `src/App.tsx` / `src/main.tsx` | 全体状態管理、アニメーション進行ループ、DOM マウント処理 |

### 4.3 テスト・検証方針

テストは過剰に広げず、変更時の不具合検出に直結する必要最低限の検証項目へ絞って実施する方針とする。検証項目は [check.yml](../.github/workflows/check.yml) の CI ワークフローと一致させる。

- **天文計算の単体テスト（`npm test` / `vitest run`）**：[vite.config.ts](../vite.config.ts) の `environment: "node"` 上でブラウザ・WebGL 非依存の純粋関数のみを対象とした以下の検証
  - J2000.0 および既知日時におけるユリウス日・GMST 計算値の一致
  - 春分・夏至・秋分・冬至における太陽視黄経（$0^\circ, 90^\circ, 180^\circ, 270^\circ$ 付近）と太陽赤緯（$0^\circ, \pm 23.44^\circ$ 付近）の算出
  - 代表都市の正午・日の出・深夜における太陽高度角・太陽方位角（東 $= 90^\circ$、南 $= 180^\circ$、西 $= 270^\circ$、南半球正午 $= 0^\circ$）・昼夜区分の判定
  - 夏至・冬至・分点における北極点の `northPoleDaylightState`（`"polar-day"` / `"polar-night"` / `"equinox-transition"`）の判定
  - 1恒星日経過時の GMST $360^\circ$ 回転と 1太陽日との約 $0.9856^\circ$（約3分56秒）差の再現
- **TypeScript 型チェック（`npm run typecheck` / `tsc --noEmit`）**：`strict: true` 条件下での型定義とモジュール境界の整合性確認
- **ビルド確認（`npm run build` / `tsc --noEmit && vite build`）**：型チェック後の Vite 本番バンドル生成成功の確認
- **対象外とする過剰テスト**：Three.js の WebGL ピクセルスナップショットテストおよび網羅的 UI E2E 自動テストの除外（3D 表示は開発サーバー `npm run dev` での目視確認に限定）
