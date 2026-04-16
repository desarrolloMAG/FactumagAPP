/*import { Routes } from '@angular/router';

export const routes: Routes = [];*/

import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/interceptors/jwtInterceptor';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'rfcs',      loadComponent: () => import('./features/rfcs/rfcs.component').then(m => m.RfcsComponent) },
      { path: 'rfcs/new',  loadComponent: () => import('./features/rfcs/rfc.form.component').then(m => m.RfcFormComponent) },
      { path: 'rfcs/:id',  loadComponent: () => import('./features/rfcs/rfc.form.component').then(m => m.RfcFormComponent) },
      { path: 'wallet',    loadComponent: () => import('./features/wallet/wallet.component').then(m => m.WalletComponent) },
      { path: 'cfdis',     loadComponent: () => import('./features/cfdis/cfdis.component').then(m => m.CfdisComponent) },
      { path: 'cfdis/new', loadComponent: () => import('./features/cfdis/cfdi.emitir.component').then(m => m.CfdiEmitirComponent) },
      { path: 'perfil',    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: 'series',     loadComponent: () => import('./features/series/series.component').then(m => m.SeriesComponent) },
      { path: 'series/new', loadComponent: () => import('./features/series/serie.form.component').then(m => m.SerieFormComponent) },
      { path: 'series/:id', loadComponent: () => import('./features/series/serie.form.component').then(m => m.SerieFormComponent) },
      { path: 'clientes',      loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent) },
      { path: 'clientes/new',  loadComponent: () => import('./features/clientes/cliente.form.component').then(m => m.ClienteFormComponent) },
      { path: 'clientes/:id',  loadComponent: () => import('./features/clientes/cliente.form.component').then(m => m.ClienteFormComponent) },
      { path: 'conceptos',     loadComponent: () => import('./features/conceptos/conceptos.component').then(m => m.ConceptosComponent) },
      { path: 'conceptos/new', loadComponent: () => import('./features/conceptos/concepto.form.component').then(m => m.ConceptoFormComponent) },
      { path: 'conceptos/:id', loadComponent: () => import('./features/conceptos/concepto.form.component').then(m => m.ConceptoFormComponent) },
      { path: 'empleados',            loadComponent: () => import('./features/empleados/empleados.lista.component').then(m => m.EmpleadosListaComponent) },
      { path: 'empleados/new',        loadComponent: () => import('./features/empleados/empleado.form.component').then(m => m.EmpleadoFormComponent) },
      { path: 'empleados/:id/editar', loadComponent: () => import('./features/empleados/empleado.form.component').then(m => m.EmpleadoFormComponent) },
      { path: 'nomina/generar',       loadComponent: () => import('./features/nomina-generar/nomina.generar.component').then(m => m.NominaGenerarComponent) },
      { path: 'nomina/lotes',         loadComponent: () => import('./features/nomina-generar/nomina.lotes.component').then(m => m.NominaLotesComponent) },
      {
        path: 'sso/callback',
        loadComponent: () =>
          import('./core/components/sso-callback/sso-callback.component')
            .then(m => m.SsoCallbackComponent)
      },
      {
        path: 'sso/clear',
        loadComponent: () =>
          import('./core/components/sso-clear/sso-clear.component')
            .then(m => m.SsoClearComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
