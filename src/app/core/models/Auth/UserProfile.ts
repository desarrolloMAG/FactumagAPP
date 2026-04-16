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
  /**
   * Permisos planos del tenant. Para admin = ["*"]. Para roles custom = claves específicas.
   * Ej: ["*"]  |  ["ver_cfdis","emitir_cfdi","ver_series"]
   */
  tenantPermisos?: string[];
  /**
   * Permisos por módulo. Ej: { facturacion: ["*"] }  |  { facturacion: ["ver_cfdis"] }
   * Generado desde los claims {modulo}.permisos del JWT.
   */
  permisosPorModulo?: Record<string, string[]>;
}
