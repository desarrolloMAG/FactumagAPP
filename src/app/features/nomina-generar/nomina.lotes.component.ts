import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RfcService } from '../../core/services/RFC/RfcService';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nomina-lotes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in" style="max-width:1100px">
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Historial de Nómina</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Lotes de nómina timbrados</p>
        </div>
        <a routerLink="/nomina/generar" class="btn-mag btn-primary btn-lg">
          <span class="material-icons-round" style="font-size:20px">payments</span>
          Generar nómina
        </a>
      </div>

      <!-- Filtro RFC -->
      <div class="card-mag" style="margin-bottom:16px;padding:16px 20px">
        <div style="display:flex;gap:12px;align-items:center">
          <select class="form-control-mag" [(ngModel)]="rfcId" (change)="cargar()" style="max-width:320px">
            <option [value]="0">Seleccionar RFC...</option>
            <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
          </select>
          <span style="font-size:13px;color:var(--text-muted)">{{ lotes.length }} lote(s)</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag" *ngIf="rfcId">
        <div *ngIf="cargando" style="padding:48px;text-align:center;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:36px;animation:spin 1s linear infinite;display:block;margin-bottom:8px">refresh</span>
          Cargando...
        </div>

        <div *ngIf="!cargando && lotes.length === 0"
             style="padding:48px;text-align:center;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:12px">history</span>
          Sin lotes para este RFC.<br>
          <a routerLink="/nomina/generar" style="color:var(--accent);font-weight:600">
            Generar tu primer lote →
          </a>
        </div>

        <div *ngIf="!cargando && lotes.length > 0" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-light);background:var(--bg-card2)">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">#</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Descripción</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Período</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Fecha pago</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Empleados</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Estado</th>
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Generado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of lotes" style="border-bottom:1px solid var(--border-light)">
                <td style="padding:10px 16px;color:var(--text-muted);font-size:12px">#{{ l.id }}</td>
                <td style="padding:10px 16px;font-weight:600">{{ l.descripcion }}</td>
                <td style="padding:10px 16px;font-size:12px">
                  {{ l.fechaInicial | date:'dd/MM/yy' }} – {{ l.fechaFinal | date:'dd/MM/yy' }}
                </td>
                <td style="padding:10px 16px;font-size:12px">{{ l.fechaPago | date:'dd/MM/yyyy' }}</td>
                <td style="padding:10px 16px;text-align:center">
                  <span style="font-weight:700">{{ l.totalEmpleados }}</span>
                  <span style="font-size:11px;color:var(--text-muted)">
                    (✅{{ l.totalExitosos }} ❌{{ l.totalFallidos }})
                  </span>
                </td>
                <td style="padding:10px 16px;text-align:center">
                  <span [style.background]="estadoBg(l.estado)"
                        [style.color]="estadoColor(l.estado)"
                        style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600">
                    {{ l.estado }}
                  </span>
                </td>
                <td style="padding:10px 16px;font-size:12px;color:var(--text-muted)">
                  {{ l.creadoEn | date:'dd/MM/yy HH:mm' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class NominaLotesComponent implements OnInit {
  rfcs:    any[]  = [];
  lotes:   any[]  = [];
  rfcId    = 0;
  cargando = false;

  constructor(private http: HttpClient, private rfcSvc: RfcService) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;
      if (rs.length === 1) { this.rfcId = rs[0].id; this.cargar(); }
    });
  }

  cargar(): void {
    if (!this.rfcId) return;
    this.cargando = true;
    this.http.get<any[]>(`${environment.facturacionUrl}/api/Nomina/lotes?rfcId=${this.rfcId}`)
      .subscribe({ next: l => { this.lotes = l; this.cargando = false; },
                   error: () => this.cargando = false });
  }

  estadoBg(e: string): string {
    return e === 'Completado' ? 'rgba(16,185,129,0.1)' :
           e === 'Fallido'    ? 'rgba(239,68,68,0.1)'  :
                                'rgba(251,191,36,0.1)';
  }

  estadoColor(e: string): string {
    return e === 'Completado' ? '#10b981' :
           e === 'Fallido'    ? '#ef4444' : '#f59e0b';
  }
}