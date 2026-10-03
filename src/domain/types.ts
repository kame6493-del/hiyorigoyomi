import type { YMD } from './date';

export type Repeat =
  | { freq: 'none' }
  | { freq: 'daily' | 'weekly' | 'monthly' | 'yearly'; interval: number; until?: YMD };

/** 通知: 何分前か(終日の予定は「当日の朝」「前日の夜」を分で表す) */
export type Notify = null | number;

export interface CalEvent {
  id: string;
  date: YMD; // 始まる日(繰り返しなら最初の日)
  days: number; // 何日続くか(1 = その日だけ)
  allDay: boolean;
  start?: string; // 'HH:MM'
  end?: string;
  title: string;
  memo: string;
  color: number; // 0..COLORS-1
  stamp?: string; // スタンプの id
  repeat: Repeat;
  exdates: YMD[]; // 繰り返しのうち消した日
  notify: Notify;
  source?: 'device'; // 端末のカレンダーから読み込んだ物
  externalId?: string;
  createdAt: number;
  updatedAt: number;
}

/** 画面に出す1回分 */
export interface Occurrence {
  ev: CalEvent;
  date: YMD; // この回の始まりの日
  day: YMD; // 表示する日(複数日の予定は各日に出る)
}

export interface Settings {
  weekStart: 0 | 1;
  showRokuyo: boolean;
  theme: string;
  colorNames: string[];
  defaultNotify: Notify;
  digest: { on: boolean; time: string }; // 今日の予定のまとめ通知(プラス)
  autoBackup: boolean; // 自動バックアップ(プラス)
  lastAutoBackup?: string;
  onboarded: boolean;
}

export interface AppData {
  version: 1;
  events: CalEvent[];
  dayMemos: Record<YMD, string>;
  settings: Settings;
}
