import { ApplicationConfig, inject, mergeApplicationConfig, provideAppInitializer } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { appConfig } from './app.config';
import { Language, TranslationService } from './services/translation.service';
import { SSR_HL_PARAM } from './tokens/ssr-hl-param.token';

// Factory function to preload translations on server
function preloadTranslationsFactory(
  translationService: TranslationService
): () => void {
  return () => {
    try {
      const hlParam = inject(SSR_HL_PARAM, { optional: true });

      if (!hlParam) {
        return; // No language param, let browser handle it
      }

      const lang = hlParam as Language;

      // Try common paths for translation files
      const possiblePaths = [
        join(process.cwd(), 'browser', 'assets', 'i18n'),
        join(process.cwd(), 'src', 'assets', 'i18n'),
      ];

      for (const basePath of possiblePaths) {
        try {
          const langPath = join(basePath, `${lang}.json`);
          const translations = JSON.parse(readFileSync(langPath, 'utf-8'));
          translationService.loadTranslations(lang, translations);
          console.log(`[SSR] Loaded ${lang} translations from ${basePath}`);
          return;
        } catch {
          continue;
        }
      }

      console.warn(`[SSR] Could not find ${lang} translation file, browser will load it`);
    } catch (error) {
      console.error('[SSR] Could not preload translations:', error);
      // Don't throw - let browser handle translations
    }
  };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideAppInitializer(() => {
      const translationService = inject(TranslationService);
      const initializer = preloadTranslationsFactory(translationService);
      return initializer();
    })
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
