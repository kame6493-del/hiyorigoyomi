"""ひよりごよみ ずんだもんのアプリ紹介 縦動画(1080x1920)。共通部品 Downloads/ui_remake_common/zunda_promo.py
画面は製品ビルド dist を vite preview して見本のバックアップで録画した clips/(record.py)
python record.py → python make.py → ../hiyorigoyomi_zunda_intro.mp4 / ../thumb.png
"""
import sys
from pathlib import Path

sys.path.insert(0, r'C:\Users\yuichi1\Downloads\ui_remake_common')
import zunda_promo as Z  # noqa: E402

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
STORE = HERE.parents[2]

Z.setup(name='ひよりごよみ', tagline='スタンプで貼るカレンダー', icon=STORE / 'icon-1024.png', renewed=True,
        brand=(0xC0, 0x67, 0x5A), bg=(0xF8, 0xD6, 0xDE), bg2=(0xEC, 0xAA, 0xBC), ink=(0x4A, 0x3B, 0x31),
        key='hiyori3', clips=HERE / 'clips',
        # 2026-10-10 生成りの地をやめ、ストア画像と同じ桜色の水彩のにじみ(bg_sakura.png は store_shots.py の paper() で作った物)
        bg_img=HERE / 'bg_sakura.png', bg_blur=0, head_ink=(0x5C, 0x1E, 0x38), name_font='C:/Windows/Fonts/HGRPRE.TTC')

MONTH = Z.clip_at('month', 0)
GRID = Z.box9(540, 700, 1040)


def scenes():
    return [
        Z.Seg('カレンダーの広告や、予定が消えちゃうことに、困ってないのだ?', None,
              sub='カレンダーの広告や|予定が消えちゃうこと|困ってないのだ?', img=MONTH, crop0=Z.FULLBOX, crop1=GRID, zt=(0.3, 2.4),
              pose=13, sfx=[(0.0, 'scout-impact.wav', 0.2)]),
        Z.Seg('そこで、ひよりごよみなのだ。UIと見た目を大幅に変えて、新しくなったのだ。',
              'そこで、ひよりごよみなのだ。ユーアイと見た目を大幅に変えて、新しくなったのだ。',
              sub='そこで、ひよりごよみなのだ。|UIと見た目を大幅に変えて|新しくなったのだ', img=MONTH, crop0=GRID,
              crop1=Z.box9(540, 680, 1000), zt=(0.2, 1.8), pose=3, hl=['ひよりごよみ', '新しくなった'],
              sfx=[(0.0, 'card-place.wav', 0.35)]),
        Z.Seg('予定はスタンプで。選んで日付を押すだけで、ぺたっと貼れるのだ。', 'よていはスタンプで。選んで日付を押すだけで、ぺたっと貼れるのだ。',
              sub='予定はスタンプで|選んで日付を押すだけ|ぺたっと貼れる', clip='paste', c0=0.3, c1=3.5,
              crop0=Z.box9(540, 760, 1040), pose=20, hl=['スタンプ'], min_dur=3.4, sfx=[(1.9, 'card-place.wav', 0.25)]),
        Z.Seg('六曜や旧暦、祝日も、月の表にそのまま出るのだ。', 'ろくようや旧暦、祝日も、月の表にそのまま出るのだ。',
              sub='六曜や旧暦、祝日も|月の表にそのまま', clip='month', c0=0.0, c1=0.8, crop0=Z.box9(540, 1000, 1000), pose=30, hl=['六曜', '旧暦'], sub_top=True),
        Z.Seg('前の通院はいつだったか、過去の予定もすぐ探せるのだ。', 'まえの通院はいつだったか、過去の予定もすぐ探せるのだ。',
              sub='前の通院はいつだった?|過去の予定もすぐ探せる', clip='search', c0=0.0, c1=1.5, crop0=Z.box9(540, 760, 1000),
              pose=2, hl=['すぐ探せる'], min_dur=2.8),
        Z.End('ひよりごよみは、いまアンドロイドのテスト版。テスター募集中なのだ。プロフィールのリンクから参加してほしいのだ!', None, pose=29),
    ]


if __name__ == '__main__':
    mp4 = OUT / 'hiyorigoyomi_zunda_intro.mp4'
    Z.build(scenes(), mp4, HERE / 'timeline.json')
    Z.thumb(OUT / 'thumb.png', MONTH, '予定はスタンプで', 'ぺたっと貼るだけ', crop=Z.box9(540, 760, 1080), y=1060)
    Z.check(mp4, HERE / 'check', [0.1, 1.5, 3.5, 5.0, 7.5, 9.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 25.0])
