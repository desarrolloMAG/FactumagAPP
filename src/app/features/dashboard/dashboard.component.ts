import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfile } from '../../core/models/Auth/UserProfile';
import { CfdiList } from '../../core/models/CFDI/CfdiList';
import { Wallet } from '../../core/models/Wallet/Wallet';
import { RfcList } from '../../core/models/RFC/RfcList';
import { AuthService } from '../../core/services/Auth/AuthService';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { WalletService } from '../../core/services/wallet/WalletService';
import { RfcService } from '../../core/services/RFC/RfcService';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-in">

      <!-- Bienvenida -->
      <div style="margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800;color:var(--text-primary)">
            Hola, {{ (user?.name ?? '').split(' ')[0] }} 👋
          </h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:3px">
            {{ today }} — Todo listo para facturar
          </p>
        </div>
        <a routerLink="/cfdis/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">add</span>
          Emitir CFDI
        </a>
      </div>

      <!-- Stats Grid -->
      <div class="stat-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">

        <div class="stat-card animate-in delay-1">
          <div class="stat-icon teal">
            <span class="material-icons-round">receipt_long</span>
          </div>
          <div class="stat-content">
            <div class="stat-label">CFDIs este mes</div>
            <div class="stat-value">{{ stats.cfdisMes }}</div>
            <div class="stat-change neutral">
              <span class="material-icons-round" style="font-size:14px">calendar_today</span>
              {{ monthName }}
            </div>
          </div>
        </div>

        <div class="stat-card animate-in delay-2">
          <div class="stat-icon green">
            <span class="material-icons-round">check_circle</span>
          </div>
          <div class="stat-content">
            <div class="stat-label">Timbrados</div>
            <div class="stat-value">{{ stats.timbrados }}</div>
            <div class="stat-change up">
              <span class="material-icons-round" style="font-size:14px">trending_up</span>
              Este mes
            </div>
          </div>
        </div>

        <div class="stat-card animate-in delay-3">
          <div class="stat-icon blue">
            <span class="material-icons-round">account_balance_wallet</span>
          </div>
          <div class="stat-content">
            <div class="stat-label">Timbres disponibles</div>
            <div class="stat-value">{{ stats.timbres }}</div>
            <div class="stat-change neutral">
              <span class="material-icons-round" style="font-size:14px">info_outline</span>
              Global + RFCs
            </div>
          </div>
        </div>

        <div class="stat-card animate-in delay-4">
          <div class="stat-icon amber">
            <span class="material-icons-round">business</span>
          </div>
          <div class="stat-content">
            <div class="stat-label">RFC registrados</div>
            <div class="stat-value">{{ stats.rfcs }}</div>
            <div class="stat-change neutral">
              <span class="material-icons-round" style="font-size:14px">domain</span>
              Empresas activas
            </div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:20px">

        <!-- Últimos CFDIs -->
        <div class="card-mag animate-in delay-2">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Últimos CFDIs</div>
              <div class="card-subtitle">Actividad reciente de facturación</div>
            </div>
            <a routerLink="/cfdis" class="btn-mag btn-ghost btn-sm">Ver todos</a>
          </div>

          <div class="card-body-mag" style="padding:0">
            <!-- Loading -->
            <div *ngIf="loadingCfdis" style="padding:32px 24px">
              <div *ngFor="let i of [1,2,3,4,5]" style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
                <div class="skeleton" style="width:36px;height:36px;border-radius:8px;flex-shrink:0"></div>
                <div style="flex:1">
                  <div class="skeleton" style="height:13px;width:60%;margin-bottom:6px;border-radius:4px"></div>
                  <div class="skeleton" style="height:11px;width:40%;border-radius:4px"></div>
                </div>
                <div class="skeleton" style="height:22px;width:70px;border-radius:20px"></div>
              </div>
            </div>

            <!-- Empty -->
            <div *ngIf="!loadingCfdis && cfdis.length === 0" class="empty-state">
              <div class="empty-icon">
                <span class="material-icons-round" style="font-size:48px">receipt_long</span>
              </div>
              <div class="empty-title">Sin CFDIs aún</div>
              <div class="empty-desc">Emite tu primer CFDI para verlo aquí</div>
              <a routerLink="/cfdis/new" class="btn-mag btn-primary btn-sm">
                <span class="material-icons-round" style="font-size:16px">add</span>
                Emitir CFDI
              </a>
            </div>

            <!-- Lista -->
            <table class="table-mag table-compact" *ngIf="!loadingCfdis && cfdis.length > 0">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Receptor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of cfdis" style="cursor:pointer" [routerLink]="['/cfdis']">
                  <td>
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:var(--accent-light);color:var(--accent);border-radius:8px;font-family:var(--font-display);font-weight:800;font-size:13px">
                      {{ c.tipoComprobante }}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">{{ c.receptorNombre | slice:0:22 }}{{ c.receptorNombre.length > 22 ? '...' : '' }}</div>
                    <div style="font-size:11px;color:var(--text-muted)">{{ c.receptorRfc }}</div>
                  </td>
                  <td>
                    <span style="font-family:var(--font-display);font-weight:700;font-size:14px">
                      {{ c.total | currency:'MXN':'symbol-narrow':'1.2-2' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-mag" [class]="c.estado.toLowerCase()">
                      {{ c.estado }}
                    </span>
                  </td>
                  <td style="font-size:12px;color:var(--text-muted)">
                    {{ c.fechaTimbrado ? (c.fechaTimbrado | date:'dd/MM/yy') : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Panel lateral derecho -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- RFCs rápidos -->
          <div class="card-mag animate-in delay-3">
            <div class="card-header-mag">
              <div>
                <div class="card-title">Mis RFCs</div>
                <div class="card-subtitle">{{ rfcs.length }} empresa(s)</div>
              </div>
              <a routerLink="/rfcs" class="btn-mag btn-ghost btn-sm">Ver</a>
            </div>
            <div class="card-body-mag" style="padding:12px 16px">
              <div *ngIf="rfcs.length === 0" style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:13px">
                Sin RFCs registrados
              </div>
              <div *ngFor="let r of rfcs; let last=last"
                   [style.border-bottom]="last ? 'none' : '1px solid var(--border-light)'"
                   style="padding:10px 0;display:flex;align-items:center;gap:10px">
                <div style="width:34px;height:34px;background:var(--accent-light);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-icons-round" style="font-size:16px;color:var(--accent)">business</span>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ r.razonSocial }}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ r.rfc }}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text-primary)">{{ r.saldoTimbres }}</div>
                  <div style="font-size:10px;color:var(--text-muted)">timbres</div>
                </div>
              </div>
              <a routerLink="/rfcs/new" class="btn-mag btn-outline btn-sm"
                 style="width:100%;justify-content:center;margin-top:12px">
                <span class="material-icons-round" style="font-size:16px">add</span>
                Agregar RFC
              </a>
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="card-mag animate-in delay-4">
            <div class="card-header-mag">
              <div class="card-title">Acciones rápidas</div>
            </div>
            <div class="card-body-mag" style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
              <a routerLink="/cfdis/new" class="btn-mag btn-primary btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">add_circle</span>
                Emitir Factura
              </a>
              <a routerLink="/wallet" class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">account_balance_wallet</span>
                Ver Timbres
              </a>
              <a routerLink="/rfcs/new" class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">business</span>
                Nuevo RFC
              </a>
              <a routerLink="/cfdis" [queryParams]="{estado:'Cancelado'}" class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">receipt_long</span>
                CFDIs Cancelados
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  user: UserProfile | null = null;
  cfdis: CfdiList[] = [];
  wallets: Wallet[] = [];
  rfcs: RfcList[] = [];
  loadingCfdis = true;

  stats = { cfdisMes: 0, timbrados: 0, timbres: 0, rfcs: 0 };

  get today(): string {
    return new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get monthName(): string {
    return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  constructor(
    private auth:      AuthService,
    private cfdiSvc:   CfdiService,
    private walletSvc: WalletService,
    private rfcSvc:    RfcService
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.loadData();
  }

  loadData(): void {
    const now   = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    this.cfdiSvc.listar({ pageSize: 8, desde, hasta }).subscribe(r => {
      this.cfdis           = r.data;
      this.stats.cfdisMes  = r.total;
      this.stats.timbrados = r.data.filter(c => c.estado === 'Timbrado').length;
      this.loadingCfdis    = false;
    });

    this.walletSvc.saldos().subscribe((ws: any) => {
      this.wallets       = ws;
      this.stats.timbres = ws.reduce((s: number, w: Wallet) => s + w.saldo, 0);
    });

    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs       = rs;
      this.stats.rfcs = rs.length;
    });
  }


}