import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { UserProfile } from '../../models/Auth/UserProfile';
import { LoginResponse } from '../../models/Auth/LoginResponse';
import { LoginRequest } from '../../models/Auth/LoginRequest ';
import { MessageResponse } from '../../models/Paginación/MessageResponse';

// ── Auth Service ──────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE = `${environment.authUrl}`;
  private _user$ = new BehaviorSubject<UserProfile | null>(this.storedUser());

  user$ = this._user$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/Auth/login`, req).pipe(
      tap(res => {
        localStorage.setItem('accessToken',  res.accessToken);
        localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('user',         JSON.stringify(res.user));
        this._user$.next(res.user);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this._user$.next(null);
    window.location.href = `${environment.ssoUrl}/logout`
  }

  getToken(): string | null { return localStorage.getItem('accessToken'); }
  isLoggedIn(): boolean     { return !!this.getToken(); }
  currentUser(): UserProfile | null { return this._user$.value; }

  changePassword(oldPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/Auth/change-password`, { oldPassword, newPassword });
  }

  updateProfile(data: { name: string; email: string }): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.BASE}/Users/me`, data).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this._user$.next(user);
      })
    );
  }

  private storedUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}