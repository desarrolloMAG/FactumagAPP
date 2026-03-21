import { Component, OnInit } from '@angular/core';

@Component({
  selector:   'app-sso-clear',
  standalone: true,
  template: `
    <div style="
      min-height:100vh; background:#0a0f1a;
      display:flex; align-items:center; justify-content:center;
      font-family:'DM Sans',sans-serif; color:rgba(255,255,255,0.4);
      font-size:14px; gap:12px;
    ">
      <div style="
        width:18px; height:18px; border-radius:50%;
        border:2px solid rgba(255,255,255,0.1);
        border-top-color:#ef4444;
        animation:spin .8s linear infinite;
      "></div>
      Cerrando sesión...
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `
})
export class SsoClearComponent implements OnInit {
  ngOnInit(): void {
    // Limpiar sesión de FactuMAG
    localStorage.clear();

    // Leer next y continuar la cadena
    const params = new URLSearchParams(window.location.search);
    const next   = params.get('next') ?? 'http://localhost:4200/login';

    setTimeout(() => {
      window.location.href = decodeURIComponent(next);
    }, 300);
  }
}