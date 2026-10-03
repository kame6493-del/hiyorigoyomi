import { useEffect, useMemo, useState } from 'react';
import { formatJa, type YMD } from '../domain/date';
import { holidayName } from '../domain/holidays';
import { rokuyoCached, toLunar } from '../domain/lunar';
import { COLORS, occurrencesInRange, timeLabel } from '../domain/events';
import { stampById } from '../domain/catalog';
import type { AppData, CalEvent } from '../domain/types';
import { StampGlyph } from '../App';

export function DayPanel(p: {
  data: AppData;
  day: YMD;
  onEdit: (ev: CalEvent, occ: YMD) => void;
  onAdd: () => void;
  onStampMode: () => void;
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

  return (
    <section className="day-panel" aria-label="この日の予定">
      <div className="dp-head">
        <button className="icon-btn" aria-label="前の日" onClick={p.onPrev}>
          ‹
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
        <button className="icon-btn" aria-label="次の日" onClick={p.onNext}>
          ›
        </button>
      </div>
      <div className="dp-body">
        {list.length === 0 && <p className="dp-empty">予定はありません</p>}
        <ul className="dp-list">
          {list.map((o, i) => {
            const st = stampById(o.ev.stamp);
            return (
              <li key={o.ev.id + i} className="dp-item" style={{ ['--c' as string]: COLORS[o.ev.color]?.hex }}>
                <button className="dp-item-main" onClick={() => p.onEdit(o.ev, o.date)}>
                  <span className="dp-time">{timeLabel(o.ev)}</span>
                  {st && <StampGlyph id={st.id} size="md" />}
                  <span className="dp-title">
                    {o.ev.title || st?.label}
                    {o.ev.repeat.freq !== 'none' && <span className="badge">くり返し</span>}
                    {o.ev.source === 'device' && <span className="badge">端末から</span>}
                  </span>
                </button>
                <button className="dp-copy" onClick={() => p.onCopy(o.ev)} aria-label="ほかの日にコピー">
                  コピー
                </button>
              </li>
            );
          })}
        </ul>
        <textarea
          className="dp-memo"
          placeholder="この日のメモ(買う物・持ち物・体調など)"
          value={memo}
          rows={2}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={() => memo !== (p.data.dayMemos[p.day] ?? '') && p.onMemo(memo)}
        />
      </div>
      <div className="dp-actions">
        <button className="btn ghost" onClick={p.onStampMode}>
          スタンプを押す
        </button>
        <button className="btn primary" onClick={p.onAdd}>
          ＋ 予定を追加
        </button>
      </div>
    </section>
  );
}
