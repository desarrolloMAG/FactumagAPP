import { Component, OnInit, OnDestroy, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/Auth/AuthService';
import { ProfileService } from '../core/services/profile.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="um-wrap">

      <!-- Trigger -->
      <button class="um-trigger" (click)="toggle($event)" [class.active]="open()">
        <img *ngIf="avatarUrl()" [src]="avatarUrl()!" class="um-avatar um-avatar-img" alt="avatar"/>
        <div *ngIf="!avatarUrl()" class="um-avatar">{{ initials() }}</div>
      </button>

      <!-- Panel -->
      <div *ngIf="open()" class="um-panel">

        <!-- Header con logo de empresa desvanecido de fondo -->
        <div class="um-header" [style.--logo-url]="tenantLogoUrl() ? 'url(' + tenantLogoUrl() + ')' : 'none'">
          <div class="um-header-avatar-wrap">
            <img *ngIf="avatarUrl()" [src]="avatarUrl()!" class="um-header-avatar um-header-avatar-img" alt="avatar"/>
            <div *ngIf="!avatarUrl()" class="um-header-avatar">{{ initials() }}</div>
          </div>
          <div class="um-name">{{ userName() }}</div>
          <div class="um-email">{{ userEmail() }}</div>
        </div>

        <!-- Acciones -->
        <div class="um-body">

          <button class="um-item" (click)="gestionarCuenta()">
            <span class="um-icon-wrap" style="background:#EFF6FF">
              <span class="material-icons-round" style="color:#3B82F6">manage_accounts</span>
            </span>
            <span class="um-item-text">
              <span class="um-item-label">Gestionar cuenta</span>
              <span class="um-item-sub">Edita tu perfil y preferencias</span>
            </span>
            <span class="material-icons-round um-arrow">chevron_right</span>
          </button>

          <button class="um-item" (click)="cambiarEmpresa()">
            <span class="um-icon-wrap" style="background:#F5F3FF">
              <span class="material-icons-round" style="color:#8B5CF6">swap_horiz</span>
            </span>
            <span class="um-item-text">
              <span class="um-item-label">Cambiar de empresa</span>
              <span class="um-item-sub">{{ tenantNombre() || 'Sin empresa activa' }}</span>
            </span>
            <span class="material-icons-round um-arrow">chevron_right</span>
          </button>

          <button class="um-item um-item-logout" (click)="logout()">
            <span class="um-icon-wrap" style="background:#FFF1F2">
              <span class="material-icons-round" style="color:#F43F5E">logout</span>
            </span>
            <span class="um-item-text">
              <span class="um-item-label">Cerrar sesión</span>
              <span class="um-item-sub">Finaliza tu sesión actual</span>
            </span>
          </button>

        </div>

        <!-- Footer legal -->
        <div class="um-footer">
          <button class="um-legal-btn">Términos</button>
          <span class="um-dot">·</span>
          <button class="um-legal-btn">Privacidad</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; position: relative; }

    .um-wrap { position: relative; }

    /* ── Trigger ── */
    .um-trigger {
      background: none; border: 2px solid transparent; padding: 0;
      cursor: pointer; border-radius: 50%;
      transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
      outline: none; display: flex; align-items: center; justify-content: center;
    }
    .um-trigger:hover { border-color: var(--mag-primary); transform: scale(1.05); }
    .um-trigger.active {
      border-color: var(--mag-primary);
      box-shadow: 0 0 0 4px var(--mag-primary-50, rgba(59,99,217,0.15));
    }

    .um-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--mag-primary, #3B63D9) 0%, #6366f1 100%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; color: white;
      user-select: none; letter-spacing: 0.5px;
    }
    .um-avatar-img {
      width: 36px; height: 36px; border-radius: 50%;
      object-fit: cover; display: block;
    }

    /* ── Panel ── */
    .um-panel {
      position: absolute; top: calc(100% + 12px); right: 0;
      width: 300px;
      background: var(--mag-surface, #fff);
      border: 1px solid var(--mag-border-lt, #F1F5F9);
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08);
      z-index: 9999; overflow: hidden;
      animation: umIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes umIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Header ── */
    .um-header {
      display: flex; flex-direction: column; align-items: center;
      padding: 28px 20px 20px;
      background: linear-gradient(160deg, #f0f9ff 0%, #faf5ff 50%, #fff7ed 100%);
      border-bottom: 1px solid var(--mag-border-lt, #F1F5F9);
      text-align: center;
      position: relative; overflow: hidden;
    }
    .um-header::before {
      content: '';
      position: absolute; inset: 0;
      background-image: var(--logo-url, none);
      background-size: 55%; background-repeat: no-repeat; background-position: center 65%;
      -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 80%);
      mask-image: linear-gradient(to top, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 80%);
      pointer-events: none;
    }
    .um-header > * { position: relative; z-index: 1; }

    .um-header-avatar-wrap { margin-bottom: 12px; }
    .um-header-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: linear-gradient(135deg, var(--mag-primary, #3B63D9) 0%, #6366f1 100%);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 22px; color: white;
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
      border: 3px solid white;
    }
    .um-header-avatar-img {
      width: 64px; height: 64px; border-radius: 50%;
      object-fit: cover;
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
      border: 3px solid white;
    }
    .um-name {
      font-size: 15px; font-weight: 700; color: #1e293b;
      letter-spacing: -0.2px; margin-bottom: 3px;
      max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .um-email {
      font-size: 12px; color: #64748b;
      max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    /* ── Body ── */
    .um-body { padding: 8px 10px; }

    .um-item {
      display: flex; align-items: center; gap: 12px;
      width: 100%; padding: 10px; border: none;
      background: none; cursor: pointer; font-family: inherit;
      border-radius: 12px; transition: background 0.15s; text-align: left;
    }
    .um-item:hover { background: rgba(0,0,0,0.04); }
    .um-item-logout:hover { background: #fff1f2; }
    .um-item-logout:hover .um-item-label { color: #f43f5e; }

    .um-icon-wrap {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .um-icon-wrap .material-icons-round { font-size: 20px !important; }

    .um-item-text { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .um-item-label {
      font-size: 13.5px; font-weight: 600; color: var(--mag-text, #0f172a);
      transition: color 0.15s;
    }
    .um-item-sub {
      font-size: 11.5px; color: var(--mag-text-hint, #94a3b8); margin-top: 1px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .um-arrow {
      font-size: 16px !important; color: var(--mag-text-hint, #94a3b8);
      transition: transform 0.15s; flex-shrink: 0;
    }
    .um-item:hover .um-arrow { transform: translateX(2px); }

    /* ── Footer ── */
    .um-footer {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 10px 16px 12px;
      border-top: 1px solid var(--mag-border-lt, #F1F5F9);
    }
    .um-legal-btn {
      background: none; border: none; cursor: pointer;
      font-size: 11px; color: var(--mag-text-hint, #94a3b8);
      font-family: inherit; padding: 2px 4px; border-radius: 4px;
      transition: color 0.12s;
    }
    .um-legal-btn:hover { color: var(--mag-text-sec, #64748b); }
    .um-dot { font-size: 11px; color: var(--mag-border, #cbd5e1); }
  `]
})
export class UserMenuComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private profile = inject(ProfileService);

  open = signal(false);
  private user = signal(this.auth.currentUser());

  userName     = computed(() => this.user()?.name ?? '');
  userEmail    = computed(() => this.user()?.email ?? '');
  tenantNombre = computed(() => this.user()?.tenantNombre ?? '');
  avatarUrl     = signal<string | null>(null);
  tenantLogoUrl = signal<string | null>(null);

  private assetsHandler = (e: Event) => this.applyAssets((e as CustomEvent).detail);

  initials = computed(() => {
    const name = this.userName();
    return name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  });

  ngOnInit(): void {
    this.auth.user$.subscribe(u => this.user.set(u));
    this.loadFromStorage();
    // Si no había datos en cache, los pide al API
    this.profile.loadAssets();
    window.addEventListener('sso-assets-updated', this.assetsHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('sso-assets-updated', this.assetsHandler);
  }

  private loadFromStorage(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    const avatar = localStorage.getItem(`sso_avatar_${u.id}`);
    if (avatar) this.avatarUrl.set(avatar);
    if (u.tenantId) {
      const logo = localStorage.getItem(`sso_logo_${u.tenantId}`);
      if (logo) this.tenantLogoUrl.set(logo);
    }
  }

  private applyAssets(data: any): void {
    if (data.avatarUrl) this.avatarUrl.set(data.avatarUrl);
    if (data.logoUrl)   this.tenantLogoUrl.set(data.logoUrl);
  }

  @HostListener('document:click')
  onDocumentClick(): void { this.open.set(false); }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update(v => !v);
  }

  gestionarCuenta(): void {
    this.open.set(false);
    this.router.navigate(['/perfil']);
  }

  cambiarEmpresa(): void {
    this.open.set(false);
    window.location.href = `${environment.ssoUrl}/select-tenant`;
  }

  logout(): void {
    this.open.set(false);
    this.auth.logout();
  }
}
