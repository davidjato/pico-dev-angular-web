import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { CookiesPolicyComponent } from './pages/cookies-policy.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent
  },
  {
    path: 'cookies-policy',
    component: CookiesPolicyComponent
  },
  {
    path: 'data-privacy-policy',
    component: PrivacyPolicyComponent
  }
];
