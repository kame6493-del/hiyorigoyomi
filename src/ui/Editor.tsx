import { useMemo, useState } from 'react';
import { addDays, formatJa, toDays, type YMD } from '../domain/date';
import { COLORS, COLOR_ORDER, detachOccurrence, endBefore, history, makeEvent, repeatLabel, skipOccurrence } from '../domain/events';
import { NOTIFY_ALLDAY, NOTIFY_TIMED } from '../domain/notify';
import { stampById } from '../domain/catalog';
import { rokuyoCached } from '../domain/lunar';
import type { AppData, CalEvent, Repeat } from '../domain/types';
import { StampGlyph } from '../App';
import { StampPicker } from './StampPicker';
import { BackIcon, BellIcon, ChevronR, ClockIcon, CloseIcon, CopyIcon, PaletteIcon, RepeatIcon, TrashIcon } from './icons';

export type EditTarget = { ev: CalEvent; occ: YMD } | { date: YMD };

type Freq = Repeat['freq'];
type Open = null | 'when' | 'color' | 'repeat';

/** くり返しの選び方(見本の「くり返し設定」の並び)。2週ごと = 毎週の2回に1回 */
const REPEAT_CHOICES: { key: string; freq: Freq; interval: number; label: string; sub: string }[] = [
  { key: 'daily', freq: 'daily', interval: 1, label: '毎日', sub: '毎日くり返す' },
  { key: 'weekly', freq: 'weekly', interval: 1, label: '毎週', sub: '毎週くり返す' },
  { key: 'weekly2', freq: 'weekly', interval: 2, label: '2週ごと', sub: '2週間ごとにくり返す' },
  { key: 'monthly', freq: 'monthly', interval: 1, label: '毎月', sub: '毎月くり返す' },
  { key: 'yearly', freq: 'yearly', interval: 1, label: '毎年', sub: '毎年くり返す' },
  { key: 'none', freq: 'none', interval: 1, label: 'くり返しなし', sub: 'この予定は1回だけ' },
];

export function Editor(p: {
  target: EditTarget;
  data: AppData;
  plus: boolean;
  recent?: string[];
  often?: string[];
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
  const [open, setOpen] = useState<Open>(null);
  const [ask, setAsk] = useState<null | 'save' | 'delete'>(null);
  const [scope, setScope] = useState<'one' | 'after' | 'all'>('one');
  const [moreHist, setMoreHist] = useState(false);
  const hist = useMemo(() => (orig ? [] : history(p.data.events, 12)), [orig, p.data.events]);

  const repeat: Repeat = freq === 'none' ? { freq: 'none' } : { freq, interval, ...(until ? { until } : {}) };
  const notifyList = allDay ? NOTIFY_ALLDAY : NOTIFY_TIMED;
  const notifyOk = notifyList.some((o) => o.v === notify) ? notify : null;
  const patch: Partial<CalEvent> = {
    title: title.trim(),
    stamp,
    color,
    days: Math.max(1, days),
    allDay,
    start: allDay ? undefined : start,
    end: allDay || !end ? undefined : end,
    memo,
    notify: notifyOk,
  };
  const empty = !patch.title && !stamp;
  const names = p.data.settings.colorNames;
  const toggle = (k: Open) => setOpen(open === k ? null : k);
  const whenLabel = `${formatJa(date).replace(/^\d+年/, '')}${days > 1 ? `から${days}日間` : ''} ${allDay ? '終日' : end ? `${start}〜${end}` : start}`;

  const replace = (fn: (evs: CalEvent[]) => CalEvent[]) => p.update((d) => ({ ...d, events: fn(d.events) }));

  const save = (sc?: 'one' | 'all') => {
    if (empty) {
      p.toast('題名かスタンプを入れてください');
      return;
    }
    const now = Date.now();
    if (!orig) {
      replace((evs) => [...evs, makeEvent({ ...patch, date, repeat, title: patch.title ?? '' }, now)]);
    } else if (!repeating) {
      replace((evs) => evs.map((e) => (e.id === orig.id ? { ...e, ...patch, date, repeat, exdates: repeat.freq === 'none' ? [] : e.exdates, updatedAt: now } : e)));
    } else if (sc === 'one') {
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

  const del = (sc: 'one' | 'after' | 'all') => {
    if (!orig) return;
    const now = Date.now();
    if (sc === 'all' || !repeating) replace((evs) => evs.filter((e) => e.id !== orig.id));
    else if (sc === 'one') replace((evs) => evs.map((e) => (e.id === orig.id ? skipOccurrence(e, occ, now) : e)));
    else {
      const cut = endBefore(orig, occ, now);
      replace((evs) => (cut ? evs.map((e) => (e.id === orig.id ? cut : e)) : evs.filter((e) => e.id !== orig.id)));
    }
    p.toast('消しました');
    p.onClose();
  };

  const onSave = () => {
    if (repeating && !empty) {
      setScope('one');
      setAsk('save');
    } else save();
  };
  const curRepeatKey = freq === 'none' ? 'none' : freq === 'weekly' && interval === 2 ? 'weekly2' : interval === 1 ? freq : '';

  return (
    <div className="screen editor" role="dialog" aria-label={orig ? '予定の編集' : '予定の追加'}>
      <header className="screen-head">
        <button className="icon-btn" onClick={p.onClose} aria-label="やめる">
          <BackIcon />
        </button>
        <div className="sh-title">
          <h2>{formatJa(date)}</h2>
          <small>{orig ? '予定の編集' : '予定の追加'} ・ {rokuyoCached(date)}</small>
        </div>
        {orig ? (
          <button className="icon-btn danger-ink" aria-label="消す" onClick={() => (repeating ? (setScope('one'), setAsk('delete')) : del('all'))}>
            <TrashIcon />
          </button>
        ) : (
          <span />
        )}
      </header>
      <div className="screen-body">
        <section className="card">
          <div className="ed-stamp-row">
            <button className="stamp-btn" onClick={() => setPicking(true)} aria-label="スタンプを選ぶ">
              {stamp ? <StampGlyph id={stamp} size="xl" /> : <span className="stamp-empty">スタンプ</span>}
            </button>
            <button className="pill-btn" onClick={() => setPicking(true)}>
              {stamp ? 'スタンプを変更' : 'スタンプを選ぶ'}
            </button>
            {stamp && <span className="ed-stamp-name">{stampById(stamp)?.label}</span>}
          </div>
          <label className="f-label" htmlFor="ed-title">
            予定のタイトル
          </label>
          <div className="input-wrap">
            <input id="ed-title" className="title-input" placeholder={stamp ? stampById(stamp)?.label : '例: 歯医者'} value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
            {title && (
              <button className="clear-btn" aria-label="題名を消す" onClick={() => setTitle('')}>
                <CloseIcon size={16} />
              </button>
            )}
          </div>
          <label className="f-label" htmlFor="ed-memo">
            メモ(任意)
          </label>
          <textarea id="ed-memo" rows={3} value={memo} maxLength={5000} placeholder="場所・持ち物・住所など" onChange={(e) => setMemo(e.target.value)} />
          <div className="counter">{memo.length}/5000</div>
        </section>

        <section className="card rows">
          <button className={`ed-row ${open === 'when' ? 'open' : ''}`} onClick={() => toggle('when')} aria-expanded={open === 'when'}>
            <ClockIcon />
            <span className="ed-row-l">日時</span>
            <span className="ed-row-v">{whenLabel}</span>
            <ChevronR size={18} />
          </button>
          {open === 'when' && (
            <div className="ed-sub">
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
            </div>
          )}

          <div className="ed-row static">
            <BellIcon />
            <span className="ed-row-l">お知らせする</span>
            <input
              type="checkbox"
              className="switch"
              aria-label="お知らせする"
              checked={notifyOk !== null}
              onChange={(e) => {
                if (!e.target.checked) return setNotify(null);
                const d = p.data.settings.defaultNotify;
                setNotify(notifyList.some((o) => o.v === d && d !== null) ? d : (notifyList[1]?.v ?? null));
              }}
            />
          </div>
          {notifyOk !== null && (
            <div className="ed-sub inline">
              <select id="ed-notify" value={String(notifyOk)} onChange={(e) => setNotify(e.target.value === '' ? null : Number(e.target.value))} aria-label="いつ知らせるか">
                {notifyList.map((o) => (
                  <option key={String(o.v)} value={o.v === null ? '' : String(o.v)}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className={`ed-row ${open === 'color' ? 'open' : ''}`} onClick={() => toggle('color')} aria-expanded={open === 'color'}>
            <PaletteIcon />
            <span className="ed-row-l">色</span>
            <span className="ed-row-v">
              <span className="color-dot" style={{ background: COLORS[color]?.hex }} />
              <span className="color-name">{names[color]}</span>
            </span>
            <ChevronR size={18} />
          </button>
          {open === 'color' && (
            <div className="ed-sub">
              <div className="colors">
                {COLOR_ORDER.map((i) => (
                  <button key={i} className={`color ${color === i ? 'on' : ''}`} onClick={() => setColor(i)} aria-label={names[i]}>
                    <span className="color-ball" style={{ background: COLORS[i].hex }} />
                    <span className="color-lbl">{names[i]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className={`ed-row ${open === 'repeat' ? 'open' : ''}`} onClick={() => toggle('repeat')} aria-expanded={open === 'repeat'}>
            <RepeatIcon />
            <span className="ed-row-l">くり返し</span>
            <span className="ed-row-v repeat-v">{freq === 'none' ? 'しない' : repeatLabel(repeat, date)}</span>
            <ChevronR size={18} />
          </button>
          {open === 'repeat' && (
            <div className="ed-sub">
              <div className="radio-list" role="radiogroup" aria-label="くり返し">
                {REPEAT_CHOICES.map((c) => (
                  <button
                    key={c.key}
                    role="radio"
                    aria-checked={curRepeatKey === c.key}
                    className={`radio-item ${curRepeatKey === c.key ? 'on' : ''}`}
                    onClick={() => {
                      setFreq(c.freq);
                      setIntervalN(c.interval);
                    }}
                  >
                    <span className="radio" />
                    <span>
                      <b>{c.label}</b>
                      <small>{c.sub}</small>
                    </span>
                  </button>
                ))}
              </div>
              {freq !== 'none' && (
                <>
                  <div className="field row">
                    <span className="label">間隔</span>
                    <select value={interval} onChange={(e) => setIntervalN(Number(e.target.value))} aria-label="間隔">
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n === 1 ? '毎回' : `${n}回に1回`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field row">
                    <label className="label" htmlFor="ed-until">
                      くり返しの終了
                    </label>
                    <input id="ed-until" type="date" value={until} min={date} onChange={(e) => setUntil(e.target.value)} />
                    {until && (
                      <button className="link" onClick={() => setUntil('')}>
                        終了しない
                      </button>
                    )}
                  </div>
                  <div className="hint repeat-hint">{repeatLabel(repeat, date)}</div>
                </>
              )}
            </div>
          )}

          {orig && (
            <button className="ed-row" onClick={() => p.onCopy({ ...orig, ...patch, title: patch.title ?? '' } as CalEvent)}>
              <CopyIcon />
              <span className="ed-row-l">この予定をほかの日にコピー</span>
              <span className="ed-row-v" />
              <ChevronR size={18} />
            </button>
          )}
        </section>

        {hist.length > 0 && (
          <section className="card">
            <div className="card-head">
              <b>最近使った入力</b>
              {hist.length > 6 && (
                <button className="link small" onClick={() => setMoreHist(!moreHist)}>
                  {moreHist ? 'たたむ' : 'もっと見る'}
                </button>
              )}
            </div>
            <div className="hist">
              {hist.slice(0, moreHist ? 12 : 6).map((h) => (
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
                  {h.stamp ? <StampGlyph id={h.stamp} size="md" /> : <span className="hist-dot" />}
                  <span className="hist-t">{h.title}</span>
                  {!h.allDay && <span className="hist-time">{h.start}</span>}
                </button>
              ))}
            </div>
          </section>
        )}
        {orig?.source === 'device' && <p className="hint pad">端末のカレンダーから写した予定です。ここで変えても端末のカレンダーは変わりません。</p>}
      </div>
      <div className="screen-foot">
        <button className="btn primary big wide" onClick={onSave}>
          保存する
        </button>
      </div>

      {ask && (
        <div className="ask-back" onClick={() => setAsk(null)}>
          <div className="ask" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={ask === 'save' ? 'くり返しの変更' : 'くり返しの削除'}>
            <p className="ask-title">{ask === 'save' ? 'この日の変更について' : 'この予定をどの範囲で消しますか?'}</p>
            <p className="ask-sub">くり返しの予定です({formatJa(occ)} の回)</p>
            {(ask === 'save'
              ? [
                  { k: 'one' as const, t: 'この日だけ変える', s: `${formatJa(occ)} の回だけ内容を変え、ほかの日はそのままにします。` },
                  { k: 'all' as const, t: 'すべての回を変える', s: '過去・これからのすべての回を同じ内容に変えます。' },
                ]
              : [
                  { k: 'one' as const, t: 'この日だけ消す', s: `${formatJa(occ)} の回だけ消し、ほかの日はそのまま残します。` },
                  { k: 'after' as const, t: 'この日から後を消す', s: `${formatJa(occ)} とそれより後の回を消します。前の回は残ります。` },
                  { k: 'all' as const, t: 'すべての回を消す', s: 'この予定のすべてのくり返しを消します。' },
                ]
            ).map((o) => (
              <button key={o.k} role="radio" aria-checked={scope === o.k} className={`radio-card ${scope === o.k ? 'on' : ''}`} onClick={() => setScope(o.k)}>
                <span className="radio" />
                <span>
                  <b>{o.t}</b>
                  <small>{o.s}</small>
                </span>
              </button>
            ))}
            <button
              className={`btn wide big ${ask === 'delete' ? 'primary danger-fill' : 'primary'}`}
              onClick={() => (ask === 'save' ? save(scope === 'all' ? 'all' : 'one') : del(scope))}
            >
              {ask === 'save' ? 'この内容で保存する' : '消す'}
            </button>
            <button className="btn wide ghost-fill" onClick={() => setAsk(null)}>
              やめる
            </button>
          </div>
        </div>
      )}
      {picking && (
        <StampPicker
          plus={p.plus}
          recent={p.recent}
          often={p.often}
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
  );
}
