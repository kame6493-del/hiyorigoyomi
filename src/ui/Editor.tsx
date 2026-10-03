import { useMemo, useState } from 'react';
import { addDays, formatJa, toDays, type YMD } from '../domain/date';
import { COLORS, detachOccurrence, endBefore, history, makeEvent, repeatLabel, skipOccurrence } from '../domain/events';
import { NOTIFY_ALLDAY, NOTIFY_TIMED } from '../domain/notify';
import { stampById } from '../domain/catalog';
import type { AppData, CalEvent, Repeat } from '../domain/types';
import { StampGlyph } from '../App';
import { StampPicker } from './StampPicker';

export type EditTarget = { ev: CalEvent; occ: YMD } | { date: YMD };

type Freq = Repeat['freq'];

export function Editor(p: {
  target: EditTarget;
  data: AppData;
  plus: boolean;
  onClose: () => void;
  update: (fn: (d: AppData) => AppData) => void;
  onPaywall: () => void;
  onCopy: (ev: CalEvent) => void;
  toast: (s: string) => void;
}) {
  const orig = 'ev' in p.target ? p.target.ev : null;
  const occ = 'ev' in p.target ? p.target.occ : p.target.date;
  const repeating = !!orig && orig.repeat.freq !== 'none';

  const [title, setTitle] = useState(orig?.title ?? '');
  const [stamp, setStamp] = useState<string | undefined>(orig?.stamp);
  const [color, setColor] = useState(orig?.color ?? 5);
  const [date, setDate] = useState<YMD>(occ);
  const [days, setDays] = useState(orig?.days ?? 1);
  const [allDay, setAllDay] = useState(orig ? orig.allDay : true);
  const [start, setStart] = useState(orig?.start ?? '10:00');
  const [end, setEnd] = useState(orig?.end ?? '');
  const [freq, setFreq] = useState<Freq>(orig?.repeat.freq ?? 'none');
  const [interval, setIntervalN] = useState(orig && orig.repeat.freq !== 'none' ? orig.repeat.interval : 1);
  const [until, setUntil] = useState(orig && orig.repeat.freq !== 'none' ? orig.repeat.until ?? '' : '');
  const [notify, setNotify] = useState<number | null>(orig ? orig.notify : p.data.settings.defaultNotify);
  const [memo, setMemo] = useState(orig?.memo ?? '');
  const [picking, setPicking] = useState(false);
  const [ask, setAsk] = useState<null | 'save' | 'delete'>(null);
  const hist = useMemo(() => (orig ? [] : history(p.data.events, 10)), [orig, p.data.events]);

  const repeat: Repeat = freq === 'none' ? { freq: 'none' } : { freq, interval, ...(until ? { until } : {}) };
  const notifyList = allDay ? NOTIFY_ALLDAY : NOTIFY_TIMED;
  const patch: Partial<CalEvent> = {
    title: title.trim(),
    stamp,
    color,
    days: Math.max(1, days),
    allDay,
    start: allDay ? undefined : start,
    end: allDay || !end ? undefined : end,
    memo,
    notify: notifyList.some((o) => o.v === notify) ? notify : null,
  };
  const empty = !patch.title && !stamp;

  const replace = (fn: (evs: CalEvent[]) => CalEvent[]) => p.update((d) => ({ ...d, events: fn(d.events) }));

  const save = (scope?: 'one' | 'all') => {
    if (empty) {
      p.toast('題名かスタンプを入れてください');
      return;
    }
    const now = Date.now();
    if (!orig) {
      replace((evs) => [...evs, makeEvent({ ...patch, date, repeat, title: patch.title ?? '' }, now)]);
    } else if (!repeating) {
      replace((evs) => evs.map((e) => (e.id === orig.id ? { ...e, ...patch, date, repeat, exdates: repeat.freq === 'none' ? [] : e.exdates, updatedAt: now } : e)));
    } else if (scope === 'one') {
      const [rest, one] = detachOccurrence(orig, occ, { ...patch, date }, now);
      replace((evs) => [...evs.map((e) => (e.id === orig.id ? rest : e)), one]);
    } else {
      // すべての回: 日付を動かしたら最初の回も同じだけ動かす
      const shift = toDays(date) - toDays(occ);
      replace((evs) => evs.map((e) => (e.id === orig.id ? { ...e, ...patch, date: addDays(e.date, shift), repeat, updatedAt: now } : e)));
    }
    p.toast('保存しました');
    p.onClose();
  };

  const del = (scope: 'one' | 'after' | 'all') => {
    if (!orig) return;
    const now = Date.now();
    if (scope === 'all' || !repeating) replace((evs) => evs.filter((e) => e.id !== orig.id));
    else if (scope === 'one') replace((evs) => evs.map((e) => (e.id === orig.id ? skipOccurrence(e, occ, now) : e)));
    else {
      const cut = endBefore(orig, occ, now);
      replace((evs) => (cut ? evs.map((e) => (e.id === orig.id ? cut : e)) : evs.filter((e) => e.id !== orig.id)));
    }
    p.toast('消しました');
    p.onClose();
  };

  return (
    <div className="sheet-back" onClick={p.onClose}>
      <div className="sheet editor" role="dialog" aria-label={orig ? '予定の編集' : '予定の追加'} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link" onClick={p.onClose}>
            やめる
          </button>
          <h2>{orig ? '予定の編集' : '予定の追加'}</h2>
          <button className="link strong" onClick={() => (repeating ? setAsk('save') : save())}>
            保存
          </button>
        </div>
        <div className="sheet-body">
          {hist.length > 0 && (
            <div className="field">
              <div className="label">よく使う予定から入れる</div>
              <div className="hist">
                {hist.map((h) => (
                  <button
                    key={h.title}
                    className="hist-chip"
                    style={{ ['--c' as string]: COLORS[h.color]?.hex }}
                    onClick={() => {
                      setTitle(h.title);
                      setStamp(h.stamp);
                      setColor(h.color);
                      setAllDay(h.allDay);
                      if (h.start) setStart(h.start);
                      setEnd(h.end ?? '');
                    }}
                  >
                    {h.stamp && <StampGlyph id={h.stamp} />}
                    {h.title}
                    {!h.allDay && <span className="hist-time">{h.start}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="title-row">
            <button className="stamp-btn" onClick={() => setPicking(true)} aria-label="スタンプを選ぶ">
              {stamp ? <StampGlyph id={stamp} size="lg" /> : <span className="stamp-empty">スタンプ</span>}
            </button>
            <input className="title-input" placeholder={stamp ? stampById(stamp)?.label : '題名(例: 歯医者)'} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <div className="label">色</div>
            <div className="colors">
              {COLORS.map((c, i) => (
                <button key={c.key} className={`color ${color === i ? 'on' : ''}`} style={{ background: c.hex }} onClick={() => setColor(i)} aria-label={p.data.settings.colorNames[i]}>
                  {color === i && <span className="color-name">{p.data.settings.colorNames[i]}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="field row">
            <label className="label" htmlFor="ed-date">
              日付
            </label>
            <input id="ed-date" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="何日間">
              {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? '1日' : `${n}日間`}
                </option>
              ))}
            </select>
          </div>
          <div className="field row">
            <span className="label">時刻</span>
            <div className="seg">
              <button className={allDay ? 'on' : ''} onClick={() => { setAllDay(true); setNotify(null); }}>
                終日
              </button>
              <button className={!allDay ? 'on' : ''} onClick={() => { setAllDay(false); setNotify(null); }}>
                時刻を決める
              </button>
            </div>
          </div>
          {!allDay && (
            <div className="field row">
              <span className="label" />
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} aria-label="始まり" />
              <span>〜</span>
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} aria-label="終わり" />
            </div>
          )}
          <div className="field row">
            <label className="label" htmlFor="ed-repeat">
              くり返し
            </label>
            <select id="ed-repeat" value={freq} onChange={(e) => setFreq(e.target.value as Freq)}>
              <option value="none">しない</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
              <option value="yearly">毎年</option>
            </select>
            {freq !== 'none' && (
              <select value={interval} onChange={(e) => setIntervalN(Number(e.target.value))} aria-label="間隔">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? '毎回' : `${n}回に1回`}
                  </option>
                ))}
              </select>
            )}
          </div>
          {freq !== 'none' && (
            <div className="field row">
              <label className="label" htmlFor="ed-until">
                終わり
              </label>
              <input id="ed-until" type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} />
              {until && (
                <button className="link" onClick={() => setUntil('')}>
                  決めない
                </button>
              )}
              <div className="hint wide">{repeatLabel(repeat, date)}</div>
            </div>
          )}
          <div className="field row">
            <label className="label" htmlFor="ed-notify">
              お知らせ
            </label>
            <select id="ed-notify" value={notify === null ? '' : String(notify)} onChange={(e) => setNotify(e.target.value === '' ? null : Number(e.target.value))}>
              {notifyList.map((o) => (
                <option key={String(o.v)} value={o.v === null ? '' : String(o.v)}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="ed-memo">
              メモ
            </label>
            <textarea id="ed-memo" rows={3} value={memo} placeholder="場所・持ち物・住所など" onChange={(e) => setMemo(e.target.value)} />
          </div>
          {orig && (
            <div className="editor-actions">
              <button className="btn ghost" onClick={() => p.onCopy({ ...orig, ...patch, title: patch.title ?? '' } as CalEvent)}>
                ほかの日にコピー
              </button>
              <button className="btn danger" onClick={() => (repeating ? setAsk('delete') : del('all'))}>
                消す
              </button>
            </div>
          )}
          {orig?.source === 'device' && <p className="hint">端末のカレンダーから写した予定です。ここで変えても端末のカレンダーは変わりません。</p>}
        </div>
        {ask && (
          <div className="ask-back" onClick={() => setAsk(null)}>
            <div className="ask" onClick={(e) => e.stopPropagation()}>
              <p>
                くり返しの予定です。{formatJa(occ)} の回を
                {ask === 'save' ? 'どう変えますか?' : 'どう消しますか?'}
              </p>
              {ask === 'save' ? (
                <>
                  <button className="btn wide" onClick={() => save('one')}>
                    この日だけ変える
                  </button>
                  <button className="btn wide primary" onClick={() => save('all')}>
                    すべての回を変える
                  </button>
                </>
              ) : (
                <>
                  <button className="btn wide" onClick={() => del('one')}>
                    この日だけ消す
                  </button>
                  <button className="btn wide" onClick={() => del('after')}>
                    この日から後を消す
                  </button>
                  <button className="btn wide danger" onClick={() => del('all')}>
                    すべての回を消す
                  </button>
                </>
              )}
              <button className="link" onClick={() => setAsk(null)}>
                やめる
              </button>
            </div>
          </div>
        )}
        {picking && (
          <StampPicker
            plus={p.plus}
            selected={stamp}
            onClose={() => setPicking(false)}
            onPick={(id) => {
              setStamp(id);
              setPicking(false);
            }}
            onClear={() => {
              setStamp(undefined);
              setPicking(false);
            }}
            onPaywall={p.onPaywall}
          />
        )}
      </div>
    </div>
  );
}
