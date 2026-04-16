import { Component, OnInit } from '@angular/core';
import { Router }            from '@angular/router';
import { AuthService }       from '../../services/Auth/AuthService';

@Component({
  selector:   'app-sso-callback',
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
        border-top-color:#10b981;
        animation:spin .8s linear infinite;
      "></div>
      Iniciando sesión...
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `
})
export class SsoCallbackComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (token) {
      this.auth.inicializarDesdeSso(decodeURIComponent(token));
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    } else {
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }
}
