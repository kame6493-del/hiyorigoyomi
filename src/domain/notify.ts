import { addDays, parse, today, type YMD } from './date';
import { occurrencesInRange, startsInRange } from './events';
import { stampById } from './catalog';
import type { AppData, CalEvent } from './types';

/** 通知の選び方。分で表す。終日の予定は「その日の0時」から数える(-480 = 当日の朝8時, 240 = 前日の夜8時) */
export const NOTIFY_TIMED: { v: number | null; label: string }[] = [
  { v: null, label: 'なし' },
  { v: 0, label: '始まる時刻' },
  { v: 10, label: '10分前' },
  { v: 30, label: '30分前' },
  { v: 60, label: '1時間前' },
  { v: 1440, label: '前の日の同じ時刻' },
];
export const NOTIFY_ALLDAY: { v: number | null; label: string }[] = [
  { v: null, label: 'なし' },
  { v: -480, label: '当日の朝8時' },
  { v: -420, label: '当日の朝7時' },
  { v: 240, label: '前の日の夜8時' },
];

export function notifyLabel(ev: CalEvent): string {
  const list = ev.allDay ? NOTIFY_ALLDAY : NOTIFY_TIMED;
  return list.find((o) => o.v === ev.notify)?.label ?? (ev.notify === null ? 'なし' : `${ev.notify}分前`);
}

export interface Planned {
  id: number;
  at: number; // 端末の時刻(ms)
  title: string;
  body: string;
}

/** 端末のローカル時刻で y-m-d hh:mm のミリ秒 */
export function localMs(d: YMD, hhmm = '00:00'): number {
  const { y, m, d: dd } = parse(d);
  const [h, mi] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, dd, h, mi).getTime();
}

const MAX = 60; // iOS は予約できる通知が64件まで

/**
 * これから daysAhead 日の通知を作る。古い順に最大 60 件。
 * digest(今日の予定のまとめ)はプラスのときだけ、予定がある日にだけ出す。
 */
export function planNotifications(data: AppData, now: number, plus: boolean, daysAhead = 30): Planned[] {
  const from = today(new Date(now));
  const to = addDays(from, daysAhead);
  const out: Omit<Planned, 'id'>[] = [];
  for (const ev of data.events) {
    if (ev.notify === null) continue;
    for (const s of startsInRange(ev, addDays(from, -1), addDays(to, 1))) {
      const startMs = ev.allDay ? localMs(s) : localMs(s, ev.start);
      const at = startMs - ev.notify * 60000;
      if (at <= now || at > localMs(to, '23:59')) continue;
      const st = stampById(ev.stamp);
      const when = ev.allDay ? `${Number(s.slice(5, 7))}/${Number(s.slice(8))}` : `${Number(s.slice(5, 7))}/${Number(s.slice(8))} ${ev.start}`;
      out.push({ at, title: `${st?.kind === 'emoji' ? st.glyph + ' ' : ''}${ev.title || st?.label || '予定'}`, body: `${when}${ev.memo ? ' ・ ' + ev.memo.split('\n')[0].slice(0, 40) : ''}` });
    }
  }
  if (plus && data.settings.digest.on) {
    const occ = occurrencesInRange(data.events, from, to);
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const list = occ.get(d);
      if (!list?.length) continue;
      const at = localMs(d, data.settings.digest.time);
      if (at <= now) continue;
      const lines = list.slice(0, 4).map((o) => `${o.ev.allDay ? '' : o.ev.start + ' '}${o.ev.title || stampById(o.ev.stamp)?.label || '予定'}`);
      out.push({ at, title: `今日の予定 ${list.length}件`, body: lines.join(' / ') + (list.length > 4 ? ` ほか${list.length - 4}件` : '') });
    }
  }
  out.sort((a, b) => a.at - b.at);
  return out.slice(0, MAX).map((p, i) => ({ id: 1000 + i, ...p }));
}
