import { Component, viewChildren, effect, signal, ElementRef, afterRender, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SecretSantaService } from '../../services/secret-santa.service';
import { SEOService } from '../../services/seo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  readonly #secretSantaService = inject(SecretSantaService);
  readonly #router = inject(Router);
  readonly #seoService = inject(SEOService);
  readonly #translationService = inject(TranslationService);
  readonly #platformId = inject(PLATFORM_ID);

  inputs = viewChildren<ElementRef<HTMLInputElement>>('nameInput');
  names = signal<string[]>(['']);
  errorMessage = signal('');
  isLoading = signal(false);
  private shouldFocusNew = signal(false);
  private focusIndex = signal<number | null>(null);

  constructor() {
    // Watch for changes to focus inputs
    effect(() => {
      const inputElements = this.inputs();
      const namesLength = this.names().length;
      const shouldFocusNew = this.shouldFocusNew();
      const indexToFocus = this.focusIndex();
      
      if (inputElements.length > 0) {
        if (shouldFocusNew && inputElements.length === namesLength) {
          // Focus the last input when creating a new participant
          const lastElementRef = inputElements[inputElements.length - 1];
          if (lastElementRef?.nativeElement) {
            lastElementRef.nativeElement.focus();
            this.shouldFocusNew.set(false);
          }
        } else if (indexToFocus !== null && inputElements.length > indexToFocus) {
          // Focus a specific index (for navigating to next input)
          const elementRef = inputElements[indexToFocus];
          if (elementRef?.nativeElement) {
            elementRef.nativeElement.focus();
            this.focusIndex.set(null);
          }
        }
      }
    });
  }

  ngOnInit(): void {
    // Set SEO for home page
    this.#seoService.setHomePageSEO();
  }

  addName(): void {
    this.names.update(names => [...names, '']);
    this.errorMessage.set('');
    this.shouldFocusNew.set(true);
  }

  removeName(index: number): void {
    if (this.names().length > 1) {
      this.names.update(names => names.filter((_, i) => i !== index));
    }
    this.errorMessage.set('');
  }

  trackByIndex(index: number): number {
    return index;
  }

  generateSecretSanta(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    try {
      const validNames = this.names()
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (validNames.length < 2) {
        this.errorMessage.set(this.#translationService.translate('home.errorAtLeast2'));
        this.isLoading.set(false);
        return;
      }

      const participants = this.#secretSantaService.assignSecretSantas(validNames);
      
      // Store in sessionStorage for results page (only on browser)
      if (isPlatformBrowser(this.#platformId)) {
        sessionStorage.setItem('secretSantaParticipants', JSON.stringify(participants));
      }
      
      // Navigate to results page
      this.#router.navigate(['/results']);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : this.#translationService.translate('home.errorOccurred'));
      this.isLoading.set(false);
    }
  }

  onNameInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.names.update(names => {
      const updated = [...names];
      updated[index] = input.value;
      return updated;
    });
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Save current input value first
      const input = event.target as HTMLInputElement;
      this.names.update(names => {
        const updated = [...names];
        updated[index] = input.value;
        return updated;
      });
      
      const namesLength = this.names().length;
      const isLastInput = index === namesLength - 1;
      
      if (isLastInput) {
        // If it's the last input, create a new participant
        this.addName();
      } else {
        // If it's not the last input, focus the next one
        this.focusIndex.set(index + 1);
      }
    }
  }
}

