import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CompletarOnboardingResponse {
  accessToken: string;
  tipoNegocio: string;
  modulos: string[];
  onboardingCompletado: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly BASE = `${environment.authUrl}/Tenants`;

  constructor(private http: HttpClient) {}

  completarOnboarding(
    tenantId: number,
    tipoNegocio: string,
    modulosExtra: string[] = []
  ): Observable<CompletarOnboardingResponse> {
    return this.http.post<CompletarOnboardingResponse>(
      `${this.BASE}/${tenantId}/completar-onboarding`,
      { tipoNegocio, modulosExtra }
    );
  }
}
