import { Injectable, signal } from '@angular/core';

const COOKIE_KEY = 'mag-theme';
const STORAGE_KEY = 'mag-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const theme = this.readTheme();
    if (theme === 'dark') {
      this.isDark.set(true);
      document.body.classList.add('mag-dark');
    }
  }

  toggle(): void {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.body.classList.toggle('mag-dark', dark);
    this.saveTheme(dark ? 'dark' : 'light');
  }

  private readTheme(): string {
    // Cookie tiene prioridad (compartida entre apps del mismo dominio)
    const cookie = this.getCookie(COOKIE_KEY);
    if (cookie) return cookie;
    return localStorage.getItem(STORAGE_KEY) ?? 'light';
  }

  private saveTheme(value: string): void {
    localStorage.setItem(STORAGE_KEY, value);
    // Cookie sin puerto — persiste en todas las apps de localhost
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${COOKIE_KEY}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }
}
