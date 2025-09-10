// NewEmployee.jsx
import React, { useMemo, useState } from 'react';
import { createEmployee } from '../api';
import styles from './RegisterShiftForm.module.css'; // o tu css de formularios

const LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;         // letras + tildes + espacios
const DIGITS_REGEX  = /^\d+$/;

export default function NewEmployee({ onCancel, onSave }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    identificacion: '',
    cargo: '',
    departamento: '',
    fechaIngreso: '',
    fechaSalida: '',
    activo: true,
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  // Helpers “limpieza”/restricciones de entrada
  const setField = (k, v) => {
    let value = v;

    if (k === 'nombre' || k === 'apellido' || k === 'cargo' || k === 'departamento') {
      value = value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '');
    }
    if (k === 'identificacion') {
      value = value.replace(/\D/g, '');
    }
    setForm(prev => ({ ...prev, [k]: value }));
  };

  // Validación
  const errors = useMemo(() => {
    const e = {};

    if (!form.nombre.trim()) {
      e.nombre = 'El nombre es obligatorio.';
    } else if (!LETTERS_REGEX.test(form.nombre.trim())) {
      e.nombre = 'El nombre solo puede contener letras y espacios.';
    }

    if (!form.apellido.trim()) {
      e.apellido = 'El apellido es obligatorio.';
    } else if (!LETTERS_REGEX.test(form.apellido.trim())) {
      e.apellido = 'El apellido solo puede contener letras y espacios.';
    }

    if (!form.identificacion.trim()) {
      e.identificacion = 'La identificación es obligatoria.';
    } else if (!DIGITS_REGEX.test(form.identificacion.trim())) {
      e.identificacion = 'La identificación debe contener solo números.';
    } else if (form.identificacion.length < 6) {
      e.identificacion = 'Mínimo 6 dígitos.';
    }

    if (!form.cargo.trim()) {
      e.cargo = 'El cargo es obligatorio.';
    } else if (!LETTERS_REGEX.test(form.cargo.trim())) {
      e.cargo = 'El cargo solo puede contener letras y espacios.';
    }

    if (!form.departamento.trim()) {
      e.departamento = 'El departamento es obligatorio.';
    } else if (!LETTERS_REGEX.test(form.departamento.trim())) {
      e.departamento = 'El departamento solo puede contener letras y espacios.';
    }

    if (form.fechaIngreso && form.fechaSalida) {
      const fi = new Date(form.fechaIngreso);
      const fs = new Date(form.fechaSalida);
      if (fs < fi) e.fechaSalida = 'La fecha de salida no puede ser anterior a la de ingreso.';
    }

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      nombre: true, apellido: true, identificacion: true,
      cargo: true, departamento: true, fechaIngreso: true, fechaSalida: true
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
      onSave?.(payload);
    } catch (err) {
      setErrMsg(err?.message || 'Error al registrar empleado.');
    } finally {
      setSubmitting(false);
    }
  };

  const onBlur = (key) => setTouched(prev => ({ ...prev, [key]: true }));

  return (
    <div className={styles.pageWrap}>
      <header className={styles.topBarFixed}>
        <div className={styles.brandWrap}>
          <span className={styles.brandDotSm} />
          <div>
            <div className={styles.brandTitleSm}>ROOM_911</div>
            <div className={styles.brandSubSm}>Employee Portal</div>
          </div>
        </div>
        <h2 className={styles.headerTitle}>Registrar Empleado</h2>
        <button type="button" className={styles.logoutBtn} onClick={onCancel}>
          Cerrar
        </button>
      </header>

      <main className={styles.main}>
        {/* Panel de requisitos */}
        <section className={styles.cardFull}>
          <h3 className={styles.cardTitle}>Requisitos para registrar</h3>
          <ul className={styles.list}>
            <li><b>Nombre y Apellido:</b> obligatorios, solo letras (se permiten tildes) y espacios.</li>
            <li><b>Identificación:</b> obligatoria, solo números (mínimo 6 dígitos).</li>
            <li><b>Cargo y Departamento:</b> obligatorios, solo letras y espacios.</li>
            <li><b>Fechas:</b> formato <code>AAAA-MM-DD</code>. La salida no puede ser anterior a la de ingreso.</li>
          </ul>
        </section>

        {/* Formulario */}
        <form className={styles.card} onSubmit={handleSubmit} noValidate>
          <div className={styles.gridTwo}>
            <div>
              <label className={styles.label}>Nombre *</label>
              <input
                className={styles.input}
                type="text"
                value={form.nombre}
                onChange={(e) => setField('nombre', e.target.value)}
                onBlur={() => onBlur('nombre')}
                placeholder="Ej: María"
                autoComplete="off"
                maxLength={15}
              />
              {touched.nombre && errors.nombre && <div className={styles.errorMsg}>{errors.nombre}</div>}
            </div>

            <div>
              <label className={styles.label}>Apellido *</label>
              <input
                className={styles.input}
                type="text"
                value={form.apellido}
                onChange={(e) => setField('apellido', e.target.value)}
                onBlur={() => onBlur('apellido')}
                placeholder="Ej: Pérez"
                autoComplete="off"
                maxLength={15}
              />
              {touched.apellido && errors.apellido && <div className={styles.errorMsg}>{errors.apellido}</div>}
            </div>

            <div>
              <label className={styles.label}>Identificación *</label>
              <input
                className={styles.input}
                type="text"
                value={form.identificacion}
                onChange={(e) => setField('identificacion', e.target.value)}
                onBlur={() => onBlur('identificacion')}
                placeholder="Solo números"
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
              />
              {touched.identificacion && errors.identificacion && <div className={styles.errorMsg}>{errors.identificacion}</div>}
            </div>

            <div>
              <label className={styles.label}>Cargo *</label>
              <input
                className={styles.input}
                type="text"
                value={form.cargo}
                onChange={(e) => setField('cargo', e.target.value)}
                onBlur={() => onBlur('cargo')}
                placeholder="Ej: Analista"
                autoComplete="off"
                maxLength={40}
              />
              {touched.cargo && errors.cargo && <div className={styles.errorMsg}>{errors.cargo}</div>}
            </div>

            <div>
              <label className={styles.label}>Departamento *</label>
              <input
                className={styles.input}
                type="text"
                value={form.departamento}
                onChange={(e) => setField('departamento', e.target.value)}
                onBlur={() => onBlur('departamento')}
                placeholder="Ej: Tecnología"
                autoComplete="off"
                maxLength={20}
              />
              {touched.departamento && errors.departamento && <div className={styles.errorMsg}>{errors.departamento}</div>}
            </div>

            <div>
              <label className={styles.label}>Fecha de contratación</label>
              <input
                className={styles.input}
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => setField('fechaIngreso', e.target.value)}
                onBlur={() => onBlur('fechaIngreso')}
              />
            </div>

            <div>
              <label className={styles.label}>Finalización de contratación</label>
              <input
                className={styles.input}
                type="date"
                value={form.fechaSalida}
                onChange={(e) => setField('fechaSalida', e.target.value)}
                onBlur={() => onBlur('fechaSalida')}
              />
              {touched.fechaSalida && errors.fechaSalida && <div className={styles.errorMsg}>{errors.fechaSalida}</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setField('activo', e.target.checked)}
              />
              <label htmlFor="activo" className={styles.label} style={{ margin: 0 }}>Activo (acceso habilitado)</label>
            </div>
          </div>

          {errMsg && <div className={styles.errorMsg} style={{ marginTop: 12 }}>{errMsg}</div>}
          {okMsg && <div className={styles.successMsg} style={{ marginTop: 12 }}>{okMsg}</div>}

          <div className={styles.actions} style={{ marginTop: 14 }}>
            <button type="button" className={styles.secondaryBtn} onClick={onCancel} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={!isValid || submitting}>
              {submitting ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
