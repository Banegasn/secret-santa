import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SecretSantaService, Participant } from '../../services/secret-santa.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  participants: Participant[] = [];
  baseUrl: string = '';

  constructor(
    private secretSantaService: SecretSantaService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Get participants from sessionStorage (only on browser)
    if (!isPlatformBrowser(this.platformId)) {
      // On server side, redirect to home
      this.router.navigate(['/']);
      return;
    }

    const stored = sessionStorage.getItem('secretSantaParticipants');
    if (!stored) {
      this.router.navigate(['/']);
      return;
    }

    this.participants = JSON.parse(stored);
    this.baseUrl = window.location.origin;
  }

  getUrl(token: string): string {
    return this.secretSantaService.generateUrl(token, this.baseUrl);
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
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const message = encodeURIComponent(`Your Secret Santa link is ready! Click here to find out who you're giving a gift to: ${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  startOver(): void {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('secretSantaParticipants');
    }
    this.router.navigate(['/']);
  }
}

