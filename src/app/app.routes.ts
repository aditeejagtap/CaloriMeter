import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] 

  },
  
  { path: 'log', loadComponent: () => import('./pages/log/log.component').then(m => m.LogComponent), canActivate: [authGuard]

   },

  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },

  { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent), canActivate: [authGuard] 
  
  },

  { path: 'plan', loadComponent: () => import('./pages/plan/plan.component').then(m => m.PlanComponent), canActivate: [authGuard] 

  },

  { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] 

  },

  { path: 'progress', loadComponent: () => import('./pages/progress/progress.component').then(m => m.ProgressComponent), canActivate: [authGuard] 

  },



];
  