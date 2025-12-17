import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SEOService } from '../../services/seo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css'
})
export class HowItWorksComponent implements OnInit {
  readonly #router = inject(Router);
  readonly #seoService = inject(SEOService);
  readonly #translationService = inject(TranslationService);

  ngOnInit(): void {
    // Set SEO for how-it-works page
    const url = typeof window !== 'undefined' ? window.location.href : 'https://secret-santa.banegasn.dev/how-it-works';
    const title = this.#translationService.translate('howItWorks.seoTitle');
    const description = this.#translationService.translate('howItWorks.seoDescription');

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

