import { StampGlyph } from '../App';

export function Welcome(p: { onDone: () => void; onImport: () => void }) {
  return (
    <div className="sheet-back">
      <div className="sheet welcome" role="dialog" aria-label="はじめに">
        <div className="wl-stamps">
          <StampGlyph id="t-yasumi" size="lg" />
          <StampGlyph id="e-birthday" size="lg" />
          <StampGlyph id="e-hospital" size="lg" />
          <StampGlyph id="t-kyuryo" size="lg" />
        </div>
        <h2>ひよりごよみへ ようこそ</h2>
        <ul className="wl-list">
          <li>アカウント登録はいりません。予定はこの端末の中だけに保存します。</li>
          <li>祝日と六曜はスマホの中で計算するので、電波が無くても出ます。</li>
          <li>スタンプを選んで日付を押せば、ぺたぺた貼っていけます。</li>
          <li>予定のコピー・くり返し・過去の検索もできます。</li>
        </ul>
        <button className="btn primary wide big" onClick={p.onDone}>
          はじめる
        </button>
        <button className="link" onClick={p.onImport}>
          前のカレンダーの予定を読み込む(設定へ)
        </button>
      </div>
    </div>
  );
}
