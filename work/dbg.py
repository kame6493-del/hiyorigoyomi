from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.clock.install(time='2026-10-03T10:00:00+09:00'); pg.clock.resume()
    pg.on('console', lambda m: print('console', m.type, m.text))
    pg.on('pageerror', lambda e: print('pageerror', e))
    pg.goto('http://localhost:47392/'); pg.wait_for_timeout(8000)
    print(pg.locator('#root').inner_html()[:300])
