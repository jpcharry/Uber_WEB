import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return next(request.clone({ setHeaders: headers })).pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401 && !request.url.includes('/auth/login') && !request.url.includes('/auth/register')) {
      auth.clear();
    }
    return throwError(() => error);
  }));
};
