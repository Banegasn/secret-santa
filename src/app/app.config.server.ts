import { mergeApplicationConfig, ApplicationConfig, InjectionToken, inject, Optional, TransferState, provideAppInitializer, REQUEST } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { TranslationService, Language, INITIAL_LANGUAGE, TRANSLATIONS_STATE, Translations } from './services/translation.service';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Token for injecting hl query parameter
export const SSR_HL_PARAM = new InjectionToken<string | undefined>('SSR_HL_PARAM');

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Factory function to preload translations on server
function preloadTranslationsFactory(
  translationService: TranslationService,
  transferState: TransferState,
  hlParam?: string | undefined
): () => void {
  return () => {
    console.log(`[SSR] preloadTranslationsFactory called, hlParam: ${hlParam}, type: ${typeof hlParam}`);

    // Determine initial language: use hlParam if provided, otherwise default to 'en'
    const validLanguages: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'nl', 'pl'];
    const currentLang: Language | null = (hlParam && validLanguages.includes(hlParam as Language)) ? (hlParam as Language) : null;

    // Set language in service
    if (currentLang) {
      translationService.setLanguage(currentLang);
      transferState.set(INITIAL_LANGUAGE, currentLang);
      console.log(`[SSR] ✓ Initial language set to TransferState: ${currentLang}`);
    }

    try {
      // Try multiple possible paths for the assets
      const possiblePaths = [
        join(process.cwd(), 'src', 'assets', 'i18n'), // Source directory (for development)
        join(process.cwd(), 'browser', 'assets', 'i18n'),
        join(process.cwd(), 'dist', 'secret-santa', 'browser', 'assets', 'i18n'),
        join(__dirname, '..', 'browser', 'assets', 'i18n'),
        join(__dirname, '..', '..', 'browser', 'assets', 'i18n'),
        join(__dirname, '..', '..', '..', 'src', 'assets', 'i18n'), // Alternative source path
      ];

      const languages: Array<{ code: string }> = [
        { code: 'en' },
        { code: 'es' },
        { code: 'fr' },
        { code: 'de' },
        { code: 'it' },
        { code: 'pt' },
        { code: 'ja' },
        { code: 'nl' },
        { code: 'pl' }
      ];

      let basePathFound: string | null = null;

      // Find a path that has at least the English translation file
      for (const basePath of possiblePaths) {
        try {
          const testEnPath = join(basePath, 'en.json');
          readFileSync(testEnPath, 'utf-8');
          // Found a valid path with at least English
          basePathFound = basePath;
          break;
        } catch {
          // Continue to next path
          continue;
        }
      }

      if (!basePathFound) {
        throw new Error('Could not find translation files in any expected location');
      }

      // Load all available translations (don't fail if some are missing)
      let loadedCount = 0;
      const loadedTranslations: Record<Language, Translations> = {
        en: {}, es: {}, fr: {}, de: {}, it: {}, pt: {}, ja: {}, nl: {}, pl: {}
      };

      languages.forEach(lang => {
        try {
          const langPath = join(basePathFound!, `${lang.code}.json`);
          const translations = JSON.parse(readFileSync(langPath, 'utf-8'));
          const langCode = lang.code as Language;
          translationService.loadTranslations(langCode, translations);
          loadedTranslations[langCode] = translations;
          loadedCount++;
        } catch (error) {
          // Silently skip missing translation files
          // console.warn(`Failed to load ${lang.code} translations:`, error);
        }
      });

      if (loadedCount === 0) {
        throw new Error('No translation files could be loaded');
      }

      // Transfer all loaded translations to client via TransferState
      transferState.set(TRANSLATIONS_STATE, loadedTranslations);
      console.log(`[SSR] Saved ${loadedCount} language translations to TransferState`);
    } catch (error) {
      console.error('Could not preload translations from filesystem:', error);
      // Re-throw to fail fast - translations must be available for SSR
      throw error;
    }
  };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideAppInitializer(() => {
      const translationService = inject(TranslationService);
      const transferState = inject(TransferState);
      const request = inject(REQUEST);

      console.log(`[SSR] Request:`, request?.url, request?.body);

      const hlParam = inject(SSR_HL_PARAM, { optional: true }) ?? undefined;
      console.log(`[SSR] Injected SSR_HL_PARAM: ${hlParam}`);

      const initializer = preloadTranslationsFactory(translationService, transferState, hlParam);
      return initializer();
    })
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
