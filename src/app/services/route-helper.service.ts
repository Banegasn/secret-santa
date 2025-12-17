import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class RouteHelperService {
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #translationService = inject(TranslationService);

  /**
   * Get the current language from the route or translation service
   */
  getCurrentLanguage(): string {
    // First try to get from route params
    const routeLang = this.#route.snapshot.firstChild?.params['lang'] ||
      this.#route.snapshot.params['lang'];
    if (routeLang) {
      return routeLang;
    }
    // Fallback to translation service
    return this.#translationService.getCurrentLanguage();
  }

  /**
   * Generate a route array with language prefix
   * @param path Route path (without language prefix)
   * @param params Optional route parameters
   * @returns Route array with language prefix
   */
  getRoute(path: string | string[], params?: Record<string, string>): any[] {
    const lang = this.getCurrentLanguage();
    const pathArray = Array.isArray(path) ? path : [path];

    // Build route array with language
    const route: any[] = [lang, ...pathArray];

    // Add query params if provided
    if (params) {
      route.push(params);
    }

    return route;
  }

  /**
   * Navigate to a route with language prefix
   * @param path Route path (without language prefix)
   * @param params Optional route parameters
   */
  navigate(path: string | string[], params?: Record<string, string>): Promise<boolean> {
    const route = this.getRoute(path, params);
    return this.#router.navigate(route);
  }
}

