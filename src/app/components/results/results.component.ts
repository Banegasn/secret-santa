import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SecretSantaService, Participant } from '../../services/secret-santa.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  readonly #secretSantaService = inject(SecretSantaService);
  readonly #router = inject(Router);
  readonly #translationService = inject(TranslationService);
  readonly #platformId = inject(PLATFORM_ID);
  #baseUrl: string = '';

  participants: Participant[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId)) {
      this.#router.navigate(['/']);
      return;
    }

    const stored = sessionStorage.getItem('secretSantaParticipants');

    if (!stored) {
      this.#router.navigate(['/']);
      return;
    }

    this.participants = JSON.parse(stored);
    this.#baseUrl = window.location.origin;
  }

  getUrl(token: string): string {
    return this.#secretSantaService.generateUrl(token, this.#baseUrl);
  }

  copyToClipboard(url: string, name: string, event?: Event): void {
    navigator.clipboard.writeText(url).then(() => {
      // Show feedback
      if (event) {
        const button = event.target as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✓';
          setTimeout(() => {
            button.textContent = originalText;
          }, 2000);
        }
      }
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  shareToWhatsApp(url: string, name: string): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }
    const messageText = this.#translationService.translate('results.whatsappMessage', { url });
    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  startOver(): void {
    if (isPlatformBrowser(this.#platformId)) {
      sessionStorage.removeItem('secretSantaParticipants');
    }
    this.#router.navigate(['/']);
  }
}

