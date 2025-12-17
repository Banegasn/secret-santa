import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SEOService } from '../../services/seo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  readonly #router = inject(Router);
  readonly #seoService = inject(SEOService);
  readonly #translationService = inject(TranslationService);

  ngOnInit(): void {
    // Set SEO for about page
    const url = typeof window !== 'undefined' ? window.location.href : 'https://secret-santa.banegasn.dev/about';
    const title = this.#translationService.translate('about.seoTitle');
    const description = this.#translationService.translate('about.seoDescription');

    this.#seoService.updateSEO({
      title,
      description,
      url
    });
  }

  goHome(): void {
    this.#router.navigate(['/']);
  }
}

