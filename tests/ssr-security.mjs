import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import app from '../dist/secret-santa/server/server.mjs';

const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const translation = await fetch(`${origin}/assets/i18n/en.json`);
  assert.equal(translation.status, 200);
  assert.equal(translation.headers.get('cache-control'), 'public, max-age=0, must-revalidate');
  const assets = await readdir(new URL('../dist/secret-santa/browser/', import.meta.url));
  const bundle = assets.find(name => /^main[-.].+\.js$/.test(name));
  assert.ok(bundle, 'Missing hashed browser bundle');
  const script = await fetch(`${origin}/${bundle}`);
  assert.equal(script.status, 200);
  assert.equal(script.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  for (const path of ['/assets/i18n/*.json?hl=*', '/assets/i18n/missing.json', '/missing.js']) {
    const response = await fetch(origin + path, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 404, path);
  }
  for (const [query, language] of [
    ['hl=*', 'en'], ['hl=../../etc/passwd', 'en'], ['hl=en&hl=es', 'en'],
    ...['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'nl', 'pl'].map(lang => [`hl=${lang}`, lang]),
  ]) {
    const response = await fetch(`${origin}/?${query}`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200, query);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.ok(response.headers.get('vary').includes('Accept-Language'));
    const html = await response.text();
    assert.ok(html.includes(`lang="${language}"`), query);
    assert.ok(html.includes('TRANSLATIONS_STATE'), `SSR translations missing for ${query}`);
  }
  const response = await fetch(`${origin}/`, {
    headers: { 'accept-language': '*' }, signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes('lang="en"'));
  const reveal = await fetch(`${origin}/reveal/QWxpY2V8Qm9i`, { signal: AbortSignal.timeout(5000) });
  assert.equal(reveal.status, 200);
  assert.equal(reveal.headers.get('cache-control'), 'private, no-store');
  console.log('Passed: CDN cache headers, reveal cache privacy, malformed language inputs, missing assets, all nine SSR languages, wildcard Accept-Language.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
