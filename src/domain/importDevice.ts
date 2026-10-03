import { toDays, ymd, type YMD } from './date';
import { makeEvent } from './events';
import type { CalEvent } from './types';

/** 端末のカレンダーから取った1件(@ebarooni/capacitor-calendar の CalendarEvent の必要な所だけ) */
export interface DeviceEvent {
  id: string;
  title: string;
  startDate: number;
  endDate: number;
  isAllDay: boolean;
  description?: string | null;
  location?: string | null;
  calendarItemExternalIdentifier?: string | null;
}

const two = (n: number) => String(n).padStart(2, '0');
function localYmd(ms: number): YMD {
  const d = new Date(ms);
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function localHm(ms: number): string {
  const d = new Date(ms);
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}
/** 終日の予定の日付は OS によって UTC 0時で来るので、UTC の暦日で読む */
function utcYmd(ms: number): YMD {
  const d = new Date(ms);
  return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * 端末の予定をこのアプリの予定に写す(コピー。端末側は書き換えない)。
 * 既に読み込んだ物(externalId が同じ)は飛ばす。繰り返しの予定は回ごとに1件になる。
 */
export function fromDevice(list: DeviceEvent[], existing: CalEvent[], now = Date.now()): CalEvent[] {
  const seen = new Set(existing.filter((e) => e.source === 'device').map((e) => e.externalId));
  const out: CalEvent[] = [];
  for (const d of list) {
    const key = `${d.calendarItemExternalIdentifier || d.id}@${d.startDate}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let date: YMD, days: number, start: string | undefined, end: string | undefined;
    if (d.isAllDay) {
      // iOS は終日をローカル0時、Android は UTC 0時で返す。端末の時差を見て合う方を使う
      const utcMidnight = new Date(d.startDate).getUTCHours() === 0 && new Date(d.startDate).getUTCMinutes() === 0;
      date = utcMidnight ? utcYmd(d.startDate) : localYmd(d.startDate);
      const endD = utcMidnight ? utcYmd(Math.max(d.startDate, d.endDate - 1)) : localYmd(Math.max(d.startDate, d.endDate - 1));
      days = Math.max(1, toDays(endD) - toDays(date) + 1);
    } else {
      date = localYmd(d.startDate);
      start = localHm(d.startDate);
      const endDay = localYmd(d.endDate);
      days = Math.max(1, toDays(endDay) - toDays(date) + 1);
      end = days === 1 && d.endDate > d.startDate ? localHm(d.endDate) : undefined;
    }
    const memo = [d.location, d.description].filter((s): s is string => !!s && !!s.trim()).join('\n');
    out.push(makeEvent({ date, days, allDay: d.isAllDay, start, end, title: d.title || '(題名なし)', memo, color: 8, source: 'device', externalId: key }, now));
  }
  return out;
}
