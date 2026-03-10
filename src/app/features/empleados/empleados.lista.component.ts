import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RfcService } from '../../core/services/RFC/RfcService';
import { RfcList } from '../../core/models/RFC/RfcList';
import { Empleado } from '../../core/services/empleado/empleado';
import { EmpleadoService } from '../../core/services/empleado/empleadoService';

@Component({
  selector: 'app-empleados-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in" style="max-width:1100px">
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Empleados</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
            Catálogo de trabajadores para emisión de nómina
          </p>
        </div>
        <a routerLink="/empleados/new" class="btn-mag btn-primary btn-lg">
          <span class="material-icons-round" style="font-size:20px">person_add</span>
          Nuevo empleado
        </a>
      </div>

      <!-- Filtros -->
      <div class="card-mag" style="margin-bottom:16px">
        <div class="card-body-mag" style="padding:12px 20px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <select class="form-control-mag" style="width:auto;min-width:240px"
                    [(ngModel)]="rfcIdSeleccionado" (change)="cargar()">
              <option [value]="0">— Seleccionar RFC —</option>
              <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
            </select>
            <input type="text" class="form-control-mag" style="width:220px"
                   placeholder="Buscar por nombre o NSS..."
                   [(ngModel)]="busqueda">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
              <input type="checkbox" [(ngModel)]="mostrarInactivos" (change)="cargar()">
              Mostrar inactivos
            </label>
            <span style="font-size:13px;color:var(--text-muted);margin-left:auto">
              {{ empleadosFiltrados.length }} empleado(s)
            </span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" style="text-align:center;padding:40px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:40px;animation:spin 1s linear infinite;display:block">refresh</span>
        <div style="margin-top:8px">Cargando empleados...</div>
      </div>

      <!-- Sin RFC -->
      <div *ngIf="!loading && rfcIdSeleccionado === 0"
           style="text-align:center;padding:48px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:12px">people</span>
        Selecciona un RFC para ver sus empleados
      </div>

      <!-- Sin empleados -->
      <div *ngIf="!loading && rfcIdSeleccionado > 0 && empleados.length === 0"
           style="text-align:center;padding:48px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:12px">person_off</span>
        Sin empleados registrados.
        <div style="margin-top:12px">
          <a routerLink="/empleados/nuevo" class="btn-mag btn-primary btn-sm">Agregar primero</a>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag" *ngIf="!loading && empleadosFiltrados.length > 0" style="overflow:hidden">
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-light);background:var(--bg-card2)">
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Empleado</th>
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">NSS</th>
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Puesto</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Salario base</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">SDI</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Período</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Estado</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of empleadosFiltrados"
                  style="border-bottom:1px solid var(--border-light)"
                  [style.opacity]="e.activo ? 1 : 0.5">
                <td style="padding:12px 16px">
                  <div style="font-weight:700;font-size:13px">{{ e.nombre }}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ e.curp }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">No. {{ e.numEmpleado }}</div>
                </td>
                <td style="padding:12px 16px;font-family:monospace;font-size:12px">{{ e.nss }}</td>
                <td style="padding:12px 16px">
                  <div>{{ e.puesto || '—' }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ e.departamento }}</div>
                </td>
                <td style="padding:12px 16px;text-align:right;font-family:var(--font-display);font-weight:700">
                  {{ e.salarioBase | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </td>
                <td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--text-muted)">
                  {{ e.salarioDiarioIntegrado | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <span style="background:rgba(20,184,166,0.1);color:var(--accent);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                    {{ getPeriodo(e.periodicidadPago) }}
                  </span>
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <span *ngIf="e.activo"
                        style="background:rgba(16,185,129,0.1);color:#10b981;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                    Activo
                  </span>
                  <span *ngIf="!e.activo"
                        style="background:rgba(239,68,68,0.1);color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                    Inactivo
                  </span>
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <div style="display:flex;gap:4px;justify-content:center">
                    <a [routerLink]="['/empleados', e.id, 'editar']"
                       class="btn-mag btn-ghost btn-sm" style="padding:4px 8px">
                      <span class="material-icons-round" style="font-size:16px">edit</span>
                    </a>
                    <button type="button" class="btn-mag btn-danger btn-sm"
                            style="padding:4px 8px" *ngIf="e.activo"
                            (click)="desactivar(e)">
                      <span class="material-icons-round" style="font-size:16px">person_off</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `
})
export class EmpleadosListaComponent implements OnInit {
  rfcs:              RfcList[]  = [];
  empleados:         Empleado[] = [];
  rfcIdSeleccionado  = 0;
  busqueda           = '';
  mostrarInactivos   = false;
  loading            = false;

  constructor(
    private empleadoSvc: EmpleadoService,
    private rfcSvc:      RfcService
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;
      if (rs.length === 1) { this.rfcIdSeleccionado = rs[0].id; this.cargar(); }
    });
  }

  cargar(): void {
    if (!this.rfcIdSeleccionado) return;
    this.loading = true;
    this.empleadoSvc.listar(this.rfcIdSeleccionado, !this.mostrarInactivos).subscribe({
      next: es => { this.empleados = es; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get empleadosFiltrados(): Empleado[] {
    const b = this.busqueda.toLowerCase();
    return this.empleados.filter(e =>
      !b || e.nombre.toLowerCase().includes(b) || e.nss.includes(b));
  }

  desactivar(e: Empleado): void {
    if (!confirm(`¿Desactivar a ${e.nombre}?`)) return;
    this.empleadoSvc.desactivar(e.id!).subscribe(() => this.cargar());
  }

  getPeriodo(p: string): string {
    const m: Record<string, string> = {
      '01':'Diario','02':'Semanal','03':'Catorcenal',
      '04':'Quincenal','05':'Mensual','06':'Bimestral','10':'Decenal'
    };
    return m[p] ?? p;
  }
}
