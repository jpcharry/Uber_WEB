import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(this.storedUser());
  private token = sessionStorage.getItem('ruta_jwt');
  constructor(private readonly api: ApiService, private readonly router: Router) {}

  getToken(): string | null { return this.token; }
  isAuthenticated(): boolean { return Boolean(this.token); }

  login(login: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { login, password }).pipe(tap(res => this.store(res)));
  }
  register(data: Record<string, unknown>): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', data).pipe(tap(res => this.store(res)));
  }
  profile(): Observable<{ success: boolean; user: User }> {
    return this.api.get<{ success: boolean; user: User }>('/auth/me').pipe(tap(res => {
      this.user.set(res.user);
      sessionStorage.setItem('ruta_user', JSON.stringify(res.user));
    }));
  }
  logout(): void {
    if (this.token) this.api.post('/auth/logout', {}).subscribe({ error: () => undefined });
    this.clear();
    void this.router.navigateByUrl('/auth', { replaceUrl: true });
  }
  clear(): void {
    this.token = null;
    this.user.set(null);
    sessionStorage.removeItem('ruta_jwt');
    sessionStorage.removeItem('ruta_user');
    sessionStorage.removeItem('ruta_driver_trip');
  }
  private store(response: AuthResponse): void {
    this.token = response.access_token;
    this.user.set(response.user);
    sessionStorage.setItem('ruta_jwt', response.access_token);
    sessionStorage.setItem('ruta_user', JSON.stringify(response.user));
  }
  private storedUser(): User | null {
    try { return JSON.parse(sessionStorage.getItem('ruta_user') || 'null') as User | null; }
    catch { return null; }
  }
}
