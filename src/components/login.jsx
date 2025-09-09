import React, { useState, useMemo } from 'react';
import styles from './login.module.css';
import { fetchEmployeeById } from '../api';

export default function Login({ onLogin, onKioskLogin }) {
  const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

  // pestañas
  const [tab, setTab] = useState('admin'); // "admin" | "employee"

  // --- Admin login ---
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isValid = useMemo(
    () => usuario.trim().length > 0 && contrasena.length > 0,
    [usuario, contrasena]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setError(null);
    setLoading(true);
    try {
      const url =
        `${API_URL}/api/users/login` +
        `?correo=${encodeURIComponent(usuario)}` +
        `&contrasena=${encodeURIComponent(contrasena)}`;

      const resp = await fetch(url, { method: 'GET' });
      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setError(data?.error || 'Usuario o contraseña incorrectos');
        return;
      }

      localStorage.setItem('user', JSON.stringify(data));
      onLogin?.(data);
      window.location.href = data.rol === 'ADMIN' ? '/admin' : '/';
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // --- Kiosko (empleado por ID) ---
  const [empId, setEmpId] = useState('');
  const [kioskErr, setKioskErr] = useState('');
  const [loadingKiosk, setLoadingKiosk] = useState(false);

  const handleKiosk = async (e) => {
    e.preventDefault();
    setKioskErr('');
    const idNum = Number(empId);
    if (!idNum || idNum <= 0) {
      setKioskErr('Ingresa un ID válido.');
      return;
    }

    try {
      setLoadingKiosk(true);
      const emp = await fetchEmployeeById(idNum);
      if (!emp) {
        setKioskErr('Empleado no encontrado.');
        return;
      }
      if (emp.activo === false) {
        setKioskErr('Este empleado no tiene acceso a la plataforma.');
        return;
      }
      // si está activo -> permitir acceso
      onKioskLogin?.(idNum);
    } catch (err) {
      console.error(err);
      setKioskErr('Error al verificar acceso del empleado.');
    } finally {
      setLoadingKiosk(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.loginBackground} />

      <div className={`${styles.loginContainer} ${styles.centerFixed}`}>
        {/* Header */}
        <div className={styles.loginHeader}>
          <img src="/img/Logo2.png" alt="Laboratorio" className={styles.headerLogo} />
          <h1 className={styles.headerTitle}>ROOM_911</h1>
          <p className={styles.headerSubtitle}>
            Acceso del administrador o empleado
          </p>
        </div>

        {/* Tabs */}
        <div className={styles.segmented}>
          <button
            type="button"
            className={`${styles.segBtn} ${tab === 'admin' ? styles.active : ''}`}
            onClick={() => setTab('admin')}
          >
            Administrador
          </button>
          <button
            type="button"
            className={`${styles.segBtn} ${tab === 'employee' ? styles.active : ''}`}
            onClick={() => setTab('employee')}
          >
            Empleado
          </button>
        </div>

        {/* Body */}
        <div className={styles.loginBody}>
          {/* --- Login Admin --- */}
          {tab === 'admin' && (
            <form className={styles.loginForm} onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Correo"
                className={styles.loginInput}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Contraseña"
                className={styles.loginInput}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="submit"
                className={styles.loginButton}
                disabled={!isValid || loading}
              >
                {loading ? 'Ingresando…' : 'Ingresar'}
              </button>
              {error && <p className={styles.loginError}>{error}</p>}
            </form>
          )}

          {/* --- Login Kiosko --- */}
          {tab === 'employee' && (
            <form className={styles.loginForm} onSubmit={handleKiosk}>
              <input
                type="number"
                inputMode="numeric"
                placeholder="ID de empleado"
                className={styles.loginInput}
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
              />
              <button
                type="submit"
                className={styles.loginButton}
                disabled={loadingKiosk}
              >
                {loadingKiosk ? 'Verificando…' : 'Continuar'}
              </button>
              {kioskErr && <p className={styles.loginError}>{kioskErr}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
