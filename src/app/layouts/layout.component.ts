import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SidebarComponent } from '../shared/sidebar.component';
import { AppsDropdownComponent } from '../shared/apps-dropdown.component';
import { AuthService } from '../core/services/Auth/AuthService';
import { WizardOnboardingComponent } from '../features/onboarding/wizard.onboarding.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent, AppsDropdownComponent, WizardOnboardingComponent],
  template: `
    <app-wizard-onboarding *ngIf="showWizard" (closed)="showWizard=false"></app-wizard-onboarding>

    <div class="app-container">
      <!-- Sidebar -->
      <app-sidebar [open]="sidebarOpen" (closed)="sidebarOpen=false" />

      <!-- Overlay móvil -->
      <div *ngIf="sidebarOpen"
           style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999"
           (click)="sidebarOpen=false"></div>

      <!-- Contenido principal -->
      <div class="main-content">

        <!-- Topbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="topbar-btn" (click)="sidebarOpen=!sidebarOpen"
                    style="display:none" id="menu-btn">
              <span class="material-icons-round">menu</span>
            </button>
            <div>
              <div class="page-title">{{ pageTitle }}</div>
              <div class="page-breadcrumb">
                <span>FacturacionMAG</span>
                <span class="material-icons-round" style="font-size:12px">chevron_right</span>
                <span>{{ pageTitle }}</span>
              </div>
            </div>
          </div>

          <div class="topbar-right">
            <app-apps-dropdown></app-apps-dropdown>
            <button class="topbar-btn">
              <span class="material-icons-round" style="font-size:20px">notifications_none</span>
              <span class="badge-dot"></span>
            </button>
            <button class="topbar-btn">
              <span class="material-icons-round" style="font-size:20px">help_outline</span>
            </button>
            <div style="width:1px;height:24px;background:var(--border-light);margin:0 4px"></div>
            <button class="topbar-btn" [routerLink]="['/perfil']">
              <span class="material-icons-round" style="font-size:20px">account_circle</span>
            </button>
          </div>
        </header>

        <!-- Página -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent implements OnInit {
  sidebarOpen = false;
  pageTitle   = 'Dashboard';
  showWizard  = false;

  private readonly titles: Record<string, string> = {
    '/dashboard':  'Dashboard',
    '/rfcs':       'Mis RFCs',
    '/rfcs/new':   'Nuevo RFC',
    '/wallet':     'Wallet & Timbres',
    '/cfdis':      'Mis CFDIs',
    '/cfdis/new':  'Emitir CFDI',
    '/perfil':     'Mi Perfil',
  };

  constructor(private router: Router, private auth: AuthService) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects)
    ).subscribe(url => {
      this.pageTitle = this.titles[url] ?? 'FacturacionMAG';
    });
  }

  ngOnInit(): void {
    // Pide un JWT fresco al backend para detectar si el onboarding ya fue
    // completado en otro sistema (ej. trion-beta). Si falla, usa el estado local.
    this.auth.refreshTenantToken().pipe(
      catchError(() => of(null)),
      switchMap(() => this.auth.user$)
    ).subscribe(user => {
      this.showWizard = !!user && !user.onboardingCompletado;
    });
  }
}