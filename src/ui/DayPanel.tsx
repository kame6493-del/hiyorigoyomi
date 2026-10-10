import { useEffect, useMemo, useState } from 'react';
import { formatJa, type YMD } from '../domain/date';
import { holidayName } from '../domain/holidays';
import { rokuyoCached, toLunar } from '../domain/lunar';
import { COLORS, occurrencesInRange, timeLabel } from '../domain/events';
import { stampById } from '../domain/catalog';
import type { AppData, CalEvent } from '../domain/types';
import { StampGlyph } from '../App';
import { ChevronL, ChevronR, CopyIcon, PencilIcon } from './icons';

/** はじめの1枚におすすめするスタンプ(どれも無料) */
const STARTERS = ['t-hayaban', 't-kyuryo', 'e-hospital', 'e-birthday'];

export function DayPanel(p: {
  data: AppData;
  day: YMD;
  /** まだ何も無いとき: おすすめのスタンプを出す */
  start: boolean;
  onStartStamp: (id: string) => void;
  onPickStamp: () => void;
  onEdit: (ev: CalEvent, occ: YMD) => void;
  onMemo: (text: string) => void;
  onCopy: (ev: CalEvent) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const list = useMemo(() => occurrencesInRange(p.data.events, p.day, p.day).get(p.day) ?? [], [p.data.events, p.day]);
  const hol = holidayName(p.day);
  const lunar = toLunar(p.day);
  const [memo, setMemo] = useState(p.data.dayMemos[p.day] ?? '');
  useEffect(() => setMemo(p.data.dayMemos[p.day] ?? ''), [p.day, p.data.dayMemos]);

  if (p.start)
    return (
      <section className="day-panel start-card" aria-label="はじめのスタンプ">
        <p className="start-q">こんなスタンプからはじめてみませんか?</p>
        <div className="start-stamps">
          {STARTERS.map((id) => (
            <button key={id} className="start-stamp" onClick={() => p.onStartStamp(id)} aria-label={stampById(id)?.label}>
              <span className="st-face">
                <StampGlyph id={id} size="lg" />
              </span>
              <span>{stampById(id)?.label}</span>
            </button>
          ))}
        </div>
        <button className="btn outline wide" onClick={p.onPickStamp}>
          スタンプを選ぶ
          <ChevronR size={18} />
        </button>
      </section>
    );

  return (
    <section className="day-panel" aria-label="この日の予定">
      <div className="dp-head">
        <button className="round-btn sm" aria-label="前の日" onClick={p.onPrev}>
          <ChevronL size={18} />
        </button>
        <div className="dp-date">
          <div className="dp-main">{formatJa(p.day)}</div>
          <div className="dp-sub">
            {hol && <span className="dp-hol">{hol}</span>}
            <span>{rokuyoCached(p.day)}</span>
            <span>
              旧暦 {lunar.leap ? '閏' : ''}
              {lunar.month}月{lunar.day}日
            </span>
          </div>
        </div>
        <button className="round-btn sm" aria-label="次の日" onClick={p.onNext}>
          <ChevronR size={18} />
        </button>
      </div>
      <div className="dp-body">
        {list.length === 0 && <p className="dp-empty">予定はありません。下の「予定追加」か、スタンプで入れられます</p>}
        <ul className="dp-list">
          {list.map((o, i) => {
            const st = stampById(o.ev.stamp);
            return (
              <li key={o.ev.id + i} className="dp-item" style={{ ['--c' as string]: COLORS[o.ev.color]?.hex }}>
                <button className="dp-item-main" onClick={() => p.onEdit(o.ev, o.date)}>
                  <span className="dp-face">{st ? <StampGlyph id={st.id} size="md" /> : <span className="dp-dot" />}</span>
                  <span className="dp-text">
                    <span className="dp-title">
                      {o.ev.title || st?.label}
                      {o.ev.repeat.freq !== 'none' && <span className="badge">くり返し</span>}
                      {o.ev.source === 'device' && <span className="badge">端末から</span>}
                    </span>
                    <span className="dp-time">{timeLabel(o.ev)}</span>
                  </span>
                </button>
                <button className="dp-copy" onClick={() => p.onCopy(o.ev)} aria-label="ほかの日にコピー">
                  <CopyIcon size={18} />
                  コピー
                </button>
              </li>
            );
          })}
        </ul>
        <label className="dp-note">
          <span className="dp-note-h">
            <PencilIcon size={16} /> この日のメモ
          </span>
          <textarea
            className="dp-memo"
            placeholder="買う物・持ち物・体調など"
            value={memo}
            rows={2}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => memo !== (p.data.dayMemos[p.day] ?? '') && p.onMemo(memo)}
          />
        </label>
      </div>
    </section>
  );
}
