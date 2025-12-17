import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Participant, SecretSantaService } from '../../services/secret-santa.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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
  customMessage: string = '';

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

    const data = JSON.parse(stored);
    // Support both old format (array) and new format (object with participants and customMessage)
    if (Array.isArray(data)) {
      this.participants = data;
      this.customMessage = '';
    } else {
      this.participants = data.participants || [];
      this.customMessage = data.customMessage || '';
    }
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

    let messageText: string;

    // Use custom message if provided, otherwise use default message
    if (this.customMessage && this.customMessage.trim()) {
      // Replace {{url}} placeholder in custom message if present, otherwise append URL
      messageText = this.customMessage.includes('{{url}}')
        ? this.customMessage.replace('{{url}}', url)
        : `${this.customMessage}\n\n${url}`;
    } else {
      messageText = this.#translationService.translate('results.whatsappMessage', { url });
    }

    const message = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  onCustomMessageChange(): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    // Update sessionStorage with the new custom message
    const stored = sessionStorage.getItem('secretSantaParticipants');
    if (stored) {
      const data = JSON.parse(stored);
      if (Array.isArray(data)) {
        // Convert old format to new format
        sessionStorage.setItem('secretSantaParticipants', JSON.stringify({
          participants: data,
          customMessage: this.customMessage
        }));
      } else {
        // Update existing object
        data.customMessage = this.customMessage;
        sessionStorage.setItem('secretSantaParticipants', JSON.stringify(data));
      }
    }
  }

  startOver(): void {
    if (isPlatformBrowser(this.#platformId)) {
      sessionStorage.removeItem('secretSantaParticipants');
    }
    this.#router.navigate(['/']);
  }
}

