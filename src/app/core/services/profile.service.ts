import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './Auth/AuthService';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly BASE = environment.authUrl;

  /** Carga avatar y logo desde el API y los persiste en localStorage */
  loadAssets(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    // ── Avatar ──────────────────────────────────────────────────────────────
    const cachedAvatar = localStorage.getItem(`sso_avatar_${user.id}`);
    if (!cachedAvatar) {
      this.http.get<{ avatarUrl?: string; avatar_url?: string }>(
        `${this.BASE}/Profile`
      ).pipe(catchError(() => of(null))).subscribe(res => {
        const url = res?.avatarUrl ?? res?.avatar_url ?? null;
        if (url) {
          localStorage.setItem(`sso_avatar_${user.id}`, url);
          window.dispatchEvent(new CustomEvent('sso-assets-updated', {
            detail: { avatarUrl: url, userId: user.id }
          }));
        }
      });
    }

    // ── Logo empresa ─────────────────────────────────────────────────────────
    const tenantId = user.tenantId;
    if (!tenantId) return;

    const cachedLogo = localStorage.getItem(`sso_logo_${tenantId}`);
    if (!cachedLogo) {
      this.http.get<{ logoUrl?: string; logo_url?: string }>(
        `${this.BASE}/Tenants/${tenantId}`
      ).pipe(catchError(() => of(null))).subscribe(res => {
        const url = res?.logoUrl ?? res?.logo_url ?? null;
        if (url) {
          localStorage.setItem(`sso_logo_${tenantId}`, url);
          window.dispatchEvent(new CustomEvent('sso-assets-updated', {
            detail: { logoUrl: url, tenantId }
          }));
        }
      });
    }
  }
}
