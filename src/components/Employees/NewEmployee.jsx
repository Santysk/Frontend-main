// src/components/Employees/NewEmployee.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { createEmployee,
         persistAdminView, readAdminView, clearAdminView,
         persistNewEmployeeDraft, readNewEmployeeDraft, clearNewEmployeeDraft } from '../../api';

const LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
const DIGITS_REGEX  = /^\d+$/;

export default function NewEmployee({ onCancel, onSave }) {
  const [form, setForm] = useState({
    nombre: '', apellido: '', identificacion: '',
    cargo: '', departamento: '',
    fechaIngreso: '', fechaSalida: '', activo: true,
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  // ====== Persistencia de vista + borrador ======
  useEffect(() => {
    // marca que la última vista del admin es "new"
    persistAdminView('new');

    // intenta leer borrador previo
    const draft = readNewEmployeeDraft();
    if (draft && typeof draft === 'object') {
      setForm(f => ({ ...f, ...draft }));
    }

    // limpieza opcional si quisieras: al desmontar mantener o limpiar
    // return () => { /* si quieres limpiar la marca de vista aquí, descomenta: clearAdminView(); */ };
  }, []);

  // guarda borrador ante cualquier cambio
  useEffect(() => {
    persistNewEmployeeDraft(form);
  }, [form]);

  const setField = (k, v) => {
    let value = v;
    if (['nombre','apellido','cargo','departamento'].includes(k)) {
      value = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
    }
    if (k === 'identificacion') value = value.replace(/\D/g, '');
    setForm(p => ({ ...p, [k]: value }));
  };

  const onBlur = (k) => setTouched(p => ({ ...p, [k]: true }));

  const errors = useMemo(() => {
    const e = {};
    const onlyLetters = (s) => LETTERS_REGEX.test(s.trim());
    const onlyDigits  = (s) => DIGITS_REGEX.test(s.trim());

    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio.'; 
    else if (!onlyLetters(form.nombre)) e.nombre = 'Solo letras y espacios.';

    if (!form.apellido.trim()) e.apellido = 'El apellido es obligatorio.'; 
    else if (!onlyLetters(form.apellido)) e.apellido = 'Solo letras y espacios.';

    if (!form.identificacion.trim()) e.identificacion = 'La identificación es obligatoria.';
    else if (!onlyDigits(form.identificacion)) e.identificacion = 'Solo números.';
    else if (form.identificacion.length < 6) e.identificacion = 'Mínimo 6 dígitos.';

    if (!form.cargo.trim()) e.cargo = 'El cargo es obligatorio.';
    else if (!onlyLetters(form.cargo)) e.cargo = 'Solo letras y espacios.';

    if (!form.departamento.trim()) e.departamento = 'El departamento es obligatorio.';
    else if (!onlyLetters(form.departamento)) e.departamento = 'Solo letras y espacios.';

    if (form.fechaIngreso && form.fechaSalida) {
      if (new Date(form.fechaSalida) < new Date(form.fechaIngreso)) {
        e.fechaSalida = 'No puede ser anterior a la de ingreso.';
      }
    }
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      nombre:true, apellido:true, identificacion:true,
      cargo:true, departamento:true, fechaIngreso:true, fechaSalida:true
    });
    setErrMsg(''); setOkMsg('');
    if (!isValid) return;

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        fechaIngreso: form.fechaIngreso || null,
        fechaSalida: form.fechaSalida || null,
      };
      await createEmployee(payload);
      setOkMsg('Empleado registrado correctamente.');
      // limpiar borrador y marca de vista
      clearNewEmployeeDraft();
      // Opcional: clearAdminView(); // si quieres borrar la última vista
      onSave?.(payload);
    } catch (err) {
      setErrMsg(err?.message || 'Error al registrar empleado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // si cancelas, puedes limpiar el borrador (o dejarlo si prefieres)
    clearNewEmployeeDraft();
    // Opcional: clearAdminView();
    onCancel?.();
  };

  return (
    <>
      <div className="ne-page">
        {/* Encabezado fijo */}
        <header className="ne-topbar">
          <div className="ne-brand">
            <span className="ne-dot" />
            <div>
              <div className="ne-brand-title">ROOM_911</div>
              <div className="ne-brand-sub">Employee Portal</div>
            </div>
          </div>
          <h2 className="ne-top-title">Registrar Empleado</h2>
          {/* Si quieres un botón de salir arriba, descomenta: 
          <button type="button" className="ne-btn ne-btn-danger" onClick={handleCancel}>
            Cerrar
          </button> 
          */}
        </header>

        <main className="ne-main">
          {/* Requisitos */}
          <section className="ne-card ne-card--full">
            <h3 className="ne-card-title">Requisitos para registrar</h3>
            <ul className="ne-list">
              <li><b>Nombre y Apellido:</b> obligatorios, solo letras (se permiten tildes) y espacios.</li>
              <li><b>Identificación:</b> obligatoria, solo números (mínimo 6 dígitos).</li>
              <li><b>Cargo y Departamento:</b> obligatorios, solo letras y espacios.</li>
              <li><b>Fechas:</b> formato <code>AAAA-MM-DD</code>. La salida no puede ser anterior a la de ingreso.</li>
            </ul>
          </section>

          {/* Formulario */}
          <form className="ne-card" onSubmit={handleSubmit} noValidate>
            <div className="ne-grid">
              {/* fila 1 */}
              <div className="ne-field">
                <label className="ne-label">Nombre *</label>
                <input
                  className={`ne-input ${touched.nombre && errors.nombre ? 'is-invalid' : ''}`}
                  type="text" value={form.nombre}
                  onChange={(e)=>setField('nombre', e.target.value)}
                  onBlur={()=>onBlur('nombre')} placeholder="Ej: María" maxLength={15} autoComplete="off"
                />
                {touched.nombre && errors.nombre && <small className="ne-help ne-help--err">{errors.nombre}</small>}
              </div>

              <div className="ne-field">
                <label className="ne-label">Apellido *</label>
                <input
                  className={`ne-input ${touched.apellido && errors.apellido ? 'is-invalid' : ''}`}
                  type="text" value={form.apellido}
                  onChange={(e)=>setField('apellido', e.target.value)}
                  onBlur={()=>onBlur('apellido')} placeholder="Ej: Pérez" maxLength={15} autoComplete="off"
                />
                {touched.apellido && errors.apellido && <small className="ne-help ne-help--err">{errors.apellido}</small>}
              </div>

              {/* fila 2 */}
              <div className="ne-field">
                <label className="ne-label">Identificación *</label>
                <input
                  className={`ne-input ${touched.identificacion && errors.identificacion ? 'is-invalid' : ''}`}
                  type="text" value={form.identificacion}
                  onChange={(e)=>setField('identificacion', e.target.value)}
                  onBlur={()=>onBlur('identificacion')} inputMode="numeric"
                  placeholder="Solo números" maxLength={10} autoComplete="off"
                />
                {touched.identificacion && errors.identificacion && <small className="ne-help ne-help--err">{errors.identificacion}</small>}
              </div>

              <div className="ne-field">
                <label className="ne-label">Cargo *</label>
                <input
                  className={`ne-input ${touched.cargo && errors.cargo ? 'is-invalid' : ''}`}
                  type="text" value={form.cargo}
                  onChange={(e)=>setField('cargo', e.target.value)}
                  onBlur={()=>onBlur('cargo')} placeholder="Ej: Analista" maxLength={40} autoComplete="off"
                />
                {touched.cargo && errors.cargo && <small className="ne-help ne-help--err">{errors.cargo}</small>}
              </div>

              {/* fila 3 */}
              <div className="ne-field">
                <label className="ne-label">Departamento *</label>
                <input
                  className={`ne-input ${touched.departamento && errors.departamento ? 'is-invalid' : ''}`}
                  type="text" value={form.departamento}
                  onChange={(e)=>setField('departamento', e.target.value)}
                  onBlur={()=>onBlur('departamento')} placeholder="Ej: Tecnología" maxLength={20} autoComplete="off"
                />
                {touched.departamento && errors.departamento && <small className="ne-help ne-help--err">{errors.departamento}</small>}
              </div>

              <div className="ne-field">
                <label className="ne-label">Fecha de contratación</label>
                <input
                  className="ne-input" type="date"
                  value={form.fechaIngreso}
                  onChange={(e)=>setField('fechaIngreso', e.target.value)}
                  onBlur={()=>onBlur('fechaIngreso')}
                />
              </div>

              {/* fila 4 */}
              <div className="ne-field">
                <label className="ne-label">Finalización de contratación</label>
                <input
                  className={`ne-input ${touched.fechaSalida && errors.fechaSalida ? 'is-invalid' : ''}`}
                  type="date" value={form.fechaSalida}
                  onChange={(e)=>setField('fechaSalida', e.target.value)}
                  onBlur={()=>onBlur('fechaSalida')}
                />
                {touched.fechaSalida && errors.fechaSalida && <small className="ne-help ne-help--err">{errors.fechaSalida}</small>}
              </div>

              <div className="ne-field ne-field--inline">
                <input
                  id="activo" type="checkbox" checked={form.activo}
                  onChange={(e)=>setField('activo', e.target.checked)}
                />
                <label htmlFor="activo" className="ne-label ne-label--inline">Activo (acceso habilitado)</label>
              </div>
            </div>

            {/* mensajes */}
            {errMsg && <div className="ne-alert ne-alert--err" role="alert">{errMsg}</div>}
            {okMsg &&  <div className="ne-alert ne-alert--ok">{okMsg}</div>}

            {/* acciones */}
            <div className="ne-actions">
              <button type="button" className="ne-btn ne-btn-secondary" onClick={handleCancel} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="ne-btn ne-btn-primary" disabled={!isValid || submitting}>
                {submitting ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* ===== CSS integrado ===== */}
      <style>{`
:root{
  --bg:#f3f4f6; --card:#fff; --text:#111827; --muted:#374151;
  --line:#e5e7eb; --accent:#162a53; --accent-2:#0f1b34;
  --ok:#16a34a; --ok-100:#e8f6ee; --ok-300:#ccead8;
  --err:#b91c1c; --err-100:#fee2e2; --err-300:#fecaca;
}
*{box-sizing:border-box}
.ne-page{min-height:100vh;background:var(--bg);font-family:system-ui,Segoe UI,Roboto,Ubuntu,sans-serif;}

.ne-topbar{
  position:sticky;top:0;z-index:10;display:grid;grid-template-columns:1fr auto auto;align-items:center;
  gap:12px;padding:12px 16px;background:#0b0b0b;color:#fff;border-bottom:1px solid #000;
}
.ne-brand{display:inline-flex;align-items:center;gap:10px}
.ne-dot{width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.25)}
.ne-brand-title{font-weight:800;font-size:14px;line-height:1}
.ne-brand-sub{font-size:11px;opacity:.85;line-height:1.1}
.ne-top-title{margin:0;font-size:16px;font-weight:700}
.ne-main{max-width:1040px;margin:0 auto;padding:16px}

.ne-card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 26px rgba(0,0,0,.06);padding:16px}
.ne-card--full{margin-bottom:14px}
.ne-card-title{margin:0 0 8px;font-size:18px;font-weight:800;color:var(--text)}
.ne-list{margin:0;padding-left:18px;color:var(--muted)}
.ne-list li{margin:6px 0}

.ne-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (max-width:760px){.ne-grid{grid-template-columns:1fr}}

.ne-field{display:flex;flex-direction:column}
.ne-field--inline{display:flex;align-items:center;gap:10px}
.ne-label{font-weight:700;color:var(--muted);margin-bottom:6px}
.ne-label--inline{margin:0}
.ne-input{
  width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:#f9fafb;
  font-size:14px;transition:border-color .15s, box-shadow .15s;
}
.ne-input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 2px rgba(22,42,83,.18)}
.is-invalid{border-color:var(--err)!important;box-shadow:0 0 0 2px rgba(185,28,28,.12)}

.ne-help{margin-top:6px;font-size:12px}
.ne-help--err{color:var(--err);background:var(--err-100);border:1px solid var(--err-300);padding:6px 8px;border-radius:8px}

.ne-alert{margin-top:12px;padding:10px 12px;border-radius:10px;font-size:14px}
.ne-alert--ok{color:#166534;background:var(--ok-100);border:1px solid var(--ok-300)}
.ne-alert--err{color:var(--err);background:var(--err-100);border:1px solid var(--err-300)}

.ne-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}
.ne-btn{padding:10px 16px;border-radius:10px;border:1px solid transparent;cursor:pointer;font-weight:800;transition:transform .08s, filter .2s, background .2s}
.ne-btn-primary{color:#fff;background:linear-gradient(90deg,var(--accent),var(--accent-2));box-shadow:0 8px 18px rgba(22,42,83,.25)}
.ne-btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none}
.ne-btn-primary:hover:not(:disabled){transform:translateY(-1px)}
.ne-btn-secondary{background:#e5e7eb;color:#111827;border:1px solid var(--line)}
.ne-btn-secondary:hover{background:#d1d5db}
.ne-btn-danger{background:#ef4444;color:#fff;border:1px solid #ef4444}
.ne-btn-danger:hover{filter:brightness(1.05)}
      `}</style>
    </>
  );
}
