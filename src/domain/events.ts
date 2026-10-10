import { addDays, daysInMonth, isLeap, parse, toDays, weekday, ymd, type YMD } from './date';
import type { AppData, CalEvent, Occurrence, Repeat, Settings } from './types';

/**
 * 予定の色。保存しているのは番号(0〜8)なので、番号の意味は前の版と同じ並び(赤→もも、橙→みかん …灰→生成り)に
 * 近い色を当てた。画面に並べる順は COLOR_ORDER(見本どおり さくら・もも・みかん…)。
 */
export const COLORS = [
  { key: 'momo', hex: '#ec9f8c', name: 'もも' },
  { key: 'mikan', hex: '#f0b073', name: 'みかん' },
  { key: 'tanpopo', hex: '#f1cf68', name: 'たんぽぽ' },
  { key: 'wakaba', hex: '#9fc58c', name: '若葉' },
  { key: 'ajisai', hex: '#a3a6e6', name: 'あじさい' },
  { key: 'sora', hex: '#8fbfe6', name: 'そら' },
  { key: 'fuji', hex: '#ad93d2', name: '藤' },
  { key: 'sakura', hex: '#efa8b2', name: 'さくら' },
  { key: 'kinari', hex: '#cfc2aa', name: '生成り' },
] as const;
/** 画面での並び(見本のデザインシステムの順) */
export const COLOR_ORDER = [7, 0, 1, 2, 3, 5, 4, 6, 8] as const;
/** 1.0 のときの既定の色の名前。名前を変えていなければ新しい名前に読み替える */
export const OLD_COLOR_NAMES = ['あか', 'だいだい', 'きいろ', 'みどり', 'あおみどり', 'あお', 'むらさき', 'ももいろ', 'はいいろ'];

export function defaultSettings(): Settings {
  return {
    weekStart: 0,
    showRokuyo: true,
    theme: 'kinari',
    colorNames: COLORS.map((c) => c.name),
    defaultNotify: null,
    digest: { on: false, time: '07:30' },
    autoBackup: false,
    onboarded: false,
  };
}

export function emptyData(): AppData {
  return { version: 1, events: [], dayMemos: {}, settings: defaultSettings() };
}

let seq = 0;
export function newId(now = Date.now()): string {
  seq = (seq + 1) % 1e6;
  return `${now.toString(36)}-${seq.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function makeEvent(p: Partial<CalEvent> & { date: YMD; title: string }, now = Date.now()): CalEvent {
  return {
    id: p.id ?? newId(now),
    date: p.date,
    days: Math.max(1, p.days ?? 1),
    allDay: p.allDay ?? !p.start,
    start: p.start,
    end: p.end,
    title: p.title,
    memo: p.memo ?? '',
    color: p.color ?? 5,
    stamp: p.stamp,
    repeat: p.repeat ?? { freq: 'none' },
    exdates: p.exdates ?? [],
    notify: p.notify ?? null,
    source: p.source,
    externalId: p.externalId,
    createdAt: p.createdAt ?? now,
    updatedAt: now,
  };
}

/** 月の 31 日など、その月に無い日はとばす(Googleカレンダー・iPhone 標準と同じ) */
function monthlyDate(y: number, m: number, d: number): YMD | null {
  return d <= daysInMonth(y, m) ? ymd(y, m, d) : null;
}

/** 繰り返しの n 回目の始まりの日(無ければ null) */
export function nthStart(ev: CalEvent, n: number): YMD | null {
  const r = ev.repeat;
  if (r.freq === 'none') return n === 0 ? ev.date : null;
  const { y, m, d } = parse(ev.date);
  const step = n * Math.max(1, r.interval);
  switch (r.freq) {
    case 'daily':
      return addDays(ev.date, step);
    case 'weekly':
      return addDays(ev.date, step * 7);
    case 'monthly': {
      const t = y * 12 + (m - 1) + step;
      return monthlyDate(Math.floor(t / 12), (t % 12) + 1, d);
    }
    case 'yearly': {
      const yy = y + step;
      if (m === 2 && d === 29 && !isLeap(yy)) return null;
      return ymd(yy, m, d);
    }
  }
}

/** n 回目が属する月の1日(その月に該当日が無いときの打ち切り判定用) */
function nominalMonth(ev: CalEvent, n: number): YMD {
  const { y, m } = parse(ev.date);
  const iv = ev.repeat.freq === 'none' ? 1 : Math.max(1, ev.repeat.interval);
  if (ev.repeat.freq === 'yearly') return ymd(y + n * iv, m, 1);
  const t = y * 12 + (m - 1) + n * iv;
  return ymd(Math.floor(t / 12), (t % 12) + 1, 1);
}

/** from〜to(両端を含む)に重なる回の始まりの日 */
export function startsInRange(ev: CalEvent, from: YMD, to: YMD): YMD[] {
  const out: YMD[] = [];
  const span = ev.days - 1;
  const earliest = addDays(from, -span);
  const r = ev.repeat;
  if (r.freq === 'none') {
    if (ev.date <= to && ev.date >= earliest) out.push(ev.date);
    return out;
  }
  if (ev.date > to) return out;
  // 範囲の近くから数え始める(何年も前の予定でも速く)
  let n = 0;
  const gap = toDays(earliest) - toDays(ev.date);
  if (gap > 0) {
    const iv = Math.max(1, r.interval);
    const per = r.freq === 'daily' ? iv : r.freq === 'weekly' ? 7 * iv : r.freq === 'monthly' ? 31 * iv : 366 * iv;
    n = Math.max(0, Math.floor(gap / per) - 1);
  }
  const ex = new Set(ev.exdates);
  for (let guard = 0; guard < 5000; guard++, n++) {
    const s = nthStart(ev, n);
    if (s === null) {
      // その月・年に無い日。monthly/yearly はとばして続ける
      if (r.freq === 'monthly' || r.freq === 'yearly') {
        if (nominalMonth(ev, n) > to) break;
        continue;
      }
      break;
    }
    if (s > to) break;
    if (r.until && s > r.until) break;
    if (s >= earliest && !ex.has(s)) out.push(s);
  }
  return out;
}

/** 表示する日ごとの回(複数日の予定は各日に1つずつ) */
export function occurrencesInRange(events: CalEvent[], from: YMD, to: YMD): Map<YMD, Occurrence[]> {
  const map = new Map<YMD, Occurrence[]>();
  for (const ev of events) {
    for (const s of startsInRange(ev, from, to)) {
      for (let i = 0; i < ev.days; i++) {
        const day = addDays(s, i);
        if (day < from || day > to) continue;
        const list = map.get(day) ?? [];
        list.push({ ev, date: s, day });
        map.set(day, list);
      }
    }
  }
  for (const list of map.values()) list.sort(compareOcc);
  return map;
}

export function compareOcc(a: Occurrence, b: Occurrence): number {
  // 終日 → 時刻順 → 作った順
  const ka = a.ev.allDay ? '' : a.ev.start ?? '';
  const kb = b.ev.allDay ? '' : b.ev.start ?? '';
  if (ka !== kb) return ka < kb ? -1 : 1;
  return a.ev.createdAt - b.ev.createdAt;
}

// ---- 予定のコピー・移動・繰り返しの扱い ----

/** 予定を別の日へコピー(繰り返しは外して1回きりにする。旧Yahoo!カレンダーの「コピー」と同じ) */
export function copyTo(ev: CalEvent, date: YMD, now = Date.now()): CalEvent {
  return makeEvent({ ...ev, id: undefined, date, repeat: { freq: 'none' }, exdates: [], source: undefined, externalId: undefined, createdAt: undefined }, now);
}

/** 1回きりの予定を別の日へ動かす */
export function moveTo(ev: CalEvent, date: YMD, now = Date.now()): CalEvent {
  return { ...ev, date, updatedAt: now };
}

/** 繰り返しのうちこの回だけを消す */
export function skipOccurrence(ev: CalEvent, date: YMD, now = Date.now()): CalEvent {
  return { ...ev, exdates: [...new Set([...ev.exdates, date])].sort(), updatedAt: now };
}

/** この回以降を消す(最初の回なら丸ごと消す=null) */
export function endBefore(ev: CalEvent, date: YMD, now = Date.now()): CalEvent | null {
  if (ev.repeat.freq === 'none' || date <= ev.date) return null;
  return { ...ev, repeat: { ...ev.repeat, until: addDays(date, -1) } as Repeat, updatedAt: now };
}

/** この回だけ書き換える: 元の繰り返しからこの日を外し、1回きりの予定を足す */
export function detachOccurrence(ev: CalEvent, date: YMD, patch: Partial<CalEvent>, now = Date.now()): [CalEvent, CalEvent] {
  const rest = skipOccurrence(ev, date, now);
  const one = makeEvent({ ...ev, ...patch, id: undefined, date: patch.date ?? date, repeat: { freq: 'none' }, exdates: [], createdAt: undefined }, now);
  return [rest, one];
}

// ---- 履歴から入力 ----

export interface HistoryItem {
  title: string;
  stamp?: string;
  color: number;
  allDay: boolean;
  start?: string;
  end?: string;
  count: number;
  last: number;
}

/** よく使う予定(同じ題名をまとめ、新しく使った順。同じ時刻の予定を何度も入れる人向け) */
export function history(events: CalEvent[], limit = 12): HistoryItem[] {
  const m = new Map<string, HistoryItem>();
  for (const e of events) {
    const key = e.title.trim();
    if (!key) continue;
    const cur = m.get(key);
    if (!cur || e.updatedAt > cur.last) {
      m.set(key, { title: key, stamp: e.stamp, color: e.color, allDay: e.allDay, start: e.start, end: e.end, count: (cur?.count ?? 0) + 1, last: e.updatedAt });
    } else cur.count++;
  }
  return [...m.values()].sort((a, b) => b.last - a.last).slice(0, limit);
}

// ---- 検索 ----

export interface SearchHit {
  kind: 'event' | 'memo';
  date: YMD;
  ev?: CalEvent;
  text: string;
}

/** ひらがな/カタカナ・全角/半角・大小を同じに見る */
export function normalizeText(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/**
 * 過去も未来も探す。繰り返しの予定は、今日から前後2年の回のうち最も近い過去の回と次の回を出す。
 * 並びは新しい日付が上(「前回の通院はいつ?」にすぐ答えられるように)。
 */
export function search(data: AppData, q: string, todayYmd: YMD, stampName: (id: string) => string = () => ''): SearchHit[] {
  const nq = normalizeText(q.trim());
  if (!nq) return [];
  const hits: SearchHit[] = [];
  for (const ev of data.events) {
    const hay = normalizeText(`${ev.title} ${ev.memo} ${ev.stamp ? stampName(ev.stamp) : ''}`);
    if (!hay.includes(nq)) continue;
    if (ev.repeat.freq === 'none') {
      hits.push({ kind: 'event', date: ev.date, ev, text: ev.title });
    } else {
      const starts = startsInRange(ev, addDays(todayYmd, -730), addDays(todayYmd, 730));
      const past = starts.filter((s) => s <= todayYmd).slice(-1);
      const next = starts.filter((s) => s > todayYmd).slice(0, 1);
      for (const s of [...past, ...next]) hits.push({ kind: 'event', date: s, ev, text: ev.title });
    }
  }
  for (const [date, memo] of Object.entries(data.dayMemos)) {
    if (memo && normalizeText(memo).includes(nq)) hits.push({ kind: 'memo', date, text: memo });
  }
  return hits.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

// ---- 保存データの読み込み(バックアップからの復元にも使う) ----

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function cleanEvent(x: unknown): CalEvent | null {
  if (!x || typeof x !== 'object') return null;
  const e = x as Record<string, unknown>;
  if (typeof e.date !== 'string' || !YMD_RE.test(e.date)) return null;
  if (typeof e.title !== 'string') return null;
  const r = e.repeat as Repeat | undefined;
  const freqs = ['daily', 'weekly', 'monthly', 'yearly'];
  const repeat: Repeat =
    r && typeof r === 'object' && freqs.includes((r as { freq: string }).freq)
      ? {
          freq: (r as { freq: 'daily' }).freq,
          interval: Math.max(1, Math.min(99, Number((r as { interval?: number }).interval) || 1)),
          ...(typeof (r as { until?: string }).until === 'string' && YMD_RE.test((r as { until: string }).until) ? { until: (r as { until: string }).until } : {}),
        }
      : { freq: 'none' };
  const start = typeof e.start === 'string' && HHMM.test(e.start) ? e.start : undefined;
  const end = typeof e.end === 'string' && HHMM.test(e.end) ? e.end : undefined;
  return {
    id: typeof e.id === 'string' && e.id ? e.id : newId(),
    date: e.date,
    days: Math.max(1, Math.min(366, Math.floor(Number(e.days) || 1))),
    allDay: !start,
    start,
    end: start ? end : undefined,
    title: e.title.slice(0, 200),
    memo: typeof e.memo === 'string' ? e.memo.slice(0, 5000) : '',
    color: Math.max(0, Math.min(COLORS.length - 1, Math.floor(Number(e.color) || 0))),
    stamp: typeof e.stamp === 'string' ? e.stamp : undefined,
    repeat,
    exdates: Array.isArray(e.exdates) ? e.exdates.filter((d): d is string => typeof d === 'string' && YMD_RE.test(d)) : [],
    notify: typeof e.notify === 'number' && Number.isFinite(e.notify) ? e.notify : null,
    source: e.source === 'device' ? 'device' : undefined,
    externalId: typeof e.externalId === 'string' ? e.externalId : undefined,
    createdAt: Number(e.createdAt) || Date.now(),
    updatedAt: Number(e.updatedAt) || Date.now(),
  };
}

export function normalize(x: unknown): AppData {
  const base = emptyData();
  if (!x || typeof x !== 'object') return base;
  const o = x as Record<string, unknown>;
  const events = Array.isArray(o.events) ? o.events.map(cleanEvent).filter((e): e is CalEvent => e !== null) : [];
  const dayMemos: Record<string, string> = {};
  if (o.dayMemos && typeof o.dayMemos === 'object') {
    for (const [k, v] of Object.entries(o.dayMemos as Record<string, unknown>)) if (YMD_RE.test(k) && typeof v === 'string' && v) dayMemos[k] = v.slice(0, 5000);
  }
  const s = (o.settings ?? {}) as Partial<Settings>;
  const settings: Settings = {
    ...base.settings,
    weekStart: s.weekStart === 1 ? 1 : 0,
    showRokuyo: s.showRokuyo !== false,
    theme: typeof s.theme === 'string' ? s.theme : base.settings.theme,
    colorNames:
      Array.isArray(s.colorNames) && s.colorNames.length === COLORS.length
        ? s.colorNames.map((n, i) => (typeof n === 'string' && n.trim() && n !== OLD_COLOR_NAMES[i] ? n.slice(0, 12) : COLORS[i].name))
        : base.settings.colorNames,
    defaultNotify: typeof s.defaultNotify === 'number' ? s.defaultNotify : null,
    digest: s.digest && typeof s.digest === 'object' && HHMM.test(String(s.digest.time)) ? { on: Boolean(s.digest.on), time: s.digest.time } : base.settings.digest,
    autoBackup: Boolean(s.autoBackup),
    lastAutoBackup: typeof s.lastAutoBackup === 'string' ? s.lastAutoBackup : undefined,
    onboarded: Boolean(s.onboarded),
  };
  return { version: 1, events, dayMemos, settings };
}

/** 2つのデータを合わせる(バックアップの「追加で読み込む」)。同じ id は新しい方を残す */
export function merge(a: AppData, b: AppData): AppData {
  const m = new Map(a.events.map((e) => [e.id, e]));
  for (const e of b.events) {
    const cur = m.get(e.id);
    if (!cur || e.updatedAt > cur.updatedAt) m.set(e.id, e);
  }
  const memos = { ...a.dayMemos };
  for (const [k, v] of Object.entries(b.dayMemos)) {
    if (!memos[k]) memos[k] = v;
    else if (!memos[k].includes(v)) memos[k] = `${memos[k]}\n${v}`;
  }
  return { ...a, events: [...m.values()], dayMemos: memos };
}

export function backupFileName(d: YMD): string {
  return `hiyorigoyomi-backup-${d}.json`;
}

/** 曜日の表記つきの時刻(一覧表示用) */
export function timeLabel(ev: CalEvent): string {
  if (ev.allDay) return ev.days > 1 ? `${ev.days}日間` : '終日';
  return ev.end ? `${ev.start}〜${ev.end}` : `${ev.start}`;
}

export function repeatLabel(r: Repeat, date: YMD): string {
  if (r.freq === 'none') return '';
  const iv = r.interval > 1 ? `${r.interval}` : '';
  const { m, d } = parse(date);
  const wd = '日月火水木金土'[weekday(date)];
  const base =
    r.freq === 'daily' ? (iv ? `${iv}日ごと` : '毎日')
    : r.freq === 'weekly' ? (iv ? `${iv}週ごとの${wd}曜` : `毎週${wd}曜`)
    : r.freq === 'monthly' ? (iv ? `${iv}か月ごとの${d}日` : `毎月${d}日`)
    : iv ? `${iv}年ごとの${m}月${d}日` : `毎年${m}月${d}日`;
  return r.until ? `${base}(${r.until.replace(/-/g, '/')}まで)` : base;
}
