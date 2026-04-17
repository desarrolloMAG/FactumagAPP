import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit, OnDestroy {
  private boundHandler = this.onMessage.bind(this);

  ngOnInit(): void {
    window.addEventListener('message', this.boundHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.boundHandler);
  }

  private onMessage(event: MessageEvent): void {
    if (event.data?.type !== 'sso-assets') return;
    const { avatarUrl, logoUrl, userId, tenantId } = event.data;
    if (avatarUrl && userId)   localStorage.setItem(`sso_avatar_${userId}`, avatarUrl);
    if (logoUrl   && tenantId) localStorage.setItem(`sso_logo_${tenantId}`, logoUrl);

    // Disparar evento para que el user-menu se actualice en vivo
    window.dispatchEvent(new CustomEvent('sso-assets-updated', { detail: event.data }));
  }
}
