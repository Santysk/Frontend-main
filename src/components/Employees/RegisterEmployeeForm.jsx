// src/components/Employees/RegisterEmployeeForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  fetchEmployeeById,
  fetchRegistrosByEmployeeId,
  exportEmployeeHistoryPdf,
  createRegistro,
} from "../../api";

export default function RegisterEmployeeForm({ employeeId: employeeIdProp, onExit }) {
  const [employeeId] = useState(
    employeeIdProp ?? localStorage.getItem("kioskEmployeeId") ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [employee, setEmployee] = useState(null);
  const [recentAccesses, setRecentAccesses] = useState([]); // guarda todos
  const [accessStatus, setAccessStatus] = useState("AUTORIZADO");
  const [mode, setMode] = useState("entrada");

  // paginación
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const hasData = !!employee;

  const handleLogout = () => {
    try {
      localStorage.removeItem("kioskEmployeeId");
      localStorage.removeItem("user");
    } finally {
      onExit?.();
      window.location.href = "/";
    }
  };

  const loadData = async (id) => {
    setErr("");
    try {
      setLoading(true);
      const emp = await fetchEmployeeById(id);
      if (!emp) { setErr("Empleado no encontrado."); return; }
      if (emp.activo === false) { setErr("Este empleado no tiene acceso habilitado."); return; }

      setEmployee(emp);
      setAccessStatus(emp.activo === false ? "DENEGADO" : "AUTORIZADO");

      const regs = await fetchRegistrosByEmployeeId(id);
      const norm = (Array.isArray(regs) ? regs : [])
        .map((r) => {
          const d = new Date(r.fechaHora);
          return {
            id: r.id,
            tipo: (r.tipo || "").toUpperCase(),
            date: d.toISOString().slice(0, 10),
            time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
        })
        .sort((a, b) =>
          a.date > b.date ? -1 : a.date < b.date ? 1 : a.time > b.time ? -1 : 1
        );

      setRecentAccesses(norm);
      setPage(1);
    } catch (e) {
      setErr(e?.message || "Error al consultar información.");
    } finally {
      setLoading(false);
    }
  };

  const registerNow = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      await createRegistro({
        tipo: mode,
        employeeId: employee.id,
        employee: { id: employee.id }, // compat
        empleadoId: employee.id,       // compat
      });
      setMode((m) => (m === "entrada" ? "salida" : "entrada"));
      await loadData(employee.id);
    } catch (e) {
      setErr(e?.message || "No se pudo registrar el turno.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const idNum = Number(employeeId);
    if (idNum > 0) loadData(idNum);
  }, [employeeId]);

  const statusMap = useMemo(() => ({
    AUTORIZADO: { text: "ACCESO AUTORIZADO", cls: "badge-ok" },
    DENEGADO:   { text: "ACCESO DENEGADO",   cls: "badge-bad" },
    PENDIENTE:  { text: "ACCESO PENDIENTE",  cls: "badge-warn" },
  }), []);
  const current = statusMap[accessStatus] || statusMap.AUTORIZADO;

  const downloadPdf = async () => {
    try { await exportEmployeeHistoryPdf(employee.id); }
    catch (e) { alert(e?.message || "No se pudo descargar el PDF"); }
  };

  // paginador
  const total = recentAccesses.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageData = recentAccesses.slice(start, start + pageSize);

  return (
    <>
      <div className="ep-page">
        {/* SHELL: encierra header + main para mismo ancho */}
        <div className="ep-shell">
          {/* Header */}
          <header className="ep-top">
            <div className="ep-brand">
              <span className="ep-dot" />
              <div>
                <div className="ep-title">ROOM 911</div>
                <div className="ep-sub">Registro de Turno</div>
              </div>
            </div>

            <div className="ep-welcome">
              <button className="ep-btn ep-btn-light" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>
          </header>

          {/* Contenido */}
          <main className="ep-main">
            {!hasData ? (
              <section className="ep-card" style={{ maxWidth: 520, margin: "0 auto" }}>
                <div className="ep-alert ep-alert--err" role="alert">
                  {employeeId ? "Cargando…" : "No se recibió el ID del empleado."}
                </div>
              </section>
            ) : (
              <>
                {/* fila 1: info + estado */}
                <section className="ep-grid2">
                  <div className="ep-card">
                    <div className="ep-card-h">
                      <span className="ep-ic ep-ic-id" />
                      <h3>Mi Información</h3>
                    </div>

                    <div className="ep-info">
                      <div><div className="ep-k">Empleado</div><div className="ep-v ep-strong">{employee?.nombre} {employee?.apellido}</div></div>
                      <div><div className="ep-k">ID Empleado</div><div className="ep-v">{employee?.id ?? "—"}</div></div>
                      <div><div className="ep-k">Cédula</div><div className="ep-v">{employee?.identificacion ?? "—"}</div></div>
                      <div><div className="ep-k">Departamento</div><div className="ep-v">{employee?.departamento ?? "—"}</div></div>
                    </div>
                  </div>

                  <div className="ep-card">
                    <div className="ep-card-h">
                      <span className="ep-ic ep-ic-shield" />
                      <h3>Estado de Acceso</h3>
                    </div>

                    <div className="ep-state">
                      <span className={`ep-badge ${current.cls}`}>{current.text}</span>
                      <p className="ep-note">
                        {accessStatus === "AUTORIZADO"
                          ? "Tienes autorización para acceder al ROOM_911"
                          : "Sin autorización vigente"}
                      </p>

                      <div className="ep-toggle">
                        <button
                          className={`ep-tbtn ${mode === "entrada" ? "active" : ""}`}
                          onClick={() => setMode("entrada")}
                          type="button"
                        >Entrada</button>
                        <button
                          className={`ep-tbtn ${mode === "salida" ? "active" : ""}`}
                          onClick={() => setMode("salida")}
                          type="button"
                        >Salida</button>
                      </div>
                      <button className="ep-btn ep-btn-primary" disabled={loading} onClick={registerNow}>
                        {loading ? "Guardando…" : `Registrar ${mode}`}
                      </button>
                    </div>
                  </div>
                </section>

                {/* Accesos recientes */}
                <section className="ep-card">
                  <div className="ep-card-h">
                    <span className="ep-ic ep-ic-clock" />
                    <h3>Accesos Recientes</h3>
                    <div style={{ marginLeft: "auto" }}>
                      <button className="ep-btn ep-btn-primary" onClick={downloadPdf}>
                        📄 Descargar historial (PDF)
                      </button>
                    </div>
                  </div>

                  {total === 0 ? (
                    <div className="ep-empty">Sin registros aún</div>
                  ) : (
                    <>
                      <div className="ep-list">
                        {pageData.map((r) => (
                          <div key={r.id} className="ep-item">
                            <div className="ep-item-date">
                              <div className="ep-date">{r.date}</div>
                              <div className="ep-time">{r.time}</div>
                            </div>
                            <div className="ep-item-status">
                              <span className={`ep-chip ${r.tipo === "ENTRADA" ? "ok" : "bad"}`}>
                                {r.tipo}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Paginador */}
                      <div className="ep-pager">
                        <button onClick={() => setPage(1)} disabled={safePage === 1} aria-label="Primera página">«</button>
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>Anterior</button>
                        <span className="ep-pager-info">Página {safePage} de {totalPages} · {total} registros</span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Siguiente</button>
                        <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages} aria-label="Última página">»</button>
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ===== CSS ===== */}
      <style>{`
:root{
  --green:#22c55e; --ok:#19a44f; --warn:#f59e0b; --bad:#ef4444;
  --bg:#22b455; --card:#fff; --line:#e5e7eb; --text:#0f172a; --muted:#64748b;
}
*{box-sizing:border-box}

/* Fondo y shell centrado */
.ep-page{
  min-height:100vh;
  width:100%;
 /* background:var(--bg);*/
  padding:20px 16px 28px;
  font-family:system-ui, Segoe UI, Roboto, Ubuntu, sans-serif;
  color:var(--text);
}
.ep-shell{
  max-width:1080px;      /* ⬅ mismo ancho para header y contenido */
  margin:0 auto;
}

/* Header */
.ep-top{
  display:flex; justify-content:space-between; align-items:center;
  background:#dff5e5; border:1px solid rgba(0,0,0,.08);
  border-radius:12px; padding:10px 14px; margin-bottom:16px;
  box-shadow:0 4px 10px rgba(0,0,0,.06);
}
.ep-brand{display:flex; align-items:center; gap:8px}
.ep-dot{width:10px; height:10px; border-radius:50%; background:var(--green); box-shadow:0 0 0 2px rgba(34,197,94,.25)}
.ep-title{font-weight:800; color:#073b16; font-size:14px}
.ep-sub{font-size:11px; color:#08672a; opacity:.8; margin-top:1px}
.ep-welcome{display:flex; align-items:center; gap:8px}

/* Main */
.ep-main{
  display:grid; gap:12px;
}
.ep-card{
  width:100%;                 /* ⬅ Nunca se sale del shell */
  background:var(--card); border:1px solid var(--line);
  border-radius:12px; padding:12px; box-shadow:0 8px 18px rgba(0,0,0,.06);
  overflow:hidden;
}
.ep-card-h{display:flex; align-items:center; gap:6px; margin-bottom:6px}
.ep-card h3{margin:0; font-size:16px; color:#0b0b0b}

/* Grids */
.ep-grid2{display:grid; grid-template-columns:1fr 1fr; gap:10px}
@media (max-width:980px){ .ep-grid2{grid-template-columns:1fr} }

/* Icons */
.ep-ic{width:14px; height:14px; border-radius:3px; display:inline-block}
.ep-ic-id{background:#60a5fa}
.ep-ic-shield{background:#93c5fd}
.ep-ic-clock{background:#a7f3d0}

/* Info */
.ep-info{display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px}
@media (max-width:900px){ .ep-info{grid-template-columns:repeat(2,1fr)} }
.ep-k{font-size:11px; color:var(--muted)}
.ep-v{font-size:14px}
.ep-strong{font-weight:800}

/* Estado & Toggle */
.ep-state{display:flex; flex-direction:column; align-items:center; gap:8px; padding:6px}
.ep-badge{
  display:inline-flex; align-items:center; justify-content:center;
  padding:8px 12px; border-radius:999px; font-weight:800; color:#fff;
  font-size:13px; box-shadow:0 6px 14px rgba(0,0,0,.1)
}
.badge-ok{background:var(--ok)} .badge-warn{background:var(--warn)} .badge-bad{background:var(--bad)}
.ep-note{margin:0; color:var(--muted); font-size:12px}
.ep-toggle{
  display:flex; background:#eef2ff; border:1px solid #dbe3ff; border-radius:999px;
  width:max-content; margin:4px 0 2px
}
.ep-tbtn{
  border:none; background:transparent; padding:6px 12px; border-radius:999px;
  cursor:pointer; font-weight:800; color:#1f2a44; font-size:13px
}
.ep-tbtn.active{background:#fff; border:1px solid #dbe3ff; box-shadow:0 3px 10px rgba(0,0,0,.08)}

/* Lista Accesos */
.ep-list{display:flex; flex-direction:column; gap:8px}
.ep-item{
  border:1px solid var(--line); border-radius:10px;
  padding:8px 10px; display:flex; justify-content:space-between; align-items:center
}
.ep-item-date{display:flex; flex-direction:column}
.ep-date{font-weight:800; color:#111; font-size:14px}
.ep-time{font-size:12px; color:var(--muted)}
.ep-chip{padding:4px 8px; border-radius:999px; font-weight:700; font-size:11px; border:1px solid transparent}
.ep-chip.ok{background:#dcfce7; border-color:#86efac; color:#166534}
.ep-chip.bad{background:#fee2e2; border-color:#fecaca; color:#991b1b}
.ep-empty{
  border:1px dashed #cbd5e1; background:#f8fafc; color:#64748b;
  border-radius:8px; padding:14px; text-align:center; margin-top:4px; font-size:13px
}

/* Botones */
.ep-btn{padding:8px 10px; border-radius:9px; border:1px solid rgba(0,0,0,.12); cursor:pointer; font-weight:700; font-size:13px}
.ep-btn-primary{color:#fff; background:linear-gradient(90deg,#2563eb,#1e40af); box-shadow:0 6px 14px rgba(37,99,235,.16)}
.ep-btn-primary:disabled{opacity:.6; cursor:not-allowed}
.ep-btn-light{background:#fff}

/* Paginador */
.ep-pager{
  display:flex; align-items:center; justify-content:center; gap:8px;
  margin-top:12px; flex-wrap:wrap;
}
.ep-pager button{
  padding:8px 12px; border:1px solid #d1d5db; background:#fff;
  border-radius:8px; cursor:pointer; font-weight:700; font-size:13px;
}
.ep-pager button:hover:not(:disabled){ background:#f3f4f6; }
.ep-pager button:disabled{ opacity:.55; cursor:not-allowed; }
.ep-pager-info{ color:#64748b; font-size:12.5px; }
      `}</style>
    </>
  );
}
