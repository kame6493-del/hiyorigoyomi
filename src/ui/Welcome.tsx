import { useState } from 'react';
import { StampGlyph } from '../App';
import { Art, BackIcon, ChevronR } from './icons';

const GRID = ['t-hayaban', 't-osoban', 'e-birthday', 'e-briefcase', 'e-hospital', 'e-study', 't-zaitaku', 'e-meal', 'e-shopping', 'b-gym', 'e-house', 'e-travel'];

const STEPS = [
  { h: 'スタンプを選ぶ', p: ['よく使う予定から、', '好きなスタンプを選びましょう。'] },
  { h: '日付をタップ', p: ['選んだスタンプは、日付を押すだけで', '何日でも続けて貼れます。'] },
  { h: 'メモを残す', p: ['予定にも、その日にもメモを書けます。', '前の予定は、あとから検索できます。'] },
];

/** はじめての案内: 1枚目(ようこそ)→ 使いかたガイド 3枚 */
export function Welcome(p: { onDone: () => void; onImport: () => void }) {
  const [step, setStep] = useState(0);
  if (step === 0)
    return (
      <div className="screen welcome" role="dialog" aria-label="はじめに">
        <button className="link skip" onClick={p.onDone}>
          スキップ
        </button>
        <div className="wl-top">
          <Art name="logo" className="wl-logo" alt="ひよりごよみ スタンプカレンダー" />
          <Art name="tagline" className="wl-tagline" alt="日々の暮らしに 小さな彩りを" />
          <Art name="girl_scene" className="wl-scene" />
          <Art name="sprig_b" className="wl-sprig" />
        </div>
        <ul className="wl-feats">
          <li>
            <Art name="ic_leaf" className="wl-ic" />
            <span>
              <b>アカウント登録不要</b>
              <small>すぐに使いはじめられます</small>
            </span>
          </li>
          <li>
            <Art name="ic_lock" className="wl-ic" />
            <span>
              <b>この端末だけに保存</b>
              <small>あなたの予定は、端末の中に</small>
            </span>
          </li>
          <li>
            <Art name="ic_noad" className="wl-ic" />
            <span>
              <b>広告なしで快適</b>
              <small>ずっとシンプルに使えます</small>
            </span>
          </li>
        </ul>
        <div className="wl-foot">
          <button className="btn primary big wide arrow" onClick={() => setStep(1)}>
            はじめる
            <ChevronR />
          </button>
        </div>
      </div>
    );

  const s = STEPS[step - 1];
  const last = step === STEPS.length;
  return (
    <div className="screen welcome guide" role="dialog" aria-label="使いかたガイド">
      <header className="screen-head">
        <button className="icon-btn" aria-label="もどる" onClick={() => setStep(step - 1)}>
          <BackIcon />
        </button>
        <h2>使いかたガイド</h2>
        <button className="link" onClick={p.onDone}>
          スキップ
        </button>
      </header>
      <div className="guide-body">
        <Art name="sprig_b" className="g-sprig l" />
        <Art name="sprig_e" className="g-sprig r" />
        <span className="g-step">
          <b>{step}</b> / {STEPS.length}
        </span>
        <h3>{s.h}</h3>
        <p>
          {s.p[0]}
          <br />
          {s.p[1]}
        </p>
        <div className="g-art">
          {step === 1 && (
            <div className="g-grid">
              {GRID.map((id) => (
                <span key={id} className={`g-tile ${id === 'e-birthday' ? 'hot' : ''}`}>
                  <StampGlyph id={id} size="lg" />
                </span>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="g-flow">
              <span className="g-tile big">
                <StampGlyph id="t-hayaban" size="xl" />
              </span>
              <span className="g-arrow">→</span>
              <Art name="tap15" className="g-tap" />
            </div>
          )}
          {step === 3 && (
            <div className="g-flow">
              <Art name="note" className="g-note" />
              <Art name="cat_sleep" className="g-cat" />
            </div>
          )}
        </div>
        <div className="dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <i key={i} className={i === step - 1 ? 'on' : ''} />
          ))}
        </div>
      </div>
      <Art name="sprig_c" className="g-sprig bl" />
      <Art name="sprig_d" className="g-sprig br" />
      <div className="wl-foot">
        <button className="btn primary big wide arrow" onClick={() => (last ? p.onDone() : setStep(step + 1))}>
          {last ? 'カレンダーをひらく' : 'つぎへ'}
          <ChevronR />
        </button>
        {last && (
          <button className="link" onClick={p.onImport}>
            前のカレンダーの予定を読み込む(設定へ)
          </button>
        )}
      </div>
    </div>
  );
}
