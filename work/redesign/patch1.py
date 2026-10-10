import os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
p = 'src/domain/catalog.ts'
s = open(p, encoding='utf-8').read()
s = s.replace("""  bg?: string; // 文字スタンプの丸の色
  free: boolean;
  cat: string;
}""", """  bg?: string; // 文字スタンプの丸の色
  free: boolean;
  cat: string;
  /** 水彩の絵(public/art/ の名前)。あればこの絵で出す */
  img?: string;
}""")
s = s.replace("""const byId = new Map(STAMPS.map((s) => [s.id, s]));""", """/** 水彩の絵があるスタンプ(見本の絵から切り出した物。public/art/st_*.webp) */
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

const byId = new Map(STAMPS.map((s) => [s.id, s]));""")
s = s.replace("""export interface Theme {
  id: string;
  name: string;
  free: boolean;
  dark?: boolean;
  vars: Record<string, string>;
}

const base = { '--sun': '#d9444b', '--sat': '#3d78c9' };""", """export interface Theme {
  id: string;
  name: string;
  free: boolean;
  dark?: boolean;
  /** 着せ替えを選ぶ所に出す水彩の絵(public/art/th_*.webp) */
  art: string;
  vars: Record<string, string>;
}

const base = { '--sun': '#d4594b', '--sat': '#4677c2' };""")
start = s.index("export const THEMES: Theme[] = [")
end = s.index("];", start) + 2
s = s[:start] + """export const THEMES: Theme[] = [
  { id: 'kinari', name: 'きなり', free: true, art: 'th_neko', vars: { ...base, '--bg': '#f7f0e5', '--card': '#fffbf5', '--ink': '#4a3b31', '--sub': '#8c7b6c', '--line': '#ebdfcf', '--accent': '#c0675a', '--accent-ink': '#ffffff', '--today': '#fbe3d6', '--head': '#f3e9db' } },
  { id: 'yoru', name: 'よる', free: true, dark: true, art: 'th_yoru', vars: { '--sun': '#f08c80', '--sat': '#8fb2ef', '--bg': '#1c1f2b', '--card': '#262a38', '--ink': '#efe9df', '--sub': '#aaa69d', '--line': '#363b4c', '--accent': '#e3a37f', '--accent-ink': '#1d1b1a', '--today': '#3b3446', '--head': '#232735' } },
  { id: 'sakura', name: 'さくら', free: false, art: 'th_kotori', vars: { ...base, '--bg': '#fbf0f0', '--card': '#fffafa', '--ink': '#4a3236', '--sub': '#94767b', '--line': '#f1dcdd', '--accent': '#d27384', '--accent-ink': '#ffffff', '--today': '#fbdde2', '--head': '#f8e6e7' } },
  { id: 'wakaba', name: 'わかば', free: false, art: 'th_mori', vars: { ...base, '--bg': '#f2f4e8', '--card': '#fdfdf6', '--ink': '#34402b', '--sub': '#6f7b62', '--line': '#dde5cd', '--accent': '#6f9a55', '--accent-ink': '#ffffff', '--today': '#e3eed2', '--head': '#e9efdc' } },
  { id: 'sora', name: 'そら', free: false, art: 'th_aozora', vars: { ...base, '--bg': '#eef4f9', '--card': '#fbfdff', '--ink': '#2e3d4d', '--sub': '#6b7d90', '--line': '#d8e4ef', '--accent': '#5b8fc9', '--accent-ink': '#ffffff', '--today': '#dceaf8', '--head': '#e4eef7' } },
  { id: 'fuji', name: 'ふじ', free: false, art: 'th_yasashii', vars: { ...base, '--bg': '#f5f1f8', '--card': '#fdfbff', '--ink': '#3d3349', '--sub': '#7c7089', '--line': '#e5dcee', '--accent': '#8f74c0', '--accent-ink': '#ffffff', '--today': '#ebe2f6', '--head': '#eee8f5' } },
  { id: 'kurumi', name: 'くるみ', free: false, art: 'th_cafe', vars: { ...base, '--bg': '#f4ebe0', '--card': '#fffaf2', '--ink': '#45311f', '--sub': '#866c55', '--line': '#e6d6c3', '--accent': '#9a6a43', '--accent-ink': '#ffffff', '--today': '#f0dcc4', '--head': '#eee0cf' } },
  { id: 'sumi', name: 'すみ', free: false, art: 'th_wa', vars: { ...base, '--bg': '#f3f1ed', '--card': '#fdfcfa', '--ink': '#2c2a27', '--sub': '#6d6964', '--line': '#e0ddd6', '--accent': '#4f4a45', '--accent-ink': '#ffffff', '--today': '#e9e5dd', '--head': '#ebe8e2' } },
];""" + s[end:]
open(p, 'w', encoding='utf-8').write(s)

p = 'src/domain/events.ts'
s = open(p, encoding='utf-8').read()
old = s[s.index("export const COLORS = ["):s.index("] as const;") + len("] as const;")]
new = """/**
 * 予定の色。保存しているのは番号(0〜8)なので、番号の意味は前の版と同じ並び(赤→もも、橙→みかん …灰→生成り)に
 * 近い色を当てた。画面に並べる順は COLOR_ORDER(見本どおり さくら・もも・みかん…)。
 */
export const COLORS = [
  { key: 'momo', hex: '#ec9f8c', name: 'もも' },
  { key: 'mikan', hex: '#f0b073', name: 'みかん' },
  { key: 'tanpopo', hex: '#f1cf68', name: 'たんぽぽ' },
  { key: 'wakaba', hex: '#9fc58c', name: '若葉' },
  { key: 'ajisai', hex: '#a3a6e6', name: 'あじさい' },
  { key: 'sora', hex: '#8fbfe6', name: 'そら' },
  { key: 'fuji', hex: '#ad93d2', name: '藤' },
  { key: 'sakura', hex: '#efa8b2', name: 'さくら' },
  { key: 'kinari', hex: '#cfc2aa', name: '生成り' },
] as const;
/** 画面での並び(見本のデザインシステムの順) */
export const COLOR_ORDER = [7, 0, 1, 2, 3, 5, 4, 6, 8] as const;
/** 1.0 のときの既定の色の名前。名前を変えていなければ新しい名前に読み替える */
export const OLD_COLOR_NAMES = ['あか', 'だいだい', 'きいろ', 'みどり', 'あおみどり', 'あお', 'むらさき', 'ももいろ', 'はいいろ'];"""
s = s.replace(old, new)
a = """    colorNames: Array.isArray(s.colorNames) && s.colorNames.length === COLORS.length ? s.colorNames.map((n, i) => (typeof n === 'string' && n.trim() ? n.slice(0, 12) : COLORS[i].name)) : base.settings.colorNames,"""
b = """    colorNames:
      Array.isArray(s.colorNames) && s.colorNames.length === COLORS.length
        ? s.colorNames.map((n, i) => (typeof n === 'string' && n.trim() && n !== OLD_COLOR_NAMES[i] ? n.slice(0, 12) : COLORS[i].name))
        : base.settings.colorNames,"""
assert a in s
s = s.replace(a, b)
open(p, 'w', encoding='utf-8').write(s)
print('ok')
