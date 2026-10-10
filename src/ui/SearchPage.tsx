import { useEffect, useMemo, useRef, useState } from 'react';
import { formatJa, today } from '../domain/date';
import { COLORS, history, search, timeLabel } from '../domain/events';
import { stampById, stampLabel } from '../domain/catalog';
import { rokuyoCached } from '../domain/lunar';
import type { AppData } from '../domain/types';
import { StampGlyph } from '../App';
import { BackIcon, ChevronR, PencilIcon, SearchIcon } from './icons';

type Filter = 'all' | 'event' | 'memo';

export function SearchPage(p: { data: AppData; onClose: () => void; onPick: (d: string) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const t = today();
  const all = useMemo(() => search(p.data, q, t, stampLabel), [p.data, q, t]);
  const hits = all.filter((h) => filter === 'all' || h.kind === filter);
  const past = hits.filter((h) => h.date <= t);
  const future = hits.filter((h) => h.date > t);
  const words = useMemo(() => history(p.data.events, 10).map((h) => h.title), [p.data.events]);

  return (
    <div className="page search-page">
      <header className="page-head">
        <button className="icon-btn" onClick={p.onClose} aria-label="もどる">
          <BackIcon />
        </button>
        <h2>予定をさがす</h2>
        <span />
      </header>
      <div className="search-box">
        <SearchIcon size={20} />
        <input ref={ref} type="search" placeholder="予定・メモ・スタンプの名前" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="filters" role="tablist" aria-label="さがす物">
        {(
          [
            ['all', 'すべて'],
            ['event', '予定'],
            ['memo', 'メモ'],
          ] as [Filter, string][]
        ).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      {!q && (
        <>
          {words.length > 0 && (
            <section className="card kw-card">
              <b className="card-title">よく入れる予定</b>
              <div className="kw">
                {words.map((w) => (
                  <button key={w} onClick={() => setQ(w)}>
                    {w}
                  </button>
                ))}
              </div>
            </section>
          )}
          <p className="hint pad">過去の予定もさがせます。「歯医者」と入れると、前に行った日と次の予約が並びます。</p>
        </>
      )}
      {q && hits.length === 0 && <p className="hint pad">見つかりませんでした</p>}
      {q && hits.length > 0 && (
        <div className="res-head">
          <b>検索結果</b> <span>{hits.length}件</span>
        </div>
      )}
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
        <span className="hit-face">{st ? <StampGlyph id={st.id} size="lg" /> : h.kind === 'memo' ? <PencilIcon size={22} /> : <span className="dp-dot" />}</span>
        <span className="hit-body">
          <span className="hit-date">
            {formatJa(h.date)} <span className="rk">{rokuyoCached(h.date)}</span>
            {h.ev && <span className="hit-time">{timeLabel(h.ev)}</span>}
          </span>
          <span className="hit-title">{h.kind === 'memo' ? `メモ: ${h.text.split('\n')[0]}` : h.text || st?.label}</span>
          {h.ev?.memo && <span className="hit-memo">{h.ev.memo.split('\n')[0]}</span>}
          <span className="tags">
            <span className="tag">{h.kind === 'memo' ? 'メモ' : '予定'}</span>
            {st && <span className="tag st">{st.label}</span>}
          </span>
        </span>
        <ChevronR size={18} />
      </button>
    </li>
  );
}
