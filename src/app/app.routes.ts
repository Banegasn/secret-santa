import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '', loadComponent() {
      return import('./components/home/home.component').then(m => m.HomeComponent);
    }
  },
  {
    path: 'results', loadComponent() {
      return import('./components/results/results.component').then(m => m.ResultsComponent);
    }
  },
  {
    path: 'reveal/:token', loadComponent() {
      return import('./components/reveal/reveal.component').then(m => m.RevealComponent);
    }
  },
  {
    path: 'how-it-works', loadComponent() {
      return import('./components/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent);
    }
  },
  {
    path: 'about', loadComponent() {
      return import('./components/about/about.component').then(m => m.AboutComponent);
    }
  },
  { path: '**', redirectTo: '' }
];
