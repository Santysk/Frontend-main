import React, { useState } from 'react';
import { exportEmployeesPdf, exportShiftsPdf } from '../../api';

export default function Reports({ onBack }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const run = async (fn, okMsg) => {
    setMessage('');
    setError('');
    setDownloading(true);
    try {
      await fn();
      setMessage(okMsg);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'Error al generar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="reports-container">
        <div className="reports-header">
          <h1>Generar Reportes</h1>
          <button className="back-btn" onClick={onBack} disabled={downloading}>
            Volver
          </button>
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

        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>

      {/* ===== CSS integrado ===== */}
      <style>{`
.reports-container{
  padding:20px; max-width:800px; margin:20px auto;
  background:#f9f9f9; border-radius:12px;
  border:1px solid #e5e7eb; box-shadow:0 6px 16px rgba(0,0,0,.08);
  font-family:system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans";
}
.reports-header{
  display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;
}
.reports-header h1{
  margin:0; font-size:1.6rem; color:#111827; font-weight:800;
}
.back-btn{
  background:#f10a0a; color:#fff; padding:10px 14px; border:none; border-radius:10px;
  cursor:pointer; font-weight:700; transition:transform .08s ease, filter .2s ease, background .2s ease;
}
.back-btn:hover{ transform:translateY(-1px); filter:brightness(1.05); }
.back-btn:disabled{ opacity:.6; cursor:not-allowed; transform:none; }

.report-options{ display:flex; flex-direction:column; gap:14px; margin-top:10px; }
.report-btn{
  background:#2563eb; color:#fff; padding:12px 16px; border:none; border-radius:10px;
  font-size:1rem; font-weight:700; cursor:pointer;
  box-shadow:0 8px 18px rgba(37,99,235,.22);
  transition:transform .08s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
}
.report-btn:hover{ transform:translateY(-1px); box-shadow:0 12px 26px rgba(37,99,235,.28); }
.report-btn:disabled{ opacity:.65; cursor:not-allowed; transform:none; box-shadow:0 6px 14px rgba(0,0,0,.08); }

.success-message{
  color:#166534; background:#e8f6ee; border:1px solid #ccead8;
  padding:10px; border-radius:10px; margin-top:16px; text-align:center; font-weight:600;
}
.error-message{
  color:#b91c1c; background:#fee2e2; border:1px solid #fecaca;
  padding:10px; border-radius:10px; margin-top:16px; text-align:center; font-weight:600;
}

@media (max-width:560px){
  .reports-container{ padding:16px; }
  .reports-header h1{ font-size:1.3rem; }
}
      `}</style>
    </>
  );
}
