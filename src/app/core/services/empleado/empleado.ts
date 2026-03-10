import { PercepcionBase } from "./percepcionBase";

export interface Empleado {
  id?: number;
  rfcId: number;
  nombre: string;
  curp: string;
  nss: string;
  numEmpleado: string;
  tipoContrato: string;
  tipoRegimen: string;
  periodicidadPago: string;
  registroPatronal: string;
  entidadFederativa: string;
  claveEntFed: string;
  riesgoTrabajo: string;
  departamento?: string;
  puesto?: string;
  banco?: string;
  cuentaBancaria?: string;
  curpPatron?: string;
  salarioBase: number;
  salarioDiarioIntegrado: number;
  fechaInicioRelLaboral: string;
  activo?: boolean;
  percepcionesBase: PercepcionBase[];
}