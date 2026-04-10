export interface UserProfile {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
  // Tenant
  tenantId?: number;
  tenantNombre?: string;
  tenantPlan?: string;
  tenantRol?: string;
  modulos?: string[];
  onboardingCompletado?: boolean;
  tipoNegocio?: string;
}
