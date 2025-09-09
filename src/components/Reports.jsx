import React, { useState } from 'react';
import './Reports.css';
import { exportEmployeesPdf, exportShiftsPdf } from '../api';

export default function Reports({ onBack }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Función reutilizable
  const run = async (fn, okMsg) => {
    setMessage('');
    setError('');
    setDownloading(true);
    try {
      await fn();
      setMessage(okMsg);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Error al generar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>Generar Reportes</h1>
        <button className="back-btn" onClick={onBack}>Volver</button>
      </div>

      <div className="report-options">
        <button
          className="report-btn"
          disabled={downloading}
          onClick={() => run(exportEmployeesPdf, 'Reporte de empleados descargado exitosamente.')}
        >
          {downloading ? 'Generando…' : 'Descargar Reporte de Todos los Empleados (PDF)'}
        </button>

        <button
          className="report-btn"
          disabled={downloading}
          onClick={() => run(exportShiftsPdf, 'Reporte de registros de turno descargado exitosamente.')}
        >
          {downloading ? 'Generando…' : 'Descargar Reporte de Todos los Registros de Turno (PDF)'}
        </button>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
