import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfile } from '../core/models/Auth/UserProfile';
import { Wallet } from '../core/models/Wallet/Wallet';
import { AuthService } from '../core/services/Auth/AuthService';
import { WalletService } from '../core/services/wallet/WalletService';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="open">

      <!-- Logo -->
      <div class="sidebar-logo">
        <a routerLink="/" class="nav-brand" aria-label="Korebix - Inicio">
            <img src="assets/logo.png" alt="Korebix" class="logo-img" style="width: 100%;"/>
          </a>
      </div>

      <!-- Usuario -->
      <div class="sidebar-user" [routerLink]="['/perfil']">
        <div class="avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ user?.name }}</div>
          <div class="user-email">{{ user?.email }}</div>
        </div>
        <span class="material-icons-round" style="font-size:16px;color:rgba(255,255,255,0.3)">chevron_right</span>
      </div>

      <!-- Wallet Widget -->
      <div style="padding:0 12px;margin-top:8px">
        <div class="wallet-widget">
          <div class="wallet-label">🪙 Timbres disponibles</div>
          <div class="wallet-saldo">{{ totalTimbres }}</div>
          <div class="wallet-sub">Global + todos tus RFC</div>
        </div>
      </div>

      <!-- Nav -->
      <div class="sidebar-section-title">Principal</div>
      <nav class="sidebar-nav">

        <a class="nav-item"
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{exact:true}"
          (click)="close()">
          <span class="material-icons-round nav-icon">dashboard</span>
          <span class="nav-label">Dashboard</span>
        </a>

        <!-- ══ FACTURACIÓN ════════════════════════════════════════════════ -->
        <!-- Sección visible si el tenant tiene el módulo "facturacion" activo -->
        <ng-container *ngIf="tieneModulo('facturacion')">
          <div class="sidebar-section-title" style="padding-top:12px">Facturación</div>

          <!-- Emitir CFDI: permiso emitir_cfdi -->
          <a *ngIf="tienePermiso('emitir_cfdi')"
            class="nav-item"
            routerLink="/cfdis/new"
            routerLinkActive="active"
            (click)="close()"
            style="margin-bottom:6px;border:1px dashed rgba(0,212,170,0.25)">
            <span class="material-icons-round nav-icon" style="color:var(--accent)">add_circle_outline</span>
            <span class="nav-label" style="color:var(--accent)">Emitir CFDI</span>
          </a>

          <!-- Ver CFDIs: permiso ver_cfdis -->
          <a *ngIf="tienePermiso('ver_cfdis')"
            class="nav-item"
            routerLink="/cfdis"
            routerLinkActive="active"
            (click)="close()">
            <span class="material-icons-round nav-icon">receipt_long</span>
            <span class="nav-label">CFDIs Emitidos</span>
          </a>

          <!-- Series y Folios: permiso ver_series -->
          <a *ngIf="tienePermiso('ver_series')"
            class="nav-item"
            routerLink="/series"
            routerLinkActive="active"
            (click)="close()">
            <span class="material-icons-round nav-icon">format_list_numbered</span>
            <span class="nav-label">Series y Folios</span>
          </a>

          <!-- Clientes: permiso ver_clientes -->
          <ng-container *ngIf="tienePermiso('ver_clientes')">
            <div class="sidebar-section-title" style="padding-top:12px">Clientes</div>
            <a class="nav-item"
              routerLink="/clientes"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon">people</span>
              <span class="nav-label">Clientes</span>
            </a>
          </ng-container>

          <!-- RFCs / Empresas emisoras: permiso ver_rfcs -->
          <ng-container *ngIf="tienePermiso('ver_rfcs')">
            <div class="sidebar-section-title" style="padding-top:12px">Empresas</div>
            <a class="nav-item"
              routerLink="/rfcs"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon">business</span>
              <span class="nav-label">Mis RFCs</span>
            </a>
          </ng-container>

          <!-- Wallet / Timbres: permiso ver_wallet -->
          <ng-container *ngIf="tienePermiso('ver_wallet')">
            <div class="sidebar-section-title" style="padding-top:12px">Finanzas</div>
            <a class="nav-item"
              routerLink="/wallet"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon">account_balance_wallet</span>
              <span class="nav-label">Timbres y Consumo</span>
            </a>
          </ng-container>
        </ng-container>

        <!-- ══ INVENTARIO ══════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_productos')">
          <div class="sidebar-section-title" style="padding-top:12px">Inventario</div>
          <a class="nav-item"
            routerLink="/conceptos"
            routerLinkActive="active"
            (click)="close()">
            <span class="material-icons-round nav-icon">inventory_2</span>
            <span class="nav-label">Productos / Conceptos</span>
          </a>
        </ng-container>

        <!-- ══ NÓMINA ══════════════════════════════════════════════════════ -->
        <!-- Nómina es un módulo de app-level, no un permiso granular -->
        <ng-container *ngIf="tienePermiso('ver_empleados')">
          <div class="sidebar-section-title" style="padding-top:12px">Nómina</div>
          <a class="nav-item"
            routerLink="/empleados"
            routerLinkActive="active"
            (click)="close()">
            <span class="material-icons-round nav-icon">badge</span>
            <span class="nav-label">Empleados</span>
          </a>
          <a class="nav-item"
            routerLink="/nomina/generar"
            routerLinkActive="active"
            (click)="close()"
            style="margin-bottom:6px;border:1px dashed rgba(0,212,170,0.15)">
            <span class="material-icons-round nav-icon" style="color:var(--accent)">payments</span>
            <span class="nav-label" style="color:var(--accent)">Generar Nómina</span>
          </a>
          <a class="nav-item"
            routerLink="/nomina/lotes"
            routerLinkActive="active"
            (click)="close()">
            <span class="material-icons-round nav-icon">history</span>
            <span class="nav-label">Historial de Lotes</span>
          </a>
        </ng-container>


      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="nav-item" style="width:100%;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4)"
                (click)="logout()">
          <span class="material-icons-round nav-icon">logout</span>
          <span class="nav-label" style="font-size:13px">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input()  open = false;
  @Output() closed = new EventEmitter<void>();

  user: UserProfile | null = null;
  wallets: Wallet[] = [];
  totalTimbres = 0;

  constructor(private auth: AuthService, private walletSvc: WalletService) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.auth.user$.subscribe(u => this.user = u);
    this.loadWallets();
  }

  get initials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  loadWallets(): void {
    this.walletSvc.saldos().subscribe(ws => {
      this.wallets      = ws;
      this.totalTimbres = ws.reduce((sum, w) => sum + w.saldo, 0);
    });
  }

  tieneModulo(slug: string): boolean   { return this.auth.tieneModulo(slug); }
  tienePermiso(clave: string): boolean { return this.auth.tienePermiso(clave); }

  close(): void  { this.closed.emit(); }
  logout(): void { this.auth.logout(); }
}