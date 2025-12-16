import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

export interface SEOData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SEOService {
  private readonly defaultTitle = 'Secret Santa Generator - Create Magical Gift Exchanges';
  private readonly defaultDescription = 'Generate unique Secret Santa links for your friends and family. No email needed - share via WhatsApp! Create magical gift exchanges this Christmas.';
  // Domain configuration
  // Recommended OG image size: 1200x630px
  private readonly fallbackBaseUrl = 'https://secret-santa.banegasn.dev';

  private getBaseUrl(): string {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      return window.location.origin;
    }
    // Fallback - update this to your production domain
    return this.fallbackBaseUrl;
  }

  private getDefaultImage(): string {
    return this.getBaseUrl() + '/assets/image.png';
  }

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  updateSEO(data: SEOData): void {
    const title = data.title || this.defaultTitle;
    const description = data.description || this.defaultDescription;
    const image = data.image || this.getDefaultImage();
    const url = data.url || (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' ? window.location.href : this.getBaseUrl());
    const type = data.type || 'website';

    // Update title
    this.title.setTitle(title);

    // Update or create meta tags
    this.updateOrAddTag({ name: 'title', content: title });
    this.updateOrAddTag({ name: 'description', content: description });

    // Open Graph tags
    this.updateOrAddTag({ property: 'og:title', content: title });
    this.updateOrAddTag({ property: 'og:description', content: description });
    this.updateOrAddTag({ property: 'og:image', content: image });
    this.updateOrAddTag({ property: 'og:url', content: url });
    this.updateOrAddTag({ property: 'og:type', content: type });

    // Twitter Card tags
    this.updateOrAddTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.updateOrAddTag({ name: 'twitter:title', content: title });
    this.updateOrAddTag({ name: 'twitter:description', content: description });
    this.updateOrAddTag({ name: 'twitter:image', content: image });
    this.updateOrAddTag({ name: 'twitter:url', content: url });

    // Canonical URL (link tag)
    this.updateCanonicalUrl(url);
  }

  private updateOrAddTag(tag: { name?: string; property?: string; content: string }): void {
    try {
      const selector = tag.name ? `name="${tag.name}"` : `property="${tag.property}"`;
      const existingTag = this.meta.getTag(selector);
      if (!existingTag) {
        this.meta.addTag(tag);
      } else {
        this.meta.updateTag(tag);
      }
    } catch (error) {
      // Fallback: try to add tag directly
      try {
        this.meta.addTag(tag);
      } catch (e) {
        console.warn('Failed to update meta tag:', tag, e);
      }
    }
  }

  private updateCanonicalUrl(url: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server side
    }

    // Remove existing canonical link if any
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }

  addStructuredData(data: {
    type: 'WebApplication' | 'Article' | 'WebPage';
    name: string;
    description: string;
    url: string;
    [key: string]: any;
  }): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // Skip on server side
    }

    // Remove existing structured data if any
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    const { name, description, url, type, ...rest } = data;
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      name,
      description,
      url,
      ...rest
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }

  setHomePageSEO(): void {
    const url = isPlatformBrowser(this.platformId) && typeof window !== 'undefined' ? window.location.href : this.getBaseUrl();

    this.updateSEO({
      title: this.defaultTitle,
      description: this.defaultDescription,
      url
    });

    // Add structured data for home page
    this.addStructuredData({
      type: 'WebApplication',
      name: 'Secret Santa Generator',
      description: this.defaultDescription,
      url,
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    } as any);
  }

  setRevealPageSEO(participantName: string, assignedTo: string, url: string): void {
    const title = `${participantName}'s Secret Santa Reveal`;
    const description = `🎅 ${participantName}, you're giving a gift to ${assignedTo} this Christmas! Discover your Secret Santa match.`;

    // Use a more generic image for reveal pages or generate one dynamically
    const revealImage = this.getDefaultImage(); // You could generate a dynamic image here

    this.updateSEO({
      title,
      description,
      url,
      image: revealImage,
      type: 'article'
    });

    // Add structured data for reveal page
    this.addStructuredData({
      type: 'Article',
      name: title,
      headline: title,
      description: description,
      url,
      author: {
        '@type': 'Person',
        name: participantName
      },
      datePublished: new Date().toISOString()
    } as any);
  }
}

