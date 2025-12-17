import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {
  readonly #translationService = inject(TranslationService);
  
  currentLanguage: Language;
  t = computed(() => this.#translationService.t());

  constructor() {
    this.currentLanguage = this.#translationService.getCurrentLanguage();
  }

  switchLanguage(lang: Language): void {
    this.#translationService.setLanguage(lang);
    this.currentLanguage = lang;
  }
}

