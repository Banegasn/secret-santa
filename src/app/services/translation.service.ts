import { Injectable, signal, computed, effect, inject, makeStateKey, TransferState, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'nl' | 'pl';

const VALID_LANGUAGES: Language[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'nl', 'pl'];

export const INITIAL_LANGUAGE = makeStateKey<Language>('INITIAL_LANGUAGE');
export const TRANSLATIONS_STATE = makeStateKey<Record<Language, Translations>>('TRANSLATIONS_STATE');

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  readonly #document = inject(DOCUMENT);
  readonly #transferState = inject(TransferState);
  readonly #translations = signal<Record<Language, Translations>>({
    en: {}, es: {}, fr: {}, de: {}, it: {}, pt: {}, ja: {}, nl: {}, pl: {}
  });
  readonly #platformId = inject(PLATFORM_ID);

  readonly #currentLanguage = signal<Language>('en');

  // Public readonly signal for current language (allows components to track changes)
  readonly currentLanguage = this.#currentLanguage.asReadonly();

  // Computed signal for current translations
  public t = computed(() => this.#translations()[this.#currentLanguage()]);

  constructor() {
    // Load translations from TransferState if available (SSR -> Client transfer)
    if (this.#transferState.hasKey(TRANSLATIONS_STATE)) {
      const transferredTranslations = this.#transferState.get(TRANSLATIONS_STATE, {} as Record<Language, Translations>);
      // Load all transferred translations
      Object.entries(transferredTranslations).forEach(([lang, translations]) => {
        if (translations && Object.keys(translations).length > 0) {
          this.#translations.update(current => ({
            ...current,
            [lang as Language]: translations
          }));
        }
      });
      console.log(`[Client] Loaded translations from TransferState for languages:`, Object.keys(transferredTranslations));
    }

    this.initializeLanguage();

    // Update HTML lang attribute when language changes
    effect(() => {
      const lang = this.#currentLanguage();
      if (this.#document.documentElement) {
        this.#document.documentElement.lang = lang;
      }
    });
  }

  private initializeLanguage(): void {
    if (isPlatformBrowser(this.#platformId) && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const hlParam = urlParams.get('hl');

      if (hlParam && VALID_LANGUAGES.includes(hlParam as Language)) {
        this.#currentLanguage.set(hlParam as Language);
        if (window.localStorage) {
          localStorage.setItem('preferredLanguage', hlParam);
        }
        console.log(`[Client] Language set from hl query param: ${hlParam}`);
        return;
      }
    }

    if (isPlatformBrowser(this.#platformId) && window.localStorage) {
      const preferredLanguage = localStorage.getItem('preferredLanguage');
      if (preferredLanguage && VALID_LANGUAGES.includes(preferredLanguage as Language)) {
        this.#currentLanguage.set(preferredLanguage as Language);
        console.log(`[Client] Language set from localStorage: ${preferredLanguage}`);
        return;
      }
    }

    if (this.#transferState.hasKey(INITIAL_LANGUAGE)) {
      const transferredLang = this.#transferState.get(INITIAL_LANGUAGE, 'en');
      if (transferredLang && VALID_LANGUAGES.includes(transferredLang)) {
        this.#currentLanguage.set(transferredLang);
        console.log(`[Client] Language set from TransferState: ${transferredLang}`);
        return;
      }
    }

    if (isPlatformBrowser(this.#platformId)) {
      const navigatorLanguage = navigator.language;
      const language = navigatorLanguage.split('-')[0] as Language;
      if (language && VALID_LANGUAGES.includes(language)) {
        this.#currentLanguage.set(language);
        console.log(`[Client] Language set from navigator.language: ${language}`);
        return;
      }
    }

    this.#currentLanguage.set('en');
    console.log(`[Client] Language defaulted to 'en' (no TransferState available)`);
  }

  setLanguage(lang: Language): void {
    this.#currentLanguage.set(lang);

    // Immediately update HTML lang attribute (works in both SSR and browser)
    if (this.#document.documentElement) {
      this.#document.documentElement.lang = lang;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferredLanguage', lang);
    }
  }

  /**
   * Check if translations for a language are loaded
   * @param lang Language code to check
   * @returns true if translations are loaded (non-empty)
   */
  isLanguageLoaded(lang: Language): boolean {
    const translations = this.#translations()[lang];
    return translations && Object.keys(translations).length > 0;
  }

  getCurrentLanguage(): Language {
    return this.#currentLanguage();
  }

  translate(key: string, params?: Record<string, string>): string {
    const translations = this.t();
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return value;
  }

  loadTranslations(lang: Language, translations: Translations): void {
    this.#translations.update(current => ({
      ...current,
      [lang]: translations
    }));
  }
}
