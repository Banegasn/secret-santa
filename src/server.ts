import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import { config, SSR_HL_PARAM } from './app/app.config.server';
import { REQUEST } from '@angular/core';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();

const commonEngine = new CommonEngine();

/**
 * Serve static files from /browser
 * This should only handle actual static file requests (assets, etc.)
 */
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false // Don't serve index.html, Angular handles routing
}));

/**
 * Handle all requests by rendering the Angular application first.
 * Static files will be served by Angular's router or fallback.
 */
app.get('**', (req, res, next) => {
  const { protocol, headers, originalUrl, query } = req;

  // Extract hl query parameter from the request
  let hlParam: string | undefined = query['hl'] as string | undefined;

  // If not in query object, parse manually from URL
  if (!hlParam && originalUrl && originalUrl.includes('?')) {
    try {
      const queryString = originalUrl.split('?')[1];
      const urlParams = new URLSearchParams(queryString);
      hlParam = urlParams.get('hl') || undefined;
    } catch (e) {
      console.warn(`[SSR SERVER] Failed to parse query string:`, e);
    }
  }

  if (!hlParam) {
    // use accept-language header to determine the language
    const acceptLanguage = headers['accept-language'] || '';
    const languages = acceptLanguage.split(',');
    hlParam = languages[0]?.split('-')[0] || 'en';
  }

  console.log(`[SSR SERVER] Extracted hl param: ${hlParam} from URL: ${originalUrl}`);

  // Build providers array - SSR_HL_PARAM MUST come BEFORE config.providers
  // This ensures it's available when provideAppInitializer tries to inject it
  const allProviders: any[] = [
    { provide: REQUEST, useValue: req },
    { provide: APP_BASE_HREF, useValue: req.baseUrl || '/' },
    // SSR_HL_PARAM must be provided here, before config.providers
    { provide: SSR_HL_PARAM, useValue: hlParam },
    // Now add config.providers (which includes provideAppInitializer that needs SSR_HL_PARAM)
    ...(config.providers || [])
  ];

  // Verify SSR_HL_PARAM provider is present
  const hasSSRHLParam = allProviders.some(p =>
    p && typeof p === 'object' && 'provide' in p && p.provide === SSR_HL_PARAM
  );
  console.log(`[SSR SERVER] Total providers: ${allProviders.length}, SSR_HL_PARAM present: ${hasSSRHLParam}, value: ${hlParam}`);

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: allProviders,
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
