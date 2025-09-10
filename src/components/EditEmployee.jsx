import React, { useState, useEffect } from 'react';
import styles from './EditEmployee.module.css';

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

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.header}>Editar empleado</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* fila 1 */}
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Identificación *</label>
            <input
              className={styles.input}
              name="identificacion"
              type="text"
              value={form.identificacion}
              onChange={handleChange}
              required
            />
            <div className={styles.help}>Debe ser única.</div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>ID (solo lectura)</label>
            <input
              className={styles.input}
              value={form.id}
              readOnly
            />
          </div>
        </div>

        {/* fila 2 */}
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre *</label>
            <input
              className={styles.input}
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Apellido *</label>
            <input
              className={styles.input}
              name="apellido"
              type="text"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* fila 3 */}
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Cargo *</label>
            <input
              className={styles.input}
              name="cargo"
              type="text"
              value={form.cargo}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Departamento *</label>
            <input
              className={styles.input}
              name="departamento"
              type="text"
              value={form.departamento}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* acceso */}
        <label className={styles.switchRow}>
          <input
            type="checkbox"
            name="activo"
            checked={form.activo}
            onChange={handleChange}
          />
          <span className={styles.switchText}>
            {form.activo ? 'Acceso habilitado' : 'Acceso deshabilitado'}
          </span>
        </label>

        {/* acciones */}
        <div className={styles.actions}>
          {onDelete && (
            <button type="button" className={`${styles.btn} ${styles.danger}`} onClick={handleDelete}>
              Eliminar
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.secondary}`} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className={`${styles.btn} ${styles.primary}`}>
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
