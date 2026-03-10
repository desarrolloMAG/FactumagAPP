export interface CalculoNomina {
  empleadoId: number;
  nombreEmpleado: string;
  totalGravado: number;
  totalExento: number;
  totalSueldos: number;
  percepciones: any[];
  imssObrero: number;
  isr: number;
  totalDeducciones: number;
  deducciones: any[];
  subsidioEmpleo: number;
  otrosPagos: any[];
  netoPagar: number;
  diasEfectivos: number;
}