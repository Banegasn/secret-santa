import assert from 'node:assert/strict';
import app from '../dist/secret-santa/server/server.mjs';

const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
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
    const html = await response.text();
    assert.ok(html.includes(`lang="${language}"`), query);
    assert.ok(html.includes('TRANSLATIONS_STATE'), `SSR translations missing for ${query}`);
  }
  const response = await fetch(`${origin}/`, {
    headers: { 'accept-language': '*' }, signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.status, 200);
  assert.ok((await response.text()).includes('lang="en"'));
  console.log('Passed: malformed language inputs, missing assets, all nine SSR languages, wildcard Accept-Language.');
} finally {
  await new Promise(resolve => server.close(resolve));
}
