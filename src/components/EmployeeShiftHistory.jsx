import React, { useState, useEffect } from 'react';
import { fetchRegistrosByEmployeeId, fetchEmployeeById } from '../api'; // Assuming these will be created/updated
import './ShiftList.css'; // Reusing styles from ShiftList

export default function EmployeeShiftHistory({ employeeId, onBack }) {
  const [employee, setEmployee] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getHistory = async () => {
      try {
        setLoading(true);
        // Fetch employee details
        const employeeData = await fetchEmployeeById(employeeId);
        setEmployee(employeeData);

        // Fetch shift registrations for this employee
        const data = await fetchRegistrosByEmployeeId(employeeId);
        setRegistros(data);
      } catch (err) {
        console.error('Error fetching employee history:', err);
        setError('Error al cargar el historial de turnos del empleado.');
      } finally {
        setLoading(false);
      }
    };
    getHistory();
  }, [employeeId]);

  if (loading) {
    return <div className="shift-list-container">Cargando historial...</div>;
  }

  if (error) {
    return <div className="shift-list-container error-message">{error}</div>;
  }

  return (
    <div className="shift-list-container">
      <div className="shift-header">
        <h1>Historial de Turnos de {employee ? `${employee.nombre} ${employee.apellido}` : 'Empleado'}</h1>
        <div className="buttoms">
          <button className="back-btn" onClick={onBack}>Volver</button>
          <button className="report-btn" onClick={async () => {
            try {
              const response = await fetch(`http://localhost:8080/api/reports/employee/${employeeId}/pdf`);
              if (!response.ok) {
                throw new Error('Error al generar el reporte PDF del historial.');
              }
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `historial_turnos_${employeeId}.pdf`;
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error('Error generating employee history PDF:', err);
              setError('Error al generar el reporte PDF del historial. Intenta de nuevo.');
            }
          }}>
            Descargar Reporte PDF
          </button>
        </div>
      </div>

      {registros.length === 0 ? (
        <p>Sin registros aún</p>
      ) : (
        <table className="shift-table">
          <thead>
            <tr>
              <th>Tipo de Registro</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td>{registro.tipo}</td>
                <td>{new Date(registro.fechaHora).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
