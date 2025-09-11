import React, { useEffect, useState } from 'react';

export default function EditEmployee({ employee, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({
    id: '',
    identificacion: '',
    nombre: '',
    apellido: '',
    cargo: '',
    departamento: '',
    activo: true,
  });

  // responsive: 2 cols (>=720px) / 1 col (<720px)
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 720);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 720);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (employee) {
      setForm({
        id: employee.id ?? '',
        identificacion: employee.identificacion ?? '',
        nombre: employee.nombre ?? '',
        apellido: employee.apellido ?? '',
        cargo: employee.cargo ?? '',
        departamento: employee.departamento ?? '',
        activo: typeof employee.activo === 'boolean' ? employee.activo : true,
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.identificacion || !form.nombre || !form.apellido || !form.cargo || !form.departamento) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }
    onSave?.(form);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm(`¿Seguro que deseas eliminar a ${form.nombre} ${form.apellido}? Esta acción no se puede deshacer.`)) {
      onDelete(form.id);
    }
  };

  // ===== Estilos inline =====
  const styles = {
    wrapper: {
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      padding: 16,
      maxWidth: 900,
      margin: '0 auto',
    },
    header: {
      margin: '0 0 12px 0',
      fontSize: 18,
      fontWeight: 700,
      color: '#111827',
    },
    form: {
      display: 'grid',
      gap: 12,
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
      gap: 12,
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    label: {
      fontSize: 13,
      fontWeight: 600,
      color: '#374151',
    },
    input: {
      height: 36,
      padding: '8px 10px',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      background: '#f9fafb',
      fontSize: 14,
      transition: 'border-color .15s, box-shadow .15s',
    },
    inputReadOnly: {
      background: '#f3f4f6',
      color: '#6b7280',
    },
    inputFocus: {
      outline: 'none',
      borderColor: '#2563eb',
      boxShadow: '0 0 0 2px rgba(37,99,235,0.18)',
    },
    switchRow: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      margin: '6px 0 4px 0',
      userSelect: 'none',
    },
    checkbox: {
      width: 18,
      height: 18,
      accentColor: '#16a34a',
    },
    switchText: {
      fontSize: 14,
      color: '#111827',
    },
    actions: {
      marginTop: 8,
      display: 'flex',
      gap: 10,
      justifyContent: 'flex-end',
    },
    btn: {
      padding: '9px 14px',
      border: 'none',
      borderRadius: 8,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'background-color .2s, opacity .2s',
    },
    primary: { background: '#2563eb', color: '#fff' },
    primaryHover: { background: '#1d4ed8' },
    secondary: { background: '#e5e7eb', color: '#111827' },
    secondaryHover: { background: '#d1d5db' },
    danger: { background: '#dc2626', color: '#fff' },
    dangerHover: { background: '#b91c1c' },
    help: { fontSize: 12, color: '#6b7280', marginTop: -2 },
  };

  // pequeño helper para focus (React inline no tiene :focus)
  const onFocus = (e) => Object.assign(e.target.style, styles.inputFocus);
  const onBlurStyle = (e) => {
    // restablece a input base (conservar readonly si aplica)
    Object.assign(e.target.style, styles.input, e.target.readOnly ? styles.inputReadOnly : null);
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.header}>Editar empleado</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* fila 1 */}
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Identificación *</label>
            <input
              style={styles.input}
              name="identificacion"
              type="text"
              value={form.identificacion}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlurStyle}
              required
            />
            <div style={styles.help}>Debe ser única.</div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>ID (solo lectura)</label>
            <input
              style={{ ...styles.input, ...styles.inputReadOnly }}
              value={form.id}
              readOnly
              onFocus={onFocus}
              onBlur={onBlurStyle}
            />
          </div>
        </div>

        {/* fila 2 */}
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Nombre *</label>
            <input
              style={styles.input}
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlurStyle}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Apellido *</label>
            <input
              style={styles.input}
              name="apellido"
              type="text"
              value={form.apellido}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlurStyle}
              required
            />
          </div>
        </div>

        {/* fila 3 */}
        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Cargo *</label>
            <input
              style={styles.input}
              name="cargo"
              type="text"
              value={form.cargo}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlurStyle}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Departamento *</label>
            <input
              style={styles.input}
              name="departamento"
              type="text"
              value={form.departamento}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlurStyle}
              required
            />
          </div>
        </div>

        {/* acceso */}
        <label style={styles.switchRow}>
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
            style={styles.checkbox}
          />
          <span style={styles.switchText}>
            {form.activo ? 'Acceso habilitado' : 'Acceso deshabilitado'}
          </span>
        </label>

        {/* acciones */}
        <div style={styles.actions}>
          {onDelete && (
            <button
              type="button"
              style={{ ...styles.btn, ...styles.danger }}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.dangerHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.danger)}
              onClick={handleDelete}
            >
              Eliminar
            </button>
          )}

          <button
            type="button"
            style={{ ...styles.btn, ...styles.secondary }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.secondaryHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.secondary)}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="submit"
            style={{ ...styles.btn, ...styles.primary }}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.primaryHover)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.btn, styles.primary)}
          >
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
