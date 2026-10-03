/**
 * 予定スタンプと着せ替え。free=true は無料で使える物、それ以外は「ひよりプラス」で使える。
 * 文字スタンプは丸の中に1文字(シフト・ゴミの日など、旧Yahoo!カレンダーで多かった使い方)。
 */
export interface Stamp {
  id: string;
  glyph: string;
  label: string;
  kind: 'emoji' | 'text';
  bg?: string; // 文字スタンプの丸の色
  free: boolean;
  cat: string;
}

const T = (id: string, glyph: string, label: string, bg: string, free: boolean): Stamp => ({ id, glyph, label, kind: 'text', bg, free, cat: '文字' });
const E = (cat: string, free: boolean, list: [string, string, string][]): Stamp[] =>
  list.map(([id, glyph, label]) => ({ id, glyph, label, kind: 'emoji', free, cat }));

export const STAMPS: Stamp[] = [
  // 文字(無料8)
  T('t-yasumi', '休', '休み', '#e8555b', true),
  T('t-shigoto', '仕', '仕事', '#4a86d8', true),
  T('t-hayaban', '早', '早番', '#f08a3c', true),
  T('t-osoban', '遅', '遅番', '#9a6fd0', true),
  T('t-yakin', '夜', '夜勤', '#3d4a6b', true),
  T('t-kyuryo', '給', '給料日', '#4fae6b', true),
  T('t-byoin', '病', '病院', '#36a9a1', true),
  T('t-shime', '〆', '締め切り', '#c0392b', true),
  // 文字(プラス)
  T('t-nikkin', '日', '日勤', '#e2b53a', false),
  T('t-ake', '明', '明け', '#7f8c8d', false),
  T('t-yuukyu', '有', '有給', '#e46fa6', false),
  T('t-zaitaku', '在', '在宅', '#16a085', false),
  T('t-shucchou', '出', '出張', '#2c3e50', false),
  T('t-gakko', '学', '学校', '#2980b9', false),
  T('t-juku', '塾', '塾', '#8e44ad', false),
  T('t-moeru', '燃', '燃えるゴミ', '#d35400', false),
  T('t-shigen', '資', '資源ゴミ', '#27ae60', false),
  T('t-pla', 'プ', 'プラごみ', '#2471a3', false),
  T('t-kan', '缶', 'びん・缶', '#7d6608', false),
  T('t-shiharai', '払', '支払い', '#b03a2e', false),
  T('t-hikiotoshi', '引', '引き落とし', '#6c3483', false),
  T('t-yoyaku', '予', '予約', '#117a65', false),
  T('t-mensetsu', '面', '面接', '#1f618d', false),
  T('t-shiken', '試', '試験', '#943126', false),
  // 予定(無料)
  ...E('予定', true, [
    ['e-birthday', '🎂', '誕生日'], ['e-hospital', '🏥', '通院'], ['e-dentist', '🦷', '歯医者'], ['e-medicine', '💊', 'くすり'],
    ['e-travel', '✈️', '旅行'], ['e-meal', '🍽️', 'ごはん'], ['e-drink', '🍻', '飲み会'], ['e-shopping', '🛒', '買い物'],
    ['e-hair', '💇', '美容院'], ['e-study', '📚', '勉強'], ['e-heart', '❤️', 'デート'], ['e-star', '⭐', '大事な日'],
  ]),
  // 予定(プラス)
  ...E('予定', false, [
    ['e-train', '🚃', 'おでかけ'], ['e-car', '🚗', 'ドライブ'], ['e-ship', '🚢', '船旅'], ['e-hotel', '🏨', 'ホテル'],
    ['e-cafe', '☕', 'カフェ'], ['e-cake', '🍰', 'おやつ'], ['e-sushi', '🍣', 'おすし'], ['e-ramen', '🍜', 'ラーメン'],
    ['e-gift', '🎁', 'プレゼント'], ['e-party', '🎉', 'パーティー'], ['e-wedding', '💒', '結婚式'], ['e-ring', '💍', '記念日'],
    ['e-baby', '👶', '赤ちゃん'], ['e-school', '🏫', '学校行事'], ['e-pencil', '✏️', '宿題'], ['e-exam', '📝', 'テスト'],
    ['e-briefcase', '💼', '会議'], ['e-phone', '📞', '電話'], ['e-mail', '✉️', '手紙'], ['e-package', '📦', '荷物'],
    ['e-money', '💰', 'お金'], ['e-bank', '🏦', '銀行'], ['e-card', '💳', 'カード'], ['e-house', '🏠', '家のこと'],
    ['e-wash', '🧺', '洗たく'], ['e-clean', '🧹', 'そうじ'], ['e-trash', '🗑️', 'ゴミ出し'], ['e-recycle', '♻️', 'リサイクル'],
    ['e-flower', '💐', 'お花'], ['e-grave', '🪦', 'お墓参り'], ['e-shrine', '⛩️', '神社'], ['e-temple', '🛕', 'お寺'],
  ]),
  // からだ(プラス)
  ...E('からだ', false, [
    ['b-period', '🩸', '生理'], ['b-scale', '⚖️', '体重'], ['b-run', '🏃', 'ランニング'], ['b-gym', '🏋️', 'ジム'],
    ['b-yoga', '🧘', 'ヨガ'], ['b-swim', '🏊', 'プール'], ['b-bike', '🚴', 'サイクリング'], ['b-walk', '🚶', 'さんぽ'],
    ['b-sleep', '😴', '睡眠'], ['b-sick', '🤒', '体調不良'], ['b-mask', '😷', 'かぜ'], ['b-spa', '♨️', '温泉'],
    ['b-nail', '💅', 'ネイル'], ['b-eye', '👓', '眼科'], ['b-syringe', '💉', '予防接種'], ['b-blood', '🩺', '健康診断'],
  ]),
  // あそび(プラス)
  ...E('あそび', false, [
    ['p-music', '🎵', '音楽'], ['p-live', '🎤', 'ライブ'], ['p-movie', '🎬', '映画'], ['p-game', '🎮', 'ゲーム'],
    ['p-book', '📖', '読書'], ['p-art', '🎨', '絵'], ['p-camera', '📷', '写真'], ['p-ticket', '🎫', 'チケット'],
    ['p-baseball', '⚾', '野球'], ['p-soccer', '⚽', 'サッカー'], ['p-tennis', '🎾', 'テニス'], ['p-golf', '⛳', 'ゴルフ'],
    ['p-ski', '🎿', 'スキー'], ['p-camp', '🏕️', 'キャンプ'], ['p-fish', '🎣', 'つり'], ['p-mountain', '⛰️', '山'],
    ['p-beach', '🏖️', '海'], ['p-ferris', '🎡', '遊園地'], ['p-zoo', '🐼', '動物園'], ['p-fireworks', '🎆', '花火'],
  ]),
  // きせつ・行事(プラス)
  ...E('きせつ', false, [
    ['s-sakura', '🌸', 'お花見'], ['s-tulip', '🌷', '春'], ['s-sun', '🌻', '夏'], ['s-leaf', '🍁', '紅葉'],
    ['s-snow', '⛄', '雪'], ['s-xmas', '🎄', 'クリスマス'], ['s-santa', '🎅', 'サンタ'], ['s-newyear', '🎍', 'お正月'],
    ['s-oni', '👹', '節分'], ['s-hina', '🎎', 'ひな祭り'], ['s-koi', '🎏', 'こどもの日'], ['s-tanabata', '🎋', '七夕'],
    ['s-moon', '🎑', 'お月見'], ['s-pumpkin', '🎃', 'ハロウィン'], ['s-choco', '🍫', 'バレンタイン'], ['s-carnation', '🌹', '母の日'],
  ]),
  // どうぶつ・きもち(プラス)
  ...E('きもち', false, [
    ['k-cat', '🐱', 'ねこ'], ['k-dog', '🐶', 'いぬ'], ['k-rabbit', '🐰', 'うさぎ'], ['k-bear', '🐻', 'くま'],
    ['k-chick', '🐤', 'ひよこ'], ['k-paw', '🐾', 'ペット'], ['k-smile', '😊', 'うれしい'], ['k-love', '🥰', 'たのしみ'],
    ['k-cry', '😢', 'かなしい'], ['k-angry', '😤', 'がんばる'], ['k-sparkle', '✨', 'きらきら'], ['k-clover', '🍀', 'ラッキー'],
    ['k-check', '✅', 'できた'], ['k-warn', '⚠️', '注意'], ['k-pin', '📌', 'わすれずに'], ['k-bell', '🔔', 'お知らせ'],
  ]),
];

export const STAMP_CATS = ['文字', '予定', 'からだ', 'あそび', 'きせつ', 'きもち'];

const byId = new Map(STAMPS.map((s) => [s.id, s]));
export function stampById(id?: string): Stamp | undefined {
  return id ? byId.get(id) : undefined;
}
export function stampLabel(id: string): string {
  return byId.get(id)?.label ?? '';
}

export interface Theme {
  id: string;
  name: string;
  free: boolean;
  dark?: boolean;
  vars: Record<string, string>;
}

const base = { '--sun': '#d9444b', '--sat': '#3d78c9' };
export const THEMES: Theme[] = [
  { id: 'kinari', name: 'きなり', free: true, vars: { ...base, '--bg': '#fbf8f1', '--card': '#ffffff', '--ink': '#2f2a24', '--sub': '#7a7064', '--line': '#e7dfd2', '--accent': '#d9822b', '--accent-ink': '#ffffff', '--today': '#fff1d6', '--head': '#f4ede1' } },
  { id: 'yoru', name: 'よる', free: true, dark: true, vars: { '--sun': '#ff7a80', '--sat': '#79a8ff', '--bg': '#16181d', '--card': '#1f2229', '--ink': '#eceae6', '--sub': '#a3a39f', '--line': '#30343d', '--accent': '#f0a24a', '--accent-ink': '#1a1a1a', '--today': '#3a3122', '--head': '#23262e' } },
  { id: 'sakura', name: 'さくら', free: false, vars: { ...base, '--bg': '#fff6f8', '--card': '#ffffff', '--ink': '#3b2a30', '--sub': '#8d6f78', '--line': '#f3dbe2', '--accent': '#e0668c', '--accent-ink': '#ffffff', '--today': '#ffe3ec', '--head': '#fde9ef' } },
  { id: 'wakaba', name: 'わかば', free: false, vars: { ...base, '--bg': '#f5faf1', '--card': '#ffffff', '--ink': '#25331f', '--sub': '#62735a', '--line': '#dbe8d2', '--accent': '#5c9e3f', '--accent-ink': '#ffffff', '--today': '#e5f4d9', '--head': '#e9f3e1' } },
  { id: 'sora', name: 'そら', free: false, vars: { ...base, '--bg': '#f2f7fd', '--card': '#ffffff', '--ink': '#1f2b3a', '--sub': '#5d6d80', '--line': '#d7e3f1', '--accent': '#3b82d6', '--accent-ink': '#ffffff', '--today': '#dcebfb', '--head': '#e4eefa' } },
  { id: 'fuji', name: 'ふじ', free: false, vars: { ...base, '--bg': '#f8f5fc', '--card': '#ffffff', '--ink': '#2d2638', '--sub': '#716685', '--line': '#e3dbef', '--accent': '#8a63c9', '--accent-ink': '#ffffff', '--today': '#ece3f8', '--head': '#efe8f8' } },
  { id: 'kurumi', name: 'くるみ', free: false, vars: { ...base, '--bg': '#f6f0e8', '--card': '#fffaf3', '--ink': '#3a2a1c', '--sub': '#7d6650', '--line': '#e4d5c2', '--accent': '#8b5a2b', '--accent-ink': '#ffffff', '--today': '#f1e0c8', '--head': '#eee2d2' } },
  { id: 'sumi', name: 'すみ', free: false, vars: { ...base, '--bg': '#f4f4f2', '--card': '#ffffff', '--ink': '#1d1d1b', '--sub': '#6b6b66', '--line': '#dddcd7', '--accent': '#333331', '--accent-ink': '#ffffff', '--today': '#e9e8e2', '--head': '#ebeae6' } },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
