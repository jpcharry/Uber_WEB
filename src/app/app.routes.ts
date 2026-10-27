import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'auth', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage) },
  { path: 'app', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'app' }
];
