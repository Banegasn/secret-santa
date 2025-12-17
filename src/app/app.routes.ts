import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ResultsComponent } from './components/results/results.component';
import { RevealComponent } from './components/reveal/reveal.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { AboutComponent } from './components/about/about.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'results', component: ResultsComponent },
  { path: 'reveal/:token', component: RevealComponent },
  { path: 'how-it-works', component: HowItWorksComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' }
];
