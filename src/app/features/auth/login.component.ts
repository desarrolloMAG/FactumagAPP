import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/Auth/AuthService';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="auth-container">

      <!-- LEFT — Branding -->
      <div class="auth-left">
        <div class="auth-brand animate-in">
          <div class="brand-icon">F</div>
          <h1>Factura con<br><span>inteligencia</span></h1>
          <p>
            Emite, gestiona y cancela CFDIs 4.0 de forma sencilla.
            Compatible con Facturama y NovaCFDI.
          </p>
        </div>

        <div class="auth-features animate-in delay-2">
          <div class="feature-item">
            <div class="f-icon">
              <span class="material-icons-round" style="font-size:18px">verified</span>
            </div>
            <div class="f-text">CFDI 4.0 — Todos los tipos soportados</div>
          </div>
          <div class="feature-item">
            <div class="f-icon">
              <span class="material-icons-round" style="font-size:18px">account_balance_wallet</span>
            </div>
            <div class="f-text">Wallet de timbres — Global y por RFC</div>
          </div>
          <div class="feature-item">
            <div class="f-icon">
              <span class="material-icons-round" style="font-size:18px">business</span>
            </div>
            <div class="f-text">Multi-RFC — Administra varias empresas</div>
          </div>
          <div class="feature-item">
            <div class="f-icon">
              <span class="material-icons-round" style="font-size:18px">download</span>
            </div>
            <div class="f-text">Descarga XML y PDF al instante</div>
          </div>
        </div>
      </div>

      <!-- RIGHT — Form -->
      <div class="auth-right">
        <div class="auth-form-container animate-in delay-1">
          <h2 class="auth-title">Bienvenido</h2>
          <p class="auth-subtitle">Ingresa tus credenciales para continuar</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="form-mag">
            <div class="form-group">
              <label>Correo electrónico</label>
              <input
                type="email"
                formControlName="email"
                class="form-control-mag"
                [class.error-field]="hasError('email')"
                placeholder="usuario@empresa.com"
                autocomplete="email">
              <div class="field-error" *ngIf="hasError('email')">
                <span class="material-icons-round" style="font-size:14px">error_outline</span>
                Ingresa un correo válido
              </div>
            </div>

            <div class="form-group">
              <label>Contraseña</label>
              <div style="position:relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control-mag"
                  [class.error-field]="hasError('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  style="padding-right:44px">
                <button type="button"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex"
                  (click)="showPassword=!showPassword">
                  <span class="material-icons-round" style="font-size:20px">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              <div class="field-error" *ngIf="hasError('password')">
                <span class="material-icons-round" style="font-size:14px">error_outline</span>
                La contraseña es requerida
              </div>
            </div>

            <!-- Error general -->
            <div *ngIf="errorMsg" style="
              background:rgba(239,68,68,0.08);
              border:1px solid rgba(239,68,68,0.2);
              border-radius:var(--radius-sm);
              padding:12px 14px;
              font-size:13px;
              color:var(--danger);
              margin-bottom:16px;
              display:flex;
              align-items:center;
              gap:8px">
              <span class="material-icons-round" style="font-size:18px">error_outline</span>
              {{ errorMsg }}
            </div>

            <button type="submit" class="btn-mag btn-primary btn-lg"
                    style="width:100%;justify-content:center"
                    [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round" style="font-size:18px;animation:spin 1s linear infinite">
                refresh
              </span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:18px">login</span>
              {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
            </button>
          </form>

          <div style="margin-top:28px;text-align:center;font-size:13px;color:var(--text-muted)">
            FacturacionMAG &copy; 2026 — Powered by Angular + .NET 8
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `
})
export class LoginComponent implements OnInit {
  form:         FormGroup;
  loading       = false;
  showPassword  = false;
  errorMsg      = '';

  constructor(
    private fb:    FormBuilder,
    private auth:  AuthService,
    private router: Router,
    private route:  ActivatedRoute   // ← AGREGAR
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // ── Caso 1: token directo en URL ──────────────────────────
      let token = params['token'];

      // ── Caso 2: token dentro del returnUrl ────────────────────
      if (!token && params['returnUrl']) {
        const returnUrl = decodeURIComponent(params['returnUrl']);
        const tokenMatch = returnUrl.match(/[?&]token=([^&]+)/);
        if (tokenMatch) token = tokenMatch[1];
      }

      if (token) {
        this.auth.inicializarDesdeSso(decodeURIComponent(token));
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    });
  }

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';
    this.auth.login(this.form.value).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err.error?.message ?? 'Credenciales incorrectas.';
      }
    });
  }
}