import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RfcService } from '../../core/services/RFC/RfcService';
import { environment } from '../../../environments/environment';
import { Empleado } from '../../core/services/empleado/empleado';
import { EmpleadoService } from '../../core/services/empleado/empleadoService';
import { CalculoNomina } from '../../core/services/empleado/calculoNomina';


interface VariableExtra {
  tipoPercepcion: string;
  clave:          string;
  concepto:       string;
  importeGravado: number;
  importeExento:  number;
}

interface AjusteEmpleado {
  empleadoId:    number;
  nombre:        string;
  seleccionado:  boolean;
  variables:     VariableExtra[];
  calculo?:      CalculoNomina;
  estado?:       string;
  uuid?:         string;
  error?:        string;
}


@Component({
  selector: 'app-nomina-generar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-in" style="max-width:1100px">

      <!-- Header -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
            Generar Nómina
          </h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
            Calcula y timbra toda la nómina en un solo click
          </p>
        </div>
        <a routerLink="/nomina/lotes" class="btn-mag btn-ghost btn-sm">
          <span class="material-icons-round" style="font-size:16px">history</span>
          Ver historial
        </a>
      </div>

      <!-- ── PASO 1: Configuración del período ── -->
      <div class="card-mag" style="margin-bottom:16px">
        <div class="card-header-mag">
          <div>
            <div class="card-title">
              <span style="background:var(--accent);color:#000;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-right:8px">1</span>
              Período y RFC
            </div>
          </div>
        </div>
        <div class="card-body-mag">
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:0 16px" class="form-mag">
            <div class="form-group">
              <label>RFC Empresa *</label>
              <select class="form-control-mag" [(ngModel)]="rfcId" (change)="onRfcChange()">
                <option [value]="0">Seleccionar RFC...</option>
                <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Período</label>
              <select class="form-control-mag" [(ngModel)]="periodoRapido" (change)="onPeriodoRapido()">
                <option value="">Personalizado</option>
                <option value="Q1">Quincena 1 actual</option>
                <option value="Q2">Quincena 2 actual</option>
                <option value="M">Mes actual</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha inicio *</label>
              <input type="date" class="form-control-mag" [(ngModel)]="fechaInicial" (change)="calcularDias()">
            </div>
            <div class="form-group">
              <label>Fecha fin *</label>
              <input type="date" class="form-control-mag" [(ngModel)]="fechaFinal" (change)="calcularDias()">
            </div>
            <div class="form-group">
              <label>Fecha pago *</label>
              <input type="date" class="form-control-mag" [(ngModel)]="fechaPago">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:0 16px" class="form-mag">
            <div class="form-group">
              <label>Descripción del lote</label>
              <input type="text" class="form-control-mag" [(ngModel)]="descripcion"
                     placeholder="Ej: Quincena 1 Marzo 2026">
            </div>
            <div class="form-group">
              <label>Días efectivos</label>
              <input type="number" class="form-control-mag" [(ngModel)]="diasEfectivos" min="1" max="31" step="0.5">
            </div>
            <div class="form-group">
              <label>Periodicidad</label>
              <select class="form-control-mag" [(ngModel)]="periodicidadPago">
                <option value="04">Quincenal</option>
                <option value="05">Mensual</option>
                <option value="02">Semanal</option>
                <option value="03">Catorcenal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- ── PASO 2: Empleados y ajustes ── -->
      <div class="card-mag" style="margin-bottom:16px" *ngIf="empleados.length > 0">
        <div class="card-header-mag">
          <div>
            <div class="card-title">
              <span style="background:var(--accent);color:#000;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-right:8px">2</span>
              Empleados y ajustes variables
            </div>
            <div class="card-subtitle">Solo agrega lo que cambia: horas extra, bonos, faltas</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
              <input type="checkbox" [checked]="todosSeleccionados" (change)="toggleTodos($event)">
              Seleccionar todos
            </label>
            <span style="font-size:13px;color:var(--text-muted)">
              {{ empleadosSeleccionados.length }} / {{ ajustes.length }}
            </span>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-light);background:var(--bg-card2)">
                <th style="padding:10px 16px;width:40px"></th>
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Empleado</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Sueldo base</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Variables</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Neto estimado</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let a of ajustes">
                <!-- Fila principal -->
                <tr style="border-bottom:1px solid var(--border-light)"
                    [style.background]="a.estado === 'Timbrado' ? 'rgba(16,185,129,0.04)' : a.estado === 'Error' ? 'rgba(239,68,68,0.04)' : ''">
                  <td style="padding:10px 16px;text-align:center">
                    <input type="checkbox" [(ngModel)]="a.seleccionado" [disabled]="timbrandoLote">
                  </td>
                  <td style="padding:10px 16px">
                    <div style="font-weight:700">{{ a.nombre }}</div>
                    <div style="font-size:11px;color:var(--text-muted)">ID: {{ a.empleadoId }}</div>
                  </td>
                  <td style="padding:10px 16px;text-align:right;font-family:var(--font-display);font-weight:700">
                    {{ getSueldoBase(a.empleadoId) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                  </td>
                  <td style="padding:10px 16px;text-align:center">
                    <button type="button" class="btn-mag btn-ghost btn-sm"
                            (click)="toggleVariables(a)" [disabled]="timbrandoLote"
                            style="font-size:12px">
                      <span class="material-icons-round" style="font-size:14px">{{ a.variables.length > 0 ? 'edit' : 'add' }}</span>
                      {{ a.variables.length > 0 ? a.variables.length + ' extra(s)' : 'Agregar' }}
                    </button>
                  </td>
                  <td style="padding:10px 16px;text-align:right;font-family:var(--font-display);font-weight:700;color:var(--accent)">
                    {{ a.calculo ? (a.calculo.netoPagar | currency:'MXN':'symbol-narrow':'1.2-2') : '—' }}
                  </td>
                  <td style="padding:10px 16px;text-align:center">
                    <span *ngIf="!a.estado" style="font-size:11px;color:var(--text-muted)">Pendiente</span>
                    <span *ngIf="a.estado === 'Timbrado'"
                          style="background:rgba(16,185,129,0.1);color:#10b981;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                      ✅ {{ a.uuid?.substring(0,8) }}...
                    </span>
                    <span *ngIf="a.estado === 'Error'"
                          style="background:rgba(239,68,68,0.1);color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600"
                          [title]="a.error">
                      ❌ Error
                    </span>
                    <span *ngIf="a.estado === 'Procesando'"
                          style="background:rgba(20,184,166,0.1);color:var(--accent);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                      ⏳ Timbrando...
                    </span>
                  </td>
                </tr>

                <!-- Panel variables expandible -->
                <tr *ngIf="ajusteExpandido === a.empleadoId"
                    style="background:var(--bg-card2)">
                  <td colspan="6" style="padding:12px 20px">
                    <div style="display:flex;flex-direction:column;gap:8px">
                      <div *ngFor="let v of a.variables; let i=index"
                           style="display:grid;grid-template-columns:2fr 1fr 2fr 1fr 1fr auto;gap:0 10px;align-items:center" class="form-mag">
                        <div class="form-group" style="margin-bottom:0">
                          <select class="form-control-mag" [(ngModel)]="v.tipoPercepcion"
                                  (change)="onTipoVarChange(v)">
                            <option value="019">019 — Horas extra</option>
                            <option value="020">020 — Prima dominical</option>
                            <option value="021">021 — Prima vacacional</option>
                            <option value="038">038 — Otros ingresos</option>
                          </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                          <input type="text" class="form-control-mag" [(ngModel)]="v.clave" placeholder="Clave">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                          <input type="text" class="form-control-mag" [(ngModel)]="v.concepto" placeholder="Concepto">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                          <input type="number" class="form-control-mag" [(ngModel)]="v.importeGravado"
                                 placeholder="Gravado" min="0" step="0.01">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                          <input type="number" class="form-control-mag" [(ngModel)]="v.importeExento"
                                 placeholder="Exento" min="0" step="0.01">
                        </div>
                        <button type="button" class="btn-mag btn-danger btn-sm" (click)="a.variables.splice(i, 1)">
                          <span class="material-icons-round" style="font-size:14px">delete</span>
                        </button>
                      </div>
                      <button type="button" class="btn-mag btn-outline btn-sm" style="align-self:flex-start"
                              (click)="a.variables.push(newVariable())">
                        <span class="material-icons-round" style="font-size:14px">add</span>
                        Agregar concepto extra
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── PASO 3: Preview y totales ── -->
      <div class="card-mag" style="margin-bottom:16px" *ngIf="hayCalculos">
        <div class="card-header-mag">
          <div class="card-title">
            <span style="background:var(--accent);color:#000;width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;margin-right:8px">3</span>
            Vista previa de cálculos
          </div>
        </div>
        <div class="card-body-mag">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px">
            <div style="text-align:center;padding:16px;background:var(--bg-card2);border-radius:var(--radius-md)">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:6px">Total percepciones</div>
              <div style="font-size:20px;font-weight:800;font-family:var(--font-display);color:var(--accent)">
                {{ totalPercepciones | currency:'MXN':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center;padding:16px;background:var(--bg-card2);border-radius:var(--radius-md)">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:6px">Total IMSS obrero</div>
              <div style="font-size:20px;font-weight:800;font-family:var(--font-display)">
                {{ totalImss | currency:'MXN':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center;padding:16px;background:var(--bg-card2);border-radius:var(--radius-md)">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:6px">Total ISR</div>
              <div style="font-size:20px;font-weight:800;font-family:var(--font-display)">
                {{ totalIsr | currency:'MXN':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
            <div style="text-align:center;padding:16px;background:rgba(20,184,166,0.08);border-radius:var(--radius-md);border:1px solid rgba(20,184,166,0.2)">
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:600;margin-bottom:6px">Total neto a pagar</div>
              <div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--accent)">
                {{ totalNeto | currency:'MXN':'symbol-narrow':'1.0-0' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Botones de acción ── -->
      <div *ngIf="rfcId && empleados.length > 0"
           style="display:flex;gap:10px;justify-content:space-between;align-items:center;padding-bottom:32px">
        <div style="font-size:13px;color:var(--text-muted)">
          {{ empleadosSeleccionados.length }} empleado(s) seleccionado(s)
        </div>
        <div style="display:flex;gap:10px">
          <button type="button" class="btn-mag btn-outline btn-lg"
                  (click)="calcularPreview()" [disabled]="cargandoPreview || timbrandoLote">
            <span *ngIf="cargandoPreview" class="material-icons-round"
                  style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
            <span *ngIf="!cargandoPreview" class="material-icons-round" style="font-size:20px">calculate</span>
            {{ cargandoPreview ? 'Calculando...' : 'Calcular preview' }}
          </button>

          <button type="button" class="btn-mag btn-primary btn-lg"
                  (click)="timbrarLote()"
                  [disabled]="timbrandoLote || empleadosSeleccionados.length === 0">
            <span *ngIf="timbrandoLote" class="material-icons-round"
                  style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
            <span *ngIf="!timbrandoLote" class="material-icons-round" style="font-size:20px">payments</span>
            {{ timbrandoLote ? 'Timbrando ' + progreso + '...' : 'Timbrar ' + empleadosSeleccionados.length + ' recibo(s)' }}
          </button>
        </div>
      </div>

      <!-- ── Resultado final ── -->
      <div *ngIf="resultadoFinal" class="card-mag" style="margin-bottom:32px">
        <div class="card-header-mag">
          <div class="card-title">Resultado del timbrado</div>
          <div style="display:flex;gap:8px">
            <span style="background:rgba(16,185,129,0.1);color:#10b981;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
              ✅ {{ resultadoFinal.totalExitosos }} exitosos
            </span>
            <span *ngIf="resultadoFinal.totalFallidos > 0"
                  style="background:rgba(239,68,68,0.1);color:#ef4444;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600">
              ❌ {{ resultadoFinal.totalFallidos }} fallidos
            </span>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-light);background:var(--bg-card2)">
                <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Empleado</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Percepciones</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Deducciones</th>
                <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Neto</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">UUID</th>
                <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of resultadoFinal.cfdis"
                  style="border-bottom:1px solid var(--border-light)">
                <td style="padding:10px 16px;font-weight:600">{{ c.nombreEmpleado }}</td>
                <td style="padding:10px 16px;text-align:right">{{ c.totalPercepciones | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                <td style="padding:10px 16px;text-align:right;color:#ef4444">-{{ c.totalDeducciones | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:800;color:var(--accent)">{{ c.netoPagar | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                <td style="padding:10px 16px;text-align:center;font-family:monospace;font-size:11px">
                  {{ c.uuid || '—' }}
                </td>
                <td style="padding:10px 16px;text-align:center">
                  <span *ngIf="c.estado === 'Timbrado'"
                        style="background:rgba(16,185,129,0.1);color:#10b981;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                    Timbrado
                  </span>
                  <span *ngIf="c.estado === 'Error'"
                        style="background:rgba(239,68,68,0.1);color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600"
                        [title]="c.error">
                    Error
                  </span>
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
export class NominaGenerarComponent implements OnInit {
  rfcs:            any[]              = [];
  empleados:       Empleado[]         = [];
  ajustes:         AjusteEmpleado[]   = [];
  ajusteExpandido: number | null      = null;
  resultadoFinal:  any                = null;

  rfcId            = 0;
  descripcion      = '';
  fechaInicial     = '';
  fechaFinal       = '';
  fechaPago        = '';
  diasEfectivos    = 15;
  periodicidadPago = '04';
  periodoRapido    = 'Q1';

  cargandoPreview  = false;
  timbrandoLote    = false;
  progreso         = '';

  constructor(
    private rfcSvc:      RfcService,
    private empleadoSvc: EmpleadoService,
    private http:        HttpClient
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;
      if (rs.length === 1) { this.rfcId = rs[0].id; this.onRfcChange(); }
    });
    this.onPeriodoRapido(); // setear fechas iniciales
  }

  onRfcChange(): void {
    if (!this.rfcId) return;
    this.empleadoSvc.listar(this.rfcId).subscribe(es => {
      this.empleados = es;
      this.ajustes   = es.map(e => ({
        empleadoId:   e.id!,
        nombre:       e.nombre,
        seleccionado: true,
        variables:    [],
        calculo:      undefined,
        estado:       undefined
      }));
      this.calcularPreview();
    });
  }

  onPeriodoRapido(): void {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();

    if (this.periodoRapido === 'Q1') {
      this.fechaInicial     = `${y}-${String(m+1).padStart(2,'0')}-01`;
      this.fechaFinal       = `${y}-${String(m+1).padStart(2,'0')}-15`;
      this.fechaPago        = `${y}-${String(m+1).padStart(2,'0')}-15`;
      this.diasEfectivos    = 15;
      this.descripcion      = `Quincena 1 ${this.getMesNombre(m)} ${y}`;
    } else if (this.periodoRapido === 'Q2') {
      const diasMes = new Date(y, m+1, 0).getDate();
      this.fechaInicial     = `${y}-${String(m+1).padStart(2,'0')}-16`;
      this.fechaFinal       = `${y}-${String(m+1).padStart(2,'0')}-${diasMes}`;
      this.fechaPago        = `${y}-${String(m+1).padStart(2,'0')}-${diasMes}`;
      this.diasEfectivos    = diasMes - 15;
      this.descripcion      = `Quincena 2 ${this.getMesNombre(m)} ${y}`;
    } else if (this.periodoRapido === 'M') {
      const diasMes = new Date(y, m+1, 0).getDate();
      this.fechaInicial     = `${y}-${String(m+1).padStart(2,'0')}-01`;
      this.fechaFinal       = `${y}-${String(m+1).padStart(2,'0')}-${diasMes}`;
      this.fechaPago        = `${y}-${String(m+1).padStart(2,'0')}-${diasMes}`;
      this.diasEfectivos    = 30;
      this.descripcion      = `Mensual ${this.getMesNombre(m)} ${y}`;
    }
  }

  calcularDias(): void {
    if (this.fechaInicial && this.fechaFinal) {
      const d1 = new Date(this.fechaInicial);
      const d2 = new Date(this.fechaFinal);
      this.diasEfectivos = Math.round((d2.getTime() - d1.getTime()) / 86400000) + 1;
    }
  }

  calcularPreview(): void {
    if (!this.rfcId || this.empleadosSeleccionados.length === 0) return;
    this.cargandoPreview = true;

    const payload = {
      rfcId:                 this.rfcId,
      empleadoIds:           this.empleadosSeleccionados.map(a => a.empleadoId),
      diasEfectivos:         this.diasEfectivos,
      percepcionesVariables: this.buildVariablesMap()
    };

    this.empleadoSvc.calcularPreview(payload).subscribe({
      next: calculos => {
        calculos.forEach(c => {
          const a = this.ajustes.find(x => x.empleadoId === c.empleadoId);
          if (a) a.calculo = c;
        });
        this.cargandoPreview = false;
      },
      error: () => this.cargandoPreview = false
    });
  }

  timbrarLote(): void {
    if (!confirm(`¿Timbrar ${this.empleadosSeleccionados.length} recibo(s) de nómina?`)) return;
    this.timbrandoLote  = true;
    this.resultadoFinal = null;
    this.progreso       = '0/' + this.empleadosSeleccionados.length;

    // Marcar todos como procesando
    this.empleadosSeleccionados.forEach(a => a.estado = 'Procesando');

    const payload = {
      rfcId:                 this.rfcId,
      descripcion:           this.descripcion,
      fechaInicial:          this.fechaInicial,
      fechaFinal:            this.fechaFinal,
      fechaPago:             this.fechaPago,
      diasEfectivos:         this.diasEfectivos,
      periodicidadPago:      this.periodicidadPago,
      empleadoIds:           this.empleadosSeleccionados.map(a => a.empleadoId),
      percepcionesVariables: this.buildVariablesMap()
    };

    this.http.post<any>(`${environment.facturacionUrl}/api/Nomina/generar-lote`, payload)
      .subscribe({
        next: resultado => {
          this.resultadoFinal = resultado;
          this.timbrandoLote  = false;

          // Actualizar estado en la tabla
          resultado.cfdis.forEach((c: any) => {
            const a = this.ajustes.find(x => x.empleadoId === c.empleadoId);
            if (a) { a.estado = c.estado; a.uuid = c.uuid; a.error = c.error; }
          });
        },
        error: err => {
          this.timbrandoLote = false;
          alert('Error al timbrar: ' + (err.error?.message ?? err.message));
          this.empleadosSeleccionados.forEach(a => a.estado = undefined);
        }
      });
  }

  // ── Helpers ───────────────────────────────────────────────
  get empleadosSeleccionados(): AjusteEmpleado[] {
    return this.ajustes.filter(a => a.seleccionado);
  }

  get todosSeleccionados(): boolean {
    return this.ajustes.every(a => a.seleccionado);
  }

  get hayCalculos(): boolean {
    return this.ajustes.some(a => a.calculo);
  }

  get totalPercepciones(): number {
    return this.ajustes.reduce((s, a) => s + (a.calculo?.totalSueldos ?? 0), 0);
  }

  get totalImss(): number {
    return this.ajustes.reduce((s, a) => s + (a.calculo?.imssObrero ?? 0), 0);
  }

  get totalIsr(): number {
    return this.ajustes.reduce((s, a) => s + (a.calculo?.isr ?? 0), 0);
  }

  get totalNeto(): number {
    return this.ajustes.reduce((s, a) => s + (a.calculo?.netoPagar ?? 0), 0);
  }

  getSueldoBase(empleadoId: number): number {
    return this.empleados.find(e => e.id === empleadoId)?.salarioBase ?? 0;
  }

  toggleTodos(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.ajustes.forEach(a => a.seleccionado = checked);
  }

  toggleVariables(a: AjusteEmpleado): void {
    this.ajusteExpandido = this.ajusteExpandido === a.empleadoId ? null : a.empleadoId;
  }

  newVariable(): VariableExtra {
    return { tipoPercepcion: '019', clave: '019', concepto: 'Horas extra', importeGravado: 0, importeExento: 0 };
  }

  onTipoVarChange(v: VariableExtra): void {
    const map: Record<string, string> = {
      '019': 'Horas extra', '020': 'Prima dominical',
      '021': 'Prima vacacional', '038': 'Otros ingresos'
    };
    v.concepto = map[v.tipoPercepcion] ?? v.concepto;
    v.clave    = v.tipoPercepcion;
  }

  buildVariablesMap(): Record<number, any[]> {
    const map: Record<number, any[]> = {};
    this.ajustes.forEach(a => {
      if (a.variables.length > 0) map[a.empleadoId] = a.variables;
    });
    return map;
  }

  getMesNombre(m: number): string {
    return ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
            'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m];
  }
}
