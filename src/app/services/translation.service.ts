import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Language = 'en' | 'es';

export interface Translations {
  [key: string]: string | Translations;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  readonly #document = inject(DOCUMENT);
  readonly #translations = signal<Record<Language, Translations>>({ en: {}, es: {} });
  readonly #currentLanguage = signal<Language>('en');

  // Public readonly signal for current language (allows components to track changes)
  readonly currentLanguage = this.#currentLanguage.asReadonly();

  // Computed signal for current translations
  public t = computed(() => this.#translations()[this.#currentLanguage()]);

  constructor() {
    // Load language from localStorage or detect browser language
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
    // Check subdomain first to force language based on origin
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];

      // If subdomain starts with "secret-santa", force English
      if (subdomain.startsWith('secret-santa')) {
        this.#currentLanguage.set('en');
        return;
      }

      // If subdomain is "amigo-invisible", force Spanish
      if (subdomain === 'amigo-invisible') {
        this.#currentLanguage.set('es');
        return;
      }
    }

    // Fall back to localStorage preference
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('preferredLanguage') as Language;
      if (saved && (saved === 'en' || saved === 'es')) {
        this.#currentLanguage.set(saved);
        return;
      }
    }

    // Detect browser language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) {
        this.#currentLanguage.set('es');
      } else {
        this.#currentLanguage.set('en');
      }
    }
  }

  setLanguage(lang: Language): void {
    this.#currentLanguage.set(lang);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('preferredLanguage', lang);
    }
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
