import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmazonAffiliateService, GiftIdea } from '../../services/amazon-affiliate.service';

@Component({
  selector: 'app-gift-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gift-suggestions.component.html',
  styleUrl: './gift-suggestions.component.css'
})
export class GiftSuggestionsComponent implements OnInit {
  @Input() assignedToName: string = '';
  
  giftIdeas: GiftIdea[] = [];

  constructor(private amazonService: AmazonAffiliateService) {}

  ngOnInit(): void {
    // Load gift ideas
    this.giftIdeas = this.amazonService.getGiftIdeas();
  }

  openAmazonSearch(giftIdea: GiftIdea): void {
    const url = this.amazonService.generateAmazonSearchUrl(giftIdea.searchTerm);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

