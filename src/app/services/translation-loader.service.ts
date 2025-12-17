import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationLoaderService {
  private http = inject(HttpClient);
  private translationService = inject(TranslationService);

  async loadTranslations(): Promise<void> {
    try {
      // On browser, load asynchronously via HTTP
      // On server, translations are preloaded via APP_INITIALIZER in app.config.server.ts
      const [enTranslations, esTranslations] = await Promise.all([
        firstValueFrom(this.http.get<any>('/assets/i18n/en.json')),
        firstValueFrom(this.http.get<any>('/assets/i18n/es.json'))
      ]);

      this.translationService.loadTranslations('en', enTranslations);
      this.translationService.loadTranslations('es', esTranslations);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }
}

