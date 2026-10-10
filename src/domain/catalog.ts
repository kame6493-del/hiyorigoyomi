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
  /** 水彩の絵(public/art/ の名前)。あればこの絵で出す */
  img?: string;
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

/** 水彩の絵があるスタンプ(見本の絵から切り出した物。public/art/st_*.webp) */
const ART: Record<string, string> = {
  't-osoban': 'st_osoban', 't-kyuryo': 'st_moneybag', 't-zaitaku': 'st_laptop',
  'e-birthday': 'st_cake', 'e-hospital': 'st_stethoscope', 'e-medicine': 'st_medicine', 'e-travel': 'st_plane',
  'e-meal': 'st_fork', 'e-drink': 'st_beers', 'e-shopping': 'st_basket', 'e-study': 'st_book', 'e-heart': 'st_heart',
  'e-cafe': 'st_coffee', 'e-gift': 'st_gift', 'e-party': 'st_popper', 'e-pencil': 'st_pencil', 'e-briefcase': 'st_briefcase',
  'e-house': 'st_house', 'b-gym': 'st_dumbbell', 'b-sleep': 'st_moon', 'b-spa': 'st_bath',
  'p-book': 'st_book2', 'p-camera': 'st_camera', 'p-music': 'st_music', 'p-game': 'st_game',
  's-sakura': 'st_sakura', 's-sun': 'st_sunflower', 's-leaf': 'st_maple', 's-snow': 'st_snow', 's-xmas': 'st_xmas', 's-pumpkin': 'st_pumpkin',
  'k-cat': 'st_cat', 'k-paw': 'st_paw', 'k-smile': 'st_smile', 'k-sparkle': 'st_sparkle', 'k-clover': 'st_clover',
};
for (const s of STAMPS) if (ART[s.id]) s.img = ART[s.id];

export function artUrl(name: string): string {
  return `${import.meta.env.BASE_URL}art/${name}.webp`;
}

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
  /** 着せ替えを選ぶ所に出す水彩の絵(public/art/th_*.webp) */
  art: string;
  vars: Record<string, string>;
}

const base = { '--sun': '#d4594b', '--sat': '#4677c2' };
export const THEMES: Theme[] = [
  { id: 'kinari', name: 'きなり', free: true, art: 'th_neko', vars: { ...base, '--bg': '#f7f0e5', '--card': '#fffbf5', '--ink': '#4a3b31', '--sub': '#8c7b6c', '--line': '#ebdfcf', '--accent': '#c0675a', '--accent-ink': '#ffffff', '--today': '#fbe3d6', '--head': '#f3e9db' } },
  { id: 'yoru', name: 'よる', free: true, dark: true, art: 'th_yoru', vars: { '--sun': '#f08c80', '--sat': '#8fb2ef', '--bg': '#1c1f2b', '--card': '#262a38', '--ink': '#efe9df', '--sub': '#aaa69d', '--line': '#363b4c', '--accent': '#e3a37f', '--accent-ink': '#1d1b1a', '--today': '#3b3446', '--head': '#232735' } },
  { id: 'sakura', name: 'さくら', free: false, art: 'th_kotori', vars: { ...base, '--bg': '#fbf0f0', '--card': '#fffafa', '--ink': '#4a3236', '--sub': '#94767b', '--line': '#f1dcdd', '--accent': '#d27384', '--accent-ink': '#ffffff', '--today': '#fbdde2', '--head': '#f8e6e7' } },
  { id: 'wakaba', name: 'わかば', free: false, art: 'th_mori', vars: { ...base, '--bg': '#f2f4e8', '--card': '#fdfdf6', '--ink': '#34402b', '--sub': '#6f7b62', '--line': '#dde5cd', '--accent': '#6f9a55', '--accent-ink': '#ffffff', '--today': '#e3eed2', '--head': '#e9efdc' } },
  { id: 'sora', name: 'そら', free: false, art: 'th_aozora', vars: { ...base, '--bg': '#eef4f9', '--card': '#fbfdff', '--ink': '#2e3d4d', '--sub': '#6b7d90', '--line': '#d8e4ef', '--accent': '#5b8fc9', '--accent-ink': '#ffffff', '--today': '#dceaf8', '--head': '#e4eef7' } },
  { id: 'fuji', name: 'ふじ', free: false, art: 'th_yasashii', vars: { ...base, '--bg': '#f5f1f8', '--card': '#fdfbff', '--ink': '#3d3349', '--sub': '#7c7089', '--line': '#e5dcee', '--accent': '#8f74c0', '--accent-ink': '#ffffff', '--today': '#ebe2f6', '--head': '#eee8f5' } },
  { id: 'kurumi', name: 'くるみ', free: false, art: 'th_cafe', vars: { ...base, '--bg': '#f4ebe0', '--card': '#fffaf2', '--ink': '#45311f', '--sub': '#866c55', '--line': '#e6d6c3', '--accent': '#9a6a43', '--accent-ink': '#ffffff', '--today': '#f0dcc4', '--head': '#eee0cf' } },
  { id: 'sumi', name: 'すみ', free: false, art: 'th_wa', vars: { ...base, '--bg': '#f3f1ed', '--card': '#fdfcfa', '--ink': '#2c2a27', '--sub': '#6d6964', '--line': '#e0ddd6', '--accent': '#4f4a45', '--accent-ink': '#ffffff', '--today': '#e9e5dd', '--head': '#ebe8e2' } },
];

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
