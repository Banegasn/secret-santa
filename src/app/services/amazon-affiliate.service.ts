import { Injectable, inject } from '@angular/core';
import { TranslationService } from './translation.service';

export interface GiftIdea {
  label: string;
  searchTerm: string;
  emoji: string;
  interestKey?: string; // Optional key for interest-based matching
}

interface GiftCategory {
  labelKey: string; // Translation key for the label
  searchTermKey: string; // Translation key for the search term
  emoji: string;
  interestKey?: string; // Key used for interest matching
  isBudget?: boolean; // Flag for budget categories
}

@Injectable({
  providedIn: 'root'
})
export class AmazonAffiliateService {
  readonly #translationService = inject(TranslationService);
  // Map of marketplace domains to their corresponding affiliate IDs
  // Each marketplace requires its own Amazon Associates account
  private readonly affiliateIds: Record<string, string> = {
    'com': 'secretsantaba-20',    // US
    'es': 'secretsanta09-21',     // Spain
    // Add more marketplace-specific IDs as needed
    // 'co.uk': 'your-uk-id',
    // 'fr': 'your-fr-id',
    // etc.
  };

  // Default affiliate ID (US) - used as fallback
  private readonly defaultAssociateId = 'secretsantaba-20';

  // Map of locale codes to Amazon marketplace domains
  private readonly marketplaceMap: Record<string, string> = {
    'es': 'es',      // Spain
    'en': 'com',     // US (default)
    'en-us': 'com',  // US
    'en-gb': 'co.uk', // UK
    'fr': 'fr',      // France
    'de': 'de',      // Germany
    'it': 'it',      // Italy
    'pt': 'es',      // Portugal (using Spain marketplace)
    'nl': 'nl',      // Netherlands
    'pl': 'pl',      // Poland
    'ca': 'ca',      // Canada
    'au': 'com.au',  // Australia
    'jp': 'co.jp',   // Japan
    'mx': 'com.mx',  // Mexico
    'br': 'com.br',  // Brazil
    'in': 'in',      // India
  };

  // Centralized source of truth for all gift categories
  // To add a new category, just add it here - no need to update multiple places!
  // Labels and search terms are translated using TranslationService
  private readonly giftCategories: GiftCategory[] = [
    {
      labelKey: 'giftSuggestions.categories.under25',
      searchTermKey: 'giftSuggestions.searchTerms.under25',
      emoji: '🎁',
      isBudget: true
    },
    {
      labelKey: 'giftSuggestions.categories.under50',
      searchTermKey: 'giftSuggestions.searchTerms.under50',
      emoji: '🎄',
      isBudget: true
    },
    {
      labelKey: 'giftSuggestions.categories.tech',
      searchTermKey: 'giftSuggestions.searchTerms.tech',
      emoji: '📱',
      interestKey: 'tech'
    },
    {
      labelKey: 'giftSuggestions.categories.books',
      searchTermKey: 'giftSuggestions.searchTerms.books',
      emoji: '📚',
      interestKey: 'reading'
    },
    {
      labelKey: 'giftSuggestions.categories.homeDecor',
      searchTermKey: 'giftSuggestions.searchTerms.homeDecor',
      emoji: '🏠',
      interestKey: 'home'
    },
    {
      labelKey: 'giftSuggestions.categories.gourmetFood',
      searchTermKey: 'giftSuggestions.searchTerms.gourmetFood',
      emoji: '🍫',
      interestKey: 'cooking'
    },
    {
      labelKey: 'giftSuggestions.categories.beauty',
      searchTermKey: 'giftSuggestions.searchTerms.beauty',
      emoji: '💄',
      interestKey: 'beauty'
    },
    {
      labelKey: 'giftSuggestions.categories.sports',
      searchTermKey: 'giftSuggestions.searchTerms.sports',
      emoji: '⚽',
      interestKey: 'fitness'
    },
    {
      labelKey: 'giftSuggestions.categories.gaming',
      searchTermKey: 'giftSuggestions.searchTerms.gaming',
      emoji: '🎮',
      interestKey: 'gaming'
    },
    {
      labelKey: 'giftSuggestions.categories.fashion',
      searchTermKey: 'giftSuggestions.searchTerms.fashion',
      emoji: '👔',
      interestKey: 'fashion'
    }
  ];

  /**
   * Detect user's locale and return corresponding Amazon marketplace
   * Uses the translation service's current language, falling back to browser language
   * Falls back to 'com' (US) if locale is not mapped
   */
  private detectMarketplace(): string {
    // First, try to use the translation service's current language
    const currentLang = this.#translationService.getCurrentLanguage();
    if (currentLang && this.marketplaceMap[currentLang]) {
      return this.marketplaceMap[currentLang];
    }

    // Fall back to browser language detection
    if (typeof navigator === 'undefined' || !navigator.language) {
      return 'com'; // Default to US
    }

    const browserLang = navigator.language.toLowerCase();

    // Check for exact match first
    if (this.marketplaceMap[browserLang]) {
      return this.marketplaceMap[browserLang];
    }

    // Check for language code match (e.g., 'es' from 'es-ES')
    const langCode = browserLang.split('-')[0];
    if (this.marketplaceMap[langCode]) {
      return this.marketplaceMap[langCode];
    }

    // Default to US marketplace
    return 'com';
  }

  /**
   * Get the affiliate ID for a specific marketplace
   * Falls back to default (US) affiliate ID if marketplace-specific ID is not configured
   */
  private getAffiliateId(marketplace: string): string {
    return this.affiliateIds[marketplace] || this.defaultAssociateId;
  }

  /**
   * Get current year for dynamic search terms
   * Note: We're using generic terms without year to avoid stale dates,
   * but this helper is available if you want to add year to specific searches
   */
  private getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Translate a category label or search term
   */
  private translate(key: string): string {
    return this.#translationService.translate(key);
  }

  /**
   * Generate Amazon search URL with affiliate tag
   * 
   * Automatically uses the correct affiliate ID for each marketplace.
   * Each marketplace requires its own Amazon Associates account.
   * 
   * @param searchTerm The search query
   * @param marketplace Amazon marketplace (default: auto-detected from browser locale)
   * @returns Amazon search URL with marketplace-specific affiliate tag
   */
  generateAmazonSearchUrl(searchTerm: string, marketplace?: string): string {
    // Auto-detect marketplace if not provided
    const detectedMarketplace = marketplace || this.detectMarketplace();

    // Get the correct affiliate ID for this marketplace
    const affiliateId = this.getAffiliateId(detectedMarketplace);

    const baseUrl = detectedMarketplace === 'com'
      ? 'https://www.amazon.com/s'
      : `https://www.amazon.${detectedMarketplace}/s`;

    const params = new URLSearchParams({
      k: searchTerm,
      tag: affiliateId,
      ref: 'sr_pg_1'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get budget-friendly gift ideas
   * Uses centralized giftCategories as source of truth
   * Labels and search terms are translated based on current language
   */
  getGiftIdeas(): GiftIdea[] {
    return this.giftCategories.map(category => ({
      label: this.translate(category.labelKey),
      searchTerm: this.translate(category.searchTermKey),
      emoji: category.emoji,
      interestKey: category.interestKey
    }));
  }

  /**
   * Get personalized gift suggestions based on interests
   * Uses centralized giftCategories for matching
   * Labels and search terms are translated based on current language
   */
  getPersonalizedSuggestions(interests?: string[]): GiftIdea[] {
    if (!interests || interests.length === 0) {
      // Return first 6 by default (excluding budget options for personalized)
      return this.giftCategories
        .filter(cat => !cat.isBudget)
        .slice(0, 6)
        .map(category => ({
          label: this.translate(category.labelKey),
          searchTerm: this.translate(category.searchTermKey),
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
          label: this.translate(category.labelKey),
          searchTerm: this.translate(category.searchTermKey),
          emoji: category.emoji,
          interestKey: category.interestKey
        });
      }
    });

    // Always add budget options at the end
    const budgetCategories = this.giftCategories.filter(cat => cat.isBudget);
    budgetCategories.forEach(category => {
      suggestions.push({
        label: this.translate(category.labelKey),
        searchTerm: this.translate(category.searchTermKey),
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
