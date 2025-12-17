import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from './components/language-switcher/language-switcher.component';
import { TranslationLoaderService } from './services/translation-loader.service';
import { TranslatePipe } from './pipes/translate.pipe';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, LanguageSwitcherComponent, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly #translationLoader = inject(TranslationLoaderService);

  async ngOnInit(): Promise<void> {
    await this.#translationLoader.loadInitialLanguage();
  }
}
