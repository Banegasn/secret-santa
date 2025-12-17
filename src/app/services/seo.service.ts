import { Injectable, inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { TranslationService } from './translation.service';

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
  readonly #title = inject(Title);
  readonly #meta = inject(Meta);
  readonly #translationService = inject(TranslationService);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #document = inject(DOCUMENT);
  readonly #request = inject(REQUEST, { optional: true });

  private readonly fallbackBaseUrl = 'https://secret-santa.banegasn.dev';

  private getDefaultTitle(): string {
    return this.#translationService.translate('seo.defaultTitle');
  }

  private getDefaultDescription(): string {
    return this.#translationService.translate('seo.defaultDescription');
  }

  private getBaseUrl(): string {
    if (isPlatformBrowser(this.#platformId) && typeof window !== 'undefined') {
      return window.location.origin;
    }

    // During SSR, try to get URL from REQUEST
    if (isPlatformServer(this.#platformId) && this.#request) {
      const protocol = (this.#request as any).protocol || 'https';
      const host = (this.#request as any).headers?.host || '';
      if (host) {
        return `${protocol}://${host}`;
      }
    }

    return this.fallbackBaseUrl;
  }

  private getCurrentUrl(): string {
    if (isPlatformBrowser(this.#platformId) && typeof window !== 'undefined') {
      return window.location.href;
    }

    // During SSR, construct URL from REQUEST
    if (isPlatformServer(this.#platformId) && this.#request) {
      const req = this.#request as any;
      const protocol = req.protocol || 'https';
      const host = req.headers?.host || '';
      const originalUrl = req.originalUrl || req.url || '/';
      if (host) {
        return `${protocol}://${host}${originalUrl}`;
      }
    }

    return this.getBaseUrl();
  }

  private getDefaultImage(): string {
    return this.getBaseUrl() + '/assets/image.png';
  }

  updateSEO(data: SEOData): void {

    const title = data.title || this.getDefaultTitle();
    const description = data.description || this.getDefaultDescription();
    const image = data.image || this.getDefaultImage();
    const url = (data.url && data.url.trim()) ? data.url : this.getCurrentUrl();
    const type = data.type || 'website';

    // Update locale based on current language
    const currentLang = this.#translationService.getCurrentLanguage();
    const locale = currentLang === 'es' ? 'es_ES' : 'en_US';

    // Update title
    this.#title.setTitle(title);

    // Update or create meta tags
    this.updateOrAddTag({ name: 'title', content: title });
    this.updateOrAddTag({ name: 'description', content: description });

    // Open Graph tags
    this.updateOrAddTag({ property: 'og:title', content: title });
    this.updateOrAddTag({ property: 'og:description', content: description });
    this.updateOrAddTag({ property: 'og:image', content: image });
    this.updateOrAddTag({ property: 'og:url', content: url });
    this.updateOrAddTag({ property: 'og:type', content: type });
    this.updateOrAddTag({ property: 'og:locale', content: locale });

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
      const existingTag = this.#meta.getTag(selector);
      if (!existingTag) {
        this.#meta.addTag(tag);
      } else {
        this.#meta.updateTag(tag);
      }
    } catch (error) {
      // Fallback: try to add tag directly
      try {
        this.#meta.addTag(tag);
      } catch (e) {
        console.warn('Failed to update meta tag:', tag, e);
      }
    }
  }

  private updateCanonicalUrl(url: string): void {
    // Remove existing canonical link if any
    const existingCanonical = this.#document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const link = this.#document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    this.#document.head.appendChild(link);
  }

  addStructuredData(data: {
    type: 'WebApplication' | 'Article' | 'WebPage';
    name: string;
    description: string;
    url: string;
    [key: string]: any;
  }): void {

    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    const existingScript = this.#document.querySelector('script[type="application/ld+json"]');
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

    const script = this.#document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    this.#document.head.appendChild(script);
  }

  setHomePageSEO(): void {
    const url = this.getCurrentUrl();
    const title = this.getDefaultTitle();
    const description = this.getDefaultDescription();

    this.updateSEO({
      title,
      description,
      url
    });

    const appTitle = this.#translationService.translate('app.title');

    this.addStructuredData({
      type: 'WebApplication',
      name: appTitle,
      description: description,
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
    const title = this.#translationService.translate('seo.revealTitle', { participantName });
    const description = this.#translationService.translate('seo.revealDescription', { participantName, assignedTo });

    const revealImage = this.getDefaultImage();

    this.updateSEO({
      title,
      description,
      url,
      image: revealImage,
      type: 'article'
    });

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

