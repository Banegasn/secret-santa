import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslationLoaderService } from './services/translation-loader.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly #translationLoader = inject(TranslationLoaderService);

  async ngOnInit(): Promise<void> {
    await this.#translationLoader.loadTranslations();
  }
}
