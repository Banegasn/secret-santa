import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import { config } from './app/app.config.server';
import { SSR_HL_PARAM } from './app/tokens/ssr-hl-param.token';
import { REQUEST } from '@angular/core';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();

const commonEngine = new CommonEngine();

/**
 * Serve static files from /browser
 * This should only handle actual static file requests (assets, etc.)
 * The fallthrough: false option ensures that if a file doesn't exist,
 * it doesn't send a 404, allowing the request to continue to the Angular router
 */
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false, // Don't serve index.html, Angular handles routing
  fallthrough: true // Allow requests to continue if file not found
}));

/**
 * Handle all requests by rendering the Angular application.
 * This catch-all route handles all HTTP methods and all paths.
 * Static files will be served by the middleware above if they exist,
 * otherwise Angular router will handle the route.
 */
app.all('*', (req, res, next) => {
  const { protocol, headers, originalUrl, query } = req;

  const host = headers.host || '';
  const subdomain = host.split('.')[0];

  let hlParam: string | undefined;

  if (subdomain === 'amigo-invisible') {
    hlParam = 'es';
  }

  if (!hlParam) {
    hlParam = query['hl'] as string | undefined;
  }

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
    const acceptLanguage = headers['accept-language'] || '';
    const languages = acceptLanguage.split(',');
    hlParam = languages[0]?.split('-')[0] || 'en';
  }

  console.log(`[SSR SERVER] Extracted hl param: ${hlParam} from URL: ${originalUrl}`);

  const allProviders: any[] = [
    { provide: REQUEST, useValue: req },
    { provide: APP_BASE_HREF, useValue: req.baseUrl || '/' },
    { provide: SSR_HL_PARAM, useValue: hlParam },
    ...(config.providers || [])
  ];

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
