import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { AuthService } from '../../core/services/Auth/AuthService';
import { TenantService } from '../../core/services/tenant/TenantService';
import { Rfc } from '../../core/models/RFC/Rfc';
import { Cliente } from '../../core/models/cliente/Cliente';
import { CfdiDetalle } from '../../core/models/CFDI/CfdiDetalle';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { USOS_CFDI } from '../../core/models/CFDI/Catálogos/USOS_CFDI';
import { FORMAS_PAGO } from '../../core/models/CFDI/Catálogos/FORMAS_PAGO';

interface TipoNegocioOpcion {
  slug: string;
  label: string;
  descripcion: string;
  icon: string;
  modulos: string[];
}

const TIPOS: TipoNegocioOpcion[] = [
  {
    slug: 'retail',
    label: 'Tienda / Retail',
    descripcion: 'Venta de productos con caja registradora e inventario.',
    icon: 'storefront',
    modulos: ['pos', 'inventario', 'clientes', 'reportes'],
  },
  {
    slug: 'restaurante',
    label: 'Restaurante / Café',
    descripcion: 'Pedidos, mesas y caja para servicio de alimentos.',
    icon: 'restaurant',
    modulos: ['pos', 'inventario', 'clientes', 'reportes'],
  },
  {
    slug: 'profesionista',
    label: 'Profesionista / Servicios',
    descripcion: 'Facturación electrónica para honorarios y servicios.',
    icon: 'work_outline',
    modulos: ['facturacion', 'rfcs', 'clientes', 'series', 'wallet'],
  },
  {
    slug: 'empresa',
    label: 'Empresa',
    descripcion: 'Suite completa: facturación, POS, inventario y nómina.',
    icon: 'corporate_fare',
    modulos: ['facturacion', 'rfcs', 'clientes', 'series', 'pos', 'inventario', 'nomina', 'empleados', 'reportes', 'wallet'],
  },
  {
    slug: 'facturacion_pura',
    label: 'Solo Facturación',
    descripcion: 'CFDI 4.0 de todos los tipos, sin módulos extra.',
    icon: 'receipt_long',
    modulos: ['facturacion', 'rfcs', 'clientes', 'series', 'wallet'],
  },
];

/** Tipos que incluyen flujo de factura en el wizard */
const TIPOS_CON_FACTURA = new Set(['profesionista', 'empresa', 'facturacion_pura']);

@Component({
  selector: 'app-wizard-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wiz-overlay" (click)="onOverlayClick($event)">
      <div class="wiz-modal animate-in" (click)="$event.stopPropagation()">

        <!-- Barra de progreso -->
        <div class="wiz-progress-bar" *ngIf="step > 0 && step < pasoFinal">
          <div class="wiz-progress-fill" [style.width.%]="(step / (pasoFinal - 1)) * 100"></div>
        </div>

        <!-- ═══ PASO 0: Tipo de negocio ═══ -->
        <div *ngIf="step === 0" class="wiz-body">
          <div class="wiz-icon">
            <span class="material-icons-round">tune</span>
          </div>
          <h2 class="wiz-title">¿Qué tipo de negocio tienes?</h2>
          <p class="wiz-desc">Configuramos el sistema según tus necesidades.</p>

          <div class="tipo-grid">
            <button *ngFor="let t of tipos"
                    type="button"
                    class="tipo-card"
                    [class.selected]="tipoSeleccionado === t.slug"
                    (click)="tipoSeleccionado = t.slug">
              <span class="material-icons-round tipo-icon">{{ t.icon }}</span>
              <div class="tipo-label">{{ t.label }}</div>
              <div class="tipo-desc">{{ t.descripcion }}</div>
              <div class="tipo-modulos">
                <span *ngFor="let m of t.modulos" class="mod-chip">{{ m }}</span>
              </div>
            </button>
          </div>

          <div class="wiz-error" *ngIf="errorMsg && step === 0">{{ errorMsg }}</div>

          <div class="wiz-footer">
            <span></span>
            <button class="btn-mag btn-primary" (click)="confirmarTipo()" [disabled]="!tipoSeleccionado || saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Continuar</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ═══ PASO 1: Bienvenida adaptada ═══ -->
        <div *ngIf="step === 1" class="wiz-body wiz-welcome">
          <div class="wiz-icon-big">
            <span class="material-icons-round">{{ tipoActual?.icon ?? 'receipt_long' }}</span>
          </div>
          <h2 class="wiz-title">¡Todo listo, {{ tipoActual?.label }}!</h2>
          <p class="wiz-desc">
            Activamos estos módulos para tu cuenta.<br>
            Puedes pedir más en cualquier momento.
          </p>

          <div class="modulos-activos">
            <div *ngFor="let m of modulosActivados" class="modulo-chip">
              <span class="material-icons-round" style="font-size:16px">check_circle</span>
              {{ m }}
            </div>
          </div>

          <div class="wiz-steps-preview" *ngIf="tieneFactura">
            <div class="wiz-step-chip">
              <span class="material-icons-round">business</span> Tu empresa
            </div>
            <span class="material-icons-round wiz-arrow">arrow_forward</span>
            <div class="wiz-step-chip">
              <span class="material-icons-round">person</span> Tu cliente
            </div>
            <span class="material-icons-round wiz-arrow">arrow_forward</span>
            <div class="wiz-step-chip">
              <span class="material-icons-round">receipt</span> Primera factura
            </div>
          </div>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="skip()">Saltar por ahora</button>
            <button class="btn-mag btn-primary" (click)="step = tieneFactura ? 2 : pasoFinal">
              {{ tieneFactura ? 'Empezar' : 'Ir al Dashboard' }}
              <span class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- ═══ PASO 2: RFC Emisor ═══ -->
        <div *ngIf="step === 2" class="wiz-body">
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
              <div class="field-error" *ngIf="rfcErr('rfc')">RFC inválido (12 o 13 caracteres)</div>
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
              <select formControlName="regimenFiscal" class="form-control-mag" [class.error-field]="rfcErr('regimenFiscal')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
              </select>
              <div class="field-error" *ngIf="rfcErr('regimenFiscal')">Campo requerido</div>
            </div>
            <div class="form-group">
              <label>Código Postal *</label>
              <input type="text" formControlName="codigoPostal" class="form-control-mag"
                     [class.error-field]="rfcErr('codigoPostal')" placeholder="06600" maxlength="5">
              <div class="field-error" *ngIf="rfcErr('codigoPostal')">5 dígitos requeridos</div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 1">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span> Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitRfc()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Continuar</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO 3: Cliente ═══ -->
        <div *ngIf="step === 3" class="wiz-body">
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
                     [class.error-field]="clienteErr('rfc')" placeholder="XAXX010101000"
                     style="font-family:monospace;font-weight:700;letter-spacing:1px"
                     (input)="toUpperField($event, clienteForm, 'rfc')">
              <div class="field-hint">Usa XAXX010101000 para público en general</div>
              <div class="field-error" *ngIf="clienteErr('rfc')">RFC inválido</div>
            </div>
            <div class="form-group">
              <label>Nombre / Razón Social *</label>
              <input type="text" formControlName="nombre" class="form-control-mag"
                     [class.error-field]="clienteErr('nombre')" placeholder="JUAN PÉREZ GARCÍA"
                     (input)="toUpperField($event, clienteForm, 'nombre')">
              <div class="field-error" *ngIf="clienteErr('nombre')">Campo requerido</div>
            </div>
            <div class="form-group">
              <label>Uso del CFDI *</label>
              <select formControlName="usoCfdi" class="form-control-mag" [class.error-field]="clienteErr('usoCfdi')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
              </select>
              <div class="field-error" *ngIf="clienteErr('usoCfdi')">Campo requerido</div>
            </div>
            <div class="form-group">
              <label>Régimen Fiscal del cliente *</label>
              <select formControlName="regimenFiscal" class="form-control-mag" [class.error-field]="clienteErr('regimenFiscal')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
              </select>
              <div class="field-error" *ngIf="clienteErr('regimenFiscal')">Campo requerido</div>
            </div>
            <div class="form-group">
              <label>Código Postal del cliente *</label>
              <input type="text" formControlName="codigoPostal" class="form-control-mag"
                     [class.error-field]="clienteErr('codigoPostal')" placeholder="06600" maxlength="5">
              <div class="field-error" *ngIf="clienteErr('codigoPostal')">5 dígitos requeridos</div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 2">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span> Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitCliente()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Continuar</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">arrow_forward</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO 4: Primera factura ═══ -->
        <div *ngIf="step === 4" class="wiz-body">
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
                     [class.error-field]="factErr('descripcion')" placeholder="Ej: Consultoría de sistemas">
              <div class="field-error" *ngIf="factErr('descripcion')">Campo requerido</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group">
                <label>Precio unitario (MXN) *</label>
                <input type="number" formControlName="precio" class="form-control-mag"
                       [class.error-field]="factErr('precio')" placeholder="1000.00" min="0.01" step="0.01">
                <div class="field-error" *ngIf="factErr('precio')">Precio requerido</div>
              </div>
              <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" formControlName="cantidad" class="form-control-mag"
                       [class.error-field]="factErr('cantidad')" placeholder="1" min="1">
                <div class="field-error" *ngIf="factErr('cantidad')">Mínimo 1</div>
              </div>
            </div>
            <div class="form-group">
              <label>Forma de pago *</label>
              <select formControlName="formaPago" class="form-control-mag" [class.error-field]="factErr('formaPago')">
                <option value="">Seleccionar...</option>
                <option *ngFor="let f of formasPago" [value]="f.value">{{ f.label }}</option>
              </select>
              <div class="field-error" *ngIf="factErr('formaPago')">Campo requerido</div>
            </div>
            <div class="wiz-totals" *ngIf="subtotal > 0">
              <div class="wiz-total-row"><span>Subtotal</span><span>{{ subtotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span></div>
              <div class="wiz-total-row"><span>IVA 16%</span><span>{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span></div>
              <div class="wiz-total-row wiz-total-final"><span>Total</span><span>{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span></div>
            </div>
          </form>

          <div class="wiz-footer">
            <button class="btn-mag btn-ghost btn-sm" (click)="step = 3">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span> Atrás
            </button>
            <button class="btn-mag btn-primary" (click)="submitFactura()" [disabled]="saving">
              <span class="material-icons-round wiz-spin" *ngIf="saving" style="font-size:18px">sync</span>
              <span *ngIf="!saving">Emitir Factura</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">bolt</span>
            </button>
          </div>
          <div class="wiz-error" *ngIf="errorMsg">{{ errorMsg }}</div>
        </div>

        <!-- ═══ PASO FINAL: Éxito ═══ -->
        <div *ngIf="step === pasoFinal" class="wiz-body wiz-success">
          <div class="wiz-icon-big wiz-icon-success">
            <span class="material-icons-round">check_circle</span>
          </div>
          <h2 class="wiz-title">{{ tieneFactura ? '¡Factura emitida!' : '¡Sistema configurado!' }}</h2>
          <p class="wiz-desc" *ngIf="tieneFactura">
            Tu primer CFDI fue timbrado exitosamente.<br>Ya está en el SAT.
          </p>
          <p class="wiz-desc" *ngIf="!tieneFactura">
            Tu cuenta está lista con los módulos<br>de <strong>{{ tipoActual?.label }}</strong>.
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

          <div class="wiz-download-btns" *ngIf="cfdiCreado">
            <button class="btn-mag btn-outline" (click)="descargar('pdf')" [disabled]="descargando">
              <span class="material-icons-round" style="font-size:16px">picture_as_pdf</span> PDF
            </button>
            <button class="btn-mag btn-outline" (click)="descargar('xml')" [disabled]="descargando">
              <span class="material-icons-round" style="font-size:16px">code</span> XML
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
    .wiz-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px; }
    .wiz-modal { background:var(--surface-card,#fff);border-radius:20px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 64px rgba(0,0,0,0.22);position:relative; }
    .wiz-progress-bar { height:4px;background:var(--border-light,#e5e7eb);border-radius:4px 4px 0 0;overflow:hidden; }
    .wiz-progress-fill { height:100%;background:var(--accent,#6366f1);border-radius:4px;transition:width 0.4s ease; }
    .wiz-body { padding:32px 32px 28px; }
    .wiz-welcome,.wiz-success { text-align:center; }
    .wiz-step-label { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--accent,#6366f1);margin-bottom:12px; }
    .wiz-icon { width:48px;height:48px;background:var(--accent-light,#eef2ff);border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:14px; }
    .wiz-icon .material-icons-round { font-size:24px;color:var(--accent,#6366f1); }
    .wiz-icon-big { width:72px;height:72px;background:var(--accent-light,#eef2ff);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px; }
    .wiz-icon-big .material-icons-round { font-size:36px;color:var(--accent,#6366f1); }
    .wiz-icon-success { background:#ecfdf5; }
    .wiz-icon-success .material-icons-round { color:#10b981; }
    .wiz-title { font-family:var(--font-display,system-ui);font-size:22px;font-weight:800;color:var(--text-primary,#111827);margin-bottom:8px; }
    .wiz-desc { font-size:14px;color:var(--text-muted,#6b7280);line-height:1.6;margin-bottom:24px; }
    .wiz-footer { display:flex;align-items:center;justify-content:space-between;margin-top:24px;gap:12px; }
    .wiz-footer-center { justify-content:center; }
    .wiz-error { margin-top:10px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:13px;color:#dc2626; }
    .wiz-steps-preview { display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:28px; }
    .wiz-step-chip { display:flex;align-items:center;gap:6px;padding:8px 14px;background:var(--accent-light,#eef2ff);border-radius:999px;font-size:13px;font-weight:600;color:var(--accent,#6366f1); }
    .wiz-step-chip .material-icons-round { font-size:15px; }
    .wiz-arrow { color:var(--text-muted,#9ca3af);font-size:18px!important; }
    .wiz-form { display:flex;flex-direction:column;gap:4px;margin-bottom:8px; }
    .wiz-summary-chips { display:flex;align-items:center;gap:8px;margin-bottom:20px;flex-wrap:wrap; }
    .wiz-chip { display:flex;align-items:center;gap:5px;padding:5px 12px;background:var(--surface-alt,#f3f4f6);border-radius:999px;font-size:12px;font-weight:600;color:var(--text-primary,#111827); }
    .wiz-totals { background:var(--surface-alt,#f9fafb);border-radius:10px;padding:14px 16px;margin-top:4px;display:flex;flex-direction:column;gap:6px; }
    .wiz-total-row { display:flex;justify-content:space-between;font-size:13px;color:var(--text-muted,#6b7280); }
    .wiz-total-final { padding-top:8px;border-top:1px solid var(--border-light,#e5e7eb);font-size:16px;font-weight:800;color:var(--text-primary,#111827); }
    .wiz-cfdi-info { background:var(--surface-alt,#f9fafb);border-radius:10px;padding:14px 16px;margin:0 auto 20px;max-width:380px;display:flex;flex-direction:column;gap:8px;text-align:left; }
    .wiz-cfdi-row { display:flex;align-items:center;gap:8px; }
    .wiz-download-btns { display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:8px; }

    /* ── Tipo de negocio ── */
    .tipo-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px; }
    .tipo-card { background:var(--surface-alt,#f9fafb);border:2px solid var(--border-light,#e5e7eb);border-radius:14px;padding:16px 14px;text-align:left;cursor:pointer;transition:.15s;display:flex;flex-direction:column;gap:4px; }
    .tipo-card:hover { border-color:var(--accent,#6366f1);background:var(--accent-light,#eef2ff); }
    .tipo-card.selected { border-color:var(--accent,#6366f1);background:var(--accent-light,#eef2ff);box-shadow:0 0 0 3px rgba(99,102,241,.15); }
    .tipo-icon { font-size:28px;color:var(--accent,#6366f1);margin-bottom:4px; }
    .tipo-label { font-size:14px;font-weight:700;color:var(--text-primary,#111827); }
    .tipo-desc { font-size:11px;color:var(--text-muted,#6b7280);line-height:1.4; }
    .tipo-modulos { display:flex;flex-wrap:wrap;gap:4px;margin-top:6px; }
    .mod-chip { font-size:9px;font-weight:600;padding:2px 7px;background:rgba(99,102,241,.1);color:var(--accent,#6366f1);border-radius:999px;text-transform:uppercase;letter-spacing:.4px; }

    /* ── Módulos activos ── */
    .modulos-activos { display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:24px; }
    .modulo-chip { display:flex;align-items:center;gap:6px;padding:6px 14px;background:#ecfdf5;color:#065f46;border-radius:999px;font-size:12px;font-weight:600; }

    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .wiz-spin { animation:spin 0.8s linear infinite;display:inline-block; }
  `]
})
export class WizardOnboardingComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();

  step = 0;
  readonly pasoFinal = 5;

  saving     = false;
  descargando = false;
  errorMsg   = '';

  tipoSeleccionado: string | null = null;
  modulosActivados: string[] = [];

  rfcCreado:     Rfc | null = null;
  clienteCreado: Cliente | null = null;
  cfdiCreado:    (CfdiDetalle & { uuid: string | null; total: number }) | null = null;

  rfcForm!:     FormGroup;
  clienteForm!: FormGroup;
  facturaForm!: FormGroup;

  readonly tipos = TIPOS;
  regimenes  = REGIMENES_FISCALES;
  usosCfdi   = USOS_CFDI;
  formasPago = FORMAS_PAGO;

  get tipoActual(): TipoNegocioOpcion | undefined {
    return TIPOS.find(t => t.slug === this.tipoSeleccionado ?? '');
  }

  get tieneFactura(): boolean {
    return TIPOS_CON_FACTURA.has(this.tipoSeleccionado ?? '');
  }

  get subtotal(): number {
    const p = +this.facturaForm.get('precio')?.value  || 0;
    const c = +this.facturaForm.get('cantidad')?.value || 0;
    return p * c;
  }
  get iva():   number { return this.subtotal * 0.16; }
  get total(): number { return this.subtotal + this.iva; }

  constructor(
    private fb:         FormBuilder,
    private rfcSvc:     RfcService,
    private clienteSvc: ClienteService,
    private cfdiSvc:    CfdiService,
    private auth:       AuthService,
    private tenantSvc:  TenantService,
  ) {}

  ngOnInit(): void {
    this.rfcForm = this.fb.group({
      rfc:           ['', [Validators.required, Validators.pattern(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/)]],
      razonSocial:   ['', Validators.required],
      regimenFiscal: ['', Validators.required],
      codigoPostal:  ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    });
    this.clienteForm = this.fb.group({
      rfc:           ['', [Validators.required, Validators.pattern(/^([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}|XAXX010101000|XEXX010101000)$/)]],
      nombre:        ['', Validators.required],
      usoCfdi:       ['', Validators.required],
      regimenFiscal: ['', Validators.required],
      codigoPostal:  ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
    });
    this.facturaForm = this.fb.group({
      descripcion: ['', Validators.required],
      precio:      [null, [Validators.required, Validators.min(0.01)]],
      cantidad:    [1,    [Validators.required, Validators.min(1)]],
      formaPago:   ['', Validators.required],
    });
  }

  // ── Paso 0: confirmar tipo de negocio ───────────────────────────────────────
  confirmarTipo(): void {
    if (!this.tipoSeleccionado) return;

    const tenantId = this.auth.currentUser()?.tenantId;
    if (!tenantId) { this.errorMsg = 'No se pudo obtener el tenant. Recarga la página.'; return; }

    this.saving   = true;
    this.errorMsg = '';

    this.tenantSvc.completarOnboarding(tenantId, this.tipoSeleccionado).subscribe({
      next: (res) => {
        this.modulosActivados = res.modulos;
        this.auth.actualizarToken(res.accessToken);   // JWT actualizado en memoria
        this.saving = false;
        this.step   = 1;
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err?.error?.error ?? 'Error al configurar el tipo de negocio.';
      }
    });
  }

  // ── Paso 2: RFC ─────────────────────────────────────────────────────────────
  submitRfc(): void {
    this.rfcForm.markAllAsTouched();
    if (this.rfcForm.invalid) return;
    this.saving = true; this.errorMsg = '';
    const v = this.rfcForm.value;
    this.rfcSvc.crear({ rfc: v.rfc, razonSocial: v.razonSocial, regimenFiscal: v.regimenFiscal, codigoPostal: v.codigoPostal, proveedorDefault: 'default' }).subscribe({
      next: (rfc) => { this.rfcCreado = rfc; this.saving = false; this.step = 3; },
      error: (err) => { this.saving = false; this.errorMsg = err?.error?.message ?? 'Error al guardar el RFC.'; }
    });
  }

  // ── Paso 3: Cliente ─────────────────────────────────────────────────────────
  submitCliente(): void {
    this.clienteForm.markAllAsTouched();
    if (this.clienteForm.invalid) return;
    this.saving = true; this.errorMsg = '';
    const v = this.clienteForm.value;
    this.clienteSvc.crear({ rfc: v.rfc, nombre: v.nombre, usoCfdi: v.usoCfdi, regimenFiscal: v.regimenFiscal, codigoPostal: v.codigoPostal }).subscribe({
      next: (c) => { this.clienteCreado = c; this.saving = false; this.step = 4; },
      error: (err) => { this.saving = false; this.errorMsg = err?.error?.message ?? 'Error al guardar el cliente.'; }
    });
  }

  // ── Paso 4: Factura ─────────────────────────────────────────────────────────
  submitFactura(): void {
    this.facturaForm.markAllAsTouched();
    if (this.facturaForm.invalid || !this.rfcCreado || !this.clienteCreado) return;
    this.saving = true; this.errorMsg = '';
    const v = this.facturaForm.value;
    this.cfdiSvc.emitir({
      rfcId: this.rfcCreado.id, tipoComprobante: 'I', formaPago: v.formaPago,
      metodoPago: 'PUE', lugarExpedicion: this.rfcCreado.codigoPostal, moneda: 'MXN', serie: '',
      usoCfdi: this.clienteCreado.usoCfdi, receptorRfc: this.clienteCreado.rfc,
      receptorNombre: this.clienteCreado.nombre, receptorUsoCfdi: this.clienteCreado.usoCfdi,
      receptorRegimen: this.clienteCreado.regimenFiscal, receptorCp: this.clienteCreado.codigoPostal,
      conceptos: [{ claveProdServ: '84111506', claveUnidad: 'E48', unidad: 'Unidad de servicio',
        descripcion: v.descripcion, cantidad: +v.cantidad, precioUnitario: +v.precio, descuento: 0, tasaIva: 0.16 }]
    }).subscribe({
      next: (cfdi) => { this.cfdiCreado = cfdi; this.saving = false; this.step = this.pasoFinal; },
      error: (err) => { this.saving = false; this.errorMsg = err?.error?.message ?? 'Error al emitir el CFDI.'; }
    });
  }

  // ── Descarga ─────────────────────────────────────────────────────────────────
  descargar(tipo: 'pdf' | 'xml'): void {
    if (!this.cfdiCreado) return;
    this.descargando = true;
    const req$ = tipo === 'pdf' ? this.cfdiSvc.descargarPdf(this.cfdiCreado.id) : this.cfdiSvc.descargarXml(this.cfdiCreado.id);
    req$.subscribe({ next: (blob) => { this.cfdiSvc.descargarArchivo(blob, `${this.cfdiCreado!.uuid}.${tipo}`); this.descargando = false; }, error: () => { this.descargando = false; } });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  rfcErr(f: string)     { const c = this.rfcForm.get(f);     return !!(c?.invalid && (c.dirty || c.touched)); }
  clienteErr(f: string) { const c = this.clienteForm.get(f); return !!(c?.invalid && (c.dirty || c.touched)); }
  factErr(f: string)    { const c = this.facturaForm.get(f); return !!(c?.invalid && (c.dirty || c.touched)); }

  toUpperRfc(e: Event): void {
    const i = e.target as HTMLInputElement; const p = i.selectionStart ?? 0;
    i.value = i.value.toUpperCase(); this.rfcForm.get('rfc')?.setValue(i.value, { emitEvent: false }); i.setSelectionRange(p, p);
  }
  toUpperField(e: Event, form: FormGroup, field: string): void {
    const i = e.target as HTMLInputElement; const p = i.selectionStart ?? 0;
    i.value = i.value.toUpperCase(); form.get(field)?.setValue(i.value, { emitEvent: false }); i.setSelectionRange(p, p);
  }

  onOverlayClick(e: MouseEvent): void { if (this.step === this.pasoFinal) this.finish(); }

  skip(): void   { this.closed.emit(); }
  finish(): void { this.closed.emit(); }
}
