const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    storageState: 'playwright/.auth/storefront.json',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  for (const [name, path] of [['cart', '/cart'], ['home', '/'], ['notfound', '/this-page-does-not-exist']]) {
    const resp = await page.goto('https://handwerker-yamrvgge.myshopify.com' + path + '?preview_theme_id=162862432492', { waitUntil: 'domcontentloaded' });
    const html = await page.content();
    fs.writeFileSync('/tmp/dump-' + name + '.html', html);
    console.log(name, 'status=', resp.status(), 'len=', html.length);
    const m = html.match(/Liquid error[^<]*/g);
    if (m) console.log(name, 'LIQUID ERRORS:', m.slice(0, 5));
  }
  console.log('JS errors:', errors.slice(0, 10));
  await browser.close();
})();
