import React, { useEffect, useMemo, useState } from 'react';
import { fetchEmployees, deleteEmployee } from '../../api';
import ImportEmployees from '../Import/ImportEmployees';
// ❌ Quita esta importación de CSS externo si la tienes
// import './EmployeeList.css';

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
    <>
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
                <th>ID</th><th>Identificacion</th><th>Nombres</th><th>Apellidos</th>
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

      {/* ===== CSS integrado ===== */}
      <style>{`
/* ===== Layout general ===== */
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 20px;
  padding: 16px;
  background: #eceff1; /* gris claro parejo */
  min-height: 100vh;
}

.sidebar {
  background: #f7f7f9;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px;
  height: fit-content;
}

.sidebar-title {
  margin: 0 0 10px 0;
  font-weight: 800;
  color: #111827;
}

.side-btn {
  width: 100%;
  text-align: left;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  margin: 8px 0;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .05s;
}
.side-btn:hover { background: #f3f4f6; border-color: #cfd6de; }
.side-btn:active { transform: translateY(1px); }

.content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden; /* para sticky header */
}

.page-title {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-weight: 800;
  color: #1f2937;
}

.toolbar {
  margin-bottom: 10px;
  display: flex;
  gap: 12px;
}
.search-input {
  flex: 1;
  height: 38px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  transition: border-color .15s, box-shadow .15s;
}
.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,.18);
}

/* ===== Tabla ===== */
.employee-table {
  width: 100%;
  border-collapse: separate;    /* importante para radios */
  border-spacing: 0;            /* sin espacios */
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;             /* redondeo visual */
  font-size: 14px;
}

/* Cabecera sticky y elegante */
.employee-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #111827;
  color: #fff;
  text-align: left;
  font-weight: 700;
  padding: 10px 12px;
  border-bottom: 1px solid #0f172a;
}

/* Celdas */
.employee-table td {
  padding: 10px 12px;
  vertical-align: middle;
  border-top: 1px solid #e5e7eb;   /* separador fino entre filas */
  color: #111827;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Zebra + hover */
.employee-table tbody tr:nth-child(odd)  { background: #fbfbfd; }
.employee-table tbody tr:nth-child(even) { background: #f6f7fb; }
.employee-table tbody tr:hover { background: #eef2ff; }

/* Columna de acciones */
.actions-cell {
  white-space: nowrap;
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Botones de acción (píldoras) */
.btn-small {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  color: #111827;
  font-size: 12px;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .05s;
}
.btn-small:hover { background: #f3f4f6; border-color: #cbd5e1; }
.btn-small:active { transform: translateY(1px); }

.btn-small.danger {
  border-color: #fecaca;
  background: #fff5f5;
  color: #b91c1c;
}
.btn-small.danger:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* ===== Paginador ===== */
.pager {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  margin-top: 12px;
  gap: 8px;
}
.pager-left { font-size: 13px; color: #6b7280; }
.pager-center { display: inline-flex; gap: 6px; }
.pager-right {}

.pager-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .05s;
}
.pager-btn:hover { background: #f3f4f6; border-color: #cbd5e1; }
.pager-btn.number.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}
.pager-ellipsis { padding: 6px 8px; color: #9ca3af; }

/* ===== Modal confirmación ===== */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  display: grid; place-items: center;
  z-index: 50;
}
.modal {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,.18);
}
.modal-title {
  margin: 0 0 8px 0;
  font-weight: 800;
  color: #111827;
}
.modal-text { margin: 0 0 14px 0; color: #374151; }
.modal-actions {
  display: flex; justify-content: flex-end; gap: 8px;
}
.btn {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}
.btn:hover { background: #f3f4f6; }
.btn.danger {
  background: #dc2626; color: #fff; border-color: #dc2626;
}
.btn.danger:hover { background: #b91c1c; }

/* ===== Toast ===== */
.toast {
  position: fixed; bottom: 18px; right: 18px;
  padding: 10px 14px;
  border-radius: 10px;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,.22);
  z-index: 60;
}
.toast.success { background: #16a34a; }
.toast.error   { background: #dc2626; }

/* ===== Responsivo ===== */
@media (max-width: 980px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { order: 2; }
  .content { order: 1; }
}
/* En móviles, ocultar columnas menos críticas para que no se rompa */
@media (max-width: 780px) {
  .employee-table th:nth-child(2),
  .employee-table td:nth-child(2),  /* Cédula */
  .employee-table th:nth-child(6),
  .employee-table td:nth-child(6) { /* Departamento */
    display: none;
  }
}
@media (max-width: 560px) {
  .employee-table th:nth-child(4),
  .employee-table td:nth-child(4) { /* Apellidos */
    display: none;
  }
}
      `}</style>
    </>
  );
}
