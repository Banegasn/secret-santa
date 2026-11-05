import { APP_BASE_HREF } from '@angular/common';
import { REQUEST } from '@angular/core';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SSR_HL_PARAM } from './app/tokens/ssr-hl-param.token';
import bootstrap from './main.server';
import { normalizeLanguage } from './app/services/language';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine({
  allowedHosts: ['secret-santa.banegasn.dev', 'amigo-invisible.banegasn.dev', 'localhost', '127.0.0.1'],
});

/**
 * Serve static files from /browser (favicon, assets, etc.)
 * This must come before the Angular route handler
 */
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false
}));

// Missing assets must never enter SSR: doing so can recursively fetch translations.
app.use('/assets', (_req, res) => { res.sendStatus(404); });
app.get(/\.[^/]+$/, (_req, res) => { res.sendStatus(404); });

/**
 * Handle all other requests by rendering the Angular application.
 */
app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers, query } = req;

  const host = headers.host || '';
  const subdomain = host.split('.')[0];

  const hlParam = normalizeLanguage(subdomain === 'amigo-invisible'
    ? 'es'
    : query['hl'] ?? headers['accept-language']?.split(',')[0]?.split('-')[0]);

  const providers: any[] = [
    { provide: REQUEST, useValue: req },
    { provide: APP_BASE_HREF, useValue: baseUrl || '/' },
    { provide: SSR_HL_PARAM, useValue: hlParam }
  ];

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: providers,
      inlineCriticalCss: true,
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
