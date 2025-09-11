import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchRegistros,
  exportShiftsPdf,             // todos
  exportShiftsPdfByRange,      // ⬅️ nombre correcto como en tu api.js
  exportEmployeeHistoryPdf      // por empleado
} from '../../api';
import './ShiftList.css';

export default function ShiftList({ onBack }) {
  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // mejoras de UI
  const [q, setQ] = useState('');                  // búsqueda
  const [sortKey, setSortKey] = useState('fecha'); // 'id','nombre','tipo','fecha'
  const [sortDir, setSortDir] = useState('desc');  // 'asc' | 'desc'
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // rango de fecha/hora para PDF
  const [fromVal, setFromVal] = useState('');      // <input type="datetime-local" />
  const [toVal, setToVal] = useState('');

  const loadRegistros = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRegistros();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching registros:', err);
      setError('Error al cargar la lista de registros de turno.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRegistros(); }, []);

  // helper: normalizar fecha entrante a Date local
  const toDate = (v) => {
    if (!v) return null;
    if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(v)) return new Date(v);
    const [d, t] = String(v).split('T');
    if (!d || !t) return new Date(v);
    const [y,m,day] = d.split('-').map(Number);
    const [hh,mm,ss] = t.split(':').map(Number);
    return new Date(y, (m || 1) - 1, day || 1, hh || 0, mm || 0, ss || 0);
  };

  const normalized = useMemo(() => {
    return (registros || []).map(r => {
      const nombre = r?.employee ? `${r.employee.nombre ?? ''} ${r.employee.apellido ?? ''}`.trim() : '';
      return {
        ...r,
        _idEmp: r?.employee?.id ?? '',
        _nombre: nombre,
        _fecha: toDate(r?.fechaHora),
      };
    });
  }, [registros]);

  // filtro
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return normalized;
    return normalized.filter(r =>
      String(r._idEmp).toLowerCase().includes(term) ||
      (r._nombre || '').toLowerCase().includes(term) ||
      (r.tipo || '').toLowerCase().includes(term)
    );
  }, [normalized, q]);

  // orden
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va, vb;
      switch (sortKey) {
        case 'id':     va = a._idEmp; vb = b._idEmp; break;
        case 'nombre': va = (a._nombre || '').toLowerCase(); vb = (b._nombre || '').toLowerCase(); break;
        case 'tipo':   va = (a.tipo || '').toLowerCase(); vb = (b.tipo || '').toLowerCase(); break;
        case 'fecha':
        default:       va = a._fecha ? a._fecha.getTime() : 0; vb = b._fecha ? b._fecha.getTime() : 0; break;
      }
      if (va === vb) return 0;
      const res = va > vb ? 1 : -1;
      return sortDir === 'asc' ? res : -res;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // paginación
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageData = sorted.slice(start, start + pageSize);

  useEffect(() => { setPage(1); }, [q]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'fecha' ? 'desc' : 'asc');
    }
  };

  // === Descargas PDF ===
  const downloadAll = () =>
    exportShiftsPdf().catch(e => alert(e.message || 'No se pudo descargar el PDF'));

  const downloadOne = (empId) =>
    exportEmployeeHistoryPdf(empId).catch(e => alert(e.message || 'No se pudo descargar el PDF'));

  // Reemplaza el helper actual por ESTE
const toIsoLocalNoTZ = (value) => {
  // value viene de <input type="datetime-local"> como "YYYY-MM-DDTHH:mm" (sin zona)
  if (!value) return null;
  // si ya trae segundos, la devolvemos tal cual; si no, agregamos ":00"
  return value.length === 16 ? `${value}:00` : value;
};

  const downloadRange = async () => {
    try {
      const params = {};
      const f = toIsoLocalNoTZ(fromVal);
      const t = toIsoLocalNoTZ(toVal);
      if (f) params.from = f;
      if (t) params.to   = t;
      if (!f && !t) {
        alert('Selecciona al menos una fecha/hora (Desde o Hasta).');
        return;
      }
      await exportShiftsPdfByRange(params);
    } catch (e) {
      alert(e.message || 'No se pudo descargar el PDF del rango');
    }
  };

  if (loading) {
    return (
      <div className="shift-list-container">
        <div className="shift-header">
          <h1>Registros de Turno</h1>
          <div className="Buttoms">
            <button className="back-btn" onClick={onBack}>Volver</button>
            <button className="pdf-btn" disabled>⬇️ Descargar todos (PDF)</button>
          </div>
        </div>
        <div className="skeleton">Cargando registros…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shift-list-container">
        <div className="shift-header">
          <h1>Registros de Turno</h1>
          <div className="Buttoms">
            <button className="back-btn" onClick={onBack}>Volver</button>
            <button className="pdf-btn" onClick={downloadAll}>⬇️ Descargar todos (PDF)</button>
          </div>
        </div>
        <div className="error-message">
          {error}
          <div style={{ marginTop: 10 }}>
            <button className="retry-btn" onClick={loadRegistros}>Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shift-list-container">
      <div className="shift-header">
        <h1>Registros de Turno</h1>
        <div className="Buttoms">
          <button className="back-btn" onClick={onBack}>Volver</button>
          <button className="pdf-btn" onClick={downloadAll}>⬇️ Descargar todos (PDF)</button>
        </div>
      </div>

      {/* Toolbar: búsqueda + rango para PDF */}
      <div className="shift-toolbar">
        <input
          className="shift-search"
          placeholder="Buscar por ID, nombre o tipo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="range-group">
          <label className="range-label">Desde:</label>
          <input
            type="datetime-local"
            className="range-input"
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
          />
          <label className="range-label">Hasta:</label>
          <input
            type="datetime-local"
            className="range-input"
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
          />
          <button className="pdf-btn" onClick={downloadRange}>
            ⬇️ Descargar rango (PDF)
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          No hay registros de turno para mostrar.
        </div>
      ) : (
        <>
          <table className="shift-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')}>
                  ID Empleado {sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('nombre')}>
                  Nombre Empleado {sortKey === 'nombre' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('tipo')}>
                  Tipo de Registro {sortKey === 'tipo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => toggleSort('fecha')}>
                  Fecha y Hora {sortKey === 'fecha' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((registro) => {
                const fechaOk = registro._fecha
                  ? registro._fecha.toLocaleString()
                  : (registro.fechaHora ? String(registro.fechaHora) : '—');

                const tipo = (registro.tipo || '').toUpperCase();
                const badgeClass = tipo === 'ENTRADA'
                  ? 'badge-in'
                  : (tipo === 'SALIDA' ? 'badge-out' : 'badge');

                const empId = registro._idEmp;

                return (
                  <tr key={registro.id}>
                    <td>{empId || 'N/A'}</td>
                    <td>{registro._nombre || 'N/A'}</td>
                    <td><span className={badgeClass}>{tipo || '—'}</span></td>
                    <td>{fechaOk}</td>
                    <td>
                      <button
                        className="row-pdf-btn"
                        disabled={!empId}
                        onClick={() => downloadOne(empId)}
                        title="Descargar historial de este empleado"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="shift-pager">
            <button onClick={() => setPage(1)} disabled={pageSafe === 1}>&laquo;</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe === 1}>Anterior</button>
            <span className="muted">
              Página {pageSafe} de {totalPages} · {total} registros
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>Siguiente</button>
            <button onClick={() => setPage(totalPages)} disabled={pageSafe === totalPages}>&raquo;</button>
          </div>
        </>
      )}
    </div>
  );
}
