import { useMemo, useRef } from 'react';
import { monthGrid, today, weekday, WEEK_JA, type YMD } from '../domain/date';
import { holidayName } from '../domain/holidays';
import { rokuyoCached } from '../domain/lunar';
import { COLORS, occurrencesInRange } from '../domain/events';
import { stampById } from '../domain/catalog';
import type { AppData } from '../domain/types';
import { StampGlyph, type PasteMode } from '../App';

const MAX_LINES = 3;

export function MonthView(p: {
  data: AppData;
  y: number;
  m: number;
  selected: YMD;
  paste: PasteMode;
  onDay: (d: YMD) => void;
  onShift: (n: number) => void;
  onToday: () => void;
  onSearch: () => void;
  onSettings: () => void;
}) {
  const ws = p.data.settings.weekStart;
  const grid = useMemo(() => monthGrid(p.y, p.m, ws), [p.y, p.m, ws]);
  const occ = useMemo(() => occurrencesInRange(p.data.events, grid[0], grid[41]), [p.data.events, grid]);
  const t = today();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const weeks = [0, 1, 2, 3, 4, 5].filter((w) => w < 5 || grid[w * 7].slice(5, 7) === String(p.m).padStart(2, '0'));

  return (
    <div
      className="month"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) p.onShift(dx < 0 ? 1 : -1);
      }}
    >
      <header className="month-head">
        <button className="icon-btn" aria-label="前の月" onClick={() => p.onShift(-1)}>
          ‹
        </button>
        <h1 className="month-title">
          <span className="mt-year">{p.y}年</span>
          <span className="mt-month">{p.m}月</span>
        </h1>
        <button className="icon-btn" aria-label="次の月" onClick={() => p.onShift(1)}>
          ›
        </button>
        <div className="head-gap" />
        <button className="pill" onClick={p.onToday}>
          今日
        </button>
        <button className="icon-btn" aria-label="さがす" onClick={p.onSearch}>
          <SearchIcon />
        </button>
        <button className="icon-btn" aria-label="設定" onClick={p.onSettings}>
          <GearIcon />
        </button>
      </header>
      <div className="week-row">
        {Array.from({ length: 7 }, (_, i) => (i + ws) % 7).map((wd) => (
          <div key={wd} className={`wk ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`}>
            {WEEK_JA[wd]}
          </div>
        ))}
      </div>
      <div className={`grid weeks-${weeks.length} ${p.paste ? 'pasting' : ''}`}>
        {weeks.flatMap((w) =>
          grid.slice(w * 7, w * 7 + 7).map((d) => {
            const wd = weekday(d);
            const hol = holidayName(d);
            const other = Number(d.slice(5, 7)) !== p.m;
            const list = occ.get(d) ?? [];
            const stampOnly = list.filter((o) => !o.ev.title && o.ev.stamp);
            const lines = list.filter((o) => o.ev.title || !o.ev.stamp);
            const shownLines = lines.slice(0, MAX_LINES - (stampOnly.length ? 1 : 0));
            const more = lines.length - shownLines.length;
            const cls = ['cell', other && 'other', d === t && 'today', d === p.selected && !p.paste && 'sel', (wd === 0 || hol) && 'sun', wd === 6 && !hol && 'sat']
              .filter(Boolean)
              .join(' ');
            return (
              <button key={d} className={cls} onClick={() => p.onDay(d)} data-date={d}>
                <div className="cell-top">
                  <span className="dnum">{Number(d.slice(8))}</span>
                  {p.data.settings.showRokuyo && <span className="rk">{rokuyoCached(d)}</span>}
                </div>
                {hol && <div className="hol" title={hol}>{shortHoliday(hol)}</div>}
                {p.data.dayMemos[d] && <span className="memo-dot" aria-label="メモあり" />}
                {stampOnly.length > 0 && (
                  <div className="stamps">
                    {stampOnly.slice(0, 3).map((o, i) => (
                      <StampGlyph key={o.ev.id + i} id={o.ev.stamp} size="md" />
                    ))}
                    {stampOnly.length > 3 && <span className="more">+{stampOnly.length - 3}</span>}
                  </div>
                )}
                {shownLines.map((o, i) => {
                  const st = stampById(o.ev.stamp);
                  return (
                    <div key={o.ev.id + i} className="chip" style={{ ['--c' as string]: COLORS[o.ev.color]?.hex }}>
                      {st && <StampGlyph id={st.id} />}
                      <span className="chip-t">{o.ev.title}</span>
                    </div>
                  );
                })}
                {more > 0 && <div className="more">+{more}</div>}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

/** 月の表のマスは狭いので、長い祝日名は縮める(下の欄では正式名) */
const SHORT: Record<string, string> = {
  スポーツの日: 'スポーツ',
  勤労感謝の日: '勤労感謝',
  建国記念の日: '建国記念',
  天皇誕生日: '天皇誕生日',
  天皇の即位の日: '即位の日',
  即位礼正殿の儀の行われる日: '即位礼',
  即位礼正殿の儀: '即位礼',
};
export function shortHoliday(name: string): string {
  return SHORT[name] ?? name;
}

export function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </svg>
  );
}
export function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
    </svg>
  );
}
