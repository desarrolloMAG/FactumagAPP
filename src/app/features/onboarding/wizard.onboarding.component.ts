import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { Rfc } from '../../core/models/RFC/Rfc';
import { Cliente } from '../../core/models/cliente/Cliente';
import { CfdiDetalle } from '../../core/models/CFDI/CfdiDetalle';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { USOS_CFDI } from '../../core/models/CFDI/Catálogos/USOS_CFDI';
import { FORMAS_PAGO } from '../../core/models/CFDI/Catálogos/FORMAS_PAGO';

@Component({
  selector: 'app-wizard-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Overlay -->
    <div class="wiz-overlay" (click)="onOverlayClick($event)">
      <div class="wiz-modal animate-in" (click)="$event.stopPropagation()">

        <!-- Barra de progreso -->
        <div class="wiz-progress-bar" *ngIf="step > 0 && step < 5">
          <div class="wiz-progress-fill" [style.width.%]="(step / 4) * 100"></div>
        </div>

        <!-- ═══ PASO 0: Bienvenida ═══ -->
        <div *ngIf="step === 0" class="wiz-body wiz-welcome">
          <div class="wiz-icon-big">
            <span class="material-icons-round">receipt_long</span>
          </div>
          <h2 class="wiz-title">¡Bienvenido a Facturag!</h2>
          <p class="wiz-desc">
            En menos de 5 minutos emitirás tu primera factura electrónica.<br>
            Te guiamos paso a paso.
          </p>
          <div class="wiz-steps-preview">
            <div class="wiz-step-chip">
              <span class="material-icons-round">business</span>
              Tu empresa
            </div>
            <span class="material-icons-round wiz-arrow">arrow_forward</span>
            <div class="wiz-step-chip">
              <span class="material-icons-round">person</span>
              Tu cliente
            </div>
            <span class="material-icons-round wiz-arrow">arrow_forward</span>
            <div class="wiz-step-chip">
              <span class="material-icons-round">receipt</span>
              Primera factura
            </div>
          </div>
          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="skip()">Saltar por ahora</button>
            <button class="btn-mag btn-primary" (click)="step = 1">
              Empezar
              <span class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ═══ PASO 1: RFC Emisor ═══ -->
        <div *ngIf="step === 1" class="wiz-body">
          <div class="wiz-step-label">Paso 1 de 3</div>
          <div class="wiz-icon">
            <span class="material-icons-round">business</span>
          </div>
          <h2 class="wiz-title">Datos de tu empresa</h2>
          <p class="wiz-desc">Registra el RFC con el que emitirás facturas.</p>

          <form [formGroup]="rfcForm" class="wiz-form">
            <div class="form-group">
              <label>RFC *</label>
              <input type="text" formControlName="rfc" class="form-control-mag"
                     [class.error-field]="rfcErr('rfc')"
                     placeholder="AAA010101AAA"
                     style="font-family:monospace;font-weight:700;letter-spacing:1px"
                     (input)="toUpperRfc($event)">
              <div class="field-error" *ngIf="rfcErr('rfc')">RFC inválido (12 o 13 caracteres alfanuméricos)</div>
            </div>

            <div class="form-group">
              <label>Razón Social *</label>
              <input type="text" formControlName="razonSocial" class="form-control-mag"
                     [class.error-field]="rfcErr('razonSocial')"
                     placeholder="MI EMPRESA SA DE CV"
                     (input)="toUpperField($event, rfcForm, 'razonSocial')">
              <div class="field-error" *ngIf="rfcErr('razonSocial')">Campo requerido</div>
            </div>

            <div class="form-group">
              <label>Régimen Fiscal *</label>
              <select formControlName="regimenFiscal" class="form-control-mag"
                      [class.error-field]="rfcErr('regimenFiscal')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
              </select>
              <div class="field-error" *ngIf="rfcErr('regimenFiscal')">Campo requerido</div>
            </div>

            <div class="form-group">
              <label>Código Postal *</label>
              <input type="text" formControlName="codigoPostal" class="form-control-mag"
                     [class.error-field]="rfcErr('codigoPostal')"
                     placeholder="06600" maxlength="5">
              <div class="field-error" *ngIf="rfcErr('codigoPostal')">5 dígitos requeridos</div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 0">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitRfc()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Continuar</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO 2: Cliente / Receptor ═══ -->
        <div *ngIf="step === 2" class="wiz-body">
          <div class="wiz-step-label">Paso 2 de 3</div>
          <div class="wiz-icon">
            <span class="material-icons-round">person_outline</span>
          </div>
          <h2 class="wiz-title">Datos de tu cliente</h2>
          <p class="wiz-desc">¿A quién le vas a facturar?</p>

          <form [formGroup]="clienteForm" class="wiz-form">
            <div class="form-group">
              <label>RFC del cliente *</label>
              <input type="text" formControlName="rfc" class="form-control-mag"
                     [class.error-field]="clienteErr('rfc')"
                     placeholder="XAXX010101000"
                     style="font-family:monospace;font-weight:700;letter-spacing:1px"
                     (input)="toUpperField($event, clienteForm, 'rfc')">
              <div class="field-hint">Usa XAXX010101000 para público en general</div>
              <div class="field-error" *ngIf="clienteErr('rfc')">RFC inválido</div>
            </div>

            <div class="form-group">
              <label>Nombre / Razón Social *</label>
              <input type="text" formControlName="nombre" class="form-control-mag"
                     [class.error-field]="clienteErr('nombre')"
                     placeholder="JUAN PÉREZ GARCÍA"
                     (input)="toUpperField($event, clienteForm, 'nombre')">
              <div class="field-error" *ngIf="clienteErr('nombre')">Campo requerido</div>
            </div>

            <div class="form-group">
              <label>Uso del CFDI *</label>
              <select formControlName="usoCfdi" class="form-control-mag"
                      [class.error-field]="clienteErr('usoCfdi')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
              </select>
              <div class="field-error" *ngIf="clienteErr('usoCfdi')">Campo requerido</div>
            </div>

            <div class="form-group">
              <label>Régimen Fiscal del cliente *</label>
              <select formControlName="regimenFiscal" class="form-control-mag"
                      [class.error-field]="clienteErr('regimenFiscal')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
              </select>
              <div class="field-error" *ngIf="clienteErr('regimenFiscal')">Campo requerido</div>
            </div>

            <div class="form-group">
              <label>Código Postal del cliente *</label>
              <input type="text" formControlName="codigoPostal" class="form-control-mag"
                     [class.error-field]="clienteErr('codigoPostal')"
                     placeholder="06600" maxlength="5">
              <div class="field-error" *ngIf="clienteErr('codigoPostal')">5 dígitos requeridos</div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 1">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitCliente()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Continuar</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO 3: Primera factura ═══ -->
        <div *ngIf="step === 3" class="wiz-body">
          <div class="wiz-step-label">Paso 3 de 3</div>
          <div class="wiz-icon">
            <span class="material-icons-round">receipt</span>
          </div>
          <h2 class="wiz-title">Tu primera factura</h2>
          <p class="wiz-desc">Describe qué vas a cobrar y cómo te van a pagar.</p>

          <div class="wiz-summary-chips">
            <span class="wiz-chip">
              <span class="material-icons-round" style="font-size:13px">business</span>
              {{ rfcCreado?.rfc }}
            </span>
            <span class="material-icons-round" style="font-size:14px;color:var(--text-muted)">arrow_forward</span>
            <span class="wiz-chip">
              <span class="material-icons-round" style="font-size:13px">person</span>
              {{ clienteCreado?.nombre | slice:0:20 }}
            </span>
          </div>

          <form [formGroup]="facturaForm" class="wiz-form">
            <div class="form-group">
              <label>Descripción del servicio o producto *</label>
              <input type="text" formControlName="descripcion" class="form-control-mag"
                     [class.error-field]="factErr('descripcion')"
                     placeholder="Ej: Consultoría de sistemas">
              <div class="field-error" *ngIf="factErr('descripcion')">Campo requerido</div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label>Precio unitario (MXN) *</label>
                <input type="number" formControlName="precio" class="form-control-mag"
                       [class.error-field]="factErr('precio')"
                       placeholder="1000.00" min="0.01" step="0.01">
                <div class="field-error" *ngIf="factErr('precio')">Precio requerido</div>
              </div>

              <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" formControlName="cantidad" class="form-control-mag"
                       [class.error-field]="factErr('cantidad')"
                       placeholder="1" min="1">
                <div class="field-error" *ngIf="factErr('cantidad')">Mínimo 1</div>
              </div>
            </div>

            <div class="form-group">
              <label>Forma de pago *</label>
              <select formControlName="formaPago" class="form-control-mag"
                      [class.error-field]="factErr('formaPago')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let f of formasPago" [value]="f.value">{{ f.label }}</option>
              </select>
              <div class="field-error" *ngIf="factErr('formaPago')">Campo requerido</div>
            </div>

            <!-- Resumen de totales -->
            <div class="wiz-totals" *ngIf="subtotal > 0">
              <div class="wiz-total-row">
                <span>Subtotal</span>
                <span>{{ subtotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="wiz-total-row">
                <span>IVA 16%</span>
                <span>{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="wiz-total-row wiz-total-final">
                <span>Total</span>
                <span>{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 2">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitFactura()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Emitir Factura</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">bolt</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO 4: Éxito ═══ -->
        <div *ngIf="step === 4" class="wiz-body wiz-success">
          <div class="wiz-icon-big wiz-icon-success">
            <span class="material-icons-round">check_circle</span>
          </div>
          <h2 class="wiz-title">¡Factura emitida!</h2>
          <p class="wiz-desc">
            Tu primer CFDI fue timbrado exitosamente.<br>
            Ya está en el SAT.
          </p>

          <div class="wiz-cfdi-info" *ngIf="cfdiCreado">
            <div class="wiz-cfdi-row">
              <span class="material-icons-round" style="font-size:15px;color:var(--text-muted)">tag</span>
              <span style="font-size:12px;color:var(--text-muted)">UUID</span>
              <span style="font-family:monospace;font-size:11px;font-weight:600">{{ cfdiCreado.uuid }}</span>
            </div>
            <div class="wiz-cfdi-row">
              <span class="material-icons-round" style="font-size:15px;color:var(--text-muted)">payments</span>
              <span style="font-size:12px;color:var(--text-muted)">Total</span>
              <span style="font-family:var(--font-display);font-weight:800;color:var(--accent)">
                {{ cfdiCreado.total | currency:'MXN':'symbol-narrow':'1.2-2' }}
              </span>
            </div>
          </div>

          <div class="wiz-download-btns">
            <button class="btn-mag btn-outline" (click)="descargar('pdf')" [disabled]="descargando">
              <span class="material-icons-round" style="font-size:16px">picture_as_pdf</span>
              Descargar PDF
            </button>
            <button class="btn-mag btn-outline" (click)="descargar('xml')" [disabled]="descargando">
              <span class="material-icons-round" style="font-size:16px">code</span>
              Descargar XML
            </button>
          </div>

          <div class="wiz-footer wiz-footer-center">
            <button class="btn-mag btn-primary" (click)="finish()">
              <span class="material-icons-round" style="font-size:18px">dashboard</span>
              Ir al Dashboard
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .wiz-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .wiz-modal {
      background: var(--surface-card, #fff);
      border-radius: 20px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.22);
      position: relative;
    }

    .wiz-progress-bar {
      height: 4px;
      background: var(--border-light, #e5e7eb);
      border-radius: 4px 4px 0 0;
      overflow: hidden;
    }

    .wiz-progress-fill {
      height: 100%;
      background: var(--accent, #6366f1);
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .wiz-body {
      padding: 32px 32px 28px;
    }

    .wiz-welcome {
      text-align: center;
    }

    .wiz-step-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent, #6366f1);
      margin-bottom: 12px;
    }

    .wiz-icon {
      width: 48px;
      height: 48px;
      background: var(--accent-light, #eef2ff);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }

    .wiz-icon .material-icons-round {
      font-size: 24px;
      color: var(--accent, #6366f1);
    }

    .wiz-icon-big {
      width: 72px;
      height: 72px;
      background: var(--accent-light, #eef2ff);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .wiz-icon-big .material-icons-round {
      font-size: 36px;
      color: var(--accent, #6366f1);
    }

    .wiz-icon-success {
      background: #ecfdf5;
    }

    .wiz-icon-success .material-icons-round {
      color: #10b981;
    }

    .wiz-title {
      font-family: var(--font-display, system-ui);
      font-size: 22px;
      font-weight: 800;
      color: var(--text-primary, #111827);
      margin-bottom: 8px;
    }

    .wiz-desc {
      font-size: 14px;
      color: var(--text-muted, #6b7280);
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .wiz-steps-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 28px;
    }

    .wiz-step-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--accent-light, #eef2ff);
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: var(--accent, #6366f1);
    }

    .wiz-step-chip .material-icons-round {
      font-size: 15px;
    }

    .wiz-arrow {
      color: var(--text-muted, #9ca3af);
      font-size: 18px !important;
    }

    .wiz-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
    }

    .wiz-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 24px;
      gap: 12px;
    }

    .wiz-footer-center {
      justify-content: center;
    }

    .wiz-error {
      margin-top: 10px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      font-size: 13px;
      color: #dc2626;
    }

    .wiz-summary-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .wiz-chip {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      background: var(--surface-alt, #f3f4f6);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary, #111827);
    }

    .wiz-totals {
      background: var(--surface-alt, #f9fafb);
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .wiz-total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--text-muted, #6b7280);
    }

    .wiz-total-final {
      padding-top: 8px;
      border-top: 1px solid var(--border-light, #e5e7eb);
      font-size: 16px;
      font-weight: 800;
      color: var(--text-primary, #111827);
      font-family: var(--font-display, system-ui);
    }

    .wiz-success {
      text-align: center;
    }

    .wiz-cfdi-info {
      background: var(--surface-alt, #f9fafb);
      border-radius: 10px;
      padding: 14px 16px;
      margin: 0 auto 20px;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }

    .wiz-cfdi-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .wiz-download-btns {
      display: flex;
      gap: 10px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .wiz-spin {
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
  `]
})
export class WizardOnboardingComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  step = 0;
  saving = false;
  descargando = false;
  errorMsg = '';

  rfcCreado: Rfc | null = null;
  clienteCreado: Cliente | null = null;
  cfdiCreado: (CfdiDetalle & { uuid: string | null; total: number }) | null = null;

  rfcForm!: FormGroup;
  clienteForm!: FormGroup;
  facturaForm!: FormGroup;

  regimenes  = REGIMENES_FISCALES;
  usosCfdi   = USOS_CFDI;
  formasPago = FORMAS_PAGO;

  get subtotal(): number {
    const precio   = +this.facturaForm.get('precio')?.value   || 0;
    const cantidad = +this.facturaForm.get('cantidad')?.value || 0;
    return precio * cantidad;
  }

  get iva(): number {
    return this.subtotal * 0.16;
  }

  get total(): number {
    return this.subtotal + this.iva;
  }

  constructor(
    private fb: FormBuilder,
    private rfcSvc: RfcService,
    private clienteSvc: ClienteService,
    private cfdiSvc: CfdiService
  ) {}

  ngOnInit(): void {
    this.rfcForm = this.fb.group({
      rfc:          ['', [Validators.required, Validators.pattern(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)]],
      razonSocial:  ['', Validators.required],
      regimenFiscal:['', Validators.required],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    });

    this.clienteForm = this.fb.group({
      rfc:          ['', [Validators.required, Validators.pattern(/^([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}|XAXX010101000|XEXX010101000)$/)]],
      nombre:       ['', Validators.required],
      usoCfdi:      ['', Validators.required],
      regimenFiscal:['', Validators.required],
      codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]]
    });

    this.facturaForm = this.fb.group({
      descripcion: ['', Validators.required],
      precio:      [null, [Validators.required, Validators.min(0.01)]],
      cantidad:    [1,    [Validators.required, Validators.min(1)]],
      formaPago:   ['', Validators.required]
    });
  }

  // ── Helpers de validación ──────────────────────────────────────────────────

  rfcErr(field: string): boolean {
    const c = this.rfcForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  clienteErr(field: string): boolean {
    const c = this.clienteForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  factErr(field: string): boolean {
    const c = this.facturaForm.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  toUpperRfc(e: Event): void {
    const input = e.target as HTMLInputElement;
    const pos   = input.selectionStart ?? 0;
    input.value = input.value.toUpperCase();
    this.rfcForm.get('rfc')?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  toUpperField(e: Event, form: FormGroup, field: string): void {
    const input = e.target as HTMLInputElement;
    const pos   = input.selectionStart ?? 0;
    input.value = input.value.toUpperCase();
    form.get(field)?.setValue(input.value, { emitEvent: false });
    input.setSelectionRange(pos, pos);
  }

  // ── Submit paso 1: RFC Emisor ──────────────────────────────────────────────

  submitRfc(): void {
    this.rfcForm.markAllAsTouched();
    if (this.rfcForm.invalid) return;
    this.saving   = true;
    this.errorMsg = '';

    const v = this.rfcForm.value;
    this.rfcSvc.crear({
      rfc:             v.rfc,
      razonSocial:     v.razonSocial,
      regimenFiscal:   v.regimenFiscal,
      codigoPostal:    v.codigoPostal,
      proveedorDefault: 'default'
    }).subscribe({
      next: (rfc) => {
        this.rfcCreado = rfc;
        this.saving    = false;
        this.step      = 2;
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err?.error?.message ?? 'Error al guardar el RFC. Verifica los datos e intenta de nuevo.';
      }
    });
  }

  // ── Submit paso 2: Cliente ─────────────────────────────────────────────────

  submitCliente(): void {
    this.clienteForm.markAllAsTouched();
    if (this.clienteForm.invalid) return;
    this.saving   = true;
    this.errorMsg = '';

    const v = this.clienteForm.value;
    this.clienteSvc.crear({
      rfc:          v.rfc,
      nombre:       v.nombre,
      usoCfdi:      v.usoCfdi,
      regimenFiscal:v.regimenFiscal,
      codigoPostal: v.codigoPostal
    }).subscribe({
      next: (cliente) => {
        this.clienteCreado = cliente;
        this.saving        = false;
        this.step          = 3;
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err?.error?.message ?? 'Error al guardar el cliente. Verifica los datos e intenta de nuevo.';
      }
    });
  }

  // ── Submit paso 3: Factura ─────────────────────────────────────────────────

  submitFactura(): void {
    this.facturaForm.markAllAsTouched();
    if (this.facturaForm.invalid) return;
    if (!this.rfcCreado || !this.clienteCreado) {
      this.errorMsg = 'Faltan datos del emisor o cliente. Reinicia el wizard.';
      return;
    }

    this.saving   = true;
    this.errorMsg = '';

    const v = this.facturaForm.value;

    this.cfdiSvc.emitir({
      rfcId:             this.rfcCreado.id,
      tipoComprobante:   'I',
      formaPago:         v.formaPago,
      metodoPago:        'PUE',
      lugarExpedicion:   this.rfcCreado.codigoPostal,
      moneda:            'MXN',
      serie:             '',
      usoCfdi:           this.clienteCreado.usoCfdi,
      receptorRfc:       this.clienteCreado.rfc,
      receptorNombre:    this.clienteCreado.nombre,
      receptorUsoCfdi:   this.clienteCreado.usoCfdi,
      receptorRegimen:   this.clienteCreado.regimenFiscal,
      receptorCp:        this.clienteCreado.codigoPostal,
      conceptos: [{
        claveProdServ: '84111506',
        claveUnidad:   'E48',
        unidad:        'Unidad de servicio',
        descripcion:   v.descripcion,
        cantidad:      +v.cantidad,
        precioUnitario:+v.precio,
        descuento:     0,
        tasaIva:       0.16
      }]
    }).subscribe({
      next: (cfdi) => {
        this.cfdiCreado = cfdi;
        this.saving     = false;
        this.step       = 4;
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err?.error?.message ?? 'Error al emitir el CFDI. Verifica que el RFC tenga timbres disponibles.';
      }
    });
  }

  // ── Descarga desde paso 4 ──────────────────────────────────────────────────

  descargar(tipo: 'pdf' | 'xml'): void {
    if (!this.cfdiCreado) return;
    this.descargando = true;
    const req$ = tipo === 'pdf'
      ? this.cfdiSvc.descargarPdf(this.cfdiCreado.id)
      : this.cfdiSvc.descargarXml(this.cfdiCreado.id);

    req$.subscribe({
      next: (blob) => {
        this.cfdiSvc.descargarArchivo(blob, `${this.cfdiCreado!.uuid}.${tipo}`);
        this.descargando = false;
      },
      error: () => { this.descargando = false; }
    });
  }

  // ── Cerrar / Skip / Finish ─────────────────────────────────────────────────

  onOverlayClick(e: MouseEvent): void {
    if (this.step === 4) {
      this.finish();
    }
  }

  skip(): void {
    localStorage.setItem('onboarding_done', '1');
    this.closed.emit();
  }

  finish(): void {
    localStorage.setItem('onboarding_done', '1');
    this.closed.emit();
  }
}
