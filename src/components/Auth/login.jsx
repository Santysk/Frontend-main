// src/components/Employees/login.jsx
import React, { useState, useMemo } from 'react';
import { fetchEmployeeById } from '../../api';
//import { fetchEmployeeById, persistKioskSession } from '../../api';

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

      // ✅ NUEVO: guardamos el ID para el kiosko
      localStorage.setItem('kioskEmployeeId', String(idNum));

      // si tu App cambia de vista con estado:
      onKioskLogin?.(idNum);
       persistKioskSession(idNum);      // 👈 PERSISTE sesion kiosko

      // o si quieres navegar a otra página sin router:
      // window.location.href = '/kiosk';
    } catch (err) {
      console.error(err);
      setKioskErr('Error al verificar acceso del empleado.');
    } finally {
      setLoadingKiosk(false);
    }
  };

  return (
    <>
      <div className="page">
        <div className="loginBackground" />

        <div className="loginContainer centerFixed">
          {/* Header */}
          <div className="loginHeader">
            <img src="/img/Logo2.png" alt="Laboratorio" className="headerLogo" />
            <h1 className="headerTitle">ROOM_911</h1>
            <p className="headerSubtitle">
              Acceso del administrador o empleado
            </p>
          </div>

          {/* Tabs */}
          <div className="segmented">
            <button
              type="button"
              className={`segBtn ${tab === 'admin' ? 'active' : ''}`}
              onClick={() => setTab('admin')}
            >
              Administrador
            </button>
            <button
              type="button"
              className={`segBtn ${tab === 'employee' ? 'active' : ''}`}
              onClick={() => setTab('employee')}
            >
              Empleado
            </button>
          </div>

          {/* Body */}
          <div className="loginBody">
            {/* --- Login Admin --- */}
            {tab === 'admin' && (
              <form className="loginForm" onSubmit={handleSubmit}>
                <input
                  type="email"
                  placeholder="Correo"
                  className="loginInput"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                  autoComplete="username"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="loginInput"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className="loginButton"
                  disabled={!isValid || loading}
                >
                  {loading ? 'Ingresando…' : 'Ingresar'}
                </button>
                {error && <p className="loginError">{error}</p>}
              </form>
            )}

            {/* --- Login Kiosko --- */}
            {tab === 'employee' && (
              <form className="loginForm" onSubmit={handleKiosk}>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="ID de empleado"
                  className="loginInput"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                />
                <button
                  type="submit"
                  className="loginButton"
                  disabled={loadingKiosk}
                >
                  {loadingKiosk ? 'Verificando…' : 'Continuar'}
                </button>
                {kioskErr && <p className="loginError">{kioskErr}</p>}
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ===== CSS integrado ===== */}
      <style>{`
/* Fondo y centrado */
.page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.loginBackground {
  position: fixed;
  inset: 0;
  background: url('/img/Fondo4.jpeg') no-repeat center center / cover;
  z-index: -1;
  filter: blur(6px);
  transform: scale(1.05);
}

.loginBackground::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}

/* Card */
.loginContainer {
  width: 95%;
  max-width: 640px;
  border-radius: 25px;
  box-shadow: 0 16px 44px rgba(0,0,0,.28);
  border: 1px solid rgba(0,0,0,.12);
  overflow: hidden;
}

/* Posición centrada */
.centerFixed {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* HEADER */
.loginHeader {
  padding: 28px 22px 22px;
  background: linear-gradient(135deg, #0b0b0b 0%, #111 45%, #0b7a35 100%);
  color: #fff;
  text-align: center;
  border-top-left-radius: 25px;
  border-top-right-radius: 25px;
}
.headerLogo {
  width: 44px;
  height: 44px;
  object-fit: contain;
  margin-bottom: 10px;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.35));
}
.headerTitle {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: .3px;
}
.headerSubtitle {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: .8;
}

/* Pestañas (Administrador / Empleado) */
.segmented {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 12px 18px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}
.segBtn {
  flex: 1;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  background: #e5e7eb;
  color: #374151;
  transition: all .2s ease;
  appearance: none;
}
.segBtn:hover {
  background: #d1d5db;
}
.segBtn.active {
  background: linear-gradient(90deg, #059669, #047857);
  color: white;
  box-shadow: 0 2px 6px rgba(0,0,0,.2);
}

/* BODY */
.loginBody {
  background: #ffffff;
  padding: 32px 90px;
  color: #111;
  border-bottom-left-radius: 25px;
  border-bottom-right-radius: 25px;
}

/* Formulario */
.loginForm {
  display: grid;
  gap: 14px;
}

/* Inputs */
.loginInput {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  border-radius: 12px;
  border: 1.5px solid #0b0b0b;
}
.loginInput::placeholder { color: #64748b; }
.loginInput:focus {
  outline: none;
  border-color: #0b7a35;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

/* Botón */
.loginButton {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 14px 0px;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(90deg, #ff1100 0%, #ff0000 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.15),
              0 6px 16px rgba(0,0,0,.15);
  cursor: pointer;
  transition: transform .12s ease, box-shadow .2s ease, filter .2s ease;
}
.loginButton:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.2),
              0 10px 24px rgba(0,0,0,.22);
}
.loginButton:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);
}

/* Error */
.loginError {
  margin-top: 10px;
  color: #b91c1c;
  background: #fee2e2;
  border: 1px solid #fecaca;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
}

/* Responsivo */
@media (max-width: 480px) {
  .loginContainer { max-width: 94%; }
  .loginBody { padding: 24px; }
}
      `}</style>
    </>
  );
}
