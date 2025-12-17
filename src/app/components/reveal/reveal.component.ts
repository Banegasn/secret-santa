import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SecretSantaService } from '../../services/secret-santa.service';
import { SEOService } from '../../services/seo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { GiftSuggestionsComponent } from '../gift-suggestions/gift-suggestions.component';

@Component({
  selector: 'app-reveal',
  standalone: true,
  imports: [CommonModule, TranslatePipe, GiftSuggestionsComponent],
  templateUrl: './reveal.component.html',
  styleUrl: './reveal.component.css'
})
export class RevealComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #secretSantaService = inject(SecretSantaService);
  readonly #seoService = inject(SEOService);
  readonly #translationService = inject(TranslationService);
  readonly #platformId = inject(PLATFORM_ID);

  assignedTo: string = '';
  participantName: string = '';
  isValid: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';

  ngOnInit(): void {
    const token = this.#route.snapshot.paramMap.get('token');

    if (!token) {
      this.errorMessage = this.#translationService.translate('reveal.invalidLink');
      this.isLoading = false;
      return;
    }

    const decoded = this.#secretSantaService.decodeToken(token);

    if (!decoded) {
      this.errorMessage = this.#translationService.translate('reveal.invalidCorrupted');
      this.isLoading = false;
      return;
    }

    this.participantName = decoded.name;
    this.assignedTo = decoded.assignedTo;
    this.isValid = true;
    this.isLoading = false;

    const currentUrl = isPlatformBrowser(this.#platformId) && typeof window !== 'undefined' ? window.location.href : undefined;

    this.#seoService.setRevealPageSEO(
      this.participantName,
      this.assignedTo,
      currentUrl || ''
    );
  }

  createNewExchange(): void {
    this.#router.navigate(['/']);
  }
}

