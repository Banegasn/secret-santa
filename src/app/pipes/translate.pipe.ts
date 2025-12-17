import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Make it impure so it reacts to language changes via signals
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, string> | string): string {
    if (!key) {
      return '';
    }

    // Read the signal to make this pipe reactive to language changes
    // When the language changes, the signal updates and Angular will re-evaluate this pipe
    this.translationService.t();

    if (typeof params === 'string') {
      return this.translationService.translate(key, { value: params });
    }

    return this.translationService.translate(key, params);
  }
}

