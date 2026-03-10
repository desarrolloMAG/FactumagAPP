import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  FormArray, Validators
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RfcService } from '../../core/services/RFC/RfcService';
import { RfcList } from '../../core/models/RFC/RfcList';
import { EmpleadoService } from '../../core/services/empleado/empleadoService';

const TIPOS_PERCEPCION = [
  {value:'001',label:'001 — Sueldos, Salarios Rayas y Jornales'},
  {value:'005',label:'005 — Fondo de Ahorro'},
  {value:'019',label:'019 — Horas extra'},
  {value:'020',label:'020 — Prima dominical'},
  {value:'021',label:'021 — Prima vacacional'},
  {value:'029',label:'029 — Vales de despensa'},
  {value:'036',label:'036 — Ayuda para transporte'},
  {value:'038',label:'038 — Otros ingresos por salarios'},
];

const PERIODICIDADES = [
  {value:'01',label:'01 — Diario'},   {value:'02',label:'02 — Semanal'},
  {value:'03',label:'03 — Catorcenal'},{value:'04',label:'04 — Quincenal'},
  {value:'05',label:'05 — Mensual'},  {value:'10',label:'10 — Decenal'},
];

const ENTIDADES = [
  {value:'AGU',label:'AGU — Aguascalientes'},{value:'BCN',label:'BCN — Baja California'},
  {value:'CMX',label:'CMX — Ciudad de México'},{value:'JAL',label:'JAL — Jalisco'},
  {value:'MEX',label:'MEX — Estado de México'},{value:'MOR',label:'MOR — Morelos'},
  {value:'NLE',label:'NLE — Nuevo León'},{value:'SON',label:'SON — Sonora'},
  {value:'VER',label:'VER — Veracruz'},{value:'NE',label:'NE — No establecido'},
];

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in" style="max-width:960px">
      <div style="margin-bottom:24px">
        <a routerLink="/empleados" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span> Empleados
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ esEdicion ? 'Editar empleado' : 'Nuevo empleado' }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- 1. Datos del empleador -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div class="card-title">1. RFC Emisor</div>
            </div>
            <div class="card-body-mag">
              <div class="form-group">
                <label>RFC Empresa *</label>
                <select formControlName="rfcId" class="form-control-mag">
                  <option [value]="0">Seleccionar...</option>
                  <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 2. Datos personales -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div class="card-title">2. Datos personales</div>
            </div>
            <div class="card-body-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                <div class="form-group" style="grid-column:1/-1">
                  <label>Nombre completo (como en IMSS) *</label>
                  <input type="text" formControlName="nombre" class="form-control-mag"
                         placeholder="APELLIDO APELLIDO NOMBRE" style="text-transform:uppercase">
                </div>
                <div class="form-group">
                  <label>CURP *</label>
                  <input type="text" formControlName="curp" class="form-control-mag"
                         maxlength="18" style="font-family:monospace;text-transform:uppercase">
                </div>
                <div class="form-group">
                  <label>NSS *</label>
                  <input type="text" formControlName="nss" class="form-control-mag"
                         maxlength="11" style="font-family:monospace" placeholder="12345678901">
                </div>
                <div class="form-group">
                  <label>No. Empleado *</label>
                  <input type="text" formControlName="numEmpleado" class="form-control-mag">
                </div>
                <div class="form-group">
                  <label>Departamento</label>
                  <input type="text" formControlName="departamento" class="form-control-mag">
                </div>
                <div class="form-group">
                  <label>Puesto</label>
                  <input type="text" formControlName="puesto" class="form-control-mag">
                </div>
                <div class="form-group">
                  <label>Fecha inicio relación laboral *</label>
                  <input type="date" formControlName="fechaInicioRelLaboral" class="form-control-mag">
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Datos laborales -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div class="card-title">3. Datos laborales SAT</div>
            </div>
            <div class="card-body-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                <div class="form-group">
                  <label>Tipo de contrato *</label>
                  <select formControlName="tipoContrato" class="form-control-mag">
                    <option value="01">01 — Por tiempo indeterminado</option>
                    <option value="02">02 — Para obra determinada</option>
                    <option value="03">03 — Por tiempo determinado</option>
                    <option value="04">04 — Por temporada</option>
                    <option value="99">99 — Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Tipo de régimen *</label>
                  <select formControlName="tipoRegimen" class="form-control-mag">
                    <option value="02">02 — Sueldos</option>
                    <option value="03">03 — Jubilados</option>
                    <option value="09">09 — Asimilados — Honorarios</option>
                    <option value="99">99 — Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Periodicidad de pago *</label>
                  <select formControlName="periodicidadPago" class="form-control-mag">
                    <option *ngFor="let p of periodicidades" [value]="p.value">{{ p.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Registro patronal *</label>
                  <input type="text" formControlName="registroPatronal" class="form-control-mag" placeholder="A1234567891">
                </div>
                <div class="form-group">
                  <label>Riesgo de trabajo *</label>
                  <select formControlName="riesgoTrabajo" class="form-control-mag">
                    <option value="1">1 — Clase I (menor riesgo)</option>
                    <option value="2">2 — Clase II</option>
                    <option value="3">3 — Clase III</option>
                    <option value="4">4 — Clase IV</option>
                    <option value="5">5 — Clase V (mayor riesgo)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Entidad federativa empleador *</label>
                  <select formControlName="entidadFederativa" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Clave entidad federativa trabajador *</label>
                  <select formControlName="claveEntFed" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>CURP del patrón</label>
                  <input type="text" formControlName="curpPatron" class="form-control-mag" maxlength="18" style="font-family:monospace">
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Salario -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div class="card-title">4. Salario</div>
              <div style="font-size:12px;color:var(--text-muted)">
                SDI = Salario Base + partes proporcionales de prestaciones
              </div>
            </div>
            <div class="card-body-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px" class="form-mag">
                <div class="form-group">
                  <label>Salario base de cotización *</label>
                  <input type="number" formControlName="salarioBase" class="form-control-mag"
                         min="0" step="0.01" placeholder="Salario del período">
                </div>
                <div class="form-group">
                  <label>Salario Diario Integrado (SDI) *</label>
                  <input type="number" formControlName="salarioDiarioIntegrado" class="form-control-mag"
                         min="0" step="0.01" placeholder="Incluye prestaciones">
                </div>
              </div>
              <div style="padding:10px 14px;background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:6px;font-size:12px;color:var(--text-muted);margin-top:4px">
                <strong>SDI mínimo 2025:</strong> $278.80/día (salario mínimo).
                SDI = (salario mensual × 12 + aguinaldo + vacaciones + prima vacacional) ÷ 365
              </div>
            </div>
          </div>

          <!-- 5. Banco -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div class="card-title">5. Datos bancarios <span style="font-size:12px;font-weight:400;color:var(--text-muted)">opcional</span></div>
            </div>
            <div class="card-body-mag">
              <div style="display:grid;grid-template-columns:1fr 2fr;gap:0 20px" class="form-mag">
                <div class="form-group">
                  <label>Banco</label>
                  <select formControlName="banco" class="form-control-mag">
                    <option value="">Sin banco</option>
                    <option value="002">002 — BBVA Bancomer</option>
                    <option value="012">012 — HSBC</option>
                    <option value="014">014 — Santander</option>
                    <option value="044">044 — Scotiabank</option>
                    <option value="058">058 — Banregio</option>
                    <option value="072">072 — Banorte</option>
                    <option value="127">127 — Azteca</option>
                    <option value="646">646 — STP</option>
                    <option value="728">728 — Spin by OXXO</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>CLABE (18 dígitos)</label>
                  <input type="text" formControlName="cuentaBancaria" class="form-control-mag"
                         maxlength="18" style="font-family:monospace" placeholder="000000000000000000">
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Percepciones base -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div>
                <div class="card-title">6. Percepciones fijas</div>
                <div class="card-subtitle">
                  Conceptos que se repiten cada período.
                  El sistema los multiplica automáticamente por los días trabajados.
                </div>
              </div>
              <button type="button" class="btn-mag btn-outline btn-sm" (click)="addPercepcion()">
                <span class="material-icons-round" style="font-size:16px">add</span> Agregar
              </button>
            </div>
            <div class="card-body-mag" style="padding:0" formArrayName="percepcionesBase">
              <div *ngFor="let p of percepcionesBase.controls; let i=index"
                   [formGroupName]="i"
                   style="padding:14px 20px;border-bottom:1px solid var(--border-light)">
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:0 12px;align-items:end" class="form-mag">
                  <div class="form-group" style="margin-bottom:0">
                    <label>Tipo *</label>
                    <select formControlName="tipoPercepcion" class="form-control-mag"
                            (change)="onTipoPercepcionChange(p, $event)">
                      <option *ngFor="let t of tiposPercepcion" [value]="t.value">{{ t.label }}</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label>Clave *</label>
                    <input type="text" formControlName="clave" class="form-control-mag" placeholder="001">
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label>Concepto *</label>
                    <input type="text" formControlName="concepto" class="form-control-mag">
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label>Imp. Gravado *</label>
                    <input type="number" formControlName="importeGravado" class="form-control-mag" min="0" step="0.01">
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label>Imp. Exento</label>
                    <input type="number" formControlName="importeExento" class="form-control-mag" min="0" step="0.01">
                  </div>
                  <button type="button" class="btn-mag btn-danger btn-sm" (click)="percepcionesBase.removeAt(i)" style="margin-bottom:2px">
                    <span class="material-icons-round" style="font-size:14px">delete</span>
                  </button>
                </div>
              </div>

              <!-- Totales -->
              <div *ngIf="percepcionesBase.length > 0"
                   style="padding:12px 20px;background:var(--bg-card2);border-top:1px solid var(--border);display:flex;gap:24px;justify-content:flex-end;font-size:13px">
                <span>Gravado total:
                  <strong>{{ totalGravadoBase | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong>
                </span>
                <span>Exento total:
                  <strong>{{ totalExentoBase | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong>
                </span>
                <span style="font-size:15px;font-weight:800;color:var(--accent)">
                  Total percepciones:
                  {{ (totalGravadoBase + totalExentoBase) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </span>
              </div>

              <div *ngIf="percepcionesBase.length === 0"
                   style="padding:20px;text-align:center;font-size:13px;color:var(--text-muted)">
                Agrega al menos el sueldo del empleado
              </div>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="errorMsg"
               style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:14px 18px;font-size:13px;color:var(--danger);display:flex;gap:10px;align-items:center">
            <span class="material-icons-round" style="font-size:20px;flex-shrink:0">error_outline</span>
            {{ errorMsg }}
          </div>

          <!-- Botones -->
          <div style="display:flex;justify-content:flex-end;gap:10px;padding-bottom:32px">
            <a routerLink="/empleados" class="btn-mag btn-ghost btn-lg">Cancelar</a>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round"
                    style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">save</span>
              {{ loading ? 'Guardando...' : 'Guardar empleado' }}
            </button>
          </div>
        </div>
      </form>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class EmpleadoFormComponent implements OnInit {
  form!:     FormGroup;
  rfcs:      RfcList[] = [];
  esEdicion  = false;
  empleadoId = 0;
  loading    = false;
  errorMsg   = '';

  tiposPercepcion = TIPOS_PERCEPCION;
  periodicidades  = PERIODICIDADES;
  entidades       = ENTIDADES;

  constructor(
    private fb:          FormBuilder,
    private empleadoSvc: EmpleadoService,
    private rfcSvc:      RfcService,
    private router:      Router,
    private route:       ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);

    this.form = this.fb.group({
      rfcId:                  [0,  Validators.required],
      nombre:                 ['', Validators.required],
      curp:                   ['', [Validators.required, Validators.minLength(18)]],
      nss:                    ['', [Validators.required, Validators.minLength(11)]],
      numEmpleado:            ['', Validators.required],
      tipoContrato:           ['01'],
      tipoRegimen:            ['02'],
      periodicidadPago:       ['04'],
      registroPatronal:       ['', Validators.required],
      entidadFederativa:      ['', Validators.required],
      claveEntFed:            ['', Validators.required],
      riesgoTrabajo:          ['1'],
      departamento:           [''],
      puesto:                 [''],
      fechaInicioRelLaboral:  ['', Validators.required],
      salarioBase:            [0,  [Validators.required, Validators.min(0.01)]],
      salarioDiarioIntegrado: [0,  [Validators.required, Validators.min(0.01)]],
      banco:                  [''],
      cuentaBancaria:         [''],
      curpPatron:             [''],
      percepcionesBase:       this.fb.array([])
    });

    // Modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.empleadoId = +id;
      this.empleadoSvc.obtener(this.empleadoId).subscribe(e => {
        this.form.patchValue(e);
        e.percepcionesBase.forEach(p => this.percepcionesBase.push(this.newPercepcion(p)));
      });
    } else {
      // Agregar sueldo por defecto
      this.addPercepcion();
    }
  }

  get percepcionesBase(): FormArray {
    return this.form.get('percepcionesBase') as FormArray;
  }

  get totalGravadoBase(): number {
    return this.percepcionesBase.controls.reduce(
      (s, c) => s + (+c.get('importeGravado')!.value || 0), 0);
  }

  get totalExentoBase(): number {
    return this.percepcionesBase.controls.reduce(
      (s, c) => s + (+c.get('importeExento')!.value || 0), 0);
  }

  newPercepcion(p?: any): FormGroup {
    return this.fb.group({
      tipoPercepcion: [p?.tipoPercepcion || '001'],
      clave:          [p?.clave          || '001'],
      concepto:       [p?.concepto       || 'Sueldo'],
      importeGravado: [p?.importeGravado || 0],
      importeExento:  [p?.importeExento  || 0],
    });
  }

  addPercepcion(): void {
    this.percepcionesBase.push(this.newPercepcion());
  }

  onTipoPercepcionChange(ctrl: any, event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const t   = TIPOS_PERCEPCION.find(x => x.value === val);
    if (t) ctrl.get('concepto').setValue(t.label.split(' — ')[1]);
    ctrl.get('clave').setValue(val);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMsg = '';

    const payload = this.form.getRawValue();

    const obs = this.esEdicion
      ? this.empleadoSvc.actualizar(this.empleadoId, payload)
      : this.empleadoSvc.crear(payload);

    obs.subscribe({
      next:  () => this.router.navigate(['/empleados']),
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err.error?.message ?? 'Error al guardar el empleado.';
      }
    });
  }
}