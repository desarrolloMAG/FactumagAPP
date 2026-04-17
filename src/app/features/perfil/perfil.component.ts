import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  template: `
    <iframe
      [src]="perfilUrl"
      class="perfil-frame"
      frameborder="0"
      allow="clipboard-write">
    </iframe>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    .perfil-frame {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      min-height: calc(100vh - 60px);
      background: var(--bg-surface, #fff);
    }
  `]
})
export class PerfilComponent {
  private sanitizer = inject(DomSanitizer);

  readonly perfilUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `${environment.ssoUrl}/perfil?iframe=true`
  );
}
