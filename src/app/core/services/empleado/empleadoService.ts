import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { Injectable } from "@angular/core";
import { Empleado } from "./empleado";
import { Observable } from "rxjs";
import { CalculoNomina } from "./calculoNomina";

@Injectable({ providedIn: 'root' })
export class EmpleadoService {
  private base = `${environment.facturacionUrl}/api/Empleados`;

  constructor(private http: HttpClient) {}

  listar(rfcId: number, soloActivos = true): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.base}?rfcId=${rfcId}&soloActivos=${soloActivos}`);
  }

  obtener(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.base}/${id}`);
  }

  crear(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.base, empleado);
  }

  actualizar(id: number, empleado: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.base}/${id}`, empleado);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  calcularPreview(payload: {
    rfcId: number;
    empleadoIds: number[];
    diasEfectivos: number;
    percepcionesVariables: Record<number, any[]>;
  }): Observable<CalculoNomina[]> {
    return this.http.post<CalculoNomina[]>(`${this.base}/calcular-preview`, payload);
  }
}