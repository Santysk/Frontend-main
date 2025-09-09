import React, { useEffect, useMemo, useState } from 'react';
import { fetchEmployees, deleteEmployee } from '../api';
import ImportEmployees from './ImportEmployees';
import './EmployeeList.css';

export default function EmployeeList({
  onLogout, onCreateNew, onRegisterShift, onViewShifts,
  onEditEmployee, onViewEmployeeHistory, onGenerateReports
}) {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [refreshList, setRefreshList] = useState(false);
  const [page, setPage] = useState(1);        // 1-based en UI
  const [pageSize, setPageSize] = useState(10);

  // UI: modal de confirmación y toast
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({ open: false, type: 'success', message: '' });
  const showToast = (type, message) => {
    setToast({ open: true, type, message });
    setTimeout(() => setToast({ open: false, type, message: '' }), 2400);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchEmployees();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
    })();
  }, [refreshList]);

  // filtro
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(emp =>
      Object.values(emp ?? {}).some(v => (v ?? '').toString().toLowerCase().includes(q))
    );
  }, [employees, search]);

  // paginación (client)
  const total       = filtered.length;
  const totalPages  = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx    = (currentPage - 1) * pageSize;
  const endIdx      = Math.min(startIdx + pageSize, total);
  const pageData    = filtered.slice(startIdx, endIdx);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  // abrir modal
  const askDelete = (emp) => {
    setToDelete(emp);
    setConfirmOpen(true);
  };

  // confirmar eliminación (modal)
  const confirmDelete = async () => {
    if (!toDelete?.id) return;
    try {
      setDeleting(true);
      await deleteEmployee(toDelete.id);
      setEmployees(prev => prev.filter(e => e.id !== toDelete.id));
      setConfirmOpen(false);
      setToDelete(null);
      showToast('success', 'Empleado eliminado con éxito');
    } catch (e) {
      // Mensaje claro si hay FK/Registros asociados o cualquier otro error
      const msg = e?.message || 'No se pudo eliminar el empleado.';
      showToast('error', msg.includes('restricc') || msg.includes('asociad') ? 
        'No se puede eliminar: el empleado tiene registros asociados.' : msg);
    } finally {
      setDeleting(false);
    }
  };

  // números del paginador con elipsis …
  const pageNumbers = useMemo(() => {
    const maxButtons = 7; // cantidad máxima de botones visibles
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const numbers = [];
    const showLeftEllipsis  = currentPage > 4;
    const showRightEllipsis = currentPage < totalPages - 3;

    const start = showLeftEllipsis ? currentPage - 1 : 1;
    const end   = showRightEllipsis ? currentPage + 1 : totalPages;

    numbers.push(1);
    if (showLeftEllipsis) numbers.push('…');

    for (let n = Math.max(2, start); n <= Math.min(totalPages - 1, end); n++) {
      numbers.push(n);
    }

    if (showRightEllipsis) numbers.push('…');
    if (totalPages > 1) numbers.push(totalPages);

    return numbers;
  }, [currentPage, totalPages]);

  return (
    <div className="layout">
      {/* Sidebar izquierdo */}
      <aside className="sidebar">
        <h2 className="sidebar-title">Menú</h2>

        <button className="side-btn" onClick={onCreateNew} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/agregar.svg" alt="Nuevo" style={{ width: 18, height: 18 }} />
          Nuevo Empleado
        </button>

        <button className="side-btn" onClick={() => setShowImportModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/importar.svg" alt="Importar" style={{ width: 18, height: 18 }} />
          Importar
        </button>

        <button className="side-btn" onClick={onViewShifts} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/registros.svg" alt="Registros" style={{ width: 18, height: 18 }} />
          Ver Registros
        </button>

        <button className="side-btn" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icons/salir.svg" alt="Salir" style={{ width: 18, height: 18 }} />
          Salir
        </button>
      </aside>

      {/* Contenido */}
      <main className="content">
        <h1 className="page-title">Empleados</h1>

        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar empleados…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th><th>Cédula</th><th>Nombres</th><th>Apellidos</th>
              <th>Cargo</th><th>Departamento</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(emp => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.identificacion}</td>
                <td>{emp.nombre}</td>
                <td>{emp.apellido}</td>
                <td>{emp.cargo}</td>
                <td>{emp.departamento}</td>
                <td className="actions-cell">
                  <button className="btn-small" onClick={() => onEditEmployee(emp)}>Editar</button>
                  <button className="btn-small danger" onClick={() => askDelete(emp)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="pager">
          <div className="pager-left">
            <span>Mostrando <strong>{total === 0 ? 0 : startIdx + 1}</strong>–<strong>{endIdx}</strong> de <strong>{total}</strong> registros</span>
          </div>

          <div className="pager-center">
            <button className="pager-btn" onClick={() => setPage(1)} disabled={currentPage === 1} aria-label="Primera página">⏮</button>
            <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Anterior">◀</button>

            {pageNumbers.map((n, idx) =>
              n === '…' ? (
                <span key={`dots-${idx}`} className="pager-ellipsis">…</span>
              ) : (
                <button
                  key={n}
                  className={`pager-btn number ${n === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                  aria-current={n === currentPage ? 'page' : undefined}
                >
                  {n}
                </button>
              )
            )}

            <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Siguiente">▶</button>
            <button className="pager-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} aria-label="Última página">⏭</button>
          </div>

          <div className="pager-right" />
        </div>
      </main>

      {showImportModal && (
        <ImportEmployees
          onClose={() => setShowImportModal(false)}
          onImportSuccess={() => { setShowImportModal(false); setRefreshList(p => !p); }}
        />
      )}

      {/* Modal de confirmación */}
      {confirmOpen && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Eliminar empleado</h3>
            <p className="modal-text">
              ¿Seguro que deseas eliminar a <strong>{toDelete?.nombre} {toDelete?.apellido}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancelar</button>
              <button className="btn danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <div className={`toast ${toast.type === 'error' ? 'error' : 'success'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
