import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter, map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SidebarComponent }      from '../shared/sidebar.component';
import { AppsDropdownComponent } from '../shared/apps-dropdown.component';
import { ThemeToggleComponent }  from '../shared/theme-toggle.component';
import { UserMenuComponent }     from '../shared/user-menu.component';
import { AuthService }           from '../core/services/Auth/AuthService';
import { WizardOnboardingComponent } from '../features/onboarding/wizard.onboarding.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterModule,
    SidebarComponent, AppsDropdownComponent,
    ThemeToggleComponent, UserMenuComponent,
    WizardOnboardingComponent
  ],
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
            <button class="topbar-menu-btn" (click)="sidebarOpen=!sidebarOpen"
                    *ngIf="!isPerfilRoute">
              <span class="material-icons-round">menu</span>
            </button>
            <div *ngIf="!isPerfilRoute">
              <div class="page-title">{{ pageTitle }}</div>
              <div class="page-breadcrumb">
                <span>FacturacionMAG</span>
                <span class="material-icons-round" style="font-size:12px">chevron_right</span>
                <span>{{ pageTitle }}</span>
              </div>
            </div>
          </div>

          <div class="topbar-right">
            <app-theme-toggle></app-theme-toggle>
            <app-apps-dropdown></app-apps-dropdown>
            <div class="topbar-divider"></div>
            <app-user-menu></app-user-menu>
          </div>
        </header>

        <!-- Página -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .no-sidebar { margin-left: 0 !important; }
    .topbar-divider { width: 1px; height: 24px; background: var(--border-light); margin: 0 4px; }
    .topbar-menu-btn {
      width: 36px; height: 36px; border-radius: 8px;
      background: transparent; border: 1px solid var(--border-light);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); transition: all 0.15s; margin-right: 8px;
    }
    .topbar-menu-btn:hover { background: rgba(0,212,170,0.1); color: var(--accent); }
    .topbar-menu-btn .material-icons-round { font-size: 20px; }
    .page-content-full { padding: 0 !important; }
  `]
})
export class MainLayoutComponent implements OnInit {
  sidebarOpen   = false;
  pageTitle     = 'Dashboard';
  showWizard    = false;
  isPerfilRoute = false;

  private readonly titles: Record<string, string> = {
    '/dashboard':  'Dashboard',
    '/rfcs':       'Mis RFCs',
    '/rfcs/new':   'Nuevo RFC',
    '/wallet':     'Wallet & Timbres',
    '/cfdis':      'Mis CFDIs',
    '/cfdis/new':  'Emitir CFDI',
    '/perfil':     'Mi Perfil',
    '/series':     'Series',
    '/clientes':   'Clientes',
    '/conceptos':  'Conceptos',
    '/empleados':  'Empleados',
    '/nomina/generar': 'Generar Nómina',
    '/nomina/lotes':   'Lotes de Nómina',
  };

  constructor(private router: Router, private auth: AuthService) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: any) => e.urlAfterRedirects)
    ).subscribe(url => {
      this.isPerfilRoute = url === '/perfil';
      this.pageTitle = this.titles[url] ?? 'FacturacionMAG';
    });
  }

  ngOnInit(): void {
    this.isPerfilRoute = this.router.url === '/perfil';

    this.auth.refreshTenantToken().pipe(
      catchError(() => of(null)),
      switchMap(() => this.auth.user$)
    ).subscribe(user => {
      this.showWizard = !!user && !user.onboardingCompletado;
    });
  }
}
