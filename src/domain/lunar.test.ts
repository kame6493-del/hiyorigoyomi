import { describe, expect, test } from 'vitest';
import naoj from './fixtures/naoj.json';
import { addDays, toDays } from './date';
import { newMoonUtcMs, ROKUYO, rokuyo, sunLongitude, sunLongitudeLow, toLunar } from './lunar';

/**
 * 国立天文台 暦要項(2021〜2027)の「朔の時刻」と「中気の時刻」から、旧暦を表だけで組み立てる。
 * アプリの計算(天文の式)とは別の道筋で作った答えなので、突き合わせれば計算の誤りが分かる。
 */
const jstMs = (s: string) => Date.parse(`${s}:00+09:00`);
const dayOf = (s: string) => toDays(s.slice(0, 10));

function lunarFromTables() {
  const nm = naoj.newMoonsJst.map(dayOf);
  const ck = naoj.chukiJst.map((c) => ({ day: dayOf(c.jst), deg: c.deg }));
  type M = { start: number; end: number; chuki: number[] };
  const months: M[] = [];
  for (let i = 0; i + 1 < nm.length; i++) {
    const start = nm[i], end = nm[i + 1];
    months.push({ start, end, chuki: ck.filter((c) => c.day >= start && c.day < end).map((c) => c.deg) });
  }
  // 冬至(270度)を含む月を11月とし、次の冬至月までが13か月なら最初の中気なしの月を閏月にする
  const winters = months.map((m, i) => (m.chuki.includes(270) ? i : -1)).filter((i) => i >= 0);
  const out = new Map<number, { month: number; day: number; leap: boolean }>();
  for (let w = 0; w + 1 < winters.length; w++) {
    const a = winters[w], b = winters[w + 1];
    let m = 11, leapUsed = b - a === 12;
    for (let i = a; i < b; i++) {
      let leap = false;
      if (i > a) {
        if (!leapUsed && months[i].chuki.length === 0) { leap = true; leapUsed = true; }
        else m = (m % 12) + 1;
      }
      for (let d = months[i].start; d < months[i].end; d++) out.set(d, { month: m, day: d - months[i].start + 1, leap });
    }
  }
  return out;
}

const table = lunarFromTables();

describe('天文の式を国立天文台の時刻と照合', () => {
  test(`朔 ${naoj.newMoonsJst.length} 回の時刻が 1 分以内`, () => {
    for (const s of naoj.newMoonsJst) {
      const t = jstMs(s);
      const k = Math.round((t - Date.UTC(2000, 0, 6, 18, 14)) / (29.530588861 * 86400000));
      expect(Math.abs(newMoonUtcMs(k) - t) / 60000, s).toBeLessThan(1);
    }
  });
  test(`中気 ${naoj.chukiJst.length} 回の時刻が 1 分以内(簡易式なら十数分ずれる)`, () => {
    let worstLow = 0;
    for (const c of naoj.chukiJst) {
      const t = jstMs(c.jst);
      const diffMin = (f: (ms: number) => number) => {
        let d = f(t) - c.deg;
        if (d > 180) d -= 360;
        if (d < -180) d += 360;
        return Math.abs(d) / (360 / 365.2422 / 1440);
      };
      expect(diffMin(sunLongitude), c.jst).toBeLessThan(1);
      worstLow = Math.max(worstLow, diffMin(sunLongitudeLow));
    }
    expect(worstLow).toBeGreaterThan(5); // 簡易式では足りないことの確認(2025年の冬至は 0時03分)
  });
});

describe('旧暦と六曜を国立天文台の表から組み立てた答えと1日ずつ照合', () => {
  const days = [...table.keys()].sort((a, b) => a - b);
  test(`照合した日数 ${days.length} 日(${addDays('1970-01-01', days[0])}〜${addDays('1970-01-01', days[days.length - 1])})`, () => {
    const bad: string[] = [];
    for (const d of days) {
      const date = addDays('1970-01-01', d);
      const want = table.get(d)!;
      const got = toLunar(date);
      if (got.month !== want.month || got.day !== want.day || got.leap !== want.leap) {
        bad.push(`${date} 表=${want.leap ? '閏' : ''}${want.month}/${want.day} 計算=${got.leap ? '閏' : ''}${got.month}/${got.day}`);
      }
      if (rokuyo(date) !== ROKUYO[(want.month + want.day) % 6]) bad.push(`${date} 六曜`);
    }
    expect(bad).toEqual([]);
    expect(days.length).toBeGreaterThan(2100);
  });
  test('2026〜2027 年の六曜が表と一致(表の範囲の全日)', () => {
    let n = 0;
    for (let d = '2026-01-01'; d <= '2027-12-31'; d = addDays(d, 1)) {
      const w = table.get(toDays(d));
      if (!w) continue; // 表の範囲外(2027年末の朔以降)
      expect(rokuyo(d), d).toBe(ROKUYO[(w.month + w.day) % 6]);
      n++;
    }
    expect(n).toBe(696); // 2026-01-01〜2027-11-27(表は2027年の冬至月の手前まで)
  });
});

describe('よく知られた日', () => {
  test('旧正月は必ず先勝', () => {
    for (const d of ['2023-01-22', '2024-02-10', '2025-01-29', '2026-02-17']) {
      expect(toLunar(d)).toMatchObject({ month: 1, day: 1, leap: false });
      expect(rokuyo(d)).toBe('先勝');
    }
  });
  test('2023年は閏2月、2025年は閏6月', () => {
    expect(toLunar('2023-03-22')).toMatchObject({ month: 2, day: 1, leap: true });
    expect(toLunar('2025-07-25')).toMatchObject({ month: 6, day: 1, leap: true });
  });
  test('旧暦の年は旧正月で替わる', () => {
    expect(toLunar('2026-02-16').year).toBe(2025);
    expect(toLunar('2026-02-17').year).toBe(2026);
  });
  test('2028〜2030 年も旧暦1日は朔の日・六曜は6種が順に並ぶ', () => {
    for (let d = '2028-01-01'; d <= '2030-12-31'; d = addDays(d, 1)) {
      const l = toLunar(d);
      expect(l.day).toBeGreaterThanOrEqual(1);
      expect(l.day).toBeLessThanOrEqual(30);
      const next = toLunar(addDays(d, 1));
      if (next.day !== 1) {
        // 月の中では六曜は 先勝→友引→先負→仏滅→大安→赤口 の順に進む
        const i = ROKUYO.indexOf(rokuyo(d));
        expect(rokuyo(addDays(d, 1))).toBe(ROKUYO[(i + 1) % 6]);
      }
    }
  });
});
