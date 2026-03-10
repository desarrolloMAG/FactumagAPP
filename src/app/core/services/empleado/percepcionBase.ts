export interface PercepcionBase {
  id?: number;
  tipoPercepcion: string;
  clave: string;
  concepto: string;
  importeGravado: number;
  importeExento: number;
  activa?: boolean;
}