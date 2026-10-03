import { useEffect, useMemo, useRef, useState } from 'react';
import { formatJa, today } from '../domain/date';
import { COLORS, search, timeLabel } from '../domain/events';
import { stampById, stampLabel } from '../domain/catalog';
import { rokuyoCached } from '../domain/lunar';
import type { AppData } from '../domain/types';
import { StampGlyph } from '../App';

export function SearchPage(p: { data: AppData; onClose: () => void; onPick: (d: string) => void }) {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const t = today();
  const hits = useMemo(() => search(p.data, q, t, stampLabel), [p.data, q, t]);
  const past = hits.filter((h) => h.date <= t);
  const future = hits.filter((h) => h.date > t);

  return (
    <div className="page search-page">
      <header className="page-head">
        <button className="link" onClick={p.onClose}>
          ‹ もどる
        </button>
        <h2>予定をさがす</h2>
        <span />
      </header>
      <div className="search-box">
        <input ref={ref} type="search" placeholder="題名・メモ・スタンプの名前" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!q && <p className="hint pad">過去の予定もさがせます。「歯医者」と入れると、前に行った日と次の予約が並びます。</p>}
      {q && hits.length === 0 && <p className="hint pad">見つかりませんでした</p>}
      {future.length > 0 && <h3 className="sec">これから</h3>}
      <ul className="hits">
        {[...future].reverse().map((h, i) => (
          <Hit key={'f' + i} h={h} onPick={p.onPick} />
        ))}
      </ul>
      {past.length > 0 && <h3 className="sec">これまで(新しい順)</h3>}
      <ul className="hits">
        {past.map((h, i) => (
          <Hit key={'p' + i} h={h} onPick={p.onPick} />
        ))}
      </ul>
    </div>
  );
}

function Hit({ h, onPick }: { h: ReturnType<typeof search>[number]; onPick: (d: string) => void }) {
  const st = stampById(h.ev?.stamp);
  return (
    <li>
      <button className="hit" onClick={() => onPick(h.date)} style={{ ['--c' as string]: h.ev ? COLORS[h.ev.color]?.hex : 'var(--sub)' }}>
        <span className="hit-date">
          {formatJa(h.date)} <span className="rk">{rokuyoCached(h.date)}</span>
        </span>
        <span className="hit-main">
          {st && <StampGlyph id={st.id} />}
          <span className="hit-title">{h.kind === 'memo' ? `メモ: ${h.text.split('\n')[0]}` : h.text || st?.label}</span>
          {h.ev && <span className="hit-time">{timeLabel(h.ev)}</span>}
        </span>
        {h.ev?.memo && <span className="hit-memo">{h.ev.memo.split('\n')[0]}</span>}
      </button>
    </li>
  );
}
