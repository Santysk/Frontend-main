// RegisterShiftForm.jsx
import React, { useEffect, useState, useMemo } from 'react';
import styles from './RegisterShiftForm.module.css';
import { fetchEmployeeById, fetchRegistrosByEmployeeId, createRegistro } from '../api';

export default function RegisterShiftForm({ onSave, onCancel, initialEmployeeId }) {
  const [step, setStep] = useState('lookup'); // 'lookup' | 'form'
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [employee, setEmployee] = useState(null);
  const [tipoRegistro, setTipoRegistro] = useState('ENTRADA');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // recientes
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Util: LocalDateTime local sin Z (compatible con Spring LocalDateTime)
  const nowLocalNoZ = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
  };

  // Auto-lookup si viene desde el login kiosko
  useEffect(() => {
    if (!initialEmployeeId) return;
    const idNum = Number(initialEmployeeId);
    if (!idNum || idNum <= 0) return;

    (async () => {
      try {
        setLoading(true);
        setErr(''); setOk('');
        const emp = await fetchEmployeeById(idNum);
        if (emp) {
          setEmployee(emp);
          setStep('form');
        } else {
          setErr('Empleado no encontrado.');
        }
      } catch {
        setErr('Error buscando al empleado.');
      } finally {
        setLoading(false);
      }
    })();
  }, [initialEmployeeId]);

  // Cargar accesos recientes del empleado seleccionado
  useEffect(() => {
    if (!employee?.id) return;
    (async () => {
      try {
        setLoadingRecent(true);
        const data = await fetchRegistrosByEmployeeId(employee.id);
        const arr = Array.isArray(data) ? data : [];
        // ordenar desc por fechaHora y tomar 3
        arr.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));
        setRecent(arr.slice(0, 3));
      } catch {
        // silencioso: que no bloquee el formulario
      } finally {
        setLoadingRecent(false);
      }
    })();
  }, [employee?.id]);

  const handleLookup = async (e) => {
    e.preventDefault();
    setErr(''); setOk('');
    const idNum = Number(employeeIdInput);
    if (!idNum || idNum <= 0) { setErr('Ingresa un ID válido.'); return; }
    try {
      setLoading(true);
      const emp = await fetchEmployeeById(idNum);
      if (!emp) { setErr('Empleado no encontrado.'); return; }
      setEmployee(emp);
      setStep('form');
    } catch {
      setErr('Error buscando al empleado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    setErr(''); setOk('');
    try {
      setLoading(true);
      const fechaHora = nowLocalNoZ();
      await createRegistro({
        employeeId: Number(employee.id),
        tipo: tipoRegistro,      // "ENTRADA" | "SALIDA"
        fechaHora                // "YYYY-MM-DDTHH:mm:ss"
      });
      setOk(`Se registró la ${tipoRegistro.toLowerCase()} correctamente.`);
      onSave?.();
    } catch (ex) {
      setErr(ex?.message || 'Error al registrar el turno. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resetLookup = () => {
    setEmployee(null);
    setEmployeeIdInput('');
    setTipoRegistro('ENTRADA');
    setErr(''); setOk('');
    setRecent([]);
    setStep('lookup');
  };

  // helpers UI
  const accesoAutorizado = true; // si luego tienes flag real, cámbialo aquí

  const recentItems = useMemo(() => {
    return recent.map((r, idx) => {
      const dt = new Date(r.fechaHora);
      const fecha = dt.toLocaleDateString();
      const hora = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const esActual = idx === 0 && (r.tipo || '').toUpperCase() === 'ENTRADA';
      return {
        id: r.id,
        fecha,
        hora,
        estado: esActual ? 'En curso' : 'Exitoso'
      };
    });
  }, [recent]);

  return (
    <div className={styles.pageWrap}>
      {/* ── ENCABEZADO FIJO ── */}
      <header className={styles.topBarFixed}>
        <div className={styles.brandWrap}>
          <span className={styles.brandDotSm} />
          <div>
            <div className={styles.brandTitleSm}>ROOM_911</div>
            <div className={styles.brandSubSm}>Employee Portal</div>
          </div>
        </div>

        {/* 👇 Título en el centro del encabezado */}
        <h2 className={styles.headerTitle}>Registrar Turno</h2>

        <button type="button" className={styles.logoutBtn} onClick={onCancel}>
          Cerrar Sesión
        </button>
      </header>

      {/* ── CONTENIDO CENTRAL ── */}
      <main className={styles.main}>
        {step === 'lookup' && (
          <form className={styles.lookupCard} onSubmit={handleLookup} noValidate>
            <label htmlFor="empId" className={styles.label}>ID del empleado</label>
            <input
              id="empId"
              type="number"
              inputMode="numeric"
              placeholder="Ej: 27"
              value={employeeIdInput}
              onChange={(e) => setEmployeeIdInput(e.target.value)}
              className={styles.input}
            />
            {err && <p className={styles.errorMessage}>{err}</p>}
            {ok && <p className={styles.successMessage}>{ok}</p>}
            <div className={styles.row}>
              <button type="button" className={styles.btnSecondary} onClick={onCancel}>Volver</button>
              <button type="submit" className={styles.btnPrimary} disabled={loading || !employeeIdInput}>
                {loading ? 'Buscando…' : 'Continuar'}
              </button>
            </div>
          </form>
        )}

        {step === 'form' && employee && (
          <>
            <section className={styles.gridTwo}>
              {/* Mi Información */}
              <article className={styles.card}>
                <h3 className={styles.cardTitle}>Mi Información</h3>
                <div className={styles.kv}><span className={styles.k}>ID Empleado</span><span className={styles.v}>{employee.id?.toString().padStart(3, '0')}</span></div>
                <div className={styles.kv}><span className={styles.k}>Departamento</span><span className={styles.v}>{employee.departamento || '—'}</span></div>
                <div className={styles.kv}><span className={styles.k}>Cargo</span><span className={styles.v}>{employee.cargo || '—'}</span></div>
                <div className={styles.kv}><span className={styles.k}>Cédula</span><span className={styles.v}>{employee.identificacion || '—'}</span></div>
                <div className={styles.kv}><span className={styles.k}>Nombre</span><span className={styles.v}>{employee.nombre} {employee.apellido}</span></div>
              </article>

              {/* Estado de Acceso + registrar */}
              <article className={styles.card}>
                <div className={styles.cardHeaderRow}>
                  <h3 className={styles.cardTitle}>Estado de Acceso</h3>
                  <span className={`${styles.badge} ${styles.badgeOk}`}>ACCESO AUTORIZADO</span>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  <label htmlFor="tipo" className={styles.label}>Tipo de registro</label>
                  <select
                    id="tipo"
                    value={tipoRegistro}
                    onChange={(e) => setTipoRegistro(e.target.value)}
                    className={styles.select}
                  >
                    <option value="ENTRADA">Entrada</option>
                    <option value="SALIDA">Salida</option>
                  </select>

                  {err && <p className={styles.errorMessage}>{err}</p>}
                  {ok && <p className={styles.successMessage}>{ok}</p>}

                  <div className={styles.row}>
                    <button type="submit" className={styles.btnAction} disabled={loading}>
                      {loading ? 'Guardando…' : 'Registrar turno'}
                    </button>
                  </div>
                </form>
              </article>
            </section>

            {/* Accesos Recientes */}
            <section className={styles.cardFull}>
              <div className={styles.cardTitleRow}>
                <h3 className={styles.cardTitle}>Accesos Recientes</h3>
              </div>
              {loadingRecent ? (
                <div className={styles.muted}>Cargando últimos accesos…</div>
              ) : recentItems.length === 0 ? (
                <div className={styles.muted}>Sin accesos recientes.</div>
              ) : (
                <ul className={styles.recentList}>
                  {recentItems.map(item => (
                    <li key={item.id} className={styles.recentItem}>
                      <div>
                        <div className={styles.recentDate}>{item.fecha}</div>
                        <div className={styles.recentTime}>{item.hora}</div>
                      </div>
                      <span className={`${styles.pill} ${item.estado === 'En curso' ? styles.pillWarn : styles.pillOk}`}>
                        {item.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Instrucciones */}
            <section className={styles.instructions}>
              <h3 className={styles.cardTitle}><span className={styles.docIcon}>📝</span> Instrucciones de Acceso</h3>
              <p className={styles.muted}>Cómo acceder al ROOM_911 de forma segura</p>
              <div className={styles.instructionsGrid}>
                <div>
                  <div className={styles.subhead}>Procedimiento de Acceso:</div>
                  <ol className={styles.list}>
                    <li>Acércate al lector de tarjetas del ROOM_911</li>
                    <li>Presenta tu tarjeta de identificación</li>
                    <li>Espera la confirmación del sistema</li>
                    <li>Ingresa solo si el acceso es autorizado</li>
                  </ol>
                </div>
                <div>
                  <div className={styles.subhead}>Medidas de Seguridad:</div>
                  <ul className={styles.list}>
                    <li>No compartas tu tarjeta de acceso</li>
                    <li>Reporta tarjetas perdidas inmediatamente</li>
                    <li>No permitas el acceso a personal no autorizado</li>
                    <li>Sigue todos los protocolos de seguridad</li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
