/**
 * 国民の祝日(国民の祝日に関する法律 昭和23年法律第178号 と 内閣府の公表に基づく規則)を端末内で計算する。
 * 対象は 1980〜2099 年。春分日・秋分日は前年2月の官報(暦要項)で正式に決まるため、
 * 2028 年以降は国立天文台の予測と同じ近似式による見込み(isProvisional で判定できる)。
 *
 * 照合: src/domain/holidays.test.ts で内閣府 CSV(1980〜2027 の全日)と国立天文台の予測(2028〜2030)に合わせている。
 */
import { addDays, nthWeekday, weekday, ymd, type YMD } from './date';

/** 春分日(1980〜2099 で使える近似式。国立天文台の予測表と 2020〜2050 で一致することをテストで確認) */
export function vernalEquinoxDay(y: number): number {
  return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
}
export function autumnalEquinoxDay(y: number): number {
  return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
}

/** 正式に決まっている最後の年(内閣府が公表済みの年)。これより後の春分・秋分は見込み */
export const OFFICIAL_UNTIL = 2027;
export function isProvisional(y: number): boolean {
  return y > OFFICIAL_UNTIL;
}

/** 法律で直接決まる祝日(振替休日・国民の休日を除く) */
function baseHolidays(y: number): Map<YMD, string> {
  const h = new Map<YMD, string>();
  const add = (d: YMD, n: string) => h.set(d, n);

  add(ymd(y, 1, 1), '元日');
  add(y >= 2000 ? nthWeekday(y, 1, 2, 1) : ymd(y, 1, 15), '成人の日');
  add(ymd(y, 2, 11), '建国記念の日');
  if (y >= 2020) add(ymd(y, 2, 23), '天皇誕生日');
  add(ymd(y, 3, vernalEquinoxDay(y)), '春分の日');
  add(ymd(y, 4, 29), y <= 1988 ? '天皇誕生日' : y <= 2006 ? 'みどりの日' : '昭和の日');
  add(ymd(y, 5, 3), '憲法記念日');
  if (y >= 2007) add(ymd(y, 5, 4), 'みどりの日');
  add(ymd(y, 5, 5), 'こどもの日');
  // 海の日
  if (y === 2020) add(ymd(y, 7, 23), '海の日');
  else if (y === 2021) add(ymd(y, 7, 22), '海の日');
  else if (y >= 2003) add(nthWeekday(y, 7, 3, 1), '海の日');
  else if (y >= 1996) add(ymd(y, 7, 20), '海の日');
  // 山の日
  if (y === 2020) add(ymd(y, 8, 10), '山の日');
  else if (y === 2021) add(ymd(y, 8, 8), '山の日');
  else if (y >= 2016) add(ymd(y, 8, 11), '山の日');
  // 敬老の日
  add(y >= 2003 ? nthWeekday(y, 9, 3, 1) : ymd(y, 9, 15), '敬老の日');
  add(ymd(y, 9, autumnalEquinoxDay(y)), '秋分の日');
  // 体育の日 / スポーツの日
  if (y === 2020) add(ymd(y, 7, 24), 'スポーツの日');
  else if (y === 2021) add(ymd(y, 7, 23), 'スポーツの日');
  else if (y >= 2020) add(nthWeekday(y, 10, 2, 1), 'スポーツの日');
  else if (y >= 2000) add(nthWeekday(y, 10, 2, 1), '体育の日');
  else add(ymd(y, 10, 10), '体育の日');
  add(ymd(y, 11, 3), '文化の日');
  add(ymd(y, 11, 23), '勤労感謝の日');
  if (y >= 1989 && y <= 2018) add(ymd(y, 12, 23), '天皇誕生日');

  // 一度きりの祝日(皇室の行事。それぞれの特例法で定められた日)
  if (y === 1989) add('1989-02-24', '大喪の礼');
  if (y === 1990) add('1990-11-12', '即位礼正殿の儀');
  if (y === 1993) add('1993-06-09', '結婚の儀');
  if (y === 2019) {
    add('2019-05-01', '天皇の即位の日');
    add('2019-10-22', '即位礼正殿の儀の行われる日');
  }
  return h;
}

const cache = new Map<number, Map<YMD, string>>();

/** その年の祝日・休日の一覧(日付→名前)。振替休日と国民の休日を含む */
export function holidaysOfYear(y: number): Map<YMD, string> {
  const hit = cache.get(y);
  if (hit) return hit;
  const base = baseHolidays(y);
  const all = new Map(base);
  // 振替休日(第3条第2項)。2007 年からは「次の祝日でない日」、それより前は翌日(月曜)
  for (const d of [...base.keys()].sort()) {
    if (weekday(d) !== 0) continue;
    let n = addDays(d, 1);
    if (y >= 2007) while (all.has(n)) n = addDays(n, 1);
    else if (all.has(n)) continue;
    all.set(n, '振替休日');
  }
  // 国民の休日(第3条第3項): 前日と翌日が祝日で、その日が祝日でない日。1986 年から
  if (y >= 1986) {
    for (const d of [...base.keys()].sort()) {
      const mid = addDays(d, 1);
      const next = addDays(d, 2);
      if (base.has(next) && !all.has(mid) && weekday(mid) !== 0) all.set(mid, '国民の休日');
    }
  }
  // 2019 年の 4/30・5/2 は特例法による休日(上の規則でも出るが名前を揃える)
  const sorted = new Map([...all.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
  cache.set(y, sorted);
  return sorted;
}

/** その日の祝日名(祝日でなければ null) */
export function holidayName(d: YMD): string | null {
  return holidaysOfYear(Number(d.slice(0, 4))).get(d) ?? null;
}
