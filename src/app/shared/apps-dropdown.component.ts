import { Component, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/Auth/AuthService';

interface SsoApp { name: string; url: string; icon: string; color: string; }

@Component({
  selector: 'app-apps-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="appdrop-wrapper">
      <button
        class="dots-btn"
        [class.active]="open"
        (click)="toggle()"
        title="Mis productos">
        <div class="dots-grid">
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </div>
      </button>

      <div class="appdrop-panel" *ngIf="open" role="menu">
        <div class="appdrop-header">Mis productos</div>
        <div class="appdrop-grid">
          <button *ngFor="let app of apps" class="appdrop-item" (click)="goToApp(app)" role="menuitem">
            <div class="appdrop-icon" [style.background]="app.color + '1a'">
              <span class="icon-emoji">{{ app.icon }}</span>
            </div>
            <span class="appdrop-name">{{ app.name }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { position: relative; display: inline-flex; align-items: center; }

    .dots-btn {
      width: 36px; height: 36px; border-radius: 50%;
      border: none; background: transparent; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .dots-btn:hover, .dots-btn.active {
      background: var(--mag-primary-50, rgba(79,110,247,0.12));
    }

    .dots-grid {
      display: grid;
      grid-template-columns: repeat(3, 5px);
      grid-template-rows: repeat(3, 5px);
      gap: 3px;
    }
    .dots-grid span {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--mag-text-sec, #64748b);
      transition: background 0.15s;
    }
    .dots-btn:hover .dots-grid span,
    .dots-btn.active .dots-grid span {
      background: var(--mag-primary, #4f6ef7);
    }

    .appdrop-panel {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: 280px;
      background: var(--mag-surface, #ffffff);
      border: 1px solid var(--mag-border-lt, #e2e8f0);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.16);
      z-index: 9999; overflow: hidden;
      animation: fadeDown 0.15s ease;
    }
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-6px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1); }
    }

    .appdrop-header {
      padding: 14px 20px 10px;
      font-size: 13px; font-weight: 600;
      color: var(--mag-text-sec, #64748b);
      border-bottom: 1px solid var(--mag-border-lt, #e2e8f0);
      letter-spacing: 0.3px;
    }

    .appdrop-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 4px; padding: 12px;
    }

    .appdrop-item {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 12px 8px; border-radius: 10px;
      border: none; background: transparent; cursor: pointer;
      transition: background 0.15s; font-family: inherit; color: var(--mag-text, #0F172A);
    }
    .appdrop-item:hover { background: var(--mag-primary-50, rgba(79,110,247,0.08)); }

    .appdrop-icon {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
    }
    .appdrop-item:hover .appdrop-icon { transform: scale(1.08); }

    .icon-emoji { font-size: 22px; line-height: 1; }

    .appdrop-name {
      font-size: 11px; font-weight: 500;
      color: var(--mag-text-sec, #64748b);
      text-align: center; line-height: 1.3;
      max-width: 72px; word-break: break-word;
    }
  `]
})
export class AppsDropdownComponent {
  private auth  = inject(AuthService);
  private elRef = inject(ElementRef);
  open = false;

  apps: SsoApp[] = [
    { name: 'Gestión Suite', url: 'http://localhost/trion-beta/public/sso/callback', icon: '📦', color: '#4f6ef7' },
    { name: 'Facturación',   url: 'http://localhost:59800/sso/callback',             icon: '🧾', color: '#10b981' },
    { name: 'E-Commerce',    url: 'http://localhost:8002/sso/callback',              icon: '🛒', color: '#f59e0b' },
    { name: 'WALL-EE',       url: 'http://localhost:4200/wallet',                   icon: '💰', color: '#10b981' },
  ];

  toggle(): void { this.open = !this.open; }

  goToApp(app: SsoApp): void {
    this.open = false;
    const token = this.auth.getToken();
    if (!token) { window.location.href = app.url; return; }
    const sep = app.url.includes('?') ? '&' : '?';
    window.location.href = `${app.url}${sep}token=${encodeURIComponent(token)}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) this.open = false;
  }
}
