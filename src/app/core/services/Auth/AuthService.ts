import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserProfile } from '../../models/Auth/UserProfile';
import { LoginResponse } from '../../models/Auth/LoginResponse';
import { LoginRequest } from '../../models/Auth/LoginRequest ';
import { MessageResponse } from '../../models/Paginación/MessageResponse';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE = `${environment.authUrl}`;
  private _user$ = new BehaviorSubject<UserProfile | null>(this.storedUser());

  user$ = this._user$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/Auth/login`, req).pipe(
      tap(res => this.guardarSesion(res.accessToken, res.refreshToken, res.user))
    );
  }

  /** Actualiza el accessToken en sesión (ej. después del onboarding) y refresca el perfil. */
  actualizarToken(accessToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    const claims = this.decodeJwt(accessToken);
    if (!claims) return;

    const user = this._user$.value;
    if (!user) return;

    const updated: UserProfile = {
      ...user,
      tenantId:             claims['tenant_id']   ? +claims['tenant_id']   : user.tenantId,
      tenantNombre:         claims['tenant_nombre']                         ?? user.tenantNombre,
      tenantPlan:           claims['tenant_plan']                           ?? user.tenantPlan,
      tenantRol:            claims['tenant_rol']                            ?? user.tenantRol,
      modulos:              this.parseClaim<string[]>(claims['modulos'])    ?? user.modulos ?? [],
      onboardingCompletado: claims['onboarding_completado'] === 'true',
      tipoNegocio:          claims['tipo_negocio']                          ?? user.tipoNegocio,
    };

    localStorage.setItem('user', JSON.stringify(updated));
    this._user$.next(updated);
  }

  logout(): void {
    localStorage.clear();
    this._user$.next(null);
    window.location.href = `${environment.ssoUrl}/logout`;
  }

  getToken(): string | null { return localStorage.getItem('accessToken'); }
  isLoggedIn(): boolean     { return !!this.getToken(); }
  currentUser(): UserProfile | null { return this._user$.value; }

  changePassword(oldPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/Auth/change-password`, { oldPassword, newPassword });
  }

  updateProfile(data: { name: string; email: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE}/Users/me`, data).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this._user$.next(user);
      })
    );
  }

  /** Comprueba si el tenant del usuario tiene activo un módulo específico. */
  tieneModulo(slug: string): boolean {
    return this._user$.value?.modulos?.includes(slug) ?? true; // true = si no hay modulos configurados, mostrar todo
  }

  // ── Privados ────────────────────────────────────────────────────────────────

  private guardarSesion(accessToken: string, refreshToken: string, user: UserProfile): void {
    const claims  = this.decodeJwt(accessToken);
    const enriched: UserProfile = {
      ...user,
      tenantId:             claims?.['tenant_id']   ? +claims['tenant_id']   : undefined,
      tenantNombre:         claims?.['tenant_nombre'],
      tenantPlan:           claims?.['tenant_plan'],
      tenantRol:            claims?.['tenant_rol'],
      modulos:              this.parseClaim<string[]>(claims?.['modulos'])    ?? [],
      onboardingCompletado: claims?.['onboarding_completado'] === 'true',
      tipoNegocio:          claims?.['tipo_negocio'] || undefined,
    };
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user',         JSON.stringify(enriched));
    this._user$.next(enriched);
  }

  private storedUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private decodeJwt(token: string): Record<string, any> | null {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
  }

  private parseClaim<T>(value: any): T | null {
    if (value == null) return null;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return null; }
    }
    return value as T;
  }
}
