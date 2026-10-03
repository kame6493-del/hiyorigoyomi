import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { backupFileName } from '../domain/events';
import { planNotifications } from '../domain/notify';
import { fromDevice } from '../domain/importDevice';
import type { AppData, CalEvent } from '../domain/types';
import { today } from '../domain/date';

export const native = Capacitor.isNativePlatform();

// ---- 通知 ----

/** 予約済みを全部取り消して、これから30日分を予約し直す。許可が無ければ false */
export async function rescheduleNotifications(data: AppData, plus: boolean, ask = false): Promise<boolean> {
  if (!native) return true;
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const plan = planNotifications(data, Date.now(), plus);
    if (!plan.length) return true;
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted' && ask) perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return false;
    await LocalNotifications.schedule({
      notifications: plan.map((p) => ({ id: p.id, title: p.title, body: p.body, schedule: { at: new Date(p.at), allowWhileIdle: true } })),
    });
    return true;
  } catch (e) {
    console.error('[hiyori] notify', e);
    return false;
  }
}

// ---- バックアップ ----

/** バックアップを書き出す。スマホでは共有シート(ファイルに保存・メール・LINE など)、ブラウザではダウンロード */
export async function exportBackup(data: AppData): Promise<string> {
  const name = backupFileName(today());
  const json = JSON.stringify(data, null, 1);
  if (!native) {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return name;
  }
  const res = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: 'ひよりごよみのバックアップ', files: [res.uri] });
  return name;
}

/** 自動バックアップ(プラス): 1日1回、端末の「書類」フォルダに書き、新しい7日分だけ残す */
export async function autoBackup(data: AppData): Promise<string | null> {
  if (!native) return null;
  const dir = 'HiyoriGoyomi';
  const name = backupFileName(today());
  try {
    await Filesystem.mkdir({ path: dir, directory: Directory.Documents, recursive: true }).catch(() => {});
    await Filesystem.writeFile({ path: `${dir}/${name}`, data: JSON.stringify(data), directory: Directory.Documents, encoding: Encoding.UTF8 });
    const list = await Filesystem.readdir({ path: dir, directory: Directory.Documents });
    const olds = list.files.map((f) => f.name).filter((n) => n.startsWith('hiyorigoyomi-backup-')).sort().slice(0, -7);
    for (const n of olds) await Filesystem.deleteFile({ path: `${dir}/${n}`, directory: Directory.Documents });
    return name;
  } catch (e) {
    console.error('[hiyori] autoBackup', e);
    return null;
  }
}

// ---- 端末のカレンダー ----

export type DeviceImport = { ok: true; events: CalEvent[]; found: number } | { ok: false; reason: string };

/** 端末のカレンダー(iPhone のカレンダー / Google カレンダーなど端末に入っている物)の予定を写す。端末側は書き換えない */
export async function importFromDevice(existing: CalEvent[], monthsBack = 12, monthsAhead = 24): Promise<DeviceImport> {
  if (!native) return { ok: false, reason: '端末のカレンダーの読み込みは、スマホのアプリでだけ使えます' };
  try {
    const { result } = await CapacitorCalendar.requestReadOnlyCalendarAccess();
    if (result !== 'granted') return { ok: false, reason: 'カレンダーへのアクセスが許可されませんでした。設定アプリから許可できます' };
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).getTime();
    const to = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1).getTime();
    const res = await CapacitorCalendar.listEventsInRange({ from, to });
    const events = fromDevice(res.result, existing);
    return { ok: true, events, found: res.result.length };
  } catch (e) {
    console.error('[hiyori] device calendar', e);
    return { ok: false, reason: '端末のカレンダーを読めませんでした' };
  }
}
