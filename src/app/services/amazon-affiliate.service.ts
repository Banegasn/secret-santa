import { Injectable } from '@angular/core';

export interface GiftIdea {
  label: string;
  searchTerm: string;
  emoji: string;
  interestKey?: string; // Optional key for interest-based matching
}

interface GiftCategory {
  label: string;
  searchTermTemplate: string; // Template that may include {year} placeholder
  emoji: string;
  interestKey?: string; // Key used for interest matching
  isBudget?: boolean; // Flag for budget categories
}

@Injectable({
  providedIn: 'root'
})
export class AmazonAffiliateService {
  // IMPORTANT: Your affiliate ID ends in -20, which is a US Amazon Associates ID.
  // If you want to support other marketplaces (e.g., Amazon.es for Spain),
  // you MUST set up OneLink in your Amazon Associates account backend.
  // OneLink automatically redirects users to their local Amazon marketplace
  // while preserving your affiliate tracking.
  // Without OneLink, using a US tag on non-US marketplaces may not attribute sales correctly.
  private readonly associateId = 'secretsantaba-20';
  
  // Centralized source of truth for all gift categories
  // To add a new category, just add it here - no need to update multiple places!
  private readonly giftCategories: GiftCategory[] = [
    { 
      label: 'Under $25', 
      searchTermTemplate: 'christmas gifts under 25 dollars', 
      emoji: '🎁',
      isBudget: true
    },
    { 
      label: 'Under $50', 
      searchTermTemplate: 'christmas gifts under 50 dollars', 
      emoji: '🎄',
      isBudget: true
    },
    { 
      label: 'Tech Gifts', 
      searchTermTemplate: 'tech gifts christmas', 
      emoji: '📱',
      interestKey: 'tech'
    },
    { 
      label: 'Books', 
      searchTermTemplate: 'bestselling books', 
      emoji: '📚',
      interestKey: 'reading'
    },
    { 
      label: 'Home Decor', 
      searchTermTemplate: 'home decor gifts christmas', 
      emoji: '🏠',
      interestKey: 'home'
    },
    { 
      label: 'Gourmet Food', 
      searchTermTemplate: 'gourmet food gift baskets', 
      emoji: '🍫',
      interestKey: 'cooking'
    },
    { 
      label: 'Beauty & Skincare', 
      searchTermTemplate: 'beauty gift sets christmas', 
      emoji: '💄',
      interestKey: 'beauty'
    },
    { 
      label: 'Sports & Fitness', 
      searchTermTemplate: 'fitness gifts christmas', 
      emoji: '⚽',
      interestKey: 'fitness'
    },
    { 
      label: 'Gaming', 
      searchTermTemplate: 'gaming accessories gifts', 
      emoji: '🎮',
      interestKey: 'gaming'
    },
    { 
      label: 'Fashion', 
      searchTermTemplate: 'fashion accessories gifts', 
      emoji: '👔',
      interestKey: 'fashion'
    }
  ];

  /**
   * Get current year for dynamic search terms
   * Note: We're using generic terms without year to avoid stale dates,
   * but this helper is available if you want to add year to specific searches
   */
  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Process search term template, replacing placeholders if needed
   */
  private processSearchTerm(template: string): string {
    // For now, we use generic terms without year to avoid stale dates
    // If you want to add year to specific searches, uncomment below:
    // return template.replace('{year}', this.getCurrentYear().toString());
    return template;
  }

  /**
   * Generate Amazon search URL with affiliate tag
   * 
   * IMPORTANT LOCALIZATION NOTE:
   * Your affiliate ID (secretsantaba-20) is US-specific.
   * If you change marketplace to 'es' (Spain) or other locales:
   * 1. You MUST set up OneLink in your Amazon Associates account
   * 2. OneLink will automatically redirect users to their local marketplace
   * 3. Without OneLink, sales may not be attributed correctly
   * 
   * @param searchTerm The search query
   * @param marketplace Amazon marketplace (default: 'com' for US)
   * @returns Amazon search URL with affiliate tag
   */
  generateAmazonSearchUrl(searchTerm: string, marketplace: string = 'com'): string {
    const baseUrl = marketplace === 'com' 
      ? 'https://www.amazon.com/s'
      : `https://www.amazon.${marketplace}/s`;
    
    const params = new URLSearchParams({
      k: searchTerm,
      tag: this.associateId,
      ref: 'sr_pg_1'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get budget-friendly gift ideas
   * Uses centralized giftCategories as source of truth
   */
  getGiftIdeas(): GiftIdea[] {
    return this.giftCategories.map(category => ({
      label: category.label,
      searchTerm: this.processSearchTerm(category.searchTermTemplate),
      emoji: category.emoji,
      interestKey: category.interestKey
    }));
  }

  /**
   * Get personalized gift suggestions based on interests
   * Uses centralized giftCategories for matching
   */
  getPersonalizedSuggestions(interests?: string[]): GiftIdea[] {
    if (!interests || interests.length === 0) {
      // Return first 6 by default (excluding budget options for personalized)
      return this.giftCategories
        .filter(cat => !cat.isBudget)
        .slice(0, 6)
        .map(category => ({
          label: category.label,
          searchTerm: this.processSearchTerm(category.searchTermTemplate),
          emoji: category.emoji,
          interestKey: category.interestKey
        }));
    }
    
    const suggestions: GiftIdea[] = [];
    
    // Match interests to categories using interestKey
    interests.forEach(interest => {
      const category = this.giftCategories.find(
        cat => cat.interestKey?.toLowerCase() === interest.toLowerCase()
      );
      
      if (category) {
        suggestions.push({
          label: category.label,
          searchTerm: this.processSearchTerm(category.searchTermTemplate),
          emoji: category.emoji,
          interestKey: category.interestKey
        });
      }
    });
    
    // Always add budget options at the end
    const budgetCategories = this.giftCategories.filter(cat => cat.isBudget);
    budgetCategories.forEach(category => {
      suggestions.push({
        label: category.label,
        searchTerm: this.processSearchTerm(category.searchTermTemplate),
        emoji: category.emoji,
        interestKey: category.interestKey
      });
    });
    
    return suggestions.length > 0 ? suggestions : this.getGiftIdeas().slice(0, 6);
  }

  /**
   * Helper to get emoji for an interest (uses centralized data)
   */
  getEmojiForInterest(interest: string): string {
    const category = this.giftCategories.find(
      cat => cat.interestKey?.toLowerCase() === interest.toLowerCase()
    );
    return category?.emoji || '🎁';
  }

  /**
   * Get all available interest keys (useful for future features)
   */
  getAvailableInterests(): string[] {
    return this.giftCategories
      .filter(cat => cat.interestKey)
      .map(cat => cat.interestKey!)
      .filter((key, index, self) => self.indexOf(key) === index); // Remove duplicates
  }
}
