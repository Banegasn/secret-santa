import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SecretSantaService } from '../../services/secret-santa.service';
import { SEOService } from '../../services/seo.service';
import { GiftSuggestionsComponent } from '../gift-suggestions/gift-suggestions.component';

@Component({
  selector: 'app-reveal',
  standalone: true,
  imports: [CommonModule, GiftSuggestionsComponent],
  templateUrl: './reveal.component.html',
  styleUrl: './reveal.component.css'
})
export class RevealComponent implements OnInit {
  assignedTo: string = '';
  participantName: string = '';
  isValid: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private secretSantaService: SecretSantaService,
    private seoService: SEOService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');

    if (!token) {
      this.errorMessage = 'Invalid link. Please check your Secret Santa link.';
      this.isLoading = false;
      return;
    }

    const decoded = this.secretSantaService.decodeToken(token);

    if (!decoded) {
      this.errorMessage = 'Invalid or corrupted link. Please contact the organizer.';
      this.isLoading = false;
      return;
    }

    this.participantName = decoded.name;
    this.assignedTo = decoded.assignedTo;
    this.isValid = true;
    this.isLoading = false;

    // Set SEO for reveal page with dynamic content
    const currentUrl = isPlatformBrowser(this.platformId) && typeof window !== 'undefined' ? window.location.href : '';
    
    this.seoService.setRevealPageSEO(
      this.participantName,
      this.assignedTo,
      currentUrl
    );
  }

  createNewExchange(): void {
    this.router.navigate(['/']);
  }
}

