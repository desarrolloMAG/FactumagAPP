import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/Auth/AuthService';

// ── JWT Interceptor ───────────────────────────────────────────────────────────
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ── Rutas SSO no necesitan token ni manejo de 401 ─────────────────────────
    if (req.url.includes('/sso/') || window.location.pathname.startsWith('/sso/')) {
      return next.handle(req);
    }

    const token = this.auth.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // ── Solo hacer logout si NO estamos ya en proceso de logout ──────────
          const path = window.location.pathname;
          if (!path.startsWith('/sso/') && !path.startsWith('/auth/')) {
            this.auth.logout();
          }
        }
        return throwError(() => err);
      })
    );
  }
}

// ── Auth Guard ────────────────────────────────────────────────────────────────
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // ── Rutas públicas — no requieren auth ───────────────────────────────────
  if (state.url.startsWith('/sso/')) return true;
  if (state.url.startsWith('/auth/')) return true;

  if (auth.isLoggedIn()) return true;

  // ── Leer token del SSO si viene en la URL ────────────────────────────────
  const params    = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') ?? '';
  let token       = params.get('token');

  if (!token && returnUrl) {
    const match = decodeURIComponent(returnUrl).match(/[?&]token=([^&]+)/);
    if (match) token = match[1];
  }

  if (token) {
    localStorage.setItem('accessToken', token);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      localStorage.setItem('user', JSON.stringify({
        id:       payload.sub,
        name:     payload.name,
        email:    payload.email,
        tenantId: payload.tenant_id ?? null,
      }));
    } catch { }
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// ── Guest Guard ───────────────────────────────────────────────────────────────
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};