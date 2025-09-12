// src/App.jsx
import React, { useEffect, useState } from 'react';
import Login from './components/Auth/login';
import EmployeeList from './components/Employees/EmployeeList';
import NewEmployee from './components/Employees/NewEmployee';
import RegisterShiftForm from './components/Employees/RegisterEmployeeForm';
import ShiftList from './components/Shifts/ShiftList';
import EditEmployee from './components/Employees/EditEmployee';
import EmployeeShiftHistory from './components/Shifts/EmployeeShiftHistory';
import Reports from './components/Reports/Reports';
import {
  createEmployee,
  updateEmployee,
  readKioskSession,
  persistKioskSession,
  clearKioskSession,
} from './api';
import './App.css';

export default function App() {
  // Sesión admin { correo, rol } (persistida en localStorage por Login)
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const isLoggedIn = !!user;
  const isAdmin = user?.rol === 'ADMIN';

  // Vistas del panel admin (⬅️ ahora se lee desde localStorage y se persiste)
  const [view, setView] = useState(() => {
    return localStorage.getItem('view') || 'list'; // 'list', 'new', 'registerShift', 'shiftList', 'edit', 'employeeShiftHistory', 'reports'
  });
  useEffect(() => {
    localStorage.setItem('view', view);
  }, [view]);

  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [employeeIdForHistory, setEmployeeIdForHistory] = useState(null);

  // Para refrescar la lista tras agregar/editar
  const [refreshList, setRefreshList] = useState(false);

  // === MODO KIOSKO: restaurar desde localStorage al arrancar ===
  const [kioskMode, setKioskMode] = useState(() => readKioskSession().enabled);
  const [kioskEmpId, setKioskEmpId] = useState(() => readKioskSession().employeeId);

  // Sincronizar si cambia localStorage desde otra pestaña
  useEffect(() => {
    const onStorage = () => {
      const raw = localStorage.getItem('user');
      setUser(raw ? JSON.parse(raw) : null);

      const k = readKioskSession();
      setKioskMode(k.enabled);
      setKioskEmpId(k.employeeId);

      // también sincronizamos la vista si alguien la cambió en otra pestaña
      const v = localStorage.getItem('view') || 'list';
      setView(v);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Handler de login (admin): recibe { correo, rol } desde <Login />
  const handleLogin = (data) => {
    setUser(data);   // data = { correo, rol }
    // salir de kiosko si estuviera activo
    clearKioskSession();
    setKioskMode(false);
    setKioskEmpId(null);
    setView('list');
  };

  // Handler de login por ID (kiosko)
  const handleKioskLogin = (id) => {
    persistKioskSession(id); // ← guarda en localStorage
    setKioskMode(true);
    setKioskEmpId(id);
    setView('registerShift'); // vamos directo a Registrar Turno
  };

  // Salir del kiosko (empleado)
  const leaveKiosk = () => {
    clearKioskSession();
    setKioskMode(false);
    setKioskEmpId(null);
    setView('list');
  };

  // Handler de logout (admin)
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('view'); // ⬅️ limpiar la vista persistida al cerrar sesión
    setUser(null);
    // también aseguramos salir de kiosko si estaba activo
    leaveKiosk();
    setEmployeeToEdit(null);
    setEmployeeIdForHistory(null);
  };

  // ======= Rutas públicas (no logueado NI kiosko) =======
  if (!isLoggedIn && !kioskMode) {
    return <Login onLogin={handleLogin} onKioskLogin={handleKioskLogin} />;
  }

  // ======= Modo KIOSKO (sin rol, solo registrar turno) =======
  if (kioskMode) {
    return (
      <div className="app-container" style={{ padding: 16 }}>
        <RegisterShiftForm
          initialEmployeeId={kioskEmpId}        // auto-busca al entrar
          onExit={leaveKiosk}                   // botón "Cerrar Sesión" dentro del formulario
          onCancel={leaveKiosk}                 // si cancelas, también sales del kiosko
          onSave={() => { /* puedes quedarte en la misma vista */ }}
        />
      </div>
    );
  }

  // ======= Logueado y NO admin: bloquea panel =======
  if (!isAdmin) {
    return (
      <div className="app-container" style={{ padding: 24 }}>
        <h2>No tienes permiso para ver esta sección</h2>
        <p>
          Iniciaste sesión como <b>{user?.correo}</b> con rol <b>{user?.rol}</b>.
        </p>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    );
  }

  // ======= Panel ADMIN =======
  return (
    <div className="app-container">
      {view === 'list' && (
        <EmployeeList
          onLogout={handleLogout}
          onCreateNew={() => setView('new')}
          onRegisterShift={() => { clearKioskSession(); setKioskMode(false); setKioskEmpId(null); setView('registerShift'); }}
          onViewShifts={() => setView('shiftList')}
          onEditEmployee={(employee) => { setEmployeeToEdit(employee); setView('edit'); }}
          onViewEmployeeHistory={(id) => { setEmployeeIdForHistory(id); setView('employeeShiftHistory'); }}
          onGenerateReports={() => setView('reports')}
          refresh={refreshList}
          setRefresh={setRefreshList}
        />
      )}

      {view === 'new' && (
        <NewEmployee
          onCancel={() => setView('list')}
          onSave={async (employeeData) => {
            try {
              await createEmployee(employeeData);
              setView('list');
              setRefreshList((r) => !r);
            } catch (error) {
              console.error('Error saving employee:', error);
              alert('Error al guardar empleado. Por favor, inténtalo de nuevo.');
            }
          }}
        />
      )}

      {view === 'edit' && (
        <EditEmployee
          employee={employeeToEdit}
          onCancel={() => { setEmployeeToEdit(null); setView('list'); }}
          onSave={async (updatedEmployeeData) => {
            try {
              await updateEmployee(updatedEmployeeData);
              setEmployeeToEdit(null);
              setView('list');
              setRefreshList((r) => !r);
            } catch (error) {
              console.error('Error updating employee:', error);
              alert('Error al actualizar empleado. Por favor, inténtalo de nuevo.');
            }
          }}
        />
      )}

      {view === 'registerShift' && (
        <RegisterShiftForm
          initialEmployeeId={kioskEmpId}  // también funciona desde admin si quieres precargar
          onCancel={() => setView('list')}
          onSave={() => { setView('list'); }}
        />
      )}

      {view === 'shiftList' && <ShiftList onBack={() => setView('list')} />}

      {view === 'employeeShiftHistory' && (
        <EmployeeShiftHistory
          employeeId={employeeIdForHistory}
          onBack={() => { setEmployeeIdForHistory(null); setView('list'); }}
        />
      )}

      {view === 'reports' && <Reports onBack={() => setView('list')} />}
    </div>
  );
}
