import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationService, Language } from './translation.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationLoaderService {
  private http = inject(HttpClient);
  private translationService = inject(TranslationService);

  // Track which languages are currently being loaded to prevent duplicate requests
  private loadingLanguages = new Set<Language>();

  // Track which languages have been loaded
  private loadedLanguages = new Set<Language>();

  /**
   * Load the initial language (current language) on app startup
   */
  async loadInitialLanguage(): Promise<void> {
    const currentLang = this.translationService.getCurrentLanguage();
    await this.loadLanguage(currentLang);
  }

  /**
   * Lazy load a specific language if not already loaded
   * @param lang Language code to load
   * @returns Promise that resolves when the language is loaded
   */
  async loadLanguage(lang: Language): Promise<void> {
    // If already loaded in this service, return immediately
    if (this.loadedLanguages.has(lang)) {
      return;
    }

    // Check if TranslationService already has the translations (e.g. from SSR TransferState or preload)
    if (this.translationService.isLanguageLoaded(lang)) {
      this.loadedLanguages.add(lang);
      console.log(`[TranslationLoader] Language ${lang} already loaded in TranslationService, skipping HTTP request`);
      return;
    }

    // If currently loading, wait for the existing request
    if (this.loadingLanguages.has(lang)) {
      // Wait for the loading to complete by polling (with timeout)
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // 5 seconds max wait
        const checkInterval = setInterval(() => {
          attempts++;
          if (this.loadedLanguages.has(lang) || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
      });
    }

    // Mark as loading
    this.loadingLanguages.add(lang);

    try {
      // On browser, load asynchronously via HTTP
      // On server, translations are preloaded via APP_INITIALIZER in app.config.server.ts
      const translations = await firstValueFrom(
        this.http.get<any>(`/assets/i18n/${lang}.json`)
      );

      this.translationService.loadTranslations(lang, translations);
      this.loadedLanguages.add(lang);
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error);
      throw error; // Re-throw to let callers handle the error
    } finally {
      this.loadingLanguages.delete(lang);
    }
  }

  /**
   * Check if a language is already loaded
   * @param lang Language code to check
   * @returns true if the language is loaded
   */
  isLanguageLoaded(lang: Language): boolean {
    return this.loadedLanguages.has(lang);
  }

  /**
   * Preload multiple languages (useful for SSR or when you want to preload common languages)
   * @param languages Array of language codes to preload
   */
  async preloadLanguages(languages: Language[]): Promise<void> {
    const toLoad = languages.filter(lang => !this.loadedLanguages.has(lang));
    if (toLoad.length === 0) {
      return;
    }

    try {
      await Promise.all(toLoad.map(lang => this.loadLanguage(lang)));
    } catch (error) {
      console.error('Failed to preload some languages:', error);
    }
  }
}

