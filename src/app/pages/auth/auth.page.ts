import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonSpinner, IonSegment, IonSegmentButton,
  IonLabel, IonInput, IonNote
} from '@ionic/angular';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ApiService, apiError } from '../../core/api.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonButton, IonIcon, IonSpinner,
    IonSegment, IonSegmentButton, IonLabel, IonInput, IonNote],
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss'
})
export class AuthPage implements OnInit {
  page: 'login' | 'register' = 'login';
  loginForm = { login: '', password: '' };
  registerForm = {
    name: '', email: '', phone: '', password: '', role: 'client' as Role,
    license_number: '', plate: '', brand: '', model: '', year: new Date().getFullYear(), capacity: 4, color: ''
  };
  busy = false;
  message = '';
  health: 'checking' | 'ok' | 'db' | 'offline' = 'checking';

  constructor(private readonly auth: AuthService, private readonly api: ApiService, private readonly router: Router) {}
  ngOnInit(): void { this.checkApi(); }

  checkApi(): void {
    this.api.get('/fares/active').subscribe({
      next: () => this.health = 'ok',
      error: (error: unknown) => {
        this.health = /PostgreSQL|5432/.test(apiError(error)) ? 'db' : 'offline';
      }
    });
  }
  setPage(page: 'login' | 'register'): void { this.page = page; this.message = ''; }

  login(): void {
    this.message = '';
    if (!this.loginForm.login.trim() || !this.loginForm.password) { this.message = 'Escribe tu correo o teléfono y contraseña.'; return; }
    this.busy = true;
    this.auth.login(this.loginForm.login.trim(), this.loginForm.password)
      .pipe(finalize(() => this.busy = false))
      .subscribe({
        next: () => void this.router.navigateByUrl('/app', { replaceUrl: true }),
        error: (error: unknown) => this.message = apiError(error)
      });
  }

  register(): void {
    this.message = '';
    const f = this.registerForm;
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim() || f.password.length < 8) {
      this.message = 'Completa nombre, correo, teléfono y una contraseña de mínimo 8 caracteres.';
      return;
    }
    if (f.role === 'driver' && (!f.license_number || !f.plate || !f.brand || !f.model || !f.year || !f.capacity || !f.color)) {
      this.message = 'Completa la licencia y los datos del vehículo.';
      return;
    }
    const body: Record<string, unknown> = {
      name: f.name, email: f.email, phone: f.phone, password: f.password, role: f.role
    };
    if (f.role === 'driver') Object.assign(body, {
      license_number: f.license_number, plate: f.plate, brand: f.brand, model: f.model,
      year: Number(f.year), capacity: Number(f.capacity), color: f.color
    });
    this.busy = true;
    this.auth.register(body).pipe(finalize(() => this.busy = false)).subscribe({
      next: () => void this.router.navigateByUrl('/app', { replaceUrl: true }),
      error: (error: unknown) => this.message = apiError(error)
    });
  }
}
