import { describe, expect, test } from 'vitest';
import cao from './fixtures/holidays_cao.json';
import { addDays, ymd } from './date';
import { autumnalEquinoxDay, holidayName, holidaysOfYear, isProvisional, vernalEquinoxDay } from './holidays';

/** 内閣府 CSV の名前と、このアプリの表示名を同じ物として扱う対応 */
function sameName(app: string, official: string): boolean {
  if (official === '休日') return app === '振替休日' || app === '国民の休日';
  if (official === '休日（祝日扱い）') return app === '天皇の即位の日' || app === '即位礼正殿の儀の行われる日';
  if (official === '体育の日（スポーツの日）') return app === '体育の日';
  return app === official;
}

const official = cao.holidays as Record<string, string>;

describe('内閣府「国民の祝日」CSV(1980〜2027)と全日照合', () => {
  for (let y = 1980; y <= 2027; y++) {
    test(`${y}年`, () => {
      const mine = holidaysOfYear(y);
      const theirs = Object.entries(official).filter(([d]) => d.startsWith(`${y}-`));
      // 公式にある日は全部あって、名前も合う
      for (const [d, name] of theirs) {
        expect(mine.get(d), `${d} ${name}`).toBeDefined();
        expect(sameName(mine.get(d)!, name), `${d} 公式=${name} アプリ=${mine.get(d)}`).toBe(true);
      }
      // 公式に無い日を祝日にしていない
      expect([...mine.keys()].filter((d) => !(d in official))).toEqual([]);
    });
  }
});

/**
 * 2028〜2030 年は内閣府がまだ公表していない(前年2月に公表)。
 * 祝日法の日付と、国立天文台「何年後かの春分の日・秋分の日はわかるの?」(https://www.nao.ac.jp/faq/a0301.html)の
 * 予測表から手で書き起こした一覧と照合する。
 */
const EXPECTED_2028_2030: Record<number, string[]> = {
  2028: [
    '01-01 元日', '01-10 成人の日', '02-11 建国記念の日', '02-23 天皇誕生日', '03-20 春分の日', '04-29 昭和の日',
    '05-03 憲法記念日', '05-04 みどりの日', '05-05 こどもの日', '07-17 海の日', '08-11 山の日', '09-18 敬老の日',
    '09-22 秋分の日', '10-09 スポーツの日', '11-03 文化の日', '11-23 勤労感謝の日',
  ],
  2029: [
    '01-01 元日', '01-08 成人の日', '02-11 建国記念の日', '02-12 振替休日', '02-23 天皇誕生日', '03-20 春分の日',
    '04-29 昭和の日', '04-30 振替休日', '05-03 憲法記念日', '05-04 みどりの日', '05-05 こどもの日', '07-16 海の日',
    '08-11 山の日', '09-17 敬老の日', '09-23 秋分の日', '09-24 振替休日', '10-08 スポーツの日', '11-03 文化の日',
    '11-23 勤労感謝の日',
  ],
  2030: [
    '01-01 元日', '01-14 成人の日', '02-11 建国記念の日', '02-23 天皇誕生日', '03-20 春分の日', '04-29 昭和の日',
    '05-03 憲法記念日', '05-04 みどりの日', '05-05 こどもの日', '05-06 振替休日', '07-15 海の日', '08-11 山の日',
    '08-12 振替休日', '09-16 敬老の日', '09-23 秋分の日', '10-14 スポーツの日', '11-03 文化の日', '11-04 振替休日',
    '11-23 勤労感謝の日',
  ],
};

describe('2028〜2030 年(祝日法 + 国立天文台の春分・秋分の予測)', () => {
  for (const y of [2028, 2029, 2030]) {
    test(`${y}年`, () => {
      const mine = [...holidaysOfYear(y).entries()].map(([d, n]) => `${d.slice(5)} ${n}`);
      expect(mine).toEqual(EXPECTED_2028_2030[y]);
      expect(isProvisional(y)).toBe(true);
    });
  }
});

describe('2026〜2030 年の照合件数', () => {
  test('5年分すべての日(1826日)で祝日かどうかが公式・予測と一致', () => {
    let checked = 0;
    for (let d = '2026-01-01'; d <= '2030-12-31'; d = addDays(d, 1)) {
      const y = Number(d.slice(0, 4));
      const want = y <= 2027 ? official[d] ?? null : (EXPECTED_2028_2030[y].find((s) => s.startsWith(d.slice(5))) ?? null);
      const got = holidayName(d);
      expect(got !== null, d).toBe(want !== null);
      checked++;
    }
    expect(checked).toBe(1826);
  });
});

describe('春分・秋分の近似式は国立天文台の予測表(2020〜2050)と一致', () => {
  // https://www.nao.ac.jp/faq/a0301.html 表1
  const NAOJ: [number, number, number][] = [
    [2020, 20, 22], [2021, 20, 23], [2022, 21, 23], [2023, 21, 23], [2024, 20, 22], [2025, 20, 23], [2026, 20, 23],
    [2027, 21, 23], [2028, 20, 22], [2029, 20, 23], [2030, 20, 23], [2031, 21, 23], [2032, 20, 22], [2033, 20, 23],
    [2034, 20, 23], [2035, 21, 23], [2036, 20, 22], [2037, 20, 23], [2038, 20, 23], [2039, 21, 23], [2040, 20, 22],
    [2041, 20, 23], [2042, 20, 23], [2043, 21, 23], [2044, 20, 22], [2045, 20, 22], [2046, 20, 23], [2047, 21, 23],
    [2048, 20, 22], [2049, 20, 22], [2050, 20, 23],
  ];
  for (const [y, s, a] of NAOJ) {
    test(`${y}`, () => {
      expect(vernalEquinoxDay(y)).toBe(s);
      expect(autumnalEquinoxDay(y)).toBe(a);
    });
  }
});

test('よく聞かれる日', () => {
  expect(holidayName('2026-09-22')).toBe('国民の休日'); // 敬老の日と秋分の日に挟まれた日
  expect(holidayName('2026-05-06')).toBe('振替休日'); // 5/3(日)の振替が 5/4・5/5 を越えて 5/6
  expect(holidayName('2027-03-22')).toBe('振替休日');
  expect(holidayName(ymd(2026, 12, 23))).toBeNull(); // 平成の天皇誕生日は今は平日
  expect(holidayName('2026-10-03')).toBeNull();
});
