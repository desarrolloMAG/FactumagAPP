import { Component, inject } from '@angular/core';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button class="theme-toggle" (click)="theme.toggle()"
            [title]="theme.isDark() ? 'Cambiar a claro' : 'Cambiar a oscuro'">
      {{ theme.isDark() ? '☀️' : '🌙' }}
    </button>
  `,
  styles: [`
    .theme-toggle {
      width: 36px; height: 36px; border-radius: 6px;
      background: var(--mag-surface, #fff);
      border: 1px solid var(--mag-border, #E2E8F0);
      cursor: pointer; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .theme-toggle:hover {
      background: var(--mag-primary-50, rgba(59,99,217,0.08));
      border-color: var(--mag-primary, #3B63D9);
    }
  `]
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
