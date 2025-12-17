import { Component, computed, inject, signal, effect, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag?: string;
}

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {
  readonly #translationService = inject(TranslationService);
  readonly #elementRef = inject(ElementRef);
  
  currentLanguage = signal<Language>(this.#translationService.getCurrentLanguage());
  isOpen = signal(false);
  t = computed(() => this.#translationService.t());

  // Easily extensible list of languages
  readonly languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
    // Add more languages here as needed:
    // { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    // { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    // { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
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

  switchLanguage(lang: Language): void {
    this.#translationService.setLanguage(lang);
    this.currentLanguage.set(lang);
    this.isOpen.set(false);
  }

  toggleDropdown(): void {
    this.isOpen.update(open => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }
}

