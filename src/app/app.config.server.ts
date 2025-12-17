import { mergeApplicationConfig, ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { TranslationService } from './services/translation.service';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Factory function to preload translations on server
function preloadTranslationsFactory(translationService: TranslationService): () => void {
  return () => {
    try {
      // Try multiple possible paths for the assets
      const possiblePaths = [
        join(process.cwd(), 'browser', 'assets', 'i18n'),
        join(process.cwd(), 'dist', 'secret-santa', 'browser', 'assets', 'i18n'),
        join(__dirname, '..', 'browser', 'assets', 'i18n'),
        join(__dirname, '..', '..', 'browser', 'assets', 'i18n'),
      ];

      let enPath: string | null = null;
      let esPath: string | null = null;

      for (const basePath of possiblePaths) {
        const testEnPath = join(basePath, 'en.json');
        const testEsPath = join(basePath, 'es.json');
        try {
          // Try to read to verify file exists
          readFileSync(testEnPath, 'utf-8');
          readFileSync(testEsPath, 'utf-8');
          enPath = testEnPath;
          esPath = testEsPath;
          break;
        } catch {
          // Continue to next path
          continue;
        }
      }

      if (!enPath || !esPath) {
        throw new Error('Could not find translation files in any expected location');
      }

      const enTranslations = JSON.parse(readFileSync(enPath, 'utf-8'));
      const esTranslations = JSON.parse(readFileSync(esPath, 'utf-8'));

      translationService.loadTranslations('en', enTranslations);
      translationService.loadTranslations('es', esTranslations);
    } catch (error) {
      console.warn('Could not preload translations from filesystem:', error);
      // Load default translations as fallback to ensure SEO works
      const defaultEn = {
        seo: {
          defaultTitle: "Secret Santa Generator - Create Magical Gift Exchanges",
          defaultDescription: "Generate unique Secret Santa links for your friends and family. No email needed - share via WhatsApp! Create magical gift exchanges this Christmas."
        }
      };
      const defaultEs = {
        seo: {
          defaultTitle: "Generador de Amigo Invisible - Crea Intercambios de Regalos Mágicos",
          defaultDescription: "Genera enlaces únicos de Amigo Invisible para tus amigos y familia. ¡No se necesita correo electrónico - comparte por WhatsApp! Crea intercambios de regalos mágicos esta Navidad."
        }
      };
      translationService.loadTranslations('en', defaultEn);
      translationService.loadTranslations('es', defaultEs);
    }
  };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    {
      provide: APP_INITIALIZER,
      useFactory: preloadTranslationsFactory,
      deps: [TranslationService],
      multi: true
    }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
