import { Component, Input, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmazonAffiliateService, GiftIdea } from '../../services/amazon-affiliate.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-gift-suggestions',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './gift-suggestions.component.html',
  styleUrl: './gift-suggestions.component.css'
})
export class GiftSuggestionsComponent implements OnInit {
  @Input() assignedToName: string = '';

  giftIdeas: GiftIdea[] = [];

  readonly #amazonService = inject(AmazonAffiliateService);
  readonly #translationService = inject(TranslationService);

  constructor() {
    // Update gift ideas when language changes
    effect(() => {
      // Track the current language signal to trigger updates
      this.#translationService.currentLanguage();
      this.updateGiftIdeas();
    });
  }

  ngOnInit(): void {
    this.updateGiftIdeas();
  }

  private updateGiftIdeas(): void {
    this.giftIdeas = this.#amazonService.getGiftIdeas();
  }

  openAmazonSearch(giftIdea: GiftIdea): void {
    const url = this.#amazonService.generateAmazonSearchUrl(giftIdea.searchTerm);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  getGiftTitle(): string {
    return this.#translationService.translate('giftSuggestions.title', { name: this.assignedToName });
  }
}

