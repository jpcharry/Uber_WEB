import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// URL relativa: Angular reenvía /api/** a la API remota mediante proxy.conf.json.
// No se crea una segunda API ni una base de datos local.
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}
  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    let query = new HttpParams();
    Object.entries(params || {}).forEach(([k, v]) => query = query.set(k, String(v)));
    return this.http.get<T>(`/api${path}`, { params: query });
  }
  post<T>(path: string, body: unknown): Observable<T> { return this.http.post<T>(`/api${path}`, body); }
  put<T>(path: string, body: unknown): Observable<T> { return this.http.put<T>(`/api${path}`, body); }
  patch<T>(path: string, body: unknown): Observable<T> { return this.http.patch<T>(`/api${path}`, body); }
}

export function apiError(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) return 'Se produjo un error inesperado.';
  if (error.status === 0 || error.status === 504 || error.status === 502) return 'No se pudo conectar con la API. Verifica la red y el servidor del profesor.';
  const data: unknown = error.error;
  const payload = typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
  const raw = String(payload['message'] || (typeof data === 'string' ? data : ''));
  if (/SQLSTATE\[08006\]|connection refused|port 5432 failed|uber_db/i.test(raw)) {
    return 'La API responde, pero PostgreSQL del servidor no está disponible (127.0.0.1:5432).';
  }
  const errors = payload['errors'];
  if (errors && typeof errors === 'object') {
    const details = Object.values(errors).flat().filter(value => typeof value === 'string');
    if (details.length) return details.join(' · ');
  }
  if (error.status === 401) return 'Sesión inválida o credenciales incorrectas.';
  if (error.status === 403) return raw || 'No tienes permiso para realizar esta operación.';
  if (error.status === 409) return raw || 'Otro conductor tomó la solicitud primero.';
  if (error.status === 500) return 'El servidor devolvió un error interno. Intenta nuevamente después.';
  return raw || `Error HTTP ${error.status}`;
}
