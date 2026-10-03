import { useState } from 'react';
import { STAMPS, STAMP_CATS } from '../domain/catalog';
import { StampGlyph } from '../App';

export function StampPicker(p: {
  plus: boolean;
  selected?: string;
  onClose: () => void;
  onPick: (id: string) => void;
  onClear?: () => void;
  onPaywall: () => void;
  hint?: string;
}) {
  const [cat, setCat] = useState(STAMP_CATS[0]);
  const list = STAMPS.filter((s) => s.cat === cat);
  const locked = STAMPS.filter((s) => !s.free).length;
  return (
    <div className="sheet-back" onClick={p.onClose}>
      <div className="sheet stamp-sheet" role="dialog" aria-label="スタンプを選ぶ" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <button className="link" onClick={p.onClose}>
            閉じる
          </button>
          <h2>スタンプ</h2>
          {p.onClear ? (
            <button className="link" onClick={p.onClear}>
              なし
            </button>
          ) : (
            <span />
          )}
        </div>
        {p.hint && <p className="hint center">{p.hint}</p>}
        <div className="tabs" role="tablist">
          {STAMP_CATS.map((c) => (
            <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="stamp-grid">
          {list.map((s) => {
            const can = s.free || p.plus;
            return (
              <button
                key={s.id}
                className={`stamp-cell ${p.selected === s.id ? 'on' : ''} ${can ? '' : 'locked'}`}
                onClick={() => (can ? p.onPick(s.id) : p.onPaywall())}
                aria-label={s.label + (can ? '' : '(ひよりプラス)')}
              >
                <StampGlyph id={s.id} size="lg" />
                <span className="stamp-label">{s.label}</span>
                {!can && <span className="lock">プラス</span>}
              </button>
            );
          })}
        </div>
        {!p.plus && (
          <button className="plus-note" onClick={p.onPaywall}>
            ひよりプラスで、ほかに {locked} 種のスタンプが使えます
          </button>
        )}
      </div>
    </div>
  );
}
