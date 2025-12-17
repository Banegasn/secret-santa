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
    // URL will be determined by SEO service to match current subdomain
    const title = this.#translationService.translate('about.seoTitle');
    const description = this.#translationService.translate('about.seoDescription');

    this.#seoService.updateSEO({
      title,
      description
    });
  }

  goHome(): void {
    this.#router.navigate(['/']);
  }
}

