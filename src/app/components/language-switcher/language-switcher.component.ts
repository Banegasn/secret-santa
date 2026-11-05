
import { Component, computed, effect, ElementRef, HostListener, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationLoaderService } from '../../services/translation-loader.service';
import { Language, TranslationService } from '../../services/translation.service';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag?: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {
  readonly #translationService = inject(TranslationService);
  readonly #translationLoader = inject(TranslationLoaderService);
  readonly #elementRef = inject(ElementRef);

  currentLanguage = signal<Language>(this.#translationService.getCurrentLanguage());
  isOpen = signal(false);
  t = computed(() => this.#translationService.t());
  isLoadingLanguage = signal(false);

  // Easily extensible list of languages
  readonly languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' }
  ];

  constructor() {
    // Sync with translation service language changes
    effect(() => {
      const lang = this.#translationService.currentLanguage();
      this.currentLanguage.set(lang);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.#elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  getCurrentLanguageOption(): LanguageOption {
    return this.languages.find(lang => lang.code === this.currentLanguage()) || this.languages[0];
  }

  async switchLanguage(lang: Language): Promise<void> {
    // If language is already loaded, switch immediately
    if (this.#translationLoader.isLanguageLoaded(lang)) {
      this.#translationService.setLanguage(lang);
      this.currentLanguage.set(lang);
      this.isOpen.set(false);
      return;
    }

    // Otherwise, load the language first (lazy loading)
    this.isLoadingLanguage.set(true);
    try {
      await this.#translationLoader.loadLanguage(lang);
      this.#translationService.setLanguage(lang);
      this.currentLanguage.set(lang);
      this.isOpen.set(false);
    } catch (error) {
      console.error(`Failed to load language ${lang}:`, error);
      // Fallback to current language on error
    } finally {
      this.isLoadingLanguage.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }
}

