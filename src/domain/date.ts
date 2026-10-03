/** 日付は 'YYYY-MM-DD' の文字列で持つ(時差の影響を受けないように、計算は UTC の暦日で行う) */
export type YMD = string;

export function ymd(y: number, m: number, d: number): YMD {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parse(s: YMD): { y: number; m: number; d: number } {
  return { y: Number(s.slice(0, 4)), m: Number(s.slice(5, 7)), d: Number(s.slice(8, 10)) };
}

/** 1970-01-01 からの日数 */
export function toDays(s: YMD): number {
  const { y, m, d } = parse(s);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function fromDays(n: number): YMD {
  const t = new Date(n * 86400000);
  return ymd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function addDays(s: YMD, n: number): YMD {
  return fromDays(toDays(s) + n);
}

/** 0=日 … 6=土 */
export function weekday(s: YMD): number {
  return ((toDays(s) % 7) + 7 + 4) % 7; // 1970-01-01 は木曜
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** その月の第 n 回目の曜日(wd: 0=日) */
export function nthWeekday(y: number, m: number, n: number, wd: number): YMD {
  const first = weekday(ymd(y, m, 1));
  const d = 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
  return ymd(y, m, d);
}

export function addMonths(y: number, m: number, n: number): { y: number; m: number } {
  const t = y * 12 + (m - 1) + n;
  return { y: Math.floor(t / 12), m: (t % 12 + 12) % 12 + 1 };
}

/** 端末の今日(ローカル時刻) */
export function today(now: Date = new Date()): YMD {
  return ymd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const WEEK_JA = ['日', '月', '火', '水', '木', '金', '土'];

/** 月表示の 6 週ぶんの日付(weekStart: 0=日曜始まり 1=月曜始まり) */
export function monthGrid(y: number, m: number, weekStart: 0 | 1 = 0): YMD[] {
  const first = ymd(y, m, 1);
  const off = (weekday(first) - weekStart + 7) % 7;
  const start = addDays(first, -off);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function formatJa(s: YMD, withWeek = true): string {
  const { y, m, d } = parse(s);
  return `${y}年${m}月${d}日` + (withWeek ? `(${WEEK_JA[weekday(s)]})` : '');
}
