/**
 * 旧暦(天保暦の決め方)と六曜を端末内で計算する。
 * - 朔(新月)の時刻: J. Meeus『Astronomical Algorithms』第49章の式(誤差は数十秒)
 * - 太陽の視黄経: 同 第25章の式 + 主な摂動項
 * - 日付は日本時間(UTC+9)。朔の日をその月の1日とし、冬至を含む月を11月、中気を含まない月を閏月とする
 * 照合: src/domain/lunar.test.ts で国立天文台の暦要項(2023〜2027 の朔・中気)と1日ずつ突き合わせている。
 */
import { fromDays, toDays, type YMD } from './date';

const RAD = Math.PI / 180;
const sin = (deg: number) => Math.sin(deg * RAD);
const norm = (deg: number) => ((deg % 360) + 360) % 360;

/** 地球時(TT)と世界時(UT)の差 ΔT(秒)。NASA(Espenak & Meeus)の多項式 */
export function deltaT(year: number): number {
  const t = year - 2000;
  if (year >= 2005 && year < 2050) return 62.92 + 0.32217 * t + 0.005589 * t * t;
  if (year >= 1986 && year < 2005)
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  if (year >= 2050 && year < 2150) return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
  if (year >= 1961 && year < 1986) {
    const u = year - 1975;
    return 45.45 + 1.067 * u - u * u / 260 - u ** 3 / 718;
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}

/** ユリウス日(TT)→ UTC のミリ秒 */
function jdeToUtcMs(jde: number): number {
  const approxYear = 2000 + (jde - 2451545) / 365.25;
  return (jde - 2440587.5) * 86400000 - deltaT(approxYear) * 1000;
}
function utcMsToJde(ms: number): number {
  const approxYear = 1970 + ms / (365.25 * 86400000);
  return (ms + deltaT(approxYear) * 1000) / 86400000 + 2440587.5;
}

/** k 番目(2000-01-06 の朔が k=0)の朔の時刻(UTC ミリ秒) */
export function newMoonUtcMs(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const M = norm(2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3);
  const Mp = norm(201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4);
  const F = norm(160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4);
  const O = norm(124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3);
  jde +=
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(O) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp);
  const A = [
    [299.77 + 0.107408 * k - 0.009173 * T2, 0.000325],
    [251.88 + 0.016321 * k, 0.000165],
    [251.83 + 26.651886 * k, 0.000164],
    [349.42 + 36.412478 * k, 0.000126],
    [84.66 + 18.206239 * k, 0.00011],
    [141.74 + 53.303771 * k, 0.000062],
    [207.14 + 2.453732 * k, 0.00006],
    [154.84 + 7.30686 * k, 0.000056],
    [34.52 + 27.261239 * k, 0.000047],
    [207.19 + 0.121824 * k, 0.000042],
    [291.34 + 1.844379 * k, 0.00004],
    [161.72 + 24.198154 * k, 0.000037],
    [239.56 + 25.513099 * k, 0.000035],
    [331.55 + 3.592518 * k, 0.000023],
  ];
  for (const [arg, c] of A) jde += c * sin(norm(arg));
  return jdeToUtcMs(jde);
}

/** 太陽の視黄経(度)・簡易式(Meeus 第25章。誤差 約0.01度=十数分)。照合テストで精密式との差を見るために残す */
export function sunLongitudeLow(ms: number): number {
  const T = (utcMsToJde(ms) - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
    (0.019993 - 0.000101 * T) * sin(2 * M) +
    0.000289 * sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  return norm(L0 + C - 0.00569 - 0.00478 * sin(omega));
}

// 地球の日心黄経 VSOP87(Meeus 付録III の主要項)。[振幅(1e-8 rad), 位相, 周波数]
const VL0: number[][] = [
  [175347046, 0, 0], [3341656, 4.6692568, 6283.07585], [34894, 4.6261, 12566.1517], [3497, 2.7441, 5753.3849],
  [3418, 2.8289, 3.5231], [3136, 3.6277, 77713.7715], [2676, 4.4181, 7860.4194], [2343, 6.1352, 3930.2097],
  [1324, 0.7425, 11506.7698], [1273, 2.0371, 529.691], [1199, 1.1096, 1577.3435], [990, 5.233, 5884.927],
  [902, 2.045, 26.298], [857, 3.508, 398.149], [780, 1.179, 5223.694], [753, 2.533, 5507.553],
  [505, 4.583, 18849.228], [492, 4.205, 775.523], [357, 2.92, 0.067], [317, 5.849, 11790.629],
  [284, 1.899, 796.298], [271, 0.315, 10977.079], [243, 0.345, 5486.778], [206, 4.806, 2544.314],
  [205, 1.869, 5573.143], [202, 2.458, 6069.777], [156, 0.833, 213.299], [132, 3.411, 2942.463],
  [126, 1.083, 20.775], [115, 0.645, 0.98], [103, 0.636, 4694.003], [102, 0.976, 15720.839],
  [102, 4.267, 7.114], [99, 6.21, 2146.17], [98, 0.68, 155.42], [86, 5.98, 161000.69],
  [85, 1.3, 6275.96], [85, 3.67, 71430.7], [80, 1.81, 17260.15], [79, 3.04, 12036.46],
  [75, 1.76, 5088.63], [74, 3.5, 3154.69], [74, 4.68, 801.82], [70, 0.83, 9437.76],
  [62, 3.98, 8827.39], [61, 1.82, 7084.9], [57, 2.78, 6286.6], [56, 4.39, 14143.5],
  [56, 3.47, 6279.55], [52, 0.19, 12139.55], [52, 1.33, 1748.02], [51, 0.28, 5856.48],
  [49, 0.49, 1194.45], [41, 5.37, 8429.24], [41, 2.4, 19651.05], [39, 6.17, 10447.39],
  [37, 6.04, 10213.29], [37, 2.57, 1059.38], [36, 1.71, 2352.87], [36, 1.78, 6812.77],
  [33, 0.59, 17789.85], [30, 0.44, 83996.85], [30, 2.74, 1349.87], [25, 3.16, 4690.48],
];
const VL1: number[][] = [
  [628331966747, 0, 0], [206059, 2.678235, 6283.07585], [4303, 2.6351, 12566.1517], [425, 1.59, 3.523],
  [119, 5.796, 26.298], [109, 2.966, 1577.344], [93, 2.59, 18849.23], [72, 1.14, 529.69], [68, 1.87, 398.15],
  [67, 4.41, 5507.55], [59, 2.89, 5223.69], [56, 2.17, 155.42], [45, 0.4, 796.3], [36, 0.47, 775.52],
  [29, 2.65, 7.11], [21, 5.34, 0.98], [19, 1.85, 5486.78], [19, 4.97, 213.3], [17, 2.99, 6275.96],
  [16, 0.03, 2544.31], [16, 1.43, 2146.17], [15, 1.21, 10977.08], [12, 2.83, 1748.02], [12, 3.26, 5088.63],
  [12, 5.27, 1194.45], [12, 2.08, 4694], [11, 0.77, 553.57], [10, 1.3, 6286.6], [10, 4.24, 1349.87],
  [9, 2.7, 242.73], [9, 5.64, 951.72], [8, 5.3, 2352.87], [6, 2.65, 9437.76], [6, 4.67, 4690.48],
];
const VL2: number[][] = [
  [52919, 0, 0], [8720, 1.0721, 6283.0758], [309, 0.867, 12566.152], [27, 0.05, 3.52], [16, 5.19, 26.3],
  [16, 3.68, 155.42], [10, 0.76, 18849.23], [9, 2.06, 77713.77], [7, 0.83, 775.52], [5, 4.66, 1577.34],
  [4, 1.03, 7.11], [4, 3.44, 5573.14], [3, 5.14, 796.3], [3, 6.05, 5507.55], [3, 1.19, 242.73],
  [3, 6.12, 529.69], [3, 0.31, 398.15], [3, 2.28, 553.57], [2, 4.38, 5223.69], [2, 3.75, 0.98],
];
const VL3: number[][] = [[289, 5.844, 6283.076], [35, 0, 0], [17, 5.49, 12566.15], [3, 5.2, 155.42], [1, 4.72, 3.52], [1, 5.3, 18849.23], [1, 5.97, 242.73]];
const VL4: number[][] = [[114, 3.142, 0], [8, 4.13, 6283.08], [1, 3.84, 12566.15]];
const VL5: number[][] = [[1, 3.14, 0]];

function series(terms: number[][], tau: number): number {
  let s = 0;
  for (const [a, b, c] of terms) s += a * Math.cos(b + c * tau);
  return s;
}

/** 太陽の視黄経(度)。引数は UTC ミリ秒。VSOP87 主要項 + 章動 + 光行差(誤差 1分角程度 → 時刻で1〜2分) */
export function sunLongitude(ms: number): number {
  const T = (utcMsToJde(ms) - 2451545) / 36525;
  const tau = T / 10;
  const L =
    (series(VL0, tau) + series(VL1, tau) * tau + series(VL2, tau) * tau ** 2 +
      series(VL3, tau) * tau ** 3 + series(VL4, tau) * tau ** 4 + series(VL5, tau) * tau ** 5) / 1e8;
  let lon = norm((L * 180) / Math.PI + 180);
  // FK5 への補正
  lon -= 0.09033 / 3600;
  // 章動(黄経)
  const omega = 125.04452 - 1934.136261 * T;
  const Ls = 280.4665 + 36000.7698 * T;
  const Lm = 218.3165 + 481267.8813 * T;
  const dpsi = -17.2 * sin(omega) - 1.32 * sin(2 * Ls) - 0.23 * sin(2 * Lm) + 0.21 * sin(2 * omega);
  // 光行差(地球-太陽の距離で割る)
  const M = 357.52911 + 35999.05029 * T;
  const R = 1.000140 - 0.016708 * Math.cos(M * RAD) - 0.000141 * Math.cos(2 * M * RAD);
  lon += (dpsi - 20.4898 / R) / 3600;
  return norm(lon);
}

const JST = 9 * 3600000;
/** UTC ミリ秒 → 日本時間の暦日(1970-01-01 からの日数) */
export function jstDay(ms: number): number {
  return Math.floor((ms + JST) / 86400000);
}
/** 日本時間の暦日 d の 0 時(UTC ミリ秒) */
function jstMidnight(d: number): number {
  return d * 86400000 - JST;
}

/** その日(日本時間)以前で最も近い朔の k */
function kAtOrBefore(day: number): number {
  let k = Math.floor((day * 86400000 - Date.UTC(2000, 0, 6, 18, 14)) / (29.530588861 * 86400000));
  while (jstDay(newMoonUtcMs(k + 1)) <= day) k++;
  while (jstDay(newMoonUtcMs(k)) > day) k--;
  return k;
}

/** 朔日 d0 から次の朔日 d1 の前日までの月に含まれる中気の番号(0=春分 … 30度ごと)。無ければ -1 */
function chukiIn(d0: number, d1: number): number {
  const a = sunLongitude(jstMidnight(d0));
  const b = sunLongitude(jstMidnight(d1));
  const ia = Math.floor(a / 30);
  const ib = Math.floor(b / 30);
  return ia === ib ? -1 : ib; // 1か月に太陽が進むのは約29度なので、越える境目は高々1つ
}

export type LunarDate = { year: number; month: number; day: number; leap: boolean };

type LMonth = { start: number; month: number; leap: boolean };

const spanCache = new Map<number, LMonth[]>();

/** 冬至を含む月(11月)を起点に、次の冬至を含む月の手前までの月の並び */
function monthsFromWinter(kStart: number): LMonth[] {
  const hit = spanCache.get(kStart);
  if (hit) return hit;
  const starts: number[] = [];
  const chuki: number[] = [];
  // 次の冬至月が見つかるまで並べる(最大14か月)
  for (let i = 0; i < 15; i++) {
    const d0 = jstDay(newMoonUtcMs(kStart + i));
    const d1 = jstDay(newMoonUtcMs(kStart + i + 1));
    starts.push(d0);
    chuki.push(chukiIn(d0, d1));
    if (i > 0 && chuki[i] === 9) break; // 270度 = 冬至
  }
  const n = starts.length - 1; // 11月 から 次の11月の前月までの月数(12 か 13)
  const out: LMonth[] = [];
  let m = 11;
  let leapUsed = n === 12; // 12か月なら閏月なし
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      if (!leapUsed && chuki[i] === -1) {
        leapUsed = true;
        out.push({ start: starts[i], month: m, leap: true });
        continue;
      }
      m = (m % 12) + 1;
    }
    out.push({ start: starts[i], month: m, leap: false });
  }
  spanCache.set(kStart, out);
  return out;
}

/** k が冬至を含む月かどうか */
function isWinterMonth(k: number): boolean {
  return chukiIn(jstDay(newMoonUtcMs(k)), jstDay(newMoonUtcMs(k + 1))) === 9;
}

/** 新暦の日付 → 旧暦 */
export function toLunar(date: YMD): LunarDate {
  const day = toDays(date);
  const k = kAtOrBefore(day);
  // 起点の冬至月を探す(高々13か月前)
  let kw = k;
  while (!isWinterMonth(kw)) kw--;
  const months = monthsFromWinter(kw);
  let cur = months[0];
  for (const mo of months) if (mo.start <= day) cur = mo;
  const greg = fromDays(cur.start);
  // 旧暦の年: 11月・12月は前の年の続き(新暦の年でなく旧暦の正月で年が替わる)
  let year = Number(greg.slice(0, 4));
  if (cur.month >= 11 && Number(greg.slice(5, 7)) <= 2) year -= 1;
  if (cur.month <= 2 && Number(greg.slice(5, 7)) >= 11) year += 1;
  return { year, month: cur.month, day: day - cur.start + 1, leap: cur.leap };
}

export const ROKUYO = ['大安', '赤口', '先勝', '友引', '先負', '仏滅'] as const;
export type Rokuyo = (typeof ROKUYO)[number];

/** 六曜: (旧暦の月 + 日) を 6 で割った余り */
export function rokuyo(date: YMD): Rokuyo {
  const l = toLunar(date);
  return ROKUYO[(l.month + l.day) % 6];
}

const rokuyoCache = new Map<YMD, Rokuyo>();
export function rokuyoCached(date: YMD): Rokuyo {
  let r = rokuyoCache.get(date);
  if (!r) {
    r = rokuyo(date);
    rokuyoCache.set(date, r);
  }
  return r;
}
